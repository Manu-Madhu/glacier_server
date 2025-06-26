import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { orderStatusList } from "../config/data.js";
import { phonePeApi } from "../services/pg.service.js";
import { validateEmail } from "../utils/validate.util.js";
import { sendEmail } from "../utils/mailer.util.js";
import { getUserById } from "./user.service.js";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(isoWeek);


const ClientURL = process.env.ClientURL;

export const saveOrder = async (obj) => {
    return await Order.create(obj);
}

export const clearCart = async (userId) => {
    return await User.findByIdAndUpdate(userId, {
        $set: { cart: [] }
    }, { new: true })
}

export const onlinePayment = async (merchantOrderId, user, amount) => {

    const payload = {
        "merchantOrderId": `${merchantOrderId}`,
        "amount": amount * 100,
        "expireAfter": 1200,
        "metaInfo": {
            "name": `${user?.firstName} ${user?.lastName}`,
            "amount": amount,
            "number": user?.mobile,
        },
        "paymentFlow": {
            "type": "PG_CHECKOUT",
            "message": "Payment message used for collect requests",
            "merchantUrls": {
                "redirectUrl": ClientURL
            }
        }
    }

    // Initiate Payment
    const response = await phonePeApi.post("/checkout/v2/pay", payload)
    console.log(response)

    return response;
}


export const checkOrderPayStatusWithPG = async (merchantOrderId) => {
    const response = await phonePeApi.get(`/checkout/v2/order/${merchantOrderId}/status`)

    return response
}

export const updateOrder = async (id, updateObj) => {
    return await Order.findByIdAndUpdate(id, {
        $set: updateObj
    }, { new: true }).lean()
}

export const getOrderByMOId = async (merchantOrderId) => {
    return await Order.findOne({ merchantOrderId }).lean()
}

export const getOrderById = async (id) => {
    return await Order.findById(id)
        .populate("userId", "firstName lastName email mobile")
        .populate("billAddress")
        .populate("shipAddress")
        .lean()
}


export const findManyOrders = async (filters = {}, project = {}) => {
    return await Order.find(filters, project)
        .populate("userId", "firstName lastName email mobile")
        .populate("billAddress")
        .populate("shipAddress")
        .sort({ createdAt: -1 })
}


export const getAllOrders = async ({
    filters = {},
    advancedFilters = {},
    sort = { createdAt: -1 },
    page,
    entries,
} = {}) => {
    const pipeline = [];

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "customer"
            }
        },
        {
            $addFields: {
                customer: {
                    $ifNull: [{ $arrayElemAt: ["$customer", 0] }, null]
                }
            }
        },
    )

    pipeline.push({
        $match: {
            ...filters,
            ...advancedFilters,
        },
    });

    pipeline.push({ $sort: sort });

    if (page && entries) {
        pipeline.push({ $skip: (page - 1) * entries });
        pipeline.push({ $limit: entries })
    }

    return await Order.aggregate(pipeline);
}

export const getOrderCount = async (filters = {}, advancedFilters = {}) => {
    console.log(filters, advancedFilters);

    const pipeline = [];

    pipeline.push({
        $match: {
            ...filters,
            ...advancedFilters,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            count: { $sum: 1 }
        }
    });

    const result = await Order.aggregate(pipeline);
    return result.length > 0 ? result[0].count : 0;
}



export const cancelMyOrder = async (orderId) => {
    return await Order.findByIdAndUpdate(orderId, {
        $set: { status: 'cancelled' }
    }, { new: true }).lean()
}

export const returnMyOrder = async (orderId) => {
    return await Order.findByIdAndUpdate(orderId, {
        $set: { status: 'returned' }
    }, { new: true }).lean()
}

export const countOrders = async (filters = {}) => {
    return await Order.countDocuments(filters)
}

export const orderStatusAndCountHandler = async () => {
    if (!Array.isArray(orderStatusList) || orderStatusList.length === 0) {
        throw new Error("orderStatusList is empty or not an array");
    }

    const dbqueries = orderStatusList.map((item) => (
        Order.countDocuments({ status: item })
    ))

    const countArr = await Promise.all(dbqueries)

    return {
        statuses: orderStatusList,
        counts: countArr
    }
}


export const sendRefundRequestToPhonepe = async (postObj) => {
    const response = await phonePeApi.post("/payments/v2/refund", postObj)

    return response
}

export const fetchRefundStatusFromPhonepe = async (merchantRefundId) => {
    const response = await phonePeApi.get(`/payments/v2/refund/${merchantRefundId}/status`)

    return response
}


export const sendConfirmationMail = async (orderInfo) => {
    const { user, order } = orderInfo;

    if (order?.items?.length <= 0) {
        throw new Error("Order items not found");
    }

    if (validateEmail(user?.email)) {
        const mailObj = {
            from: `"Glacer" <${process.env.MAIL_USER}>`,
            to: user?.email,
            subject: "Your Order Has Been Successfully Placed",
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #2e6c80;">Thank you for shopping with us!</h2>
                <p>Dear Customer,</p>
                <h3>
                    ${`Your order for ${order.items[0]?.name}${order.items.length > 1 ? " + more" : ""} 
                    has been successfully placed.`}
                </h3>
                ${`<p>Amount Paid: ₹${order?.amount ? order.amount : 0}</p>`}
                ${`<p>Delivery Charge: ₹${order?.deliveryCharge ? order.deliveryCharge : 0}</p>`}
                ${`<p>Discount: ₹${order.discount ? order.discount : 0}</p>`}
                ${`<p>Total Tax: ₹${order?.totalTax ? order.totalTax : 0} (inclusive) </p>`}
                <p>We hope you enjoy your purchase.</p>
                <br/>
                <p>Warm regards,</p>
                <p><strong>Glacer</strong></p>
            </div>
            `
        };

        return await sendEmail(mailObj);
    }
};


export const sendOrderUpdateMail = async (order) => {
    const { userId, status } = order;

    const user = await getUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    if (order?.items?.length <= 0) {
        throw new Error("Order items not found");
    }

    if (!orderStatusList.includes(status)) {
        throw new Error("Invalid order status");
    }

    let statusPhrase = "";

    switch (status) {
        case "processing":
            statusPhrase = "is being processed.";
            break;
        case "billed":
            statusPhrase = "has been billed.";
            break;
        case "packed":
            statusPhrase = "has been packed.";
            break;
        case "shipped":
            statusPhrase = "has been shipped.";
            break;
        case "delivered":
            statusPhrase = "has been delivered.";
            break;
        case "cancelled":
            statusPhrase = "has been cancelled.";
            break;
        case "returned":
            statusPhrase = "has been returned.";
            break;
        default:
            statusPhrase = "";
    }

    if (validateEmail(user?.email)) {
        const mailObj = {
            from: `"Glacer" <${process.env.MAIL_USER}>`,
            to: user?.email,
            subject: `Your Order ${statusPhrase}`,
            html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #2e6c80;">Thank you for shopping with us!</h2>
                <p>Dear Customer,</p>
                <h3>
                    ${`Your order for ${order.items[0]?.name}${order.items.length > 1 ? " + more" : ""} 
                    ${statusPhrase}.`}
                </h3>
                <br/>
                <p>Warm regards,</p>
                <p><strong>Glacer</strong></p>
            </div>
            `
        };

        return await sendEmail(mailObj);
    }
};


export const getMonthlySalesChange = async () => {
    const previousMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();

    const result = await Order.aggregate([
        {
            $match: {
                status: "delivered",
                createdAt: { $gte: previousMonthStart }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                totalSales: { $sum: { $toDouble: "$amount" } }
            }
        }
    ]);

    const salesMap = result.reduce((acc, curr) => {
        const key = `${curr._id.year}-${curr._id.month}`;
        acc[key] = curr.totalSales;
        return acc;
    }, {});

    const prevKey = `${dayjs().subtract(1, 'month').year()}-${dayjs().subtract(1, 'month').month() + 1}`;
    const currKey = `${dayjs().year()}-${dayjs().month() + 1}`;

    const prevSales = salesMap[prevKey] || 0;
    const currSales = salesMap[currKey] || 0;

    const percentChange =
        prevSales === 0
            ? (currSales === 0 ? 0 : null)
            : ((currSales - prevSales) / prevSales) * 100;

    return {
        previousMonthSales: prevSales,
        currentMonthSales: currSales,
        percentChange: percentChange !== null ? +percentChange.toFixed(2) : null
    };
};




export const getWeeklyOrdersChange = async () => {
    const twoWeeksAgoStart = dayjs().subtract(2, "week").startOf("isoWeek").toDate();

    const orders = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: twoWeeksAgoStart }
            }
        },
        {
            $group: {
                _id: {
                    $isoWeek: "$createdAt"
                },
                orderCount: { $sum: 1 }
            }
        }
    ]);

    const salesMap = orders.reduce((acc, curr) => {
        acc[curr._id] = curr.orderCount;
        return acc;
    }, {});

    const currentWeek = dayjs().isoWeek();
    const previousWeek = dayjs().subtract(1, "week").isoWeek();

    const currentCount = salesMap[currentWeek] || 0;
    const previousCount = salesMap[previousWeek] || 0;

    console.log({ salesMap, previousWeek, currentWeek });

    const percentChange =
        previousCount === 0
            ? (currentCount === 0 ? 0 : null)
            : ((currentCount - previousCount) / previousCount) * 100;

    return {
        previousWeekOrders: previousCount,
        currentWeekOrders: currentCount,
        percentChange: percentChange !== null ? +percentChange.toFixed(2) : null
    };
};

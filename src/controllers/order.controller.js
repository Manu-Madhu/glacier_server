import { isValidObjectId } from "mongoose";
import { payModeList, payStatusList, orderStatusList, deliveryTypeList } from "../config/data.js";
import {
    saveOrder, onlinePayment, updateOrder, findManyOrders, getOrderById,
    cancelMyOrder, returnMyOrder, clearCart, checkOrderPayStatusWithPG,
    sendRefundRequestToPhonepe,
    fetchRefundStatusFromPhonepe,
    sendConfirmationMail,
    sendOrderUpdateMail,
    getAllOrders,
    getOrderCount
} from "../services/order.service.js";
import { decrementProductQty, getBuyNowItem } from "../services/product.service.js";
import { getCart, getUserById, fetchOneAddress, fetchSingleAddress } from "../services/user.service.js";
import { addUserIdToCoupon, applyAutomaticDiscounts, applyCouponDiscount } from "../services/discount.service.js";
import moment from "moment";
import { calculateShippingCost } from "../services/logistics.service.js";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const originPin = 'Origin pin of seller'

export const checkoutCtrl = async (req, res) => {
    try {
        const {
            billAddress, shipAddress, payMode, deliveryType,
            couponCode, buyMode, productId, quantity, specs,
            pincode: pin
        } = req.body || {};

        let pincode = pin || '';

        const { userId } = req.user;
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found', error: 'NOT_FOUND' });
        }

        const address = await fetchSingleAddress(shipAddress)

        if (address?.pincode) {
            pincode = address?.pincode
        }

        let items = [];

        if (buyMode === "later") {
            items = await getCart(userId);
        } else if (buyMode === "now") {
            if (!isValidObjectId(productId) || quantity <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid Product Id or Quantity', error: 'BAD_REQUEST' });
            }
            const buyNowItem = await getBuyNowItem(productId, quantity, specs);
            if (!buyNowItem) {
                return res.status(400).json({ success: false, message: 'Unable to fetch item', error: 'BAD_REQUEST' });
            }
            items = [buyNowItem];
        } else {
            return res.status(400).json({ success: false, message: 'Invalid Buy Mode', error: 'BAD_REQUEST' });
        }

        const removedItems = [];

        items = items.filter((item) => {
            if (item.stockStatus === 'OUT_OF_STOCK') {
                removedItems.push(item.name);
                return false
            }
            return true
        }
        )

        if (removedItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following items are out of stock: ${removedItems.join(", ")}`,
                error: 'OUT_OF_STOCK'
            });
        }

        items = items.map((item) => {
            if (item.stockStatus === 'INSUFFICIENT') {
                item.quantity = Math.max(item.stock, 1);
            }
            return item
        })

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Empty Cart', error: 'BAD_REQUEST' });
        }

        let shippingCost = 0;
        try {
            const filters = {
                deliveryType,
            }

            shippingCost = await calculateShippingCost(filters)

        } catch (error) {
            console.log(error)
        }

        const subTotal = items.reduce((total, item) => {
            return total + ((item.price + item?.extraPrice) * item.quantity);
        }, 0);

        const totalTax = items.reduce((total, item) => {
            const itemBasePrice = item.price + item?.extraPrice;
            const taxPortionPerUnit = item.tax ? itemBasePrice * (item.tax / (100 + item.tax)) : 0;
            return total + (taxPortionPerUnit * item.quantity);
        }, 0);

        let discountAmount = 0;
        const { autoDiscountAmt, autoDiscountMsg } = await applyAutomaticDiscounts(items)
        console.log({ autoDiscountMsg })

        if (typeof autoDiscountAmt === "number" && autoDiscountAmt > 0) {
            discountAmount += autoDiscountAmt;
        }

        if (couponCode?.trim()) {
            const { couponDiscountAmt, couponDiscountMsg } = await applyCouponDiscount(userId, couponCode, (subTotal + totalTax))
            console.log({ couponDiscountMsg })

            if (typeof couponDiscountAmt === "number" && couponDiscountAmt > 0) {
                discountAmount += couponDiscountAmt
            }
        }

        // *** Important ***
        const orderAmount = subTotal + shippingCost - discountAmount;

        const prefix = 'ORDID';
        const value = moment().add(10, 'seconds').unix();
        const merchantOrderId = `${prefix}${value}`;

        const orderObj = {
            payMode,
            buyMode,
            couponCode,
            totalTax: totalTax?.toFixed(2),
            discount: discountAmount,
            deliveryCharge: shippingCost,
            subTotal,
            amount: orderAmount,
            items,
            userId,
            billAddress,
            shipAddress,
            deliveryType,
            merchantOrderId
        };

        const order = await saveOrder(orderObj);
        if (!order) {
            return res.status(500).json({ success: false, message: 'Failed to save Order', error: 'INTERNAL_SERVER_ERROR' });
        }

        if (payMode === 'COD') {
            if (couponCode) {
                await addUserIdToCoupon(couponCode, userId);
            }
            await decrementProductQty(items);
            if (buyMode === "later") await clearCart(userId);

            // Sent Confirmation Email
            try {
                const orderInfo = {
                    user, order
                }
                const info = await sendConfirmationMail(orderInfo)
                console.log({ info })
            } catch (error) {
                console.log(error)
            }

            return res.status(201).json({ success: true, message: "Order placed successfully", data: { order } });
        }

        const paymentResponse = await onlinePayment(merchantOrderId, user, orderAmount);
        if (paymentResponse?.status !== 200) {
            return res.status(500).json({ success: false, message: 'Failed to initiate payment', error: 'FAILED_PAYMENT_INITIATION' });
        }

        return res.status(200).json({
            success: true,
            message: "Order placed successfully",
            data: { result: { redirectUrl: paymentResponse?.data?.redirectUrl } }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Internal Server Error",
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};


export const checkOrderPayStatusCtrl = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrderById(orderId);

        const response = await checkOrderPayStatusWithPG(order?.merchantOrderId)

        if (!response) {
            return res.status(500).json({
                success: false,
                message: "failed",
                data: null,
                error: null,
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: response },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}


export const updateOrderCtrl = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updateObj = req.body;

        const updatedOrder = await updateOrder(orderId, updateObj)

        try {
            if (updateObj?.status && orderStatusList?.includes(updateObj?.status)) {
                await sendOrderUpdateMail(updatedOrder)
            }
        } catch (error) {
            console.log(error)
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: updatedOrder },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getOrderCtrl = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await getOrderById(orderId)

        res.status(200).json({
            success: true,
            message: "success",
            data: { result: order },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getMySingleOrderCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const { orderId } = req.params;

        const order = await getOrderById(orderId);
        if (order?.userId?._id?.toString() !== userId) {
            return res.status(500).json({
                success: false,
                message: "Unauthorised",
                data: null,
                error: 'Unauthorised'
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: order },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getMyOrdersCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const filters = { userId }
        const orders = await findManyOrders(filters)

        res.status(200).json({
            success: true,
            message: "success",
            data: { result: orders },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getAllOrdersCtrl = async (req, res) => {
    try {
        let { page, entries } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)

        const { payMode, payStatus, status, deliveryType,
            search, sortBy, sortOrder, minAmount, maxAmount,
            fromDate, toDate } = req.query;


        const advancedFilters = {};

        const orderDateFilter = {};

        if (fromDate) {
            orderDateFilter.$gte = dayjs.tz(fromDate, 'Asia/Kolkata').startOf('day').toDate();
        }

        if (toDate) {
            orderDateFilter.$lte = dayjs.tz(toDate, 'Asia/Kolkata').endOf('day').toDate();
        }

        if (Object.keys(orderDateFilter).length) {
            advancedFilters.orderDate = orderDateFilter;
        }


        const amountFilter = {};
        if (Number.isFinite(parseInt(minAmount))) amountFilter.$gte = parseInt(minAmount);
        if (Number.isFinite(parseInt(maxAmount))) amountFilter.$lte = parseInt(maxAmount);
        if (Object.keys(amountFilter).length) {
            advancedFilters.amount = amountFilter;
        }

        if (payModeList?.includes(payMode)) {
            advancedFilters.payMode = payMode
        }

        let sort = { orderDate: -1 }
        if (['date', 'total', 'customer']?.includes(sortBy) && ['asc', 'desc']?.includes(sortOrder)) {
            const sortNumber = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'date') {
                sort = { orderDate: sortNumber }
            }
            else if (sortBy === 'total') {
                sort = { amount: sortNumber }
            }
            else if (sortBy === 'customer') {
                sort = { 'customer.firstName': sortNumber }
            }
        }

        const filters = {}

        if (search?.trim()) {
            filters.$or = [
                { merchantOrderId: new RegExp(search, 'i') },
                { status: new RegExp(search, 'i') },
                { 'customer.firstName': new RegExp(search, 'i') },
            ]
        }

        if (payModeList?.includes(payMode)) {
            filters.payMode = payMode;
        }
        if (payStatusList?.includes(payStatus)) {
            filters.payStatus = payStatus;
        }
        if (orderStatusList?.includes(status)) {
            filters.status = status;
        }
        if (deliveryTypeList?.includes(deliveryType)) {
            filters.deliveryType = deliveryType;
        }

        const result = await getAllOrders({ filters, advancedFilters, sort, page, entries })
        const totalEntries = await getOrderCount(filters, advancedFilters)

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result, pagination: { totalEntries } },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

// *** Add Code to refund payment ***
export const cancelMyOrderCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const { orderId } = req.params;

        const order = await getOrderById(orderId);
        if (order?.userId?.toString() !== userId) {
            res.status(500).json({
                success: false,
                message: "Unauthorised",
                data: null,
                error: 'Unauthorised'
            })
        }

        if (['delivered', 'cancelled', 'returned', 'refunded']?.includes(order?.status)) {
            return res.status(400).json({
                success: false,
                message: 'Unable to cancel the order',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const cancelledOrder = await cancelMyOrder(orderId)

        if (cancelledOrder?.status !== 'cancelled') {
            return res.status(500).json({
                success: false,
                message: "Failed to cancel",
                data: null,
                error: 'INTERNAL_SERVER_ERROR'
            })
        }

        try {
            if (cancelledOrder?.status && orderStatusList?.includes(cancelledOrder?.status)) {
                await sendOrderUpdateMail(cancelledOrder)
            }
        } catch (error) {
            console.log(error)
        }

        res.status(200).json({
            success: true,
            message: "success",
            data: { result: cancelledOrder },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

// *** Add Code to refund payment ***
export const returnMyOrderCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const { orderId } = req.params;

        const order = await getOrderById(orderId);
        if (order?.userId?.toString() !== userId) {
            return res.status(500).json({
                success: false,
                message: "Unauthorised",
                data: null,
                error: 'Unauthorised'
            })
        }

        if (!['delivered']?.includes(order?.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order is not delivered',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const returnedOrder = await returnMyOrder(orderId)

        if (returnedOrder?.status !== 'returned') {
            return res.status(500).json({
                success: false,
                message: "Failed to return",
                data: null,
                error: 'INTERNAL_SERVER_ERROR'
            })
        }

        try {
            if (returnedOrder?.status && orderStatusList?.includes(returnedOrder?.status)) {
                await sendOrderUpdateMail(returnedOrder)
            }
        } catch (error) {
            console.log(error)
        }

        res.status(200).json({
            success: true,
            message: "success",
            data: { result: returnedOrder },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const refundRequestToPGCtrl = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Id",
                data: null,
                error: "INVALID_ID"
            })
        }

        const order = await getOrderById(orderId)

        if (!order || order?.payStatus !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Invalid Order",
                data: null,
                error: "BAD_REQUEST"
            })
        }

        const prefix = 'RFDID';
        const value = moment().add(10, 'seconds').unix();
        const merchantRefundId = `${prefix}${value}`;

        const postObj = {
            merchantRefundId: merchantRefundId,
        }

        if (order?.merchantOrderId) {
            postObj.originalMerchantOrderId = order?.merchantOrderId
        }

        // if an amount is specified in req use it else use order amount
        if (amount && !isNaN(amount)) {
            postObj.amount = amount
        }
        else {
            postObj.amount = order?.amount;
        }

        const response = await sendRefundRequestToPhonepe(postObj)

        console.log({ response })

        if (response.status === 200) {
            const refundId = response?.data?.refundId;
            await updateOrder(orderId, { refundId })
        }
        else {
            return res.status(500).json({
                success: false,
                message: "Failed to send refund request to PG",
                data: null,
                error: null,
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: response?.data },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}


export const getRefundStatusCtrl = async (req, res) => {
    try {
        const { merchantRefundId } = req.params;

        if (!merchantRefundId?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid Merchant refund Id",
                data: null,
                error: "BAD_REQUEST",
            })
        }

        const response = await fetchRefundStatusFromPhonepe(merchantRefundId)

        if (response.status !== 200) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch refund status from PG",
                data: null,
                error: null,
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: response?.data },
            error: null,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const fetchCheckoutDataCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const { buyMode = "later", deliveryType = "Standard",
            productId, quantity, specs } = req.body || {};

        let { pincode } = req.body || {};

        let items = [];

        if (buyMode === "later") {
            items = await getCart(userId);
        } else if (buyMode === "now") {
            if (!isValidObjectId(productId) || quantity <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid Product Id or Quantity', error: 'BAD_REQUEST' });
            }
            const buyNowItem = await getBuyNowItem(productId, quantity, specs);
            if (!buyNowItem) {
                return res.status(400).json({ success: false, message: 'Unable to fetch item', error: 'BAD_REQUEST' });
            }
            items = [buyNowItem];
        } else {
            return res.status(400).json({ success: false, message: 'Invalid Buy Mode', error: 'BAD_REQUEST' });
        }

        const address = await fetchOneAddress({ userId })

        if (address?.pincode) {
            pincode = address?.pincode
        }

        let shippingCost = 0;
        try {
            const filters = {
                deliveryType,
                originPin,
                destinationPin: pincode,
            }

            shippingCost = await calculateShippingCost(filters)

        } catch (error) {
            console.log(error)
        }

        const subtotal = items.reduce((total, item) => {
            return total + ((item.price + item?.extraPrice) * item.quantity);
        }, 0);

        const totalTax = items.reduce((total, item) => {
            const itemBasePrice = item.price + item?.extraPrice;
            const taxPortionPerUnit = item.tax ? itemBasePrice * (item.tax / (100 + item.tax)) : 0;
            return total + (taxPortionPerUnit * item.quantity);
        }, 0);

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: { cart: items, subtotal, totalTax, shippingCost } },
            error: null
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
};
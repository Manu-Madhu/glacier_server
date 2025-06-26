import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { countOrders, findManyOrders, getAllOrders, getMonthlySalesChange, getWeeklyOrdersChange } from "./order.service.js";
import { countUsers } from "./user.service.js";
import { getManyProducts } from "./product.service.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();
const past12Months = dayjs().subtract(11, 'months').startOf('month').toDate();

export async function getBestSellingProducts(limit = 5) {
  const bestSellers = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: 1,
        totalSold: 1,
        name: "$productDetails.name",
        price: "$productDetails.price",
        thumbnail: "$productDetails.thumbnail"
      }
    }
  ]);

  const bestSellerLabels = bestSellers.map(item => item.name);
  const bestSellerData = bestSellers.map(item => item.totalSold);

  return {
    labels: bestSellerLabels,
    datasets: [
      {
        label: 'Units Sold',
        data: bestSellerData,
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
      }
    ]
  }


}


export async function getSalesByCategory() {
  const result = await Order.aggregate([
    { $unwind: "$items" },

    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: {
            $multiply: ["$items.quantity", { $add: ["$items.price", "$items.extraPrice"] }]
          }
        }
      }
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    // { $match: { "product.isArchived": false } },

    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "productIds",
        as: "categories"
      }
    },
    { $unwind: "$categories" },
    // { $match: { "categories.isArchived": false } },

    {
      $group: {
        _id: "$categories._id",
        categoryName: { $first: "$categories.name" },
        totalSold: { $sum: "$totalSold" },
        totalRevenue: { $sum: "$totalRevenue" },
        productCount: { $addToSet: "$_id" }
      }
    },
    {
      $project: {
        _id: 1,
        categoryName: 1,
        totalSold: 1,
        totalRevenue: 1,
        productCount: { $size: "$productCount" }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  const salesByCategoryLabels = result.map(item => item.categoryName);
  const salesByCategoryData = result.map(item => item.totalRevenue);

  return {
    labels: salesByCategoryLabels,
    datasets: [
      {
        label: 'Revenue by Category',
        data: salesByCategoryData,
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  }
}


export async function getRecentUsers() {
  const dayCount = 7

  const results = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.day": 1 }
    }
  ]);

  const recent_users = [];

  for (let i = dayCount; i >= 1; i--) {
    const day = dayjs().subtract(i, 'day');
    const dayFormatted = day.format('YYYY-MM-DD');
    const dayName = day.format('ddd');
    const found = results.find(r => r._id.day === dayFormatted);
    recent_users.push({
      day: dayName,
      userCount: found ? found.count : 0
    });
  }

  return recent_users;
}


export const getSaleAnalytics = async () => {
  const deliveredPipeline = [
    {
      $match: {
        status: 'delivered',
        orderDate: { $gte: past12Months }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" }
        },
        totalRevenue: { $sum: "$amount" }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]

  const cancelledPipeline = [
    {
      $match: {
        status: 'cancelled',
        orderDate: { $gte: past12Months }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$orderDate" },
          month: { $month: "$orderDate" }
        },
        totalLoss: { $sum: "$amount" }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]

  const [deliveredChart, cancelledChart] = await Promise.all([
    Order.aggregate(deliveredPipeline),
    Order.aggregate(cancelledPipeline)
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = dayjs().subtract(11 - i, 'months');
    return { label: date.format('MMM'), monthNumber: date.month() + 1 };
  });

  const formatChart = (data, key) => {
    return months.map(({ label, monthNumber }) => {
      const entry = data.find(d => d._id.month === monthNumber);
      return entry ? entry[key] : 0
    });
  };

  const categories = months?.map((item) => item.label)

  const deliveredFormatted = formatChart(deliveredChart, 'totalRevenue');
  const cancelledFormatted = formatChart(cancelledChart, 'totalLoss');

  const series = [
    {
      label: "Revenue from delivered orders",
      data: deliveredFormatted,
      borderColor: 'rgb(14, 165, 233)',
      backgroundColor: 'rgba(14, 165, 233, 0.5)',
      tension: 0.3
    },
    {
      label: "Revenue loss from cancelled orders",
      data: cancelledFormatted,
      borderColor: 'rgb(233, 14, 14)',
      backgroundColor: 'rgba(233, 83, 14, 0.5)',
      tension: 0.3
    },
  ]

  const sale_analytics = { labels: categories, datasets: series }

  return sale_analytics;
}

export const getRecentOrders = async () => {
  const allOrders = await getAllOrders({ createdAt: { $gte: sevenDaysAgo } }, {})

  return allOrders.length > 10 ? allOrders.slice(0, 5) : allOrders;

}

export const getMetrics = async () => {
  const [totalUsers, totalOrders, deliveredOrders, allProducts, weeklyOrderChange, monthlySalesChange] = await Promise.all([
    countUsers(),
    countOrders(),
    findManyOrders({ status: "delivered" }),
    getManyProducts(),
    getWeeklyOrdersChange(),
    getMonthlySalesChange()
  ]);

  const totalSale = deliveredOrders.reduce((total, order) => total + parseFloat(order.amount), 0);
  const totalRevenue = deliveredOrders.reduce((total, order) => total + parseFloat(order.amount) - parseFloat(order.deliveryCharge), 0);
  const totalItems = allProducts.reduce((acc, item) => {
    const prodQty = item?.variantItems?.reduce((com, elem) => com + elem?.stock, 0) || 0;
    return acc + prodQty
  }, 0)

  return {
    totalSale,
    totalOrders,
    totalItems: allProducts.length,
    totalRevenue,
    totalUsers,
    weeklyOrderChange: weeklyOrderChange?.percentChange,
    monthlySalesChange: monthlySalesChange?.percentChange,
  }

}
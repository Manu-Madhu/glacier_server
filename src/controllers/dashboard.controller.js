import { getManyProducts } from "../services/product.service.js";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { getBestSellingProducts, getMetrics, getRecentOrders, getRecentUsers, getSaleAnalytics, getSalesByCategory } from "../services/dashboard.service.js";
dayjs.extend(utc);
dayjs.extend(timezone);


export const dashboardCtrl = async (req, res) => {
    try {
        const [metrics_data, recent_orders, recent_users, sale_analytics, best_prods, sales_by_category] = await Promise.all([
            getMetrics(),
            getRecentOrders(),
            getRecentUsers(),
            getSaleAnalytics(),
            getBestSellingProducts(),
            getSalesByCategory()
        ]);

        return res.status(200).json({
            success: true,
            message: 'success',
            data: {
                metrics_data,
                recent_orders,
                recent_users,
                best_prods,
                sales_by_category,
                sale_analytics
            },
            error: null
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: 'INTERNAL_SERVER_ERROR' });
    }
};


export const stockReportCtrl = async (req, res) => {
    try {
        const products = await getManyProducts({}, { name: 1, hsn: 1, variantItems: 1 })

        let result = products?.map((prod) => {
            const totalStock = prod?.variantItems?.reduce((acc, val) => acc + val?.stock, 0) || 0;

            const retObj = {
                name: prod?.name,
                hsn: prod?.hsn,
                totalStock: totalStock,
                variantItems: []
            }

            retObj.variantItems = prod?.variantItems?.map((item) => {
                return {
                    sku: item?.sku,
                    stock: item?.stock,
                    extraPrice: item?.extraPrice,
                    specs: item?.specs?.map((spec) => {
                        return {
                            variationName: spec?.variationId?.name,
                            optionValue: spec?.optionId?.value,
                        }
                    })
                }
            })

            return retObj;
        })

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result },
            error: null
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: 'INTERNAL_SERVER_ERROR' });
    }
}
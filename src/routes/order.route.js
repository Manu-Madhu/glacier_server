import { checkoutCtrl, updateOrderCtrl, getOrderCtrl, getMyOrdersCtrl,
    getAllOrdersCtrl, cancelMyOrderCtrl, returnMyOrderCtrl,
    getMySingleOrderCtrl, checkOrderPayStatusCtrl,
    refundRequestToPGCtrl,
    getRefundStatusCtrl, 
    fetchCheckoutDataCtrl} from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleChecker } from '../middlewares/roleChecker.middleware.js';
import { validateMW } from "../middlewares/validate.middleware.js";
import { orderValidator } from '../validators/order.validator.js';

import { Router } from "express";

const orderRouter = Router();

orderRouter.use(authMiddleware)

orderRouter.use(roleChecker(['user', 'admin']))

// Below route involves call to Phonepe server
orderRouter.post('/fetch-checkout', fetchCheckoutDataCtrl)
orderRouter.post('/checkout', orderValidator.create, validateMW, checkoutCtrl)

orderRouter.get('/own', getMyOrdersCtrl)
orderRouter.get('/own/:orderId', getMySingleOrderCtrl)
orderRouter.patch('/cancel/:orderId', cancelMyOrderCtrl)
orderRouter.patch('/return/:orderId', returnMyOrderCtrl)

orderRouter.use(roleChecker(['admin']))


// Below route involves call to Phonepe server
orderRouter.post('/refund', refundRequestToPGCtrl)
orderRouter.get('/refund-status/:merchantRefundId', getRefundStatusCtrl)
orderRouter.get('/pay-status/:orderId', checkOrderPayStatusCtrl)

orderRouter.put('/:orderId', orderValidator.update, validateMW, updateOrderCtrl)
orderRouter.get('/all', getAllOrdersCtrl)
orderRouter.get('/:orderId', getOrderCtrl)

export { orderRouter }
import { Router } from "express";
import { discountValidator } from "../validators/discount.validator.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import {
    createDiscountCtrl, deleteDiscountCtrl, fetchAvailableCouponsCtrl,
    fetchCouponValue, getDiscountByIdCtrl, getDiscountsCtrl, updateDiscountCtrl
} from "../controllers/discount.controller.js";
import { validateMW } from "../middlewares/validate.middleware.js";

const discountRouter = Router();

discountRouter.get("/", getDiscountsCtrl);

discountRouter.post("/fetch-coupon-value", authMiddleware, fetchCouponValue);
discountRouter.get("/available-coupons", authMiddleware, fetchAvailableCouponsCtrl);

discountRouter.get("/:id", getDiscountByIdCtrl);

discountRouter.use(authMiddleware)
discountRouter.use(roleChecker(['admin']))

discountRouter.post("/", discountValidator.create, validateMW, createDiscountCtrl);
discountRouter.put("/:id", discountValidator.update, validateMW, updateDiscountCtrl);
discountRouter.delete("/:id", deleteDiscountCtrl);

export { discountRouter };
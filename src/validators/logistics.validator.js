import { body } from "express-validator";
import { deliveryTypeList } from "../config/data.js";

export const shipCostValidator = {
    create: [
        body("amount")
            .isNumeric().withMessage("Amount must be a number.")
            .notEmpty().withMessage("Amount is required."),
        body("deliveryType")
            .optional()
            .isString().withMessage("Delivery type must be a string.")
            .isIn(deliveryTypeList).withMessage("Delivery type must be one of: standard, express.")
            .notEmpty().withMessage("Delivery type cannot be empty if provided."),
        body("duration")
            .optional()
            .isString().withMessage("Duration must be a string."),
    ],
    update: [
        body("amount")
            .optional()
            .isNumeric().withMessage("Amount must be a number.")
            .notEmpty().withMessage("Amount is required if provided."),
        body("deliveryType")
            .optional()
            .isString().withMessage("Delivery type must be a string.")
            .isIn(deliveryTypeList).withMessage("Delivery type must be one of: standard, express.")
            .notEmpty().withMessage("Delivery type cannot be empty if provided."),
        body("duration")
            .optional()
            .isString().withMessage("Duration must be a string."),
        body("isArchived")
            .optional()
            .isBoolean().withMessage("isArchived must be a boolean."),
    ],
}

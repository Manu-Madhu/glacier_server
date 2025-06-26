import { body,  } from "express-validator";
import mongoose from "mongoose";
import { discountTypeList } from "../config/data.js";

export const discountValidator ={
    create : [
        body("code").optional().isString().trim(),
        body("description").optional().isString().trim(),
        body("discountType").isIn(discountTypeList).withMessage("Invalid discount type"),
        body("discountValue").isFloat({ gt: 0 }).withMessage("Discount value must be greater than 0"),
        body("minOrderAmount").optional().isFloat({ min: 0 }),
        body("maxDiscountAmount").optional().isFloat({ min: 0 }),
        body("startDate").isISO8601().toDate(),
        body("endDate").isISO8601().toDate().custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.startDate)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),
        body("isActive").optional().isBoolean(),
        body("appliesAutomatically").optional().isBoolean(),
        body("applicableProducts").optional().isArray(),
        body("applicableProducts.*").optional().custom((value) => {
            if (!mongoose.isValidObjectId(value)) {
                throw new Error("Invalid product ID");
            }
            return true;
        }),
        body("applicableCategories").optional().isArray(),
        body("applicableCategories.*").optional().custom((value) => {
            if (!mongoose.isValidObjectId(value)) {
                throw new Error("Invalid category ID");
            }
            return true;
        }),
    ],

    update : [
        body("code").optional().isString().trim(),
        body("description").optional().isString().trim(),
        body("discountType").optional().isIn(discountTypeList).withMessage("Invalid discount type"),
        body("discountValue").optional().isFloat({ gt: 0 }).withMessage("Discount value must be greater than 0"),
        body("minOrderAmount").optional().isFloat({ min: 0 }),
        body("maxDiscountAmount").optional().isFloat({ min: 0 }),
        body("startDate").optional().isISO8601().toDate(),
        body("endDate").optional().isISO8601().toDate().custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.startDate)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),
        body("isActive").optional().isBoolean(),
        body("appliesAutomatically").optional().isBoolean(),
        body("applicableProducts").optional().isArray(),
        body("applicableProducts.*").optional().custom((value) => {
            if (!mongoose.isValidObjectId(value)) {
                throw new Error("Invalid product ID");
            }
            return true;
        }),
        body("applicableCategories").optional().isArray(),
        body("applicableCategories.*").optional().custom((value) => {
            if (!mongoose.isValidObjectId(value)) {
                throw new Error("Invalid category ID");
            }
            return true;
        }),
    ]
}


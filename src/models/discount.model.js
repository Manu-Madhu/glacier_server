import { model, Schema } from "mongoose";
import { discountTypeList } from "../config/data.js";

const discountSchema = new Schema({
    code: { type: String, unique: true, sparse: true },
    description: { type: String },
    discountType: { type: String, enum: discountTypeList, required: true },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    appliesAutomatically: { type: Boolean, default: false },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],

    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

export const Discount = model("Discount", discountSchema);
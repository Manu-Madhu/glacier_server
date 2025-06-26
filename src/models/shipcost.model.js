import { model, Schema } from "mongoose";
import { deliveryTypeList } from "../config/data.js";

const ShipCostSchema = new Schema({
   amount: { type: Number, required: true, min: 0 },
   deliveryType: { type: String, enum: deliveryTypeList, default: "Standard", required: true, unique: true },
   duration: { type: String, default: "3-5 days" },
   isArchived: { type: Boolean, default: false },

}, { timestamps: true })

export const ShipCost = model("ShipCost", ShipCostSchema);
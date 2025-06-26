import { model, Schema } from "mongoose";


const ProductSchema = new Schema({

}, {timestamps: true});

export const Product = model("Product", ProductSchema)
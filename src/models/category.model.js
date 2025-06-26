import { model, Schema } from "mongoose";

const CategorySchema = new Schema({
    
    parent: { type: Schema.Types.ObjectId, ref: 'Category' , default: null},

    name: {
        type: String,
        unique: true,
        required: true
    },

    description: {
        type: String,
    },
    isArchived: {
        type: Boolean,
        default: false
    },

    image: {
        type: {
            name: { type: String },
            key: { type: String },
            location: { type: String },
        }
    },

    productIds: [
        { type: Schema.Types.ObjectId, ref: 'Product' }
    ]

}, { timestamps: true });

export const Category = model("Category", CategorySchema);
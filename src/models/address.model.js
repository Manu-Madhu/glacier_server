import { model, Schema } from "mongoose";

const addressSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User',required: true },
    fullName: {
        type: String,
        required: true,
    },
    street: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    pincode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
}, { timestamps: true });


export const Address = model('Address', addressSchema)

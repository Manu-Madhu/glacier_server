import { model, Schema } from "mongoose";

const otpSchema = new Schema({
    email: { type: String },

    otp: { type: String },

    isVerified: { type: Boolean, default: false },

    createdAT: { type: Date, default: Date.now, index: { expires: '5m' } }

})

export const OTP = model("OTP", otpSchema);
import { model, Schema } from "mongoose";
import { enquiryTypeList } from "../config/data.js";

const enquirySchema = new Schema({
    type: { type: String, enum: enquiryTypeList, default: 'Contact' },
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true },
    mobile: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, trim: true },

}, { timestamps: true })

const Enquiry = model('Enquiry', enquirySchema);

export { Enquiry }
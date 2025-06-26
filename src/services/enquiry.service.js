import { Enquiry } from "../models/enquiry.model.js"
import nodemailer from "nodemailer";


export const createEnquiry = async (obj) => {
    return await Enquiry.create(obj)
}

export const findEnquiryById = async (id) => {
    return await Enquiry.findById(id)
}

export const getManyEnquiries = async (filters) => {
    return await Enquiry.find(filters).sort({ createdAt: -1 })
}

export const deleteEnquiry = async (id) => {
    return await Enquiry.findByIdAndDelete(id)
}

import { Testimonial } from "../models/testimonial.model.js"

export const createTestimonial = async (obj) => {
    return await Testimonial.create(obj)
}

export const getTestimonialById = async (id) => {
    return await Testimonial.findById(id)
    .populate("userId", "firstName lastName")

}

export const getManyTestimonials = async (filters) => {
    return await Testimonial.find(filters)
    .populate("userId", "firstName lastName")
    
}

export const updateTestimonial = async (id, obj) => {
    return await Testimonial.findByIdAndUpdate(id, { $set: obj }, { new: true })
}

export const deleteTestimonial = async (id) => {
    return await Testimonial.findByIdAndDelete(id)
}
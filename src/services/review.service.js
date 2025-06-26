import { Review } from "../models/review.model.js"

export const createReview = async (obj) => {
    return await Review.create(obj)
}

export const getReviewById = async (id) => {
    return await Review.findById(id)
        .populate('userId', 'firstName lastName')
        .populate('productId', 'name')
}

export const getManyReviews = async (filters) => {
    return await Review.find(filters)
        .populate('userId', 'firstName lastName')
        .populate('productId', 'name')
}

export const updateReview = async (id, obj) => {
    return await Review.findByIdAndUpdate(id, { $set: obj }, { new: true })
}

export const deleteReview = async (id) => {
    return await Review.findByIdAndDelete(id)
}
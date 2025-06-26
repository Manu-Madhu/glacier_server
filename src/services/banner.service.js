import { Banner } from "../models/banner.model.js";

export const createBanner = async (obj) => {
    return await Banner.create(obj)
}

export const getBannerById = async (id) => {
    return await Banner.findById(id)
}

export const getManyBanners = async (filters) => {
    return await Banner.find(filters)
}

export const updateBanner = async (id, obj) => {
    return await Banner.findByIdAndUpdate(id, { $set: obj }, { new: true })
}

export const deleteBanner = async (id) => {
    return await Banner.findByIdAndDelete(id)
}
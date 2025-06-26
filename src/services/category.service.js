import { Category } from "../models/category.model.js";

export const createCategory = async(obj)=>{
    return await Category.create(obj);
}

export const getCategoryById = async (id) => {
    return await Category.findById(id)
    .populate("parent")
    .populate("productIds", "name price thumbnail")
}

export const getManyCategories = async (filters = {}) => {
    return await Category.find(filters)
    .populate("parent")
    .populate("productIds", "name price thumbnail")
    .sort({createdAt: -1})
}

export const updateCategory = async (id, obj = {}) => {
    return await Category.findByIdAndUpdate(id, {
        $set: obj
    }, { new: true });
}

export const updateCategoryStatus = async (id, isArchived) => {
    return await Category.findByIdAndUpdate(id, {
        $set: { isArchived }
    }, { new: true });
}
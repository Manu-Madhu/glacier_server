import { ShipCost } from "../models/shipcost.model.js";

export const calculateShippingCost = async (filters) => {
    const response = await ShipCost.findOne(filters).lean();
    if (!response) {
        return 0;
    }
    return response?.amount;
}

export const getShippingCostByFilters = async (filters) => {
    const shippingCost = await ShipCost.findOne(filters).lean();

    return shippingCost;
}

export const createShippingCost = async (data) => {
    const newCost = new ShipCost(data);
    await newCost.save();
    return newCost;
}

export const updateShippingCost = async (field, value, data) => {
    const existingCost = await ShipCost.findOne({ [field]: value });
    if (!existingCost) {
        throw new Error("Shipping cost not found.");
    }
   
    Object.assign(existingCost, data);
    await existingCost.save();
    return existingCost?.toObject();
}

export const archiveShippingCost = async (id) => {
    const existingCost = await ShipCost.findById(id);
    if (!existingCost) {
        throw new Error("Shipping cost not found.");
    }
    existingCost.isArchived = true;
    await existingCost.save();
    return existingCost;
}

export const getShippingCosts = async (filters = {}) => {
    const shippingCosts = await ShipCost.find({ ...filters }).lean();
    return shippingCosts;
}

export const getShippingCostById = async (id) => {
    const shippingCost = await ShipCost.findById(id).lean();
    if (!shippingCost) {
        throw new Error("Shipping cost not found.");
    }
    return shippingCost;
}

export const restoreArchivedShippingCost = async (id) => {
    const archivedCost = await ShipCost.findById(id);
    if (!archivedCost) {
        throw new Error("Archived shipping cost not found.");
    }
    archivedCost.isArchived = false;
    await archivedCost.save();
    return archivedCost;
}

export const deleteShippingCost = async (id) => {
    const shippingCost = await ShipCost.findByIdAndDelete(id);
    if (!shippingCost) {
        throw new Error("Shipping cost not found.");
    }
    return { message: "Shipping cost deleted successfully." };
}


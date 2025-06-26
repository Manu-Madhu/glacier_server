import { isValidObjectId } from "mongoose";
import {
    createShippingCost,
    getShippingCostByFilters,
    archiveShippingCost,
    restoreArchivedShippingCost,
    deleteShippingCost,
    updateShippingCost,
    getShippingCosts
} from "../services/logistics.service.js";

export const createShippingCostCtrl = async (req, res) => {
    const { deliveryType, amount } = req.body;

    try {
        const existingCost = await getShippingCostByFilters({
            deliveryType: deliveryType,
            isArchived: false
        });

        if (existingCost) {
            throw new Error("Shipping cost for this delivery type already exists.");
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            throw new Error("Invalid amount. It must be a positive number.");
        }
        if (!deliveryType || typeof deliveryType !== 'string') {
            throw new Error("Invalid delivery type. It must be  a string.");
        }

        const newShippingCost = await createShippingCost({
            deliveryType,
            amount
        });

        return res.status(201).json({
            success: true,
            message: "Shipping cost created successfully.",
            data: {
                result: newShippingCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error creating shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }

}

export const getShippingCostCtrl = async (req, res) => {
    const { deliveryType } = req.query;

    try {
        if (!deliveryType || typeof deliveryType !== 'string') {
            throw new Error("Invalid delivery type. It must be a string.");
        }

        const shippingCost = await getShippingCostByFilters({
            deliveryType: deliveryType,
            isArchived: false
        });

        if (!shippingCost) {
            return res.status(404).json({
                success: false,
                message: "Shipping cost not found.",
                error: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shipping cost retrieved successfully.",
            data: {
                result: shippingCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error retrieving shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const getAllShippingCostsCtrl = async (req, res) => {
    try {
        const shippingCosts = await getShippingCosts({});

        return res.status(200).json({
            success: true,
            message: "Shipping costs retrieved successfully.",
            data: {
                result: shippingCosts,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error retrieving shipping costs.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const getManyShippingCostsCtrl = async (req, res) => {
    try {
        const shippingCosts = await getShippingCosts({ isArchived: false });

        return res.status(200).json({
            success: true,
            message: "Shipping costs retrieved successfully.",
            data: {
                result: shippingCosts,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error retrieving shipping costs.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const archiveShippingCostCtrl = async (req, res) => {
    const { id } = req.params;

    try {
        const archivedCost = await archiveShippingCost(id);

        return res.status(200).json({
            success: true,
            message: "Shipping cost archived successfully.",
            data: {
                result: archivedCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error archiving shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}
export const restoreArchivedShippingCostCtrl = async (req, res) => {
    const { id } = req.params;

    try {
        const restoredCost = await restoreArchivedShippingCost(id);

        return res.status(200).json({
            success: true,
            message: "Shipping cost restored successfully.",
            data: {
                result: restoredCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error restoring archived shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}
export const deleteShippingCostCtrl = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedCost = await deleteShippingCost(id);

        return res.status(200).json({
            success: true,
            message: "Shipping cost deleted successfully.",
            data: {
                result: deletedCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error deleting shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}


export const updateShipCostStatusCtrl = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const { status } = req.body;
        if (!['archived', 'unarchived']?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        if (status === 'archived') {
            await archiveShippingCost(id);
        }
        else {
            await restoreArchivedShippingCost(id);
        }

        const ShipCost = await getShippingCostByFilters({ _id: id });
        if (!ShipCost) {
            return res.status(404).json({
                success: false,
                message: 'Shipping cost not found',
                data: null,
                error: 'NOT_FOUND'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: ShipCost },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const updateShippingCostCtrl = async (req, res) => {
    const { id } = req.params;
    const { deliveryType, amount } = req.body;

    try {
        if (!id || !isValidObjectId(id)) {
            throw new Error("Invalid shipping cost ID.");
        }

        if (!deliveryType || typeof deliveryType !== 'string') {
            throw new Error("Invalid delivery type. It must be a string.");
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            throw new Error("Invalid amount. It must be a positive number.");
        }

        const updatedShippingCost = await updateShippingCost('_id', id, {
            deliveryType,
            amount
        });

        return res.status(200).json({
            success: true,
            message: "Shipping cost updated successfully.",
            data: {
                result: updatedShippingCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error updating shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const updateManyShippingCostCtrl = async (req, res) => {
    const { shipping } = req.body;

    try {
        const result = []
        for (const doc of shipping) {
            const { deliveryType, amount } = doc;

            if (!deliveryType || typeof deliveryType !== 'string') {
                throw new Error("Invalid delivery type. It must be a string.");
            }

            if (!amount || typeof amount !== 'number' || amount <= 0) {
                throw new Error("Invalid amount. It must be a positive number.");
            }

            const updatedShippingCost = await updateShippingCost('deliveryType', deliveryType, doc);

            result.push(updatedShippingCost);
        }

        return res.status(200).json({
            success: true,
            message: "Shipping cost updated successfully.",
            data: {
                result,
            }
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message || "Error updating shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}

export const getShippingCostByIdCtrl = async (req, res) => {
    const { id } = req.params;

    try {
        if (!id || !isValidObjectId(id)) {
            throw new Error("Invalid shipping cost ID.");
        }

        const shippingCost = await getShippingCostByFilters({ _id: id });

        if (!shippingCost) {
            return res.status(404).json({
                success: false,
                message: "Shipping cost not found.",
                error: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shipping cost retrieved successfully.",
            data: {
                result: shippingCost,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Error retrieving shipping cost.",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
}
import { isValidObjectId } from "mongoose";
import {
    createOption, createProduct, createVariation, deleteOption, deleteVariation, getAllProducts, getManyOption, getManyProducts, getManyVariation, getOneOption, getOneVariation, getProductById,
    getProductCount,
    getProductStock, updateOption, updateProduct,
    updateProductStatus,
    updateVariation
} from "../services/product.service.js";
import { deleteFileFromDO, deleteMultipleFilesFromDO } from "../utils/storage.util.js";
import { getManyCategories } from "../services/category.service.js";

export const createProductCtrl = async (req, res) => {
    try {
        const createObj = req.body;
        console.log({createObj})
        const product = await createProduct(createObj)

        if (!product) {
            throw new Error('FAILED')
        }

        return res.status(201).json({
            success: true,
            message: 'success',
            data: { result: product },
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

export const updateProductCtrl = async (req, res) => {
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

        const product = await getProductById(id)

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Not Found',
                data: null,
                error: 'NOT_FOUND'
            })
        }

        const updateObj = req.body;

        if (product?.thumbnail?.key && updateObj?.thumbnail?.key && (updateObj?.thumbnail?.key !== product?.thumbnail?.key)) {
            try {
                await deleteFileFromDO(product?.thumbnail?.key)
            } catch (error) {
                console.log(error)
            }
        }

        const oldImgKeys = Array.isArray(product?.images) ? product?.images?.map(img => img?.key) : [];
        const newImgKeys = Array.isArray(updateObj?.images) ? updateObj?.images?.map(img => img?.key) : [];

        if (oldImgKeys?.length > 0) {
            const deletableKeys = oldImgKeys?.filter(oik => !newImgKeys?.includes(oik))
            if (deletableKeys?.length > 0) {
                try {
                    await deleteMultipleFilesFromDO(deletableKeys)
                } catch (error) {
                    console.log(error)
                }
            }
        }

        const updatedProduct = await updateProduct(id, updateObj)

        if (!updatedProduct) {
            throw new Error('FAILED')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: updatedProduct },
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

export const updateProductStatusCtrl = async (req, res, next) => {
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

        let isArchived;
        if (status === 'archived') {
            isArchived = true;
        }
        else {
            isArchived = false;
        }

        const product = await updateProductStatus(id, isArchived)

        if (!product) {
            throw new Error('FAILED')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: product },
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


export const getProductByIdCtrl = async (req, res) => {
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

        const product = await getProductById(id)

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Not found',
                data: null,
                error: 'PRODUCT_NOT_FOUND'
            })
        }

        const productStock = await getProductStock(id)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: { ...product, stock: productStock } },
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



export const getManyProductsCtrl = async (req, res, next) => {
    try {
        let { page, entries } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)
        const { tag, search, category } = req.query;

        const filters = { isArchived: false };

        if (search?.trim()) {
            filters.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') },
            ]
        }

        if (tag?.trim()) {
            filters.tags = { $in: [tag] }
        }

        if (isValidObjectId(category)) {
            const catFilters = {}
            catFilters.$or = [{ parent: category }, { _id: category }]
            const cats = await getManyCategories(catFilters)

            const productIds = cats?.flatMap((cat) => cat?.productIds) ?? []

            filters._id = { $in: productIds }
        }


        let result = await getManyProducts(filters)

        const total = result?.length;

        if (page && entries) {
            result = result.slice((page - 1) * entries, page * entries)
        }

        result = result?.map((product) => ({
            ...product,
            stock: product.variantItems.reduce((sum, item) => sum + item.stock, 0) ?? 0,
        }))

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result, pagination: { total } },
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


export const getAllProductsCtrl = async (req, res, next) => {
    try {
        let { page, entries } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)
        const { tag, search, category, sortBy, sortOrder, minPrice, maxPrice, stock, isFeatured } = req.query;

        const advancedFilters = {};

        const priceFilter = {};
        if (Number.isFinite(parseInt(minPrice))) priceFilter.$gte = parseInt(minPrice);
        if (Number.isFinite(parseInt(maxPrice))) priceFilter.$lte = parseInt(maxPrice);
        if (Object.keys(priceFilter).length) {
            advancedFilters.price = priceFilter;
        }

        if (stock === 'in-stock') {
            advancedFilters.$expr = { $gt: [{ $sum: '$variantItems.stock' }, 0] };
        }
        else if (stock === 'out-of-stock') {
            advancedFilters.$expr = { $eq: [{ $sum: '$variantItems.stock' }, 0] };
        }
        else if (stock === 'low-stock') {
            const threshold = 5;
            advancedFilters.$expr = { $and: [{ $gt: [{ $sum: '$variantItems.stock' }, 0] }, { $lt: [{ $sum: '$variantItems.stock' }, threshold] }] };
        }

        if (isFeatured === 'true') {
            advancedFilters.isFeatured = true;
        } else if (isFeatured === 'false') {
            advancedFilters.isFeatured = false;
        }

        let sort = { name: 1 }
        if (['name', 'price', 'inventory']?.includes(sortBy) && ['asc', 'desc']?.includes(sortOrder)) {
            const sortNumber = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'name') {
                sort = { name: sortNumber }
            }
            else if (sortBy === 'price') {
                sort = { price: sortNumber }
            }
            else if (sortBy === 'inventory') {
                sort = { stock: sortNumber }
            }
        }
        else if (sortBy === 'createdAt' && ['asc', 'desc']?.includes(sortOrder)) {
            sort = { createdAt: sortOrder === 'asc' ? 1 : -1 }
        }

        const filters = { };

        if (search?.trim()) {
            filters.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') },
            ]
        }

        if (tag?.trim()) {
            filters.tags = { $in: [tag] }
        }

        if (isValidObjectId(category)) {
            const catFilters = {}
            catFilters.$or = [{ parent: category }, { _id: category }]
            const cats = await getManyCategories(catFilters)

            const productIds = cats?.flatMap((cat) => cat?.productIds?.map(item => item?._id)) ?? []

            filters._id = { $in: productIds }
        }

        const paginatedResult = await getAllProducts({ filters, advancedFilters, sort, page, entries });
        const totalEntries = await getProductCount(filters, advancedFilters)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: paginatedResult, pagination: { totalEntries } },
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


export const createVariationCtrl = async (req, res) => {
    try {
        const { name, options = [] } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Data',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const existingVariation = await getManyVariation({ name })
        if (existingVariation?.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Variation already exists',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const variation = await createVariation({ name, options })

        if (!variation) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: variation },
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

export const getOneVariationCtrl = async (req, res) => {
    try {
        const { variationId } = req.params;

        const variation = await getOneVariation(variationId)

        if (!variation) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: variation },
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

export const getManyVariationCtrl = async (req, res) => {
    try {
        let { page, entries, search } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)

        const filters = {}

         if (search?.trim()) {
            filters.name = new RegExp(search, 'i')
        }

        let result = await getManyVariation(filters)

        const total = result?.length;

        if (page && entries) {
            result = result.slice((page - 1) * entries, page * entries)
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result, pagination: { totalEntries: total } },
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

export const updateVariationCtrl = async (req, res) => {
    try {
        const { variationId } = req.params;
        const { name, options } = req.body;

        const existingVariation = await getManyVariation({ name })
        if (existingVariation?.length > 0 && existingVariation[0]?._id?.toString() !== variationId) {
            return res.status(400).json({
                success: false,
                message: 'Variation already exists',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const variation = await updateVariation(variationId, { name, options })

        if (!variation) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: variation },
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

export const deleteVariationCtrl = async (req, res) => {
    try {
        const { variationId } = req.params;

        const variation = await deleteVariation(variationId)

        if (!variation) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: null,
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


export const createOptionCtrl = async (req, res) => {
    try {
        const { value } = req.body;
        if (!value?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Data',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const existingOption = await getManyOption({ value })
        if (existingOption?.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Option already exists',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const option = await createOption({ value })

        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: option },
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

export const getOneOptionCtrl = async (req, res) => {
    try {
        const { optionId } = req.params;

        const option = await getOneOption(optionId)

        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: option },
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

export const getManyOptionCtrl = async (req, res) => {
    try {
        let { page, entries, search } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)

        const filters = {}

        if (search?.trim()) {
            filters.value = new RegExp(search, 'i')
        }

        let result = await getManyOption(filters)

        const total = result?.length;

        if (page && entries) {
            result = result.slice((page - 1) * entries, page * entries)
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result, pagination: { totalEntries: total } },
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

export const updateOptionCtrl = async (req, res) => {
    try {
        const { optionId } = req.params;
        const { value } = req.body;

        const existingOption = await getManyOption({ value })
        if (existingOption?.length > 0 && existingOption[0]?._id?.toString() !== optionId) {
            return res.status(400).json({
                success: false,
                message: 'Option already exists',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const option = await updateOption(optionId, { value })

        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { result: option },
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

export const deleteOptionCtrl = async (req, res) => {
    try {
        const { optionId } = req.params;

        const option = await deleteOption(optionId)

        if (!option) {
            return res.status(400).json({
                success: false,
                message: 'failed',
                data: null,
                error: 'FAILED'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: null,
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

import { Product } from "../models/product.model.js";
import { Variation } from "../models/variation.model.js";
import { Option } from "../models/option.model.js";

export const createProduct = async (obj = {}) => {
    return await Product.create(obj);
}

export const getProductById = async (id) => {
    return await Product.findById(id)
        .populate("variantItems.specs.variationId", "name")
        .populate("variantItems.specs.optionId", "value")
        .lean()
}

export const getManyProducts = async (filters = {}, project = {}) => {
    return await Product.find(filters, project)
        .populate("variantItems.specs.variationId", "name")
        .populate("variantItems.specs.optionId", "value")
        .sort({ createdAt: -1 })
        .lean()
}

export const getAllProducts = async ({
    filters = {},
    advancedFilters = {},
    sort = { createdAt: -1 },
    page,
    entries,
} = {}) => {
    const pipeline = [];

    pipeline.push({
        $match: {
            ...filters,
            ...advancedFilters,
        },
    });

    pipeline.push({
        $addFields: {
            stock: { $sum: "$variantItems.stock" }
        },
    });

    pipeline.push({ $sort: sort });

    if (page && entries) {
        pipeline.push({ $skip: (page - 1) * entries });
        pipeline.push({ $limit: entries });
    }

    pipeline.push(
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "productIds",
                as: "categories"
            }
        },
        {
            $addFields: {
                category: {
                    $ifNull: [{ $arrayElemAt: ["$categories.name", 0] }, null]
                }
            }
        },
        {
            "$unset": "categories"
        },
        {
            $lookup: {
                from: "variations",
                localField: "variantItems.specs.variationId",
                foreignField: "_id",
                as: "variantSpecsVariation"
            }
        },
        {
            $lookup: {
                from: "options",
                localField: "variantItems.specs.optionId",
                foreignField: "_id",
                as: "variantSpecsOption"
            }
        }
    );

    return await Product.aggregate(pipeline);
};


export const getProductCount = async (filters = {}, advancedFilters = {}) => {
    console.log(filters, advancedFilters);

    const pipeline = [];

    pipeline.push({
        $match: {
            ...filters,
            ...advancedFilters,
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            count: { $sum: 1 }
        }
    });

    const result = await Product.aggregate(pipeline);
    return result.length > 0 ? result[0].count : 0;
}

export const updateProduct = async (id, obj = {}) => {
    return await Product.findByIdAndUpdate(id, {
        $set: obj
    }, { new: true })
}

export const updateProductStatus = async (id, isArchived) => {
    return await Product.findByIdAndUpdate(id, {
        $set: { isArchived }
    }, { new: true })
}

export const decrementProductQty = async (cart) => {
    const productUpdates = cart.map(async (item) => {
        const productId = item?.productId;
        const quantityToSell = item?.quantity;

        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product ${productId} not found`);
            return;
        }

        let remainingQuantity = quantityToSell;

        if (product.variantItems.length > 0) {

            for (let item of product.variantItems) {
                if (remainingQuantity === 0) break;

                if (item.stock >= remainingQuantity) {
                    item.stock -= remainingQuantity;
                    remainingQuantity = 0;
                } else {
                    remainingQuantity -= item.stock;
                    item.stock = 0;
                }
            }
        }

        if (remainingQuantity > 0) {
            console.log(`Not enough stock available for product ${productId}`);
            return;
        }

        await product.save();
        console.log(`Sold ${quantityToSell} units of product ${productId} successfully!`);
    });

    await Promise.all(productUpdates);
};



export const createVariation = async (obj) => {
    return await Variation.create(obj)
}

export const getOneVariation = async (id) => {
    return await Variation.findById(id)
        .populate('options', 'value')
}

export const getManyVariation = async (filters) => {
    return await Variation.find(filters)
        .populate('options', 'value')
}

export const updateVariation = async (id, obj) => {
    return await Variation.findByIdAndUpdate(id, { $set: obj }, { new: true })
}

export const deleteVariation = async (id) => {
    return await Variation.findByIdAndDelete(id)
}


export const createOption = async (obj) => {
    return await Option.create(obj)
}

export const getOneOption = async (id) => {
    return await Option.findById(id)
}

export const getManyOption = async (filters) => {
    return await Option.find(filters)
}

export const updateOption = async (id, obj) => {
    return await Option.findByIdAndUpdate(id, { $set: obj }, { new: true })
}

export const deleteOption = async (id) => {
    return await Option.findByIdAndDelete(id)
}

export const stockChecker = async (items) => {
    for (const item of items) {
        const product = await Product.findById(item.productId);
        const productStock = await getProductStock(item.productId)

        if (!product) {
            return { success: false, reason: 'Product not found', productId: item.productId };
        }
        if (productStock < item.quantity) {
            return { success: false, reason: 'Insufficient stock', productId: item.productId, availableStock: productStock };
        }
    }

    return { success: true };
};


export const addExtrasNTaxToPrice = (item) => {
    const extraCharges = item.variantItems?.reduce((acc, elem) => acc + (elem?.extraPrice || 0), 0) || 0;
    const basePrice = item.price + extraCharges;
    const taxRate = item.tax || 0;
    const finalPrice = basePrice * (1 + taxRate / 100);
    return {
        ...item,
        finalPrice: Number(finalPrice.toFixed(2)),
    };
}


export const getProductStock = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) return 0;

    const totalStock = product.variantItems.reduce((sum, item) => sum + item.stock, 0);
    return totalStock;
};


export const checkIfVariantExists = async (productId, specs = []) => {
    const product = await Product.findById(productId).lean();
    if (!product) return null;

    const { variantItems = [] } = product;

    const normalizeSpecs = (specArr) =>
        [...specArr].sort((a, b) => a.variationId.toString().localeCompare(b.variationId.toString()));

    const inputSpecs = normalizeSpecs(specs.map(spec => ({
        variationId: spec.variationId.toString(),
        optionId: spec.optionId.toString(),
    })));

    const matchingVariant = variantItems.find(variant => {
        const variantSpecs = normalizeSpecs(
            (variant.specs || []).map(spec => ({
                variationId: spec.variationId.toString(),
                optionId: spec.optionId.toString(),
            }))
        );

        if (variantSpecs.length !== inputSpecs.length) return false;

        return variantSpecs.every((vSpec, idx) =>
            vSpec.variationId === inputSpecs[idx].variationId &&
            vSpec.optionId === inputSpecs[idx].optionId
        );
    });

    return !!matchingVariant;
};


export const getBuyNowItem = async (productId, quantity = 1, specs = []) => {
    const existingVariation = await checkIfVariantExists(productId, specs);
    if (!existingVariation) {
        return null;
    }

    const [product, variationDocs, optionDocs] = await Promise.all([
        Product.findById(productId),
        Variation.find({ _id: { $in: specs.map(v => v.variationId) } }),
        Option.find({ _id: { $in: specs.map(v => v.optionId) } })
    ]);

    if (!product) return null;

    const variationMap = new Map(variationDocs.map(v => [v._id.toString(), v.name]));
    const optionMap = new Map(optionDocs.map(o => [o._id.toString(), o.value]));

    const productStock = await getProductStock(productId)

    let stockStatus = 'AVAILABLE'

    if (productStock <= 0) {
        stockStatus = 'OUT_OF_STOCK'
    }
    else if (productStock < item.quantity) {
        stockStatus = 'INSUFFICIENT'
    }

    return {
        productId,
        quantity,
        name: product.name || "Unknown Product",
        price: product.price || 0,
        extraPrice: product.extraPrice || 0,
        tax: product.tax || 0,
        thumbnail: product.thumbnail || null,
        specs: specs.map(({ variationId, optionId }) => {
            return {
                variationName: variationMap.get(variationId) || "Unknown Variation",
                optionValue: optionMap.get(optionId) || "Unknown Option",
            };
        }),
        stock: productStock,
        stockStatus,
    };
};

import { Address } from "../models/address.model.js";
import { Option } from "../models/option.model.js";
import { User } from "../models/user.model.js";
import { Variation } from "../models/variation.model.js";
import { hashPassword } from "../utils/password.util.js";
import _ from "lodash";

const normalizeSpecs = (specs) => {
    return specs
        .map(v => ({
            variationId: v.variationId.toString(),
            optionId: v.optionId.toString(),
            additionalPrice: v.additionalPrice
        }))
        .sort((a, b) => a.variationId.localeCompare(b.variationId));
};

export const getUserByEmail = async (email) => {
    return await User.findOne({ email }).lean();
}

export const getUserByMobile = async (mobile) => {
    return await User.findOne({ mobile }).lean();
}

export const getUserByGoogleId = async (sub) => {
    return await User.findOne({ googleId: sub }).lean();
}

export const getUserById = async (id) => {
    return await User.findById(id, { password: 0 }).lean();
}

export const getUserByIdDoc = async (id) => {
    return await User.findById(id, { password: 0 });
}


export const getManyUsers = async (filters = {}, project = {}, page, entries, sort, advancedFilters = {}) => {
    console.log({ advancedFilters })
    const projectStage = Object.keys(project).length
        ? { $project: { ...project, userOrders: 0 } }
        : { $project: { password: 0, __v: 0, userOrders: 0 } };

    const aggregationPipeline = [
        { $match: filters },
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'userId',
                as: 'userOrders'
            }
        },
        {
            $addFields: {
                orderCount: { $size: '$userOrders' },
                totalSpent: {
                    $sum: {
                        $map: {
                            input: '$userOrders',
                            as: 'order',
                            in: '$$order.amount'
                        }
                    }
                }
            }
        },
    ];

    if (Object.keys(advancedFilters).length) {
        aggregationPipeline.push({ $match: advancedFilters });
    }

    aggregationPipeline.push(
        projectStage,
        { $sort: sort || { firstName: 1, lastName: 1 } }
    );

    if (Number.isFinite(page) && Number.isFinite(entries) && entries > 0) {
        const skipCount = (page - 1) * entries;
        aggregationPipeline.push(
            { $skip: skipCount },
            { $limit: entries }
        );
    }

    console.log({ aggregationPipeline });

    return await User.aggregate(aggregationPipeline);
};


export const createUser = async (createObj) => {
    return await User.create(createObj)
}

export const updateUser = async (id, updateObj) => {
    return await User.findByIdAndUpdate(id, {
        $set: updateObj
    }, { new: true }).lean()
}

export const updateUserStatus = async (id, isBlocked) => {
    return await User.findByIdAndUpdate(id, {
        $set: { isBlocked }
    }, { new: true }).lean()
}

export const updatePassword = async (id, password) => {
    const hashedPassword = await hashPassword(password)
    return await User.findByIdAndUpdate(id, {
        $set: { password: hashedPassword }
    }, { new: true }).lean()
}


export const countUsers = async (filters = {}, project = {}) => {
    return await User.countDocuments(filters, project)
}


// Cart
export const addToCart = async (userId, productId, quantity, specs = []) => {
    const user = await User.findById(userId)

    if (!user) {
        throw new Error('User not found')
    }

    const existingItemIndex = user.cart?.findIndex(item =>
        item.productId.toString() === productId &&
        _.isEqual(normalizeSpecs(item.specs), normalizeSpecs(specs))
    );

    if (existingItemIndex > -1) {
        user.cart[existingItemIndex].quantity += quantity;
    } else {
        user.cart.push({ productId, quantity, specs })
    }

    await user.save();
    return user.cart
}

export const setCart = async (userId, cart) => {
    const user = await User.findById(userId)

    if (!user) {
        throw new Error('User not found')
    }

    if (!Array.isArray(cart)) {
        throw new Error('Invalid cart data');
    }

    for (let item of cart) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
            throw new Error('Invalid item in cart');
        }
    }

    user.cart = cart;

    await user.save();
    return user.cart
}

export const updateCart = async (userId, itemId, quantity) => {
    if (quantity < 1) {
        throw new Error("QUANTITY_CANNOT_BE_LESS_THAN_ONE");
    }

    const user = await User.findById(userId)

    const itemIndex = user.cart.findIndex(item =>
        item._id.toString() === itemId
    );

    if (itemIndex > -1) {
        user.cart[itemIndex].quantity = quantity;
    } else {
        throw new Error("ITEM_NOT_IN_CART")
    }

    await user.save();
    return user.cart
}


export const getCart = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'cart.productId',
            select: 'name price thumbnail tax variantItems'
        })
        .lean();

    if (!user || !user.cart) return [];

    const variationIds = user.cart.flatMap(item => item.specs.map(s => s.variationId));
    const optionIds = user.cart.flatMap(item => item.specs.map(s => s.optionId));

    const [variations, options] = await Promise.all([
        Variation.find({ _id: { $in: variationIds } }, 'name').lean(),
        Option.find({ _id: { $in: optionIds } }, 'value').lean()
    ]);

    const variationMap = new Map(variations.map(v => [v._id.toString(), v.name]));
    const optionMap = new Map(options.map(o => [o._id.toString(), o.value]));

    const cart = user.cart.map(item => {
        const product = item?.productId || {};
        const variantItems = product?.variantItems || [];

        const itemSpecString = JSON.stringify(
            item.specs.map(s => ({
                variationId: s.variationId.toString?.() || s.variationId,
                optionId: s.optionId.toString?.() || s.optionId,
            })).sort((a, b) => a.variationId.localeCompare(b.variationId))
        );

        const varItem = variantItems.find(vi =>
            JSON.stringify(
                (vi.specs || []).map(s => ({
                    variationId: s.variationId.toString(),
                    optionId: s.optionId.toString(),
                })).sort((a, b) => a.variationId.localeCompare(b.variationId))
            ) === itemSpecString
        );

        const productStock = variantItems.reduce((sum, vi) => sum + (vi?.stock || 0), 0);

        let stockStatus = 'AVAILABLE';
        if (productStock <= 0) stockStatus = 'OUT_OF_STOCK';
        else if (productStock < item.quantity) stockStatus = 'INSUFFICIENT';

        const specs = item.specs.map(s => ({
            variationId: s.variationId?.toString?.() || s.variationId,
            optionId: s.optionId?.toString?.() || s.optionId,
            variationName: variationMap.get(s.variationId.toString()) || 'Unknown',
            optionValue: optionMap.get(s.optionId.toString()) || 'Unknown',
        }));

        return {
            _id: item?._id,
            productId: product._id || null,
            quantity: item?.quantity || 1,
            name: product.name || "Unknown Product",
            price: product.price || 0,
            extraPrice: varItem?.extraPrice || 0,
            tax: product.tax || 0,
            thumbnail: product.thumbnail || null,
            specs,
            stockStatus,
        };
    });

    return cart;
};


export const removeFromCart = async (userId, itemId) => {
    const user = await User.findById(userId);
    if (!user || !Array.isArray(user?.cart)) throw new Error("Cart not found");

    const itemIndex = user.cart.findIndex(item => item._id.toString() === itemId);

    if (itemIndex > -1) {
        user.cart.splice(itemIndex, 1);
    } else {
        const errorMessage = {
            statusCode: 404,
            success: false,
            message: "Item not found in cart",
            data: null,
            error: 'NOT_FOUND'
        }

        throw new Error(JSON.stringify(errorMessage));
    }

    await user.save();
    return user.cart;
};

export const clearCart = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found')
    }
    if (!Array.isArray(user.cart)) {
        throw new Error('Cart not found');
    }
    user.cart = [];

    await user.save();
    return user.cart;
};


// Wishlist
export const addToWishlist = async (userId, productId) => {
    const user = await User.findById(userId)

    if (user.wishlist.map(item => item.toString()).includes(productId)) {
        const errorMessage = {
            statusCode: 400,
            success: false,
            message: "Product already in wishlist",
            data: null,
            error: 'BAD_REQUEST'
        }

        throw new Error(JSON.stringify(errorMessage));
    }

    user.wishlist.push(productId)

    await user.save();

    return user.wishlist;
}

export const getWishlist = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'wishlist',
            select: 'name price thumbnail tax variantItems',
            populate: [
                {
                    path: 'variantItems.specs.variationId',
                    select: 'name'
                },
                {
                    path: 'variantItems.specs.optionId',
                    select: 'value'
                }
            ]
        })
        .lean();
    if (!user || !user.wishlist) return [];
    return user.wishlist;
}

export const removeFromWishlist = async (userId, productId) => {
    const user = await User.findById(userId)

    if (!user || !Array.isArray(user?.wishlist)) throw new Error("Wishlist not found");

    if (!user.wishlist.map(item => item.toString()).includes(productId)) {
        const errorMessage = {
            statusCode: 400,
            success: false,
            message: "Product is not in wishlist",
            data: null,
            error: 'BAD_REQUEST'
        }

        throw new Error(JSON.stringify(errorMessage));
    }
    const itemIndex = user.wishlist.findIndex(item => item.toString() === productId);
    if (itemIndex <= -1) {
        const errorMessage = {
            statusCode: 404,
            success: false,
            message: "Item not found in wishlist",
            data: null,
            error: 'NOT_FOUND'
        }

        throw new Error(JSON.stringify(errorMessage));
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { wishlist: productId } },
        { new: true }
    );

    return updatedUser?.wishlist || [];
};

export const fetchManyAddress = async (filters) => {
    return await Address.find(filters)
}

export const fetchOneAddress = async (filters) => {
    return await Address.findOne(filters)
}


export const fetchSingleAddress = async (id) => {
    return await Address.findById(id)
}

export const createAddress = async (obj) => {
    return await Address.create(obj)
}

export const updateAddress = async (id, obj) => {
    return await Address.findByIdAndUpdate(id, {
        $set: obj
    }, { new: true })
}

export const deleteAddress = async (id) => {
    return await Address.findByIdAndDelete(id)
}


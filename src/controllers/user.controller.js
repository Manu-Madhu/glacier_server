import { isValidObjectId } from "mongoose";
import { genderList, userRoleList } from "../config/data.js";
import { OTPVerificationStatus, validateOTPWithEmail, validateOTPWithMobile } from "../services/auth.service.js";
import {
    addToCart, addToWishlist, countUsers, createAddress, createUser, deleteAddress,
    fetchManyAddress, fetchOneAddress, fetchSingleAddress, getCart, getManyUsers,
    getUserByEmail, getUserById, getUserByMobile, getWishlist, removeFromCart,
    removeFromWishlist, setCart, updateAddress, updateCart, updateUser,
    updateUserStatus
} from "../services/user.service.js";
import { hashPassword } from "../utils/password.util.js";
import { validateEmail, validateMobile } from "../utils/validate.util.js";
import { checkIfVariantExists, getProductById } from "../services/product.service.js";
import { findManyOrders } from "../services/order.service.js";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const registerUserCtrl = async (req, res) => {
    try {
        const { firstName, lastName, gender,
            email, mobile, password, credType, otp } = req.body;

        if (!otp?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required',
                data: null,
                error: "INVALID_DATA"
            });
        }

        if (!['email', 'mobile']?.includes(credType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credential type',
                data: null,
                error: "INVALID_DATA"
            });
        }

        let validOtp;
        let existingUser;
        if (credType === 'mobile') {
            validOtp = await validateOTPWithMobile({ mobile, otp });
            existingUser = await getUserByMobile(mobile)
        }
        else if (credType === 'email') {
            validOtp = await validateOTPWithEmail({ email, otp });
            existingUser = await getUserByEmail(email)
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists',
                data: null,
                error: null,
            })
        }

        if (validOtp) {
            const isOTPVerified = await OTPVerificationStatus(validOtp?._id)

            if (!isOTPVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP is not verified',
                    data: null,
                    error: "UNVERIFIED_OTP"
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
                data: null,
                error: "INVALID_DATA"
            });
        }

        if (!firstName?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Firstname is required',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const createObj = {
            firstName, lastName, role: 'user', credType
        }

        if (genderList?.includes(gender)) {
            createObj.gender = gender
        }

        if (validateMobile(mobile)) {
            createObj.mobile = mobile;
        }

        if (validateEmail(email)) {
            createObj.email = email;
        }


        if (password?.trim()) {
            const hashedPassword = await hashPassword(password)
            createObj.password = hashedPassword
        }

        const user = await createUser(createObj)

        if (!user) {
            throw new Error('FAILED')
        }

        // const { password: pwd, ...userInfo } = user?.toObject()

        return res.status(201).json({
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


// Accessible to user
export const getUserProfileByIdCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const user = await getUserById(userId)

        if (!user) {
            throw new Error('FAILED')
        }

        const { password, ...userInfo } = user

        const filters = { userId }

        const addresses = await fetchManyAddress(filters)

        return res.status(201).json({
            success: true,
            message: 'success',
            data: { user: userInfo, addresses },
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

// Access to Admin only
export const createUserCtrl = async (req, res) => {
    try {
        const { firstName, lastName, gender,
            email, mobile, password } = req.body;


        if (!firstName?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Firstname is required',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const createObj = {
            firstName, lastName, role: 'user'
        }

        if (genderList?.includes(gender)) {
            createObj.gender = gender
        }

        if (validateMobile(mobile)) {
            createObj.mobile = mobile;
        }

        if (validateEmail(email)) {
            createObj.email = email;
        }


        if (password?.trim()) {
            const hashedPassword = await hashPassword(password)
            createObj.password = hashedPassword
        }

        const user = await createUser(createObj)

        if (!user) {
            throw new Error('FAILED')
        }

        return res.status(201).json({
            success: true,
            message: 'success',
            data: { user },
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

export const updateUserCtrl = async (req, res) => {
    try {
        let { userId } = req.body;

        if (!userId || !isValidObjectId(userId)) {
            userId = req.user.userId
        }

        const { firstName, lastName, gender, email, mobile, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const indianNumberRegex = /^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/;

        const updateObj = {}

        if (firstName?.trim()) {
            updateObj.firstName = firstName;
        }

        if (lastName?.trim()) {
            updateObj.lastName = lastName;
        }

        if (genderList?.includes(gender)) {
            updateObj.gender = gender
        }

        if (emailRegex.test(email)) {
            updateObj.email = email;
        }

        if (indianNumberRegex.test(mobile)) {
            updateObj.mobile = mobile;
        }

        if (password?.trim()) {
            console.log({ password })

            const hashedPassword = await hashPassword(password)
            updateObj.password = hashedPassword
        }

        const user = await updateUser(userId, updateObj)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: null,
                error: 'USER_NOT_FOUND'
            })
        }

        const { password: pwd, ...userInfo } = user

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { user: userInfo },
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

export const updateUserStatusCtrl = async (req, res) => {
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
        if (!['blocked', 'unblocked']?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        let isBlocked;
        if (status === 'blocked') {
            isBlocked = true;
        }
        else {
            isBlocked = false;
        }

        const user = await updateUserStatus(id, isBlocked)

        if (!user) {
            throw new Error('FAILED')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { user },
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


export const getUserByIdCtrl = async (req, res) => {
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

        const user = await getUserById(id)
        const address = await fetchOneAddress({ userId: user?._id })
        const orderHistory = await findManyOrders({ userId: user?._id })

        if (!user) {
            throw new Error('User not found')
        }

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { user, address, orderHistory },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error?.message || "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}



export const getManyUsersCtrl = async (req, res) => {
    try {
        let { page, entries } = req.query;
        page = parseInt(page);
        entries = parseInt(entries)
        const { gender, status, search, sortBy, sortOrder, fromDate, toDate, minOrders, maxOrders, minSpent, maxSpent } = req.query;

        const filters = { role: 'user' };

        const advancedFilters = {};

        const createdAtFilter = {};

        if (fromDate) {
            createdAtFilter.$gte = dayjs.tz(fromDate, 'Asia/Kolkata').startOf('day').toDate();
        }

        if (toDate) {
            createdAtFilter.$lte = dayjs.tz(toDate, 'Asia/Kolkata').endOf('day').toDate();
        }

        if (Object.keys(createdAtFilter).length) {
            advancedFilters.createdAt = createdAtFilter;
        }

        const orderCountFilter = {};
        if (Number.isFinite(parseInt(minOrders))) orderCountFilter.$gte = parseInt(minOrders);
        if (Number.isFinite(parseInt(maxOrders))) orderCountFilter.$lte = parseInt(maxOrders);
        if (Object.keys(orderCountFilter).length) {
            advancedFilters.orderCount = orderCountFilter;
        }

        const totalSpentFilter = {};
        if (Number.isFinite(parseFloat(minSpent))) totalSpentFilter.$gte = parseFloat(minSpent);
        if (Number.isFinite(parseFloat(maxSpent))) totalSpentFilter.$lte = parseFloat(maxSpent);
        if (Object.keys(totalSpentFilter).length) {
            advancedFilters.totalSpent = totalSpentFilter;
        }


        if (genderList?.includes?.(gender)) {
            filters.gender = gender
        }

        let sort = { firstName: 1, lastName: 1 }
        if (['name', 'orders', 'spent']?.includes(sortBy) && ['asc', 'desc']?.includes(sortOrder)) {
            const sortNumber = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'name') {
                sort = { firstName: sortNumber, lastName: sortNumber }
            }
            else if (sortBy === 'orders') {
                sort = { orderCount: sortNumber }
            }
            else if (sortBy === 'spent') {
                sort = { totalSpent: sortNumber }
            }
        }
        else if (sortBy === 'createdAt' && ['asc', 'desc']?.includes(sortOrder)) {
            sort = { createdAt: sortOrder === 'asc' ? 1 : -1 }
        }

        if (search?.trim()) {
            filters.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
            ]
        }

        if (['blocked', 'unblocked']?.includes(status)) {
            filters.isBlocked = status === 'blocked';
        }

        console.log({ filters })
        const result = await getManyUsers(filters, {}, page, entries, sort, advancedFilters)
        console.log({ result })

        const totalEntries = await countUsers(filters)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: {
                users: result, pagination: {
                    totalEntries: totalEntries || 0,
                    totalPages: Math.ceil(totalEntries / (entries || result?.length)),
                    page: page || 1,
                    entries: entries || result?.length
                }
            },
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



export const setCartCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const { cart = [] } = req.body;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            });
        }

        if (!Array.isArray(cart)) {
            return res.status(400).json({
                success: false,
                message: 'Cart must be an array',
                data: null,
                error: 'BAD_REQUEST'
            });
        }

        const user = await getUserById(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
                data: null,
                error: 'BAD_REQUEST'
            });
        }

        for (const { productId, specs = [] } of cart) {
            if (!productId || !isValidObjectId(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID in cart item',
                    data: null,
                    error: 'BAD_REQUEST'
                });
            }

            const product = await getProductById(productId)

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product not found: ${productId}`,
                    data: null,
                    error: 'BAD_REQUEST'
                });
            }

            if (!Array.isArray(specs)) {
                return res.status(400).json({
                    success: false,
                    message: 'specs must be an array',
                    data: null,
                    error: 'BAD_REQUEST'
                });
            }

            if (specs?.length > 0) {
                const existingSpec = await checkIfVariantExists(productId, specs);
                if (!existingSpec) {
                    return res.status(400).json({
                        success: false,
                        message: `Spec doesn't exist in product: ${productId}`,
                        data: null,
                        error: 'BAD_REQUEST'
                    });
                }
            }
        }

        await setCart(userId, cart);
        const updatedCart = await getCart(userId);

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { cart: updatedCart },
            error: null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error?.message || "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};


export const addToCartCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const { productId, quantity, specs = [] } = req.body;

        if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const existingVariation = await checkIfVariantExists(productId, specs)

        if (!existingVariation) {
            return res.status(400).json({
                success: false,
                message: 'Variation doesn\'t exist in product',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        console.log({ userId, productId, quantity, specs })

        await addToCart(userId, productId, quantity, specs);

        const cart = await getCart(userId)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { cart },
            error: null
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error?.message || "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getCartCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const cart = await getCart(userId)
        res.status(200).json({
            success: true,
            message: 'success',
            data: { cart },
            error: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
};

export const updateCartCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const { itemId, quantity } = req.body;

        if (!isValidObjectId(userId) || !isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        await updateCart(userId, itemId, quantity);

        const cart = await getCart(userId)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { cart },
            error: null
        })

    } catch (error) {
        console.log(error)
        const msg = error?.message;

        return res.status(500).json({
            success: false,
            message: msg ?? "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const removeFromCartCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const { itemId } = req.body;

        if (!isValidObjectId(userId) || !isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        await removeFromCart(userId, itemId);

        const cart = await getCart(userId)

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { cart },
            error: null
        })

    } catch (error) {
        const errorObj = JSON.parse(error?.message)
        const { statusCode, ...rest } = errorObj

        return res.status(statusCode || 500).json(rest || {
            success: false,
            message: msg ?? "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}


export const addToWishlistCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const { productId } = req.body;

        if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const wishlist = await addToWishlist(userId, productId);

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { wishlist },
            error: null
        })

    } catch (error) {
        const errorObj = JSON.parse(error?.message)
        const { statusCode, ...rest } = errorObj

        return res.status(statusCode || 500).json(rest || {
            success: false,
            message: msg ?? "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getWishlistCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const wishlist = await getWishlist(userId)
        res.status(200).json({
            success: true,
            message: 'success',
            data: { wishlist },
            error: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
};

export const removeFromWishlistCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const { productId } = req.body;

        if (!isValidObjectId(userId) || !isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id',
                data: null,
                error: 'BAD_REQUEST'
            })
        }

        const wishlist = await removeFromWishlist(userId, productId);

        return res.status(200).json({
            success: true,
            message: 'success',
            data: { wishlist },
            error: null
        })

    } catch (error) {
        const errorObj = JSON.parse(error?.message)
        const { statusCode, ...rest } = errorObj

        return res.status(statusCode || 500).json(rest || {
            success: false,
            message: msg ?? "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}


export const getUserAddresssesCtrl = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Not Found',
                data: null,
                error: 'NOT_FOUND'
            })
        }

        const filters = { userId }

        const addresses = await fetchManyAddress(filters)

        return res.status(200).json({
            success: true,
            message: "success",
            data: { result: addresses },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getAllAddresssesCtrl = async (req, res) => {
    try {
        const filters = {}

        const addresses = await fetchManyAddress(filters)

        return res.status(200).json({
            success: true,
            message: "success",
            data: { addresses },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const getOneAddressCtrl = async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await fetchSingleAddress(addressId)

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Not Found',
                data: null,
                error: "NOT_FOUND"
            })
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: { address },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const postAddresssesCtrl = async (req, res) => {
    try {
        const { userId } = req.user;
        const createObj = req.body;

        const address = await createAddress({ ...createObj, userId })

        return res.status(200).json({
            success: true,
            message: "success",
            data: { address },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const updateAddresssesCtrl = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updateObj = req.body;

        const address = await updateAddress(addressId, updateObj)

        return res.status(200).json({
            success: true,
            message: "success",
            data: { address },
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}

export const deleteAddresssesCtrl = async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await deleteAddress(addressId)

        if (!address) {
            throw new Error('Failed')
        }

        return res.status(200).json({
            success: true,
            message: "success",
            data: null,
            error: null,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server error",
            data: null,
            error: 'INTERNAL_SERVER_ERROR'
        })
    }
}
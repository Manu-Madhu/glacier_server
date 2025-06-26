import { Schema, model } from 'mongoose';
import {  genderList, userRoleList } from '../config/data.js';

const UserSchema = new Schema({
    googleId: { type: String },

    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: genderList
    },
    email: {
        type: String,
        sparse: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    mobile: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
    },

    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],

    cart: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1,
            },

            specs: [
                {
                    variationId: { type: Schema.Types.ObjectId, ref: 'Variation' }, // e.g., 'Color', 'Size'
                    optionId: { type: Schema.Types.ObjectId, ref: 'Option' },
                }
            ]
        },
    ],

    role: { type: String, default: 'user', enum: userRoleList },

    isBlocked: { type: Boolean, default: false },

}, { timestamps: true })


export const User = model('User', UserSchema)
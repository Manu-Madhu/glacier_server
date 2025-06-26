import { model, Schema } from "mongoose";
import { genderList, userRoleList } from "../config/data.js";

const UserSchema = new Schema(
  {
    googleId: { type: String },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      trim: true
    },

    gender: {
      type: String,
      enum: genderList
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true
    },

    password: {
      type: String
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      default: "user",
      enum: userRoleList
    },

    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product"
      }
    ],

    cart: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },

        specs: [
          {
            variationId: { type: Schema.Types.ObjectId, ref: "Variation" }, 
            optionId: { type: Schema.Types.ObjectId, ref: "Option" }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

export const User = model("User", UserSchema);

import { model, Schema } from "mongoose";
import { payModeList, payStatusList, orderStatusList, deliveryTypeList,
     buyModeList, refundStatusList } from "../config/data.js";

const OrderSchema = new Schema(
  {
    payMode: {
      type: String,
      enum: payModeList,
      required: true
    },

    transactionId: { type: String },

    refundTransactionId: { type: String },

    merchantOrderId: { type: String, required: true },
    pgOrderId: { type: String },

    merchantRefundId: { type: String },
    pgRefundId: { type: String },

    buyMode: {
      type: String,
      enum: buyModeList,
      required: true
    },

    couponCode: { type: String },

    payStatus: {
      type: String,
      enum: payStatusList,
      default: 'pending'
    },

    refundStatus: {
      type: String,
      enum: refundStatusList,
      default: 'none'
    },

    status: {
      type: String,
      enum: orderStatusList,
      default: 'processing',
    },

    totalTax: { type: Number },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    subTotal: { type: Number, required: true },
    amount: { type: Number, required: true },

    refundAmount: { type: Number },

    orderDate: { type: Date, default: Date.now, index: true },
    expectedDelivery: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 }, // 7 Days 

    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },

        name: { type: String },
        price: { type: Number, required: true },
        extraPrice: { type: Number, default: 0 },
        tax: { type: Number, default: 0, min: 0 },
        thumbnail: {
          type: {
            location: {
              type: String,
            },
            name: {
              type: String,
            },
            key: {
              type: String,
            },
          }
        },

        specs: [
          {
            variationName: { type: String },
            optionValue: { type: String },
          }
        ]
      },
    ],

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },


    billAddress: { type: Schema.Types.ObjectId, ref: "Address" },
    shipAddress: { type: Schema.Types.ObjectId, ref: "Address", required: true },

    deliveryType: { type: String, enum: deliveryTypeList, default: 'Standard' },

    waybill: { type: String }, // <= a.k.a Tracking id
    delivered_on: { type: Date },

    deliveryPartner: { type: String }

  },
  { timestamps: true }
);

export const Order = model("Order", OrderSchema);
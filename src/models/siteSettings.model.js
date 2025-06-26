import { model, Schema } from "mongoose";

const SiteSettingsSchema = new Schema({
    _id: { type: String, default: 'default' }, 
    storeName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        trim: true
    },

    address: { type: String, required: true },

    logo: {
        name: { type: String },
        key: { type: String },
        location: { type: String }
    },

    socialLinks: {
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        youtube: { type: String }
    },

    supportHours: {
        from: { type: String },
        to: { type: String }
    },

    isUnderMaintenance: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export const SiteSettings = model("SiteSettings", SiteSettingsSchema);

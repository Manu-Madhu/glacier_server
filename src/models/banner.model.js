import { model, Schema } from "mongoose";

const bannerSchema = new Schema({
    title: { type: String },
    subtitle: { type: String },
    panel: { type: String, required: true, default: 'home' },
    index: { type: Number, required: true , default: 0 },
    screenType: { type: String, enum: ['mobile', 'desktop'], default: 'desktop', required: true },
    image: {
        type: {
            name: { type: String },
            key: { type: String, required: true },
            location: { type: String, required: true },
        }
    },
    buttonText: { type: String },
    buttonLink: { type: String },
}, {timestamps: true});


export const Banner = model('Banner', bannerSchema);

import { model, Schema } from "mongoose";

const VariationSchema = new Schema({
    name: { type: String, trim: true, unique: true },
    options: [{ type: Schema.Types.ObjectId, ref:'Option' }]
})

export const Variation = model("Variation", VariationSchema);
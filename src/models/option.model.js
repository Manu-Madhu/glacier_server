import { model, Schema } from "mongoose";

const OptionSchema = new Schema({
   value: { type: String, trim: true, unique: true }
})

export const Option = model("Option", OptionSchema);
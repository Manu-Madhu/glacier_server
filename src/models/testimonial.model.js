import { model, Schema } from "mongoose";

const TestimonialSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    designation: { type: String, default: 'customer' },
    content: { type: String, required: true, trim: true },
    image: {
        type: {
            name: { type: String },
            key: { type: String },
            location: { type: String },
        }
    },
})

const Testimonial = model('Testimonial', TestimonialSchema);

export { Testimonial };
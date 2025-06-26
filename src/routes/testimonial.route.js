import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { testimonialValidator } from "../validators/testimonial.validator.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { Router } from "express";
import { createTestimonialCtrl, deleteTestimonialCtrl, getManyTestimonialsCtrl, getTestimonialByIdCtrl, updateTestimonialCtrl } from "../controllers/testimonial.controller.js";

const testimonialRouter = Router();

testimonialRouter.get('', getManyTestimonialsCtrl);
testimonialRouter.get('/:id', getTestimonialByIdCtrl);
testimonialRouter.post('', testimonialValidator, validateMW, createTestimonialCtrl);

testimonialRouter.use(authMiddleware)
testimonialRouter.use(roleChecker(['admin']))

testimonialRouter.put('/:id', testimonialValidator, validateMW, updateTestimonialCtrl);
testimonialRouter.delete('/:id', deleteTestimonialCtrl);

export { testimonialRouter };
import { Router } from "express";
import { validateMW } from "../middlewares/validate.middleware.js";
import { categoryValidator } from "../validators/category.validator.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { createCategoryCtrl, getAllCategoriesCtrl, getCategoryByIdCtrl, getManyCategoriesCtrl, updateCategoryCtrl, updateCategoryStatusCtrl } from "../controllers/category.controller.js";

export const categoryRouter = Router();

categoryRouter.get('/all', authMiddleware, roleChecker(['admin']), getAllCategoriesCtrl);
categoryRouter.get('/many', getManyCategoriesCtrl);
categoryRouter.get('/:id', getCategoryByIdCtrl);

categoryRouter.use(authMiddleware)
categoryRouter.use(roleChecker(['admin']))

categoryRouter.post('/', categoryValidator.create, validateMW, createCategoryCtrl);
categoryRouter.put('/:id', categoryValidator.update, validateMW, updateCategoryCtrl);
categoryRouter.patch('/:id', updateCategoryStatusCtrl);
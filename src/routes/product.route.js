import { Router } from "express";
import { validateMW } from "../middlewares/validate.middleware.js";
import { productValidator } from "../validators/product.validator.js";
import { createOptionCtrl, createProductCtrl, createVariationCtrl, deleteOptionCtrl, 
    deleteVariationCtrl, getAllProductsCtrl, getManyOptionCtrl, getManyProductsCtrl, 
    getManyVariationCtrl, getOneOptionCtrl, getOneVariationCtrl, getProductByIdCtrl, 
    updateOptionCtrl, updateProductCtrl, updateProductStatusCtrl, updateVariationCtrl 
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { validateVariation } from "../validators/variation.validator.js";
import { validateOption } from "../validators/option.validator.js";

export const productRouter = Router();

productRouter.get('/options', getManyOptionCtrl)
productRouter.get('/options/:optionId', getOneOptionCtrl)

productRouter.get('/variations', getManyVariationCtrl)
productRouter.get('/variations/:variationId', getOneVariationCtrl)

productRouter.get('/all', authMiddleware, roleChecker(['admin']), getAllProductsCtrl);
productRouter.get('/many', getManyProductsCtrl);
productRouter.get('/:id', getProductByIdCtrl);

productRouter.use(authMiddleware)
productRouter.use(roleChecker(['admin']))

productRouter.post('/options', validateOption.create, validateMW, createOptionCtrl)
productRouter.put('/options/:optionId', validateOption.update, validateMW, updateOptionCtrl)
productRouter.delete('/options/:optionId', deleteOptionCtrl)

productRouter.post('/variations', validateVariation.create, validateMW, createVariationCtrl)
productRouter.put('/variations/:variationId', validateVariation.update, validateMW, updateVariationCtrl)
productRouter.delete('/variations/:variationId', deleteVariationCtrl)


productRouter.post('/', productValidator.create, validateMW, createProductCtrl);
productRouter.put('/:id', productValidator.update, validateMW, updateProductCtrl);
productRouter.patch('/:id', updateProductStatusCtrl);
import { Router } from "express";

export const logisticsRouter = Router();
import {
    createShippingCostCtrl,
    getShippingCostByIdCtrl,
    getAllShippingCostsCtrl,
    updateShippingCostCtrl,
    deleteShippingCostCtrl,
    updateShipCostStatusCtrl,
    getManyShippingCostsCtrl,
    updateManyShippingCostCtrl
} from "../controllers/logistics.controller.js";

import { shipCostValidator } from "../validators/logistics.validator.js";

import { validateMW } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";

logisticsRouter.get('/ship-costs/all', authMiddleware, roleChecker(["admin"]), getAllShippingCostsCtrl);
logisticsRouter.get('/ship-costs/many', getManyShippingCostsCtrl);
logisticsRouter.get('/ship-costs/:id', getShippingCostByIdCtrl);

logisticsRouter.use(authMiddleware)

logisticsRouter.post('/ship-costs', shipCostValidator.create, validateMW, createShippingCostCtrl);
logisticsRouter.put('/ship-costs/all',  updateManyShippingCostCtrl);
logisticsRouter.put('/ship-costs/:id', shipCostValidator.update, validateMW, updateShippingCostCtrl);
logisticsRouter.delete('/ship-costs/:id', deleteShippingCostCtrl);
logisticsRouter.patch('/ship-costs/:id', updateShipCostStatusCtrl);



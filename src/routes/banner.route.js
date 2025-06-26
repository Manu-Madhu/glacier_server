import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { bannerCreateValidator, bannerUpdateValidator } from "../validators/banner.validator.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { createBannerCtrl, deleteBannerCtrl, getBannerByIdCtrl, getManyBannersCtrl, updateBannerCtrl } from "../controllers/banner.controller.js";

const bannerRouter = Router();

bannerRouter.get('', getManyBannersCtrl);
bannerRouter.get('/:id', getBannerByIdCtrl);

bannerRouter.use(authMiddleware)
bannerRouter.use(roleChecker(['admin']))

bannerRouter.post('', bannerCreateValidator, validateMW, createBannerCtrl);
bannerRouter.put('/:id', bannerUpdateValidator, validateMW, updateBannerCtrl);
bannerRouter.delete('/:id', deleteBannerCtrl);

export { bannerRouter };
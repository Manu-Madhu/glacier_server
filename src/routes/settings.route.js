import { Router } from "express";
import { validateSiteSettings } from "../validators/settings.validator.js";
import { siteSettingsCtrl, updateSiteSettingsCtrl } from "../controllers/settings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";

const router = Router();

router.get("/site", authMiddleware, siteSettingsCtrl);
router.put("/site", authMiddleware, roleChecker(['admin']), validateSiteSettings, validateMW, updateSiteSettingsCtrl);

export { router as settingsRouter };
import { Router } from "express";
import { dashboardCtrl, stockReportCtrl } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";

const dashboardRouter = Router();

dashboardRouter.use(authMiddleware)
dashboardRouter.use(roleChecker(['admin']))

dashboardRouter.get("", dashboardCtrl)

dashboardRouter.get("/reports/stocks", stockReportCtrl)

export { dashboardRouter }
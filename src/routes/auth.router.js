import { Router } from "express";
import { regenerateTokens, sendOTPHandler, userLogin } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", userLogin);
authRouter.post("/regenerate-token", regenerateTokens);
authRouter.post('/send-otp', sendOTPHandler)

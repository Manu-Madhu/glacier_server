import { userLogin, regenerateTokens, sendOTPHandler, 
    verifyOTPHandler, resetPassword, 
    googleHandler} from "../controllers/auth.controller.js";
import { ratelimiter } from "../middlewares/rateLimiter.middleware.js";

import { Router } from "express";

export const authRouter = Router()

authRouter.post('/login', userLogin)

authRouter.post("/google", googleHandler)

authRouter.post('/regenerate-token', regenerateTokens)

authRouter.post('/send-otp', ratelimiter, sendOTPHandler)
authRouter.post('/verify-otp', verifyOTPHandler)

// forgot password
authRouter.post('/reset-password', resetPassword)

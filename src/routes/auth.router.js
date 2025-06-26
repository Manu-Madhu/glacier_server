import { Router } from "express";
import { userLogin } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", userLogin);

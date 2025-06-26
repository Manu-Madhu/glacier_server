import { Router } from "express";
import { userValidator } from "../validators/user.validator";
import { validateMW } from "../middlewares/validate.middleware";

export const userRouter = Router();

userRouter.post('/register', userValidator.create, validateMW,  )
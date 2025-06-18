import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  try {
    return res.send("Halo a i am here")
  } catch (error) {
    console.log(error);
  }
});

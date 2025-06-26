import { Router } from "express";
import { addToCartCtrl, addToWishlistCtrl, createUserCtrl, deleteAddresssesCtrl, getAllAddresssesCtrl, getCartCtrl, getManyUsersCtrl, getOneAddressCtrl, getUserAddresssesCtrl, getUserByIdCtrl, getUserProfileByIdCtrl, getWishlistCtrl, postAddresssesCtrl, registerUserCtrl, removeFromCartCtrl, removeFromWishlistCtrl, setCartCtrl, updateAddresssesCtrl, updateCartCtrl, updateUserCtrl, updateUserStatusCtrl } from "../controllers/user.controller.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { userValidator } from "../validators/user.validator.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { addressValidator } from "../validators/address.validator.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";

export const userRouter = Router();

userRouter.post('/register', userValidator.create, validateMW, registerUserCtrl)

userRouter.use(authMiddleware)

userRouter.post("/wishlists/add", addToWishlistCtrl);
userRouter.post("/wishlists/remove", removeFromWishlistCtrl);

userRouter.post("/carts/set", setCartCtrl);
userRouter.post("/carts/add", addToCartCtrl);
userRouter.put("/carts/update", updateCartCtrl);
userRouter.post("/carts/remove", removeFromCartCtrl);

userRouter.get("/wishlists", getWishlistCtrl);
userRouter.get("/carts", getCartCtrl);

userRouter.post('/addresses', addressValidator.create, validateMW, postAddresssesCtrl)
userRouter.put('/addresses/:addressId', addressValidator.update, validateMW, updateAddresssesCtrl)
userRouter.delete('/addresses/:addressId', deleteAddresssesCtrl)

userRouter.get('/addresses/own', roleChecker(['user']), getUserAddresssesCtrl)
userRouter.get('/addresses/all', roleChecker(['admin']), getAllAddresssesCtrl)
userRouter.get('/addresses/:addressId', getOneAddressCtrl)

userRouter.get('/profile', roleChecker(['user']), getUserProfileByIdCtrl)
userRouter.put('', userValidator.update, validateMW, updateUserCtrl)

userRouter.use(roleChecker(['admin']))

userRouter.post('', userValidator.create, validateMW, createUserCtrl)
userRouter.patch('/:id', updateUserStatusCtrl)
userRouter.get('', getManyUsersCtrl)
userRouter.get('/:id', getUserByIdCtrl)

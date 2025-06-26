import {
    createReviewCtrl, deleteReviewCtrl, getAllReviewsCtrl,
    getManyReviewsCtrl, getReviewByIdCtrl, updateReviewCtrl,
    updateReviewStatusCtrl
} from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { reviewValidator } from "../validators/review.validator.js";
import { ownerChecker } from "../middlewares/ownerChecker.middleware.js";
import { Router } from "express";

const reviewRouter = Router();

reviewRouter.get('/all', authMiddleware, roleChecker(["admin"]), getAllReviewsCtrl);
reviewRouter.get('/many', getManyReviewsCtrl);
reviewRouter.get('/:id', getReviewByIdCtrl);

reviewRouter.use(authMiddleware)

reviewRouter.post('', reviewValidator.create, validateMW, ownerChecker("body", "userId"), createReviewCtrl);
reviewRouter.put('/:id', reviewValidator.update, validateMW, updateReviewCtrl);
reviewRouter.delete('/:id', deleteReviewCtrl);
reviewRouter.patch('/:id', updateReviewStatusCtrl)

export { reviewRouter };
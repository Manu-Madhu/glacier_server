import { Router } from "express";
import { postEnquiryCtrl, getManyEnquiryCtrl, 
    getEnquiryByIdCtrl, deleteEnquiryCtrl } from "../controllers/enquiry.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleChecker } from "../middlewares/roleChecker.middleware.js";
import { validateMW } from "../middlewares/validate.middleware.js";
import { validatePostEnquiry } from "../validators/enquiry.validator.js";

const enquiryRouter = Router();

enquiryRouter.post('', validatePostEnquiry, validateMW, postEnquiryCtrl)

enquiryRouter.use(authMiddleware)
enquiryRouter.use(roleChecker(['admin']))

enquiryRouter.get('', getManyEnquiryCtrl)
enquiryRouter.get('/:id', getEnquiryByIdCtrl)
enquiryRouter.delete('/:id', deleteEnquiryCtrl)

export { enquiryRouter }
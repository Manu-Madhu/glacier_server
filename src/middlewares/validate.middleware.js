import { validationResult } from "express-validator";

const validateMW = (req, res, next) => {
    const errors = validationResult(req);

    console.log({ error: errors.array().map(item => item.msg) })

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array().map(item => item.msg)?.join(', ').replaceAll('.', ', ')
        });
    }
    next();
};

export { validateMW }
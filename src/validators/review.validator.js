import { body } from 'express-validator';

const reviewValidator = {
    create: [
        body('productId')
            .notEmpty().withMessage('Product ID is required')
            .isMongoId().withMessage('Invalid Product ID'),

        body('rating')
            .optional()
            .notEmpty().withMessage('Rating is required')
            .isFloat({ min: 1, max: 5 }).withMessage('Rating must be a number between 1 and 5'),

        body('comment')
            .optional()
            .isString().withMessage('Comment must be a string')
            .isLength({ max: 1000 }).withMessage('Comment can be up to 1000 characters long'),
    ],

    update: [
        body('rating')
            .optional()
            .notEmpty().withMessage('Rating is required')
            .isFloat({ min: 1, max: 5 }).withMessage('Rating must be a number between 1 and 5'),

        body('comment')
            .optional()
            .isString().withMessage('Comment must be a string')
            .isLength({ max: 1000 }).withMessage('Comment can be up to 1000 characters long'),
    ]
}


export { reviewValidator };
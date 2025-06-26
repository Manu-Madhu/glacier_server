import { body, param } from 'express-validator';
import { isValidObjectId } from 'mongoose';

export const validateOption = {
    create: [
        body('value')
            .notEmpty().withMessage('Value is required')
            .isString().withMessage('Value must be a string')
            .trim(),
    ],

    update: [
        param('optionId')
            .custom((value) => isValidObjectId(value))
            .withMessage('Invalid Option ID'),

        body('value')
            .optional()
            .isString().withMessage('Value must be a string')
            .trim(),
    ]
}
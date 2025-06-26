import { body, param } from 'express-validator';
import { isValidObjectId } from 'mongoose';

export const validateVariation = {
    create: [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isString().withMessage('Name must be a string')
            .trim(),
    
        body('options')
            .optional()
            .isArray().withMessage('Options must be an array'),
    
        body('options.*')
            .optional()
            .custom((value) => isValidObjectId(value))
            .withMessage('Each option must be a valid ObjectId'),
    ],
    
    update: [
        param('variationId')
            .custom((value) => isValidObjectId(value))
            .withMessage('Invalid Variation ID'),
    
        body('name')
            .optional()
            .isString().withMessage('Name must be a string')
            .trim(),
    
        body('options')
            .optional()
            .isArray().withMessage('Options must be an array'),
    
        body('options.*')
            .optional()
            .custom((value) => isValidObjectId(value))
            .withMessage('Each option must be a valid ObjectId'),
    ]
}


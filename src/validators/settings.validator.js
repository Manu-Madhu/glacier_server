import { body } from 'express-validator';

export const validateSiteSettings = [
  body('storeName')
    .notEmpty().withMessage('Store name is required')
    .isString().withMessage('Store name must be a string'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),

  body('phone')
    .notEmpty().withMessage('Phone is required'),

  body('address')
    .isString().withMessage('Address should be a string'),

  body('logo.location')
    .optional()
    .isURL().withMessage('Logo URL must be a valid URL'),

  body('socialLinks.facebook')
    .optional()
    .isURL().withMessage('Facebook link must be a valid URL'),

  body('socialLinks.instagram')
    .optional()
    .isURL().withMessage('Instagram link must be a valid URL'),

  body('socialLinks.twitter')
    .optional()
    .isURL().withMessage('Twitter link must be a valid URL'),

  body('socialLinks.linkedin')
    .optional()
    .isURL().withMessage('LinkedIn link must be a valid URL'),

  body('socialLinks.youtube')
    .optional()
    .isURL().withMessage('YouTube link must be a valid URL'),

  body('supportHours.from')
    .optional()
    .isString().withMessage('Support hours "from" must be a string'),

  body('supportHours.to')
    .optional()
    .isString().withMessage('Support hours "to" must be a string'),

  body('isUnderMaintenance')
    .optional()
    .isBoolean().withMessage('Maintenance flag must be boolean')
];


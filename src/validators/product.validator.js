import { body } from "express-validator";

export const productValidator = {
  create: [
    body("name").trim().notEmpty().withMessage("Product name is required."),
    body("description").optional().isString(),
    body("brand").optional().isString(),
    body("hsn").optional().isString(),
    body("tax").optional().isFloat({ min: 0 }),
    body("price")
      .notEmpty().withMessage("Price is required.")
      .isFloat({ gt: 0 }).withMessage("Price must be greater than 0."),
    body("thumbnail").optional(),
    body("thumbnail.location").optional().notEmpty().withMessage("Thumbnail location is required."),
    body("thumbnail.name").optional().isString(),
    body("thumbnail.key").optional().isString(),
    body("images").isArray().optional(),
    body("images.*.location").optional().notEmpty().withMessage("Each image must have a location."),
    body("images.*.name").optional().isString(),
    body("images.*.key").optional().isString(),

    body("variantItems").optional().isArray(),
    body("variantItems.*.sku").optional().isString(),
    body("variantItems.*.stock").optional().isNumeric(),
    body("variantItems.*.extraPrice").optional().isFloat({ min: 0 })
      .withMessage("Additional price must be at least 0."),
    body("variantItems.*.specs").optional().isArray(),
    body("variantItems.*.specs.*.variationId").optional().isMongoId().withMessage("Invalid variation id."),
    body("variantItems.*.specs.*.optionId").optional().isMongoId().withMessage("Invalid option id."),

    body("isFeatured").optional().isBoolean(),
    body("tags").optional().isArray(),
    body("tags.*").optional().isString(),
    body("isArchived").optional({nullable: true}).isBoolean(),

  ],

  update: [
    body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty."),
    body("description").optional().isString(),
    body("brand").optional().isString(),
    body("hsn").optional().isString(),
    body("tax").optional().isFloat({ min: 0 }),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0."),
    body("thumbnail").optional(),
    body("thumbnail.location").optional().notEmpty().withMessage("Thumbnail location is required."),
    body("thumbnail.name").optional().isString(),
    body("thumbnail.key").optional().isString(),
    body("images").optional().isArray(),
    body("images.*.location").optional().notEmpty().withMessage("Each image must have a location."),
    body("images.*.name").optional().isString(),
    body("images.*.key").optional().isString(),

     body("variantItems").optional().isArray(),
    body("variantItems.*.sku").optional().isString(),
    body("variantItems.*.stock").optional().isNumeric(),
    body("variantItems.*.extraPrice").optional().isFloat({ min: 0 })
      .withMessage("Additional price must be at least 0."),
    body("variantItems.*.specs").optional().isArray(),
    body("variantItems.*.specs.*.variationId").optional().isMongoId(),
    body("variantItems.*.specs.*.optionId").optional().isMongoId(),

    body("isFeatured").optional().isBoolean(),
    body("tags").optional().isArray(),
    body("tags.*").optional().isString(),
    body("isArchived").optional({nullable: true}).isBoolean(),
  ],
};

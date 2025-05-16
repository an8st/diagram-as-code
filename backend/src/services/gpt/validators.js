const { body, validationResult } = require('express-validator');

const supportedTypes = ['plantuml', 'c4plantuml', 'mermaid', 'graphviz'];

const validateGenerateRequest = [
  body('type')
    .isString()
    .isIn(supportedTypes)
    .withMessage('Invalid diagram type. Supported types: ' + supportedTypes.join(', ')),
  body('description')
    .isString()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Context must be less than 500 characters')
];

const validateImproveRequest = [
  body('type')
    .isString()
    .isIn(supportedTypes)
    .withMessage('Invalid diagram type. Supported types: ' + supportedTypes.join(', ')),
  body('code')
    .isString()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 5000 })
    .withMessage('Code must be less than 5000 characters'),
  body('suggestions')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Suggestions must be less than 500 characters')
];

const validateExplainRequest = [
  body('type')
    .isString()
    .isIn(supportedTypes)
    .withMessage('Invalid diagram type. Supported types: ' + supportedTypes.join(', ')),
  body('code')
    .isString()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 5000 })
    .withMessage('Code must be less than 5000 characters')
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array()
      }
    });
  }
  next();
};

module.exports = {
  validateGenerateRequest,
  validateImproveRequest,
  validateExplainRequest,
  validate,
  supportedTypes
};

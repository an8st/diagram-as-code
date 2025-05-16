const express = require('express');
const router = express.Router();
const gptService = require('../services/gpt');
const { body, param, validationResult } = require('express-validator');

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const gptConfig = require('../services/gpt/config');

const limiter = rateLimit({
  windowMs: gptConfig.rateLimit.windowMs,
  max: gptConfig.rateLimit.maxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});

// Middleware для валидации
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

// Анализ диаграммы
router.post('/analyze',
  limiter,
  [
    body('type').isString().notEmpty(),
    body('code').isString().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, code } = req.body;
      const analysis = await gptService.analyzeDiagram({ type, code });
      res.json({ analysis });
    } catch (error) {
      next(error);
    }
  }
);

// Чат с GPT
router.post('/chat/:sessionId',
  limiter,
  [
    param('sessionId').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('code').isString().notEmpty(),
    body('message').isString().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { type, code, message } = req.body;
      
      const response = await gptService.chat({
        sessionId,
        type,
        code,
        message
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Объяснение диаграммы
router.post('/explain',
  limiter,
  [
    body('type').isString().notEmpty(),
    body('code').isString().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, code } = req.body;
      const explanation = await gptService.explainDiagram({ type, code });
      res.json({ explanation });
    } catch (error) {
      next(error);
    }
  }
);

// Очистка сессии чата
router.delete('/chat/:sessionId',
  [
    param('sessionId').isString().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      gptService.conversations.delete(sessionId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Обработка ошибок
router.use((err, req, res, next) => {
  console.error('GPT API Error:', err);
  
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details
    }
  });
});

module.exports = router;

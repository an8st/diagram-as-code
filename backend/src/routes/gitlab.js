const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const gitlabService = require('../services/gitlab');

const router = express.Router();

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

// GET /api/projects
router.get('/projects',
  [
    query('page').optional().isInt({ min: 1 }),
    query('perPage').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { page = 1, perPage = 10 } = req.query;
      const result = await gitlabService.getProjects(parseInt(page), parseInt(perPage));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:id
router.get('/projects/:id',
  [
    param('id').isInt()
  ],
  validate,
  async (req, res, next) => {
    try {
      const project = await gitlabService.getProject(req.params.id);
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:id/diagrams
router.get('/projects/:id/diagrams',
  [
    param('id').isInt(),
    query('type').optional().isIn(['plantuml', 'c4plantuml', 'mermaid', 'graphviz']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('perPage').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { type, search, page, perPage } = req.query;
      const result = await gitlabService.getDiagrams(req.params.id, {
        type,
        search,
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 10
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:id/diagrams
router.post('/projects/:id/diagrams',
  [
    param('id').isInt(),
    body('title').isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('type').isIn(['plantuml', 'c4plantuml', 'mermaid', 'graphviz']),
    body('code').isString().notEmpty(),
    body('metadata').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const diagram = await gitlabService.createDiagram(req.params.id, req.body);
      res.status(201).json(diagram);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/projects/:id/diagrams/:diagramId
router.put('/projects/:id/diagrams/:diagramId',
  [
    param('id').isInt(),
    param('diagramId').isString(),
    body('title').optional().isString().trim().notEmpty(),
    body('description').optional().isString(),
    body('type').optional().isIn(['plantuml', 'c4plantuml', 'mermaid', 'graphviz']),
    body('code').optional().isString().notEmpty(),
    body('metadata').optional().isObject()
  ],
  validate,
  async (req, res, next) => {
    try {
      const diagram = await gitlabService.updateDiagram(
        req.params.id,
        req.params.diagramId,
        req.body
      );
      res.json(diagram);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:id/diagrams/:diagramId
router.delete('/projects/:id/diagrams/:diagramId',
  [
    param('id').isInt(),
    param('diagramId').isString()
  ],
  validate,
  async (req, res, next) => {
    try {
      await gitlabService.deleteDiagram(req.params.id, req.params.diagramId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

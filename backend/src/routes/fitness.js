const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { logExercise, getFitnessHistory, getFitnessStats, deleteFitness } = require('../controllers/fitnessController');

router.use(auth);
router.post('/', [
  body('exercises').isArray({ min: 1 }).withMessage('At least one exercise is required'),
  body('exercises.*.name').trim().notEmpty().withMessage('Exercise name is required'),
  body('exercises.*.duration').isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  body('exercises.*.calories').optional().isInt({ min: 0 }),
  body('date').optional().isISO8601(),
], validate, logExercise);
router.get('/', getFitnessHistory);
router.get('/stats', getFitnessStats);
router.delete('/:id', [param('id').isMongoId()], validate, deleteFitness);

module.exports = router;

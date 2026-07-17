const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { logSleep, getSleepHistory, getSleepStats, deleteSleep } = require('../controllers/sleepController');

const sleepValidation = [
  body('duration').optional().isFloat({ min: 0, max: 24 }).withMessage('Duration must be between 0 and 24 hours'),
  body('quality').optional().isInt({ min: 1, max: 5 }).withMessage('Quality must be between 1 and 5'),
  body('bedtime').optional().isISO8601().withMessage('Bedtime must be a valid date'),
  body('wakeTime').optional().isISO8601().withMessage('Wake time must be a valid date'),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
];

router.use(auth);
router.post('/', sleepValidation, validate, logSleep);
router.get('/', getSleepHistory);
router.get('/stats', getSleepStats);
router.delete('/:id', [param('id').isMongoId()], validate, deleteSleep);

module.exports = router;

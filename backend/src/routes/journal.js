const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { aiLimiter } = require('../middlewares/aiLimiter');
const { saveEntry, getEntries, getEntryByDate, deleteEntry, analyzeEntry } = require('../controllers/journalController');

router.use(auth);

router.post('/',
  [
    body('content').trim().notEmpty().isLength({ max: 5000 }),
    body('date').optional().isISO8601().withMessage('Date must be ISO-8601'),
  ],
  validate,
  saveEntry
);

router.get('/', getEntries);

router.get('/:date',
  [param('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD')],
  validate,
  getEntryByDate
);

router.post('/:id/analyze',
  aiLimiter,
  [param('id').isMongoId()],
  validate,
  analyzeEntry
);

router.delete('/:id',
  [param('id').isMongoId()],
  validate,
  deleteEntry
);

module.exports = router;

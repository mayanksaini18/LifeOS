const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  updateGoals, updateReminders,
  subscribePush, unsubscribePush, getVapidPublicKey,
  updateEmailReminders, completeOnboarding,
} = require('../controllers/settingsController');
const { getSuggestions } = require('../controllers/smartRemindersController');

router.get('/vapid-public-key', getVapidPublicKey);

router.use(auth);

router.put('/goals', [
  body('sleep').optional().isFloat({ min: 1, max: 24 }),
  body('exercise').optional().isInt({ min: 0, max: 7 }),
  body('mood').optional().isFloat({ min: 1, max: 5 }),
  body('water').optional().isInt({ min: 1, max: 50 }),
], validate, updateGoals);

router.get('/reminder-suggestions', getSuggestions);

router.put('/reminders', [
  body('mood').optional().isString(),
  body('sleep').optional().isString(),
  body('water').optional().isString(),
  body('exercise').optional().isString(),
], validate, updateReminders);

router.post('/push-subscribe', subscribePush);
router.delete('/push-unsubscribe', unsubscribePush);

router.put('/email-reminders', [
  body('enabled').isBoolean(),
], validate, updateEmailReminders);

router.put('/onboarding-complete', completeOnboarding);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { logWater, getWaterToday, getWaterHistory, setWaterGoal, deleteWater } = require('../controllers/waterController');

router.use(auth);
router.post('/', [
  body('glasses').optional().isInt({ min: 1, max: 50 }).withMessage('Glasses must be between 1 and 50'),
  body('goal').optional().isInt({ min: 1, max: 50 }).withMessage('Goal must be between 1 and 50'),
], validate, logWater);
router.get('/today', getWaterToday);
router.get('/', getWaterHistory);
router.put('/goal', [
  body('goal').isInt({ min: 1, max: 50 }).withMessage('Goal must be between 1 and 50'),
], validate, setWaterGoal);
router.delete('/:id', [param('id').isMongoId()], validate, deleteWater);

module.exports = router;

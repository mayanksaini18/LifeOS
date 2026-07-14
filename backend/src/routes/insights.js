const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/aiLimiter');
const { getWeeklyReport, getInsights, getCorrelations } = require('../controllers/insightController');

router.use(auth);
router.get('/weekly', aiLimiter, getWeeklyReport);
router.get('/correlations', getCorrelations);
router.get('/', getInsights);

module.exports = router;

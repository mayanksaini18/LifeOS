const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { aiLimiter } = require('../middlewares/aiLimiter');
const { sendMessage, getHistory, clearHistory } = require('../controllers/chatController');

router.use(auth);

router.get('/', getHistory);
router.post('/', aiLimiter, sendMessage);
router.delete('/', clearHistory);

module.exports = router;

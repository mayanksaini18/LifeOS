const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { register, login, refreshToken, getMe, googleLogin, phoneLogin, logout, verifyEmail, resendVerification } = require('../controllers/authController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later' }
});

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be under 50 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password must be under 128 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many verification emails, please try again later' }
});

const resendValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh', refreshToken);
router.post('/google', authLimiter, googleLogin);
router.post('/phone', authLimiter, phoneLogin);
router.post('/logout', logout);
router.get('/me', auth, getMe);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendLimiter, resendValidation, validate, resendVerification);

module.exports = router;

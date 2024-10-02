const express        = require('express');
const authController = require('../controllers/authController');
const router         = express.Router();

// User Authentication Routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

// Forgot Password Route
router.post('/forgetPassword', authController.forgetPassword);

// Reset Password Route
router.post('/resetPassword', authController.resetPassword);

module.exports = router;

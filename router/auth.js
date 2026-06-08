const express = require('express');
const router  = express.Router();
const { register, login, refresh, getMe, createAdmin } = require('../controller/authController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refresh);

// Logged in user
router.get('/me', protect, getMe);

// Admin only — create a new admin account
router.post('/create-admin', protect, adminOnly, createAdmin);

module.exports = router;
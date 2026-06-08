const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAllUsers, updateProfile } = require('../controller/controllers');

router.get('/',        protect, adminOnly, getAllUsers);  // admin — get all clients
router.put('/profile', protect, updateProfile);          // user  — update own profile

module.exports = router;
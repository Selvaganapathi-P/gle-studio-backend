const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getStaff, createStaff, updateStaff, assignOrder } = require('../controller/controllers');

router.get('/',            protect, adminOnly, getStaff);     // admin
router.post('/',           protect, adminOnly, createStaff);  // admin
router.put('/:id',         protect, adminOnly, updateStaff);  // admin
router.post('/:id/assign', protect, adminOnly, assignOrder);  // admin

module.exports = router;
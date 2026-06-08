const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controller/controllers');

router.get('/', getSettings);                                                   // public
router.put('/', protect, adminOnly, upload.single('logo'), updateSettings);     // admin

module.exports = router;
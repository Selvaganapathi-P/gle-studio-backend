const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { getFrames, createFrame, updateFrame, deleteFrame } = require('../controller/controllers');

router.get('/',       getFrames);                                            // public
router.post('/',      protect, adminOnly, upload.single('frame'), createFrame); // admin
router.put('/:id',    protect, adminOnly, upload.single('frame'), updateFrame); // admin
router.delete('/:id', protect, adminOnly, deleteFrame);                      // admin

module.exports = router;
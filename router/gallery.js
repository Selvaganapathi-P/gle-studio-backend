const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { getGallery, uploadPhoto, deletePhoto } = require('../controller/controllers');

router.get('/',       getGallery);                                            // public
router.post('/',      protect, adminOnly, upload.memory.single('gallery'), uploadPhoto); // admin
router.delete('/:id', protect, adminOnly, deletePhoto);                       // admin

module.exports = router;
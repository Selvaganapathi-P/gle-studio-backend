const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const { getGallery, uploadPhoto, deletePhoto } = require('../controller/controllers');

router.get('/',       getGallery);
router.post('/',      protect, adminOnly, upload.single('gallery'), uploadPhoto);
router.delete('/:id', protect, adminOnly, deletePhoto);

module.exports = router;
const express = require('express');
const router  = express.Router();
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createOrder, getAllOrders, getMyOrders,
  getOrder, updateStatus, deleteOrder, getStats,
} = require('../controller/orderController');

// Admin routes
router.get('/stats',        protect, adminOnly, getStats);
router.get('/',             protect, adminOnly, getAllOrders);
router.patch('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id',       protect, adminOnly, deleteOrder);

// User routes
router.get('/my',  protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Booking — works for both logged in users AND guests
// optionalAuth middleware attaches user if token exists, but doesn't block if no token
const optionalAuth = async (req, res, next) => {
  try {
    const jwt    = require('jsonwebtoken');
    const { User } = require('../model');
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user      = await User.findById(decoded.id).select('-password');
    }
  } catch {
    // No token or invalid token — continue as guest
  }
  next();
};

router.post('/', optionalAuth, upload.single('referenceImage'), createOrder);

module.exports = router;
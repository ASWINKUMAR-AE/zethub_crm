const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const { getAllPayments, createOrder, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

router.get('/', protect, authorize('admin'), getAllPayments);
router.post('/order', protect, authorize('client'), createOrder);
router.post('/verify', protect, authorize('client'), verifyPayment);

module.exports = router;

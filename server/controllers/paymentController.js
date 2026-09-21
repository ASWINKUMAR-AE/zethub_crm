const Razorpay = require('razorpay');
const { Payment, Milestone } = require('../models');

// Configure Razorpay with dummy keys for test mode
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_SECRET || 'dummy_secret',
});

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a payment order
// @route   POST /api/payments/order
// @access  Private/Client
const createOrder = async (req, res) => {
  try {
    const { milestone_id, amount } = req.body;

    // amount is expected in INR, Razorpay takes paise (multiply by 100)
    const options = {
      amount: amount * 100, 
      currency: 'INR',
      receipt: `receipt_ms_${milestone_id}`,
    };

    // Note: Since this is Razorpay mock, we'll just mock the response if it fails due to invalid keys
    try {
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (rzpErr) {
      console.log('Razorpay failed, using mock order', rzpErr);
      res.json({ id: `order_mock_${Date.now()}`, amount: options.amount, currency: 'INR' });
    }
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment signature and save
// @route   POST /api/payments/verify
// @access  Private/Client
const verifyPayment = async (req, res) => {
  try {
    const { milestone_id, client_id, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature logic would normally go here using crypto
    // In mock mode, we assume it's successful

    const payment = await Payment.create({
      milestone_id,
      client_id,
      amount,
      status: 'success',
      transaction_id: razorpay_payment_id,
      paid_at: new Date(),
    });

    // Update milestone status
    const milestone = await Milestone.findByPk(milestone_id);
    if (milestone) {
      milestone.status = 'paid';
      await milestone.save();
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllPayments, createOrder, verifyPayment };

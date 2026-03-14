const express = require('express');
const router = express.Router();
const {
  generateBill,
  processPayment,
  getPaymentByOrderId,
} = require('../controllers/paymentController');

router.get('/order/:orderId', getPaymentByOrderId);
router.post('/order/:orderId/bill', generateBill);
router.post('/order/:orderId/pay', processPayment);

module.exports = router;

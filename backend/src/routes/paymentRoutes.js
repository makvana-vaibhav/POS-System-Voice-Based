const express = require('express');
const router = express.Router();
const {
  generateBill,
  processPayment,
  completePayment,
  getPaymentByOrderId,
  getActiveBills,
} = require('../controllers/paymentController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/order/:orderId', allowRoles('admin', 'cashier'), getPaymentByOrderId);
router.get('/active-bills', allowRoles('admin', 'cashier'), getActiveBills);
router.post('/order/:orderId/bill', allowRoles('admin', 'cashier'), generateBill);
router.post('/order/:orderId/pay', allowRoles('admin', 'cashier'), processPayment);
router.post('/order/:orderId/complete', allowRoles('admin', 'cashier'), completePayment);

module.exports = router;

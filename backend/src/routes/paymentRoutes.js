const express = require('express');
const router = express.Router();
const {
  generateBill,
  processPayment,
  getPaymentByOrderId,
  getActiveBills,
} = require('../controllers/paymentController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/order/:orderId', allowRoles('admin', 'cashier'), getPaymentByOrderId);
router.get('/active-bills', allowRoles('admin', 'cashier'), getActiveBills);
router.post('/order/:orderId/bill', allowRoles('admin', 'cashier'), generateBill);
router.post('/order/:orderId/pay', allowRoles('admin', 'cashier'), processPayment);

module.exports = router;

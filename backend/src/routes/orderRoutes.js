const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getAllOrders);
router.get('/:id', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getOrderById);

router.post('/', allowRoles('admin', 'waiter', 'cashier'), createOrder);
router.post('/:id/items', allowRoles('admin', 'waiter', 'cashier'), addItemToOrder);
router.delete('/:id/items/:itemId', allowRoles('admin', 'waiter', 'cashier'), removeItemFromOrder);

router.patch('/:id/status', allowRoles('admin', 'kitchen', 'cashier'), updateOrderStatus);
router.delete('/:id', allowRoles('admin', 'waiter', 'cashier'), cancelOrder);

module.exports = router;

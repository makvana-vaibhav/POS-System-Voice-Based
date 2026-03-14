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

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.post('/:id/items', addItemToOrder);
router.delete('/:id/items/:itemId', removeItemFromOrder);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', cancelOrder);

module.exports = router;

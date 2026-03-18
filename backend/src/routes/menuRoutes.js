const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/categories', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getAllCategories);
router.get('/items', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getAllMenuItems);
router.get('/items/:id', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getMenuItemById);

router.post('/categories', allowRoles('admin'), createCategory);
router.post('/items', allowRoles('admin'), createMenuItem);
router.put('/items/:id', allowRoles('admin'), updateMenuItem);
router.delete('/items/:id', allowRoles('admin'), deleteMenuItem);

module.exports = router;

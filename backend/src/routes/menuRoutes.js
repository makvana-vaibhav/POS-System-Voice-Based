const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuController');

router.get('/categories', getAllCategories);
router.get('/items', getAllMenuItems);
router.get('/items/:id', getMenuItemById);
router.post('/items', createMenuItem);
router.put('/items/:id', updateMenuItem);
router.delete('/items/:id', deleteMenuItem);

module.exports = router;

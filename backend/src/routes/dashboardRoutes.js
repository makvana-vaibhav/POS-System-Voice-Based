const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesByDate,
  getTopItems,
  getItemRevenue,
} = require('../controllers/dashboardController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/summary', allowRoles('admin'), getDashboardSummary);
router.get('/sales', allowRoles('admin'), getSalesByDate);
router.get('/top-items', allowRoles('admin'), getTopItems);
router.get('/item-revenue', allowRoles('admin'), getItemRevenue);

module.exports = router;

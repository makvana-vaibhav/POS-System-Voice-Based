const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesByDate,
  getTopItems,
  getItemRevenue,
  getAnalytics,
} = require('../controllers/dashboardController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/summary', allowRoles('admin'), getDashboardSummary);
router.get('/sales', allowRoles('admin'), getSalesByDate);
router.get('/top-items', allowRoles('admin'), getTopItems);
router.get('/item-revenue', allowRoles('admin'), getItemRevenue);
router.get('/analytics', allowRoles('admin'), getAnalytics);

module.exports = router;

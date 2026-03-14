const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getSalesByDate,
  getTopItems,
} = require('../controllers/dashboardController');

router.get('/summary', getDashboardSummary);
router.get('/sales', getSalesByDate);
router.get('/top-items', getTopItems);

module.exports = router;

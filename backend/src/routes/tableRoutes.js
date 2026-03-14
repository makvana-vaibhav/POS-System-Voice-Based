const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  updateTableStatus,
} = require('../controllers/tableController');

router.get('/', getAllTables);
router.get('/:id', getTableById);
router.patch('/:id/status', updateTableStatus);

module.exports = router;

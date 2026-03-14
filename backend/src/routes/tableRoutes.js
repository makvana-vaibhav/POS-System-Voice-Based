const express = require('express');
const router = express.Router();
const {
  getAllTables,
  createTable,
  updateTable,
  getTableById,
  updateTableStatus,
} = require('../controllers/tableController');

router.get('/', getAllTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.get('/:id', getTableById);
router.put('/:id/status', updateTableStatus);
router.patch('/:id/status', updateTableStatus);

module.exports = router;

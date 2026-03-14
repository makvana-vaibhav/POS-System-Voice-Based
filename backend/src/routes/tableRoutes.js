const express = require('express');
const router = express.Router();
const {
  getAllTables,
  createTable,
  updateTable,
  getTableById,
  updateTableStatus,
  deleteTable,
} = require('../controllers/tableController');

router.get('/', getAllTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.get('/:id', getTableById);
router.put('/:id/status', updateTableStatus);
router.patch('/:id/status', updateTableStatus);
router.delete('/:id', deleteTable);

module.exports = router;

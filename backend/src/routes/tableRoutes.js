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
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getAllTables);
router.get('/:id', allowRoles('admin', 'waiter', 'cashier', 'kitchen'), getTableById);

router.post('/', allowRoles('admin'), createTable);
router.put('/:id', allowRoles('admin'), updateTable);
router.delete('/:id', allowRoles('admin'), deleteTable);

router.put('/:id/status', allowRoles('admin', 'waiter', 'cashier'), updateTableStatus);
router.patch('/:id/status', allowRoles('admin', 'waiter', 'cashier'), updateTableStatus);

module.exports = router;

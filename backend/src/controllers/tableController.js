const pool = require('../config/db');

// GET /api/tables
const getAllTables = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurant_tables ORDER BY table_number ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tables/:id
const getTableById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM restaurant_tables WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tables/:id/status
const updateTableStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'reserved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }
  try {
    const result = await pool.query(
      'UPDATE restaurant_tables SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllTables, getTableById, updateTableStatus };

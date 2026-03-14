const pool = require('../config/db');

const VALID_TABLE_STATUSES = ['available', 'occupied', 'reserved'];

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

// POST /api/tables
const createTable = async (req, res) => {
  const { table_number, capacity = 4, status = 'available' } = req.body;

  if (!table_number) {
    return res.status(400).json({
      success: false,
      message: 'table_number is required',
    });
  }

  const normalizedTableNumber = Number(table_number);
  const normalizedCapacity = Number(capacity);

  if (Number.isNaN(normalizedTableNumber) || normalizedTableNumber <= 0) {
    return res.status(400).json({
      success: false,
      message: 'table_number must be a positive number',
    });
  }

  if (Number.isNaN(normalizedCapacity) || normalizedCapacity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'capacity must be a positive number',
    });
  }

  if (!VALID_TABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_TABLE_STATUSES.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO restaurant_tables (table_number, capacity, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [normalizedTableNumber, normalizedCapacity, status]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Table number already exists',
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/tables/:id
const updateTable = async (req, res) => {
  const { table_number, capacity, status } = req.body;

  const normalizedTableNumber = Number(table_number);
  const normalizedCapacity = Number(capacity);

  if (Number.isNaN(normalizedTableNumber) || normalizedTableNumber <= 0) {
    return res.status(400).json({
      success: false,
      message: 'table_number must be a positive number',
    });
  }

  if (Number.isNaN(normalizedCapacity) || normalizedCapacity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'capacity must be a positive number',
    });
  }

  if (!VALID_TABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_TABLE_STATUSES.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE restaurant_tables
       SET table_number = $1, capacity = $2, status = $3
       WHERE id = $4
       RETURNING *`,
      [normalizedTableNumber, normalizedCapacity, status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Table number already exists',
      });
    }

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
  if (!VALID_TABLE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_TABLE_STATUSES.join(', ')}`,
    });
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

// DELETE /api/tables/:id
const deleteTable = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM restaurant_tables WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllTables,
  createTable,
  updateTable,
  getTableById,
  updateTableStatus,
  deleteTable,
};

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const VALID_ROLES = ['admin', 'cashier', 'waiter', 'kitchen'];

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, username, role, is_active, created_at FROM users ORDER BY id ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createUser = async (req, res) => {
  const { full_name, username, password, role = 'waiter', is_active = true } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, username, and password are required',
    });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, username, role, is_active, created_at`,
      [full_name, username, password_hash, role, is_active]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  const { role, is_active, full_name, password } = req.body;

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  try {
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         role = COALESCE($2, role),
         is_active = COALESCE($3, is_active),
         password_hash = COALESCE($4, password_hash),
         updated_at = NOW()
       WHERE id = $5
       RETURNING id, full_name, username, role, is_active, created_at, updated_at`,
      [full_name || null, role || null, is_active ?? null, password_hash, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser };

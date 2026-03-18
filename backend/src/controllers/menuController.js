const pool = require('../config/db');

// GET /api/menu/categories
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/menu/categories
const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/items
const getAllMenuItems = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mi.*, c.name AS category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = true
      ORDER BY c.name ASC, mi.name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/items/:id
const getMenuItemById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi
       LEFT JOIN categories c ON mi.category_id = c.id
       WHERE mi.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/menu/items
const createMenuItem = async (req, res) => {
  const { category_id, name, description, price, is_available, image_url } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'name and price are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, is_available, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, name, description, price, is_available ?? true, image_url]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/menu/items/:id
const updateMenuItem = async (req, res) => {
  const { category_id, name, description, price, is_available, image_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE menu_items SET
         category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         price = COALESCE($4, price),
         is_available = COALESCE($5, is_available),
         image_url = COALESCE($6, image_url),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [category_id, name, description, price, is_available, image_url, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/menu/items/:id
const deleteMenuItem = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};

const pool = require('../config/db');

function parseCsvRow(row) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];
    const next = row[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsvText(csvText) {
  const rows = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (!rows.length) {
    return { headers: [], records: [] };
  }

  const headers = parseCsvRow(rows[0]).map((header) => header.toLowerCase());
  const records = rows.slice(1).map((line, index) => ({
    rowNumber: index + 2,
    values: parseCsvRow(line),
  }));

  return { headers, records };
}

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
  const includeUnavailable = String(req.query.includeUnavailable || 'false') === 'true';

  try {
    const result = await pool.query(`
      SELECT mi.*, c.name AS category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE ($1::boolean = true OR mi.is_available = true)
      ORDER BY c.name ASC, mi.name ASC
    `, [includeUnavailable]);
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

// POST /api/menu/items/import-csv
const importMenuItemsFromCsv = async (req, res) => {
  const { csv_text } = req.body;

  if (!csv_text || !String(csv_text).trim()) {
    return res.status(400).json({ success: false, message: 'csv_text is required' });
  }

  const { headers, records } = parseCsvText(csv_text);

  if (!headers.length) {
    return res.status(400).json({ success: false, message: 'CSV is empty' });
  }

  const nameIndex = headers.indexOf('name');
  const priceIndex = headers.indexOf('price');
  const categoryNameIndex = headers.indexOf('category');
  const descriptionIndex = headers.indexOf('description');
  const isAvailableIndex = headers.indexOf('is_available');

  if (nameIndex === -1 || priceIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'CSV must contain name and price columns',
    });
  }

  const errors = [];
  let insertedCount = 0;
  const categoryCache = new Map();

  for (const record of records) {
    try {
      const name = (record.values[nameIndex] || '').trim();
      const rawPrice = (record.values[priceIndex] || '').trim();
      const description = (record.values[descriptionIndex] || '').trim();
      const categoryName = (record.values[categoryNameIndex] || '').trim();
      const rawAvailability = (record.values[isAvailableIndex] || '').trim().toLowerCase();

      if (!name) {
        throw new Error('name is required');
      }

      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('price must be a valid non-negative number');
      }

      let categoryId = null;
      if (categoryName) {
        const cacheKey = categoryName.toLowerCase();

        if (categoryCache.has(cacheKey)) {
          categoryId = categoryCache.get(cacheKey);
        } else {
          const existingCategory = await pool.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [categoryName]
          );

          if (existingCategory.rows.length) {
            categoryId = existingCategory.rows[0].id;
          } else {
            const createdCategory = await pool.query(
              'INSERT INTO categories (name) VALUES ($1) RETURNING id',
              [categoryName]
            );
            categoryId = createdCategory.rows[0].id;
          }

          categoryCache.set(cacheKey, categoryId);
        }
      }

      const isAvailable = rawAvailability
        ? !['false', '0', 'no'].includes(rawAvailability)
        : true;

      await pool.query(
        `INSERT INTO menu_items (category_id, name, description, price, is_available)
         VALUES ($1, $2, $3, $4, $5)`,
        [categoryId, name, description || null, price, isAvailable]
      );

      insertedCount += 1;
    } catch (err) {
      errors.push({ row: record.rowNumber, message: err.message });
    }
  }

  res.status(201).json({
    success: true,
    data: {
      inserted_count: insertedCount,
      failed_count: errors.length,
      errors,
    },
  });
};

module.exports = {
  getAllCategories,
  createCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  importMenuItemsFromCsv,
};

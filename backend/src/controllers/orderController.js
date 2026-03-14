const pool = require('../config/db');

// GET /api/orders  ?status=pending
const getAllOrders = async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT o.*, rt.table_number,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'note', oi.note
          )
        ) FILTER (WHERE oi.id IS NOT NULL) AS items
      FROM orders o
      LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }
    query += ' GROUP BY o.id, rt.table_number ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT o.*, rt.table_number FROM orders o LEFT JOIN restaurant_tables rt ON o.table_id = rt.id WHERE o.id = $1',
      [req.params.id]
    );
    if (!orderResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const itemsResult = await pool.query(
      `SELECT oi.*, mi.name FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    );
    res.json({
      success: true,
      data: { ...orderResult.rows[0], items: itemsResult.rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders  { table_id, order_type, items: [{menu_item_id, quantity, note}] }
const createOrder = async (req, res) => {
  const { table_id, order_type = 'dine-in', items = [], note } = req.body;

  if (order_type === 'dine-in' && !table_id) {
    return res.status(400).json({
      success: false,
      message: 'table_id is required for dine-in orders',
    });
  }

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({
      success: false,
      message: 'At least one order item is required',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (table_id) {
      const tableResult = await client.query(
        'SELECT * FROM restaurant_tables WHERE id = $1',
        [table_id]
      );

      if (!tableResult.rows.length) {
        throw new Error('Selected table not found');
      }

      if (tableResult.rows[0].status === 'occupied') {
        throw new Error('Selected table is already occupied');
      }
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (table_id, order_type, note) VALUES ($1, $2, $3) RETURNING *`,
      [table_id, order_type, note]
    );
    const order = orderResult.rows[0];

    // Add items
    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || Number(item.quantity) <= 0) {
        throw new Error('Each order item must include menu_item_id and quantity > 0');
      }

      const menuItem = await client.query('SELECT price FROM menu_items WHERE id = $1', [item.menu_item_id]);
      if (!menuItem.rows.length) throw new Error(`Menu item ${item.menu_item_id} not found`);
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.quantity, menuItem.rows[0].price, item.note]
      );
    }

    // Mark table as occupied
    if (table_id) {
      await client.query("UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1", [table_id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await client.query('ROLLBACK');
    const statusCode = err.message.includes('not found') || err.message.includes('occupied')
      ? 400
      : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// POST /api/orders/:id/items  { menu_item_id, quantity, note }
const addItemToOrder = async (req, res) => {
  const { menu_item_id, quantity = 1, note } = req.body;
  try {
    const menuItem = await pool.query('SELECT price FROM menu_items WHERE id = $1', [menu_item_id]);
    if (!menuItem.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    const result = await pool.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, menu_item_id, quantity, menuItem.rows[0].price, note]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/orders/:id/items/:itemId
const removeItemFromOrder = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM order_items WHERE id = $1 AND order_id = $2 RETURNING *',
      [req.params.itemId, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    res.json({ success: true, message: 'Item removed from order' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/status  { status }
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }
  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Free table when order is served or cancelled
    if (status === 'served' || status === 'cancelled') {
      await pool.query(
        "UPDATE restaurant_tables SET status = 'available' WHERE id = (SELECT table_id FROM orders WHERE id = $1)",
        [req.params.id]
      );
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/orders/:id  (cancel)
const cancelOrder = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order cancelled', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderStatus,
  cancelOrder,
};

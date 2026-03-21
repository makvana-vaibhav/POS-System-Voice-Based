const pool = require('../config/db');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '5');

// GET /api/payments/order/:orderId
const getPaymentByOrderId = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [req.params.orderId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Bill not generated yet' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payments/active-bills
const getActiveBills = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        o.*,
        rt.table_number,
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'name', mi.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'note', oi.note
          )
        ) FILTER (WHERE oi.id IS NOT NULL) AS items,
        CASE
          WHEN p.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', p.id,
            'order_id', p.order_id,
            'subtotal', p.subtotal,
            'tax_rate', p.tax_rate,
            'tax_amount', p.tax_amount,
            'total_amount', p.total_amount,
            'payment_status', p.payment_status,
            'payment_method', p.payment_method,
            'paid_at', p.paid_at
          )
        END AS payment
      FROM orders o
      LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.status <> 'cancelled'
        AND COALESCE(p.payment_status, 'pending') <> 'paid'
      GROUP BY o.id, rt.table_number, p.id
      ORDER BY o.created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/order/:orderId/bill  — generate bill
const generateBill = async (req, res) => {
  const { orderId } = req.params;
  try {
    // Check if bill already exists
    const existing = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    if (existing.rows.length) {
      return res.json({ success: true, data: existing.rows[0] });
    }

    // Calculate subtotal from order items
    const itemsResult = await pool.query(
      'SELECT SUM(quantity * unit_price) AS subtotal FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const subtotal = parseFloat(itemsResult.rows[0].subtotal || 0);
    const tax_amount = parseFloat((subtotal * TAX_RATE) / 100).toFixed(2);
    const total_amount = parseFloat(subtotal + parseFloat(tax_amount)).toFixed(2);

    const result = await pool.query(
      `INSERT INTO payments (order_id, subtotal, tax_rate, tax_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, subtotal.toFixed(2), TAX_RATE, tax_amount, total_amount]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/order/:orderId/pay  { payment_method }
const processPayment = async (req, res) => {
  const { payment_method = 'cash' } = req.body;
  const { orderId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE payments
       SET payment_status = 'paid', payment_method = $1, paid_at = NOW()
       WHERE order_id = $2 AND payment_status = 'pending'
       RETURNING *`,
      [payment_method, orderId]
    );
    if (!result.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Bill not found or already paid' });
    }

    const orderResult = await client.query(
      `UPDATE orders
       SET status = 'served', updated_at = NOW()
       WHERE id = $1
       RETURNING table_id`,
      [orderId]
    );

    if (orderResult.rows.length && orderResult.rows[0].table_id) {
      await client.query("UPDATE restaurant_tables SET status = 'available' WHERE id = $1", [orderResult.rows[0].table_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getPaymentByOrderId, getActiveBills, generateBill, processPayment };

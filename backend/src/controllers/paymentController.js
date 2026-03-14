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
  try {
    const result = await pool.query(
      `UPDATE payments
       SET payment_status = 'paid', payment_method = $1, paid_at = NOW()
       WHERE order_id = $2 AND payment_status = 'pending'
       RETURNING *`,
      [payment_method, orderId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Bill not found or already paid' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPaymentByOrderId, generateBill, processPayment };

const pool = require('../config/db');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '5');

function normalizeTaxRate(inputRate) {
  const parsedRate = Number(inputRate);
  if (!Number.isFinite(parsedRate)) {
    return TAX_RATE;
  }
  if (parsedRate < 0 || parsedRate > 100) {
    throw new Error('tax_rate must be between 0 and 100');
  }
  return Number(parsedRate.toFixed(2));
}

function computePaymentTotals(subtotal, taxRate) {
  const normalizedSubtotal = Number(subtotal || 0);
  const normalizedTaxRate = Number(taxRate || 0);
  const taxAmount = Number(((normalizedSubtotal * normalizedTaxRate) / 100).toFixed(2));
  const totalAmount = Number((normalizedSubtotal + taxAmount).toFixed(2));

  return {
    subtotal: Number(normalizedSubtotal.toFixed(2)),
    taxRate: normalizedTaxRate,
    taxAmount,
    totalAmount,
  };
}

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
      WHERE o.status NOT IN ('cancelled', 'served')
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
    const requestedTaxRate = normalizeTaxRate(req.body?.tax_rate);

    // Calculate subtotal from order items
    const itemsResult = await pool.query(
      'SELECT SUM(quantity * unit_price) AS subtotal FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const subtotal = Number(itemsResult.rows[0].subtotal || 0);
    const totals = computePaymentTotals(subtotal, requestedTaxRate);

    // Check if bill already exists
    const existing = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    if (existing.rows.length) {
      const existingBill = existing.rows[0];

      if (existingBill.payment_status === 'paid') {
        return res.json({ success: true, data: existingBill });
      }

      const updated = await pool.query(
        `UPDATE payments
         SET subtotal = $1,
             tax_rate = $2,
             tax_amount = $3,
             total_amount = $4
         WHERE id = $5
         RETURNING *`,
        [
          totals.subtotal.toFixed(2),
          totals.taxRate.toFixed(2),
          totals.taxAmount.toFixed(2),
          totals.totalAmount.toFixed(2),
          existingBill.id,
        ]
      );

      return res.json({ success: true, data: updated.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO payments (order_id, subtotal, tax_rate, tax_amount, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        orderId,
        totals.subtotal.toFixed(2),
        totals.taxRate.toFixed(2),
        totals.taxAmount.toFixed(2),
        totals.totalAmount.toFixed(2),
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    const statusCode = err.message.includes('tax_rate') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
};

// POST /api/payments/order/:orderId/pay  { payment_method }
const processPayment = async (req, res) => {
  const { payment_method = 'cash' } = req.body;
  const { orderId } = req.params;
  const client = await pool.connect();
  try {
    const requestedTaxRate = normalizeTaxRate(req.body?.tax_rate);

    await client.query('BEGIN');

    const itemsTotalResult = await client.query(
      'SELECT COALESCE(SUM(quantity * unit_price), 0) AS subtotal FROM order_items WHERE order_id = $1',
      [orderId]
    );
    const subtotal = Number(itemsTotalResult.rows[0].subtotal || 0);
    const totals = computePaymentTotals(subtotal, requestedTaxRate);

    await client.query(
      `INSERT INTO payments (order_id, subtotal, tax_rate, tax_amount, total_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (order_id)
       DO UPDATE SET
         subtotal = EXCLUDED.subtotal,
         tax_rate = EXCLUDED.tax_rate,
         tax_amount = EXCLUDED.tax_amount,
         total_amount = EXCLUDED.total_amount
       WHERE payments.payment_status <> 'paid'`,
      [
        orderId,
        totals.subtotal.toFixed(2),
        totals.taxRate.toFixed(2),
        totals.taxAmount.toFixed(2),
        totals.totalAmount.toFixed(2),
      ]
    );

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

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    const statusCode = err.message.includes('tax_rate') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// POST /api/payments/order/:orderId/complete
const completePayment = async (req, res) => {
  const { orderId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const paidBillResult = await client.query(
      `SELECT payment_status
       FROM payments
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );

    if (!paidBillResult.rows.length || paidBillResult.rows[0].payment_status !== 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Please mark this bill as paid before completing',
      });
    }

    const orderResult = await client.query(
      `UPDATE orders
       SET status = 'served', updated_at = NOW()
       WHERE id = $1
         AND status <> 'cancelled'
       RETURNING id, table_id`,
      [orderId]
    );

    if (!orderResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const tableId = orderResult.rows[0].table_id;
    if (tableId) {
      const openOrders = await client.query(
        `SELECT 1
         FROM orders
         WHERE table_id = $1
           AND order_type = 'dine-in'
           AND status NOT IN ('served', 'cancelled')
         LIMIT 1`,
        [tableId]
      );

      if (!openOrders.rows.length) {
        await client.query("UPDATE restaurant_tables SET status = 'available' WHERE id = $1", [tableId]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: orderResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getPaymentByOrderId,
  getActiveBills,
  generateBill,
  processPayment,
  completePayment,
};

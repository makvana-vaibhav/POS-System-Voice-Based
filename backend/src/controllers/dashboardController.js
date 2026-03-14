const pool = require('../config/db');

// GET /api/dashboard/summary
const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [ordersToday, revenueToday, tablesAvailable] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = $1 AND status != 'cancelled'",
        [today]
      ),
      pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM payments WHERE DATE(created_at) = $1 AND payment_status = 'paid'",
        [today]
      ),
      pool.query("SELECT COUNT(*) FROM restaurant_tables WHERE status = 'available'"),
    ]);

    res.json({
      success: true,
      data: {
        orders_today: parseInt(ordersToday.rows[0].count),
        revenue_today: parseFloat(revenueToday.rows[0].revenue),
        tables_available: parseInt(tablesAvailable.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
const getSalesByDate = async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `SELECT DATE(p.created_at) AS date,
              COUNT(p.id) AS total_orders,
              SUM(p.total_amount) AS total_revenue
       FROM payments p
       WHERE p.payment_status = 'paid'
         AND ($1::date IS NULL OR DATE(p.created_at) >= $1::date)
         AND ($2::date IS NULL OR DATE(p.created_at) <= $2::date)
       GROUP BY DATE(p.created_at)
       ORDER BY date DESC`,
      [from || null, to || null]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/top-items?limit=5
const getTopItems = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  try {
    const result = await pool.query(
      `SELECT mi.name, SUM(oi.quantity) AS total_ordered
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
       GROUP BY mi.name
       ORDER BY total_ordered DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardSummary, getSalesByDate, getTopItems };

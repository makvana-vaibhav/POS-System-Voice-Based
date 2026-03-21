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

// GET /api/dashboard/item-revenue?menuItemId=1
const getItemRevenue = async (req, res) => {
  const menuItemId = Number(req.query.menuItemId);

  if (!menuItemId) {
    return res.status(400).json({ success: false, message: 'menuItemId is required' });
  }

  try {
    const itemResult = await pool.query('SELECT id, name FROM menu_items WHERE id = $1', [menuItemId]);
    if (!itemResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const revenueResult = await pool.query(
      `SELECT
        COALESCE(SUM(oi.quantity), 0) AS total_quantity,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS gross_revenue,
        COALESCE(COUNT(DISTINCT p.id), 0) AS paid_orders_count
      FROM order_items oi
      LEFT JOIN payments p
        ON p.order_id = oi.order_id
       AND p.payment_status = 'paid'
      WHERE oi.menu_item_id = $1`,
      [menuItemId]
    );

    res.json({
      success: true,
      data: {
        menu_item_id: itemResult.rows[0].id,
        menu_item_name: itemResult.rows[0].name,
        total_quantity: Number(revenueResult.rows[0].total_quantity || 0),
        gross_revenue: Number(revenueResult.rows[0].gross_revenue || 0),
        paid_orders_count: Number(revenueResult.rows[0].paid_orders_count || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
const getAnalytics = async (req, res) => {
  const { from, to } = req.query;

  try {
    const [kpiResult, dailySalesResult, paymentBreakdownResult] = await Promise.all([
      pool.query(
        `SELECT
            COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
            COUNT(*) FILTER (WHERE o.status = 'served') AS served_orders,
            COUNT(*) FILTER (WHERE o.status = 'pending') AS pending_orders,
            COUNT(*) FILTER (WHERE o.status = 'preparing') AS preparing_orders,
            COUNT(*) FILTER (WHERE o.status = 'ready') AS ready_orders,
            COUNT(DISTINCT o.table_id) AS unique_tables_used,
            COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
            COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.total_amount ELSE 0 END), 0) AS total_revenue,
            COALESCE(COUNT(p.id) FILTER (WHERE p.payment_status = 'paid'), 0) AS total_paid_orders
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN payments p ON p.order_id = o.id
         WHERE ($1::date IS NULL OR DATE(o.created_at) >= $1::date)
           AND ($2::date IS NULL OR DATE(o.created_at) <= $2::date)`,
        [from || null, to || null]
      ),
      pool.query(
        `SELECT
            DATE(p.created_at) AS date,
            COUNT(*) FILTER (WHERE p.payment_status = 'paid') AS paid_orders,
            COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.total_amount ELSE 0 END), 0) AS revenue
         FROM payments p
         WHERE ($1::date IS NULL OR DATE(p.created_at) >= $1::date)
           AND ($2::date IS NULL OR DATE(p.created_at) <= $2::date)
         GROUP BY DATE(p.created_at)
         ORDER BY date DESC`,
        [from || null, to || null]
      ),
      pool.query(
        `SELECT
            payment_method,
            COUNT(*) FILTER (WHERE payment_status = 'paid') AS count,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue
         FROM payments
         WHERE ($1::date IS NULL OR DATE(created_at) >= $1::date)
           AND ($2::date IS NULL OR DATE(created_at) <= $2::date)
         GROUP BY payment_method
         ORDER BY revenue DESC`,
        [from || null, to || null]
      ),
    ]);

    const kpi = kpiResult.rows[0] || {};
    const totalPaidOrders = Number(kpi.total_paid_orders || 0);
    const totalRevenue = Number(kpi.total_revenue || 0);

    res.json({
      success: true,
      data: {
        kpis: {
          total_orders: Number(kpi.total_orders || 0),
          cancelled_orders: Number(kpi.cancelled_orders || 0),
          served_orders: Number(kpi.served_orders || 0),
          pending_orders: Number(kpi.pending_orders || 0),
          preparing_orders: Number(kpi.preparing_orders || 0),
          ready_orders: Number(kpi.ready_orders || 0),
          unique_tables_used: Number(kpi.unique_tables_used || 0),
          total_items_sold: Number(kpi.total_items_sold || 0),
          total_revenue: totalRevenue,
          total_paid_orders: totalPaidOrders,
          average_order_value: totalPaidOrders ? Number((totalRevenue / totalPaidOrders).toFixed(2)) : 0,
        },
        daily_sales: dailySalesResult.rows,
        payment_method_breakdown: paymentBreakdownResult.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardSummary, getSalesByDate, getTopItems, getItemRevenue, getAnalytics };

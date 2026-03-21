import { useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { orderApi, tableApi } from '../services/api';

function MiniLineChart({ points = [] }) {
  if (!points.length) {
    return <p className="muted-text">No chart data</p>;
  }

  const maxValue = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="mini-line-chart" aria-label="Daily sales chart">
      {points.map((point) => (
        <div key={point.label} className="mini-line-point-wrap" title={`${point.label}: ${formatCurrency(point.value)}`}>
          <div className="mini-line-point" style={{ height: `${Math.max(6, (point.value / maxValue) * 100)}%` }} />
          <small>{point.label}</small>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ rows = [] }) {
  if (!rows.length) {
    return <p className="muted-text">No chart data</p>;
  }

  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="mini-bar-chart" aria-label="Top items chart">
      {rows.map((row) => (
        <div key={row.label} className="mini-bar-row">
          <span>{row.label}</span>
          <div className="mini-bar-track">
            <div className="mini-bar-fill" style={{ width: `${(row.value / maxValue) * 100}%` }} />
          </div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DashboardIcon({ name }) {
  const common = {
    fill: 'none',
    viewBox: '0 0 24 24',
    strokeWidth: 1.8,
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'dashboard-card-icon-svg',
    'aria-hidden': 'true',
  };

  switch (name) {
    case 'overview':
      return (
        <svg {...common}>
          <path d="M4 13.5h4V20H4zM10 9h4v11h-4zM16 4h4v16h-4z" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M4 19l6-6 4 4 6-8" />
          <path d="M17 9h3V6" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M6 4v7" />
          <path d="M10 4v7" />
          <path d="M8 4v16" />
          <path d="M16 4c1.7 0 3 1.3 3 3v13" />
        </svg>
      );
    case 'tables':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="14" height="7" rx="1.8" />
          <path d="M8 13v5M16 13v5" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
          <path d="M16 10a2.5 2.5 0 1 0 0-5" />
          <path d="M16 14c2.3 0 4.2 1.7 4.5 3.9" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg {...common}>
          <path d="M7 10h10" />
          <path d="M8 10V8a4 4 0 1 1 8 0v2" />
          <path d="M9 10v8M15 10v8M6 18h12" />
        </svg>
      );
    case 'billing':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    default:
      return null;
  }
}

function getDateRange(period) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  const start = new Date(today);

  if (period === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (period === 'month') {
    start.setDate(start.getDate() - 29);
  }

  const from = start.toISOString().split('T')[0];
  return { from, to };
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function DashboardPage({ onNavigate, viewMode = 'dashboard' }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [activeTablesCount, setActiveTablesCount] = useState(0);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dashboardCards = useMemo(
    () => [
      { key: 'menu', title: 'Menu', icon: 'menu', tone: 'emerald', description: 'Manage items and categories' },
      { key: 'tables', title: 'Tables', icon: 'tables', tone: 'orange', description: 'Manage table setup and status' },
      { key: 'users', title: 'Users', icon: 'users', tone: 'sky', description: 'Create users and assign roles' },
      { key: 'orders', title: 'Waiter Orders', icon: 'orders', tone: 'rose', description: 'Create and send orders' },
      { key: 'kitchen', title: 'Kitchen', icon: 'kitchen', tone: 'amber', description: 'Update order prep statuses' },
      { key: 'billing', title: 'Cashier Billing', icon: 'billing', tone: 'teal', description: 'Bills, payments, and print' },
    ],
    []
  );

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        const { from, to } = getDateRange(analyticsPeriod);

        const [summaryResponse, analyticsResponse, topItemsResponse, ordersResponse, tablesResponse] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getAnalytics({ from, to }),
          dashboardApi.getTopItems(5),
          orderApi.getOrders(),
          tableApi.getTables(),
        ]);

        setSummary(summaryResponse.data || null);
        setAnalytics(analyticsResponse.data || null);
        setTopItems(topItemsResponse.data || []);

        const activeOrders = (ordersResponse.data || [])
          .filter((order) => ['pending', 'preparing', 'ready'].includes(order.status))
          .slice(0, 8);
        setLiveOrders(activeOrders);

        const activeTables = (tablesResponse.data || []).filter((table) => table.status !== 'available');
        setActiveTablesCount(activeTables.length);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [analyticsPeriod]);

  const dailySalesChartData = useMemo(() => {
    const rows = analytics?.daily_sales || [];
    return [...rows]
      .reverse()
      .map((row) => ({
        label: formatDateTime(row.date).split(',')[0],
        value: Number(row.revenue || 0),
      }));
  }, [analytics]);

  const topItemsChartData = useMemo(
    () => topItems.map((item) => ({ label: item.name, value: Number(item.total_ordered || 0) })),
    [topItems]
  );

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>{viewMode === 'dashboard' ? 'Dashboard' : 'Analytics'}</h1>
        <p>
          {viewMode === 'dashboard'
            ? 'Live operations with top KPIs and active orders.'
            : 'Detailed analytics with filters and charts.'}
        </p>
      </header>

      {loading ? <p className="info-text">Loading dashboard...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && viewMode === 'dashboard' ? (
        <>
          <section className="dashboard-modules-grid">
            {dashboardCards.map((card) => (
              <button
                key={card.key}
                className={`dashboard-nav-card tone-${card.tone} is-nav`}
                onClick={() => onNavigate?.(card.key)}
                type="button"
              >
                <div className="dashboard-card-head">
                  <span className="dashboard-card-icon" aria-hidden="true">
                    <DashboardIcon name={card.icon} />
                  </span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </button>
            ))}
          </section>

          <section className="analytics-kpi-grid">
            <article className="dashboard-kpi-card">
              <p>Revenue Today</p>
              <h3>{formatCurrency(summary?.revenue_today ?? 0)}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Orders Today</p>
              <h3>{summary?.orders_today ?? 0}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Active Tables</p>
              <h3>{activeTablesCount}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Pending Orders</p>
              <h3>{analytics?.kpis?.pending_orders ?? 0}</h3>
            </article>
          </section>

          <section className="panel-card dashboard-insight-panel">
            <h2>Live Orders</h2>
            <ul className="top-items-list">
              {liveOrders.length ? (
                liveOrders.map((order) => (
                  <li key={order.id}>
                    <span>Order #{order.id} · {order.table_number ? `Table ${order.table_number}` : 'Takeaway'} · {order.status}</span>
                    <strong>{formatDateTime(order.created_at)}</strong>
                  </li>
                ))
              ) : (
                <li>
                  <span>No live orders right now</span>
                </li>
              )}
            </ul>
          </section>
        </>
      ) : null}

      {!loading && viewMode === 'analytics' ? (
        <section className="panel-card dashboard-insight-panel">
          <h2>Analytics</h2>

          <div className="category-filter">
            <button
              type="button"
              className={analyticsPeriod === 'today' ? 'active' : ''}
              onClick={() => setAnalyticsPeriod('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={analyticsPeriod === 'week' ? 'active' : ''}
              onClick={() => setAnalyticsPeriod('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={analyticsPeriod === 'month' ? 'active' : ''}
              onClick={() => setAnalyticsPeriod('month')}
            >
              Month
            </button>
          </div>

          <div className="analytics-kpi-grid">
            <article className="dashboard-kpi-card">
              <p>Total Orders</p>
              <h3>{analytics?.kpis?.total_orders ?? 0}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Total Revenue</p>
              <h3>{formatCurrency(analytics?.kpis?.total_revenue ?? 0)}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Paid Orders</p>
              <h3>{analytics?.kpis?.total_paid_orders ?? 0}</h3>
            </article>
            <article className="dashboard-kpi-card">
              <p>Avg Order Value</p>
              <h3>{formatCurrency(analytics?.kpis?.average_order_value ?? 0)}</h3>
            </article>
          </div>

          <div className="analytics-split-grid">
            <article className="panel-card">
              <h2>Daily Sales (Line)</h2>
              <MiniLineChart points={dailySalesChartData} />
            </article>

            <article className="panel-card">
              <h2>Top Items (Bar)</h2>
              <MiniBarChart rows={topItemsChartData} />
            </article>
          </div>

          <div className="analytics-split-grid">
            <article className="panel-card">
              <h2>Daily Sales</h2>
              <ul className="top-items-list">
                {(analytics?.daily_sales || []).length ? (
                  analytics.daily_sales.map((row) => (
                    <li key={row.date}>
                      <span>{formatDateTime(row.date)}</span>
                      <strong>{formatCurrency(row.revenue)}</strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <span>No daily sales data</span>
                  </li>
                )}
              </ul>
            </article>

            <article className="panel-card">
              <h2>Payment Methods</h2>
              <ul className="top-items-list">
                {(analytics?.payment_method_breakdown || []).length ? (
                  analytics.payment_method_breakdown.map((row) => (
                    <li key={row.payment_method}>
                      <span>{row.payment_method}</span>
                      <strong>{formatCurrency(row.revenue)}</strong>
                    </li>
                  ))
                ) : (
                  <li>
                    <span>No payment data</span>
                  </li>
                )}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

    </main>
  );
}

export default DashboardPage;

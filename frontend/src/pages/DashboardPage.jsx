import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import { dashboardApi } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [summaryResponse, topItemsResponse] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getTopItems(5),
        ]);

        setSummary(summaryResponse.data || null);
        setTopItems(topItemsResponse.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Dashboard (Step 2)</h1>
        <p>Owner-facing summary from live backend data.</p>
      </header>

      {loading ? <p className="info-text">Loading dashboard...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && summary ? (
        <>
          <section className="stats-grid">
            <StatCard label="Orders Today" value={summary.orders_today} />
            <StatCard label="Revenue Today" value={formatCurrency(summary.revenue_today)} />
            <StatCard label="Tables Available" value={summary.tables_available} />
          </section>

          <section className="panel-card">
            <h2>Top Ordered Items</h2>
            {topItems.length ? (
              <ul className="top-items-list">
                {topItems.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.total_ordered}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No order data yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default DashboardPage;

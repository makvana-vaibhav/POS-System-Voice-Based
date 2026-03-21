import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

function formatDateLabel(value) {
  if (!value) return '-';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function toDateInputValue(date) {
  return date.toISOString().split('T')[0];
}

function getRangeByPreset(preset) {
  const toDate = new Date();
  const fromDate = new Date();

  if (preset === 'today') {
    return {
      from: toDateInputValue(toDate),
      to: toDateInputValue(toDate),
    };
  }

  if (preset === '7days') {
    fromDate.setDate(fromDate.getDate() - 6);
    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  fromDate.setDate(fromDate.getDate() - 29);
  return {
    from: toDateInputValue(fromDate),
    to: toDateInputValue(toDate),
  };
}

function downloadCsvFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AnalyticsPage() {
  const [rangePreset, setRangePreset] = useState('today');
  const [from, setFrom] = useState(getRangeByPreset('today').from);
  const [to, setTo] = useState(getRangeByPreset('today').to);
  const [analytics, setAnalytics] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rangePreset === 'custom') return;
    const range = getRangeByPreset(rangePreset);
    setFrom(range.from);
    setTo(range.to);
  }, [rangePreset]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError('');

        const [analyticsResponse, topItemsResponse] = await Promise.all([
          dashboardApi.getAnalytics({ from, to }),
          dashboardApi.getTopItems({ limit: 5, from, to }),
        ]);

        setAnalytics(analyticsResponse.data || null);
        setTopItems(topItemsResponse.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [from, to]);

  function handleExportCsv() {
    const rows = analytics?.daily_sales || [];
    if (!rows.length) return;

    const lines = [
      'Date,Orders,Revenue',
      ...rows.map((row) => {
        const date = row.date ? new Date(row.date).toISOString().split('T')[0] : '';
        const paidOrders = Number(row.paid_orders || 0);
        const revenue = Number(row.revenue || 0);
        return `${date},${paidOrders},${revenue}`;
      }),
    ];

    downloadCsvFile(`sales-${from}-to-${to}.csv`, `${lines.join('\n')}\n`);
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Analytics</h1>
        <p>Owner view: revenue, orders, top items, payment split, and export.</p>
      </header>

      <section className="panel-card dashboard-insight-panel">
        <div className="category-filter">
          <button
            type="button"
            className={rangePreset === 'today' ? 'active' : ''}
            onClick={() => setRangePreset('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={rangePreset === '7days' ? 'active' : ''}
            onClick={() => setRangePreset('7days')}
          >
            7 Days
          </button>
          <button
            type="button"
            className={rangePreset === '30days' ? 'active' : ''}
            onClick={() => setRangePreset('30days')}
          >
            30 Days
          </button>
          <button
            type="button"
            className={rangePreset === 'custom' ? 'active' : ''}
            onClick={() => setRangePreset('custom')}
          >
            Specific Range
          </button>
        </div>

        {rangePreset === 'custom' ? (
          <div className="analytics-filter-row">
            <label>
              <span>From</span>
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <label>
              <span>Export</span>
              <button type="button" className="secondary-btn" onClick={handleExportCsv} disabled={!analytics?.daily_sales?.length}>
                Export Sales CSV
              </button>
            </label>
          </div>
        ) : (
          <div className="analytics-export-row">
            <button type="button" className="secondary-btn" onClick={handleExportCsv} disabled={!analytics?.daily_sales?.length}>
              Export Sales CSV
            </button>
          </div>
        )}

        {loading ? <p className="info-text">Loading analytics...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading ? (
          <>
            <div className="analytics-kpi-grid">
              <article className="dashboard-kpi-card">
                <p>Total Revenue</p>
                <h3>{formatCurrency(analytics?.kpis?.total_revenue ?? 0)}</h3>
              </article>
              <article className="dashboard-kpi-card">
                <p>Total Orders</p>
                <h3>{analytics?.kpis?.total_orders ?? 0}</h3>
              </article>
              <article className="dashboard-kpi-card">
                <p>Avg Order Value</p>
                <h3>{formatCurrency(analytics?.kpis?.average_order_value ?? 0)}</h3>
              </article>
              <article className="dashboard-kpi-card">
                <p>Pending Orders</p>
                <h3>{analytics?.kpis?.pending_orders ?? 0}</h3>
              </article>
            </div>

            <div className="analytics-split-grid">
              <article className="panel-card">
                <h2>Daily Sales</h2>
                <ul className="top-items-list">
                  {(analytics?.daily_sales || []).length ? (
                    analytics.daily_sales.map((row) => (
                      <li key={row.date}>
                        <span>{formatDateLabel(row.date)}</span>
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
                <h2>Top Items (Top 5)</h2>
                <ul className="top-items-list">
                  {topItems.length ? (
                    topItems.slice(0, 5).map((item) => (
                      <li key={item.name}>
                        <span>{item.name}</span>
                        <strong>{item.total_ordered}</strong>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span>No top items data</span>
                    </li>
                  )}
                </ul>

                <h2>Payment Breakdown</h2>
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
          </>
        ) : null}
      </section>
    </main>
  );
}

export default AnalyticsPage;

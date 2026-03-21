import { useEffect, useMemo, useState } from 'react';
import BillingOrderCard from '../components/billing/BillingOrderCard';
import { paymentApi } from '../services/api';
import { printReceipt } from '../utils/printReceipt';

function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadBillingData() {
    try {
      setLoading(true);
      setError('');

      const activeBillsResponse = await paymentApi.getActiveBills();
      const activeRows = activeBillsResponse.data || [];

      setOrders(activeRows);
      setPaymentsByOrderId(
        activeRows.reduce((acc, row) => {
          acc[row.id] = row.payment || null;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBillingData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  async function handleMarkPaid(orderId, paymentMethod) {
    try {
      setPayingOrderId(orderId);
      setError('');
      setSuccessMessage('');

      if (!paymentsByOrderId[orderId]) {
        const billResponse = await paymentApi.generateBill(orderId);
        setPaymentsByOrderId((prev) => ({ ...prev, [orderId]: billResponse.data }));
      }

      const payResponse = await paymentApi.processPayment(orderId, paymentMethod);
      setPaymentsByOrderId((prev) => ({ ...prev, [orderId]: payResponse.data }));

      setSuccessMessage(`Payment completed for order #${orderId}.`);
      await loadBillingData();
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setPayingOrderId(null);
    }
  }

  async function handlePrintBill(order) {
    try {
      setPrintingOrderId(order.id);
      setError('');

      let payment = paymentsByOrderId[order.id];
      if (!payment) {
        const billResponse = await paymentApi.generateBill(order.id);
        payment = billResponse.data;
        setPaymentsByOrderId((prev) => ({ ...prev, [order.id]: payment }));
      }

      printReceipt({
        order,
        payment,
        restaurantName: 'AI POS Restaurant',
        restaurantAddress: 'Main Branch',
        restaurantPhone: '+91-0000000000',
      });
    } catch (err) {
      setError(err.message || 'Failed to print bill');
    } finally {
      setPrintingOrderId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Cashier - Billing & Payments (Step 7)</h1>
        <p>View running unpaid bills only and complete payments.</p>
      </header>

      <section className="kds-toolbar">
        <div className="category-filter">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={statusFilter === 'ready' ? 'active' : ''}
            onClick={() => setStatusFilter('ready')}
          >
            Ready
          </button>
          <button
            className={statusFilter === 'pending' ? 'active' : ''}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={statusFilter === 'preparing' ? 'active' : ''}
            onClick={() => setStatusFilter('preparing')}
          >
            Preparing
          </button>
          <button
            className={statusFilter === 'served' ? 'active' : ''}
            onClick={() => setStatusFilter('served')}
          >
            Served
          </button>
        </div>

        <button type="button" className="secondary-btn" onClick={loadBillingData}>
          Refresh
        </button>
      </section>

      {loading ? <p className="info-text">Loading billing data...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {!loading ? (
        <section className="billing-grid">
          {filteredOrders.length ? (
            filteredOrders.map((order) => (
              <BillingOrderCard
                key={order.id}
                order={order}
                payment={paymentsByOrderId[order.id]}
                onPay={handleMarkPaid}
                onPrint={handlePrintBill}
                payingOrderId={payingOrderId}
                printingOrderId={printingOrderId}
              />
            ))
          ) : (
            <p className="empty-state">No billable orders right now.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default BillingPage;

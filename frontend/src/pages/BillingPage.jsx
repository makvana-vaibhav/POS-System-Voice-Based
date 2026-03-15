import { useEffect, useMemo, useState } from 'react';
import BillingOrderCard from '../components/billing/BillingOrderCard';
import { orderApi, paymentApi } from '../services/api';

function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [paymentsByOrderId, setPaymentsByOrderId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatingOrderId, setGeneratingOrderId] = useState(null);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  async function tryLoadPayment(orderId) {
    try {
      const response = await paymentApi.getPaymentByOrderId(orderId);
      setPaymentsByOrderId((prev) => ({ ...prev, [orderId]: response.data }));
    } catch {
      // bill not generated yet -> ignore
    }
  }

  async function loadBillingData() {
    try {
      setLoading(true);
      setError('');

      const ordersResponse = await orderApi.getOrders();
      const billableOrders = (ordersResponse.data || []).filter((order) =>
        ['ready', 'served'].includes(order.status)
      );

      setOrders(billableOrders);

      await Promise.all(billableOrders.map((order) => tryLoadPayment(order.id)));
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

  async function handleGenerateBill(orderId) {
    try {
      setGeneratingOrderId(orderId);
      setError('');
      setSuccessMessage('');

      const response = await paymentApi.generateBill(orderId);
      setPaymentsByOrderId((prev) => ({ ...prev, [orderId]: response.data }));
      setSuccessMessage(`Bill generated for order #${orderId}.`);
    } catch (err) {
      setError(err.message || 'Failed to generate bill');
    } finally {
      setGeneratingOrderId(null);
    }
  }

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

      const order = orders.find((row) => row.id === orderId);
      if (order && order.status !== 'served') {
        await orderApi.updateOrderStatus(orderId, 'served');
      }

      setSuccessMessage(`Payment completed for order #${orderId}.`);
      await loadBillingData();
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setPayingOrderId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Cashier - Billing & Payments (Step 7)</h1>
        <p>Generate bills for ready orders and complete payments.</p>
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
                onGenerateBill={handleGenerateBill}
                onPay={handleMarkPaid}
                generatingOrderId={generatingOrderId}
                payingOrderId={payingOrderId}
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

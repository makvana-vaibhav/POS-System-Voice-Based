import { useEffect, useMemo, useState } from 'react';
import KitchenOrderCard from '../components/kitchen/KitchenOrderCard';
import { orderApi } from '../services/api';

function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  async function loadOrders() {
    try {
      if (!orders.length) {
        setLoading(true);
      }
      setError('');

      const response = await orderApi.getOrders();
      const orderList = response.data || [];
      const activeKitchenOrders = orderList.filter((order) =>
        ['pending', 'preparing', 'ready'].includes(order.status)
      );
      setOrders(activeKitchenOrders);
    } catch (err) {
      setError(err.message || 'Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const intervalId = setInterval(loadOrders, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredOrders = useMemo(() => {
    const scopedOrders =
      selectedStatus === 'all'
        ? orders
        : orders.filter((order) => order.status === selectedStatus);

    return [...scopedOrders].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (aTime === bTime) {
        return Number(a.id) - Number(b.id);
      }
      return aTime - bTime;
    });
  }, [orders, selectedStatus]);

  const ticketSequenceByOrderId = useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (aTime === bTime) {
        return Number(a.id) - Number(b.id);
      }
      return aTime - bTime;
    });

    const sequenceByTable = new Map();
    const sequenceByOrderId = {};

    sortedOrders.forEach((order) => {
      const tableKey = order.table_id ? `table-${order.table_id}` : `takeaway-${order.id}`;
      const nextSequence = (sequenceByTable.get(tableKey) || 0) + 1;
      sequenceByTable.set(tableKey, nextSequence);
      sequenceByOrderId[order.id] = nextSequence;
    });

    return sequenceByOrderId;
  }, [orders]);

  const baseOrderIdByOrderId = useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (aTime === bTime) {
        return Number(a.id) - Number(b.id);
      }
      return aTime - bTime;
    });

    const firstOrderByTable = new Map();
    const baseByOrderId = {};

    sortedOrders.forEach((order) => {
      const tableKey = order.table_id ? `table-${order.table_id}` : `takeaway-${order.id}`;
      if (!firstOrderByTable.has(tableKey)) {
        firstOrderByTable.set(tableKey, order.id);
      }
      baseByOrderId[order.id] = firstOrderByTable.get(tableKey);
    });

    return baseByOrderId;
  }, [orders]);

  async function handleUpdateStatus(orderId, status) {
    try {
      setUpdatingOrderId(orderId);
      setError('');
      await orderApi.updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Kitchen Display System (Step 6)</h1>
        <p>Kitchen can only view active orders and update preparation status.</p>
      </header>

      <section className="kds-toolbar">
        <div className="category-filter">
          <button
            className={selectedStatus === 'all' ? 'active' : ''}
            onClick={() => setSelectedStatus('all')}
          >
            All Active
          </button>
          <button
            className={selectedStatus === 'pending' ? 'active' : ''}
            onClick={() => setSelectedStatus('pending')}
          >
            Pending
          </button>
          <button
            className={selectedStatus === 'preparing' ? 'active' : ''}
            onClick={() => setSelectedStatus('preparing')}
          >
            Preparing
          </button>
          <button
            className={selectedStatus === 'ready' ? 'active' : ''}
            onClick={() => setSelectedStatus('ready')}
          >
            Ready
          </button>
        </div>

        <button type="button" className="secondary-btn" onClick={loadOrders}>
          Refresh
        </button>
      </section>

      {loading ? <p className="info-text">Loading kitchen orders...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading ? (
        <section className="kds-grid">
          {filteredOrders.length ? (
            filteredOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                updatingOrderId={updatingOrderId}
                ticketSequence={ticketSequenceByOrderId[order.id] || 1}
                displayOrderId={baseOrderIdByOrderId[order.id] || order.id}
              />
            ))
          ) : (
            <p className="empty-state">No kitchen orders in this status.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default KitchenPage;

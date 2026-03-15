import { formatCurrency } from '../../utils/formatCurrency';

function KitchenOrderCard({ order, onUpdateStatus, updatingOrderId }) {
  const statusFlow = ['pending', 'preparing', 'ready', 'served'];
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const nextStatus =
    currentStatusIndex >= 0 && currentStatusIndex < statusFlow.length - 1
      ? statusFlow[currentStatusIndex + 1]
      : null;

  const total = (order.items || []).reduce(
    (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <article className="kds-card">
      <div className="kds-card-header">
        <div>
          <h3>Order #{order.id}</h3>
          <p>{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</p>
        </div>
        <span className={`status-badge status-${order.status}`}>{order.status}</span>
      </div>

      <ul className="kds-items-list">
        {(order.items || []).map((item) => (
          <li key={item.id}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <strong>{formatCurrency(Number(item.unit_price) * Number(item.quantity))}</strong>
          </li>
        ))}
      </ul>

      <div className="kds-card-footer">
        <strong>Total: {formatCurrency(total)}</strong>
        {nextStatus ? (
          <button
            type="button"
            className="primary-btn"
            disabled={updatingOrderId === order.id}
            onClick={() => onUpdateStatus(order.id, nextStatus)}
          >
            {updatingOrderId === order.id ? 'Updating...' : `Mark ${nextStatus}`}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default KitchenOrderCard;

function KitchenOrderCard({
  order,
  onUpdateStatus,
  updatingOrderId,
}) {
  const statusFlow = ['pending', 'preparing', 'ready', 'served'];
  const currentStatusIndex = statusFlow.indexOf(order.status);
  const nextStatus =
    currentStatusIndex >= 0 && currentStatusIndex < statusFlow.length - 1
      ? statusFlow[currentStatusIndex + 1]
      : null;

  function getElapsedTime(value) {
    const now = Date.now();
    const created = new Date(value).getTime();
    const diffMins = Math.max(0, Math.floor((now - created) / 60000));
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }

  const actionLabel =
    nextStatus === 'preparing'
      ? 'Start Cooking'
      : nextStatus === 'ready'
      ? 'Mark Ready'
      : nextStatus
      ? `Mark ${nextStatus}`
      : null;

  return (
    <article className="kds-card">
      <div className="kds-card-header">
        <div>
          <h3>Order #{order.id}</h3>
          <p>{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</p>
          <p className="muted-text">⏱ {getElapsedTime(order.created_at)} ago</p>
        </div>
        <span className={`status-badge status-${order.status}`}>{order.status}</span>
      </div>

      <ul className="kds-items-list">
        {(order.items || []).map((item) => (
          <li key={item.id}>
            <span>
              {item.quantity} × {item.name}
              {item.description ? ` — ${item.description}` : ''}
            </span>
          </li>
        ))}
      </ul>

      {order.note ? (
        <div className="kds-note-section">
          <strong>Order Note:</strong>
          <p>{order.note}</p>
        </div>
      ) : null}

      <div className="kds-card-footer">
        {nextStatus ? (
          <button
            type="button"
            className="primary-btn"
            disabled={updatingOrderId === order.id}
            onClick={() => onUpdateStatus(order.id, nextStatus)}
          >
            {updatingOrderId === order.id ? 'Updating...' : actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default KitchenOrderCard;

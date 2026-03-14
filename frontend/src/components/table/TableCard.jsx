function TableCard({ table, onEdit, onDelete, onStatusChange }) {
  const statuses = ['available', 'occupied', 'reserved'];

  return (
    <article className="table-card">
      <div className="table-card-header">
        <div>
          <h3>Table {table.table_number}</h3>
          <p>Capacity: {table.capacity}</p>
        </div>
        <div className="table-card-meta">
          <span className={`status-badge status-${table.status}`}>{table.status}</span>
          <div className="action-buttons">
            <button type="button" className="secondary-btn" onClick={() => onEdit(table)}>
              Edit
            </button>
            <button type="button" className="danger-btn" onClick={() => onDelete(table.id)}>
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="table-actions">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={table.status === status ? 'active' : ''}
            onClick={() => onStatusChange(table.id, status)}
            disabled={table.status === status}
          >
            {status}
          </button>
        ))}
      </div>
    </article>
  );
}

export default TableCard;

function TableCard({ table, onStatusChange, onOpenOrder }) {
  return (
    <article className={`table-card table-card-${table.status}`}>
      <div className="table-card-header">
        <div>
          <h3>
            <button type="button" className="table-open-link" onClick={() => onOpenOrder?.(table)}>
              Table {table.table_number}
            </button>
          </h3>
        </div>
        <div className="table-card-meta">
          <span className={`status-badge status-${table.status}`}>{table.status}</span>
        </div>
      </div>

      <div className="table-actions">
        <select value={table.status} onChange={(event) => onStatusChange(table.id, event.target.value)}>
          <option value="available">available</option>
          <option value="occupied">occupied</option>
          <option value="reserved">reserved</option>
        </select>

        <button type="button" className="primary-btn" onClick={() => onOpenOrder?.(table)}>
          Open Order
        </button>
      </div>
    </article>
  );
}

export default TableCard;

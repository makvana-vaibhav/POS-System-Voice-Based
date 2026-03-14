import { formatCurrency } from '../../utils/formatCurrency';

function OrderCart({
  selectedTableId,
  availableTables,
  orderType,
  note,
  cartItems,
  subtotal,
  onTableChange,
  onOrderTypeChange,
  onNoteChange,
  onIncrease,
  onDecrease,
  onRemove,
  onSubmit,
  submitting,
}) {
  return (
    <aside className="order-cart-card">
      <h2>Current Bill</h2>

      <div className="order-form-grid">
        <label>
          <span>Order type</span>
          <select value={orderType} onChange={(event) => onOrderTypeChange(event.target.value)}>
            <option value="dine-in">dine-in</option>
            <option value="takeaway">takeaway</option>
          </select>
        </label>

        <label>
          <span>Select table</span>
          <select
            value={selectedTableId}
            onChange={(event) => onTableChange(event.target.value)}
            disabled={orderType === 'takeaway'}
          >
            <option value="">Choose table</option>
            {availableTables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.table_number} ({table.capacity} seats)
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="order-note-field">
        <span>Order note</span>
        <textarea
          rows="3"
          placeholder="Optional note for kitchen or service"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </label>

      <div className="cart-items-list">
        {cartItems.length ? (
          cartItems.map((item) => (
            <div key={item.id} className="cart-item-row">
              <div>
                <strong>{item.name}</strong>
                <p>{formatCurrency(item.price)} each</p>
              </div>

              <div className="cart-item-controls">
                <button type="button" onClick={() => onDecrease(item.id)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => onIncrease(item.id)}>
                  +
                </button>
                <button type="button" className="danger-btn" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No items added yet.</p>
        )}
      </div>

      <div className="cart-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
      </div>

      <button type="button" className="submit-order-btn" onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Placing Order...' : 'Place Order'}
      </button>
    </aside>
  );
}

export default OrderCart;

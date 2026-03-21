import { formatCurrency } from '../../utils/formatCurrency';

function OrderCart({
  selectedTableId,
  orderType,
  note,
  cartItems,
  subtotal,
  onNoteChange,
  onIncrease,
  onDecrease,
  onRemove,
  onSubmit,
  canPlaceOrder,
  submitting,
}) {
  const showTableWarning = orderType === 'dine-in' && !selectedTableId;
  const showItemWarning = cartItems.length === 0;

  return (
    <aside className="order-cart-card">
      <div className="order-cart-header">
        <h2>Current Bill</h2>
        <span className="muted-text">Live</span>
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
              <strong className="cart-item-name">{item.name}</strong>
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
          <strong className="bill-total-amount">{formatCurrency(subtotal)}</strong>
        </div>
      </div>

      {showTableWarning ? (
        <p className="cart-warning-text">Select a table for dine-in order.</p>
      ) : null}
      {showItemWarning ? <p className="cart-warning-text">Add at least one item.</p> : null}

      <div className="order-cart-footer-sticky">
        <button
          type="button"
          className="submit-order-btn"
          onClick={onSubmit}
          disabled={submitting || !canPlaceOrder}
        >
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </aside>
  );
}

export default OrderCart;

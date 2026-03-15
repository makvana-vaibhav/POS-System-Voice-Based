import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

function BillingOrderCard({
  order,
  payment,
  onGenerateBill,
  onPay,
  generatingOrderId,
  payingOrderId,
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const itemSubtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
    0
  );

  const isGenerating = generatingOrderId === order.id;
  const isPaying = payingOrderId === order.id;

  return (
    <article className="billing-card">
      <div className="billing-card-header">
        <div>
          <h3>Order #{order.id}</h3>
          <p>{order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</p>
        </div>
        <span className={`status-badge status-${order.status}`}>{order.status}</span>
      </div>

      <ul className="billing-items-list">
        {(order.items || []).map((item) => (
          <li key={item.id}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <strong>{formatCurrency(Number(item.unit_price) * Number(item.quantity))}</strong>
          </li>
        ))}
      </ul>

      {payment ? (
        <div className="bill-summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(payment.subtotal)}</strong>
          </div>
          <div>
            <span>Tax ({payment.tax_rate}%)</span>
            <strong>{formatCurrency(payment.tax_amount)}</strong>
          </div>
          <div className="bill-total-row">
            <span>Total</span>
            <strong>{formatCurrency(payment.total_amount)}</strong>
          </div>
          <div>
            <span>Payment status</span>
            <strong className={payment.payment_status === 'paid' ? 'paid-text' : ''}>
              {payment.payment_status}
            </strong>
          </div>
        </div>
      ) : (
        <div className="bill-summary">
          <div className="bill-total-row">
            <span>Estimated subtotal</span>
            <strong>{formatCurrency(itemSubtotal)}</strong>
          </div>
        </div>
      )}

      <div className="billing-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={() => onGenerateBill(order.id)}
          disabled={isGenerating || Boolean(payment)}
        >
          {payment ? 'Bill Generated' : isGenerating ? 'Generating...' : 'Generate Bill'}
        </button>

        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          disabled={payment?.payment_status === 'paid' || isPaying}
        >
          <option value="cash">cash</option>
          <option value="card">card</option>
          <option value="upi">upi</option>
          <option value="other">other</option>
        </select>

        <button
          type="button"
          className="primary-btn"
          onClick={() => onPay(order.id, paymentMethod)}
          disabled={payment?.payment_status === 'paid' || isPaying}
        >
          {payment?.payment_status === 'paid'
            ? 'Paid'
            : isPaying
            ? 'Processing...'
            : 'Mark Paid'}
        </button>
      </div>
    </article>
  );
}

export default BillingOrderCard;
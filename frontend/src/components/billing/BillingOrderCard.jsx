import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

function BillingOrderCard({
  order,
  payment,
  onPay,
  onPrint,
  payingOrderId,
  printingOrderId,
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const itemSubtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 0),
    0
  );

  const mergedItems = (order.items || []).reduce((acc, item) => {
    const key = String(item.menu_item_id || item.name || item.id);
    const qty = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || 0);

    if (!acc[key]) {
      acc[key] = {
        key,
        name: item.name,
        quantity: qty,
        amount: unitPrice * qty,
      };
    } else {
      acc[key].quantity += qty;
      acc[key].amount += unitPrice * qty;
    }

    return acc;
  }, {});

  const isPaying = payingOrderId === order.id;
  const isPrinting = printingOrderId === order.id;

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
        {Object.values(mergedItems).map((item) => (
          <li key={item.key}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <strong>{formatCurrency(item.amount)}</strong>
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
            <strong className="bill-total-amount">{formatCurrency(payment.total_amount)}</strong>
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

        <button
          type="button"
          className="secondary-btn"
          onClick={() => onPrint(order)}
          disabled={isPrinting}
        >
          {isPrinting ? 'Preparing Print...' : 'Print Bill'}
        </button>
      </div>
    </article>
  );
}

export default BillingOrderCard;
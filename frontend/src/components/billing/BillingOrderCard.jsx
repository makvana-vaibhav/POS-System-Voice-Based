import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

function BillingOrderCard({
  bill,
  gstRate,
  onPay,
  onComplete,
  onPrint,
  payingOrderId,
  completingOrderId,
  printingOrderId,
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const isPaying = payingOrderId === bill.id;
  const isCompleting = completingOrderId === bill.id;
  const isPrinting = printingOrderId === bill.id;

  return (
    <article className="billing-card">
      <div className="billing-card-header">
        <div>
          <h3>{bill.title}</h3>
          {!bill.table_number ? <p>{bill.subtitle}</p> : null}
          {bill.orderRefs?.length ? <p className="muted-text">Orders: {bill.orderRefs.join(', ')}</p> : null}
        </div>
        <span className={`status-badge status-${bill.status}`}>{bill.status}</span>
      </div>

      <ul className="billing-items-list">
        {bill.items.map((item) => (
          <li key={item.key}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <strong>{formatCurrency(item.amount)}</strong>
          </li>
        ))}
      </ul>

      <div className="bill-summary">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(bill.subtotal)}</strong>
        </div>
        <div>
          <span>Tax ({gstRate}%)</span>
          <strong>{formatCurrency(bill.taxAmount)}</strong>
        </div>
        <div className="bill-total-row">
          <span>Total</span>
          <strong className="bill-total-amount">{formatCurrency(bill.totalAmount)}</strong>
        </div>
      </div>

      <div className="billing-actions">
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          disabled={isPaying || isCompleting || bill.allPaid}
        >
          <option value="cash">cash</option>
          <option value="card">card</option>
          <option value="upi">upi</option>
          <option value="other">other</option>
        </select>

        {!bill.allPaid ? (
          <button
            type="button"
            className="primary-btn"
            onClick={() => onPay(bill.id, paymentMethod)}
            disabled={isPaying || isCompleting}
          >
            {isPaying ? 'Processing...' : 'Mark Paid'}
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            onClick={() => onComplete(bill.id)}
            disabled={isCompleting || isPaying}
          >
            {isCompleting ? 'Completing...' : 'Complete'}
          </button>
        )}

        <button
          type="button"
          className="secondary-btn"
          onClick={() => onPrint(bill)}
          disabled={isPrinting}
        >
          {isPrinting ? 'Preparing Print...' : 'Print Bill'}
        </button>
      </div>
    </article>
  );
}

export default BillingOrderCard;
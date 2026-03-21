import { formatCurrency } from './formatCurrency';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function printReceipt({
  order,
  payment,
  restaurantName = 'Restaurant POS',
  restaurantAddress = 'Main Branch',
  restaurantPhone = '+91-0000000000',
}) {
  if (!order || !payment) {
    throw new Error('Order and payment data are required for printing');
  }

  const items = order.items || [];
  const printedAt = new Date().toLocaleString();

  const rowsHtml = items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const lineTotal = quantity * unitPrice;

      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${quantity}</td>
          <td class="num">${escapeHtml(formatCurrency(unitPrice))}</td>
          <td class="num">${escapeHtml(formatCurrency(lineTotal))}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bill #${order.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111;
            margin: 16px;
            font-size: 12px;
          }
          .receipt {
            max-width: 360px;
            margin: 0 auto;
            border: 1px dashed #555;
            padding: 12px;
          }
          .center { text-align: center; }
          h1 {
            font-size: 16px;
            margin: 0 0 4px;
          }
          p { margin: 2px 0; }
          .muted { color: #555; }
          .line { border-top: 1px dashed #999; margin: 8px 0; }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 4px 0;
            border-bottom: 1px dotted #ddd;
            vertical-align: top;
          }
          .num { text-align: right; }
          .totals div {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .grand {
            font-weight: 700;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <section class="receipt">
          <div class="center">
            <h1>${escapeHtml(restaurantName)}</h1>
            <p class="muted">${escapeHtml(restaurantAddress)}</p>
            <p class="muted">${escapeHtml(restaurantPhone)}</p>
          </div>

          <div class="line"></div>

          <p><strong>Bill #:</strong> ${order.id}</p>
          <p><strong>Order Type:</strong> ${escapeHtml(order.order_type || 'dine-in')}</p>
          <p><strong>Table:</strong> ${order.table_number ? `Table ${order.table_number}` : 'Takeaway'}</p>
          <p><strong>Status:</strong> ${escapeHtml(payment.payment_status || 'pending')}</p>
          <p><strong>Date:</strong> ${escapeHtml(printedAt)}</p>

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="num">Qty</th>
                <th class="num">Price</th>
                <th class="num">Total</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="line"></div>

          <div class="totals">
            <div><span>Subtotal</span><strong>${escapeHtml(formatCurrency(payment.subtotal))}</strong></div>
            <div><span>Tax (${escapeHtml(payment.tax_rate)}%)</span><strong>${escapeHtml(formatCurrency(payment.tax_amount))}</strong></div>
            <div class="grand"><span>Grand Total</span><span>${escapeHtml(formatCurrency(payment.total_amount))}</span></div>
            <div><span>Payment Method</span><span>${escapeHtml(payment.payment_method || 'cash')}</span></div>
          </div>

          <div class="line"></div>
          <p class="center muted">Thank you. Visit again!</p>
        </section>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=420,height=760');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups to print the bill.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

import { useEffect, useMemo, useState } from 'react';
import BillingOrderCard from '../components/billing/BillingOrderCard';
import { paymentApi } from '../services/api';
import { printReceipt } from '../utils/printReceipt';
import { loadAppSettings } from '../utils/appSettings';

function BillingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [printingOrderId, setPrintingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [appSettings, setAppSettings] = useState(loadAppSettings());

  async function loadBillingData() {
    try {
      setLoading(true);
      setError('');

      const activeBillsResponse = await paymentApi.getActiveBills();
      const activeRows = activeBillsResponse.data || [];

      setOrders(activeRows);
    } catch (err) {
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAppSettings(loadAppSettings());
    loadBillingData();
  }, []);

  const gstEnabled = Boolean(appSettings.gstEnabled);
  const gstRate = Number(appSettings.gstRate || 0);

  const bills = useMemo(() => {
    const statusPriority = {
      pending: 1,
      preparing: 2,
      ready: 3,
      served: 4,
    };

    const mergedByTableId = new Map();
    const standaloneTakeaways = [];

    orders.forEach((order) => {
      if (order.table_id) {
        const tableKey = Number(order.table_id);
        const existing = mergedByTableId.get(tableKey) || {
          id: `table-${tableKey}`,
          table_id: tableKey,
          table_number: order.table_number,
          title: `Table ${order.table_number} Bill`,
          subtitle: `Table ${order.table_number}`,
          status: order.status,
          statusRank: statusPriority[order.status] || 999,
          created_at: order.created_at,
          order_type: 'dine-in',
          orders: [],
          items: [],
        };

        existing.orders.push(order);

        const nextRank = statusPriority[order.status] || 999;
        if (nextRank < existing.statusRank) {
          existing.status = order.status;
          existing.statusRank = nextRank;
        }

        if (new Date(order.created_at).getTime() < new Date(existing.created_at).getTime()) {
          existing.created_at = order.created_at;
        }

        mergedByTableId.set(tableKey, existing);
        return;
      }

      standaloneTakeaways.push({
        id: `takeaway-${order.id}`,
        table_id: null,
        table_number: null,
        title: `Order #${order.id}`,
        subtitle: 'Takeaway',
        status: order.status,
        statusRank: statusPriority[order.status] || 999,
        created_at: order.created_at,
        order_type: order.order_type,
        orders: [order],
        items: [],
      });
    });

    const normalizeItems = (bill) => {
      const mergedItems = {};

      bill.orders.forEach((sourceOrder) => {
        (sourceOrder.items || []).forEach((item) => {
          const key = String(item.menu_item_id || item.name || item.id);
          const qty = Number(item.quantity || 0);
          const unitPrice = Number(item.unit_price || 0);

          if (!mergedItems[key]) {
            mergedItems[key] = {
              key,
              id: Number(item.menu_item_id || item.id || 0),
              name: item.name,
              quantity: qty,
              unit_price: unitPrice,
              amount: unitPrice * qty,
            };
          } else {
            mergedItems[key].quantity += qty;
            mergedItems[key].amount += unitPrice * qty;
          }
        });
      });

      const items = Object.values(mergedItems);
      const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const taxAmount = gstEnabled
        ? Number(((subtotal * Number(gstRate || 0)) / 100).toFixed(2))
        : 0;
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));
      const paymentMethods = bill.orders
        .map((order) => order.payment?.payment_method)
        .filter(Boolean);
      const uniqueMethods = [...new Set(paymentMethods)];

      return {
        ...bill,
        orderRefs: bill.orders.map((row) => `#${row.id}`),
        items,
        allPaid: bill.orders.every((order) => order.payment?.payment_status === 'paid'),
        paymentMethod:
          uniqueMethods.length === 0
            ? ''
            : uniqueMethods.length === 1
            ? uniqueMethods[0]
            : 'mixed',
        subtotal,
        taxAmount,
        totalAmount,
      };
    };

    const groupedBills = Array.from(mergedByTableId.values()).map(normalizeItems);
    const takeawayBills = standaloneTakeaways.map(normalizeItems);

    const allBills = [...groupedBills, ...takeawayBills];

    const scopedBills =
      statusFilter === 'all'
        ? allBills
        : allBills.filter((bill) => bill.orders.some((order) => order.status === statusFilter));

    return scopedBills.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      if (aTime === bTime) {
        return String(a.id).localeCompare(String(b.id));
      }
      return aTime - bTime;
    });
  }, [orders, statusFilter, gstEnabled, gstRate]);

  async function handleMarkPaid(billId, paymentMethod) {
    try {
      const bill = bills.find((row) => row.id === billId);
      if (!bill) {
        setError('Selected bill not found. Please refresh.');
        return;
      }

      setPayingOrderId(billId);
      setError('');
      setSuccessMessage('');

      for (const order of bill.orders) {
        if (order.payment?.payment_status === 'paid') {
          continue;
        }
        await paymentApi.generateBill(order.id, gstEnabled ? Number(gstRate) : 0);
        await paymentApi.processPayment(order.id, paymentMethod, gstEnabled ? Number(gstRate) : 0);
      }

      setSuccessMessage(
        bill.table_number
          ? `Marked paid for Table ${bill.table_number}. Print and click Complete.`
          : `Marked paid for ${bill.title}. Print and click Complete.`
      );
      await loadBillingData();
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setPayingOrderId(null);
    }
  }

  async function handleCompleteBill(billId) {
    try {
      const bill = bills.find((row) => row.id === billId);
      if (!bill) {
        setError('Selected bill not found. Please refresh.');
        return;
      }

      setCompletingOrderId(billId);
      setError('');
      setSuccessMessage('');

      for (const order of bill.orders) {
        await paymentApi.completePayment(order.id);
      }

      setSuccessMessage(
        bill.table_number
          ? `Completed Table ${bill.table_number} bill.`
          : `Completed ${bill.title}.`
      );
      await loadBillingData();
    } catch (err) {
      setError(err.message || 'Failed to complete bill');
    } finally {
      setCompletingOrderId(null);
    }
  }

  async function handlePrintBill(bill) {
    try {
      setPrintingOrderId(bill.id);
      setError('');

      printReceipt({
        order: {
          id: bill.orderRefs.join(', '),
          order_type: bill.order_type,
          table_number: bill.table_number,
          items: bill.items,
        },
        payment: {
          subtotal: bill.subtotal,
          tax_rate: gstEnabled ? gstRate : null,
          tax_amount: bill.taxAmount,
          total_amount: bill.totalAmount,
          payment_status: bill.allPaid ? 'paid' : '',
          payment_method: bill.allPaid ? (bill.paymentMethod || 'cash') : 'not paid',
        },
        includeTax: gstEnabled,
        restaurantName: appSettings.restaurantName,
        restaurantPhone: appSettings.restaurantPhone,
      });
    } catch (err) {
      setError(err.message || 'Failed to print bill');
    } finally {
      setPrintingOrderId(null);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Cashier - Billing & Payments (Step 7)</h1>
        <p>Mark paid, print bill, then complete to close and remove.</p>
      </header>

      <section className="kds-toolbar">
        <div className="category-filter">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={statusFilter === 'ready' ? 'active' : ''}
            onClick={() => setStatusFilter('ready')}
          >
            Ready
          </button>
          <button
            className={statusFilter === 'pending' ? 'active' : ''}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={statusFilter === 'preparing' ? 'active' : ''}
            onClick={() => setStatusFilter('preparing')}
          >
            Preparing
          </button>
          <button
            className={statusFilter === 'served' ? 'active' : ''}
            onClick={() => setStatusFilter('served')}
          >
            Served
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" className="secondary-btn" onClick={loadBillingData}>
            Refresh
          </button>
        </div>
      </section>

      {loading ? <p className="info-text">Loading billing data...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {!loading ? (
        <section className="billing-grid">
          {bills.length ? (
            bills.map((bill) => (
              <BillingOrderCard
                key={bill.id}
                bill={bill}
                gstEnabled={gstEnabled}
                gstRate={Number(gstRate || 0)}
                onPay={handleMarkPaid}
                onComplete={handleCompleteBill}
                onPrint={handlePrintBill}
                payingOrderId={payingOrderId}
                completingOrderId={completingOrderId}
                printingOrderId={printingOrderId}
              />
            ))
          ) : (
            <p className="empty-state">No billable orders right now.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default BillingPage;

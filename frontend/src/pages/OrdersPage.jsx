import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '../components/menu/MenuGrid';
import OrderCart from '../components/order/OrderCart';
import { menuApi, orderApi, tableApi } from '../services/api';

function OrdersPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [note, setNote] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadOrderData() {
    try {
      setLoading(true);
      setError('');
      const [categoriesResponse, itemsResponse, tablesResponse] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems(),
        tableApi.getTables(),
      ]);

      setCategories(categoriesResponse.data || []);
      setItems(itemsResponse.data || []);
      setTables(tablesResponse.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load order data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderData();
  }, []);

  const availableTables = useMemo(
    () => tables.filter((table) => table.status !== 'occupied'),
    [tables]
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }

    return items.filter((item) => String(item.category_id) === String(selectedCategory));
  }, [items, selectedCategory]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cartItems]
  );

  function addItemToCart(item) {
    setSuccessMessage('');
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(itemId, delta) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(itemId) {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  async function handleSubmitOrder() {
    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        order_type: orderType,
        table_id: orderType === 'dine-in' ? Number(selectedTableId) : null,
        note: note.trim(),
        items: cartItems.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await orderApi.createOrder(payload);

      setCartItems([]);
      setSelectedTableId('');
      setOrderType('dine-in');
      setNote('');
      setSuccessMessage(`Order #${response.data.id} placed successfully.`);
      await loadOrderData();
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Waiter - Order Entry (Step 5)</h1>
        <p>Select table, browse menu by category, build the bill, and place the order.</p>
      </header>

      <section className="order-layout">
        <section className="order-builder-panel">
          <div className="category-filter">
            <button
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={String(selectedCategory) === String(category.id) ? 'active' : ''}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loading ? <p className="info-text">Loading order menu...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}

          {!loading ? (
            <MenuGrid
              items={filteredItems}
              actionLabel="Add to Bill"
              onItemAction={addItemToCart}
            />
          ) : null}
        </section>

        <OrderCart
          selectedTableId={selectedTableId}
          availableTables={availableTables}
          orderType={orderType}
          note={note}
          cartItems={cartItems}
          subtotal={subtotal}
          onTableChange={setSelectedTableId}
          onOrderTypeChange={setOrderType}
          onNoteChange={setNote}
          onIncrease={(itemId) => updateQuantity(itemId, 1)}
          onDecrease={(itemId) => updateQuantity(itemId, -1)}
          onRemove={removeItem}
          onSubmit={handleSubmitOrder}
          submitting={submitting}
        />
      </section>
    </main>
  );
}

export default OrdersPage;

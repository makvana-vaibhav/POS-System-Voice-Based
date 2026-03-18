import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '../components/menu/MenuGrid';
import { dashboardApi, menuApi } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemForRevenue, setSelectedItemForRevenue] = useState('');
  const [itemRevenueData, setItemRevenueData] = useState(null);
  const [actionView, setActionView] = useState('see-menu');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
  });

  function resetForm() {
    setFormData({
      category_id: '',
      name: '',
      description: '',
      price: '',
    });
    setEditingItemId(null);
  }

  async function loadMenuData() {
    try {
      setLoading(true);
      setError('');

      const [categoriesResponse, itemsResponse] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems(),
      ]);

      setCategories(categoriesResponse.data || []);
      setItems(itemsResponse.data || []);

      const topItemsResponse = await dashboardApi.getTopItems(5);
      setTopItems(topItemsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenuData();
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return items;
    }

    return items.filter((item) => String(item.category_id) === String(selectedCategory));
  }, [items, selectedCategory]);

  const bestSeller = topItems.length ? topItems[0] : null;

  async function handleAnalyzeItemRevenue() {
    try {
      setError('');
      if (!selectedItemForRevenue) {
        setItemRevenueData(null);
        return;
      }

      const response = await dashboardApi.getItemRevenue(selectedItemForRevenue);
      setItemRevenueData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch item revenue');
    }
  }

  async function handleSubmitItem(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        category_id: formData.category_id ? Number(formData.category_id) : null,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
      };

      if (editingItemId) {
        await menuApi.updateItem(editingItemId, payload);
      } else {
        await menuApi.createItem(payload);
      }

      resetForm();

      await loadMenuData();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    try {
      setCategorySubmitting(true);
      setError('');

      await menuApi.createCategory({
        name: categoryFormData.name.trim(),
      });

      setCategoryFormData({ name: '' });
      await loadMenuData();
      setActionView('see-menu');
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setCategorySubmitting(false);
    }
  }

  function handleStartEdit(item) {
    setError('');
    setEditingItemId(item.id);
    setActionView('add-item');
    setFormData({
      category_id: item.category_id ? String(item.category_id) : '',
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteItem(itemId) {
    try {
      setError('');
      await menuApi.deleteItem(itemId);
      await loadMenuData();
    } catch (err) {
      setError(err.message || 'Failed to delete menu item');
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Menu</h1>
        <p>Admin menu control panel with actions, insights, and category-wise items.</p>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Menu Items</p>
          <h3>{items.length}</h3>
        </article>

        <article className="stat-card">
          <p>Total Categories</p>
          <h3>{categories.length}</h3>
        </article>

        <article className="stat-card">
          <p>Best Seller</p>
          <h3>{bestSeller ? bestSeller.name : '-'}</h3>
          <small className="muted-text">
            {bestSeller ? `Ordered ${bestSeller.total_ordered} times` : 'No sales data yet'}
          </small>
        </article>
      </section>

      <section className="menu-actions-grid">
        <button
          type="button"
          className={`menu-action-card ${actionView === 'see-menu' ? 'active' : ''}`}
          onClick={() => setActionView('see-menu')}
        >
          <h3>See Menu</h3>
          <p>Browse all items category-wise.</p>
        </button>

        <button
          type="button"
          className={`menu-action-card ${actionView === 'add-item' ? 'active' : ''}`}
          onClick={() => setActionView('add-item')}
        >
          <h3>Add Item</h3>
          <p>Create a new menu item.</p>
        </button>

        <button
          type="button"
          className={`menu-action-card ${actionView === 'add-category' ? 'active' : ''}`}
          onClick={() => setActionView('add-category')}
        >
          <h3>Add Category</h3>
          <p>Create a new item category.</p>
        </button>

        <article className="menu-action-card menu-revenue-card">
          <h3>Revenue by Item</h3>
          <div className="inline-form-row">
            <select
              value={selectedItemForRevenue}
              onChange={(event) => setSelectedItemForRevenue(event.target.value)}
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button type="button" className="secondary-btn" onClick={handleAnalyzeItemRevenue}>
              Analyze
            </button>
          </div>

          {itemRevenueData ? (
            <div className="menu-revenue-result">
              <p>
                <strong>{itemRevenueData.menu_item_name}</strong>
              </p>
              <p>Total Qty: {itemRevenueData.total_quantity}</p>
              <p>Gross Revenue: {formatCurrency(itemRevenueData.gross_revenue)}</p>
              <p>Paid Orders: {itemRevenueData.paid_orders_count}</p>
            </div>
          ) : null}
        </article>
      </section>

      {actionView === 'add-item' ? (
        <section className="admin-form-card">
          <h2>{editingItemId ? `Edit Item #${editingItemId}` : 'Add New Menu Item'}</h2>
          <form className="menu-form" onSubmit={handleSubmitItem}>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Item name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              required
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item'}
            </button>

            {editingItemId ? (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </form>
        </section>
      ) : null}

      {actionView === 'add-category' ? (
        <section className="admin-form-card">
          <h2>Add Category</h2>
          <form className="category-create-form" onSubmit={handleCreateCategory}>
            <input
              type="text"
              placeholder="Category name"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ name: e.target.value })}
              required
            />
            <button type="submit" disabled={categorySubmitting}>
              {categorySubmitting ? 'Adding...' : 'Add Category'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="category-filter">
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
      </section>

      {loading ? <p className="info-text">Loading menu...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && actionView === 'see-menu' ? (
        <MenuGrid
          items={filteredItems}
          onDeleteItem={handleDeleteItem}
          onEditItem={handleStartEdit}
        />
      ) : null}
    </main>
  );
}

export default MenuPage;

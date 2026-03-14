import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '../components/menu/MenuGrid';
import { menuApi } from '../services/api';

function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
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

  function handleStartEdit(item) {
    setError('');
    setEditingItemId(item.id);
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
        <h1>Admin Panel - Menu Management (Step 3)</h1>
        <p>Create, update, and delete menu items.</p>
      </header>

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
      {!loading ? (
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

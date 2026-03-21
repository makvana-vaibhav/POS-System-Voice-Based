import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '../components/menu/MenuGrid';
import { dashboardApi, menuApi } from '../services/api';

const SAMPLE_MENU_CSV = `category,name,description,price,is_available
Beverages,Masala Chai,Indian spiced tea,40,true
Snacks,Veg Sandwich,Toasted sandwich with veggies,120,true
Main Course,Paneer Butter Masala,Creamy paneer curry,280,true`;

function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionView, setActionView] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    is_available: true,
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
      is_available: true,
    });
    setEditingItemId(null);
  }

  async function loadMenuData() {
    try {
      setLoading(true);
      setError('');

      const [categoriesResponse, itemsResponse] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems({ includeUnavailable: true }),
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
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        selectedCategory === 'all' || String(item.category_id) === String(selectedCategory);

      if (!categoryMatch) return false;
      if (!normalizedQuery) return true;

      return [item.name, item.description, item.category_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [items, selectedCategory, searchQuery]);

  const bestSeller = topItems.length ? topItems[0] : null;

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
        is_available: Boolean(formData.is_available),
      };

      if (editingItemId) {
        await menuApi.updateItem(editingItemId, payload);
        setEditingItemId(null);
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

  async function handleInlineUpdateItem(itemId, payload) {
    try {
      setError('');
      await menuApi.updateItem(itemId, payload);
      setEditingItemId(null);
      resetForm();
      await loadMenuData();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    }
  }

  function handleCancelEdit() {
    setEditingItemId(null);
    resetForm();
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
      setActionView('none');
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setCategorySubmitting(false);
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
      is_available: item.is_available ?? true,
    });
  }

  async function handleImportCsv(event) {
    event.preventDefault();
    try {
      setError('');
      setImportResult(null);

      if (!csvText.trim()) {
        setError('Please choose a CSV file or paste CSV content first.');
        return;
      }

      setImportingCsv(true);
      const response = await menuApi.importItemsCsv(csvText);
      setImportResult(response.data || null);
      await loadMenuData();
      setActionView('none');
    } catch (err) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setImportingCsv(false);
    }
  }

  function handleSelectCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
    };
    reader.onerror = () => {
      setError('Failed to read CSV file');
    };
    reader.readAsText(file);
  }

  function handleDownloadSampleCsv() {
    const blob = new Blob([SAMPLE_MENU_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-import-sample.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
      </header>

      <section className="stats-compact">
        <span className="stat-compact-item">Items: <strong>{items.length}</strong></span>
        <span className="stat-compact-item">Categories: <strong>{categories.length}</strong></span>
        <span className="stat-compact-item">Top Selling: <strong>{bestSeller ? bestSeller.name : '-'}</strong></span>
      </section>

      <section className="menu-actions-grid">
        <button
          type="button"
          className={`menu-action-card ${actionView === 'add-item' ? 'active' : ''}`}
          onClick={() => setActionView((prev) => (prev === 'add-item' ? 'none' : 'add-item'))}
        >
          Add Item
        </button>

        <button
          type="button"
          className={`menu-action-card ${actionView === 'add-category' ? 'active' : ''}`}
          onClick={() => setActionView((prev) => (prev === 'add-category' ? 'none' : 'add-category'))}
        >
          Add Category
        </button>

        <button
          type="button"
          className={`menu-action-card ${actionView === 'import-csv' ? 'active' : ''}`}
          onClick={() => setActionView((prev) => (prev === 'import-csv' ? 'none' : 'import-csv'))}
        >
          Import CSV
        </button>
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

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={Boolean(formData.is_available)}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, is_available: event.target.checked }))
                }
              />
              Available
            </label>

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

      {actionView === 'import-csv' ? (
        <section className="admin-form-card">
          <h2>Bulk Import Menu Items</h2>
          <p className="muted-text">Columns: category, name, description, price, is_available</p>

          <div className="csv-actions-row">
            <button type="button" className="secondary-btn" onClick={handleDownloadSampleCsv}>
              Download Sample CSV
            </button>
            <label className="csv-file-picker" htmlFor="menuCsvFile">
              Choose CSV File
            </label>
            <input
              id="menuCsvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={handleSelectCsvFile}
              hidden
            />
            {csvFileName ? <small className="muted-text">Selected: {csvFileName}</small> : null}
          </div>

          <form onSubmit={handleImportCsv} className="csv-import-form">
            <textarea
              rows={10}
              placeholder="Paste CSV content here"
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
            />
            <div>
              <button type="submit" disabled={importingCsv}>
                {importingCsv ? 'Importing...' : 'Import Menu Items'}
              </button>
            </div>
          </form>

          {importResult ? (
            <div className="csv-import-result">
              <p>
                Imported: <strong>{importResult.inserted_count}</strong>
              </p>
              <p>
                Failed: <strong>{importResult.failed_count}</strong>
              </p>
              {importResult.errors?.length ? (
                <ul>
                  {importResult.errors.slice(0, 8).map((entry, index) => (
                    <li key={`${entry.row}-${index}`}>
                      Row {entry.row}: {entry.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="menu-toolbar">
        <input
          type="text"
          placeholder="Search item, description, category..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
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
          editingItemId={editingItemId}
          onUpdateItem={handleInlineUpdateItem}
          onCancelEdit={handleCancelEdit}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
        />
      ) : null}
    </main>
  );
}

export default MenuPage;

import { useEffect, useState } from 'react';
import TableCard from '../components/table/TableCard';
import { tableApi } from '../services/api';

function TablesPage({ onNavigate }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingTableId, setEditingTableId] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '',
    status: 'available',
  });

  function resetForm() {
    setFormData({
      table_number: '',
      capacity: '',
      status: 'available',
    });
    setEditingTableId(null);
  }

  async function loadTables() {
    try {
      setLoading(true);
      setError('');
      const response = await tableApi.getTables();
      setTables(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []);

  async function handleSubmitTable(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        table_number: Number(formData.table_number),
        capacity: Number(formData.capacity),
        status: formData.status,
      };

      if (editingTableId) {
        await tableApi.updateTable(editingTableId, payload);
      } else {
        await tableApi.createTable(payload);
      }

      resetForm();

      await loadTables();
    } catch (err) {
      setError(err.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(table) {
    setError('');
    setEditingTableId(table.id);
    setFormData({
      table_number: String(table.table_number),
      capacity: String(table.capacity),
      status: table.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleStatusChange(tableId, status) {
    try {
      setError('');
      await tableApi.updateTableStatus(tableId, status);
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === tableId ? { ...table, status } : table
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to update table status');
    }
  }

  async function handleDeleteTable(tableId) {
    const confirmDelete = window.confirm('Delete this table? This action cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      setError('');
      await tableApi.deleteTable(tableId);

      if (editingTableId === tableId) {
        resetForm();
      }

      setTables((currentTables) => currentTables.filter((table) => table.id !== tableId));
    } catch (err) {
      setError(err.message || 'Failed to delete table');
    }
  }

  function handleOpenOrderForTable(table) {
    localStorage.setItem('pos_selected_table_id', String(table.id));
    onNavigate?.('orders');
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Admin Panel - Table Management (Step 4)</h1>
        <p>Create, edit, and control table status for waiter and cashier flows.</p>
      </header>

      <section className="admin-form-card">
        <h2>{editingTableId ? `Edit Table #${editingTableId}` : 'Add New Table'}</h2>
        <form className="table-form" onSubmit={handleSubmitTable}>
          <input
            type="number"
            min="1"
            placeholder="Table number"
            value={formData.table_number}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, table_number: event.target.value }))
            }
            required
          />

          <input
            type="number"
            min="1"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, capacity: event.target.value }))
            }
            required
          />

          <select
            value={formData.status}
            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="available">available</option>
            <option value="occupied">occupied</option>
            <option value="reserved">reserved</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingTableId ? 'Update Table' : 'Add Table'}
          </button>

          {editingTableId ? (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel Edit
            </button>
          ) : null}
        </form>
      </section>

      {loading ? <p className="info-text">Loading tables...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading ? (
        <section className="tables-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={handleStartEdit}
              onDelete={handleDeleteTable}
              onStatusChange={handleStatusChange}
              onOpenOrder={handleOpenOrderForTable}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default TablesPage;

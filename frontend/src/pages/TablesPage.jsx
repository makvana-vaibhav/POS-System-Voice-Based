import { useEffect, useState } from 'react';
import TableCard from '../components/table/TableCard';
import { tableApi } from '../services/api';

function TablesPage({ onNavigate }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [totalTables, setTotalTables] = useState(10);
  const [tempTableCount, setTempTableCount] = useState(10);

  function resetForm() {
    setTempTableCount(tables.length);
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

  async function handleUpdateTableCount() {
    try {
      setError('');
      const targetCount = Number(tempTableCount);
      const currentCount = tables.length;

      if (targetCount < 1) {
        setError('Must have at least 1 table.');
        return;
      }

      setSubmitting(true);

      if (targetCount > currentCount) {
        for (let i = currentCount + 1; i <= targetCount; i++) {
          await tableApi.createTable({
            table_number: i,
            status: 'available',
          });
        }
      } else if (targetCount < currentCount) {
        const sortedTables = [...tables].sort((a, b) => b.table_number - a.table_number);
        for (let i = 0; i < currentCount - targetCount; i++) {
          await tableApi.deleteTable(sortedTables[i].id);
        }
      }

      setTotalTables(targetCount);
      await loadTables();
    } catch (err) {
      setError(err.message || 'Failed to update tables');
    } finally {
      setSubmitting(false);
    }
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

  function handleOpenOrderForTable(table) {
    localStorage.setItem('pos_selected_table_id', String(table.id));
    onNavigate?.('orders');
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Admin Panel - Table Management</h1>
        <p>Set total number of tables. Tables will be created or deleted automatically.</p>
      </header>

      <section className="admin-form-card">
        <h2>Set Total Tables</h2>
        <form
          className="table-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleUpdateTableCount();
          }}
        >
          <label>
            <span>Total Tables</span>
            <input
              type="number"
              min="1"
              max="100"
              value={tempTableCount}
              onChange={(event) => setTempTableCount(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update'}
          </button>
        </form>
      </section>

      {loading ? <p className="info-text">Loading tables...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading ? (
        <>
          <p className="info-text">Total tables: {tables.length}</p>
          <section className="tables-grid">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onStatusChange={handleStatusChange}
                onOpenOrder={handleOpenOrderForTable}
              />
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}

export default TablesPage;

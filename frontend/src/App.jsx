import './App.css';
import { useState } from 'react';
import MenuPage from './pages/MenuPage';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';

function App() {
  const [activeView, setActiveView] = useState('menu');

  return (
    <div className="app-root">
      <aside className="sidebar">
        <h2>POS System</h2>
        <p>Step-by-step build</p>
        <nav>
          <button
            className={activeView === 'menu' ? 'active' : ''}
            onClick={() => setActiveView('menu')}
          >
            Admin - Menu
          </button>
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeView === 'tables' ? 'active' : ''}
            onClick={() => setActiveView('tables')}
          >
            Admin - Tables
          </button>
          <button disabled>Orders</button>
          <button disabled>Kitchen</button>
          <button disabled>Billing</button>
          <button disabled>Voice</button>
        </nav>
      </aside>

      {activeView === 'menu' ? <MenuPage /> : null}
      {activeView === 'dashboard' ? <DashboardPage /> : null}
      {activeView === 'tables' ? <TablesPage /> : null}
    </div>
  );
}

export default App;

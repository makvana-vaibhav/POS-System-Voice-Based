import './App.css';
import { useState } from 'react';
import MenuPage from './pages/MenuPage';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import BillingPage from './pages/BillingPage';

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
          <button
            className={activeView === 'orders' ? 'active' : ''}
            onClick={() => setActiveView('orders')}
          >
            Waiter - Orders
          </button>
          <button
            className={activeView === 'kitchen' ? 'active' : ''}
            onClick={() => setActiveView('kitchen')}
          >
            Kitchen
          </button>
          <button
            className={activeView === 'billing' ? 'active' : ''}
            onClick={() => setActiveView('billing')}
          >
            Cashier - Billing
          </button>
          <button disabled>Voice</button>
        </nav>
      </aside>

      {activeView === 'menu' ? <MenuPage /> : null}
      {activeView === 'dashboard' ? <DashboardPage /> : null}
      {activeView === 'tables' ? <TablesPage /> : null}
      {activeView === 'orders' ? <OrdersPage /> : null}
      {activeView === 'kitchen' ? <KitchenPage /> : null}
      {activeView === 'billing' ? <BillingPage /> : null}
    </div>
  );
}

export default App;

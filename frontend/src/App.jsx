import './App.css';
import { useEffect, useMemo, useState } from 'react';
import MenuPage from './pages/MenuPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import BillingPage from './pages/BillingPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import { authApi, getAuthToken } from './services/api';

function App() {
  const [activeView, setActiveView] = useState('orders');
  const [currentUser, setCurrentUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const token = getAuthToken();
        if (!token) {
          return;
        }

        const response = await authApi.me();
        setCurrentUser(response.data);
      } catch {
        authApi.logout();
      } finally {
        setInitializing(false);
      }
    }

    bootstrapAuth();
  }, []);

  async function handleLogin(username, password) {
    const response = await authApi.login(username, password);
    setCurrentUser(response.data.user);

    const defaultTabByRole = {
      admin: 'dashboard',
      cashier: 'billing',
      waiter: 'orders',
      kitchen: 'kitchen',
    };

    setActiveView(defaultTabByRole[response.data.user.role] || 'orders');
  }

  function handleLogout() {
    authApi.logout();
    setCurrentUser(null);
  }

  const tabs = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const allTabs = [
      { key: 'dashboard', label: 'Dashboard', roles: ['admin'] },
      { key: 'analytics', label: 'Analytics', roles: ['admin'] },
      { key: 'menu', label: 'Menu', roles: ['admin'] },
      { key: 'tables', label: 'Admin - Tables', roles: ['admin', 'cashier', 'waiter'] },
      { key: 'users', label: 'Admin - Users', roles: ['admin'] },
      { key: 'orders', label: 'Waiter - Orders', roles: ['admin', 'waiter', 'cashier'] },
      { key: 'kitchen', label: 'Kitchen', roles: ['admin', 'kitchen', 'cashier'] },
      { key: 'billing', label: 'Cashier - Billing', roles: ['admin', 'cashier'] },
    ];

    return allTabs.filter((tab) => tab.roles.includes(currentUser.role));
  }, [currentUser]);

  useEffect(() => {
    if (!tabs.length) {
      return;
    }

    const currentTabExists = tabs.some((tab) => tab.key === activeView);
    if (!currentTabExists) {
      setActiveView(tabs[0].key);
    }
  }, [tabs, activeView]);

  if (initializing) {
    return <main className="page-shell"><p className="info-text">Initializing...</p></main>;
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-root">
      <header className="mobile-topbar">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          ☰
        </button>
        <h2>POS System</h2>
      </header>

      {sidebarOpen ? <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2>POS System</h2>
        <p>
          {currentUser.full_name} ({currentUser.role})
        </p>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeView === tab.key ? 'active' : ''}
              onClick={() => {
                setActiveView(tab.key);
                setSidebarOpen(false);
              }}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            className="danger-btn"
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      {activeView === 'dashboard' ? (
        <DashboardPage onNavigate={setActiveView} viewMode="dashboard" />
      ) : null}
      {activeView === 'analytics' ? <AnalyticsPage /> : null}
      {activeView === 'menu' ? <MenuPage /> : null}
      {activeView === 'tables' ? <TablesPage onNavigate={setActiveView} /> : null}
      {activeView === 'users' ? <UsersPage /> : null}
      {activeView === 'orders' ? <OrdersPage /> : null}
      {activeView === 'kitchen' ? <KitchenPage /> : null}
      {activeView === 'billing' ? <BillingPage /> : null}
    </div>
  );
}

export default App;

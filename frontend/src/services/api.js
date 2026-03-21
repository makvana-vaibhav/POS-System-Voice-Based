const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'pos_auth_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const authApi = {
  login: async (username, password) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    setAuthToken(response.data.token);
    return response;
  },
  me: () => request('/auth/me'),
  logout: () => clearAuthToken(),
};

export const menuApi = {
  getCategories: () => request('/menu/categories'),
  createCategory: (payload) =>
    request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getItems: ({ includeUnavailable } = {}) =>
    request(`/menu/items${includeUnavailable ? '?includeUnavailable=true' : ''}`),
  createItem: (payload) =>
    request('/menu/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteItem: (id) =>
    request(`/menu/items/${id}`, {
      method: 'DELETE',
    }),
  updateItem: (id, payload) =>
    request(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  importItemsCsv: (csv_text) =>
    request('/menu/items/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csv_text }),
    }),
};

export const dashboardApi = {
  getSummary: () => request('/dashboard/summary'),
  getTopItems: (limitOrOptions = 5) => {
    const query = new URLSearchParams();

    if (typeof limitOrOptions === 'number') {
      query.set('limit', String(limitOrOptions));
    } else {
      const { limit = 5, from, to } = limitOrOptions || {};
      query.set('limit', String(limit));
      if (from) query.set('from', from);
      if (to) query.set('to', to);
    }

    return request(`/dashboard/top-items?${query.toString()}`);
  },
  getItemRevenue: (menuItemId) => request(`/dashboard/item-revenue?menuItemId=${menuItemId}`),
  getAnalytics: ({ from, to } = {}) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return request(`/dashboard/analytics${query.toString() ? `?${query.toString()}` : ''}`);
  },
};

export const tableApi = {
  getTables: () => request('/tables'),
  createTable: (payload) =>
    request('/tables', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTable: (id) =>
    request(`/tables/${id}`, {
      method: 'DELETE',
    }),
  updateTable: (id, payload) =>
    request(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateTableStatus: (id, status) =>
    request(`/tables/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const orderApi = {
  getOrders: (status) =>
    request(status ? `/orders?status=${encodeURIComponent(status)}` : '/orders'),
  createOrder: (payload) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const paymentApi = {
  getPaymentByOrderId: (orderId) => request(`/payments/order/${orderId}`),
  getActiveBills: () => request('/payments/active-bills'),
  generateBill: (orderId) =>
    request(`/payments/order/${orderId}/bill`, {
      method: 'POST',
    }),
  processPayment: (orderId, payment_method) =>
    request(`/payments/order/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method }),
    }),
};

export const userApi = {
  getUsers: () => request('/users'),
  createUser: (payload) =>
    request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id, payload) =>
    request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

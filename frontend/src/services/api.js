const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const menuApi = {
  getCategories: () => request('/menu/categories'),
  getItems: () => request('/menu/items'),
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
};

export const dashboardApi = {
  getSummary: () => request('/dashboard/summary'),
  getTopItems: (limit = 5) => request(`/dashboard/top-items?limit=${limit}`),
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

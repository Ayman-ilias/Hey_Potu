import axios from 'axios';

// Always use relative URL - nginx will proxy to backend
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Products API
export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getLowStock: (threshold = 10) => api.get(`/products/alerts/low-stock?threshold=${threshold}`),
};

// Customers API
export const customersAPI = {
    getAll: () => api.get('/customers'),
    getWithProducts: () => api.get('/customers/with-products'),
    getById: (id) => api.get(`/customers/${id}`),
    getWithOrders: (id) => api.get(`/customers/${id}/orders`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// Orders API
export const ordersAPI = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`),
};

// Reports API
export const reportsAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    getInventory: () => api.get('/reports/inventory'),
    getSales: (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        return api.get(`/reports/sales?${params.toString()}`);
    },
    getCustomers: () => api.get('/reports/customers'),
    getCategorySales: () => api.get('/reports/category-sales'),
};

// Categories API
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export default api;

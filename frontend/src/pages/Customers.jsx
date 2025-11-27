import React, { useState, useEffect } from 'react';
import { customersAPI } from '../utils/api';
import { exportCustomersToPDF } from '../utils/pdfExport';
import { exportCustomersToExcel } from '../utils/excelExport';
import './Customers.css';

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [purchaseHistory, setPurchaseHistory] = useState(null);
    const [formData, setFormData] = useState({
        customer_name: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getWithProducts();
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customersAPI.update(editingCustomer.id, formData);
            } else {
                await customersAPI.create(formData);
            }
            fetchCustomers();
            closeModal();
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await customersAPI.delete(id);
                fetchCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData(customer);
        } else {
            setEditingCustomer(null);
            setFormData({
                customer_name: '',
                phone: '',
                email: '',
                address: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const viewPurchases = async (customer) => {
        try {
            setSelectedCustomer(customer);
            const response = await customersAPI.getWithOrders(customer.id);
            setPurchaseHistory(response.data);
            setShowPurchaseModal(true);
        } catch (error) {
            console.error('Error fetching purchase history:', error);
        }
    };

    const closePurchaseModal = () => {
        setShowPurchaseModal(false);
        setSelectedCustomer(null);
        setPurchaseHistory(null);
    };

    const getPurchasedProducts = (history) => {
        if (!history || !history.orders) return [];

        const products = new Set();
        history.orders.forEach(order => {
            if (order.items && order.items.length > 0 && order.items[0] !== null) {
                order.items.forEach(item => {
                    products.add(item.product_name);
                });
            }
        });

        return Array.from(products);
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h2>Customer Management</h2>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => exportCustomersToPDF(customers)}>
                        📄 Export PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => exportCustomersToExcel(customers)}>
                        📊 Export Excel
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Address</th>
                            <th>Purchased Products</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id}>
                                <td><strong>{customer.customer_name}</strong></td>
                                <td>{customer.phone || 'N/A'}</td>
                                <td>{customer.email || 'N/A'}</td>
                                <td>{customer.address || 'N/A'}</td>
                                <td>
                                    <div className="purchased-products-cell">
                                        {customer.purchased_products && customer.purchased_products.length > 0 ? (
                                            <div className="products-tags">
                                                {customer.purchased_products.map((product, idx) => (
                                                    <span key={idx} className="product-tag">
                                                        {product}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted">No purchases</span>
                                        )}
                                    </div>
                                </td>
                                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-icon" onClick={() => viewPurchases(customer)} title="View Purchases">🛍️</button>
                                        <button className="btn-icon" onClick={() => openModal(customer)} title="Edit">✏️</button>
                                        <button className="btn-icon" onClick={() => handleDelete(customer.id)} title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && (
                    <div className="empty-state">
                        <p>No customers found</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-2">
                                <div className="input-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Address</label>
                                <textarea
                                    rows="3"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {editingCustomer && editingCustomer.purchased_products && editingCustomer.purchased_products.length > 0 && (
                                <div className="input-group">
                                    <label>Purchased Products (Read-Only)</label>
                                    <div className="products-tags" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                        {editingCustomer.purchased_products.map((product, idx) => (
                                            <span key={idx} className="product-tag">
                                                {product}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCustomer ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPurchaseModal && purchaseHistory && (
                <div className="modal-overlay" onClick={closePurchaseModal}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <h3>Purchase History - {selectedCustomer?.customer_name}</h3>

                        <div className="customer-stats">
                            <div className="stat-item">
                                <strong>Total Orders:</strong> {purchaseHistory.orders?.length || 0}
                            </div>
                            <div className="stat-item">
                                <strong>Total Spent:</strong> BDT {purchaseHistory.orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0).toFixed(2)}
                            </div>
                        </div>

                        {getPurchasedProducts(purchaseHistory).length > 0 && (
                            <div className="purchased-products-summary">
                                <h4>📦 Purchased Products:</h4>
                                <div className="products-tags">
                                    {getPurchasedProducts(purchaseHistory).map((product, idx) => (
                                        <span key={idx} className="product-tag">
                                            {product}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {purchaseHistory.orders && purchaseHistory.orders.length > 0 ? (
                            <div className="purchase-history-list">
                                <h4>Order History:</h4>
                                {purchaseHistory.orders.map((order) => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <strong>{order.order_number}</strong>
                                                <p>{new Date(order.order_date).toLocaleString()}</p>
                                            </div>
                                            <div className="order-total">
                                                <strong>BDT {order.total_amount}</strong>
                                                <span className="badge badge-success">{order.status}</span>
                                            </div>
                                        </div>

                                        {order.items && order.items.length > 0 && order.items[0] !== null && (
                                            <div className="order-products">
                                                <h5>Items in this order:</h5>
                                                <div className="products-grid">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="product-badge">
                                                            <span className="product-name">{item.product_name}</span>
                                                            <span className="product-qty">× {item.quantity}</span>
                                                            <span className="product-price">BDT {item.subtotal}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No purchase history yet</p>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={closePurchaseModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Customers;

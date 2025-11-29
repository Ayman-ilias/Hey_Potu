import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../utils/api';
import axios from 'axios';
import './Orders.css';

// PreOrders API
const preordersAPI = {
    getAll: () => axios.get('/api/preorders'),
    getById: (id) => axios.get(`/api/preorders/${id}`),
    create: (data) => axios.post('/api/preorders', data),
    kickToSell: (id, data) => axios.post(`/api/preorders/${id}/kick-to-sell`, data),
    delete: (id) => axios.delete(`/api/preorders/${id}`)
};

function PreOrders() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });
    const [view, setView] = useState('new'); // 'new' or 'list'
    const [preorders, setPreorders] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchData();
        if (view === 'list') {
            fetchPreorders();
        }
    }, [view]);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                productsAPI.getAll(),
                categoriesAPI.getAll()
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreorders = async () => {
        try {
            const response = await preordersAPI.getAll();
            setPreorders(response.data);
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product_id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                product_name: product.item_name,
                quantity: 1,
                unit_price: product.price,
                subtotal: product.price
            }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
                : item
        ));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleCreatePreorder = async () => {
        if (cart.length === 0) {
            alert('Please add items to the cart first!');
            return;
        }

        if (!customerData.phone) {
            alert('Customer phone number is required!');
            return;
        }

        try {
            const preorderData = {
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                customer_email: customerData.email,
                customer_address: customerData.address,
                items: cart,
                notes: ''
            };

            await preordersAPI.create(preorderData);

            alert('Pre-order created successfully! No items deducted from inventory.');

            // Reset form
            setCart([]);
            setCustomerData({ name: '', phone: '', email: '', address: '' });

            // Switch to list view to show the new pre-order
            setView('list');
        } catch (error) {
            console.error('Error creating pre-order:', error);
            alert('Failed to create pre-order: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleKickToSell = async (preorderId) => {
        if (!window.confirm('Convert this pre-order to a confirmed order? This will deduct items from inventory.')) {
            return;
        }

        try {
            const response = await preordersAPI.kickToSell(preorderId, { payment_method: paymentMethod });
            alert('Pre-order converted to order successfully! Items have been deducted from inventory.');
            fetchPreorders(); // Refresh the list
        } catch (error) {
            console.error('Error converting pre-order:', error);
            alert('Failed to convert pre-order: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeletePreorder = async (preorderId) => {
        if (!window.confirm('Are you sure you want to delete this pre-order?')) {
            return;
        }

        try {
            await preordersAPI.delete(preorderId);
            alert('Pre-order deleted successfully!');
            fetchPreorders();
        } catch (error) {
            console.error('Error deleting pre-order:', error);
            alert('Failed to delete pre-order: ' + (error.response?.data?.error || error.message));
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSearch = product.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="orders-page">
            <div className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, color: '#333' }}>📋 Pre-Orders</h1>
                <div className="view-toggle" style={{ display: 'flex', gap: '10px', background: '#f5f5f5', padding: '5px', borderRadius: '8px' }}>
                    <button
                        className={view === 'new' ? 'active' : ''}
                        onClick={() => setView('new')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            background: view === 'new' ? '#7CB342' : 'transparent',
                            color: view === 'new' ? 'white' : '#666',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        ➕ New Pre-Order
                    </button>
                    <button
                        className={view === 'list' ? 'active' : ''}
                        onClick={() => setView('list')}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            background: view === 'list' ? '#4FC3F7' : 'transparent',
                            color: view === 'list' ? 'white' : '#666',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        📜 Pre-Orders List
                    </button>
                </div>
            </div>

            {view === 'new' ? (
                <div className="order-creation" style={{ display: 'flex', gap: '20px', padding: '0 20px' }}>
                    <div className="products-section" style={{ flex: '2', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <div className="section-header" style={{ marginBottom: '20px' }}>
                            <h2 style={{ color: '#333', marginBottom: '15px' }}>🛍️ Products</h2>
                            <div className="filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                    style={{ flex: '1', padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                                />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="category-filter"
                                    style={{ padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="products-grid">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="product-card">
                                    <h3>{product.item_name}</h3>
                                    <p className="product-price">{product.price.toFixed(2)} BDT</p>
                                    <p className="product-stock">Stock: {product.remaining_items}</p>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="add-to-cart-btn"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="cart-section" style={{ flex: '1', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                        <h2 style={{ color: '#333', marginBottom: '10px' }}>🛒 Pre-Order Cart</h2>
                        <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffc107' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                                ⚠️ <strong>Note:</strong> Items will NOT be deducted from inventory until you "Kick to Sell"
                            </p>
                        </div>

                        <div className="customer-form" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <h3 style={{ color: '#666', fontSize: '16px', marginBottom: '5px' }}>👤 Customer Information</h3>
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={customerData.name}
                                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number * (Required)"
                                value={customerData.phone}
                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                required
                                style={{ padding: '10px', border: '2px solid #7CB342', borderRadius: '8px', fontSize: '14px' }}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={customerData.email}
                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                            />
                            <textarea
                                placeholder="Address"
                                value={customerData.address}
                                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                style={{ padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', minHeight: '60px', resize: 'vertical' }}
                            />
                        </div>

                        {cart.length === 0 ? (
                            <p className="empty-cart">Cart is empty. Add products to create a pre-order.</p>
                        ) : (
                            <>
                                <div className="cart-items">
                                    {cart.map(item => (
                                        <div key={item.product_id} className="cart-item">
                                            <div className="item-info">
                                                <h4>{item.product_name}</h4>
                                                <p>{item.unit_price.toFixed(2)} BDT</p>
                                            </div>
                                            <div className="item-controls">
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                                    min="1"
                                                />
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                                            </div>
                                            <p className="item-subtotal">{item.subtotal.toFixed(2)} BDT</p>
                                            <button onClick={() => removeFromCart(item.product_id)} className="remove-btn">×</button>
                                        </div>
                                    ))}
                                </div>

                                <div className="cart-summary">
                                    <div className="total">
                                        <span>Total:</span>
                                        <span className="total-amount">{calculateTotal().toFixed(2)} BDT</span>
                                    </div>
                                    <button onClick={handleCreatePreorder} className="complete-order-btn">
                                        Create Pre-Order
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="orders-list" style={{ padding: '0 20px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                        <h2 style={{ color: '#333', marginBottom: '10px' }}>📜 Pre-Orders List</h2>
                        <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #2196f3' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#1565c0' }}>
                                ℹ️ <strong>Info:</strong> These orders have NOT been deducted from inventory yet. Click "Kick to Sell" to convert to a confirmed order.
                            </p>
                        </div>

                        <div className="payment-method-selector" style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <label style={{ fontWeight: '600', color: '#666' }}>💳 Payment Method for Conversion:</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{ padding: '10px 15px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px', background: 'white', cursor: 'pointer', flex: '0 0 200px' }}
                            >
                                <option value="Cash">💵 Cash</option>
                                <option value="Card">💳 Card</option>
                                <option value="Mobile">📱 Mobile</option>
                                <option value="Bank Transfer">🏦 Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {preorders.length === 0 ? (
                        <div style={{ background: 'white', padding: '60px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                            <div style={{ fontSize: '60px', marginBottom: '20px' }}>📋</div>
                            <h3 style={{ color: '#666', marginBottom: '10px' }}>No Pre-Orders Yet</h3>
                            <p style={{ color: '#999' }}>Create your first pre-order to get started!</p>
                            <button
                                onClick={() => setView('new')}
                                style={{
                                    marginTop: '20px',
                                    padding: '12px 24px',
                                    background: '#7CB342',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ➕ Create Pre-Order
                            </button>
                        </div>
                    ) : (
                        <div className="orders-table-container" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Pre-Order #</th>
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preorders.map(preorder => (
                                        <tr key={preorder.id}>
                                            <td>{preorder.preorder_number}</td>
                                            <td>{preorder.customer_name}</td>
                                            <td>{preorder.customer_phone}</td>
                                            <td>
                                                {preorder.items && preorder.items.map(item => (
                                                    <div key={item.id} style={{ fontSize: '0.9em' }}>
                                                        {item.product_name} × {item.quantity}
                                                    </div>
                                                ))}
                                            </td>
                                            <td>{parseFloat(preorder.total_amount).toFixed(2)} BDT</td>
                                            <td>{new Date(preorder.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${preorder.status}`}>
                                                    {preorder.status === 'converted' ? 'Converted' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                {preorder.status !== 'converted' ? (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            onClick={() => handleKickToSell(preorder.id)}
                                                            className="kick-to-sell-btn"
                                                            style={{
                                                                background: '#7CB342',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            Kick to Sell
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePreorder(preorder.id)}
                                                            className="delete-btn"
                                                            style={{
                                                                background: '#f44336',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#666' }}>Already converted</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PreOrders;

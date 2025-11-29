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
            <div className="orders-header">
                <h1>Pre-Orders</h1>
                <div className="view-toggle">
                    <button
                        className={view === 'new' ? 'active' : ''}
                        onClick={() => setView('new')}
                    >
                        New Pre-Order
                    </button>
                    <button
                        className={view === 'list' ? 'active' : ''}
                        onClick={() => setView('list')}
                    >
                        Pre-Orders List
                    </button>
                </div>
            </div>

            {view === 'new' ? (
                <div className="order-creation">
                    <div className="products-section">
                        <div className="section-header">
                            <h2>Products</h2>
                            <div className="filters">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="category-filter"
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

                    <div className="cart-section">
                        <h2>Pre-Order Cart</h2>
                        <p className="info-text">Note: Items will NOT be deducted from inventory until you "Kick to Sell"</p>

                        <div className="customer-form">
                            <h3>Customer Information</h3>
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={customerData.name}
                                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number *"
                                value={customerData.phone}
                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={customerData.email}
                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                            />
                            <textarea
                                placeholder="Address"
                                value={customerData.address}
                                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
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
                <div className="orders-list">
                    <h2>Pre-Orders List</h2>
                    <p className="info-text">These orders have NOT been deducted from inventory yet. Click "Kick to Sell" to convert to a confirmed order.</p>

                    <div className="payment-method-selector" style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Payment Method for Conversion:</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Mobile">Mobile</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    {preorders.length === 0 ? (
                        <p>No pre-orders found.</p>
                    ) : (
                        <div className="orders-table-container">
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

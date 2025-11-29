import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI } from '../utils/api';
import axios from 'axios';
import jsPDF from 'jspdf';
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
    const [view, setView] = useState('new');
    const [preorders, setPreorders] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [searchPhone, setSearchPhone] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
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
            console.log('Fetching pre-orders...');
            const response = await preordersAPI.getAll();
            console.log('Pre-orders response:', response.data);
            setPreorders(response.data);
        } catch (error) {
            console.error('Error fetching pre-orders:', error);
            alert('Error loading pre-orders: ' + (error.response?.data?.error || error.message));
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

            alert('Pre-order created successfully! A confirmation email has been sent to the customer.');

            // Reset form
            setCart([]);
            setCustomerData({ name: '', phone: '', email: '', address: '' });

            // Switch to list view
            setView('list');
        } catch (error) {
            console.error('Error creating pre-order:', error);
            alert('Failed to create pre-order: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleKickToSell = async (preorderId) => {
        if (!window.confirm('Convert this pre-order to a confirmed order? This will deduct items from inventory and send an invoice email.')) {
            return;
        }

        try {
            const response = await preordersAPI.kickToSell(preorderId, { payment_method: paymentMethod });
            alert('Pre-order converted to order successfully! Invoice has been sent and items deducted from inventory.');
            fetchPreorders();
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

    const filteredPreorders = preorders.filter(preorder => {
        if (!searchPhone) return true;
        return preorder.customer_phone && preorder.customer_phone.includes(searchPhone);
    });

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="orders-page" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #7CB342 0%, #4FC3F7 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: '24px'
            }}>
                <h1 style={{ margin: 0, color: 'white', fontSize: '28px', fontWeight: '700' }}>📋 Pre-Orders Management</h1>
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                    <button
                        onClick={() => setView('new')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            background: view === 'new' ? 'white' : 'transparent',
                            color: view === 'new' ? '#7CB342' : 'white',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            fontSize: '15px',
                            boxShadow: view === 'new' ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        ➕ New Pre-Order
                    </button>
                    <button
                        onClick={() => setView('list')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            background: view === 'list' ? 'white' : 'transparent',
                            color: view === 'list' ? '#4FC3F7' : 'white',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            fontSize: '15px',
                            boxShadow: view === 'list' ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        📜 Pre-Orders List
                    </button>
                </div>
            </div>

            {view === 'new' ? (
                <div style={{ display: 'flex', gap: '24px', padding: '0 32px', maxWidth: '1600px', margin: '0 auto' }}>
                    {/* Products Section */}
                    <div style={{ flex: '2', background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>🛍️ Available Products</h2>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: '1',
                                    padding: '12px 16px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    transition: 'border 0.3s'
                                }}
                                onFocus={(e) => e.target.style.border = '2px solid #7CB342'}
                                onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
                            />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    padding: '12px 16px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    minWidth: '180px'
                                }}
                            >
                                <option value="All">📦 All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Products Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '16px',
                            maxHeight: '600px',
                            overflowY: 'auto',
                            padding: '4px'
                        }}>
                            {filteredProducts.map(product => (
                                <div key={product.id} style={{
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '2px solid #e0e0e0',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(124,179,66,0.2)';
                                    e.currentTarget.style.borderColor = '#7CB342';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>{product.item_name}</h3>
                                    <p style={{ fontSize: '18px', fontWeight: '700', color: '#7CB342', marginBottom: '8px' }}>{product.price.toFixed(2)} BDT</p>
                                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>Stock: {product.remaining_items}</p>
                                    <button
                                        onClick={() => addToCart(product)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#7CB342',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#689F38'}
                                        onMouseLeave={(e) => e.target.style.background = '#7CB342'}
                                    >
                                        + Add to Cart
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div style={{ flex: '1', minWidth: '400px' }}>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', position: 'sticky', top: '20px' }}>
                            <h2 style={{ color: '#333', marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>🛒 Pre-Order Cart</h2>

                            {/* Warning Box */}
                            <div style={{
                                background: 'linear-gradient(135deg, #fff3cd 0%, #fffbea 100%)',
                                padding: '14px',
                                borderRadius: '10px',
                                marginBottom: '20px',
                                border: '2px solid #ffc107',
                                borderLeft: '4px solid #ffc107'
                            }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#856404', fontWeight: '500' }}>
                                    ⚠️ <strong>Note:</strong> Items will NOT be deducted until "Kick to Sell"
                                </p>
                            </div>

                            {/* Customer Form */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ color: '#666', fontSize: '16px', marginBottom: '12px', fontWeight: '600' }}>👤 Customer Information</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Customer Name"
                                        value={customerData.name}
                                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                        style={{ padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px' }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="📱 Phone Number * (Required)"
                                        value={customerData.phone}
                                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                        required
                                        style={{ padding: '12px', border: '2px solid #7CB342', borderRadius: '10px', fontSize: '14px', background: '#f1f8e9' }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="📧 Email (for confirmation)"
                                        value={customerData.email}
                                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                        style={{ padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px' }}
                                    />
                                    <textarea
                                        placeholder="📍 Address"
                                        value={customerData.address}
                                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                        style={{ padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', minHeight: '70px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            {/* Cart Items */}
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                                    <p style={{ fontSize: '14px' }}>Cart is empty. Add products to create a pre-order.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                                        {cart.map(item => (
                                            <div key={item.product_id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: '#f8f9fa',
                                                borderRadius: '10px',
                                                marginBottom: '10px',
                                                border: '1px solid #e0e0e0'
                                            }}>
                                                <div style={{ flex: '1' }}>
                                                    <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: '600' }}>{item.product_name}</h4>
                                                    <p style={{ fontSize: '13px', margin: 0, color: '#7CB342', fontWeight: '600' }}>{item.unit_price.toFixed(2)} BDT</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ width: '28px', height: '28px', border: 'none', background: '#e0e0e0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                                        min="1"
                                                        style={{ width: '50px', padding: '6px', border: '2px solid #e0e0e0', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }}
                                                    />
                                                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ width: '28px', height: '28px', border: 'none', background: '#7CB342', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                                </div>
                                                <p style={{ width: '90px', textAlign: 'right', fontWeight: '700', fontSize: '14px', margin: '0 0 0 12px' }}>{item.subtotal.toFixed(2)} BDT</p>
                                                <button onClick={() => removeFromCart(item.product_id)} style={{ marginLeft: '8px', width: '28px', height: '28px', border: 'none', background: '#f44336', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total & Submit */}
                                    <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
                                            <span>Total:</span>
                                            <span style={{ color: '#7CB342' }}>{calculateTotal().toFixed(2)} BDT</span>
                                        </div>
                                        <button
                                            onClick={handleCreatePreorder}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                background: 'linear-gradient(135deg, #7CB342 0%, #689F38 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(124,179,66,0.3)',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        >
                                            ✅ Create Pre-Order
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '0 32px', maxWidth: '1600px', margin: '0 auto' }}>
                    {/* Info Box */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ color: '#333', marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>📜 All Pre-Orders</h2>
                                <div style={{ background: '#e3f2fd', padding: '12px 16px', borderRadius: '10px', border: '2px solid #2196f3', borderLeft: '4px solid #2196f3', maxWidth: '600px' }}>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#1565c0', fontWeight: '500' }}>
                                        ℹ️ <strong>Info:</strong> These orders are NOT deducted from inventory. Click "Kick to Sell" to confirm.
                                    </p>
                                </div>
                            </div>

                            {/* Search by Phone */}
                            <input
                                type="text"
                                placeholder="🔍 Search by phone number..."
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                style={{
                                    padding: '12px 16px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    minWidth: '280px'
                                }}
                            />
                        </div>

                        {/* Payment Method Selector */}
                        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <label style={{ fontWeight: '600', color: '#666', fontSize: '15px' }}>💳 Payment Method for Conversion:</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: '2px solid #e0e0e0',
                                    fontSize: '14px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                <option value="Cash">💵 Cash</option>
                                <option value="Card">💳 Card</option>
                                <option value="Mobile">📱 Mobile</option>
                                <option value="Bank Transfer">🏦 Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    {/* Pre-Orders List */}
                    {filteredPreorders.length === 0 ? (
                        <div style={{ background: 'white', padding: '80px 20px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                            <div style={{ fontSize: '72px', marginBottom: '24px' }}>📋</div>
                            <h3 style={{ color: '#666', marginBottom: '12px', fontSize: '22px' }}>No Pre-Orders Found</h3>
                            <p style={{ color: '#999', marginBottom: '24px' }}>
                                {searchPhone ? 'No pre-orders match your search.' : 'Create your first pre-order to get started!'}
                            </p>
                            {!searchPhone && (
                                <button
                                    onClick={() => setView('new')}
                                    style={{
                                        padding: '14px 28px',
                                        background: 'linear-gradient(135deg, #7CB342 0%, #689F38 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(124,179,66,0.3)'
                                    }}
                                >
                                    ➕ Create Pre-Order
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'linear-gradient(135deg, #7CB342 0%, #4FC3F7 100%)' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '14px' }}>Pre-Order #</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '14px' }}>Customer</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '14px' }}>Phone</th>
                                        <th style={{ padding: '16px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '14px' }}>Items</th>
                                        <th style={{ padding: '16px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '14px' }}>Total</th>
                                        <th style={{ padding: '16px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '14px' }}>Date</th>
                                        <th style={{ padding: '16px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                        <th style={{ padding: '16px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '14px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPreorders.map((preorder, index) => (
                                        <tr key={preorder.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '16px', fontWeight: '600', color: '#7CB342' }}>{preorder.preorder_number}</td>
                                            <td style={{ padding: '16px' }}>{preorder.customer_name}</td>
                                            <td style={{ padding: '16px', fontWeight: '600' }}>{preorder.customer_phone}</td>
                                            <td style={{ padding: '16px', fontSize: '13px' }}>
                                                {preorder.items && preorder.items.map(item => (
                                                    <div key={item.id} style={{ marginBottom: '4px' }}>
                                                        {item.product_name} × {item.quantity}
                                                    </div>
                                                ))}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: '700', fontSize: '15px', color: '#7CB342' }}>{parseFloat(preorder.total_amount).toFixed(2)} BDT</td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>{new Date(preorder.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    background: preorder.status === 'converted' ? '#e0f2fe' : '#fef3c7',
                                                    color: preorder.status === 'converted' ? '#0284c7' : '#d97706'
                                                }}>
                                                    {preorder.status === 'converted' ? '✅ Converted' : '⏳ Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                {preorder.status !== 'converted' ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleKickToSell(preorder.id)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: 'linear-gradient(135deg, #7CB342 0%, #689F38 100%)',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '13px',
                                                                boxShadow: '0 2px 8px rgba(124,179,66,0.3)'
                                                            }}
                                                        >
                                                            🚀 Kick to Sell
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePreorder(preorder.id)}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '13px' }}>Already converted</span>
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

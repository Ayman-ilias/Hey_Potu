import React, { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI } from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Orders.css';

function Orders() {
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
    const [view, setView] = useState('new'); // 'new' or 'history'
    const [orders, setOrders] = useState([]);
    const [showCategoryManage, setShowCategoryManage] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchData();
        if (view === 'history') {
            fetchOrders();
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

    const fetchOrders = async () => {
        try {
            const response = await ordersAPI.getAll();
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await categoriesAPI.delete(categoryId);
                fetchData(); // Refresh categories
            } catch (error) {
                console.error('Error deleting category:', error);
                const errorMsg = error.response?.data?.error || 'Failed to delete category';
                alert(errorMsg);
            }
        }
    };

    const addToCart = (product) => {
        if (product.remaining_items <= 0) {
            alert('Product is out of stock!');
            return;
        }
        const existingItem = cart.find(item => item.product_id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.remaining_items) {
                alert('Not enough stock!');
                return;
            }
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
        const product = products.find(p => p.id === productId);
        if (newQuantity > product.remaining_items) {
            alert('Not enough stock!');
            return;
        }
        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
                : item
        ));
    };

    const handleCreateOrder = async () => {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }
        if (!customerData.phone) {
            alert('Customer phone number is required!');
            return;
        }
        if (!customerData.name) {
            alert('Customer name is required!');
            return;
        }
        try {
            const orderData = {
                customer_name: customerData.name,
                customer_phone: customerData.phone,
                customer_email: customerData.email,
                customer_address: customerData.address,
                items: cart,
                notes: '',
                payment_method: paymentMethod
            };
            const response = await ordersAPI.create(orderData);
            alert('Order created successfully!');

            // Fetch the created order details to generate invoice
            const createdOrder = await ordersAPI.getById(response.data.orderId);

            // Generate and open invoice in new tab
            generateInvoice(createdOrder.data);

            setCart([]);
            setCustomerData({ name: '', phone: '', email: '', address: '' });
            fetchData(); // refresh stock
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error creating order: ' + (error.response?.data?.error || error.message));
        }
    };

    const generateInvoice = (order) => {
        const doc = new jsPDF();

        // White Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');

        // Dark header background with logo - matching your template
        doc.setFillColor(60, 60, 60);
        doc.roundedRect(20, 15, 80, 40, 3, 3, 'F');

        // Logo on dark background (top left)
        const logoImg = new Image();
        logoImg.src = '/logo.jpg';
        try {
            doc.addImage(logoImg, 'JPEG', 25, 20, 30, 30);
        } catch (e) {
            console.error('Logo loading failed:', e);
        }

        // White rounded rectangle for "INVOICE" text (matching template)
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(110, 15, 80, 40, 3, 3, 'F');

        // INVOICE Title in white box
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('INVOICE', 150, 42, { align: 'center' });

        // Invoice Details Box (left side)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('INVOICE #', 20, 75);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(order.order_number, 50, 75);

        doc.setFont('helvetica', 'bold');
        doc.text('ORDER NO', 20, 82);
        doc.setFont('helvetica', 'normal');
        doc.text(':', 50, 82);

        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE DATE', 20, 89);
        doc.setFont('helvetica', 'normal');
        doc.text(': ' + new Date(order.order_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }), 50, 89);

        // Bill To section (right side)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('BILL TO', 120, 75);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(order.customer_name || 'Walk-in Customer', 120, 82);

        if (order.customer_phone) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(order.customer_phone, 120, 89);
        }

        // Items Table with green header (matching your template)
        const tableColumn = ["NO", "DESCRIPTION", "PRICE", "QTY", "TOTAL"];
        const tableRows = [];

        order.items.forEach((item, index) => {
            const itemData = [
                (index + 1).toString(),
                item.product_name,
                `$${item.unit_price.toFixed(2)}`,
                item.quantity.toString(),
                `$${item.subtotal.toFixed(2)}`
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 105,
            theme: 'grid',
            headStyles: {
                fillColor: [154, 180, 64], // Green color from template
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                halign: 'left'
            },
            bodyStyles: {
                textColor: [60, 60, 60],
                fontSize: 10,
                fillColor: [245, 245, 245]
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255]
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 70, halign: 'left' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'center' },
                4: { cellWidth: 35, halign: 'right' }
            }
        });

        // Summary Section (Right-aligned box with green background)
        const finalY = doc.lastAutoTable.finalY || 130;

        // Summary box background
        const summaryX = 125;
        const summaryY = finalY + 10;

        // SUB-TOTAL
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('SUB-TOTAL', summaryX + 5, summaryY);
        doc.text(`$${order.total_amount.toFixed(2)}`, 185, summaryY, { align: 'right' });

        // VAT (10%)
        const taxAmount = order.total_amount * 0.10;
        doc.text('VAT (10%)', summaryX + 5, summaryY + 7);
        doc.text(`$${taxAmount.toFixed(2)}`, 185, summaryY + 7, { align: 'right' });

        // Total Due with green background
        doc.setFillColor(154, 180, 64);
        doc.rect(summaryX, summaryY + 12, 65, 12, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        const totalWithTax = order.total_amount + taxAmount;
        doc.text('Total Due', summaryX + 5, summaryY + 20);
        doc.text(`$${totalWithTax.toFixed(2)}`, 185, summaryY + 20, { align: 'right' });

        // Payment Method Section (left side box)
        const paymentY = summaryY + 30;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('PAYMENT METHOD', 20, paymentY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(paymentMethod.toUpperCase(), 30, paymentY + 10);

        // Terms and Conditions (left side)
        const termsY = paymentY + 25;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TERM AND CONDITIONS', 20, termsY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Please keep your receipt for any future service, warranty, or', 20, termsY + 6);
        doc.text('exchange claims.', 20, termsY + 10);

        // Manager signature line (right side)
        doc.setDrawColor(40, 40, 40);
        doc.setLineWidth(0.5);
        doc.line(130, termsY + 15, 190, termsY + 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('Manager', 160, termsY + 20, { align: 'center' });

        // Footer with dark background - matching template
        const footerY = 260;
        doc.setFillColor(60, 60, 60);
        doc.roundedRect(20, footerY, 170, 25, 3, 3, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('THANK YOU FOR YOUR BUSINESS', 105, footerY + 8, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('House 26, Road 13, Sector 14,', 105, footerY + 14, { align: 'center' });
        doc.text('Uttara, Dhaka - 1230, Bangladesh.', 105, footerY + 18, { align: 'center' });
        doc.text('heypotu@gmail.com', 105, footerY + 22, { align: 'center' });

        // Open in new tab instead of downloading
        window.open(doc.output('bloburl'), '_blank');
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.product_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.item_category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="orders-container">
            {/* View Toggle */}
            <div className="view-toggle">
                <button
                    className={`toggle-btn ${view === 'new' ? 'active' : ''}`}
                    onClick={() => setView('new')}
                >
                    New Order
                </button>
                <button
                    className={`toggle-btn ${view === 'history' ? 'active' : ''}`}
                    onClick={() => setView('history')}
                >
                    Order History
                </button>
            </div>

            {view === 'new' ? (
                <>
                    {/* Left Side: Product Browser */}
                    <div className="product-browser">
                        {/* Search & Categories */}
                        <div className="browser-header">
                            <input
                                type="text"
                                placeholder="🔍 Search products..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-bar"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="category-pills" style={{ flex: 1 }}>
                                    <button
                                        className={`pill ${selectedCategory === 'All' ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory('All')}
                                    >
                                        All
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            className={`pill ${selectedCategory === cat.name ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat.name)}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowCategoryManage(!showCategoryManage)}
                                    style={{
                                        padding: '0.6rem 1.25rem',
                                        border: '1.5px solid #4f46e5',
                                        borderRadius: '9999px',
                                        background: 'white',
                                        color: '#4f46e5',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = '#4f46e5'; e.target.style.color = 'white'; }}
                                    onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.color = '#4f46e5'; }}
                                >
                                    ⚙️ Manage
                                </button>
                            </div>

                            {showCategoryManage && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1.25rem',
                                    background: 'white',
                                    borderRadius: '0.75rem',
                                    border: '2px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
                                        Manage Categories
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {categories.map(cat => (
                                            <div key={cat.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 1rem',
                                                background: '#f8fafc',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <span style={{ fontWeight: '500', color: '#1e293b' }}>{cat.name}</span>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    style={{
                                                        padding: '0.375rem 0.875rem',
                                                        background: '#fee2e2',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseOver={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = 'white'; }}
                                                    onMouseOut={(e) => { e.target.style.background = '#fee2e2'; e.target.style.color = '#ef4444'; }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Product List */}
                        <div className="product-list">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="product-list-item" onClick={() => addToCart(product)}>
                                    <div className="product-list-info">
                                        <div className="product-list-main">
                                            <h4 className="product-list-name">{product.item_name}</h4>
                                            <span className="product-list-code">{product.product_code}</span>
                                        </div>
                                        <span className="product-list-category">{product.item_category}</span>
                                    </div>
                                    <div className="product-list-actions">
                                        <div className="product-list-stock">
                                            <span className={`stock-badge ${product.remaining_items <= 10 ? 'low' : ''}`}>
                                                {product.remaining_items} in stock
                                            </span>
                                        </div>
                                        <span className="product-list-price">BDT {product.price}</span>
                                        <button className="add-to-cart-btn" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Cart & Checkout */}
                    <div className="cart-sidebar">
                        <div className="cart-header">
                            <h3>Current Order</h3>
                            <span className="item-count">{cart.length} Items</span>
                        </div>

                        <div className="customer-mini-form">
                            <input
                                type="text"
                                placeholder="Customer Name *"
                                value={customerData.name}
                                onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                                className="mini-input"
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number *"
                                value={customerData.phone}
                                onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                                className="mini-input"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email (Optional)"
                                value={customerData.email}
                                onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                                className="mini-input"
                            />
                            <input
                                type="text"
                                placeholder="Address (Optional)"
                                value={customerData.address}
                                onChange={e => setCustomerData({ ...customerData, address: e.target.value })}
                                className="mini-input"
                            />
                        </div>

                        {/* Cart Items List */}
                        <div className="cart-list">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <span className="empty-icon">🛒</span>
                                    <p>Cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.product_id} className="cart-list-item">
                                        <div className="item-info">
                                            <span className="item-name">{item.product_name}</span>
                                            <span className="item-unit-price">BDT {item.unit_price}</span>
                                        </div>
                                        <div className="item-actions">
                                            <div className="qty-btn-group">
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                                            </div>
                                            <span className="item-subtotal">BDT {item.subtotal.toFixed(2)}</span>
                                            <button className="delete-btn" onClick={() => removeFromCart(item.product_id)}>×</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="cart-footer">
                            {/* Payment Method */}
                            <div className="payment-method-section">
                                <h4>Payment Method</h4>
                                <div className="payment-methods">
                                    <button
                                        className={`payment-method-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('Cash')}
                                    >
                                        💵 Cash
                                    </button>
                                    <button
                                        className={`payment-method-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('Card')}
                                    >
                                        💳 Card
                                    </button>
                                    <button
                                        className={`payment-method-btn ${paymentMethod === 'Mobile' ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod('Mobile')}
                                    >
                                        📱 Mobile
                                    </button>
                                </div>
                            </div>

                            <div className="total-section">
                                <span>Total</span>
                                <span className="total-amount">BDT {cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                className="checkout-btn"
                                onClick={handleCreateOrder}
                                disabled={cart.length === 0}
                            >
                                Complete Order
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="order-history-view">
                    <h2 style={{ marginBottom: '1.5rem' }}>Order History</h2>

                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.order_number}</td>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td>
                                            <div>{order.customer_name}</div>
                                            <small>{order.customer_phone}</small>
                                        </td>
                                        <td>{order.items?.length || 0} items</td>
                                        <td>BDT {order.total_amount}</td>
                                        <td>
                                            <span className={`status-badge ${order.status}`}>{order.status}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-invoice"
                                                onClick={() => generateInvoice(order)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '0.8rem',
                                                    background: '#4f46e5',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    marginLeft: '10px'
                                                }}
                                            >
                                                📄 Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Orders;

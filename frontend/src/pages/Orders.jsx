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
                notes: ''
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

        // Header border line
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.8);
        doc.line(20, 55, 190, 55);

        // Company Logo (top left)
        const logoImg = new Image();
        logoImg.src = '/logo.jpg';
        try {
            doc.addImage(logoImg, 'JPEG', 20, 15, 30, 30);
        } catch (e) {
            console.error('Logo loading failed:', e);
        }

        // Company Information (top right)
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('HEY POTU', 190, 25, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Uttara 14, Dhaka', 190, 33, { align: 'right' });
        doc.text('Tel: +880-123-456-7890', 190, 38, { align: 'right' });
        doc.text('Email: info@heypotu.com', 190, 43, { align: 'right' });

        // INVOICE Title (large, bold, left side)
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('INVOICE', 20, 75);

        // Invoice Details Box (left side)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Invoice No:', 20, 105);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(order.order_number, 55, 105);

        // Date (right side, aligned with Invoice No)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Date:', 130, 105);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(new Date(order.order_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }), 145, 105);

        // Bill To section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Bill to:', 20, 120);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(order.customer_name || 'Walk-in Customer', 20, 128);

        // Only show phone number, no address
        if (order.customer_phone) {
            doc.setFontSize(9);
            doc.text(`Tel: ${order.customer_phone}`, 20, 134);
        }

        // Horizontal line before table
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(20, 165, 190, 165);

        // Items Table
        const tableColumn = ["Item", "Description", "Qty", "Price(BDT)", "Amount(BDT)"];
        const tableRows = [];

        order.items.forEach((item, index) => {
            const itemData = [
                (index + 1).toString() + '.',
                item.product_name,
                item.quantity.toString(),
                `${item.unit_price.toFixed(0)}`,
                `${item.subtotal.toFixed(0)}`
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 170,
            theme: 'plain',
            headStyles: {
                fillColor: [255, 255, 255, 0],
                textColor: [60, 60, 60],
                fontStyle: 'bold',
                fontSize: 10,
                halign: 'left',
                cellPadding: { top: 3, bottom: 3, left: 5, right: 5 }
            },
            bodyStyles: {
                textColor: [60, 60, 60],
                fontSize: 10,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 }
            },
            styles: {
                lineWidth: 0.2,
                lineColor: [200, 200, 200]
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 65, halign: 'left' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            }
        });

        // Summary Section (Right-aligned, matching reference)
        const finalY = doc.lastAutoTable.finalY || 170;

        // Horizontal line before summary
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(20, finalY + 5, 190, finalY + 5);

        // Summary calculations (right-aligned)
        const summaryStartX = 120;
        const summaryLabelX = summaryStartX + 10;
        const summaryValueX = 185;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);

        // Subtotal
        doc.text('Subtotal', summaryLabelX, finalY + 20);
        doc.text(`${order.total_amount.toFixed(0)}BDT`, summaryValueX, finalY + 20, { align: 'right' });

        // Tax
        doc.text('Tax', summaryLabelX, finalY + 30);
        doc.text('10%', summaryValueX, finalY + 30, { align: 'right' });

        // Total (with larger font)
        doc.setFontSize(12);
        doc.text('Total', summaryLabelX, finalY + 42);
        const taxAmount = order.total_amount * 0.10;
        const totalWithTax = order.total_amount + taxAmount;
        doc.text(`${totalWithTax.toFixed(0)}BDT`, summaryValueX, finalY + 42, { align: 'right' });

        // Payment Terms Section (left side)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text('Terms & Conditions:', 20, finalY + 20);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('1. Payment is due upon receipt', 20, finalY + 27);
        doc.text('2. Please make payment within 7 days', 20, finalY + 32);
        doc.text('3. Thank you for your business!', 20, finalY + 37);

        // Payment Method Section - in a box
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, finalY + 45, 80, 20, 2, 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text('Payment Method:', 25, finalY + 52);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.text(paymentMethod, 25, finalY + 60);

        // Signature section (right side) - in a box
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.5);
        doc.roundedRect(110, finalY + 45, 80, 20, 2, 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text('Authorized Signature:', 115, finalY + 52);

        // Signature line
        doc.setDrawColor(100, 100, 100);
        doc.line(115, finalY + 62, 180, finalY + 62);

        // Footer with border
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 272, 210, 25, 'F');

        doc.setDrawColor(220, 220, 220);
        doc.line(20, 272, 190, 272);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('Thank you for your business!', 105, 282, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('For any questions, contact us: info@heypotu.com | +880-123-456-7890', 105, 288, { align: 'center' });

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

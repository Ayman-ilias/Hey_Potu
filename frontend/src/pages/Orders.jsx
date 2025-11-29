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

            // Switch to history view to show the new order
            setView('history');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Error creating order: ' + (error.response?.data?.error || error.message));
        }
    };

    const generateInvoice = (order) => {
        const doc = new jsPDF();

        // Format date to GMT+6 (Bangladesh Time)
        const formatDateGMT6 = (dateString) => {
            // Create date object - if it's already a timestamp, use it directly
            let date;
            if (!dateString || dateString === 'Invalid Date') {
                date = new Date(); // Use current date if invalid
            } else {
                date = new Date(dateString);
            }

            // Check if date is valid
            if (isNaN(date.getTime())) {
                date = new Date(); // Fallback to current date
            }

            return {
                full: date.toLocaleDateString('en-US', {
                    timeZone: 'Asia/Dhaka',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: date.toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Dhaka',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            };
        };

        const dateInfo = formatDateGMT6(order.order_date);

        // Brand Colors: Green #7CB342, Blue #4FC3F7, Orange #FF5722
        const brandGreen = [124, 179, 66];
        const brandBlue = [79, 195, 247];
        const darkGray = [44, 62, 80];

        // ===== HEADER SECTION =====
        // Logo
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        try {
            doc.addImage(logoImg, 'PNG', 15, 15, 25, 25);
        } catch (e) {
            console.log('Logo not loaded');
        }

        // Company Name and Details
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text('HEY POTU', 45, 25);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Point of Sale System', 45, 30);
        doc.text('House 26, Road 13, Sector 14, Uttara', 45, 34);
        doc.text('Dhaka - 1230, Bangladesh', 45, 38);
        doc.text('Email: heypotu@gmail.com', 45, 42);

        // INVOICE Badge - Blue gradient box
        doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        doc.rect(145, 15, 50, 18, 'F');
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('INVOICE', 170, 27, { align: 'center' });

        // Horizontal line separator
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.line(15, 48, 195, 48);

        // ===== INVOICE INFO SECTION =====
        let yPos = 55;

        // Left Column - Invoice Details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Invoice Number:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(order.order_number, 50, yPos);

        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Invoice Date:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(dateInfo.full, 50, yPos);

        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Invoice Time:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(dateInfo.time + ' (GMT+6)', 50, yPos);

        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('Payment Method:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(brandGreen[0], brandGreen[1], brandGreen[2]);
        doc.text(paymentMethod, 50, yPos);

        // Right Column - Bill To
        yPos = 55;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('BILL TO:', 120, yPos);

        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(order.customer_name || 'Walk-in Customer', 120, yPos);

        if (order.customer_phone) {
            yPos += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(127, 140, 141);
            doc.text('Phone: ' + order.customer_phone, 120, yPos);
        }

        if (order.customer_email) {
            yPos += 4;
            doc.setFontSize(8);
            doc.text('Email: ' + order.customer_email, 120, yPos);
        }

        if (order.customer_address) {
            yPos += 4;
            doc.setFontSize(7);
            const addressLines = doc.splitTextToSize(order.customer_address, 70);
            doc.text('Address: ' + addressLines[0], 120, yPos);
        }

        // ===== ITEMS TABLE =====
        const tableColumn = ["SL", "DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"];
        const tableRows = [];

        order.items.forEach((item, index) => {
            const itemData = [
                (index + 1).toString(),
                item.product_name,
                item.quantity.toString(),
                `${item.unit_price.toFixed(2)} BDT`,
                `${item.subtotal.toFixed(2)} BDT`
            ];
            tableRows.push(itemData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 85,
            theme: 'grid',
            headStyles: {
                fillColor: [darkGray[0], darkGray[1], darkGray[2]], // Dark gray
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'left',
                cellPadding: 3
            },
            bodyStyles: {
                textColor: [darkGray[0], darkGray[1], darkGray[2]],
                fontSize: 9,
                fillColor: [248, 249, 250],
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255]
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 80, halign: 'left' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            },
            margin: { left: 15, right: 15 }
        });

        // ===== TOTALS SECTION =====
        const finalY = doc.lastAutoTable.finalY || 120;
        let summaryY = finalY + 8;
        const summaryX = 120;

        // Subtotal
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 73, 94);
        doc.text('Subtotal:', summaryX, summaryY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(`${order.total_amount.toFixed(2)} BDT`, 193, summaryY, { align: 'right' });

        summaryY += 6;
        // VAT
        const taxAmount = order.total_amount * 0.10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 73, 94);
        doc.text('VAT (10%):', summaryX, summaryY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.text(`${taxAmount.toFixed(2)} BDT`, 193, summaryY, { align: 'right' });

        summaryY += 8;
        // Total with brand green background
        const totalWithTax = order.total_amount + taxAmount;
        doc.setFillColor(brandGreen[0], brandGreen[1], brandGreen[2]);
        doc.rect(summaryX - 3, summaryY - 5, 78, 10, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TOTAL AMOUNT:', summaryX, summaryY);
        doc.setFontSize(13);
        doc.text(`${totalWithTax.toFixed(2)} BDT`, 191, summaryY, { align: 'right' });

        // ===== TERMS & NOTES SECTION =====
        summaryY += 18;

        // Terms and Conditions Box
        doc.setDrawColor(224, 224, 224);
        doc.setLineWidth(0.5);
        doc.rect(15, summaryY, 85, 25, 'S');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('TERMS & CONDITIONS', 18, summaryY + 5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('• Payment is due upon receipt of invoice', 18, summaryY + 10);
        doc.text('• Please keep this invoice for warranty claims', 18, summaryY + 14);
        doc.text('• All sales are final unless otherwise stated', 18, summaryY + 18);

        // Authorized Signature Box
        doc.rect(110, summaryY, 85, 25, 'S');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('AUTHORIZED SIGNATURE', 113, summaryY + 5);

        // Signature line
        doc.setDrawColor(127, 140, 141);
        doc.line(115, summaryY + 18, 185, summaryY + 18);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Manager / Authorized Person', 150, summaryY + 22, { align: 'center' });

        // ===== FOOTER =====
        const footerY = summaryY + 35;

        // Footer background - brand dark gray
        doc.setFillColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.rect(15, footerY, 180, 18, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('THANK YOU FOR YOUR BUSINESS!', 105, footerY + 7, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(236, 240, 241);
        doc.text('For any queries, contact us at heypotu@gmail.com or visit our store', 105, footerY + 13, { align: 'center' });

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

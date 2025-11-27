import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../utils/api';
import { exportInventoryReportToExcel, exportSalesReportToExcel } from '../utils/excelExport';
import { exportToPDF } from '../utils/pdfExport';
import './Reports.css';

function Reports() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [inventoryData, setInventoryData] = useState([]);
    const [salesData, setSalesData] = useState(null);
    const [customerData, setCustomerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: '',
        end: '',
    });

    useEffect(() => {
        loadTabData();
    }, [activeTab]);

    const loadTabData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'inventory':
                    const invRes = await reportsAPI.getInventory();
                    setInventoryData(invRes.data);
                    break;
                case 'sales':
                    const salesRes = await reportsAPI.getSales(dateRange.start, dateRange.end);
                    setSalesData(salesRes.data);
                    break;
                case 'customers':
                    const custRes = await reportsAPI.getCustomers();
                    setCustomerData(custRes.data);
                    break;
            }
        } catch (error) {
            console.error('Error loading report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalesFilter = async () => {
        setLoading(true);
        try {
            const salesRes = await reportsAPI.getSales(dateRange.start, dateRange.end);
            setSalesData(salesRes.data);
        } catch (error) {
            console.error('Error filtering sales:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="products-page">
            <div className="page-header">
                <h2>Reports & Analytics</h2>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    📦 Inventory Report
                </button>
                <button
                    className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    💰 Sales Report
                </button>
                <button
                    className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('customers')}
                >
                    👥 Customer Report
                </button>
            </div>

            {loading && <div className="loading"><div className="spinner"></div></div>}

            {!loading && activeTab === 'inventory' && (
                <div className="report-section">
                    <div className="report-header">
                        <h3>Inventory Report</h3>
                        <div className="header-actions">
                            <button className="btn btn-secondary" onClick={() => {
                                const columns = [
                                    { key: 'serial_no', label: 'Serial No' },
                                    { key: 'product_code', label: 'Code' },
                                    { key: 'item_name', label: 'Item Name' },
                                    { key: 'item_category', label: 'Category' },
                                    { key: 'total_stock', label: 'Total Stock' },
                                    { key: 'sold_items', label: 'Sold' },
                                    { key: 'remaining_items', label: 'Remaining' },
                                    { key: 'price', label: 'Price (BDT )' },
                                    { key: 'revenue', label: 'Revenue (BDT )' },
                                ];
                                exportToPDF('Inventory Report', inventoryData, columns, 'inventory-report.pdf');
                            }}>
                                📄 Export PDF
                            </button>
                            <button className="btn btn-primary" onClick={() => exportInventoryReportToExcel(inventoryData)}>
                                📊 Export Excel
                            </button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Serial No</th>
                                    <th>Code</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Total Stock</th>
                                    <th>Sold</th>
                                    <th>Remaining</th>
                                    <th>Price</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryData.map((item) => (
                                    <tr key={item.serial_no}>
                                        <td>{item.serial_no}</td>
                                        <td>{item.product_code}</td>
                                        <td><strong>{item.item_name}</strong></td>
                                        <td>{item.item_category}</td>
                                        <td>{item.total_stock}</td>
                                        <td>{item.sold_items}</td>
                                        <td className={item.remaining_items <= 10 ? 'text-warning' : 'text-success'}>
                                            {item.remaining_items}
                                        </td>
                                        <td>BDT {item.price}</td>
                                        <td><strong className="text-green">BDT {item.revenue}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'sales' && salesData && (
                <div className="report-section">
                    <div className="report-header">
                        <h3>Sales Report</h3>
                        <div className="date-filter">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                            <button className="btn btn-secondary" onClick={handleSalesFilter}>Filter</button>
                        </div>
                        <div className="header-actions">
                            <button className="btn btn-secondary" onClick={() => {
                                const columns = [
                                    { key: 'order_number', label: 'Order #' },
                                    { key: 'order_date', label: 'Date' },
                                    { key: 'customer_name', label: 'Customer' },
                                    { key: 'phone', label: 'Phone' },
                                    { key: 'total_amount', label: 'Amount (BDT )' },
                                    { key: 'status', label: 'Status' },
                                ];
                                const formattedOrders = salesData.orders.map(o => ({
                                    ...o,
                                    order_date: new Date(o.order_date).toLocaleString(),
                                    customer_name: o.customer_name || 'Walk-in',
                                    phone: o.phone || 'N/A'
                                }));
                                exportToPDF('Sales Report', formattedOrders, columns, 'sales-report.pdf');
                            }}>
                                📄 Export PDF
                            </button>
                            <button className="btn btn-primary" onClick={() => exportSalesReportToExcel(salesData)}>
                                📊 Export Excel
                            </button>
                        </div>
                    </div>

                    <div className="stats-summary grid grid-3">
                        <div className="summary-card">
                            <h4>Total Orders</h4>
                            <p className="summary-value">{salesData.summary.totalOrders}</p>
                        </div>
                        <div className="summary-card">
                            <h4>Total Sales</h4>
                            <p className="summary-value text-green">BDT {salesData.summary.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="summary-card">
                            <h4>Average Order Value</h4>
                            <p className="summary-value text-blue">BDT {salesData.summary.averageOrderValue.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.orders.map((order) => (
                                    <tr key={order.order_number}>
                                        <td><strong>{order.order_number}</strong></td>
                                        <td>{new Date(order.order_date).toLocaleString()}</td>
                                        <td>{order.customer_name || 'Walk-in'}</td>
                                        <td>{order.phone || 'N/A'}</td>
                                        <td><strong className="text-green">BDT {order.total_amount}</strong></td>
                                        <td><span className="badge badge-success">{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'customers' && (
                <div className="report-section">
                    <div className="report-header">
                        <h3>Customer Purchase Report</h3>
                        <button className="btn btn-secondary" onClick={() => {
                            const columns = [
                                { key: 'customer_name', label: 'Customer Name' },
                                { key: 'phone', label: 'Phone' },
                                { key: 'email', label: 'Email' },
                                { key: 'total_orders', label: 'Total Orders' },
                                { key: 'total_spent', label: 'Total Spent (BDT )' },
                            ];
                            const formattedCustomers = customerData.map(c => ({
                                ...c,
                                phone: c.phone || 'N/A',
                                email: c.email || 'N/A'
                            }));
                            exportToPDF('Customer Purchase Report', formattedCustomers, columns, 'customers-report.pdf');
                        }}>
                            📄 Export PDF
                        </button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Total Orders</th>
                                    <th>Total Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerData.map((customer) => (
                                    <tr key={customer.id}>
                                        <td><strong>{customer.customer_name}</strong></td>
                                        <td>{customer.phone || 'N/A'}</td>
                                        <td>{customer.email || 'N/A'}</td>
                                        <td>{customer.total_orders}</td>
                                        <td><strong className="text-green">BDT {customer.total_spent}</strong></td>
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

export default Reports;

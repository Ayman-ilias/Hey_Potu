import React, { useState, useEffect } from 'react';
import { reportsAPI, ordersAPI } from '../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [salesData, setSalesData] = useState({ labels: [], data: [], colors: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchSalesTrend();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await reportsAPI.getDashboard();
            setStats(response.data);
            setRecentOrders(response.data.recentOrders);
            setTopProducts(response.data.topProducts);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesTrend = async () => {
        try {
            const response = await ordersAPI.getAll();
            const orders = response.data;

            // Check if there are any orders
            if (!orders || orders.length === 0) {
                console.log('No orders found for sales trend');
                setSalesData({ labels: [], data: [], colors: [] });
                return;
            }

            // Group orders by date and calculate daily sales
            const salesByDate = {};
            const dateObjects = {};

            orders.forEach(order => {
                // Handle various date formats
                let dateObj = new Date(order.order_date);

                // Check if date is valid
                if (isNaN(dateObj.getTime())) {
                    console.warn('Invalid date for order:', order.order_number, order.order_date);
                    dateObj = new Date(); // Use current date as fallback
                }

                const dateKey = dateObj.toISOString().split('T')[0]; // Use ISO date as key for sorting
                const displayDate = dateObj.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short'
                });

                if (!salesByDate[dateKey]) {
                    salesByDate[dateKey] = 0;
                    dateObjects[dateKey] = displayDate;
                }
                salesByDate[dateKey] += parseFloat(order.total_amount) || 0;
            });

            // Sort dates chronologically (oldest to newest - left to right)
            const sortedDateKeys = Object.keys(salesByDate).sort();

            // Get last 8 days of data
            const last8Days = sortedDateKeys.slice(-8);
            const labels = last8Days.map(key => dateObjects[key]);
            const data = last8Days.map(key => salesByDate[key]);

            console.log('Sales trend data:', { labels, data });

            // Calculate colors: teal for increase, red for decrease
            const colors = data.map((value, index) => {
                if (index === 0) return 'rgba(56, 178, 172, 1)'; // First point is teal
                return value >= data[index - 1]
                    ? 'rgba(56, 178, 172, 1)' // Teal for up
                    : 'rgba(239, 68, 68, 1)';  // Red for down
            });

            setSalesData({ labels, data, colors });
        } catch (error) {
            console.error('Error fetching sales trend:', error);
            setSalesData({ labels: [], data: [], colors: [] });
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    // Prepare chart data with segment colors
    const chartData = {
        labels: salesData.labels,
        datasets: [
            {
                label: 'Daily Sales',
                data: salesData.data,
                borderColor: 'rgba(56, 178, 172, 1)', // Teal color like the image
                backgroundColor: 'rgba(56, 178, 172, 0.05)',
                borderWidth: 3,
                tension: 0.2, // Less curved for cleaner look
                fill: false,
                pointBackgroundColor: salesData.colors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 7,
                pointHoverRadius: 9,
                segment: {
                    borderColor: ctx => {
                        const { p0, p1 } = ctx;
                        return p1.parsed.y >= p0.parsed.y
                            ? 'rgba(56, 178, 172, 1)' // Teal for up
                            : 'rgba(239, 68, 68, 1)';  // Red for down
                    }
                }
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 14, weight: 'bold' },
                displayColors: false,
                callbacks: {
                    label: (context) => `${context.parsed.y.toFixed(0)} BDT`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                    lineWidth: 1,
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    padding: 10,
                    font: {
                        size: 11
                    },
                    callback: (value) => `${value}`
                }
            },
            x: {
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                    lineWidth: 1,
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Dashboard Overview</h2>
                <p>Welcome to Hey Potu POS System</p>
            </div>

            <div className="stats-grid grid grid-3">
                <div className="stat-card green">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>{stats?.totalProducts || 0}</h3>
                        <p>Total Products</p>
                    </div>
                </div>

                <div className="stat-card orange">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-info">
                        <h3>{stats?.totalOrders || 0}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>

                <div className="stat-card blue">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.totalCustomers || 0}</h3>
                        <p>Total Customers</p>
                    </div>
                </div>
            </div>

            {stats?.lowStockCount > 0 && (
                <div className="alert-banner">
                    <span className="alert-icon">⚠️</span>
                    <span>You have {stats.lowStockCount} products with low stock!</span>
                </div>
            )}

            {/* Sales Trend Graph */}
            <div className="card sales-chart-card">
                <h3>📈 Sales Trend (Last 7 Days)</h3>
                <div className="sales-chart-container">
                    {salesData.data.length > 0 ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                            No sales data available yet
                        </p>
                    )}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-dot green"></span>
                        <span>Sales Increasing</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot red"></span>
                        <span>Sales Decreasing</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content grid grid-2">
                <div className="card">
                    <h3>Recent Orders</h3>
                    {recentOrders.length > 0 ? (
                        <div className="orders-list">
                            {recentOrders.map(order => (
                                <div key={order.id} className="order-item">
                                    <div className="order-info">
                                        <strong>{order.order_number}</strong>
                                        <p>{order.customer_name || 'Walk-in'}</p>
                                    </div>
                                    <div className="order-amount">
                                        <strong>BDT {order.total_amount}</strong>
                                        <p>{new Date(order.order_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No recent orders</p>
                    )}
                </div>

                <div className="card">
                    <h3>Top Selling Products</h3>
                    {topProducts.length > 0 ? (
                        <div className="products-list">
                            {topProducts.map((product, idx) => (
                                <div key={idx} className="product-item">
                                    <div className="product-rank">{idx + 1}</div>
                                    <div className="product-info">
                                        <strong>{product.item_name}</strong>
                                        <p>{product.item_category}</p>
                                    </div>
                                    <div className="product-sold">
                                        <strong>{product.sold_items}</strong>
                                        <p>sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No sales data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

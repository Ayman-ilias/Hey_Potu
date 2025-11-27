const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    // Total Products
    const productsCount = await db.get('SELECT COUNT(*) as count FROM products');
    // Low Stock
    const lowStockCount = await db.get('SELECT COUNT(*) as count FROM products WHERE (total_stock - sold_items) <= 10');
    // Total Orders
    const ordersCount = await db.get('SELECT COUNT(*) as count FROM orders');
    // Total Customers
    const customersCount = await db.get('SELECT COUNT(*) as count FROM customers');
    // Recent Orders
    const recentOrders = await db.all(`
            SELECT o.*, c.customer_name 
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);
    // Top Selling Products
    const topProducts = await db.all(`
            SELECT p.item_name, p.item_category, SUM(oi.quantity) as sold_items
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.id, p.item_name, p.item_category
            ORDER BY sold_items DESC
            LIMIT 5
        `);
    res.json({
      totalProducts: productsCount.count,
      lowStockCount: lowStockCount.count,
      totalOrders: ordersCount.count,
      totalCustomers: customersCount.count,
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Inventory Report
router.get('/inventory', async (req, res) => {
  try {
    const inventory = await db.all(`
            SELECT *, (total_stock - sold_items) as remaining_items,
                   (total_stock * price) as total_value,
                   (sold_items * price) as revenue
            FROM products
            ORDER BY item_name ASC
        `);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
});

// Sales Report
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
            SELECT o.*, c.customer_name 
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
        `;
    const params = [];
    if (startDate && endDate) {
      query += ` WHERE date(o.created_at) BETWEEN date(?) AND date(?)`;
      params.push(startDate, endDate);
    }
    query += ` ORDER BY o.created_at DESC`;
    const sales = await db.all(query, params);

    // Calculate summary
    const totalOrders = sales.length;
    const totalSales = sales.reduce((sum, order) => sum + order.total_amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      orders: sales,
      summary: {
        totalOrders,
        totalSales,
        averageOrderValue
      }
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
});

// Customer Report
router.get('/customers', async (req, res) => {
  try {
    const customers = await db.all(`
            SELECT c.*, 
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            GROUP BY c.id
            ORDER BY total_spent DESC
        `);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customer report:', error);
    res.status(500).json({ error: 'Failed to fetch customer report' });
  }
});

module.exports = router;

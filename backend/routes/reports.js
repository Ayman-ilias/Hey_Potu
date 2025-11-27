const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Dashboard Stats
router.get('/dashboard', (req, res) => {
  try {
    const products = db.getAll('products');
    const orders = db.getAll('orders');
    const customers = db.getAll('customers');
    const orderItems = db.getAll('order_items');

    // Total Products
    const totalProducts = products.length;

    // Low Stock
    const lowStockCount = products.filter(p => {
      const remaining = (p.total_stock || 0) - (p.sold_items || 0);
      return remaining <= 10;
    }).length;

    // Total Orders
    const totalOrders = orders.length;

    // Total Customers
    const totalCustomers = customers.length;

    // Recent Orders
    const recentOrders = orders
      .map(o => {
        const customer = customers.find(c => c.id === o.customer_id);
        return {
          ...o,
          customer_name: customer ? customer.customer_name : null
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    // Top Selling Products
    const productSales = {};
    orderItems.forEach(oi => {
      if (!productSales[oi.product_id]) {
        productSales[oi.product_id] = 0;
      }
      productSales[oi.product_id] += oi.quantity;
    });

    const topProducts = Object.entries(productSales)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        return product ? {
          item_name: product.item_name,
          item_category: product.item_category,
          sold_items: quantity
        } : null;
      })
      .filter(p => p !== null)
      .sort((a, b) => b.sold_items - a.sold_items)
      .slice(0, 5);

    res.json({
      totalProducts,
      lowStockCount,
      totalOrders,
      totalCustomers,
      recentOrders,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Inventory Report
router.get('/inventory', (req, res) => {
  try {
    const products = db.getAll('products');

    const inventory = products.map(p => ({
      ...p,
      remaining_items: (p.total_stock || 0) - (p.sold_items || 0),
      total_value: (p.total_stock || 0) * (p.price || 0),
      revenue: (p.sold_items || 0) * (p.price || 0)
    }));

    // Sort by item_name ASC
    inventory.sort((a, b) => a.item_name.localeCompare(b.item_name));

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ error: 'Failed to fetch inventory report' });
  }
});

// Sales Report
router.get('/sales', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orders = db.getAll('orders');
    const customers = db.getAll('customers');

    let filteredOrders = orders;

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && orderDate <= end;
      });
    }

    // Add customer_name to orders
    const sales = filteredOrders.map(o => {
      const customer = customers.find(c => c.id === o.customer_id);
      return {
        ...o,
        customer_name: customer ? customer.customer_name : null
      };
    });

    // Sort by created_at DESC
    sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate summary
    const totalOrders = sales.length;
    const totalSales = sales.reduce((sum, order) => sum + (order.total_amount || 0), 0);
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
router.get('/customers', (req, res) => {
  try {
    const customers = db.getAll('customers');
    const orders = db.getAll('orders');

    const customerReport = customers.map(c => {
      const customerOrders = orders.filter(o => o.customer_id === c.id);
      const total_orders = customerOrders.length;
      const total_spent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return {
        ...c,
        total_orders,
        total_spent
      };
    });

    // Sort by total_spent DESC
    customerReport.sort((a, b) => b.total_spent - a.total_spent);

    res.json(customerReport);
  } catch (error) {
    console.error('Error fetching customer report:', error);
    res.status(500).json({ error: 'Failed to fetch customer report' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.all(`
            SELECT o.*, c.customer_name, c.phone as customer_phone
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.order_date DESC
        `);

    // Fetch items for each order (N+1 problem, but fine for SQLite scale)
    for (let order of orders) {
      order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.get(`
            SELECT o.*, c.customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, notes } = req.body;

    if (!customer_phone) {
      throw new Error('Customer phone is required');
    }

    // 1. Find or Create Customer
    let customerId;
    const existingCustomer = await db.get('SELECT id FROM customers WHERE phone = ?', [customer_phone]);

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer details if provided
      await db.run(`
                UPDATE customers 
                SET customer_name = COALESCE(?, customer_name),
                    email = COALESCE(?, email),
                    address = COALESCE(?, address)
                WHERE id = ?
            `, [customer_name, customer_email, customer_address, customerId]);
    } else {
      const result = await db.run(`
                INSERT INTO customers (customer_name, phone, email, address)
                VALUES (?, ?, ?, ?)
            `, [customer_name, customer_phone, customer_email, customer_address]);
      customerId = result.id;
    }

    // 2. Generate order number
    const orderNumber = 'ORD-' + Date.now();

    // 3. Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    // 4. Insert order
    const orderResult = await db.run(`
            INSERT INTO orders (order_number, customer_id, customer_name, total_amount, notes)
            VALUES (?, ?, ?, ?, ?)
        `, [orderNumber, customerId, customer_name, totalAmount, notes]);

    const orderId = orderResult.id;

    // 5. Insert order items and update product stock
    for (const item of items) {
      await db.run(`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]);

      await db.run(`
                UPDATE products 
                SET sold_items = sold_items + ?
                WHERE id = ?
            `, [item.quantity, item.product_id]);
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId,
      customerId: customerId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await db.run(`
            UPDATE orders 
            SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, notes, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get order items to restore stock
    const items = await db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);

    // Restore stock
    for (const item of items) {
      await db.run(`
                UPDATE products 
                SET sold_items = sold_items - ?
                WHERE id = ?
            `, [item.quantity, item.product_id]);
    }

    // Delete order (cascade should handle items, but we can delete manually to be safe)
    await db.run('DELETE FROM order_items WHERE order_id = ?', [id]);
    await db.run('DELETE FROM orders WHERE id = ?', [id]);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;

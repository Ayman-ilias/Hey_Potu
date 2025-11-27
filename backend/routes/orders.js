const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all orders
router.get('/', (req, res) => {
  try {
    const orders = db.getAll('orders');
    const customers = db.getAll('customers');
    const orderItems = db.getAll('order_items');

    const ordersWithDetails = orders.map(o => {
      const customer = customers.find(c => c.id === o.customer_id);
      const items = orderItems.filter(oi => oi.order_id === o.id);

      return {
        ...o,
        customer_name: customer ? customer.customer_name : null,
        customer_phone: customer ? customer.phone : null,
        items
      };
    });

    // Sort by order_date DESC
    ordersWithDetails.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    res.json(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.getById('orders', id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const customer = db.getById('customers', order.customer_id);
    const items = db.query('order_items', oi => oi.order_id === parseInt(id));

    const orderWithDetails = {
      ...order,
      customer_name: customer ? customer.customer_name : null,
      customer_phone: customer ? customer.phone : null,
      customer_email: customer ? customer.email : null,
      customer_address: customer ? customer.address : null,
      items
    };

    res.json(orderWithDetails);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, notes } = req.body;

    if (!customer_phone) {
      throw new Error('Customer phone is required');
    }

    // 1. Find or Create Customer
    let customerId;
    const existingCustomer = db.query('customers', c => c.phone === customer_phone)[0];

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer details if provided
      db.update('customers', customerId, {
        customer_name: customer_name || existingCustomer.customer_name,
        email: customer_email || existingCustomer.email,
        address: customer_address || existingCustomer.address
      });
    } else {
      const result = db.insert('customers', {
        customer_name,
        phone: customer_phone,
        email: customer_email,
        address: customer_address
      });
      customerId = result.id;
    }

    // 2. Generate order number
    const orderNumber = 'ORD-' + Date.now();

    // 3. Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    // 4. Insert order
    const orderResult = db.insert('orders', {
      order_number: orderNumber,
      customer_id: customerId,
      customer_name,
      total_amount: totalAmount,
      notes
    });

    const orderId = orderResult.id;

    // 5. Insert order items and update product stock
    for (const item of items) {
      db.insert('order_items', {
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      });

      const product = db.getById('products', item.product_id);
      if (product) {
        db.update('products', item.product_id, {
          sold_items: (product.sold_items || 0) + item.quantity
        });
      }
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
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = db.update('orders', id, {
      status,
      notes
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = db.getById('orders', id);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Get order items to restore stock
    const items = db.query('order_items', oi => oi.order_id === parseInt(id));

    // Restore stock
    for (const item of items) {
      const product = db.getById('products', item.product_id);
      if (product) {
        db.update('products', item.product_id, {
          sold_items: (product.sold_items || 0) - item.quantity
        });
      }
    }

    // Delete order items
    const orderItems = db.query('order_items', oi => oi.order_id === parseInt(id));
    for (const item of orderItems) {
      db.deleteRow('order_items', item.id);
    }

    // Delete order
    db.deleteRow('orders', id);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;

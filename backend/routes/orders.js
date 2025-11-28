const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendInvoiceEmail } = require('../services/emailService');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await db.getAll('orders');
    const customers = await db.getAll('customers');
    const orderItems = await db.getAll('order_items');

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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.getById('orders', id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const customer = await db.getById('customers', order.customer_id);
    const items = await db.query('order_items', oi => oi.order_id === parseInt(id));

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
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, notes, payment_method } = req.body;

    if (!customer_phone) {
      throw new Error('Customer phone is required');
    }

    // 1. Find or Create Customer
    let customerId;
    const existingCustomers = await db.query('customers', c => c.phone === customer_phone);
    const existingCustomer = existingCustomers[0];

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer details if provided
      await db.update('customers', customerId, {
        customer_name: customer_name || existingCustomer.customer_name,
        email: customer_email || existingCustomer.email,
        address: customer_address || existingCustomer.address
      });
    } else {
      const result = await db.insert('customers', {
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
    const orderResult = await db.insert('orders', {
      order_number: orderNumber,
      customer_id: customerId,
      customer_name,
      total_amount: totalAmount,
      notes
    });

    const orderId = orderResult.id;

    // 5. Insert order items and update product stock
    for (const item of items) {
      await db.insert('order_items', {
        order_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      });

      const product = await db.getById('products', item.product_id);
      if (product) {
        await db.update('products', item.product_id, {
          sold_items: (product.sold_items || 0) + item.quantity
        });
      }
    }

    // 6. Send email if customer email is provided
    if (customer_email) {
      try {
        const order = await db.getById('orders', orderId);
        const orderItems = await db.query('order_items', oi => oi.order_id === orderId);
        const orderWithItems = {
          ...order,
          customer_name,
          customer_phone,
          customer_email,
          items: orderItems
        };

        await sendInvoiceEmail(orderWithItems, customer_email, payment_method || 'CASH');
        console.log(`Invoice email sent to ${customer_email}`);
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        // Don't fail the order if email fails
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId,
      customerId: customerId,
      emailSent: !!customer_email
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

    const result = await db.update('orders', id, {
      status,
      notes
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await db.getById('orders', id);
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
    const items = await db.query('order_items', oi => oi.order_id === parseInt(id));

    // Restore stock
    for (const item of items) {
      const product = await db.getById('products', item.product_id);
      if (product) {
        await db.update('products', item.product_id, {
          sold_items: (product.sold_items || 0) - item.quantity
        });
      }
    }

    // Delete order items
    const orderItems = await db.query('order_items', oi => oi.order_id === parseInt(id));
    for (const item of orderItems) {
      await db.deleteRow('order_items', item.id);
    }

    // Delete order
    await db.deleteRow('orders', id);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;

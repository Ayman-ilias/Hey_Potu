const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendInvoiceEmail, sendPreorderConfirmationEmail } = require('../services/emailService');

// Get all pre-orders
router.get('/', async (req, res) => {
  try {
    const preorders = await db.getAll('preorders');
    const customers = await db.getAll('customers');
    const preorderItems = await db.getAll('preorder_items');

    const preordersWithDetails = preorders.map(p => {
      const customer = customers.find(c => c.id === p.customer_id);
      const items = preorderItems.filter(pi => parseInt(pi.preorder_id) === parseInt(p.id));

      return {
        ...p,
        customer_name: customer ? customer.customer_name : null,
        customer_phone: customer ? customer.phone : null,
        items
      };
    });

    // Sort by preorder_date DESC
    preordersWithDetails.sort((a, b) => new Date(b.preorder_date) - new Date(a.preorder_date));

    res.json(preordersWithDetails);
  } catch (error) {
    console.error('Error fetching pre-orders:', error);
    res.status(500).json({ error: 'Failed to fetch pre-orders' });
  }
});

// Get single pre-order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const preorder = await db.getById('preorders', id);

    if (!preorder) {
      return res.status(404).json({ error: 'Pre-order not found' });
    }

    const customer = await db.getById('customers', preorder.customer_id);
    const items = await db.query('preorder_items', pi => pi.preorder_id === parseInt(id));

    const preorderWithDetails = {
      ...preorder,
      customer_name: customer ? customer.customer_name : null,
      customer_phone: customer ? customer.phone : null,
      customer_email: customer ? customer.email : null,
      customer_address: customer ? customer.address : null,
      items
    };

    res.json(preorderWithDetails);
  } catch (error) {
    console.error('Error fetching pre-order:', error);
    res.status(500).json({ error: 'Failed to fetch pre-order' });
  }
});

// Create new pre-order
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_address, items, notes } = req.body;

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

    // 2. Generate pre-order number
    const preorderNumber = 'PRE-' + Date.now();

    // 3. Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    // 4. Insert pre-order
    const preorderResult = await db.insert('preorders', {
      preorder_number: preorderNumber,
      customer_id: customerId,
      customer_name,
      total_amount: totalAmount,
      status: 'pending',
      notes
    });

    const preorderId = preorderResult.id;

    // 5. Insert pre-order items (DO NOT update product stock)
    for (const item of items) {
      await db.insert('preorder_items', {
        preorder_id: preorderId,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      });
    }

    // 6. Send pre-order confirmation email if customer email is provided
    if (customer_email) {
      try {
        const preorder = await db.getById('preorders', preorderId);
        const preorderItems = await db.query('preorder_items', pi => pi.preorder_id === preorderId);
        const preorderWithItems = {
          ...preorder,
          customer_name,
          customer_phone,
          customer_email,
          items: preorderItems
        };

        await sendPreorderConfirmationEmail(preorderWithItems, customer_email);
        console.log(`Pre-order confirmation email sent to ${customer_email}`);
      } catch (emailError) {
        console.error('Error sending pre-order confirmation email:', emailError);
        // Don't fail the pre-order if email fails
      }
    }

    res.status(201).json({
      message: 'Pre-order created successfully',
      preorderId: preorderId,
      customerId: customerId,
      emailSent: !!customer_email
    });
  } catch (error) {
    console.error('Error creating pre-order:', error);
    res.status(500).json({ error: error.message || 'Failed to create pre-order' });
  }
});

// Kick to Sell - Convert pre-order to actual order
router.post('/:id/kick-to-sell', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    // 1. Get pre-order details
    const preorder = await db.getById('preorders', id);
    if (!preorder) {
      return res.status(404).json({ error: 'Pre-order not found' });
    }

    const customer = await db.getById('customers', preorder.customer_id);
    const preorderItems = await db.query('preorder_items', pi => pi.preorder_id === parseInt(id));

    // 2. Generate order number
    const orderNumber = 'ORD-' + Date.now();

    // 3. Insert order
    const orderResult = await db.insert('orders', {
      order_number: orderNumber,
      customer_id: preorder.customer_id,
      customer_name: preorder.customer_name,
      total_amount: preorder.total_amount,
      notes: preorder.notes ? `[From Pre-order ${preorder.preorder_number}] ${preorder.notes}` : `From Pre-order ${preorder.preorder_number}`
    });

    const orderId = orderResult.id;

    // 4. Insert order items and update product stock
    for (const item of preorderItems) {
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
        const currentSold = parseInt(product.sold_items) || 0;
        const quantitySold = parseInt(item.quantity) || 0;
        await db.update('products', item.product_id, {
          sold_items: currentSold + quantitySold
        });
        console.log(`Updated product ${item.product_name}: sold_items ${currentSold} + ${quantitySold} = ${currentSold + quantitySold}`);
      }
    }

    // 5. Update pre-order status to 'converted'
    await db.update('preorders', id, {
      status: 'converted',
      converted_order_id: orderId
    });

    // 6. Get the created order for response
    const order = await db.getById('orders', orderId);

    // 7. Send email if customer email is provided
    if (customer && customer.email) {
      try {
        const orderItems = await db.query('order_items', oi => oi.order_id === orderId);
        const orderWithItems = {
          ...order,
          customer_name: customer.customer_name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          items: orderItems
        };

        await sendInvoiceEmail(orderWithItems, customer.email, payment_method || 'CASH');
        console.log(`Invoice email sent to ${customer.email}`);
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        // Don't fail the conversion if email fails
      }
    }

    res.status(200).json({
      message: 'Pre-order converted to order successfully',
      orderId: orderId,
      orderNumber: order.order_number,
      emailSent: !!(customer && customer.email)
    });
  } catch (error) {
    console.error('Error converting pre-order:', error);
    res.status(500).json({ error: error.message || 'Failed to convert pre-order' });
  }
});

// Get invoice PDF for a converted pre-order
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;

    // Get pre-order to find converted order
    const preorder = await db.getById('preorders', id);
    if (!preorder || !preorder.converted_order_id) {
      return res.status(404).json({ error: 'Order not found for this pre-order' });
    }

    // Get order details
    const order = await db.getById('orders', preorder.converted_order_id);
    const customer = await db.getById('customers', order.customer_id);
    const orderItems = await db.query('order_items', oi => oi.order_id === preorder.converted_order_id);

    const orderWithItems = {
      ...order,
      customer_name: customer ? customer.customer_name : order.customer_name,
      customer_phone: customer ? customer.phone : null,
      customer_email: customer ? customer.email : null,
      customer_address: customer ? customer.address : null,
      items: orderItems
    };

    // Generate PDF
    const { generateInvoicePDF } = require('../services/emailService');
    const pdfBuffer = await generateInvoicePDF(orderWithItems, 'CASH');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice_${order.order_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: error.message || 'Failed to generate invoice' });
  }
});

// Delete pre-order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete pre-order items
    const preorderItems = await db.query('preorder_items', pi => pi.preorder_id === parseInt(id));
    for (const item of preorderItems) {
      await db.deleteRow('preorder_items', item.id);
    }

    // Delete pre-order
    await db.deleteRow('preorders', id);

    res.json({ message: 'Pre-order deleted successfully' });
  } catch (error) {
    console.error('Error deleting pre-order:', error);
    res.status(500).json({ error: 'Failed to delete pre-order' });
  }
});

module.exports = router;

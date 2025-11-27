const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all customers
router.get('/', (req, res) => {
    try {
        const customers = db.getAll('customers');
        const orders = db.getAll('orders');

        // Calculate order count for each customer
        const customersWithCount = customers.map(c => ({
            ...c,
            order_count: orders.filter(o => o.customer_id === c.id).length
        }));

        // Sort by created_at DESC
        customersWithCount.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(customersWithCount);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customers with products
router.get('/with-products', (req, res) => {
    try {
        const customers = db.getAll('customers');
        const orders = db.getAll('orders');
        const orderItems = db.getAll('order_items');
        const products = db.getAll('products');

        const customersWithProducts = customers.map(c => {
            // Find all orders for this customer
            const customerOrders = orders.filter(o => o.customer_id === c.id);
            const orderIds = customerOrders.map(o => o.id);

            // Find all order items for these orders
            const items = orderItems.filter(oi => orderIds.includes(oi.order_id));

            // Get unique product names
            const productIds = [...new Set(items.map(oi => oi.product_id))];
            const purchasedProducts = productIds.map(pid => {
                const product = products.find(p => p.id === pid);
                return product ? product.item_name : null;
            }).filter(name => name !== null);

            return {
                ...c,
                purchased_products: purchasedProducts
            };
        });

        // Sort by created_at DESC
        customersWithProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(customersWithProducts);
    } catch (error) {
        console.error('Error fetching customers with products:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get single customer
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const customer = db.getById('customers', id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create customer
router.post('/', (req, res) => {
    try {
        const { customer_name, phone, email, address } = req.body;

        const result = db.insert('customers', {
            customer_name,
            phone,
            email,
            address
        });

        const newCustomer = db.getById('customers', result.id);
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, phone, email, address } = req.body;

        const result = db.update('customers', id, {
            customer_name,
            phone,
            email,
            address
        });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updatedCustomer = db.getById('customers', id);
        res.json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const customer = db.getById('customers', id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        db.deleteRow('customers', id);
        res.json({ message: 'Customer deleted successfully', customer });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;

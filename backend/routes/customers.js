const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all customers
router.get('/', async (req, res) => {
    try {
        // Fetch customers and calculate purchased products manually or via subquery
        // SQLite doesn't support complex JSON aggregation easily, so we'll do a simpler query
        const customers = await db.all(`
            SELECT c.*, 
            (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
            FROM customers c
            ORDER BY c.created_at DESC
        `);
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get customers with products (simplified for SQLite)
router.get('/with-products', async (req, res) => {
    try {
        const customers = await db.all(`
            SELECT c.*, 
                   GROUP_CONCAT(DISTINCT p.item_name) as purchased_products
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        // Transform the string list back to array if needed, or keep as string
        const formattedCustomers = customers.map(c => ({
            ...c,
            purchased_products: c.purchased_products ? c.purchased_products.split(',') : []
        }));

        res.json(formattedCustomers);
    } catch (error) {
        console.error('Error fetching customers with products:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get single customer
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);

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
router.post('/', async (req, res) => {
    try {
        const { customer_name, phone, email, address } = req.body;

        const result = await db.run(`
            INSERT INTO customers (customer_name, phone, email, address)
            VALUES (?, ?, ?, ?)
        `, [customer_name, phone, email, address]);

        const newCustomer = await db.get('SELECT * FROM customers WHERE id = ?', [result.id]);
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, phone, email, address } = req.body;

        const result = await db.run(`
            UPDATE customers 
            SET customer_name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [customer_name, phone, email, address, id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updatedCustomer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
        res.json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        await db.run('DELETE FROM customers WHERE id = ?', [id]);
        res.json({ message: 'Customer deleted successfully', customer });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

module.exports = router;

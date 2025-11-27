const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await db.all(`
            SELECT *, (total_stock - sold_items) as remaining_items 
            FROM products 
            ORDER BY created_at DESC
        `);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product
router.post('/', async (req, res) => {
    try {
        let { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        // Auto-generate serial number if not provided
        if (!serial_no) {
            const timestamp = Date.now();
            const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
            serial_no = `PROD-${timestamp}-${random}`;
        }

        const result = await db.run(`
            INSERT INTO products (serial_no, product_code, item_name, item_category, unit, total_stock, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [serial_no, product_code, item_name, item_category, unit || 'pcs', total_stock || 0, price || 0]);

        const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ error: 'Product code or serial number already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        const result = await db.run(`
            UPDATE products 
            SET serial_no = ?, product_code = ?, item_name = ?, item_category = ?,
                unit = ?, total_stock = ?, price = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [serial_no, product_code, item_name, item_category, unit, total_stock, price, id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await db.run('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully', product });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res) => {
    try {
        const threshold = req.query.threshold || 10;
        const products = await db.all(`
            SELECT *, (total_stock - sold_items) as remaining_items 
            FROM products 
            WHERE (total_stock - sold_items) <= ? AND (total_stock - sold_items) > 0
            ORDER BY remaining_items ASC
        `, [threshold]);

        res.json(products);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
});

module.exports = router;

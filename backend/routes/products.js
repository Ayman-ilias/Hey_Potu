const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all products
router.get('/', (req, res) => {
    try {
        const products = db.getAll('products').map(p => ({
            ...p,
            remaining_items: (p.total_stock || 0) - (p.sold_items || 0)
        }));
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const product = db.getById('products', id);

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
router.post('/', (req, res) => {
    try {
        let { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        // Auto-generate serial number if not provided
        if (!serial_no) {
            const timestamp = Date.now();
            const random = Math.floor(1000 + Math.random() * 9000);
            serial_no = `PROD-${timestamp}-${random}`;
        }

        const result = db.insert('products', {
            serial_no,
            product_code,
            item_name,
            item_category,
            unit: unit || 'pcs',
            total_stock: total_stock || 0,
            sold_items: 0,
            price: price || 0
        });

        const newProduct = db.getById('products', result.id);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { serial_no, product_code, item_name, item_category, unit, total_stock, price } = req.body;

        const result = db.update('products', id, {
            serial_no,
            product_code,
            item_name,
            item_category,
            unit,
            total_stock,
            price
        });

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updatedProduct = db.getById('products', id);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const product = db.getById('products', id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        db.deleteRow('products', id);
        res.json({ message: 'Product deleted successfully', product });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get low stock products
router.get('/alerts/low-stock', (req, res) => {
    try {
        const threshold = req.query.threshold || 10;
        const products = db.query('products', p => {
            const remaining = (p.total_stock || 0) - (p.sold_items || 0);
            return remaining <= threshold && remaining > 0;
        }).map(p => ({
            ...p,
            remaining_items: (p.total_stock || 0) - (p.sold_items || 0)
        }));

        res.json(products);
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
});

module.exports = router;

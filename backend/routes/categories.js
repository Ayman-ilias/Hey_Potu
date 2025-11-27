const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await db.all('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const result = await db.run('INSERT INTO categories (name) VALUES (?)', [name]);
        const newCategory = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ error: 'Category already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create category' });
        }
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category is in use
        const productsUsingCategory = await db.get(
            'SELECT COUNT(*) as count FROM products WHERE item_category = ?',
            [category.name]
        );

        if (productsUsingCategory.count > 0) {
            return res.status(409).json({
                error: `Cannot delete category. ${productsUsingCategory.count} product(s) are using this category.`,
                productsCount: productsUsingCategory.count
            });
        }

        // Delete category
        await db.run('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully', category });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;

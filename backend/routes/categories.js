const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories
router.get('/', (req, res) => {
    try {
        const categories = db.getAll('categories');

        // Sort by name ASC
        categories.sort((a, b) => a.name.localeCompare(b.name));

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create category
router.post('/', (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category already exists
        const existing = db.query('categories', c => c.name === name);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        const result = db.insert('categories', { name });
        const newCategory = db.getById('categories', result.id);

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Delete category
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = db.getById('categories', id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category is in use
        const productsUsingCategory = db.query('products', p => p.item_category === category.name);

        if (productsUsingCategory.length > 0) {
            return res.status(409).json({
                error: `Cannot delete category. ${productsUsingCategory.length} product(s) are using this category.`,
                productsCount: productsUsingCategory.length
            });
        }

        // Delete category
        db.deleteRow('categories', id);
        res.json({ message: 'Category deleted successfully', category });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;

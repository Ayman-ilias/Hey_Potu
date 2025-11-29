require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/preorders', require('./routes/preorders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/categories', require('./routes/categories'));

// Health check
app.get('/health', async (req, res) => {
    try {
        // Simple check to ensure data directory exists
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.resolve(__dirname, './data');

        if (fs.existsSync(dataDir)) {
            res.json({
                status: 'healthy',
                storage: 'csv',
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Data directory not found');
        }
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Hey Potu POS API',
        version: '1.0.0',
        endpoints: {
            products: '/api/products',
            customers: '/api/customers',
            orders: '/api/orders',
            preorders: '/api/preorders',
            reports: '/api/reports',
            categories: '/api/categories'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🎨 Hey Potu POS System - Backend API   ║
  ╠═══════════════════════════════════════════╣
  ║   Server running on port: ${PORT}          ║
  ║   Network: http://192.168.0.199:${PORT}   ║
  ║   Local:   http://localhost:${PORT}       ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

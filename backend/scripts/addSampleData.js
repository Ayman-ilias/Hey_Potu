const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to database
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');
});

// Promisify database run
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// Add sample data
const addSampleData = async () => {
    try {
        console.log('Adding sample data for demo...\n');

        // Sample products
        const products = [
            { code: 'PROD-001', name: 'Wireless Mouse', category: 'Electronics', price: 850, stock: 50 },
            { code: 'PROD-002', name: 'Keyboard', category: 'Electronics', price: 1200, stock: 30 },
            { code: 'PROD-003', name: 'USB Cable', category: 'Accessories', price: 150, stock: 100 },
            { code: 'PROD-004', name: 'Headphones', category: 'Electronics', price: 2500, stock: 25 },
            { code: 'PROD-005', name: 'Monitor Stand', category: 'Accessories', price: 800, stock: 40 }
        ];

        // Add products
        for (const product of products) {
            await run(
                `INSERT INTO products (serial_no, product_code, item_name, item_category, price, total_stock, sold_items, unit)
                 VALUES (?, ?, ?, ?, ?, ?, 0, 'pcs')`,
                [`SN-${product.code}`, product.code, product.name, product.category, product.price, product.stock]
            );
        }
        console.log('✓ Added 5 sample products');

        // Add categories
        const categories = ['Electronics', 'Accessories'];
        for (const category of categories) {
            await run('INSERT INTO categories (name) VALUES (?)', [category]);
        }
        console.log('✓ Added 2 categories');

        // Sample sales data from 18th to 25th Nov 2024 with ups and downs
        const salesData = [
            { date: '2024-11-18 10:00:00', amount: 5000, orders: 3 },  // Start
            { date: '2024-11-19 10:00:00', amount: 7500, orders: 4 },  // Up
            { date: '2024-11-20 10:00:00', amount: 6200, orders: 3 },  // Down slightly
            { date: '2024-11-21 10:00:00', amount: 8500, orders: 5 },  // Up
            { date: '2024-11-22 10:00:00', amount: 6800, orders: 4 },  // Down
            { date: '2024-11-23 10:00:00', amount: 9200, orders: 6 },  // Up
            { date: '2024-11-24 10:00:00', amount: 7500, orders: 4 },  // Down
            { date: '2024-11-25 10:00:00', amount: 10500, orders: 7 }, // Up (highest)
        ];

        let orderCount = 1;
        for (const day of salesData) {
            const ordersForDay = day.orders;
            const avgOrderAmount = day.amount / ordersForDay;

            for (let i = 0; i < ordersForDay; i++) {
                const orderNumber = `ORD-${String(orderCount).padStart(5, '0')}`;
                const orderAmount = avgOrderAmount + (Math.random() * 200 - 100); // Add some variance

                // Create order
                const orderResult = await run(
                    `INSERT INTO orders (order_number, customer_name, order_date, total_amount, status)
                     VALUES (?, ?, ?, ?, 'completed')`,
                    [orderNumber, `Customer ${orderCount}`, day.date, orderAmount]
                );

                // Add 1-3 random items to each order
                const itemCount = Math.floor(Math.random() * 3) + 1;
                let orderTotal = 0;

                for (let j = 0; j < itemCount; j++) {
                    const productIndex = Math.floor(Math.random() * products.length);
                    const product = products[productIndex];
                    const quantity = Math.floor(Math.random() * 3) + 1;
                    const subtotal = product.price * quantity;
                    orderTotal += subtotal;

                    await run(
                        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [orderResult.id, productIndex + 1, product.name, quantity, product.price, subtotal]
                    );
                }

                // Update order total
                await run(
                    'UPDATE orders SET total_amount = ? WHERE id = ?',
                    [orderTotal, orderResult.id]
                );

                orderCount++;
            }
        }

        console.log(`✓ Added ${orderCount - 1} sample orders (18th-25th Nov) with ups and downs`);
        console.log('\n✅ Sample data added successfully!');
        console.log('You can now see the sales trend graph with ups and downs.');

    } catch (error) {
        console.error('\n❌ Error adding sample data:', error.message);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('\nDatabase connection closed.');
            }
            process.exit(0);
        });
    }
};

// Run the operation
addSampleData();

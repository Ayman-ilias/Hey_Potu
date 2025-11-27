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
const run = (sql) => {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
        });
    });
};

// Clear all data
const clearAllData = async () => {
    try {
        console.log('Starting database clear...\n');

        // Delete all data from tables (in correct order due to foreign keys)
        await run('DELETE FROM order_items');
        console.log('✓ Cleared order_items table');

        await run('DELETE FROM orders');
        console.log('✓ Cleared orders table');

        await run('DELETE FROM customers');
        console.log('✓ Cleared customers table');

        await run('DELETE FROM products');
        console.log('✓ Cleared products table');

        await run('DELETE FROM categories');
        console.log('✓ Cleared categories table');

        // Reset autoincrement counters
        await run('DELETE FROM sqlite_sequence');
        console.log('✓ Reset all autoincrement counters');

        console.log('\n✅ Database cleared successfully!');
        console.log('All products, orders, customers, and sales data have been removed.');

    } catch (error) {
        console.error('\n❌ Error clearing database:', error.message);
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

// Run the clear operation
clearAllData();

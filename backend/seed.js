const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const seed = async () => {
    try {
        console.log('Seeding database...');

        // 1. Categories
        console.log('Adding categories...');
        await run("DELETE FROM categories");
        await run("INSERT INTO categories (name) VALUES ('Electronics')");
        await run("INSERT INTO categories (name) VALUES ('Groceries')");
        await run("INSERT INTO categories (name) VALUES ('Clothing')");

        // 2. Products
        console.log('Adding products...');
        await run("DELETE FROM products");
        await run(`INSERT INTO products (serial_no, product_code, item_name, item_category, unit, total_stock, price) VALUES 
            ('SN001', 'P001', 'Smartphone X', 'Electronics', 'pcs', 50, 25000),
            ('SN002', 'P002', 'Wireless Headphones', 'Electronics', 'pcs', 100, 3500),
            ('SN003', 'P003', 'Rice (5kg)', 'Groceries', 'bag', 200, 450),
            ('SN004', 'P004', 'T-Shirt', 'Clothing', 'pcs', 150, 500),
            ('SN005', 'P005', 'Jeans', 'Clothing', 'pcs', 80, 1200)
        `);

        // 3. Customers
        console.log('Adding customers...');
        await run("DELETE FROM customers");
        const c1 = await run("INSERT INTO customers (customer_name, phone, email, address) VALUES ('John Doe', '01711111111', 'john@example.com', 'Dhaka')");
        const c2 = await run("INSERT INTO customers (customer_name, phone, email, address) VALUES ('Jane Smith', '01822222222', 'jane@example.com', 'Chittagong')");

        // 4. Orders
        console.log('Adding orders...');
        await run("DELETE FROM orders");
        await run("DELETE FROM order_items");

        // Order 1
        const o1 = await run(`INSERT INTO orders (order_number, customer_id, customer_name, total_amount, status) VALUES 
            ('ORD-1001', ${c1.id}, 'John Doe', 28500, 'completed')`);
        await run(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES 
            (${o1.id}, 1, 'Smartphone X', 1, 25000, 25000),
            (${o1.id}, 2, 'Wireless Headphones', 1, 3500, 3500)`);

        // Update stock
        await run("UPDATE products SET sold_items = sold_items + 1 WHERE id = 1");
        await run("UPDATE products SET sold_items = sold_items + 1 WHERE id = 2");

        // Order 2
        const o2 = await run(`INSERT INTO orders (order_number, customer_id, customer_name, total_amount, status) VALUES 
            ('ORD-1002', ${c2.id}, 'Jane Smith', 1000, 'completed')`);
        await run(`INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES 
            (${o2.id}, 4, 'T-Shirt', 2, 500, 1000)`);

        // Update stock
        await run("UPDATE products SET sold_items = sold_items + 2 WHERE id = 4");

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        db.close();
    }
};

seed();

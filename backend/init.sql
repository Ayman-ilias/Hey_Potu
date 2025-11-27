-- Hey Potu POS Database Schema
-- Initialize database tables for products, customers, orders

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    serial_no VARCHAR(50) UNIQUE NOT NULL,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'pcs',
    total_stock INTEGER DEFAULT 0,
    sold_items INTEGER DEFAULT 0,
    remaining_items INTEGER GENERATED ALWAYS AS (total_stock - sold_items) STORED,
    price DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(item_category);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Insert sample data
INSERT INTO customers (customer_name, phone, email, address) VALUES
    ('Walk-in Customer', '0000000000', 'walkin@heypotu.com', 'N/A'),
    ('Sample Customer', '0123456789', 'sample@example.com', 'Dhaka, Bangladesh')
ON CONFLICT DO NOTHING;

INSERT INTO products (serial_no, product_code, item_name, item_category, unit, total_stock, sold_items, price) VALUES
    ('SN001', 'HP-TOY-001', 'Colorful Building Blocks', 'Toys', 'set', 50, 5, 599.00),
    ('SN002', 'HP-TOY-002', 'Educational Puzzle Set', 'Toys', 'set', 30, 3, 399.00),
    ('SN003', 'HP-CLO-001', 'Kids T-Shirt (Red)', 'Clothing', 'pcs', 100, 15, 299.00),
    ('SN004', 'HP-CLO-002', 'Kids T-Shirt (Blue)', 'Clothing', 'pcs', 100, 12, 299.00),
    ('SN005', 'HP-ACC-001', 'School Bag', 'Accessories', 'pcs', 40, 8, 799.00)
ON CONFLICT DO NOTHING;

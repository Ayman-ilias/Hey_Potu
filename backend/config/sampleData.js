// Sample data for initial database setup
const sampleData = {
    products: [
        {
            id: 1,
            serial_no: 'PROD-001',
            product_code: 'SKU-001',
            item_name: 'Premium Headphones',
            item_category: 'Electronics',
            unit: 'pcs',
            total_stock: 50,
            sold_items: 15,
            price: 89.99,
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date('2024-01-15').toISOString()
        },
        {
            id: 2,
            serial_no: 'PROD-002',
            product_code: 'SKU-002',
            item_name: 'Wireless Mouse',
            item_category: 'Electronics',
            unit: 'pcs',
            total_stock: 100,
            sold_items: 45,
            price: 29.99,
            created_at: new Date('2024-01-16').toISOString(),
            updated_at: new Date('2024-01-16').toISOString()
        },
        {
            id: 3,
            serial_no: 'PROD-003',
            product_code: 'SKU-003',
            item_name: 'USB-C Cable',
            item_category: 'Accessories',
            unit: 'pcs',
            total_stock: 200,
            sold_items: 120,
            price: 12.99,
            created_at: new Date('2024-01-17').toISOString(),
            updated_at: new Date('2024-01-17').toISOString()
        },
        {
            id: 4,
            serial_no: 'PROD-004',
            product_code: 'SKU-004',
            item_name: 'Laptop Stand',
            item_category: 'Accessories',
            unit: 'pcs',
            total_stock: 30,
            sold_items: 8,
            price: 45.50,
            created_at: new Date('2024-01-18').toISOString(),
            updated_at: new Date('2024-01-18').toISOString()
        },
        {
            id: 5,
            serial_no: 'PROD-005',
            product_code: 'SKU-005',
            item_name: 'Mechanical Keyboard',
            item_category: 'Electronics',
            unit: 'pcs',
            total_stock: 25,
            sold_items: 12,
            price: 129.99,
            created_at: new Date('2024-01-19').toISOString(),
            updated_at: new Date('2024-01-19').toISOString()
        }
    ],

    customers: [
        {
            id: 1,
            customer_name: 'John Doe',
            phone: '555-0101',
            email: 'john.doe@example.com',
            address: '123 Main St, New York, NY 10001',
            created_at: new Date('2024-01-10').toISOString(),
            updated_at: new Date('2024-01-10').toISOString()
        },
        {
            id: 2,
            customer_name: 'Jane Smith',
            phone: '555-0102',
            email: 'jane.smith@example.com',
            address: '456 Oak Ave, Los Angeles, CA 90001',
            created_at: new Date('2024-01-11').toISOString(),
            updated_at: new Date('2024-01-11').toISOString()
        },
        {
            id: 3,
            customer_name: 'Bob Johnson',
            phone: '555-0103',
            email: 'bob.johnson@example.com',
            address: '789 Pine Rd, Chicago, IL 60601',
            created_at: new Date('2024-01-12').toISOString(),
            updated_at: new Date('2024-01-12').toISOString()
        }
    ],

    categories: [
        {
            id: 1,
            name: 'Electronics',
            created_at: new Date('2024-01-01').toISOString()
        },
        {
            id: 2,
            name: 'Accessories',
            created_at: new Date('2024-01-01').toISOString()
        },
        {
            id: 3,
            name: 'Office Supplies',
            created_at: new Date('2024-01-01').toISOString()
        }
    ],

    orders: [
        {
            id: 1,
            order_number: 'ORD-2024-001',
            customer_id: 1,
            customer_name: 'John Doe',
            order_date: new Date('2024-01-20').toISOString(),
            total_amount: 149.98,
            status: 'completed',
            notes: 'First order - electronics bundle',
            created_at: new Date('2024-01-20').toISOString(),
            updated_at: new Date('2024-01-20').toISOString()
        },
        {
            id: 2,
            order_number: 'ORD-2024-002',
            customer_id: 2,
            customer_name: 'Jane Smith',
            order_date: new Date('2024-01-21').toISOString(),
            total_amount: 45.50,
            status: 'completed',
            notes: 'Office setup',
            created_at: new Date('2024-01-21').toISOString(),
            updated_at: new Date('2024-01-21').toISOString()
        },
        {
            id: 3,
            order_number: 'ORD-2024-003',
            customer_id: 3,
            customer_name: 'Bob Johnson',
            order_date: new Date('2024-01-22').toISOString(),
            total_amount: 272.95,
            status: 'completed',
            notes: 'Bulk purchase',
            created_at: new Date('2024-01-22').toISOString(),
            updated_at: new Date('2024-01-22').toISOString()
        }
    ],

    order_items: [
        {
            id: 1,
            order_id: 1,
            product_id: 1,
            product_name: 'Premium Headphones',
            quantity: 1,
            unit_price: 89.99,
            subtotal: 89.99,
            created_at: new Date('2024-01-20').toISOString()
        },
        {
            id: 2,
            order_id: 1,
            product_id: 2,
            product_name: 'Wireless Mouse',
            quantity: 2,
            unit_price: 29.99,
            subtotal: 59.98,
            created_at: new Date('2024-01-20').toISOString()
        },
        {
            id: 3,
            order_id: 2,
            product_id: 4,
            product_name: 'Laptop Stand',
            quantity: 1,
            unit_price: 45.50,
            subtotal: 45.50,
            created_at: new Date('2024-01-21').toISOString()
        },
        {
            id: 4,
            order_id: 3,
            product_id: 5,
            product_name: 'Mechanical Keyboard',
            quantity: 2,
            unit_price: 129.99,
            subtotal: 259.98,
            created_at: new Date('2024-01-22').toISOString()
        },
        {
            id: 5,
            order_id: 3,
            product_id: 3,
            product_name: 'USB-C Cable',
            quantity: 1,
            unit_price: 12.99,
            subtotal: 12.99,
            created_at: new Date('2024-01-22').toISOString()
        }
    ]
};

module.exports = sampleData;

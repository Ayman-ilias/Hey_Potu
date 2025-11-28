const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { format } = require('@fast-csv/format');

const DATA_DIR = path.resolve(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TABLES = {
    products: path.join(DATA_DIR, 'products.csv'),
    customers: path.join(DATA_DIR, 'customers.csv'),
    orders: path.join(DATA_DIR, 'orders.csv'),
    order_items: path.join(DATA_DIR, 'order_items.csv'),
    categories: path.join(DATA_DIR, 'categories.csv')
};

// Initialize CSV files with headers if they don't exist
const initializeFiles = () => {
    const sampleData = require('./sampleData');
    let needsSampleData = false;

    Object.keys(TABLES).forEach(table => {
        if (!fs.existsSync(TABLES[table])) {
            needsSampleData = true;
            // Create file with sample data
            if (sampleData[table] && sampleData[table].length > 0) {
                const stream = format({ headers: true });
                const ws = fs.createWriteStream(TABLES[table]);
                stream.pipe(ws);
                sampleData[table].forEach(row => stream.write(row));
                stream.end();
            } else {
                // Create empty file with headers
                const stream = format({ headers: true });
                const ws = fs.createWriteStream(TABLES[table]);
                stream.pipe(ws);
                stream.end();
            }
        }
    });

    if (needsSampleData) {
        console.log('CSV database initialized with sample data');
    } else {
        console.log('CSV database initialized');
    }
};

// Read all rows from a CSV file
const getAll = (tableName) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const filePath = TABLES[tableName];

        if (!fs.existsSync(filePath)) {
            return resolve([]);
        }

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                // Convert string numbers to actual numbers
                if (data.id) data.id = parseInt(data.id);
                if (data.total_stock) data.total_stock = parseInt(data.total_stock);
                if (data.sold_items) data.sold_items = parseInt(data.sold_items);
                if (data.price) data.price = parseFloat(data.price);
                if (data.quantity) data.quantity = parseInt(data.quantity);
                if (data.unit_price) data.unit_price = parseFloat(data.unit_price);
                if (data.subtotal) data.subtotal = parseFloat(data.subtotal);
                if (data.total_amount) data.total_amount = parseFloat(data.total_amount);
                if (data.customer_id) data.customer_id = parseInt(data.customer_id);
                if (data.product_id) data.product_id = parseInt(data.product_id);
                if (data.order_id) data.order_id = parseInt(data.order_id);

                results.push(data);
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

// Get single row by ID
const getById = async (tableName, id) => {
    const data = await getAll(tableName);
    return data.find(row => row.id == id);
};

// Write all data to CSV
const writeAll = (tableName, data) => {
    return new Promise((resolve, reject) => {
        const filePath = TABLES[tableName];
        const stream = format({ headers: true });
        const ws = fs.createWriteStream(filePath);

        stream.pipe(ws);
        data.forEach(row => stream.write(row));
        stream.end();

        ws.on('finish', resolve);
        ws.on('error', reject);
    });
};

// Insert new row
const insert = async (tableName, data) => {
    const allData = await getAll(tableName);
    const newId = allData.length > 0 ? Math.max(...allData.map(r => r.id || 0)) + 1 : 1;

    const newRow = {
        id: newId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    allData.push(newRow);
    await writeAll(tableName, allData);

    return { id: newId, changes: 1 };
};

// Update existing row
const update = async (tableName, id, updates) => {
    const allData = await getAll(tableName);
    const index = allData.findIndex(row => row.id == id);

    if (index === -1) {
        throw new Error('Record not found');
    }

    allData[index] = {
        ...allData[index],
        ...updates,
        updated_at: new Date().toISOString()
    };

    await writeAll(tableName, allData);
    return { changes: 1 };
};

// Delete row
const deleteRow = async (tableName, id) => {
    const allData = await getAll(tableName);
    const filtered = allData.filter(row => row.id != id);

    await writeAll(tableName, filtered);
    return { changes: 1 };
};

// Custom query support
const query = async (tableName, filterFn) => {
    const allData = await getAll(tableName);
    return allData.filter(filterFn);
};

// Initialize on load
initializeFiles();

module.exports = {
    getAll,
    getById,
    insert,
    update,
    deleteRow,
    query
};

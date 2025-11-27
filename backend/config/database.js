const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../database.xlsx');

// Initialize workbook
let workbook;

// Initialize database with empty sheets
const initializeDatabase = () => {
    if (fs.existsSync(DB_PATH)) {
        workbook = XLSX.readFile(DB_PATH);
    } else {
        workbook = XLSX.utils.book_new();

        // Create empty sheets
        const sheets = ['products', 'customers', 'orders', 'order_items', 'categories'];
        sheets.forEach(sheetName => {
            const ws = XLSX.utils.aoa_to_sheet([[]]);
            XLSX.utils.book_append_sheet(workbook, ws, sheetName);
        });

        saveWorkbook();
    }
    console.log('Connected to Excel database');
};

// Save workbook to file
const saveWorkbook = () => {
    XLSX.writeFile(workbook, DB_PATH);
};

// Get all rows from a sheet
const getAll = (sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return [];

    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
};

// Get single row by ID
const getById = (sheetName, id) => {
    const data = getAll(sheetName);
    return data.find(row => row.id == id);
};

// Insert new row
const insert = (sheetName, data) => {
    const allData = getAll(sheetName);
    const newId = allData.length > 0 ? Math.max(...allData.map(r => r.id || 0)) + 1 : 1;

    const newRow = {
        id: newId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    allData.push(newRow);

    const worksheet = XLSX.utils.json_to_sheet(allData);
    workbook.Sheets[sheetName] = worksheet;
    saveWorkbook();

    return { id: newId, changes: 1 };
};

// Update existing row
const update = (sheetName, id, updates) => {
    const allData = getAll(sheetName);
    const index = allData.findIndex(row => row.id == id);

    if (index === -1) {
        throw new Error('Record not found');
    }

    allData[index] = {
        ...allData[index],
        ...updates,
        updated_at: new Date().toISOString()
    };

    const worksheet = XLSX.utils.json_to_sheet(allData);
    workbook.Sheets[sheetName] = worksheet;
    saveWorkbook();

    return { changes: 1 };
};

// Delete row
const deleteRow = (sheetName, id) => {
    const allData = getAll(sheetName);
    const filtered = allData.filter(row => row.id != id);

    const worksheet = XLSX.utils.json_to_sheet(filtered);
    workbook.Sheets[sheetName] = worksheet;
    saveWorkbook();

    return { changes: 1 };
};

// Custom query support
const query = (sheetName, filterFn) => {
    const allData = getAll(sheetName);
    return allData.filter(filterFn);
};

// Initialize on load
initializeDatabase();

module.exports = {
    getAll,
    getById,
    insert,
    update,
    deleteRow,
    query,
    saveWorkbook
};

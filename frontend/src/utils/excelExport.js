import * as XLSX from 'xlsx';

export const exportToExcel = (data, sheetName = 'Sheet1', filename = 'export.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
};

export const exportProductsToExcel = (products) => {
    const formattedData = products.map(p => ({
        'Serial No': p.serial_no,
        'Product Code': p.product_code,
        'Item Name': p.item_name,
        'Category': p.item_category,
        'Unit': p.unit,
        'Total Stock': p.total_stock,
        'Sold Items': p.sold_items,
        'Remaining': p.remaining_items,
        'Price (BDT )': p.price,
    }));

    exportToExcel(formattedData, 'Products', 'products-inventory.xlsx');
};

export const exportOrdersToExcel = (orders) => {
    const formattedData = orders.map(o => ({
        'Order Number': o.order_number,
        'Customer': o.customer_name,
        'Date': new Date(o.order_date).toLocaleDateString(),
        'Total Amount (BDT )': o.total_amount,
        'Status': o.status,
        'Notes': o.notes || '',
    }));

    exportToExcel(formattedData, 'Orders', 'orders-report.xlsx');
};

export const exportCustomersToExcel = (customers) => {
    const formattedData = customers.map(c => ({
        'Customer Name': c.customer_name,
        'Phone': c.phone,
        'Email': c.email,
        'Address': c.address,
        'Total Orders': c.total_orders || 0,
        'Total Spent (BDT )': c.total_spent || 0,
    }));

    exportToExcel(formattedData, 'Customers', 'customers-report.xlsx');
};

export const exportInventoryReportToExcel = (data) => {
    const workbook = XLSX.utils.book_new();

    // Products sheet
    const productsSheet = XLSX.utils.json_to_sheet(data.map(p => ({
        'Serial No': p.serial_no,
        'Product Code': p.product_code,
        'Item Name': p.item_name,
        'Category': p.item_category,
        'Unit': p.unit,
        'Total Stock': p.total_stock,
        'Sold': p.sold_items,
        'Remaining': p.remaining_items,
        'Price': p.price,
        'Revenue': p.revenue,
    })));

    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Inventory');

    XLSX.writeFile(workbook, 'inventory-report.xlsx');
};

export const exportSalesReportToExcel = (data) => {
    const workbook = XLSX.utils.book_new();

    // Orders sheet
    const ordersData = data.orders.map(o => ({
        'Order #': o.order_number,
        'Date': new Date(o.order_date).toLocaleDateString(),
        'Customer': o.customer_name,
        'Phone': o.phone,
        'Amount': o.total_amount,
        'Status': o.status,
    }));

    const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([{
        'Total Orders': data.summary.totalOrders,
        'Total Sales (BDT )': data.summary.totalSales,
        'Average Order Value (BDT )': data.summary.averageOrderValue,
    }]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    XLSX.writeFile(workbook, 'sales-report.xlsx');
};

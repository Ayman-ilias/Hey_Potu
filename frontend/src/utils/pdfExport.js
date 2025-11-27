import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (title, data, columns, filename = 'report.pdf') => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(124, 179, 66); // Green from logo
    doc.text(title, 14, 20);

    // Add subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // Add table
    doc.autoTable({
        startY: 35,
        head: [columns.map(col => col.label)],
        body: data.map(row => columns.map(col => row[col.key] || '')),
        theme: 'grid',
        headStyles: {
            fillColor: [124, 179, 66], // Green
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
        },
        bodyStyles: {
            fontSize: 9,
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
    });

    // Save
    doc.save(filename);
};

export const exportProductsToPDF = (products) => {
    const columns = [
        { key: 'serial_no', label: 'Serial No' },
        { key: 'product_code', label: 'Code' },
        { key: 'item_name', label: 'Item Name' },
        { key: 'item_category', label: 'Category' },
        { key: 'total_stock', label: 'Total Stock' },
        { key: 'sold_items', label: 'Sold' },
        { key: 'remaining_items', label: 'Remaining' },
        { key: 'price', label: 'Price' },
    ];

    exportToPDF('Products Inventory Report', products, columns, 'products-report.pdf');
};

export const exportOrdersToPDF = (orders) => {
    const columns = [
        { key: 'order_number', label: 'Order #' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'order_date', label: 'Date' },
        { key: 'total_amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
    ];

    const formattedOrders = orders.map(order => ({
        ...order,
        order_date: new Date(order.order_date).toLocaleDateString(),
        total_amount: `BDT ${order.total_amount}`,
    }));

    exportToPDF('Orders Report', formattedOrders, columns, 'orders-report.pdf');
};

export const exportCustomersToPDF = (customers) => {
    const columns = [
        { key: 'customer_name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'total_orders', label: 'Orders' },
        { key: 'total_spent', label: 'Total Spent' },
    ];

    const formattedCustomers = customers.map(customer => ({
        ...customer,
        total_spent: `BDT ${customer.total_spent}`,
    }));

    exportToPDF('Customers Report', formattedCustomers, columns, 'customers-report.pdf');
};

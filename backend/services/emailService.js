const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'heypotu@gmail.com',
            pass: process.env.EMAIL_APP_PASSWORD // This is the App Password from Google
        }
    });
};

// Generate PDF invoice
const generateInvoicePDF = (order, paymentMethod = 'CASH') => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Dark header background with logo
        doc.rect(50, 40, 250, 100).fill('#3C3C3C');

        // INVOICE text box (white)
        doc.rect(350, 40, 200, 100).fillAndStroke('#FFFFFF', '#3C3C3C');
        doc.fontSize(28).fillColor('#3C3C3C').font('Helvetica-Bold')
           .text('INVOICE', 350, 75, { width: 200, align: 'center' });

        // Invoice details (left side)
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold');
        doc.text('INVOICE #', 50, 170);
        doc.font('Helvetica').text(order.order_number, 130, 170);

        doc.font('Helvetica-Bold').text('ORDER NO', 50, 190);
        doc.font('Helvetica').text(':', 130, 190);

        doc.font('Helvetica-Bold').text('INVOICE DATE', 50, 210);
        doc.font('Helvetica').text(': ' + new Date(order.order_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }), 130, 210);

        // Bill To section (right side)
        doc.font('Helvetica-Bold').text('BILL TO', 350, 170);
        doc.fontSize(12).text(order.customer_name || 'Walk-in Customer', 350, 190);
        if (order.customer_phone) {
            doc.fontSize(10).font('Helvetica').text(order.customer_phone, 350, 210);
        }

        // Items Table
        const tableTop = 260;
        const tableHeaders = ['NO', 'DESCRIPTION', 'PRICE', 'QTY', 'TOTAL'];
        const colWidths = [50, 200, 80, 80, 90];
        const colX = [50, 100, 300, 380, 460];

        // Table header with green background
        doc.rect(50, tableTop, 500, 25).fill('#9AB440');
        doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
            doc.text(header, colX[i], tableTop + 8, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
        });

        // Table rows
        let currentY = tableTop + 25;
        order.items.forEach((item, index) => {
            const rowBg = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
            doc.rect(50, currentY, 500, 25).fill(rowBg);

            doc.fontSize(10).fillColor('#3C3C3C').font('Helvetica');
            doc.text((index + 1).toString(), colX[0], currentY + 8, { width: colWidths[0], align: 'center' });
            doc.text(item.product_name, colX[1], currentY + 8, { width: colWidths[1] });
            doc.text(`$${item.unit_price.toFixed(2)}`, colX[2], currentY + 8, { width: colWidths[2], align: 'right' });
            doc.text(item.quantity.toString(), colX[3], currentY + 8, { width: colWidths[3], align: 'center' });
            doc.text(`$${item.subtotal.toFixed(2)}`, colX[4], currentY + 8, { width: colWidths[4], align: 'right' });

            currentY += 25;
        });

        // Summary section
        const summaryX = 350;
        const summaryY = currentY + 30;
        const taxAmount = order.total_amount * 0.10;
        const totalWithTax = order.total_amount + taxAmount;

        doc.fontSize(10).font('Helvetica');
        doc.text('SUB-TOTAL', summaryX, summaryY);
        doc.text(`$${order.total_amount.toFixed(2)}`, 520, summaryY, { align: 'right' });

        doc.text('VAT (10%)', summaryX, summaryY + 20);
        doc.text(`$${taxAmount.toFixed(2)}`, 520, summaryY + 20, { align: 'right' });

        // Total Due with green background
        doc.rect(summaryX, summaryY + 35, 200, 30).fill('#9AB440');
        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('Total Due', summaryX + 10, summaryY + 45);
        doc.text(`$${totalWithTax.toFixed(2)}`, 520, summaryY + 45, { align: 'right' });

        // Payment Method
        const paymentY = summaryY + 80;
        doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold');
        doc.text('PAYMENT METHOD', 50, paymentY);
        doc.fontSize(14).text(paymentMethod, 80, paymentY + 20);

        // Terms and Conditions
        const termsY = paymentY + 50;
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('TERM AND CONDITIONS', 50, termsY);
        doc.fontSize(8).font('Helvetica').fillColor('#505050');
        doc.text('Please keep your receipt for any future service, warranty, or', 50, termsY + 15);
        doc.text('exchange claims.', 50, termsY + 25);

        // Manager signature
        doc.moveTo(380, termsY + 40).lineTo(520, termsY + 40).stroke();
        doc.fontSize(10).text('Manager', 450, termsY + 45, { align: 'center' });

        // Footer with dark background
        const footerY = 680;
        doc.roundedRect(50, footerY, 500, 80, 5).fill('#3C3C3C');
        doc.fontSize(11).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('THANK YOU FOR YOUR BUSINESS', 50, footerY + 15, { width: 500, align: 'center' });
        doc.fontSize(8).font('Helvetica');
        doc.text('House 26, Road 13, Sector 14,', 50, footerY + 35, { width: 500, align: 'center' });
        doc.text('Uttara, Dhaka - 1230, Bangladesh.', 50, footerY + 45, { width: 500, align: 'center' });
        doc.text('heypotu@gmail.com', 50, footerY + 55, { width: 500, align: 'center' });

        doc.end();
    });
};

// Send invoice email
const sendInvoiceEmail = async (order, customerEmail, paymentMethod = 'CASH') => {
    try {
        if (!customerEmail) {
            throw new Error('Customer email is required');
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(order, paymentMethod);

        // Create transporter
        const transporter = createTransporter();

        // Email content
        const mailOptions = {
            from: `"Hey Potu POS" <${process.env.EMAIL_USER || 'heypotu@gmail.com'}>`,
            to: customerEmail,
            subject: `Invoice #${order.order_number} - Hey Potu POS`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #7CB342 0%, #4FC3F7 100%); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Hey Potu POS</h1>
                        <p style="color: white; margin: 5px 0;">Thank you for your purchase!</p>
                    </div>

                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2 style="color: #333;">Order Confirmation</h2>
                        <p style="color: #666; line-height: 1.6;">
                            Dear ${order.customer_name || 'Customer'},
                        </p>
                        <p style="color: #666; line-height: 1.6;">
                            Thank you for your order! Your invoice is attached to this email.
                        </p>

                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; color: #666;"><strong>Invoice Number:</strong></td>
                                    <td style="padding: 10px; color: #333;">${order.order_number}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; color: #666;"><strong>Order Date:</strong></td>
                                    <td style="padding: 10px; color: #333;">${new Date(order.order_date).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; color: #666;"><strong>Total Amount:</strong></td>
                                    <td style="padding: 10px; color: #7CB342; font-size: 18px; font-weight: bold;">$${(order.total_amount * 1.1).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; color: #666;"><strong>Payment Method:</strong></td>
                                    <td style="padding: 10px; color: #333;">${paymentMethod}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #666; line-height: 1.6;">
                            If you have any questions about your order, please don't hesitate to contact us.
                        </p>

                        <p style="color: #666; line-height: 1.6;">
                            Best regards,<br>
                            <strong>Hey Potu Team</strong>
                        </p>
                    </div>

                    <div style="background: #333; padding: 20px; text-align: center; color: white; font-size: 12px;">
                        <p style="margin: 5px 0;">House 26, Road 13, Sector 14, Uttara, Dhaka - 1230, Bangladesh</p>
                        <p style="margin: 5px 0;">Email: heypotu@gmail.com</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice_${order.order_number}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendInvoiceEmail
};

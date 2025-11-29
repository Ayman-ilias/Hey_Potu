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
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
};

// Format date to GMT+6 (Bangladesh Time)
const formatDateGMT6 = (dateString) => {
    // Create date object - handle various formats
    let date;
    if (!dateString || dateString === 'Invalid Date') {
        date = new Date(); // Use current date if invalid
    } else {
        date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        date = new Date(); // Fallback to current date
    }

    return {
        full: date.toLocaleDateString('en-US', {
            timeZone: 'Asia/Dhaka',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Dhaka',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };
};

// Generate PDF invoice
const generateInvoicePDF = (order, paymentMethod = 'CASH') => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const logoPath = path.join(__dirname, '../../logo.png');
        const dateInfo = formatDateGMT6(order.order_date);

        // ===== HEADER SECTION =====
        // Company Logo (if exists)
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 50, 40, { width: 80 });
            } catch (err) {
                console.log('Logo not loaded, continuing without it');
            }
        }

        // Company Name and Details
        doc.fontSize(24).fillColor('#2C3E50').font('Helvetica-Bold')
           .text('HEY POTU', 150, 50);

        doc.fontSize(10).fillColor('#7F8C8D').font('Helvetica')
           .text('Point of Sale System', 150, 78)
           .text('House 26, Road 13, Sector 14, Uttara', 150, 92)
           .text('Dhaka - 1230, Bangladesh', 150, 106)
           .text('Email: heypotu@gmail.com', 150, 120);

        // INVOICE Title Box (Right Side)
        doc.rect(420, 45, 130, 50).fillAndStroke('#3498DB', '#2980B9');
        doc.fontSize(26).fillColor('#FFFFFF').font('Helvetica-Bold')
           .text('INVOICE', 420, 60, { width: 130, align: 'center' });

        // Horizontal line separator
        doc.moveTo(50, 150).lineTo(550, 150).strokeColor('#E0E0E0').lineWidth(1).stroke();

        // ===== INVOICE INFO SECTION =====
        let yPos = 170;

        // Left Column - Invoice Details
        doc.fontSize(10).fillColor('#34495E').font('Helvetica-Bold');
        doc.text('Invoice Number:', 50, yPos);
        doc.font('Helvetica').fillColor('#2C3E50')
           .text(order.order_number, 150, yPos);

        yPos += 20;
        doc.font('Helvetica-Bold').fillColor('#34495E');
        doc.text('Invoice Date:', 50, yPos);
        doc.font('Helvetica').fillColor('#2C3E50')
           .text(dateInfo.full, 150, yPos);

        yPos += 20;
        doc.font('Helvetica-Bold').fillColor('#34495E');
        doc.text('Invoice Time:', 50, yPos);
        doc.font('Helvetica').fillColor('#2C3E50')
           .text(dateInfo.time + ' (GMT+6)', 150, yPos);

        yPos += 20;
        doc.font('Helvetica-Bold').fillColor('#34495E');
        doc.text('Payment Method:', 50, yPos);
        doc.font('Helvetica').fillColor('#27AE60')
           .text(paymentMethod, 150, yPos);

        // Right Column - Bill To
        yPos = 170;
        doc.fontSize(11).fillColor('#34495E').font('Helvetica-Bold');
        doc.text('BILL TO:', 350, yPos);

        yPos += 20;
        doc.fontSize(12).fillColor('#2C3E50').font('Helvetica-Bold');
        doc.text(order.customer_name || 'Walk-in Customer', 350, yPos);

        if (order.customer_phone) {
            yPos += 18;
            doc.fontSize(10).fillColor('#7F8C8D').font('Helvetica');
            doc.text('Phone: ' + order.customer_phone, 350, yPos);
        }

        if (order.customer_email) {
            yPos += 15;
            doc.fontSize(10).fillColor('#7F8C8D').font('Helvetica');
            doc.text('Email: ' + order.customer_email, 350, yPos);
        }

        if (order.customer_address) {
            yPos += 15;
            doc.fontSize(9).fillColor('#7F8C8D').font('Helvetica');
            doc.text('Address: ' + order.customer_address, 350, yPos, { width: 200 });
        }

        // ===== ITEMS TABLE =====
        const tableTop = 290;

        // Table Header Background
        doc.rect(50, tableTop, 500, 30).fill('#34495E');

        // Table Headers
        doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('SL', 60, tableTop + 10, { width: 30, align: 'center' });
        doc.text('DESCRIPTION', 100, tableTop + 10, { width: 200 });
        doc.text('QTY', 310, tableTop + 10, { width: 50, align: 'center' });
        doc.text('UNIT PRICE', 370, tableTop + 10, { width: 80, align: 'right' });
        doc.text('AMOUNT', 460, tableTop + 10, { width: 80, align: 'right' });

        // Table Rows
        let currentY = tableTop + 30;
        const rowHeight = 28;

        order.items.forEach((item, index) => {
            // Alternating row colors
            const rowBg = index % 2 === 0 ? '#F8F9FA' : '#FFFFFF';
            doc.rect(50, currentY, 500, rowHeight).fill(rowBg);

            // Row content
            doc.fontSize(9).fillColor('#2C3E50').font('Helvetica');

            // Serial Number
            doc.text((index + 1).toString(), 60, currentY + 9, { width: 30, align: 'center' });

            // Product Name
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text(item.product_name, 100, currentY + 9, { width: 200 });

            // Quantity
            doc.font('Helvetica').fontSize(9);
            doc.text(item.quantity.toString(), 310, currentY + 9, { width: 50, align: 'center' });

            // Unit Price
            doc.text(item.unit_price.toFixed(2) + ' BDT', 370, currentY + 9, { width: 80, align: 'right' });

            // Subtotal
            doc.font('Helvetica-Bold');
            doc.text(item.subtotal.toFixed(2) + ' BDT', 460, currentY + 9, { width: 80, align: 'right' });

            currentY += rowHeight;
        });

        // Table bottom border
        doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor('#E0E0E0').lineWidth(1).stroke();

        // ===== TOTALS SECTION =====
        currentY += 20;
        const summaryX = 340;
        const labelWidth = 120;
        const valueWidth = 90;

        // Subtotal
        doc.fontSize(10).fillColor('#34495E').font('Helvetica');
        doc.text('Subtotal:', summaryX, currentY, { width: labelWidth, align: 'right' });
        doc.fillColor('#2C3E50').font('Helvetica-Bold');
        doc.text(order.total_amount.toFixed(2) + ' BDT', summaryX + labelWidth, currentY, { width: valueWidth, align: 'right' });

        currentY += 20;
        // VAT
        const taxAmount = order.total_amount * 0.10;
        doc.fillColor('#34495E').font('Helvetica');
        doc.text('VAT (10%):', summaryX, currentY, { width: labelWidth, align: 'right' });
        doc.fillColor('#2C3E50').font('Helvetica-Bold');
        doc.text(taxAmount.toFixed(2) + ' BDT', summaryX + labelWidth, currentY, { width: valueWidth, align: 'right' });

        currentY += 25;
        // Total with background
        const totalWithTax = order.total_amount + taxAmount;
        doc.rect(summaryX - 10, currentY - 5, 220, 35).fillAndStroke('#27AE60', '#229954');

        doc.fontSize(13).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('TOTAL AMOUNT:', summaryX, currentY + 5, { width: labelWidth, align: 'right' });
        doc.fontSize(16);
        doc.text(totalWithTax.toFixed(2) + ' BDT', summaryX + labelWidth, currentY + 5, { width: valueWidth, align: 'right' });

        // ===== TERMS & NOTES SECTION =====
        currentY += 60;

        // Terms and Conditions Box
        doc.rect(50, currentY, 240, 80).strokeColor('#E0E0E0').lineWidth(1).stroke();
        doc.fontSize(11).fillColor('#34495E').font('Helvetica-Bold');
        doc.text('TERMS & CONDITIONS', 60, currentY + 10);

        doc.fontSize(8).fillColor('#7F8C8D').font('Helvetica');
        doc.text('• Payment is due upon receipt of invoice', 60, currentY + 28, { width: 220 });
        doc.text('• Please keep this invoice for warranty claims', 60, currentY + 40, { width: 220 });
        doc.text('• All sales are final unless otherwise stated', 60, currentY + 52, { width: 220 });

        // Authorized Signature
        doc.rect(310, currentY, 240, 80).strokeColor('#E0E0E0').lineWidth(1).stroke();
        doc.fontSize(11).fillColor('#34495E').font('Helvetica-Bold');
        doc.text('AUTHORIZED SIGNATURE', 320, currentY + 10);

        // Signature line
        doc.moveTo(330, currentY + 55).lineTo(520, currentY + 55).strokeColor('#7F8C8D').lineWidth(1).stroke();
        doc.fontSize(9).fillColor('#7F8C8D').font('Helvetica');
        doc.text('Manager / Authorized Person', 330, currentY + 60, { align: 'center', width: 190 });

        // ===== FOOTER =====
        const footerY = 730;

        // Footer background
        doc.rect(50, footerY, 500, 50).fill('#2C3E50');

        doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold');
        doc.text('THANK YOU FOR YOUR BUSINESS!', 50, footerY + 12, { width: 500, align: 'center' });

        doc.fontSize(8).fillColor('#ECF0F1').font('Helvetica');
        doc.text('For any queries, contact us at heypotu@gmail.com or visit our store', 50, footerY + 32, { width: 500, align: 'center' });

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

        const dateInfo = formatDateGMT6(order.order_date);
        const totalWithTax = (order.total_amount * 1.1).toFixed(2);

        // Email content
        const mailOptions = {
            from: `"Hey Potu POS" <${process.env.EMAIL_USER || 'heypotu@gmail.com'}>`,
            to: customerEmail,
            subject: `Invoice #${order.order_number} - Hey Potu POS`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">HEY POTU</h1>
                                            <p style="color: #ECF0F1; margin: 10px 0 0 0; font-size: 16px;">Invoice Confirmation</p>
                                        </td>
                                    </tr>

                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #2C3E50; margin: 0 0 20px 0; font-size: 24px;">Dear ${order.customer_name || 'Valued Customer'},</h2>

                                            <p style="color: #7F8C8D; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                                                Thank you for your purchase! Your order has been successfully processed. Please find your invoice attached to this email.
                                            </p>

                                            <!-- Invoice Details Card -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; border-radius: 6px; border: 1px solid #E0E0E0; margin-bottom: 25px;">
                                                <tr>
                                                    <td style="padding: 25px;">
                                                        <table width="100%" cellpadding="8" cellspacing="0">
                                                            <tr>
                                                                <td style="color: #7F8C8D; font-size: 14px; font-weight: bold; width: 40%;">Invoice Number:</td>
                                                                <td style="color: #2C3E50; font-size: 14px; font-weight: bold;">${order.order_number}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="color: #7F8C8D; font-size: 14px; padding-top: 8px;">Invoice Date:</td>
                                                                <td style="color: #2C3E50; font-size: 14px; padding-top: 8px;">${dateInfo.full}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="color: #7F8C8D; font-size: 14px; padding-top: 8px;">Invoice Time:</td>
                                                                <td style="color: #2C3E50; font-size: 14px; padding-top: 8px;">${dateInfo.time} (GMT+6)</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="color: #7F8C8D; font-size: 14px; padding-top: 8px;">Payment Method:</td>
                                                                <td style="color: #27AE60; font-size: 14px; font-weight: bold; padding-top: 8px;">${paymentMethod}</td>
                                                            </tr>
                                                            <tr style="border-top: 2px solid #E0E0E0;">
                                                                <td style="color: #7F8C8D; font-size: 16px; font-weight: bold; padding-top: 15px;">Total Amount:</td>
                                                                <td style="color: #27AE60; font-size: 22px; font-weight: bold; padding-top: 15px;">${totalWithTax} BDT</td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #7F8C8D; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                                If you have any questions regarding this invoice or your order, please don't hesitate to contact us.
                                            </p>

                                            <p style="color: #2C3E50; font-size: 15px; margin: 25px 0 0 0;">
                                                Best regards,<br>
                                                <strong style="color: #3498DB;">Hey Potu Team</strong>
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #2C3E50; padding: 25px 30px; text-align: center;">
                                            <p style="color: #ECF0F1; font-size: 14px; margin: 0 0 8px 0; font-weight: bold;">Hey Potu POS System</p>
                                            <p style="color: #95A5A6; font-size: 12px; margin: 0 0 5px 0; line-height: 1.5;">
                                                House 26, Road 13, Sector 14, Uttara<br>
                                                Dhaka - 1230, Bangladesh
                                            </p>
                                            <p style="margin: 10px 0 0 0;">
                                                <a href="mailto:heypotu@gmail.com" style="color: #3498DB; text-decoration: none; font-size: 13px;">heypotu@gmail.com</a>
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
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

// Send pre-order confirmation email
const sendPreorderConfirmationEmail = async (preorder, toEmail) => {
    try {
        const transporter = createTransporter();
        const dateInfo = formatDateGMT6(preorder.created_at || new Date());

        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7CB342 0%, #4FC3F7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
        .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        .items-table th { background: #7CB342; color: white; padding: 12px; text-align: left; }
        .items-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .total { font-size: 20px; font-weight: bold; color: #7CB342; text-align: right; padding: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Pre-Order Confirmation</h1>
            <p style="margin: 0; font-size: 16px;">Thank you for your pre-order!</p>
        </div>
        <div class="content">
            <div class="info-box">
                <p style="margin: 0;"><strong>⚠️ Important:</strong> This is a pre-order confirmation. Your items are reserved but NOT yet charged or shipped. We'll notify you when your order is ready to be processed.</p>
            </div>

            <h2>Pre-Order Details</h2>
            <p><strong>Pre-Order Number:</strong> ${preorder.preorder_number}</p>
            <p><strong>Date:</strong> ${dateInfo.full} at ${dateInfo.time}</p>
            <p><strong>Customer Name:</strong> ${preorder.customer_name}</p>
            <p><strong>Phone:</strong> ${preorder.customer_phone}</p>

            <h3>Pre-Ordered Items:</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${preorder.items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>${parseFloat(item.unit_price).toFixed(2)} BDT</td>
                            <td>${parseFloat(item.subtotal).toFixed(2)} BDT</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total">
                Total Amount: ${parseFloat(preorder.total_amount).toFixed(2)} BDT
            </div>

            <div class="info-box">
                <p style="margin: 0;"><strong>Next Steps:</strong></p>
                <p style="margin: 5px 0 0 0;">• We'll contact you when your pre-order is ready for processing</p>
                <p style="margin: 5px 0 0 0;">• You'll receive a final invoice once the order is confirmed</p>
                <p style="margin: 5px 0 0 0;">• Payment will be collected at that time</p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 0;">Hey Potu POS System</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">📧 ${process.env.EMAIL_USER}</p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `Hey Potu <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Pre-Order Confirmation - ${preorder.preorder_number}`,
            html: emailBody
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Pre-order confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending pre-order confirmation email:', error);
        throw error;
    }
};

module.exports = {
    sendInvoiceEmail,
    sendPreorderConfirmationEmail,
    generateInvoicePDF
};

# Hey Potu POS System

A complete Point of Sale (POS) system built with React and Node.js, featuring inventory management, order processing, pre-orders, and automated email invoicing.

## Features

- **Product Inventory Management** - Track 29 products with stock levels
- **Order Processing** - Create orders with automatic invoice generation
- **Pre-Order System** - Reserve items without inventory deduction, then "Kick to Sell"
- **Customer Management** - Track customer information and purchase history
- **Email Notifications** - Automated invoice emails with PDF attachments
- **Sales Reports** - Dashboard with analytics and trends
- **Category Management** - Organize products by categories

## Tech Stack

**Frontend:**
- React + Vite
- React Router for navigation
- Axios for API calls
- Chart.js for data visualization
- jsPDF for PDF generation

**Backend:**
- Node.js + Express
- CSV-based database (no SQL required)
- Nodemailer for email
- PDFKit for invoice generation

**Deployment:**
- Docker + Docker Compose
- Nginx reverse proxy
- Multi-stage builds for optimization

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

```bash
# Clone repository
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu

# Start with Docker
docker-compose up -d --build

# Access application
# Frontend: http://localhost:1111
# Backend: http://localhost:1122
```

## Product Inventory

29 products from DEV110W to DEV150W-1, including:
- Ladies clothing (denim, tops, dresses)
- Kids clothing (safari dresses, PJs)
- Cardigans and pullovers
- Blankets (small, medium, big)
- Polos for boys and men

## Ports

- **Frontend**: 1111 (Nginx)
- **Backend**: 1122 (Node.js)

## Data Persistence

All data stored in `./backend/data/` as CSV files:
- products.csv
- customers.csv
- orders.csv
- order_items.csv
- preorders.csv
- preorder_items.csv

## Email Configuration

Configured for Gmail SMTP:
- Email: heypotu@gmail.com
- App Password: Already configured in docker-compose.yml

## Repository

https://github.com/Ayman-ilias/Hey_Potu

## Version

1.0.0 - Production Ready

---

**Last Updated**: 2025-11-29

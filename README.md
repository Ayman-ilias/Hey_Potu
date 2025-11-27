# HeyPotu - Inventory Management System

Modern inventory management system for HeyPotu with order tracking, customer management, and analytics.

![HeyPotu Logo](./logo.png)

## 🚀 Quick Start (VM Deployment)

### Prerequisites
- Docker
- Docker Compose
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu
```

2. **Start the application:**
```bash
docker-compose up -d --build
```

3. **Access the application:**
- Frontend: `http://your-vm-ip`
- Backend API: `http://your-vm-ip:3000`

4. **Stop the application:**
```bash
docker-compose down
```

## 📱 Features

### ✅ Product Management
- Add, edit, and delete products
- Track serial numbers and product codes
- Monitor stock levels (total, sold, remaining)
- Low stock alerts (≤10 items)
- Category management
- Export to PDF/Excel

### ✅ Order Management
- Create new orders with multiple items
- Link orders to customers
- Real-time stock updates
- Order history tracking
- Invoice generation
- Export orders to PDF/Excel

### ✅ Customer Management
- Customer database with contact information
- Purchase history tracking
- Customer analytics
- Export to PDF/Excel

### ✅ Reports & Analytics
- **Dashboard** with key metrics:
  - Total products, orders, customers
  - Revenue tracking
  - Low stock alerts
  - Recent orders overview
  - Top selling products

- **Inventory Report**:
  - Complete stock overview
  - Revenue per product
  - Export to Excel

- **Sales Report**:
  - Date range filtering
  - Total sales and order count
  - Average order value
  - Export to Excel

- **Customer Report**:
  - Customer purchase history
  - Total spent per customer
  - Order frequency

## 🎨 Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Deployment**: Docker Compose
- **Export**: jsPDF, xlsx

## 🎯 Color Scheme

- 🟢 Green: `#7CB342` (hey)
- 🟠 Orange: `#FF5722` (potu)
- 🟡 Yellow: `#FFC107` (dash)
- 🔵 Light Blue: `#4FC3F7` (dot)

## 📂 Project Structure

```
Hey_Potu/
├── docker-compose.yml      # Docker orchestration
├── frontend/
│   ├── Dockerfile          # Frontend Docker config
│   ├── nginx.conf          # Nginx configuration
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components (Products, Orders, etc.)
│       └── utils/          # API client & utilities
└── backend/
    ├── Dockerfile          # Backend Docker config
    ├── server.js           # Express server
    └── database.js         # SQLite initialization
```

## 🔧 Configuration

### Ports
- Frontend: Port 80 (HTTP)
- Backend: Port 3000 (API)

### Database
- SQLite database is automatically created on first run
- Data persists in a Docker named volume (`heypotu-data`)
- Database file location inside container: `/app/database.sqlite`

## 🌐 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id/orders` - Get customer orders

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports

## 🛠️ Development

To run locally without Docker:

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

## 🐛 Troubleshooting

**Containers not starting:**
```bash
docker-compose logs
```

**Port conflicts:**
- Change ports in `docker-compose.yml` if 80 or 5001 are in use

**Database issues:**
- Reset database: `docker-compose down -v && docker-compose up -d --build`
- The `-v` flag removes the volume with the database

**Frontend not loading:**
- Clear browser cache
- Check logs: `docker logs heypotu-frontend`

## 📝 Usage Tips

1. **Products**: Always set initial stock when creating products
2. **Orders**: Stock automatically decreases when orders are created
3. **Low Stock**: Products with ≤10 remaining items show warnings
4. **Reports**: Use date filters in sales reports for specific periods
5. **Export**: All major tables can be exported to PDF and Excel

## 📄 License

MIT License

---

**Built with ❤️ for HeyPotu**

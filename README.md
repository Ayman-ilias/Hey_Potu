# Hey Potu POS System

A modern Point of Sale (POS) system built with React, Node.js, and Docker.

## Features

- 📦 **Inventory Management** - Track products, stock, and categories
- 🛒 **Order Management** - Create and manage orders with invoice generation
- 👥 **Customer Management** - Store customer information and history
- 📊 **Sales Analytics** - View sales trends and reports
- 📧 **Email Invoices** - Automatic invoice sending via Gmail
- 💰 **Multiple Payment Methods** - Cash, Card, Mobile, etc.
- 🎨 **Professional Invoices** - PDF generation with brand colors
- 🕒 **GMT+6 Timezone** - Bangladesh time zone support
- 💾 **Data Persistence** - CSV-based data storage

## Quick Start (Ubuntu VM)

### Prerequisites
- Docker
- Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ayman-ilias/Hey_Potu.git
   cd Hey_Potu
   ```

2. **Start the application**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   - Open browser: `http://localhost:1111`
   - Or use VM IP: `http://YOUR_VM_IP:1111`

4. **Default Login**
   - Username: `admin`
   - Password: `admin123`

## Configuration

### Email Setup
Email credentials are pre-configured:
- Email: heypotu@gmail.com
- App Password: xzgd kdap wobs wcwj

### Ports
- Frontend: Port 1111
- Backend API: Port 1122

## Data Persistence

All data stored in `backend/data/`:
- products.csv
- orders.csv
- customers.csv
- categories.csv

**Backup**: Copy the `backend/data/` folder

## Docker Commands

```bash
docker-compose up -d          # Start
docker-compose up -d --build  # Rebuild and start
docker-compose logs -f        # View logs
docker-compose down           # Stop
docker-compose restart        # Restart
```

## License
MIT

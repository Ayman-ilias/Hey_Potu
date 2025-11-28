# VM Deployment Guide

## Quick Deployment on Your VM

### 1. Clone the Repository
```bash
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu
```

### 2. Start the Application
```bash
docker-compose up -d --build
```

### 3. Access the Application
- **Frontend**: `http://your-vm-ip:1111`
- **Backend API**: `http://your-vm-ip:3000`

### 4. Stop the Application
```bash
docker-compose down
```

## Configuration

### Ports Used
- **Frontend**: Port 1111
- **Backend**: Port 3000

### Database
- CSV database is automatically created on first run
- Data stored in `backend/data/` as separate CSV files
  - products.csv, customers.csv, orders.csv, order_items.csv, categories.csv
- Fast startup - no compilation required!
- Can be opened in Excel/LibreOffice or edited with any text editor

## What's Included

✅ Complete inventory management system
✅ Product, Order, and Customer management
✅ Dashboard with analytics
✅ Reports and exports (PDF/Excel)
✅ Production-ready Docker setup
✅ No ngrok or external dependencies needed

## Notes

- The application uses **port 1111** for the frontend
- The backend runs on **port 3000**
- All API calls are proxied through nginx, so you only need to expose port 1111
- CSV database files persist between restarts
- No native compilation - super fast Docker builds (30 seconds!)

## Troubleshooting

**Port 1111 already in use?**
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8080:80"  # Change 1111 to any available port (format: external:internal)
```

**Port 3000 already in use?**
Edit `docker-compose.yml` and `frontend/nginx.conf`:
- In docker-compose.yml: Change all `3000` to your preferred port
- In nginx.conf: Update `proxy_pass http://backend:YOUR_PORT;`

## Monitoring

**View logs:**
```bash
docker-compose logs -f
```

**View specific container logs:**
```bash
docker logs heypotu-frontend
docker logs heypotu-backend
```

**Restart containers:**
```bash
docker-compose restart
```

## Database Management

**Reset database (WARNING: deletes all data):**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Backup database:**
```bash
docker cp heypotu-backend:/app/data ./database-backup-$(date +%Y%m%d)
```

**Restore database:**
```bash
docker cp ./database-backup/data heypotu-backend:/app/
docker-compose restart backend
```

**Edit database directly:**
- Download all CSVs: `docker cp heypotu-backend:/app/data ./data`
- Edit in Excel/LibreOffice/Text Editor
- Upload: `docker cp ./data heypotu-backend:/app/`

---

**Repository**: https://github.com/Ayman-ilias/Hey_Potu.git

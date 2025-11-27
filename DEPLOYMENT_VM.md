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
- SQLite database is automatically created on first run
- Data persists in a Docker named volume (`heypotu-data`)
- Database file location inside container: `/app/database.sqlite`

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
- Database persists between restarts
- SQLite is automatically installed inside the Docker container (no need to install on VM)

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
docker exec heypotu-backend cp /app/database.sqlite /app/database.backup.sqlite
docker cp heypotu-backend:/app/database.backup.sqlite ./database-backup-$(date +%Y%m%d).sqlite
```

**Restore database:**
```bash
docker cp ./database-backup.sqlite heypotu-backend:/app/database.sqlite
docker-compose restart backend
```

---

**Repository**: https://github.com/Ayman-ilias/Hey_Potu.git

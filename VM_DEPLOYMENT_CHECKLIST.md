# VM Deployment Checklist ✅

## Pre-Deployment Verification (Completed)

### Docker Configuration
- ✅ docker-compose.yml validated and working
- ✅ Backend Dockerfile EXPOSE port: 1122
- ✅ Frontend Dockerfile multi-stage build working
- ✅ Environment variables configured (EMAIL credentials)
- ✅ Volume mounts configured for data persistence
- ✅ Restart policy: unless-stopped
- ✅ Network bridge configured

### Application Testing
- ✅ Backend running on port 1122
- ✅ Frontend running on port 1111  
- ✅ API responding correctly (29 products)
- ✅ Frontend serving with HTTP 200
- ✅ All containers healthy and running

### Database
- ✅ Fresh data with 0 transactions
- ✅ 29 real products loaded
- ✅ All sold_items = 0
- ✅ No test/dummy data
- ✅ CSV files properly formatted

### Code Repository
- ✅ All changes committed to GitHub
- ✅ README.md created
- ✅ DEPLOYMENT.md created
- ✅ No uncommitted changes
- ✅ Latest code pushed to main branch

## VM Deployment Steps

### 1. Prepare Ubuntu VM
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Verify
docker --version
docker-compose --version
```

### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu

# Start application
docker-compose up -d --build

# Verify containers
docker-compose ps

# Check logs
docker-compose logs -f
```

### 3. Access Application
- Frontend: http://YOUR_VM_IP:1111
- Backend: http://YOUR_VM_IP:1122

### 4. Verify Functionality
- [ ] Can access frontend UI
- [ ] Can view all 29 products in inventory
- [ ] Can create an order
- [ ] Invoice generates and opens in new tab
- [ ] Email is sent (if email provided)
- [ ] Can create pre-order
- [ ] Kick-to-sell works and deducts inventory
- [ ] Can view order history
- [ ] Dashboard shows correct data

## Post-Deployment (Optional)

### Firewall Setup
```bash
sudo ufw allow 1111/tcp
sudo ufw allow 1122/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Backup Setup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
tar -czf backup-$(date +%Y%m%d-%H%M).tar.gz backend/data/
EOF

chmod +x backup.sh

# Add to crontab for daily backups
# crontab -e
# 0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Containers not starting
```bash
docker-compose logs backend
docker-compose logs frontend
```

### API not responding
```bash
curl http://localhost:1122/health
docker-compose restart backend
```

### Frontend not loading
```bash
curl http://localhost:1111
docker-compose restart frontend
```

### Complete restart
```bash
docker-compose down
docker-compose up -d --build
```

## System Ready ✅

All checks passed! System is production-ready for Ubuntu VM deployment.

---
**Deployment Date**: 2025-11-29
**Version**: 1.0.0

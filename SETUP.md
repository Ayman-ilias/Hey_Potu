# Hey Potu POS - Setup Guide

## Step-by-Step Installation

### Step 1: Ensure Docker Desktop is Running

1. Open Docker Desktop application
2. Wait until Docker is fully started (whale icon in system tray)
3. ** Verify Docker is working:**
   ```bash
   docker --version
   ```

### Step 2: Navigate to Project Directory

```bash
cd d:\hey
```

### Step 3: Build and Start the Application

```bash
docker-compose up --build -d
```

This will:
- Build the PostgreSQL database container
- Build the Node.js backend container
- Build the React frontend container
- Start all services in detached mode

**First build may take 5-10 minutes!**

### Step 4: Wait for Services to Start

Check container status:
```bash
docker-compose ps
```

All three services should show "Up" status.

### Step 5: Check Logs (Optional)

View logs to ensure everything is working:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Local:** http://localhost:1111
- **Network:** http://192.168.0.199:1111

### Step 7: Test from Another Device

From any device on your network:
1. Connect to same WiFi network
2. Open browser
3. Go to: http://192.168.0.199:1111

---

## Managing the Application

### Start

```bash
docker-compose up -d
```

### Stop

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

### Restart

```bash
docker-compose restart
```

### View Logs

```bash
docker-compose logs -f
```

### Rebuild After Code Changes

```bash
docker-compose up --build -d
```

---

## Troubleshooting

### Problem: Docker command not found

**Solution:** Start Docker Desktop application

### Problem: Port already in use

**Solution:** 
```bash
# Stop existing containers
docker-compose down

# Or change port in docker-compose.yml
```

### Problem: Cannot connect from network

**Solutions:**
1. Check Windows Firewall:
   - Open Windows Defender Firewall
   - Allow port 1111 through firewall
   
2. Check router port forwarding settings

3. Verify IP address:
   ```bash
   ipconfig
   ```
   Look for IPv4 Address

### Problem: Database connection error

**Solution:** Wait 15-20 seconds after starting containers for PostgreSQL to fully initialize

### Problem: Frontend shows blank page

**Solutions:**
1. Clear browser cache
2. Check browser console for errors (F12)
3. Verify backend is running:
   ```bash
   curl http://localhost:5000/health
   ```

---

## Firewall Configuration

### Windows 11 Firewall Setup

1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" and enter port `1111` → Next
5. Select "Allow the connection" → Next
6. Check all profiles → Next
7. Name: "Hey Potu POS" → Finish

---

## Router Port Forwarding (For External Access)

1. Access your router admin panel (usually 192.168.0.1 or 192.168.1.1)
2. Find "Port Forwarding" section
3. Add new rule:
   - External Port: 1111
   - Internal IP: 192.168.0.199
   - Internal Port: 1111
   - Protocol: TCP
4. Save and apply

---

## Default Login Info

No login required! The system is ready to use immediately.

**Sample Data Included:**
- 5 sample products
- 2 sample customers

You can delete these and add your own data.

---

## Quick Commands Reference

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Check status
docker-compose ps

# Remove everything (including data)
docker-compose down -v
```

---

## Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify Docker Desktop is running
3. Ensure ports 1111, 5000, 5432 are available
4. Restart Docker Desktop
5. Rebuild: `docker-compose up --build -d`

---

**System Requirements:**
- Windows 11
- Docker Desktop installed
- 4GB RAM minimum
- 10GB free disk space

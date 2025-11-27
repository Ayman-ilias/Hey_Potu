# SQLite Issue Analysis & Solution

## Problem: "Can't add files in VM - No SQLite installed"

### Root Cause

When you run `docker-compose up` on your VM, the backend container was **failing to install SQLite properly**. Here's why:

### Technical Explanation

1. **SQLite3 is a Native Module**
   - The `sqlite3` npm package is written in C++
   - It needs to be **compiled** during `npm install`
   - Compilation requires build tools (python3, make, g++)

2. **Alpine Linux Base Image**
   - We use `node:20-alpine` for a small Docker image
   - Alpine doesn't include build tools by default
   - When `npm install` tried to compile sqlite3, it **failed silently**

3. **What Happened on Your VM**
   ```
   docker-compose up
   └─> Build backend container
       └─> npm install
           └─> Try to install sqlite3
               └─> FAIL: No compiler tools
                   └─> Backend starts but database doesn't work
                       └─> You can't add products/customers/orders
   ```

### The Fix

**Updated [backend/Dockerfile](backend/Dockerfile:4)**:
```dockerfile
FROM node:20-alpine

# Install build dependencies for native modules like sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**What This Does**:
- `apk add` = Alpine's package manager
- `python3` = Required for node-gyp (Node's native build tool)
- `make` = Build automation tool
- `g++` = C++ compiler
- `--no-cache` = Keeps Docker image small

### Why You Don't Need SQLite on Your VM

**Important**: You do **NOT** need to install SQLite on your VM host machine!

Here's why:
1. ✅ SQLite is installed **inside the Docker container**
2. ✅ The container is isolated from your VM
3. ✅ The database file is stored in a Docker volume
4. ✅ Everything runs inside Docker - no host dependencies needed

### How It Works Now

```
Your VM (Ubuntu/Debian/CentOS - doesn't matter)
│
├─> Docker Engine (only requirement)
    │
    ├─> Backend Container
    │   ├─> Node.js 20
    │   ├─> Build tools (python3, make, g++)
    │   ├─> SQLite3 package ✅ Compiled successfully
    │   └─> database.sqlite (in Docker volume)
    │
    └─> Frontend Container
        ├─> Nginx
        └─> React app (built)
```

### What You Need on Your VM

**Only Docker and Docker Compose**:
```bash
# Check if you have them:
docker --version
docker-compose --version

# If not, install:
# Ubuntu/Debian:
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL:
sudo yum install docker docker-compose
sudo systemctl start docker
```

### Deployment Steps

1. **Clone the repository**:
```bash
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu
```

2. **Start the application**:
```bash
docker-compose up -d --build
```

3. **Wait for containers to build** (first time takes 2-3 minutes):
```bash
# Watch the logs:
docker-compose logs -f

# Look for:
# backend  | Connected to the SQLite database.
# backend  | Database schema initialized.
# backend  | Server is running on port 3000
```

4. **Access the application**:
- Open browser: `http://your-vm-ip:1111`
- You should see the HeyPotu dashboard
- Try adding a product to test

### Verification Commands

**Check if containers are running**:
```bash
docker ps
```
You should see:
- `heypotu-frontend` (port 1111:80)
- `heypotu-backend` (port 3000:3000)

**Check backend logs**:
```bash
docker logs heypotu-backend
```
Look for:
- "Connected to the SQLite database."
- "Database schema initialized."

**Check if database exists**:
```bash
docker exec heypotu-backend ls -la /app/database.sqlite
```
Should show the database file with size > 0 bytes

**Test database directly**:
```bash
docker exec heypotu-backend sqlite3 /app/database.sqlite "SELECT name FROM sqlite_master WHERE type='table';"
```
Should show tables: products, customers, orders, order_items, categories

### Troubleshooting

**Problem**: "Can't add products - API errors"

**Solution**:
```bash
# Check backend logs:
docker logs heypotu-backend --tail 50

# Restart containers:
docker-compose restart

# If still failing, rebuild:
docker-compose down
docker-compose up -d --build
```

**Problem**: "Database not persisting"

**Solution**:
```bash
# Check if volume exists:
docker volume ls | grep heypotu

# Should see: heypotu-data

# If missing, recreate:
docker-compose down -v
docker-compose up -d --build
```

### Summary

**Before Fix**:
- ❌ sqlite3 package failed to compile
- ❌ Database didn't work
- ❌ Couldn't add products/orders

**After Fix**:
- ✅ Build tools installed in container
- ✅ sqlite3 compiles successfully
- ✅ Database works perfectly
- ✅ Can add products/orders/customers
- ✅ Data persists in Docker volume
- ✅ **No need to install anything on VM except Docker**

---

**Last Updated**: November 2024
**Status**: ✅ Fixed and deployed to GitHub

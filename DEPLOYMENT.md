# Hey Potu POS System - Deployment Guide for Ubuntu VM

## Prerequisites

1. **Ubuntu Server** (20.04 LTS or later recommended)
2. **Docker** and **Docker Compose** installed
3. **Git** installed
4. **Port Access**: Ensure ports 1111 (frontend) and 1122 (backend) are accessible

## Quick Start Deployment

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/Ayman-ilias/Hey_Potu.git
cd Hey_Potu
```

### 3. Deploy the Application

```bash
# Build and start containers
docker-compose up -d --build

# Check container status
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

### 4. Access the Application

- **Frontend (POS Interface)**: http://YOUR_VM_IP:1111
- **Backend API**: http://YOUR_VM_IP:1122

## Container Management

```bash
# Stop all services
docker-compose down

# Start services
docker-compose up -d

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
```

## Features

✅ Product inventory management
✅ Order processing with invoice generation
✅ Pre-order system with kick-to-sell
✅ Customer management
✅ Email notifications (invoices)
✅ PDF invoice generation
✅ Sales reports and analytics

---
**Version**: 1.0.0

# Hey Potu POS - Ngrok Deployment

## 🌐 Public Access URLs

Your Hey Potu POS system has been successfully deployed with ngrok!

### Frontend (Main Application)
**Public URL:** https://eosinlike-unsagaciously-ephraim.ngrok-free.dev

Access your POS system from anywhere using this URL.

### Backend API
The backend API is accessible at: http://localhost:5000 (local network only)

For this application, the frontend communicates with the backend through the local network, which works perfectly since they're in the same Docker environment.

## 📊 Ngrok Dashboard

To monitor traffic and requests in real-time:
- **Web Interface:** http://localhost:4040

This dashboard shows:
- Active tunnels
- Request/response details
- Traffic metrics
- Connection status

## ⚙️ How to Use

1. **Access the Application:**
   - Open https://eosinlike-unsagaciously-ephraim.ngrok-free.dev in any browser
   - Works from any device (mobile, tablet, desktop)
   - No VPN or network configuration needed

2. **Share with Others:**
   - Simply share the public URL with team members or customers
   - They can access the POS system from anywhere

## 🔧 Technical Details

### Current Setup
- **Frontend Port:** 1111 (exposed via ngrok)
- **Backend Port:** 5000 (local only)
- **Ngrok Region:** India (in)
- **Ngrok Plan:** Free

### Service Status

Check if services are running:
```powershell
# Check Docker containers
docker-compose ps

# Check ngrok tunnels
Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
```

## 🛑 Stopping the Deployment

To stop ngrok tunnels:
1. Close the PowerShell windows running ngrok
2. Or run: `taskkill /F /IM ngrok.exe`

To stop the application:
```powershell
docker-compose down
```

## 🔄 Redeploying

To redeploy after stopping:
```powershell
# Start Docker containers
docker-compose up -d

# Start ngrok tunnel (frontend)
ngrok http 1111
```

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - URL changes each time ngrok restarts
   - Session expires after 2 hours of inactivity (may vary)
   - Limited connections per minute

2. **Security:**
   - Anyone with the URL can access your POS system
   - Consider adding authentication for production use
   - Monitor the ngrok dashboard for unexpected traffic

3. **Performance:**
   - First request may be slow due to ngrok's interstitial page (free tier)
   - Subsequent requests are faster
   - Best for testing and demo purposes

## 📱 Access from Mobile

Simply scan this QR code or open the URL:
- URL: https://eosinlike-unsagaciously-ephraim.ngrok-free.dev

## 🎯 Next Steps

For production deployment, consider:
- Upgrading to ngrok paid plan for:
  - Custom domain
  - No session limits
  - No interstitial page
  - Better performance
- Or deploying to a cloud platform (AWS, DigitalOcean, Heroku, etc.)
- Or configuring proper port forwarding on your router

---

**Deployment Date:** 2025-11-26  
**Auth Token:** Configured ✓  
**Status:** Active 🟢

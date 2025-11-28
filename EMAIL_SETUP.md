# Email Setup Guide for Hey Potu POS

This guide will help you set up email functionality so that customers automatically receive invoice PDFs when they place an order.

## 🎯 What This Does

When a customer provides their email address during checkout, they will automatically receive:
- A professional email with order details
- Invoice PDF attachment matching your exact template design
- Order confirmation with payment method

## 📧 Gmail App Password Setup

Since you're using Gmail (heypotu@gmail.com), you need to create an **App Password** (NOT your regular Gmail password).

### Step-by-Step Instructions:

### 1. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification" section
   - Click "Get Started" and follow the steps
   - This is REQUIRED before you can create App Passwords

### 2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

   **If you see "App passwords" option:**
   - Click on "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Type: "Hey Potu POS"
   - Click **Generate**
   - You'll see a 16-character password like: `abcd efgh ijkl mnop`

   **If you DON'T see "App passwords" option:**
   - Make sure 2-Step Verification is ON
   - Wait a few minutes and try again
   - Or use the direct link: https://myaccount.google.com/apppasswords

### 3. **Copy the App Password**
   - Copy the 16-character password (without spaces)
   - Example: `abcdefghijklmnop`
   - Keep this safe - you won't be able to see it again!

## 🔧 Configure Your Backend

### 1. **Update your .env file**

Edit `backend/.env` file and add these lines:

```env
# Email Configuration
EMAIL_USER=heypotu@gmail.com
EMAIL_APP_PASSWORD=your-16-character-password-here
```

Replace `your-16-character-password-here` with the App Password you just created.

### Example:
```env
PORT=3000
NODE_ENV=production

# Email Configuration
EMAIL_USER=heypotu@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

### 2. **Rebuild and Restart Docker**

After adding the environment variables:

```bash
docker-compose down
docker-compose up -d --build
```

## ✅ Testing Email Functionality

### 1. **Test with Your Own Email**
   - Go to New Order section
   - Add products to cart
   - Enter customer details INCLUDING a test email (use your own email first)
   - Complete the order
   - Check your email inbox (and spam folder)

### 2. **Check Backend Logs**
   ```bash
   docker logs heypotu-backend
   ```

   Look for messages like:
   - ✅ `Invoice email sent to customer@example.com`
   - ✅ `Email sent successfully: <message-id>`
   - ❌ `Error sending email:` (if there's an issue)

## 🐛 Troubleshooting

### "Invalid login credentials"
- Make sure you're using the **App Password**, NOT your regular Gmail password
- App Password should be 16 characters
- Remove any spaces from the App Password

### "2-Step Verification required"
- You MUST enable 2-Step Verification on your Google account first
- Go to: https://myaccount.google.com/security

### Email not received
- Check spam/junk folder
- Verify EMAIL_USER is correct: `heypotu@gmail.com`
- Check backend logs: `docker logs heypotu-backend`
- Make sure customer email was entered during checkout

### "App passwords" option not visible
- Ensure 2-Step Verification is enabled
- Wait 5-10 minutes after enabling 2-Step Verification
- Try signing out and back into Google Account

## 📱 Alternative: Using Other Email Services

If you want to use a different email service instead of Gmail:

### **Outlook/Hotmail:**
```env
# Use regular password for Outlook
EMAIL_USER=your-email@outlook.com
EMAIL_APP_PASSWORD=your-regular-password
```

Update `backend/services/emailService.js`:
```javascript
service: 'outlook'  // instead of 'gmail'
```

### **Custom SMTP Server:**
Update `backend/services/emailService.js`:
```javascript
host: 'smtp.yourdomain.com',
port: 587,
secure: false,
auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
}
```

## 🎨 Invoice Template

The invoice PDF uses your exact template design:
- Dark header with logo
- Green table header
- Professional layout
- Your business address: House 26, Road 13, Sector 14, Uttara, Dhaka
- Email: heypotu@gmail.com

## 💡 Important Notes

1. **Email is Optional**: If customer doesn't provide email, order still works normally
2. **Email Failure Won't Block Orders**: If email fails, the order is still created
3. **Privacy**: Customer emails are stored in the customers CSV file
4. **App Password Security**: Keep your App Password secure, don't commit it to Git

## 🔒 Security Best Practices

1. Never commit `.env` file to Git (already in .gitignore)
2. Use App Passwords, not regular passwords
3. Rotate App Passwords periodically
4. Delete unused App Passwords from Google Account

## 📞 Need Help?

If you're stuck:
1. Check backend logs: `docker logs heypotu-backend -f`
2. Verify .env file exists and has correct values
3. Ensure Docker containers are running: `docker ps`
4. Test with a simple email first

---

**Your Email Configuration:**
- Email: heypotu@gmail.com
- Service: Gmail
- Feature: Auto-send invoice PDF on order completion

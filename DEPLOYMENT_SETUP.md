# 🚀 COMPLETE DEPLOYMENT SETUP GUIDE

## 📋 YOUR DEPLOYMENT ARCHITECTURE

- **Backend**: Render (Node.js + PostgreSQL)
- **Frontend**: Vercel (Static hosting)
- **Repository**: GitHub
- **Database**: PostgreSQL (Render)

## 🎯 DEPLOYMENT STEPS

### **STEP 1: Deploy Backend to Render**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add complete employee attendance system"
   git push origin main
   ```

2. **Deploy Backend:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Add PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `attendance-db`
   - Plan: Free
   - Copy the connection string

4. **Set Environment Variables:**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `[Your PostgreSQL connection string]`
   - `JWT_SECRET`: `your-super-secret-jwt-key`
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`

5. **Deploy Backend!**

### **STEP 2: Deploy Frontend to Vercel**

1. **Deploy Frontend:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

2. **Set Environment Variables:**
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`

3. **Deploy Frontend!**

### **STEP 3: Connect Frontend to Backend**

1. **Update Backend CORS:**
   - In Render dashboard, update environment variable:
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`

2. **Update Frontend API URL:**
   - In Vercel dashboard, update environment variable:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`

3. **Redeploy both services**

## 🔧 ENVIRONMENT VARIABLES

### **Backend (Render)**
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
```

### **Frontend (Vercel)**
```
VITE_API_URL=https://your-backend-app.onrender.com/api
```

## 📊 DEFAULT USERS (After Backend Deployment)

- **Super Admin**: `admin@company.com` / `password`
- **HR Manager**: `hr@company.com` / `password`
- **Department Manager**: `manager@company.com` / `password`
- **Employee**: `employee@company.com` / `password`

## 🔍 TESTING DEPLOYMENT

### **Backend Health Check:**
```
https://your-backend-app.onrender.com/health
```

### **Frontend Access:**
```
https://your-frontend.vercel.app
```

### **API Endpoints:**
```
https://your-backend-app.onrender.com/api/auth/login
https://your-backend-app.onrender.com/api/employees
https://your-backend-app.onrender.com/api/attendance
https://your-backend-app.onrender.com/api/leave
```

## 🚀 QUICK DEPLOYMENT COMMANDS

### **Backend (Render)**
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy backend to Render"
git push origin main

# 2. Go to Render dashboard
# 3. Create new Web Service
# 4. Connect GitHub repository
# 5. Set Root Directory: backend
# 6. Add PostgreSQL database
# 7. Set environment variables
# 8. Deploy!
```

### **Frontend (Vercel)**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from frontend directory
cd frontend
vercel

# 4. Set environment variable
vercel env add VITE_API_URL
# Enter: https://your-backend-app.onrender.com/api
```

## 🔧 TROUBLESHOOTING

### **Backend Issues:**
- Check Render logs for errors
- Verify database connection
- Ensure all environment variables are set
- Check if Prisma schema is valid

### **Frontend Issues:**
- Check Vercel build logs
- Verify environment variables
- Ensure API URL is correct
- Check if backend is accessible

### **Connection Issues:**
- Verify CORS settings in backend
- Check if API URL is correct
- Ensure both services are deployed
- Test API endpoints directly

## 📱 MOBILE ACCESS

Your deployed application will be accessible on:
- **Desktop**: Full-featured web application
- **Mobile**: Responsive design with touch-friendly interface
- **Tablet**: Optimized for tablet screens

## 🎯 PRODUCTION FEATURES

- **HTTPS**: Both services use HTTPS
- **CDN**: Vercel provides global CDN
- **Auto-scaling**: Render handles backend scaling
- **Database**: PostgreSQL with automatic backups
- **Monitoring**: Built-in monitoring for both services

## 📞 SUPPORT

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints
4. Check service status
5. Contact support if needed

---

**Your complete Employee Attendance System will be live on:**
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend-app.onrender.com`

🚀 **Ready for production use!**

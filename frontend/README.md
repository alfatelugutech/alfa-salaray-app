# 🚀 Employee Attendance System - Frontend

Frontend for the Employee Attendance System built with React, TypeScript, and Vite.

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_API_URL
   # Enter your Render backend URL: https://your-backend-app.onrender.com/api
   ```

### Option 2: GitHub Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add frontend for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variables:**
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`

5. **Deploy!**

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📱 Features

- **Responsive Design** - Works on all devices
- **Mobile-First** - Optimized for mobile use
- **Real-time Updates** - Live data synchronization
- **Authentication** - Secure login system
- **Role-based Access** - Different views for different roles
- **Modern UI** - Clean and intuitive interface

## 🎯 User Roles

### Super Admin
- Full system access
- Manage all employees
- Override attendance
- Approve/reject leaves
- System configuration

### HR Manager
- Manage employees
- View all attendance
- Approve leave requests
- Generate reports

### Department Manager
- Manage team members
- View team attendance
- Approve team leaves

### Employee
- View own attendance
- Request leaves
- Update profile
- Self-service features

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.onrender.com/api` |

## 📱 Mobile Support

- **Progressive Web App** (PWA) ready
- **Touch-friendly** interface
- **Offline capability** (planned)
- **Push notifications** (planned)

## 🚀 Production Deployment

The frontend is optimized for Vercel deployment with:

- **Static site generation** with Vite
- **Environment variable** support
- **Automatic builds** from GitHub
- **CDN distribution** worldwide
- **HTTPS** by default

## 🔗 Backend Integration

Make sure your backend is deployed to Render and update the `VITE_API_URL` environment variable with your Render backend URL.

## 📄 License

This project is licensed under the MIT License.

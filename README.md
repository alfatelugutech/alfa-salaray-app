# 🚀 Employee Attendance System - Backend

Backend API for the Employee Attendance System built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Deploy to Render

### Option 1: Render Blueprint (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add complete error-free backend"
   git push origin main
   ```

2. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository

3. **Render will auto-detect the `render.yaml` file**
4. **Click "Apply" to deploy**

### Option 2: Manual Deployment

1. **Go to Render Dashboard:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service:**
   - **Name**: `employee-attendance-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Add PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `attendance-db`
   - Plan: Free
   - Copy the connection string

4. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `[Your PostgreSQL connection string]`
   - `JWT_SECRET`: `your-super-secret-jwt-key`
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: `https://your-frontend-url.onrender.com`

5. **Deploy!**

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database URL and other variables
   ```

3. **Setup database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (HR only)
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee (HR only)
- `DELETE /api/employees/:id` - Delete employee (HR only)

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/:id` - Get attendance by ID
- `PUT /api/attendance/:id` - Update attendance (HR only)
- `DELETE /api/attendance/:id` - Delete attendance (HR only)

### Leave Requests
- `POST /api/leave/request` - Create leave request
- `GET /api/leave` - Get leave requests
- `GET /api/leave/:id` - Get leave request by ID
- `PUT /api/leave/:id/status` - Approve/reject leave (HR only)
- `PUT /api/leave/:id/cancel` - Cancel leave request
- `DELETE /api/leave/:id` - Delete leave request (HR only)

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | JWT secret key | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `FRONTEND_URL` | Frontend URL | `https://your-app.vercel.app` |

## 📱 Features

- **Authentication** - JWT-based authentication
- **Role-based Access** - Super Admin, HR Manager, Department Manager, Employee
- **Employee Management** - CRUD operations for employees
- **Attendance Tracking** - Mark and track attendance
- **Leave Management** - Request and approve leaves
- **Statistics** - Overview and analytics
- **Security** - Rate limiting, CORS, Helmet
- **Validation** - Joi schema validation

## 🎯 Default Users (After Seeding)

- **Super Admin**: `admin@company.com` / `password`
- **HR Manager**: `hr@company.com` / `password`
- **Department Manager**: `manager@company.com` / `password`
- **Employee**: `employee@company.com` / `password`

## 📄 License

This project is licensed under the MIT License.
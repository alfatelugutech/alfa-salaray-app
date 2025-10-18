# 🚀 Employee Attendance System - Backend

Backend API for the Employee Attendance System built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Deploy to Render

### Option 1: Deploy with Render Blueprint (Recommended)

1. **Fork this repository** to your GitHub account
2. **Go to Render Dashboard** and click "New +"
3. **Select "Blueprint"**
4. **Connect your GitHub repository**
5. **Render will automatically detect the `render.yaml` file**
6. **Click "Apply" to deploy**

### Option 2: Manual Deployment

1. **Go to Render Dashboard** and click "New +"
2. **Select "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `employee-attendance-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables:**
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your-super-secret-jwt-key`
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: `https://your-frontend-url.onrender.com`

6. **Add PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `attendance-db`
   - Plan: Free
   - Copy the connection string

7. **Update Environment Variables:**
   - `DATABASE_URL`: `[Your PostgreSQL connection string]`

8. **Deploy!**

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database:**
   ```bash
   npm run db:setup
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
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Leave Requests
- `POST /api/leave/request` - Create leave request
- `GET /api/leave` - Get leave requests
- `PUT /api/leave/:id/status` - Update leave request status
- `DELETE /api/leave/:id` - Delete leave request

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection protection

## 📱 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

## 🚀 Production Deployment

The backend is optimized for production deployment on Render with:

- **Docker support** with Dockerfile
- **Automatic builds** with npm scripts
- **Database migrations** with Prisma
- **Environment configuration** for production
- **Health check endpoint** at `/health`

## 📝 Default Users (After Seeding)

- **Super Admin**: `admin@company.com` / `password`
- **HR Manager**: `hr@company.com` / `password`
- **Department Manager**: `manager@company.com` / `password`
- **Employee**: `employee@company.com` / `password`

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 📄 License

This project is licensed under the MIT License.

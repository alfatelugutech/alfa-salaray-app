# Employee Management System (EMS)

A complete full-stack application for managing employees and attendance with separate frontend and backend deployments.

## 🚀 Deployment Architecture

- **Frontend**: React app deployed on Vercel
- **Backend**: Node.js API deployed on Render
- **Database**: PostgreSQL (can be hosted on Render, Railway, or any PostgreSQL provider)

## 📁 Project Structure

```
ems-project/
├── frontend/                 # React app (Vercel deployment)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json
│   └── README.md
├── backend/                  # Node.js API (Render deployment)
│   ├── src/
│   ├── package.json
│   ├── render.yaml
│   └── README.md
├── db/
│   └── schema.sql           # Database schema
├── .gitignore
└── README.md
```

## 🛠️ Setup Instructions

### 1. Database Setup
1. Create a PostgreSQL database
2. Run the SQL commands from `db/schema.sql`

### 2. Backend Deployment (Render)
1. Push the `backend/` folder to GitHub
2. Connect to Render and deploy from GitHub
3. Set environment variables in Render:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production

### 3. Frontend Deployment (Vercel)
1. Push the `frontend/` folder to GitHub
2. Connect to Vercel and deploy from GitHub
3. Set environment variable in Vercel:
   - `REACT_APP_API_URL`: Your deployed backend URL (e.g., `https://your-backend.onrender.com/api`)

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your backend URL
npm start
```

## 📋 Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/emsdb
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🌐 Production URLs

After deployment, your URLs will be:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

## ✨ Features

- **Employee Management**: Add, edit, delete, and view employees
- **Attendance Tracking**: Mark daily attendance with time tracking
- **Modern UI**: Responsive design with Tailwind CSS
- **RESTful API**: Complete backend with proper error handling
- **Database Integration**: PostgreSQL with proper relationships

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/employee/:id` - Get attendance by employee
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

## 🚀 Deployment Steps

1. **Create GitHub Repository**
2. **Deploy Backend to Render**:
   - Connect GitHub repo to Render
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables
3. **Deploy Frontend to Vercel**:
   - Connect GitHub repo to Vercel
   - Set build command: `npm run build`
   - Add environment variable `REACT_APP_API_URL`
4. **Update Frontend Environment**:
   - Set `REACT_APP_API_URL` to your Render backend URL

The application is now ready for production deployment with separate frontend and backend services!
# 🚀 Employee Attendance System - Phase 1

A comprehensive employee attendance and leave management system built with modern technologies.

## ✨ Phase 1 Features

### Core Foundation
- ✅ **User Authentication**: Secure login system with JWT tokens
- ✅ **Role Management**: Super Admin, HR Manager, Department Manager, Employee roles
- ✅ **Employee Management**: Add, edit, and manage employee information
- ✅ **Attendance Tracking**: Mark and track employee attendance
- ✅ **Leave Management**: Handle leave requests and approvals
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Real-time Updates**: Live data synchronization

### Technology Stack

#### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT** authentication
- **RESTful API** design
- **Input validation** with Joi
- **Error handling** and logging

#### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Query** for state management
- **React Router** for navigation
- **React Hook Form** for forms
- **Lucide React** for icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employee-attendance-system
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cd backend
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   npm run db:setup
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## 📁 Project Structure

```
employee-attendance-system/
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Main server file
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
└── package.json            # Root package.json
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
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
- `GET /api/employees/stats/overview` - Get employee statistics

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/:id` - Get attendance by ID
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance
- `GET /api/attendance/stats/overview` - Get attendance statistics

### Leave Requests
- `POST /api/leave/request` - Create leave request
- `GET /api/leave` - Get leave requests
- `GET /api/leave/:id` - Get leave request by ID
- `PUT /api/leave/:id/status` - Update leave request status
- `PUT /api/leave/:id/cancel` - Cancel leave request
- `DELETE /api/leave/:id` - Delete leave request
- `GET /api/leave/stats/overview` - Get leave statistics

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

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection protection

## 📱 Mobile Support

- Responsive design
- Touch-friendly interface
- Mobile-optimized navigation
- Progressive Web App (PWA) ready
- Offline capability (planned)

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (AWS, Heroku, etc.)

### Frontend Deployment
1. Build the production bundle
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables

## 🔄 Phase 2 Roadmap

- Advanced attendance features
- Shift management
- Overtime tracking
- Smart notifications
- Mobile app
- Advanced reporting
- Integration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

---

**Employee Attendance System v1.0 - Phase 1** 🚀

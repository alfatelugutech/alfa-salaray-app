# EMS Backend

Employee Management System Backend API built with Node.js, Express, and PostgreSQL.

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/emsdb
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your PostgreSQL database and run the SQL from `../db/schema.sql`

3. Create a `.env` file with your database credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment on Render

1. Connect your GitHub repository to Render
2. Set the following environment variables in Render dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production

3. Deploy using the `render.yaml` configuration

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

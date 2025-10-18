# EMS Frontend

Employee Management System Frontend built with React and Tailwind CSS.

## Environment Variables

Create a `.env` file with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
```

For production, set `REACT_APP_API_URL` to your deployed backend URL.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your backend API URL:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Production Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Set the environment variable `REACT_APP_API_URL` to your deployed backend URL
3. Deploy automatically on push to main branch

## Features

- Employee Management (CRUD operations)
- Attendance Tracking
- Modern UI with Tailwind CSS
- Responsive Design
- Real-time API integration

## Build

To build for production:

```bash
npm run build
```

The build files will be in the `build` directory.

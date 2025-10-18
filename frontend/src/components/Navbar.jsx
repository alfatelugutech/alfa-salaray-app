import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Employee Management System</h1>
          </div>
          <div className="flex space-x-8">
            <Link
              to="/employees"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/employees') || isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Employees
            </Link>
            <Link
              to="/attendance"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/attendance')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Attendance
            </Link>
            <Link
              to="/salary"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/salary')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Salary
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

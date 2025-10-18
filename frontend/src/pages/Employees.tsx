import React from 'react'
import { Users, Plus, Search, Filter } from 'lucide-react'

const Employees: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee information and details</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select className="input">
              <option>All Departments</option>
              <option>HR</option>
              <option>IT</option>
              <option>Finance</option>
            </select>
            <select className="input">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button className="btn btn-outline btn-md">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee List</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first employee</p>
            <button className="btn btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Employees

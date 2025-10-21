import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  try {
    // Create Super Admin user
    const superAdminPassword = await bcrypt.hash('password', 12)
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@company.com' },
      update: {},
      create: {
        email: 'admin@company.com',
        password: superAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })

    // Create HR Manager user
    const hrPassword = await bcrypt.hash('password', 12)
    const hrManager = await prisma.user.upsert({
      where: { email: 'hr@company.com' },
      update: {},
      create: {
        email: 'hr@company.com',
        password: hrPassword,
        firstName: 'HR',
        lastName: 'Manager',
        role: 'HR_MANAGER',
        isActive: true
      }
    })

    // Create Department Manager user
    const managerPassword = await bcrypt.hash('password', 12)
    const deptManager = await prisma.user.upsert({
      where: { email: 'manager@company.com' },
      update: {},
      create: {
        email: 'manager@company.com',
        password: managerPassword,
        firstName: 'Department',
        lastName: 'Manager',
        role: 'DEPARTMENT_MANAGER',
        isActive: true
      }
    })

    // Create Employee user
    const employeePassword = await bcrypt.hash('password', 12)
    const employee = await prisma.user.upsert({
      where: { email: 'employee@company.com' },
      update: {},
      create: {
        email: 'employee@company.com',
        password: employeePassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        isActive: true
      }
    })

    // Create Departments first
    const adminDept = await prisma.department.upsert({
      where: { name: 'Administration' },
      update: {},
      create: {
        name: 'Administration',
        description: 'Administrative department',
        managerId: superAdmin.id,
        isActive: true
      }
    })

    const hrDept = await prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: {
        name: 'Human Resources',
        description: 'Human Resources department',
        managerId: hrManager.id,
        isActive: true
      }
    })

    const itDept = await prisma.department.upsert({
      where: { name: 'IT' },
      update: {},
      create: {
        name: 'IT',
        description: 'Information Technology department',
        managerId: deptManager.id,
        isActive: true
      }
    })

    // Create Employee records
    await prisma.employee.upsert({
      where: { userId: superAdmin.id },
      update: {},
      create: {
        userId: superAdmin.id,
        employeeId: 'EMP001',
        departmentId: adminDept.id,
        position: 'Super Administrator',
        hireDate: new Date('2024-01-01'),
        salary: 100000,
        status: 'ACTIVE',
        workLocation: 'Head Office'
      }
    })

    await prisma.employee.upsert({
      where: { userId: hrManager.id },
      update: {},
      create: {
        userId: hrManager.id,
        employeeId: 'EMP002',
        departmentId: hrDept.id,
        position: 'HR Manager',
        hireDate: new Date('2024-01-15'),
        salary: 75000,
        status: 'ACTIVE',
        workLocation: 'Head Office'
      }
    })

    await prisma.employee.upsert({
      where: { userId: deptManager.id },
      update: {},
      create: {
        userId: deptManager.id,
        employeeId: 'EMP003',
        departmentId: itDept.id,
        position: 'IT Manager',
        hireDate: new Date('2024-02-01'),
        salary: 80000,
        status: 'ACTIVE',
        workLocation: 'Head Office'
      }
    })

    await prisma.employee.upsert({
      where: { userId: employee.id },
      update: {},
      create: {
        userId: employee.id,
        employeeId: 'EMP004',
        departmentId: itDept.id,
        position: 'Software Developer',
        hireDate: new Date('2024-02-15'),
        salary: 60000,
        status: 'ACTIVE',
        workLocation: 'Head Office'
      }
    })

    console.log('✅ Database seeded successfully!')
    console.log('👤 Super Admin: admin@company.com / password')
    console.log('👤 HR Manager: hr@company.com / password')
    console.log('👤 Department Manager: manager@company.com / password')
    console.log('👤 Employee: employee@company.com / password')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
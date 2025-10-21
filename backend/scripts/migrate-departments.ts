import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDepartments() {
  console.log('🔄 Starting department migration...')
  
  try {
    // Check if the old department column exists
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'department'
    ` as any[]

    if (tableInfo.length === 0) {
      console.log('✅ Department column does not exist. Migration not needed.')
      return
    }

    // Get employees with department data using raw query
    const employees = await prisma.$queryRaw`
      SELECT id, department, "userId" 
      FROM employees 
      WHERE department IS NOT NULL
    ` as any[]

    if (employees.length === 0) {
      console.log('✅ No employees with department data found. Migration not needed.')
      return
    }

    console.log(`📊 Found ${employees.length} employees with department data`)

    // Create departments based on existing data
    const departmentMap = new Map<string, string>()
    
    for (const employee of employees) {
      const deptName = employee.department
      if (!departmentMap.has(deptName)) {
        console.log(`🏢 Creating department: ${deptName}`)
        
        // Create department
        const department = await prisma.department.create({
          data: {
            name: deptName,
            description: `${deptName} department`,
            isActive: true
          }
        })
        
        departmentMap.set(deptName, department.id)
        console.log(`✅ Created department ${deptName} with ID: ${department.id}`)
      }
    }

    // Update employees to use departmentId instead of department
    for (const employee of employees) {
      const departmentId = departmentMap.get(employee.department)
      if (departmentId) {
        console.log(`👤 Updating employee ${employee.id} to use department ${employee.department}`)
        
        await prisma.$executeRaw`
          UPDATE employees 
          SET "departmentId" = ${departmentId}
          WHERE id = ${employee.id}
        `
      }
    }

    console.log('✅ Department migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    // Don't throw error if it's just that the column doesn't exist
    if (error.message && error.message.includes('column "department" does not exist')) {
      console.log('✅ Department column already removed. Migration not needed.')
      return
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateDepartments()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })

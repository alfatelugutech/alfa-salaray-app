import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDatabase() {
  console.log('🔧 Fixing database schema issues...')
  
  try {
    // Check if mobileNumber column exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'mobileNumber'
    ` as any[]

    if (columns.length === 0) {
      console.log('📱 Adding mobileNumber column to users table...')
      
      await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN "mobileNumber" TEXT UNIQUE
      `
      
      console.log('✅ mobileNumber column added successfully!')
    } else {
      console.log('✅ mobileNumber column already exists')
    }

    // Check if departmentId column exists in employees table
    const empColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'departmentId'
    ` as any[]

    if (empColumns.length === 0) {
      console.log('🏢 Adding departmentId column to employees table...')
      
      await prisma.$executeRaw`
        ALTER TABLE employees ADD COLUMN "departmentId" TEXT
      `
      
      console.log('✅ departmentId column added successfully!')
    } else {
      console.log('✅ departmentId column already exists')
    }

    // Check if department column still exists and needs to be removed
    const deptColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'department'
    ` as any[]

    if (deptColumns.length > 0) {
      console.log('🗑️ Removing old department column from employees table...')
      
      await prisma.$executeRaw`
        ALTER TABLE employees DROP COLUMN department
      `
      
      console.log('✅ Old department column removed successfully!')
    } else {
      console.log('✅ Old department column already removed')
    }

    console.log('🎉 Database schema fixes completed successfully!')
    
  } catch (error: any) {
    console.error('❌ Database fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run fix
fixDatabase()
  .catch((e) => {
    console.error('❌ Database fix failed:', e)
    process.exit(1)
  })

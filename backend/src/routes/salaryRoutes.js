import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all salary records
router.get('/', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    let sql = `
      SELECT s.*, e.name as employee_name, e.base_salary, e.salary_type
      FROM salary s 
      JOIN employees e ON s.employee_id = e.id
    `;
    const params = [];
    let paramCount = 0;

    if (employee_id) {
      sql += ` WHERE s.employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (month) {
      sql += paramCount > 0 ? ` AND s.month = $${++paramCount}` : ` WHERE s.month = $${++paramCount}`;
      params.push(month);
    }

    if (year) {
      sql += paramCount > 0 ? ` AND s.month LIKE $${++paramCount}` : ` WHERE s.month LIKE $${++paramCount}`;
      params.push(`${year}%`);
    }

    sql += ' ORDER BY s.month DESC, s.employee_id';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get salary records error:', error);
    res.status(500).json({ message: 'Failed to fetch salary records' });
  }
});

// Get salary by employee ID
router.get('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    
    let sql = `
      SELECT s.*, e.name as employee_name, e.base_salary, e.salary_type
      FROM salary s 
      JOIN employees e ON s.employee_id = e.id 
      WHERE s.employee_id = $1
    `;
    const params = [id];

    if (month) {
      sql += ` AND s.month = $2`;
      params.push(month);
    }

    if (year) {
      sql += ` AND s.month LIKE $2`;
      params.push(`${year}%`);
    }

    sql += ' ORDER BY s.month DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employee salary error:', error);
    res.status(500).json({ message: 'Failed to fetch employee salary records' });
  }
});

// Calculate and generate salary for an employee for a specific month
router.post('/calculate/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const monthYear = `${year}-${month.padStart(2, '0')}`;

    // Get employee details
    const employeeResult = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = employeeResult.rows[0];

    // Get attendance records for the month
    const attendanceResult = await query(`
      SELECT * FROM attendance 
      WHERE employee_id = $1 AND date LIKE $2
      ORDER BY date
    `, [employeeId, `${monthYear}%`]);

    const attendanceRecords = attendanceResult.rows;

    // Calculate salary based on attendance
    const salaryCalculation = calculateSalary(employee, attendanceRecords, monthYear);

    // Check if salary record already exists
    const existingSalary = await query(
      'SELECT * FROM salary WHERE employee_id = $1 AND month = $2',
      [employeeId, monthYear]
    );

    let result;
    if (existingSalary.rows.length > 0) {
      // Update existing record
      result = await query(`
        UPDATE salary 
        SET basic_salary = $1, bonus = $2, deductions = $3, overtime_hours = $4, net_salary = $5
        WHERE employee_id = $6 AND month = $7
        RETURNING *
      `, [
        salaryCalculation.basic_salary,
        salaryCalculation.bonus,
        salaryCalculation.deductions,
        salaryCalculation.overtime_hours,
        salaryCalculation.net_salary,
        employeeId,
        monthYear
      ]);
    } else {
      // Create new record
      result = await query(`
        INSERT INTO salary (employee_id, month, basic_salary, bonus, deductions, overtime_hours, net_salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        employeeId,
        monthYear,
        salaryCalculation.basic_salary,
        salaryCalculation.bonus,
        salaryCalculation.deductions,
        salaryCalculation.overtime_hours,
        salaryCalculation.net_salary
      ]);
    }

    res.json({
      salary: result.rows[0],
      calculation: salaryCalculation,
      attendance_summary: {
        total_days: attendanceRecords.length,
        present_days: attendanceRecords.filter(r => r.status === 'present').length,
        absent_days: attendanceRecords.filter(r => r.status === 'absent').length,
        half_days: attendanceRecords.filter(r => r.status === 'halfday').length,
        leave_days: attendanceRecords.filter(r => r.status === 'leave').length
      }
    });
  } catch (error) {
    console.error('Calculate salary error:', error);
    res.status(500).json({ message: 'Failed to calculate salary' });
  }
});

// Generate payroll for all employees for a specific month
router.post('/generate-payroll', async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const monthYear = `${year}-${month.padStart(2, '0')}`;

    // Get all active employees
    const employeesResult = await query('SELECT * FROM employees WHERE status = true');
    const employees = employeesResult.rows;

    const payrollResults = [];

    for (const employee of employees) {
      try {
        // Get attendance records for the month
        const attendanceResult = await query(`
          SELECT * FROM attendance 
          WHERE employee_id = $1 AND date LIKE $2
          ORDER BY date
        `, [employee.id, `${monthYear}%`]);

        const attendanceRecords = attendanceResult.rows;

        // Calculate salary
        const salaryCalculation = calculateSalary(employee, attendanceRecords, monthYear);

        // Check if salary record already exists
        const existingSalary = await query(
          'SELECT * FROM salary WHERE employee_id = $1 AND month = $2',
          [employee.id, monthYear]
        );

        let result;
        if (existingSalary.rows.length > 0) {
          // Update existing record
          result = await query(`
            UPDATE salary 
            SET basic_salary = $1, bonus = $2, deductions = $3, overtime_hours = $4, net_salary = $5
            WHERE employee_id = $6 AND month = $7
            RETURNING *
          `, [
            salaryCalculation.basic_salary,
            salaryCalculation.bonus,
            salaryCalculation.deductions,
            salaryCalculation.overtime_hours,
            salaryCalculation.net_salary,
            employee.id,
            monthYear
          ]);
        } else {
          // Create new record
          result = await query(`
            INSERT INTO salary (employee_id, month, basic_salary, bonus, deductions, overtime_hours, net_salary)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `, [
            employee.id,
            monthYear,
            salaryCalculation.basic_salary,
            salaryCalculation.bonus,
            salaryCalculation.deductions,
            salaryCalculation.overtime_hours,
            salaryCalculation.net_salary
          ]);
        }

        payrollResults.push({
          employee_id: employee.id,
          employee_name: employee.name,
          salary: result.rows[0],
          calculation: salaryCalculation
        });
      } catch (error) {
        console.error(`Error processing employee ${employee.id}:`, error);
        payrollResults.push({
          employee_id: employee.id,
          employee_name: employee.name,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Payroll generated successfully',
      month: monthYear,
      results: payrollResults
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({ message: 'Failed to generate payroll' });
  }
});

// Update salary record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { basic_salary, bonus, deductions, overtime_hours, net_salary, paid_status } = req.body;
    
    const result = await query(`
      UPDATE salary 
      SET basic_salary = $1, bonus = $2, deductions = $3, overtime_hours = $4, net_salary = $5, paid_status = $6
      WHERE id = $7
      RETURNING *
    `, [basic_salary, bonus, deductions, overtime_hours, net_salary, paid_status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Failed to update salary record' });
  }
});

// Mark salary as paid
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_date } = req.body;
    
    const result = await query(`
      UPDATE salary 
      SET paid_status = 'paid', paid_date = $1
      WHERE id = $2
      RETURNING *
    `, [paid_date || new Date().toISOString().split('T')[0], id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark salary as paid error:', error);
    res.status(500).json({ message: 'Failed to mark salary as paid' });
  }
});

// Delete salary record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM salary WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ message: 'Failed to delete salary record' });
  }
});

// Salary calculation function
function calculateSalary(employee, attendanceRecords, monthYear) {
  const baseSalary = parseFloat(employee.base_salary) || 0;
  const salaryType = employee.salary_type || 'monthly';
  
  // Calculate working days in the month
  const year = parseInt(monthYear.split('-')[0]);
  const month = parseInt(monthYear.split('-')[1]);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Count attendance by status
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const halfDays = attendanceRecords.filter(r => r.status === 'halfday').length;
  const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
  const leaveDays = attendanceRecords.filter(r => r.status === 'leave').length;
  
  // Calculate overtime hours
  const overtimeHours = attendanceRecords.reduce((total, record) => {
    if (record.hours_worked && record.hours_worked > 8) {
      return total + (record.hours_worked - 8);
    }
    return total;
  }, 0);
  
  // Calculate basic salary based on attendance
  let basicSalary = 0;
  if (salaryType === 'monthly') {
    // Monthly salary calculation
    const workingDays = presentDays + (halfDays * 0.5);
    const totalWorkingDays = daysInMonth - (absentDays + leaveDays);
    basicSalary = (baseSalary / daysInMonth) * workingDays;
  } else if (salaryType === 'hourly') {
    // Hourly salary calculation
    const totalHours = attendanceRecords.reduce((total, record) => {
      return total + (record.hours_worked || 0);
    }, 0);
    basicSalary = baseSalary * totalHours;
  }
  
  // Calculate overtime pay (1.5x hourly rate)
  const hourlyRate = salaryType === 'hourly' ? baseSalary : (baseSalary / (daysInMonth * 8));
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  
  // Default bonus and deductions (can be customized)
  const bonus = 0; // Can be set based on performance or other criteria
  const deductions = absentDays * (baseSalary / daysInMonth) * 0.1; // 10% deduction for absent days
  
  const netSalary = basicSalary + overtimePay + bonus - deductions;
  
  return {
    basic_salary: Math.round(basicSalary * 100) / 100,
    bonus: Math.round(bonus * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    overtime_hours: Math.round(overtimeHours * 100) / 100,
    overtime_pay: Math.round(overtimePay * 100) / 100,
    net_salary: Math.round(netSalary * 100) / 100,
    attendance_summary: {
      total_days: daysInMonth,
      present_days: presentDays,
      half_days: halfDays,
      absent_days: absentDays,
      leave_days: leaveDays,
      working_days: presentDays + (halfDays * 0.5)
    }
  };
}

export default router;

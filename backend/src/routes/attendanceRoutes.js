import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const { employee_id, date, month } = req.query;
    let sql = `
      SELECT a.*, e.name as employee_name 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id
    `;
    const params = [];
    let paramCount = 0;

    if (employee_id) {
      sql += ` WHERE a.employee_id = $${++paramCount}`;
      params.push(employee_id);
    }

    if (date) {
      sql += paramCount > 0 ? ` AND a.date = $${++paramCount}` : ` WHERE a.date = $${++paramCount}`;
      params.push(date);
    }

    if (month) {
      sql += paramCount > 0 ? ` AND a.date LIKE $${++paramCount}` : ` WHERE a.date LIKE $${++paramCount}`;
      params.push(`${month}%`);
    }

    sql += ' ORDER BY a.date DESC, a.employee_id';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// Get attendance by employee ID
router.get('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query;
    
    let sql = `
      SELECT a.*, e.name as employee_name 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id 
      WHERE a.employee_id = $1
    `;
    const params = [id];

    if (month) {
      sql += ` AND a.date LIKE $2`;
      params.push(`${month}%`);
    }

    sql += ' ORDER BY a.date DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// Mark attendance
router.post('/', async (req, res) => {
  try {
    const { employee_id, date, in_time, out_time, status } = req.body;
    
    // Calculate hours worked if both in_time and out_time are provided
    let hours_worked = null;
    if (in_time && out_time) {
      const inTime = new Date(`2000-01-01 ${in_time}`);
      const outTime = new Date(`2000-01-01 ${out_time}`);
      hours_worked = (outTime - inTime) / (1000 * 60 * 60); // Convert to hours
    }

    const result = await query(`
      INSERT INTO attendance (employee_id, date, in_time, out_time, hours_worked, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (employee_id, date) 
      DO UPDATE SET 
        in_time = EXCLUDED.in_time,
        out_time = EXCLUDED.out_time,
        hours_worked = EXCLUDED.hours_worked,
        status = EXCLUDED.status
      RETURNING *
    `, [employee_id, date, in_time, out_time, hours_worked, status]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

// Update attendance
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { in_time, out_time, status } = req.body;
    
    // Calculate hours worked if both in_time and out_time are provided
    let hours_worked = null;
    if (in_time && out_time) {
      const inTime = new Date(`2000-01-01 ${in_time}`);
      const outTime = new Date(`2000-01-01 ${out_time}`);
      hours_worked = (outTime - inTime) / (1000 * 60 * 60);
    }

    const result = await query(`
      UPDATE attendance 
      SET in_time = $1, out_time = $2, hours_worked = $3, status = $4
      WHERE id = $5
      RETURNING *
    `, [in_time, out_time, hours_worked, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Failed to update attendance' });
  }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM attendance WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Failed to delete attendance record' });
  }
});

export default router;

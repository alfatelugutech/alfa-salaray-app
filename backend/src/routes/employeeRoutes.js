import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.email 
      FROM employees e 
      LEFT JOIN users u ON e.user_id = u.id 
      ORDER BY e.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT e.*, u.email 
      FROM employees e 
      LEFT JOIN users u ON e.user_id = u.id 
      WHERE e.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Failed to fetch employee' });
  }
});

// Create employee
router.post('/', async (req, res) => {
  try {
    const { name, phone, department, designation, join_date, salary_type, base_salary, user_id } = req.body;
    
    const result = await query(`
      INSERT INTO employees (user_id, name, phone, department, designation, join_date, salary_type, base_salary)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [user_id, name, phone, department, designation, join_date, salary_type, base_salary]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Failed to create employee' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, department, designation, join_date, salary_type, base_salary, status } = req.body;
    
    const result = await query(`
      UPDATE employees 
      SET name = $1, phone = $2, department = $3, designation = $4, 
          join_date = $5, salary_type = $6, base_salary = $7, status = $8
      WHERE id = $9
      RETURNING *
    `, [name, phone, department, designation, join_date, salary_type, base_salary, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Failed to update employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
});

export default router;

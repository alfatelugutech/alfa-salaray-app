-- create users table (for future auth)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(20) DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(50),
  designation VARCHAR(50),
  join_date DATE,
  salary_type VARCHAR(20),
  base_salary NUMERIC(10,2),
  status BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id),
  date DATE NOT NULL,
  in_time TIME,
  out_time TIME,
  hours_worked DECIMAL(5,2),
  status VARCHAR(20) CHECK (status IN ('present','absent','leave','halfday')),
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS salary (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id),
  month VARCHAR(7),
  basic_salary NUMERIC(10,2),
  bonus NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  net_salary NUMERIC(10,2),
  paid_status VARCHAR(20) DEFAULT 'pending',
  paid_date DATE
);

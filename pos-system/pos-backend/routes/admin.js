const express = require('express');
const router = express.Router();
const db = require('../db');

// --- USERS CRUD ---
router.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(results);
  });
});

router.post('/users', (req, res) => {
  const { name, email, password, role } = req.body;
  db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      res.json({ message: 'User created successfully' });
    }
  );
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  db.query(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [name, email, role, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update user' });
      res.json({ message: 'User updated successfully' });
    }
  );
});

router.delete('/users/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    res.json({ message: 'User deleted successfully' });
  });
});

// --- CUSTOMERS CRUD ---
router.get('/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch customers' });
    res.json(results);
  });
});

router.post('/customers', (req, res) => {
  const { name, phone, email } = req.body;
  db.query(
    'INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)',
    [name, phone, email],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to add customer' });
      res.json({ message: 'Customer added successfully' });
    }
  );
});

router.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  db.query(
    'UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?',
    [name, phone, email, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update customer' });
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

router.delete('/customers/:id', (req, res) => {
  db.query('DELETE FROM customers WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete customer' });
    res.json({ message: 'Customer deleted successfully' });
  });
});

// --- SALES VIEW ---
router.get('/sales', (req, res) => {
  const sql = `
    SELECT 
      sales.id,
      products.name AS product_name,
      sales.quantity_sold,
      sales.total_price,
      sales.sold_at,
      sales.sale_date,
      users.name AS cashier,
      customers.name AS customer_name
    FROM sales
    JOIN products ON sales.product_id = products.id
    LEFT JOIN users ON sales.sold_at = users.id
    LEFT JOIN customers ON sales.customer_id = customers.id
    ORDER BY sales.sale_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sales data' });
    res.json(results);
  });
});

module.exports = router;

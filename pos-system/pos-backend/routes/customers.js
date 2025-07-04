// pos-backend/routes/customers.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Add a new customer
router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)";
  db.query(sql, [name, email, phone], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "✅ Customer added", id: result.insertId });
  });
});

// GET: All customers
router.get('/', (req, res) => {
  db.query("SELECT * FROM customers", (err, results) => {
    if (err) {
      console.error("Failed to fetch customers:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ customers: results });
  });
});

module.exports = router;

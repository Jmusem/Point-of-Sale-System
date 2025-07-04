const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const initiateStkPush = require('../utils/mpesa'); // assume you have a utility for M-Pesa

// POST: Checkout and return receipt JSON
router.post('/checkout', (req, res) => {
  const { items, customer_id } = req.body;

  if (!Array.isArray(items) || items.length === 0 || !customer_id) {
    return res.status(400).json({ error: "Invalid input" });
  }

  let totalAmount = 0;
  const receiptRows = [];

  db.query("SELECT * FROM customers WHERE id = ?", [customer_id], (err, customerResult) => {
    if (err || customerResult.length === 0) {
      return res.status(400).json({ error: "Customer not found" });
    }

    const customer = customerResult[0];

    const processNextItem = (index) => {
      if (index >= items.length) {
        // ✅ Send receipt to email and initiate STK push
        sendEmailReceipt(customer, receiptRows, totalAmount);
        initiateStkPush(customer.phone, totalAmount);

        return res.json({
          message: "✅ Sale completed.",
          receipt: {
            items: receiptRows,
            total: totalAmount
          }
        });
      }

      const { product_id, quantity_sold } = items[index];

      if (!product_id || !quantity_sold || quantity_sold <= 0) {
        return res.status(400).json({ error: "Invalid item data" });
      }

      db.query("SELECT * FROM products WHERE id = ?", [product_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) {
          return res.status(404).json({ error: `Product ${product_id} not found` });
        }

        const product = results[0];

        if (product.quantity < quantity_sold) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }

        const newQuantity = product.quantity - quantity_sold;
        const totalPrice = product.price * quantity_sold;
        totalAmount += totalPrice;

        receiptRows.push({
          name: product.name,
          quantity: quantity_sold,
          unit_price: product.price,
          total_price: totalPrice
        });

        db.query("UPDATE products SET quantity = ? WHERE id = ?", [newQuantity, product_id], (err) => {
          if (err) return res.status(500).json({ error: "Failed to update inventory" });

          db.query(
            `INSERT INTO sales (product_id, quantity_sold, total_price, sale_date, customer_id)
             VALUES (?, ?, ?, NOW(), ?)`,
            [product_id, quantity_sold, totalPrice, customer_id],
            (err) => {
              if (err) return res.status(500).json({ error: "Failed to record sale" });

              processNextItem(index + 1);
            }
          );
        });
      });
    };

    processNextItem(0);
  });
});

// Function to send email receipt
function sendEmailReceipt(customer, items, total) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ronalkipro18@gmail.com',
      pass: 'dwdb hprw nhbe qhhf'
    }
  });

  const itemList = items.map(item => `- ${item.name} (${item.quantity} x ${item.unit_price}) = Ksh ${item.total_price}`).join('<br>');

  const mailOptions = {
    from: 'musembijoshua40@gmail.com',
    to: customer.email,
    subject: '🧾 Your Purchase Receipt',
    html: `Hello ${customer.name},<br><br>Thank you for shopping with us. Here is your receipt:<br><br>${itemList}<br><br><strong>Total: Ksh ${total}</strong><br><br>Regards,<br>Your Store Team`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error('📧 Email failed:', err);
    else console.log('📧 Email sent:', info.response);
  });
}

// GET: Daily Sales Summary
router.get('/summary/today', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const query = `
    SELECT 
      IFNULL(SUM(total_price), 0) AS total_sales,
      IFNULL(SUM(quantity_sold), 0) AS total_items
    FROM sales
    WHERE DATE(sale_date) = ?
  `;

  db.query(query, [today], (err, results) => {
    if (err) {
      console.error('🔴 SQL ERROR:', err);
      return res.status(500).json({ error: 'Failed to get daily summary' });
    }

    res.json(results[0]);
  });
});

// GET: Sales History
router.get('/history', (req, res) => {
  const query = `
    SELECT 
      sales.id, 
      sales.quantity_sold, 
      sales.total_price, 
      sales.sale_date,
      products.name AS product_name
    FROM sales
    JOIN products ON sales.product_id = products.id
    ORDER BY sales.sale_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching sales history:", err);
      return res.status(500).json({ error: "Failed to fetch sales history" });
    }
    res.json({ sales: results });
  });
});

module.exports = router;

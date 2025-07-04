const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// GET: All products and low stock
router.get('/', (req, res) => {
  const allProductsQuery = "SELECT * FROM products ORDER BY created_at DESC";
  const lowStockQuery = "SELECT * FROM products WHERE quantity <= 5";

  db.query(allProductsQuery, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to fetch products" });

    db.query(lowStockQuery, (err, lowStock) => {
      if (err) return res.status(500).json({ error: "Failed to fetch low stock items" });

      res.json({ products, lowStock });
    });
  });
});

// POST: Add a new product
router.post('/', upload.single('image'), (req, res) => {
  const { name, category, quantity, price, supplier } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !category || !quantity || !price || !supplier) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
    INSERT INTO products (name, category, quantity, price, supplier, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [name, category, quantity, price, supplier, image], (err) => {
    if (err) return res.status(500).json({ error: "Failed to add product" });
    res.status(201).json({ message: "Product added successfully" });
  });
});

// PUT: Update product
router.put('/:id', upload.single('image'), (req, res) => {
  const { name, category, quantity, price, supplier } = req.body;
  const { id } = req.params;
  const image = req.file ? req.file.filename : null;

  const getOldImageQuery = "SELECT image FROM products WHERE id = ?";
  db.query(getOldImageQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to retrieve product" });
    if (results.length === 0) return res.status(404).json({ error: "Product not found" });

    const oldImage = results[0].image;
    let sql = `
      UPDATE products
      SET name = ?, category = ?, quantity = ?, price = ?, supplier = ?
    `;
    const params = [name, category, quantity, price, supplier];

    if (image) {
      sql += `, image = ?`;
      params.push(image);

      // Delete old image file
      if (oldImage) {
        const oldPath = path.join(uploadsDir, oldImage);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error('Failed to delete old image:', err);
          });
        }
      }
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ error: "Failed to update product" });
      res.json({ message: "Product updated successfully" });
    });
  });
});

// DELETE: Remove product and its image
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const getImageQuery = "SELECT image FROM products WHERE id = ?";
  db.query(getImageQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to retrieve product" });
    if (results.length === 0) return res.status(404).json({ error: "Product not found" });

    const image = results[0].image;

    const deleteQuery = "DELETE FROM products WHERE id = ?";
    db.query(deleteQuery, [id], (err) => {
      if (err) return res.status(500).json({ error: "Failed to delete product" });

      if (image) {
        const imagePath = path.join(uploadsDir, image);
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Failed to delete image:', err);
          });
        }
      }

      res.json({ message: "Product deleted successfully" });
    });
  });
});

module.exports = router;

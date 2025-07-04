const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const nodemailer = require('nodemailer');
const router = express.Router();

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ========================== REGISTER ==========================
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) return res.status(400).json({ error: "Email already registered" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: "User registered successfully!" });
        }
      );
    } catch (err) {
      res.status(500).json({ error: "Failed to hash password" });
    }
  });
});

// ========================== LOGIN + SEND OTP ==========================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "Invalid email or password" });

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

      const otp = generateOTP();
      const expiry = new Date(Date.now() + 60 * 1000); // 1 minute from now

      db.query("UPDATE users SET otp = ?, otp_expires = ? WHERE id = ?", [otp, expiry, user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Your OTP Code',
          html: `<h2>Your OTP is: ${otp}</h2><p>This code will expire in 1 minute.</p>`
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error("Error sending OTP email:", err);
            return res.status(500).json({ error: "Failed to send OTP" });
          }

          res.status(200).json({
            message: "OTP sent to your email",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        });
      });

    } catch (err) {
      res.status(500).json({ error: "Login processing failed" });
    }
  });
});

// ========================== VERIFY OTP ==========================
router.post('/verify-otp', (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.status(400).json({ error: "User ID and OTP are required" });

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const now = new Date();

    if (user.otp !== otp || new Date(user.otp_expires) < now) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP and return role
    db.query("UPDATE users SET otp = NULL, otp_expires = NULL WHERE id = ?", [userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      return res.status(200).json({
        message: "OTP verified successfully!",
        role: user.role // 🟢 Frontend uses this for redirection
      });
    });
  });
});

// ========================== RESEND OTP ==========================
router.post('/resend-otp', (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "User ID is required" });

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 60 * 1000); // 1 minute

    db.query("UPDATE users SET otp = ?, otp_expires = ? WHERE id = ?", [otp, expiry, userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Resent OTP Code',
        html: `<h2>Your new OTP is: ${otp}</h2><p>This code will expire in 1 minute.</p>`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Resend OTP error:", err);
          return res.status(500).json({ error: "Failed to resend OTP" });
        }

        res.status(200).json({ message: "A new OTP has been sent to your email." });
      });
    });
  });
});

module.exports = router;

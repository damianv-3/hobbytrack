const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// Sign Up
router.post('/register', async (req, res) => 
{
  try 
  {
    const { username, email, password } = req.body;

    if (!username || !email || !password) 
    {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10); // Hashing

    const [result] = await db.query
    (
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    res.status(201).json({ message: 'User created', userId: result.insertId });
  } 
  catch (err) 
  {
    if (err.code === 'ER_DUP_ENTRY') 
    {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) 
    {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign
    (
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token });
  } 
  catch (err) 
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const verifyToken = require('../middleware/verifyToken');

// Protected test route
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: `Hello, ${req.user.username}! Your token is valid.`, userId: req.user.userId });
});

module.exports = router;
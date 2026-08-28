const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) =>
{
  const { username, email, password } = req.body;

  if (!username || !email || !password)
  {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, passwordHash]
  );

  res.status(201).json({ message: 'User created', userId: result.insertId });
}));

router.post('/login', asyncHandler(async (req, res) =>
{
  const { email, password } = req.body;

  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0)
  {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch)
  {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ message: 'Login successful', token });
}));

module.exports = router;
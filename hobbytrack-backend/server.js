require('dotenv').config();
const express = require('express');
const db = require('./config/db');

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json()); // lets Express parse JSON request bodies

const PORT = process.env.PORT || 5000;
app.use('/auth', authRoutes);
app.listen(PORT, () => 
{
  console.log(`Server running on http://localhost:${PORT}`);
});
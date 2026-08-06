require('dotenv').config();
const express = require('express');
const db = require('./config/db');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const logRoutes = require('./routes/logs');
const mediaRoutes = require('./routes/media');
const externalSearchRoutes = require('./routes/externalSearch');
const clubRoutes = require('./routes/clubs');
const userRoutes = require('./routes/users');
const feedRoutes = require('./routes/feed');

const app = express();
app.use(express.json());
app.use(cors());
app.use('/reviews', reviewRoutes);
app.use('/logs', logRoutes);
app.use('/media', mediaRoutes);
app.use('/search', externalSearchRoutes);
app.use('/clubs', clubRoutes);
app.use('/users', userRoutes);
app.use('/feed', feedRoutes);

app.get('/', (req, res) => {
  res.send('Server Up');
});

const PORT = process.env.PORT || 5000;
app.use('/auth', authRoutes);
app.listen(PORT, () => 
{
  console.log(`Server running on http://localhost:${PORT}`);
});
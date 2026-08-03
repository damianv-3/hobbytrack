const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/', verifyToken, async (req, res) =>
{
  try
  {
    const { mediaId, rating, loggedDate, notes } = req.body;
    const userId = req.user.userId;

    if (!mediaId || !loggedDate)
    {
      return res.status(400).json({ error: 'mediaId and loggedDate are required' });
    }

    const [result] = await db.query(
      'INSERT INTO logs (user_id, media_id, rating, logged_date, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, mediaId, rating || null, loggedDate, notes || null]
    );

    res.status(201).json({ message: 'Log created', logId: result.insertId });
  }
  catch (err)
  {
    if (err.message.includes('CONSTRAINT'))
    {
      return res.status(400).json({ error: 'Rating must be between 0.5 and 5.0, in half-star increments' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/media/:mediaId', async (req, res) =>
{
  try
  {
    const { mediaId } = req.params;

    const [logs] = await db.query(
      `SELECT l.id, l.rating, l.logged_date, l.notes, l.created_at, u.username
       FROM logs l
       JOIN users u ON l.user_id = u.id
       WHERE l.media_id = ?
       ORDER BY l.logged_date DESC`,
      [mediaId]
    );

    res.json({ logs });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) =>
{
  try
  {
    const { userId } = req.params;

    const [logs] = await db.query(
      `SELECT l.id, l.rating, l.logged_date, l.notes, m.title, m.type
       FROM logs l
       JOIN media_items m ON l.media_id = m.id
       WHERE l.user_id = ?
       ORDER BY l.logged_date DESC`,
      [userId]
    );

    res.json({ logs });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/count/:userId/:mediaId', async (req, res) =>
{
  try
  {
    const { userId, mediaId } = req.params;

    const [result] = await db.query(
      'SELECT COUNT(*) AS times_logged FROM logs WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );

    res.json({ timesLogged: result[0].times_logged });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const { rating, loggedDate, notes } = req.body;
    const userId = req.user.userId;

    const [existing] = await db.query('SELECT * FROM logs WHERE id = ?', [id]);

    if (existing.length === 0)
    {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (existing[0].user_id !== userId)
    {
      return res.status(403).json({ error: 'You can only edit your own logs' });
    }

    await db.query(
      'UPDATE logs SET rating = ?, logged_date = ?, notes = ? WHERE id = ?',
      [rating || null, loggedDate, notes || null, id]
    );

    res.json({ message: 'Log updated' });
  }
  catch (err)
  {
    if (err.message.includes('CONSTRAINT'))
    {
      return res.status(400).json({ error: 'Rating must be between 0.5 and 5.0, in half-star increments' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await db.query('SELECT * FROM logs WHERE id = ?', [id]);

    if (existing.length === 0)
    {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (existing[0].user_id !== userId)
    {
      return res.status(403).json({ error: 'You can only delete your own logs' });
    }

    await db.query('DELETE FROM logs WHERE id = ?', [id]);

    res.json({ message: 'Log deleted' });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
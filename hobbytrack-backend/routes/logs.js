const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const asyncHandler = require('../utils/asyncHandler');
const { buildPagination, getOffset } = require('../utils/paginate');

const router = express.Router();

router.post('/', verifyToken, asyncHandler(async (req, res) =>
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
}));

router.get('/media/:mediaId', asyncHandler(async (req, res) =>
{
  const { mediaId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = getOffset(page, limit);

  const [logs] = await db.query(
    `SELECT l.id, l.rating, l.logged_date, l.notes, l.created_at, l.user_id, u.username
     FROM logs l
     JOIN users u ON l.user_id = u.id
     WHERE l.media_id = ?
     ORDER BY l.logged_date DESC
     LIMIT ? OFFSET ?`,
    [mediaId, parseInt(limit), offset]
  );

  const [countResult] = await db.query('SELECT COUNT(*) AS total FROM logs WHERE media_id = ?', [mediaId]);

  const [avgResult] = await db.query(
    'SELECT AVG(rating) AS avg_rating, COUNT(rating) AS rated_count FROM logs WHERE media_id = ? AND rating IS NOT NULL',
    [mediaId]
  );

  res.json({
    logs,
    averageRating: avgResult[0].avg_rating,
    ratedCount: avgResult[0].rated_count,
    pagination: buildPagination(page, limit, countResult[0].total)
  });
}));

router.get('/user/:userId', asyncHandler(async (req, res) =>
{
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = getOffset(page, limit);

  const [logs] = await db.query(
    `SELECT l.id, l.rating, l.logged_date, l.notes, l.user_id, l.media_id, m.title, m.type
     FROM logs l
     JOIN media_items m ON l.media_id = m.id
     WHERE l.user_id = ?
     ORDER BY l.logged_date DESC
     LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), offset]
  );

  const [countResult] = await db.query('SELECT COUNT(*) AS total FROM logs WHERE user_id = ?', [userId]);

  res.json({ logs, pagination: buildPagination(page, limit, countResult[0].total) });
}));

router.get('/count/:userId/:mediaId', asyncHandler(async (req, res) =>
{
  const { userId, mediaId } = req.params;

  const [result] = await db.query(
    'SELECT COUNT(*) AS times_logged FROM logs WHERE user_id = ? AND media_id = ?',
    [userId, mediaId]
  );

  res.json({ timesLogged: result[0].times_logged });
}));

router.put('/:id', verifyToken, asyncHandler(async (req, res) =>
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
}));

router.delete('/:id', verifyToken, asyncHandler(async (req, res) =>
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
}));

module.exports = router;
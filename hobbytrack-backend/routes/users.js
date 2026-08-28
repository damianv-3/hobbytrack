const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/search', asyncHandler(async (req, res) =>
{
  const { q } = req.query;

  if (!q)
  {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const [users] = await db.query(
    'SELECT id, username FROM users WHERE username LIKE ? ORDER BY username LIMIT 20',
    [`%${q}%`]
  );

  res.json({ users });
}));

router.get('/:id', asyncHandler(async (req, res) =>
{
  const { id } = req.params;

  const [userRows] = await db.query('SELECT id, username, created_at FROM users WHERE id = ?', [id]);

  if (userRows.length === 0)
  {
    return res.status(404).json({ error: 'User not found' });
  }

  const [followerCount] = await db.query('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?', [id]);
  const [followingCount] = await db.query('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?', [id]);
  const [logCount] = await db.query('SELECT COUNT(*) AS count FROM logs WHERE user_id = ?', [id]);
  const [clubCount] = await db.query('SELECT COUNT(*) AS count FROM club_members WHERE user_id = ?', [id]);

  res.json({
    id: userRows[0].id,
    username: userRows[0].username,
    createdAt: userRows[0].created_at,
    followerCount: followerCount[0].count,
    followingCount: followingCount[0].count,
    logCount: logCount[0].count,
    clubCount: clubCount[0].count
  });
}));

router.get('/:id/followers', asyncHandler(async (req, res) =>
{
  const { id } = req.params;

  const [followers] = await db.query(
    `SELECT u.id, u.username
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.followed_id = ?
     ORDER BY f.created_at DESC`,
    [id]
  );

  res.json({ followers });
}));

router.get('/:id/following', asyncHandler(async (req, res) =>
{
  const { id } = req.params;

  const [following] = await db.query(
    `SELECT u.id, u.username
     FROM follows f
     JOIN users u ON f.followed_id = u.id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`,
    [id]
  );

  res.json({ following });
}));

router.post('/:id/follow', verifyToken, asyncHandler(async (req, res) =>
{
  const { id } = req.params;
  const userId = req.user.userId;

  if (parseInt(id) === userId)
  {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  await db.query('INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)', [userId, id]);
  res.status(201).json({ message: 'Followed' });
}));

router.delete('/:id/unfollow', verifyToken, asyncHandler(async (req, res) =>
{
  const { id } = req.params;
  const userId = req.user.userId;

  await db.query('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?', [userId, id]);
  res.json({ message: 'Unfollowed' });
}));

module.exports = router;
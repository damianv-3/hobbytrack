const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// SEARCH users by username (public)
router.get('/search', async (req, res) =>
{
  try
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
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a public profile summary — username, join date, follower/following counts
router.get('/:id', async (req, res) =>
{
  try
  {
    const { id } = req.params;

    const [userRows] = await db.query('SELECT id, username, created_at FROM users WHERE id = ?', [id]);

    if (userRows.length === 0)
    {
      return res.status(404).json({ error: 'User not found' });
    }

    const [followerCount] = await db.query('SELECT COUNT(*) AS count FROM follows WHERE followed_id = ?', [id]);
    const [followingCount] = await db.query('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?', [id]);
    const [reviewCount] = await db.query('SELECT COUNT(*) AS count FROM reviews WHERE user_id = ?', [id]);
    const [logCount] = await db.query('SELECT COUNT(*) AS count FROM logs WHERE user_id = ?', [id]);
    const [clubCount] = await db.query('SELECT COUNT(*) AS count FROM club_members WHERE user_id = ?', [id]);

    res.json(
    {
      id: userRows[0].id,
      username: userRows[0].username,
      createdAt: userRows[0].created_at,
      followerCount: followerCount[0].count,
      followingCount: followingCount[0].count,
      reviewCount: reviewCount[0].count,
      logCount: logCount[0].count,
      clubCount: clubCount[0].count
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a user's followers (public)
router.get('/:id/followers', async (req, res) =>
{
  try
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
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET who a user follows (public)
router.get('/:id/following', async (req, res) =>
{
  try
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
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// FOLLOW a user (protected)
router.post('/:id/follow', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    if (parseInt(id) === userId)
    {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    await db.query('INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)', [userId, id]);

    res.status(201).json({ message: 'Followed' });
  }
  catch (err)
  {
    if (err.code === 'ER_DUP_ENTRY')
    {
      return res.status(409).json({ error: 'Already following this user' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UNFOLLOW a user (protected)
router.delete('/:id/unfollow', verifyToken, async (req, res) =>
{
  try
  {
    const { id } = req.params;
    const userId = req.user.userId;

    await db.query('DELETE FROM follows WHERE follower_id = ? AND followed_id = ?', [userId, id]);

    res.json({ message: 'Unfollowed' });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
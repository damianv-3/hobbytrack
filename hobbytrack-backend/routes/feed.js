const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// GET activity feed from followed users, paginated (protected)
router.get('/', verifyToken, async (req, res) =>
{
  try
  {
    const userId = req.user.userId;
    const { page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;

    const [entries] = await db.query(
      `SELECT 'review' AS entry_type, r.id, r.rating, r.review_text AS notes, r.created_at AS activity_date,
              u.id AS user_id, u.username, m.id AS media_id, m.title, m.type
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN media_items m ON r.media_id = m.id
       WHERE r.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)
       UNION ALL
       SELECT 'log' AS entry_type, l.id, l.rating, l.notes, l.created_at AS activity_date,
              u.id AS user_id, u.username, m.id AS media_id, m.title, m.type
       FROM logs l
       JOIN users u ON l.user_id = u.id
       JOIN media_items m ON l.media_id = m.id
       WHERE l.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)
         AND l.from_review_id IS NULL
       ORDER BY activity_date DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT r.id FROM reviews r WHERE r.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)
         UNION ALL
         SELECT l.id FROM logs l WHERE l.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?) AND l.from_review_id IS NULL
       ) AS combined`,
      [userId, userId]
    );

    res.json(
    {
      entries,
      pagination:
      {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
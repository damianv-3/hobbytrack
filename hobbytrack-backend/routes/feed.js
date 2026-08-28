const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const asyncHandler = require('../utils/asyncHandler');
const { buildPagination, getOffset } = require('../utils/paginate');

const router = express.Router();

router.get('/', verifyToken, asyncHandler(async (req, res) =>
{
  const userId = req.user.userId;
  const { page = 1, limit = 15 } = req.query;
  const offset = getOffset(page, limit);

  const [entries] = await db.query(
    `SELECT l.id, l.rating, l.notes, l.created_at AS activity_date,
            u.id AS user_id, u.username, m.id AS media_id, m.title, m.type
     FROM logs l
     JOIN users u ON l.user_id = u.id
     JOIN media_items m ON l.media_id = m.id
     WHERE l.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)
     ORDER BY activity_date DESC
     LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), offset]
  );

  const [countResult] = await db.query(
    `SELECT COUNT(*) AS total FROM logs
     WHERE user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)`,
    [userId]
  );

  res.json({ entries, pagination: buildPagination(page, limit, countResult[0].total) });
}));

module.exports = router;
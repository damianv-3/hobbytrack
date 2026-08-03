const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.post('/', verifyToken, async (req, res) =>
{
  try
  {
    const { mediaId, rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (!mediaId || !rating)
    {
      return res.status(400).json({ error: 'mediaId and rating are required' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (user_id, media_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [userId, mediaId, rating, reviewText || null]
    );

    res.status(201).json({ message: 'Review created', reviewId: result.insertId });
  }
  catch (err)
  {
    if (err.code === 'ER_DUP_ENTRY')
    {
      return res.status(409).json({ error: 'You already reviewed this item. Use PUT to update it.' });
    }
    if (err.message.includes('CONSTRAINT'))
    {
      return res.status(400).json({ error: 'Rating must be between 0.5 and 5.0, in half-star increments' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all reviews for a specific media item (public)
router.get('/media/:mediaId', async (req, res) =>
{
  try
  {
    const { mediaId } = req.params;

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, r.user_id, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.media_id = ?
      ORDER BY r.created_at DESC`,
      [mediaId]
    );

    const [avgResult] = await db.query(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE media_id = ?',
      [mediaId]
    );

    res.json({
      reviews,
      averageRating: avgResult[0].avg_rating,
      reviewCount: avgResult[0].review_count
    });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all reviews by a specific user (public)
router.get('/user/:userId', async (req, res) =>
{
  try
  {
    const { userId } = req.params;

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, r.user_id, r.media_id, m.title, m.type
      FROM reviews r
      JOIN media_items m ON r.media_id = m.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({ reviews });
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
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    const [existing] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);

    if (existing.length === 0)
    {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing[0].user_id !== userId)
    {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    await db.query(
      'UPDATE reviews SET rating = ?, review_text = ? WHERE id = ?',
      [rating, reviewText || null, id]
    );

    res.json({ message: 'Review updated' });
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

    const [existing] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);

    if (existing.length === 0)
    {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing[0].user_id !== userId)
    {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await db.query('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({ message: 'Review deleted' });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
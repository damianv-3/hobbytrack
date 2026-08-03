const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', async (req, res) =>
{
  try
  {
    const { type } = req.query;

    let query = 'SELECT id, type, title, added_by, created_at FROM media_items';
    let params = [];

    if (type)
    {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const [items] = await db.query(query, params);

    res.json({ items });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', async (req, res) =>
{
  try
  {
    const { q } = req.query;

    if (!q)
    {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const [items] = await db.query(
      'SELECT id, type, title, created_at FROM media_items WHERE title LIKE ? ORDER BY title',
      [`%${q}%`]
    );

    res.json({ items });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) =>
{
  try
  {
    const { id } = req.params;

    const [mediaRows] = await db.query('SELECT * FROM media_items WHERE id = ?', [id]);

    if (mediaRows.length === 0)
    {
      return res.status(404).json({ error: 'Media item not found' });
    }

    const media = mediaRows[0];

    if (media.type === 'album')
    {
      const [albumRows] = await db.query('SELECT * FROM albums WHERE media_id = ?', [id]);
      const [tracks] = await db.query(
        'SELECT id, title, track_number, duration_seconds FROM tracks WHERE album_media_id = ? ORDER BY track_number',
        [id]
      );

      return res.json({ ...media, ...albumRows[0], tracks });
    }

    if (media.type === 'book')
    {
      const [bookRows] = await db.query('SELECT * FROM books WHERE media_id = ?', [id]);

      return res.json({ ...media, ...bookRows[0] });
    }

    res.json(media);
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/albums', verifyToken, async (req, res) =>
{
  const connection = await db.getConnection();

  try
  {
    const { title, artist, releaseYear, tracks } = req.body;
    const userId = req.user.userId;

    if (!title)
    {
      return res.status(400).json({ error: 'title is required' });
    }

    await connection.beginTransaction();

    const [mediaResult] = await connection.query(
      'INSERT INTO media_items (type, title, added_by) VALUES (?, ?, ?)',
      ['album', title, userId]
    );

    const mediaId = mediaResult.insertId;

    await connection.query(
      'INSERT INTO albums (media_id, artist, release_year, track_count) VALUES (?, ?, ?, ?)',
      [mediaId, artist || null, releaseYear || null, tracks ? tracks.length : 0]
    );

    if (tracks && tracks.length > 0)
    {
      for (let i = 0; i < tracks.length; i++)
      {
        await connection.query(
          'INSERT INTO tracks (album_media_id, title, track_number, duration_seconds) VALUES (?, ?, ?, ?)',
          [mediaId, tracks[i].title, i + 1, tracks[i].durationSeconds || null]
        );
      }
    }

    await connection.commit();

    res.status(201).json({ message: 'Album created', mediaId });
  }
  catch (err)
  {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
  finally
  {
    connection.release();
  }
});

router.post('/books', verifyToken, async (req, res) =>
{
  try
  {
    const { title, author, publishYear, pageCount } = req.body;
    const userId = req.user.userId;

    if (!title)
    {
      return res.status(400).json({ error: 'title is required' });
    }

    const [mediaResult] = await db.query(
      'INSERT INTO media_items (type, title, added_by) VALUES (?, ?, ?)',
      ['book', title, userId]
    );

    const mediaId = mediaResult.insertId;

    await db.query(
      'INSERT INTO books (media_id, author, publish_year, page_count) VALUES (?, ?, ?, ?)',
      [mediaId, author || null, publishYear || null, pageCount || null]
    );

    res.status(201).json({ message: 'Book created', mediaId });
  }
  catch (err)
  {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
const express = require('express');
const axios = require('axios');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// GET all media items, optionally filtered by type, with pagination (public)
router.get('/', async (req, res) =>
{
  try
  {
    const { type, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT m.id, m.type, m.title, m.added_by, m.created_at, a.artist, b.author
      FROM media_items m
      LEFT JOIN albums a ON m.id = a.media_id
      LEFT JOIN books b ON m.id = b.media_id
    `;
    let countQuery = 'SELECT COUNT(*) AS total FROM media_items m';
    let params = [];

    if (type)
    {
      query += ' WHERE m.type = ?';
      countQuery += ' WHERE m.type = ?';
      params.push(type);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';

    const [rows] = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const [countResult] = await db.query(countQuery, params);

    const items = rows.map((row) => (
    {
      id: row.id,
      type: row.type,
      title: row.title,
      creator: row.artist || row.author || null,
      createdAt: row.created_at
    }));

    res.json(
    {
      items,
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

// SEARCH media items in your own library by title (public)
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

      // if we never pulled the tracklist yet, grab it now, this only happens once per album
      if (albumRows[0].track_count === 0 && albumRows[0].mbid)
      {
        await fetchAndStoreTracks(id, albumRows[0].mbid);
      }

      const [freshAlbumRows] = await db.query('SELECT * FROM albums WHERE media_id = ?', [id]);
      const [tracks] = await db.query(
        'SELECT id, title, track_number, duration_seconds FROM tracks WHERE album_media_id = ? ORDER BY track_number',
        [id]
      );

      return res.json({ ...media, ...freshAlbumRows[0], tracks });
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

// CREATE a new album manually (protected)
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

// CREATE a new book manually (protected)
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

// pulls the tracklist for an album after the fact, so "file it" doesn't have to wait on it
async function fetchAndStoreTracks(mediaId, mbid)
{
  const [groupRows] = await db.query('SELECT * FROM albums WHERE media_id = ?', [mediaId]);
  if (groupRows.length === 0) return;

  const groupResponse = await axios.get(`https://musicbrainz.org/ws/2/release-group/${mbid}`,
  {
    params: { fmt: 'json', inc: 'releases' },
    headers: { 'User-Agent': 'HobbyTrack/1.0 (your-email@example.com)' }
  });

  const firstReleaseId = groupResponse.data.releases?.[0]?.id;
  if (!firstReleaseId) return;

  const releaseResponse = await axios.get(`https://musicbrainz.org/ws/2/release/${firstReleaseId}`,
  {
    params: { fmt: 'json', inc: 'recordings' },
    headers: { 'User-Agent': 'HobbyTrack/1.0 (your-email@example.com)' }
  });

  const tracks = [];
  (releaseResponse.data.media || []).forEach((disc) =>
  {
    (disc.tracks || []).forEach((track) =>
    {
      tracks.push({ title: track.title, durationSeconds: track.length ? Math.round(track.length / 1000) : null });
    });
  });

  if (tracks.length === 0) return;

  for (let i = 0; i < tracks.length; i++)
  {
    await db.query(
      'INSERT INTO tracks (album_media_id, title, track_number, duration_seconds) VALUES (?, ?, ?, ?)',
      [mediaId, tracks[i].title, i + 1, tracks[i].durationSeconds]
    );
  }

  await db.query('UPDATE albums SET track_count = ? WHERE media_id = ?', [tracks.length, mediaId]);
}

// CREATE an album FROM a MusicBrainz search result (protected, duplicate-safe, fast — tracklist loads lazily)
router.post('/albums/from-musicbrainz', verifyToken, async (req, res) =>
{
  try
  {
    const { mbid } = req.body;
    const userId = req.user.userId;

    if (!mbid)
    {
      return res.status(400).json({ error: 'mbid is required' });
    }

    const [existing] = await db.query('SELECT media_id FROM albums WHERE mbid = ?', [mbid]);

    if (existing.length > 0)
    {
      return res.status(200).json({ message: 'Already in catalog', mediaId: existing[0].media_id, alreadyExisted: true });
    }

    // one call, gets title + artist, skips the tracklist lookup entirely for now
    const groupResponse = await axios.get(`https://musicbrainz.org/ws/2/release-group/${mbid}`,
    {
      params: { fmt: 'json', inc: 'artist-credits' },
      headers: { 'User-Agent': 'HobbyTrack/1.0 (your-email@example.com)' }
    });

    const releaseGroup = groupResponse.data;
    const title = releaseGroup.title;
    const artist = releaseGroup['artist-credit']?.[0]?.name || 'Unknown Artist';
    const releaseYear = releaseGroup['first-release-date'] ? releaseGroup['first-release-date'].substring(0, 4) : null;

    const connection = await db.getConnection();

    try
    {
      await connection.beginTransaction();

      const [mediaResult] = await connection.query(
        'INSERT INTO media_items (type, title, added_by) VALUES (?, ?, ?)',
        ['album', title, userId]
      );

      const mediaId = mediaResult.insertId;

      await connection.query(
        'INSERT INTO albums (media_id, artist, release_year, track_count, mbid) VALUES (?, ?, ?, 0, ?)',
        [mediaId, artist, releaseYear, mbid]
      );

      await connection.commit();

      res.status(201).json({ message: 'Album added from MusicBrainz', mediaId });
    }
    catch (err)
    {
      await connection.rollback();
      throw err;
    }
    finally
    {
      connection.release();
    }
  }
  catch (err)
  {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to add album' });
  }
});

// CREATE a book FROM a Google Books search result (protected, duplicate-safe)
router.post('/books/from-google', verifyToken, async (req, res) =>
{
  try
  {
    const { googleBooksId } = req.body;
    const userId = req.user.userId;

    if (!googleBooksId)
    {
      return res.status(400).json({ error: 'googleBooksId is required' });
    }

    const [existing] = await db.query(
      'SELECT media_id FROM books WHERE google_books_id = ?',
      [googleBooksId]
    );

    if (existing.length > 0)
    {
      return res.status(200).json({ message: 'Already in catalog', mediaId: existing[0].media_id, alreadyExisted: true });
    }

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes/${googleBooksId}`,
    {
      params: { key: process.env.GOOGLE_BOOKS_API_KEY }
    });

    const info = response.data.volumeInfo;
    const title = info.title;
    const author = info.authors?.[0] || 'Unknown Author';
    const publishYear = info.publishedDate ? info.publishedDate.substring(0, 4) : null;
    const pageCount = info.pageCount || null;

    const [mediaResult] = await db.query(
      'INSERT INTO media_items (type, title, added_by) VALUES (?, ?, ?)',
      ['book', title, userId]
    );

    const mediaId = mediaResult.insertId;

    await db.query(
      'INSERT INTO books (media_id, author, publish_year, page_count, google_books_id) VALUES (?, ?, ?, ?, ?)',
      [mediaId, author, publishYear, pageCount, googleBooksId]
    );

    res.status(201).json({ message: 'Book added from Google Books', mediaId });
  }
  catch (err)
  {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

module.exports = router;
const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/albums', async (req, res) =>
{
  try
  {
    const { q } = req.query;

    if (!q)
    {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const response = await axios.get('https://musicbrainz.org/ws/2/release-group', 
    {
      params: 
      {
        query: q,
        fmt: 'json',
        limit: 10
      },
      headers: 
      {
        'User-Agent': 'HobbyTrack/1.0 (damianavarela35@gmail.com)'
      }
    });

    const results = response.data['release-groups']
      .sort((a, b) => b.score - a.score)
      .map((rg) => (
      {
        title: rg.title,
        artist: rg['artist-credit']?.[0]?.name || 'Unknown Artist',
        releaseYear: rg['first-release-date'] ? rg['first-release-date'].substring(0, 4) : null,
        mbid: rg.id,
        score: rg.score
      }));

    res.json({ results });
  }
  catch (err)
  {
    console.error('MusicBrainz error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to search MusicBrainz' });
  }
    });

// Search Google Books for books
router.get('/books', async (req, res) =>
{
  try
  {
    const { q } = req.query;

    if (!q)
    {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', 
    {
    params: 
    {
        q: `intitle:${q}`,
        maxResults: 10,
        orderBy: 'relevance',
        key: process.env.GOOGLE_BOOKS_API_KEY
    }
    });

    const results = (response.data.items || [])
    .map((item) => (
    {
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        publishYear: item.volumeInfo.publishedDate ? item.volumeInfo.publishedDate.substring(0, 4) : null,
        pageCount: item.volumeInfo.pageCount || null,
        ratingsCount: item.volumeInfo.ratingsCount || 0,
        googleBooksId: item.id
    }))
    .sort((a, b) => b.ratingsCount - a.ratingsCount);

    res.json({ results });
  }
    catch (err)
    {
    console.error('Google Books error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to search Google Books', details: err.response?.data || err.message });
    }
});

module.exports = router;
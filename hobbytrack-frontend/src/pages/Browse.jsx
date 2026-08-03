import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

function Browse()
{
  const [mediaType, setMediaType] = useState('album');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const { token } = useAuth();

  useEffect(() =>
  {
    fetchLibrary();
  }, [mediaType, page]);

  const fetchLibrary = async () =>
  {
    try
    {
      const res = await axios.get('http://localhost:5000/media', 
      {
        params: { type: mediaType, page, limit: 10 }
      });
      setItems(res.data.items);
      setTotalPages(res.data.pagination.totalPages);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleSearch = async (e) =>
  {
    e.preventDefault();
    setLoading(true);
    setSearchResults([]);
    setAddMessage('');

    try
    {
      const endpoint = mediaType === 'album' ? '/search/albums' : '/search/books';
      const res = await axios.get(`http://localhost:5000${endpoint}`, 
      {
        params: { q: searchQuery }
      });
      setSearchResults(res.data.results);
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      setLoading(false);
    }
  };

  const handleAdd = async (result) =>
  {
    setAddMessage('');

    try
    {
      if (mediaType === 'album')
      {
        await axios.post('http://localhost:5000/media/albums/from-musicbrainz', 
          { mbid: result.mbid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      else
      {
        await axios.post('http://localhost:5000/media/books/from-google', 
          { googleBooksId: result.googleBooksId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setAddMessage(`Added "${result.title}" to the library!`);
      setSearchResults([]);
      setSearchQuery('');
      fetchLibrary();
    }
    catch (err)
    {
      setAddMessage(err.response?.data?.error || 'Failed to add');
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '30px auto' }}>
      <h1>Browse</h1>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => { setMediaType('album'); setPage(1); }}
          style={{ fontWeight: mediaType === 'album' ? 'bold' : 'normal' }}
        >
          Music
        </button>
        <button 
          onClick={() => { setMediaType('book'); setPage(1); }}
          style={{ fontWeight: mediaType === 'book' ? 'bold' : 'normal' }}
        >
          Books
        </button>
      </div>

      {token && (
        <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
          <h3>Search & add {mediaType === 'album' ? 'an album' : 'a book'}</h3>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mediaType === 'album' ? 'Search albums...' : 'Search books...'}
            />
            <button type="submit">Search</button>
          </form>

          {loading && <p>Searching...</p>}
          {addMessage && <p>{addMessage}</p>}

          {searchResults.map((result) => (
            <div key={result.mbid || result.googleBooksId} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <strong>{result.title}</strong> — {mediaType === 'album' ? result.artist : result.author}
              {' '}({result.releaseYear || result.publishYear || 'unknown year'})
              <button onClick={() => handleAdd(result)} style={{ marginLeft: '10px' }}>Add</button>
            </div>
          ))}
        </div>
      )}

      <h3>Library</h3>
      {items.length === 0 && <p>No {mediaType === 'album' ? 'albums' : 'books'} yet.</p>}
      {items.map((item) => (
        <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <Link to={`/media/${item.id}`}>{item.title}</Link>
        </div>
      ))}

      <div style={{ marginTop: '15px' }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span style={{ margin: '0 10px' }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export default Browse;
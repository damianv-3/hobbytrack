import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreference } from '../context/PreferenceContext.jsx';
import { getMediaList, searchExternal, addAlbumFromMusicBrainz, addBookFromGoogle } from '../api/media.js';
import Pagination from '../components/Pagination.jsx';

function Browse()
{
  const { mediaPreference } = usePreference();
  const [mediaType, setMediaType] = useState(mediaPreference === 'book' ? 'book' : 'album');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const [addingId, setAddingId] = useState(null);
  const { token } = useAuth();

  useEffect(() =>
  {
    fetchLibrary();
  }, [mediaType, page]);

  const fetchLibrary = async () =>
  {
    try
    {
      const res = await getMediaList(mediaType, page, 10);
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
      const res = await searchExternal(mediaType, searchQuery);
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
    const resultId = result.mbid || result.googleBooksId;
    if (addingId) return;
    setAddingId(resultId);
    setAddMessage('');

    try
    {
      if (mediaType === 'album')
      {
        await addAlbumFromMusicBrainz(token, result.mbid);
      }
      else
      {
        await addBookFromGoogle(token, result.googleBooksId);
      }

      setAddMessage(`Filed "${result.title}" in the catalog.`);
      setSearchResults([]);
      setSearchQuery('');
      fetchLibrary();
    }
    catch (err)
    {
      setAddMessage(err.response?.data?.error || 'Failed to add');
    }
    finally
    {
      setAddingId(null);
    }
  };

  return (
    <div className="page">
      <h1>Browse</h1>

      <div className="type-toggle">
        <button className={mediaType === 'album' ? 'active-music' : ''} onClick={() => { setMediaType('album'); setPage(1); }}>Music</button>
        <button className={mediaType === 'book' ? 'active-book' : ''} onClick={() => { setMediaType('book'); setPage(1); }}>Books</button>
      </div>

      {token && (
        <div className="card">
          <div className="card-callnumber">FIND & FILE — {mediaType === 'album' ? 'MUSIC' : 'BOOKS'}</div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mediaType === 'album' ? 'Search for an album...' : 'Search for a book...'}
              style={{ flex: 1, minWidth: '160px', padding: '0.55rem 0.7rem', border: '1.5px solid var(--line)', borderRadius: '3px', background: 'var(--paper)' }}
            />
            <button type="submit" className="btn">Search</button>
          </form>

          {loading && <p className="entry-meta" style={{ marginTop: '0.75rem' }}>Searching...</p>}
          {addMessage && <p className="success-text" style={{ marginTop: '0.75rem' }}>{addMessage}</p>}

          {searchResults.map((result) => (
            <div key={result.mbid || result.googleBooksId} className="entry-row result-row">
              <div className="result-row-text">
                <strong>{result.title}</strong>
                <div className="entry-meta">{mediaType === 'album' ? result.artist : result.author} · {result.releaseYear || result.publishYear || 'year unknown'}</div>
              </div>
              <button className="btn btn-small" onClick={() => handleAdd(result)} disabled={addingId === (result.mbid || result.googleBooksId)}>
                {addingId === (result.mbid || result.googleBooksId) ? 'Filing...' : 'File it'}
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>In the catalog</h3>
      {items.length === 0 && <p className="empty-state">Nothing filed under {mediaType === 'album' ? 'music' : 'books'} yet.</p>}

      {items.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-num">No.</span>
            <span className="col-main">Title</span>
          </div>
          {items.map((item) => (
            <Link key={item.id} to={`/media/${item.id}`} className="ledger-row linked">
              <span className="col-num">{mediaType === 'album' ? 'MUS' : 'BK'}-{String(item.id).padStart(3, '0')}</span>
              <span className="col-main">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{item.title}</span>
                {item.creator && <span className="entry-meta" style={{ display: 'block' }}>{item.creator}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}

      {items.length > 0 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}

export default Browse;
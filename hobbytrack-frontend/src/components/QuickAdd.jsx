import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from './StarRating.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';

function QuickAdd()
{
  const { token } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('search'); // search | external | form
  const [mediaType, setMediaType] = useState('album');
  const [query, setQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null); // { id, title, type }

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [logRating, setLogRating] = useState(0);
  const [logNotes, setLogNotes] = useState('');
  const [logMsg, setLogMsg] = useState('');

  const { bumpRefresh } = useDataRefresh();

  const reset = () =>
  {
    setStep('search');
    setQuery('');
    setLibraryResults([]);
    setExternalResults([]);
    setSearched(false);
    setSelected(null);
    setRating(0);
    setReviewText('');
    setReviewMsg('');
    setLogDate(new Date().toISOString().substring(0, 10));
    setLogRating(0);
    setLogNotes('');
    setLogMsg('');
  };

  const close = () =>
  {
    setOpen(false);
    reset();
  };

  const searchLibrary = async (e) =>
  {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try
    {
      const res = await axios.get('http://localhost:5000/media/search', { params: { q: query } });
      setLibraryResults(res.data.items.filter((item) => item.type === mediaType));
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

  const searchExternal = async () =>
  {
    setLoading(true);

    try
    {
      const endpoint = mediaType === 'album' ? '/search/albums' : '/search/books';
      const res = await axios.get(`http://localhost:5000${endpoint}`, { params: { q: query } });
      setExternalResults(res.data.results);
      setStep('external');
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

  const addFromExternal = async (result) =>
  {
    try
    {
      let mediaId;

      if (mediaType === 'album')
      {
        const res = await axios.post('http://localhost:5000/media/albums/from-musicbrainz',
          { mbid: result.mbid },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mediaId = res.data.mediaId;
      }
      else
      {
        const res = await axios.post('http://localhost:5000/media/books/from-google',
          { googleBooksId: result.googleBooksId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mediaId = res.data.mediaId;
      }

      setSelected({ id: mediaId, title: result.title, type: mediaType });
      setStep('form');
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const pickExisting = (item) =>
  {
    setSelected({ id: item.id, title: item.title, type: item.type });
    setStep('form');
  };

  const submitReview = async (e) =>
  {
    e.preventDefault();
    setReviewMsg('');

    try
    {
      await axios.post('http://localhost:5000/reviews',
        { mediaId: selected.id, rating, reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewMsg('Review filed.');
      bumpRefresh();
    }
    catch (err)
    {
      setReviewMsg(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const submitLog = async (e) =>
  {
    e.preventDefault();
    setLogMsg('');

    try
    {
      await axios.post('http://localhost:5000/logs',
        { mediaId: selected.id, rating: logRating || null, loggedDate: logDate, notes: logNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogMsg('Stamped into the log.');
      bumpRefresh();
    }
    catch (err)
    {
      setLogMsg(err.response?.data?.error || 'Failed to log');
    }
  };

  const goToMedia = () =>
  {
    navigate(`/media/${selected.id}`);
    close();
  };

  if (!token) return null;

  return (
    <>
      <button className="fab btn-onwood" onClick={() => setOpen(true)} title="Review or log something" aria-label="Review or log something">+</button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={close} aria-label="Close">✕ Close</button>

            {step === 'search' && (
              <>
                <div className="card-callnumber">QUICK FILE</div>
                <h2 style={{ fontSize: '1.3rem' }}>What are you logging?</h2>

                <div className="type-toggle">
                  <button className={mediaType === 'album' ? 'active-music' : ''} onClick={() => { setMediaType('album'); setSearched(false); setLibraryResults([]); }}>Music</button>
                  <button className={mediaType === 'book' ? 'active-book' : ''} onClick={() => { setMediaType('book'); setSearched(false); setLibraryResults([]); }}>Books</button>
                </div>

                <form onSubmit={searchLibrary} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={mediaType === 'album' ? 'Search your library for an album...' : 'Search your library for a book...'}
                    style={{ flex: 1, padding: '0.55rem 0.7rem', border: '1.5px solid var(--line)', borderRadius: '3px', background: 'var(--paper)' }}
                  />
                  <button type="submit" className="btn">Search</button>
                </form>

                {loading && <p className="entry-meta" style={{ marginTop: '0.75rem' }}>Searching...</p>}

                {searched && !loading && libraryResults.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    {libraryResults.map((item) => (
                      <button key={item.id} className="pick-row" onClick={() => pickExisting(item)}>
                        <span style={{ fontFamily: 'var(--font-display)' }}>{item.title}</span>
                        <span className="entry-meta">Already filed</span>
                      </button>
                    ))}
                  </div>
                )}

                {searched && !loading && libraryResults.length === 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p className="empty-state">Not in your library yet.</p>
                    <button className="btn btn-primary" onClick={searchExternal} disabled={!query}>
                      Search {mediaType === 'album' ? 'MusicBrainz' : 'Google Books'} instead
                    </button>
                  </div>
                )}
              </>
            )}

            {step === 'external' && (
              <>
                <div className="card-callnumber">FIND & FILE</div>
                <h2 style={{ fontSize: '1.3rem' }}>Add "{query}"</h2>
                {loading && <p className="entry-meta">Searching...</p>}
                {!loading && externalResults.length === 0 && <p className="empty-state">No results found.</p>}
                {!loading && externalResults.map((result) => (
                  <div key={result.mbid || result.googleBooksId} className="entry-row result-row">
                    <div className="result-row-text">
                      <strong>{result.title}</strong>
                      <div className="entry-meta">{mediaType === 'album' ? result.artist : result.author} · {result.releaseYear || result.publishYear || 'unknown'}</div>
                    </div>
                    <button className="btn btn-small" onClick={() => addFromExternal(result)}>File it</button>
                  </div>
                ))}
                <button className="btn btn-small" style={{ marginTop: '1rem' }} onClick={() => setStep('search')}>Back</button>
              </>
            )}

            {step === 'form' && selected && (
              <>
                <div className="card-callnumber">{selected.type === 'album' ? 'MUS' : 'BK'} · {selected.title}</div>
                <h2 style={{ fontSize: '1.3rem' }}>Review &amp; log</h2>

                <div className="card" style={{ marginBottom: '1rem' }}>
                  <h3>Review</h3>
                  <form onSubmit={submitReview}>
                    <div className="field">
                      <StarRating value={rating} onChange={setRating} size="1.2rem" />
                    </div>
                    <div className="field">
                      <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={2} placeholder="Optional review..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!rating}>File review</button>
                  </form>
                  {reviewMsg && <p className={reviewMsg.includes('filed') ? 'success-text' : 'error-text'}>{reviewMsg}</p>}
                </div>

                <div className="card">
                  <h3>Log entry</h3>
                  <form onSubmit={submitLog}>
                    <div className="stack-row">
                      <div className="field" style={{ flex: '1 1 130px' }}>
                        <label>Date</label>
                        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
                      </div>
                      <div className="field" style={{ flex: '1 1 150px' }}>
                        <label>Rating (optional)</label>
                        <StarRating value={logRating} onChange={setLogRating} size="1rem" />
                      </div>
                    </div>
                    <div className="field">
                      <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} rows={2} placeholder="Notes (optional)..." />
                    </div>
                    <button type="submit" className="btn">Stamp entry</button>
                  </form>
                  {logMsg && <p className="success-text">{logMsg}</p>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn" onClick={goToMedia}>Go to page</button>
                  <button className="btn" onClick={close}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default QuickAdd;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { searchMediaLibrary, searchExternal, addAlbumFromMusicBrainz, addBookFromGoogle } from '../api/media.js';
import { createLog } from '../api/logs.js';
import LogForm from './LogForm.jsx';

function QuickAdd()
{
  const { token } = useAuth();
  const navigate = useNavigate();
  const { bumpRefresh } = useDataRefresh();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('search'); // search | external | form
  const [mediaType, setMediaType] = useState('album');
  const [query, setQuery] = useState('');
  const [libraryResults, setLibraryResults] = useState([]);
  const [externalResults, setExternalResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // { id, title, type }
  const [logMsg, setLogMsg] = useState('');

  const reset = () =>
  {
    setStep('search');
    setQuery('');
    setLibraryResults([]);
    setExternalResults([]);
    setSearched(false);
    setSelected(null);
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
      const res = await searchMediaLibrary(query);
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

  const searchExternalItems = async () =>
  {
    setLoading(true);

    try
    {
      const res = await searchExternal(mediaType, query);
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
      const res = mediaType === 'album'
        ? await addAlbumFromMusicBrainz(token, result.mbid)
        : await addBookFromGoogle(token, result.googleBooksId);

      setSelected({ id: res.data.mediaId, title: result.title, type: mediaType });
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

  const submitLog = async ({ loggedDate, rating, notes }) =>
  {
    setLogMsg('');

    try
    {
      await createLog(token, { mediaId: selected.id, rating, loggedDate, notes });
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
      <button className="fab btn-onwood" onClick={() => setOpen(true)} title="Log something" aria-label="Log something">+</button>

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
                    <button className="btn btn-primary" onClick={searchExternalItems} disabled={!query}>
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
                <h2 style={{ fontSize: '1.3rem' }}>Log entry</h2>

                <div className="card">
                  <LogForm onSubmit={submitLog} />
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
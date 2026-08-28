import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getMediaById } from '../api/media.js';
import { getLogsForMedia, createLog, updateLog, deleteLog } from '../api/logs.js';
import StarRating from '../components/StarRating.jsx';
import LogForm from '../components/LogForm.jsx';
import Pagination from '../components/Pagination.jsx';

function MediaDetail()
{
  const { id } = useParams();
  const { token, user } = useAuth();

  const [media, setMedia] = useState(null);
  const [logs, setLogs] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [ratedCount, setRatedCount] = useState(0);
  const [logMessage, setLogMessage] = useState('');
  const [editingLogId, setEditingLogId] = useState(null);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  const accent = media?.type === 'album' ? 'var(--music)' : 'var(--books)';

  useEffect(() =>
  {
    fetchMedia();
    fetchLogs();
  }, [id, logPage]);

  const fetchMedia = async () =>
  {
    try
    {
      const res = await getMediaById(id);
      setMedia(res.data);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const fetchLogs = async () =>
  {
    try
    {
      const res = await getLogsForMedia(id, logPage, 10);
      setLogs(res.data.logs);
      setAverageRating(res.data.averageRating);
      setRatedCount(res.data.ratedCount);
      setLogTotalPages(res.data.pagination.totalPages);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleCreateLog = async ({ loggedDate, rating, notes }) =>
  {
    setLogMessage('');

    try
    {
      await createLog(token, { mediaId: id, rating, loggedDate, notes });
      setLogMessage('Stamped into the log.');
      fetchLogs();
    }
    catch (err)
    {
      setLogMessage(err.response?.data?.error || 'Failed to log');
    }
  };

  const handleUpdateLog = async (logId, { loggedDate, rating, notes }) =>
  {
    try
    {
      await updateLog(token, logId, { rating, loggedDate, notes });
      setEditingLogId(null);
      fetchLogs();
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleDeleteLog = async (logId) =>
  {
    try
    {
      await deleteLog(token, logId);
      fetchLogs();
    }
    catch (err)
    {
      console.error(err);
    }
  };

  if (!media)
  {
    return <div className="page"><p className="empty-state">Pulling the card...</p></div>;
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-callnumber" style={{ color: accent }}>
          {media.type === 'album' ? 'MUS' : 'BK'} · {String(media.id).padStart(3, '0')}
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.25rem' }}>{media.title}</h1>
            {media.type === 'album' && <p style={{ color: 'var(--ink-soft)' }}>{media.artist} · {media.release_year}</p>}
            {media.type === 'book' && <p style={{ color: 'var(--ink-soft)' }}>{media.author} · {media.publish_year} · {media.page_count} pages</p>}
          </div>
          {averageRating && (
            <div className="stamp">{parseFloat(averageRating).toFixed(1)}</div>
          )}
        </div>
        {averageRating && <p className="entry-meta">{ratedCount} rated entr{ratedCount !== 1 ? 'ies' : 'y'} on file</p>}

        {media.type === 'album' && media.tracks && media.tracks.length > 0 && (
          <>
            <hr className="divider" />
            <h3>Tracklist</h3>
            <ol style={{ paddingLeft: '1.25rem' }}>
              {media.tracks.map((track) => (
                <li key={track.id} style={{ marginBottom: '0.3rem' }}>
                  {track.title}
                  {track.duration_seconds && (
                    <span className="entry-meta"> — {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, '0')}</span>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {token && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-callnumber">{media.type === 'album' ? 'LISTEN LOG' : 'READING LOG'}</div>
          <LogForm onSubmit={handleCreateLog} />
          {logMessage && <p className="success-text" style={{ marginTop: '0.5rem' }}>{logMessage}</p>}
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>Activity Log</h3>
      {logs.length === 0 && <p className="empty-state">No entries yet.</p>}
      {logs.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-num">Date</span>
            <span className="col-main">Member</span>
            <span className="col-meta">Rating</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="ledger-row" style={{ flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
              {editingLogId === log.id ? (
                <div style={{ width: '100%' }}>
                  <LogForm
                    initialDate={log.logged_date?.substring(0, 10) || ''}
                    initialRating={log.rating ? parseFloat(log.rating) : 0}
                    initialNotes={log.notes || ''}
                    submitLabel="Save"
                    onSubmit={(values) => handleUpdateLog(log.id, values)}
                  />
                  <button className="btn btn-small" style={{ marginTop: '0.4rem' }} onClick={() => setEditingLogId(null)}>Cancel</button>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="col-num">{log.logged_date?.substring(0, 10)}</span>
                  <span className="col-main">
                    <strong>{log.username}</strong>
                    {log.notes && <span style={{ color: 'var(--ink-soft)' }}> — {log.notes}</span>}
                  </span>
                  <span className="col-meta">{log.rating ? <StarRating value={parseFloat(log.rating)} readOnly size="0.9rem" /> : '—'}</span>
                  {user && user.userId === log.user_id && (
                    <span style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-small" onClick={() => setEditingLogId(log.id)}>Edit</button>
                      <button className="btn btn-small" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          <Pagination page={logPage} totalPages={logTotalPages} onChange={setLogPage} />
        </div>
      )}
    </div>
  );
}

export default MediaDetail;
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';

function MediaDetail()
{
  const { id } = useParams();
  const { token, user } = useAuth();

  const [media, setMedia] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [logs, setLogs] = useState([]);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [message, setMessage] = useState('');

  const [logDate, setLogDate] = useState('');
  const [logRating, setLogRating] = useState(0);
  const [logNotes, setLogNotes] = useState('');
  const [logMessage, setLogMessage] = useState('');

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');

  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogDate, setEditLogDate] = useState('');
  const [editLogRating, setEditLogRating] = useState(0);
  const [editLogNotes, setEditLogNotes] = useState('');

  const accent = media?.type === 'album' ? 'var(--music)' : 'var(--books)';

  useEffect(() =>
  {
    fetchMedia();
    fetchReviews();
    fetchLogs();
  }, [id]);

  const fetchMedia = async () =>
  {
    try
    {
      const res = await axios.get(`http://localhost:5000/media/${id}`);
      setMedia(res.data);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const fetchReviews = async () =>
  {
    try
    {
      const res = await axios.get(`http://localhost:5000/reviews/media/${id}`);
      setReviews(res.data.reviews);
      setAverageRating(res.data.averageRating);
      setReviewCount(res.data.reviewCount);
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
      const res = await axios.get(`http://localhost:5000/logs/media/${id}`);
      setLogs(res.data.logs);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) =>
  {
    e.preventDefault();
    setMessage('');

    try
    {
      await axios.post('http://localhost:5000/reviews',
        { mediaId: id, rating, reviewText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Review filed.');
      setRating(0);
      setReviewText('');
      fetchReviews();
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const startEditReview = (review) =>
  {
    setEditingReviewId(review.id);
    setEditRating(parseFloat(review.rating));
    setEditText(review.review_text || '');
  };

  const handleUpdateReview = async (reviewId) =>
  {
    try
    {
      await axios.put(`http://localhost:5000/reviews/${reviewId}`,
        { rating: editRating, reviewText: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingReviewId(null);
      fetchReviews();
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId) =>
  {
    try
    {
      await axios.delete(`http://localhost:5000/reviews/${reviewId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReviews();
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleSubmitLog = async (e) =>
  {
    e.preventDefault();
    setLogMessage('');

    try
    {
      await axios.post('http://localhost:5000/logs',
        {
          mediaId: id,
          rating: logRating || null,
          loggedDate: logDate,
          notes: logNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLogMessage('Stamped into the log.');
      setLogDate('');
      setLogRating(0);
      setLogNotes('');
      fetchLogs();
    }
    catch (err)
    {
      setLogMessage(err.response?.data?.error || 'Failed to log');
    }
  };

  const startEditLog = (log) =>
  {
    setEditingLogId(log.id);
    setEditLogDate(log.logged_date?.substring(0, 10) || '');
    setEditLogRating(log.rating ? parseFloat(log.rating) : 0);
    setEditLogNotes(log.notes || '');
  };

  const handleUpdateLog = async (logId) =>
  {
    try
    {
      await axios.put(`http://localhost:5000/logs/${logId}`,
        { rating: editLogRating || null, loggedDate: editLogDate, notes: editLogNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
      await axios.delete(`http://localhost:5000/logs/${logId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.25rem' }}>{media.title}</h1>
            {media.type === 'album' && <p style={{ color: 'var(--ink-soft)' }}>{media.artist} · {media.release_year}</p>}
            {media.type === 'book' && <p style={{ color: 'var(--ink-soft)' }}>{media.author} · {media.publish_year} · {media.page_count} pages</p>}
          </div>
          {averageRating && (
            <div className="stamp">{parseFloat(averageRating).toFixed(1)}</div>
          )}
        </div>
        {averageRating && <p className="entry-meta">{reviewCount} review{reviewCount !== 1 ? 's' : ''} on file</p>}

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
        <div className="card">
          <div className="card-callnumber">REVIEW SLIP</div>
          <form onSubmit={handleSubmitReview}>
            <div className="field">
              <label>Rating</label>
              <StarRating value={rating} onChange={(val) => setRating(val)} />
            </div>
            <div className="field">
              <label>Review</label>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!rating}>File review</button>
          </form>
          {message && <p className={message.includes('filed') ? 'success-text' : 'error-text'} style={{ marginTop: '0.5rem' }}>{message}</p>}
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>Reviews</h3>
      {reviews.length === 0 && <p className="empty-state">No reviews filed yet.</p>}
      {reviews.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-main">Member</span>
            <span className="col-meta">Rating</span>
          </div>
          {reviews.map((review) => (
            <div key={review.id} className="ledger-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              {editingReviewId === review.id ? (
                <div style={{ width: '100%' }}>
                  <StarRating value={editRating} onChange={setEditRating} size="1.1rem" />
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} style={{ width: '100%', marginTop: '0.4rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button className="btn btn-small btn-primary" onClick={() => handleUpdateReview(review.id)}>Save</button>
                    <button className="btn btn-small" onClick={() => setEditingReviewId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{review.username}</strong>
                    <StarRating value={parseFloat(review.rating)} readOnly size="1.1rem" />
                  </div>
                  {review.review_text && <p style={{ marginTop: '0.3rem', marginBottom: 0 }}>{review.review_text}</p>}
                  {user && user.userId === review.user_id && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <button className="btn btn-small" onClick={() => startEditReview(review)}>Edit</button>
                      <button className="btn btn-small" onClick={() => handleDeleteReview(review.id)}>Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {token && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-callnumber">{media.type === 'album' ? 'LISTEN LOG' : 'READING LOG'}</div>
          <form onSubmit={handleSubmitLog}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="field" style={{ flex: '1 1 140px' }}>
                <label>Date</label>
                <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
              </div>
              <div className="field" style={{ flex: '1 1 160px' }}>
                <label>Rating (optional)</label>
                <StarRating value={logRating} onChange={(val) => setLogRating(val)} size="1.1rem" />
              </div>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn">Stamp entry</button>
          </form>
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
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="field" style={{ flex: '1 1 140px' }}>
                      <label>Date</label>
                      <input type="date" value={editLogDate} onChange={(e) => setEditLogDate(e.target.value)} />
                    </div>
                    <div className="field" style={{ flex: '1 1 160px' }}>
                      <label>Rating</label>
                      <StarRating value={editLogRating} onChange={setEditLogRating} size="1rem" />
                    </div>
                  </div>
                  <textarea value={editLogNotes} onChange={(e) => setEditLogNotes(e.target.value)} rows={2} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button className="btn btn-small btn-primary" onClick={() => handleUpdateLog(log.id)}>Save</button>
                    <button className="btn btn-small" onClick={() => setEditingLogId(null)}>Cancel</button>
                  </div>
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
                      <button className="btn btn-small" onClick={() => startEditLog(log)}>Edit</button>
                      <button className="btn btn-small" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaDetail;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';

function Profile()
{
  const { token, user } = useAuth();
  const [tab, setTab] = useState('reviews');

  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');

  const [relogTargetId, setRelogTargetId] = useState(null);
  const [relogDate, setRelogDate] = useState('');
  const [relogRating, setRelogRating] = useState(0);
  const [relogMessage, setRelogMessage] = useState('');

  useEffect(() =>
  {
    if (user)
    {
      fetchReviews();
      fetchLogs();
    }
  }, [user]);

  const fetchReviews = async () =>
  {
    const res = await axios.get(`http://localhost:5000/reviews/user/${user.userId}`);
    setReviews(res.data.reviews);
  };

  const fetchLogs = async () =>
  {
    const res = await axios.get(`http://localhost:5000/logs/user/${user.userId}`);
    setLogs(res.data.logs);
  };

  const startEditReview = (review) =>
  {
    setEditingReviewId(review.id);
    setEditRating(parseFloat(review.rating));
    setEditText(review.review_text || '');
  };

  const handleUpdateReview = async (reviewId) =>
  {
    await axios.put(`http://localhost:5000/reviews/${reviewId}`,
      { rating: editRating, reviewText: editText },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEditingReviewId(null);
    fetchReviews();
  };

  const handleDeleteReview = async (reviewId) =>
  {
    await axios.delete(`http://localhost:5000/reviews/${reviewId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchReviews();
  };

  const handleDeleteLog = async (logId) =>
  {
    await axios.delete(`http://localhost:5000/logs/${logId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchLogs();
  };

  const openRelog = (mediaId) =>
  {
    setRelogTargetId(mediaId);
    setRelogDate(new Date().toISOString().substring(0, 10));
    setRelogRating(0);
    setRelogMessage('');
  };

  const handleRelog = async (mediaId) =>
  {
    try
    {
      await axios.post('http://localhost:5000/logs',
        { mediaId, rating: relogRating || null, loggedDate: relogDate, notes: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRelogMessage('Logged again.');
      setRelogTargetId(null);
      fetchLogs();
    }
    catch (err)
    {
      setRelogMessage(err.response?.data?.error || 'Failed to log');
    }
  };

  if (!user)
  {
    return <div className="page"><p className="empty-state">Log in to see your shelf.</p></div>;
  }

  return (
    <div className="page">
      <span className="eyebrow">Member File</span>
      <h1>{user.username}'s Shelf</h1>

      <div className="type-toggle">
        <button className={tab === 'reviews' ? 'active-music' : ''} onClick={() => setTab('reviews')}>Reviews</button>
        <button className={tab === 'logs' ? 'active-book' : ''} onClick={() => setTab('logs')}>Activity Log</button>
      </div>

      {tab === 'reviews' && (
        <>
          {reviews.length === 0 && <p className="empty-state">No reviews filed yet.</p>}
          {reviews.length > 0 && (
            <div className="ledger">
              <div className="ledger-head">
                <span className="col-main">Title</span>
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
                        <Link to={`/media/${review.media_id}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{review.title}</Link>
                        <StarRating value={parseFloat(review.rating)} readOnly size="1.1rem" />
                      </div>
                      {review.review_text && <p style={{ marginTop: '0.3rem', marginBottom: 0 }}>{review.review_text}</p>}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                        <button className="btn btn-small" onClick={() => startEditReview(review)}>Edit</button>
                        <button className="btn btn-small" onClick={() => handleDeleteReview(review.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'logs' && (
        <>
          {logs.length === 0 && <p className="empty-state">No entries yet.</p>}
          {logs.length > 0 && (
            <div className="ledger">
              <div className="ledger-head">
                <span className="col-num">Date</span>
                <span className="col-main">Title</span>
                <span className="col-meta">Rating</span>
              </div>
              {logs.map((log) => (
                <div key={log.id} className="ledger-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ width: '100%', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="col-num">{log.logged_date?.substring(0, 10)}</span>
                    <Link to={`/media/${log.media_id}`} className="col-main">{log.title}</Link>
                    <span className="col-meta">{log.rating ? <StarRating value={parseFloat(log.rating)} readOnly size="0.9rem" /> : '—'}</span>
                    <span style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-small" onClick={() => openRelog(log.media_id)}>Log again</button>
                      <button className="btn btn-small" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                    </span>
                  </div>

                  {relogTargetId === log.media_id && (
                    <div style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--line)' }}>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="field" style={{ flex: '1 1 140px' }}>
                          <label>Date</label>
                          <input type="date" value={relogDate} onChange={(e) => setRelogDate(e.target.value)} />
                        </div>
                        <div className="field" style={{ flex: '1 1 160px' }}>
                          <label>Rating (optional)</label>
                          <StarRating value={relogRating} onChange={setRelogRating} size="1rem" />
                        </div>
                        <button className="btn btn-small btn-primary" onClick={() => handleRelog(log.media_id)}>Confirm</button>
                        <button className="btn btn-small" onClick={() => setRelogTargetId(null)}>Cancel</button>
                      </div>
                      {relogMessage && <p className="success-text">{relogMessage}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Profile;
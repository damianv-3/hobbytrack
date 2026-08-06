import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreference } from '../context/PreferenceContext.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import StarRating from '../components/StarRating.jsx';

function Profile()
{
  const { token, user } = useAuth();
  const { mediaPreference, setMediaPreference } = usePreference();
  const { refreshKey } = useDataRefresh();

  const [tab, setTab] = useState('reviews');
  const [profileInfo, setProfileInfo] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  const [clubs, setClubs] = useState([]);
  const [clubPage, setClubPage] = useState(1);
  const [clubTotalPages, setClubTotalPages] = useState(1);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');

  const [relogTargetId, setRelogTargetId] = useState(null);
  const [relogDate, setRelogDate] = useState('');
  const [relogRating, setRelogRating] = useState(0);
  const [relogMessage, setRelogMessage] = useState('');

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followerList, setFollowerList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  useEffect(() =>
  {
    if (user)
    {
      fetchProfileInfo();
    }
  }, [user, refreshKey]);

  useEffect(() =>
  {
    if (user) fetchReviews();
  }, [user, refreshKey, reviewPage]);

  useEffect(() =>
  {
    if (user) fetchLogs();
  }, [user, refreshKey, logPage]);

  useEffect(() =>
  {
    if (user) fetchClubs();
  }, [user, refreshKey, clubPage]);

  const fetchProfileInfo = async () =>
  {
    const res = await axios.get(`http://localhost:5000/users/${user.userId}`);
    setProfileInfo(res.data);
  };

  const fetchReviews = async () =>
  {
    const res = await axios.get(`http://localhost:5000/reviews/user/${user.userId}`, { params: { page: reviewPage, limit: 8 } });
    setReviews(res.data.reviews);
    setReviewTotalPages(res.data.pagination.totalPages);
  };

  const fetchLogs = async () =>
  {
    const res = await axios.get(`http://localhost:5000/logs/user/${user.userId}`, { params: { page: logPage, limit: 8 } });
    setLogs(res.data.logs);
    setLogTotalPages(res.data.pagination.totalPages);
  };

  const fetchClubs = async () =>
  {
    const res = await axios.get(`http://localhost:5000/clubs/user/${user.userId}`, { params: { page: clubPage, limit: 8 } });
    setClubs(res.data.clubs);
    setClubTotalPages(res.data.pagination.totalPages);
  };

  const openFollowers = async () =>
  {
    const res = await axios.get(`http://localhost:5000/users/${user.userId}/followers`);
    setFollowerList(res.data.followers);
    setShowFollowers(true);
  };

  const openFollowing = async () =>
  {
    const res = await axios.get(`http://localhost:5000/users/${user.userId}/following`);
    setFollowingList(res.data.following);
    setShowFollowing(true);
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
    await axios.delete(`http://localhost:5000/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchReviews();
  };

  const handleDeleteLog = async (logId) =>
  {
    await axios.delete(`http://localhost:5000/logs/${logId}`, { headers: { Authorization: `Bearer ${token}` } });
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

  const filteredReviews = reviews.filter((r) => mediaPreference === 'both' || r.type === mediaPreference);
  const filteredLogs = logs.filter((l) => mediaPreference === 'both' || l.type === mediaPreference);
  const filteredClubs = clubs.filter((c) => mediaPreference === 'both' || c.focus_type === mediaPreference || c.focus_type === 'both');

  const memberSince = profileInfo
    ? new Date(profileInfo.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="page">
      <span className="eyebrow">Member File</span>

      <div className="libcard">
        <div className="libcard-top">
          <div className="libcard-photo">{user.username.charAt(0).toUpperCase()}</div>
          <div>
            <h1 style={{ marginBottom: '0.15rem' }}>{user.username}</h1>
            <p className="entry-meta" style={{ marginBottom: 0 }}>Member since {memberSince}</p>
          </div>
        </div>

        {profileInfo && (
          <div className="libcard-stats">
            <div className="stat-static">
              <strong>{profileInfo.reviewCount}</strong>
              Reviews
            </div>
            <div className="stat-static">
              <strong>{profileInfo.logCount}</strong>
              Logs
            </div>
            <div className="stat-static">
              <strong>{profileInfo.clubCount}</strong>
              Clubs
            </div>
            <button className="stat-btn" onClick={openFollowers}>
              <strong>{profileInfo.followerCount}</strong>
              Followers
            </button>
            <button className="stat-btn" onClick={openFollowing}>
              <strong>{profileInfo.followingCount}</strong>
              Following
            </button>
          </div>
        )}
      </div>

      {(showFollowers || showFollowing) && (
        <div className="modal-overlay" onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>✕ Close</button>
            <div className="card-callnumber">{showFollowers ? 'FOLLOWERS' : 'FOLLOWING'}</div>
            <h2 style={{ fontSize: '1.3rem' }}>{showFollowers ? 'People who follow you' : 'People you follow'}</h2>

            {(showFollowers ? followerList : followingList).length === 0 && (
              <p className="empty-state">Nobody here yet.</p>
            )}
            {(showFollowers ? followerList : followingList).map((person) => (
              <div key={person.id} className="entry-row">{person.username}</div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-callnumber">SHELF PREFERENCE</div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>Choose what your shelf shows by default. Saved to this browser.</p>
        <div className="type-toggle">
          <button className={mediaPreference === 'both' ? 'active-music' : ''} onClick={() => setMediaPreference('both')}>Both</button>
          <button className={mediaPreference === 'album' ? 'active-music' : ''} onClick={() => setMediaPreference('album')}>Music only</button>
          <button className={mediaPreference === 'book' ? 'active-book' : ''} onClick={() => setMediaPreference('book')}>Books only</button>
        </div>
      </div>

      <div className="type-toggle">
        <button className={tab === 'reviews' ? 'active-music' : ''} onClick={() => setTab('reviews')}>Reviews</button>
        <button className={tab === 'logs' ? 'active-book' : ''} onClick={() => setTab('logs')}>Activity Log</button>
        <button className={tab === 'clubs' ? 'active-music' : ''} onClick={() => setTab('clubs')}>Clubs</button>
      </div>

      {tab === 'reviews' && (
        <>
          {filteredReviews.length === 0 && <p className="empty-state">No reviews filed yet.</p>}
          {filteredReviews.length > 0 && (
            <div className="ledger">
              <div className="ledger-head">
                <span className="col-main">Title</span>
                <span className="col-meta">Rating</span>
              </div>
              {filteredReviews.map((review) => (
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
          {reviews.length > 0 && reviewTotalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-small" disabled={reviewPage <= 1} onClick={() => setReviewPage(reviewPage - 1)}>Prev</button>
              <span>Page {reviewPage} of {reviewTotalPages}</span>
              <button className="btn btn-small" disabled={reviewPage >= reviewTotalPages} onClick={() => setReviewPage(reviewPage + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {tab === 'logs' && (
        <>
          {filteredLogs.length === 0 && <p className="empty-state">No entries yet.</p>}
          {filteredLogs.length > 0 && (
            <div className="ledger">
              <div className="ledger-head">
                <span className="col-num">Date</span>
                <span className="col-main">Title</span>
                <span className="col-meta">Rating</span>
              </div>
              {filteredLogs.map((log) => (
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
          {logs.length > 0 && logTotalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-small" disabled={logPage <= 1} onClick={() => setLogPage(logPage - 1)}>Prev</button>
              <span>Page {logPage} of {logTotalPages}</span>
              <button className="btn btn-small" disabled={logPage >= logTotalPages} onClick={() => setLogPage(logPage + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {tab === 'clubs' && (
        <>
          {filteredClubs.length === 0 && <p className="empty-state">Not a member of any clubs yet.</p>}
          {filteredClubs.length > 0 && (
            <div className="ledger">
              <div className="ledger-head">
                <span className="col-main">Club</span>
                <span className="col-meta">Role</span>
              </div>
              {filteredClubs.map((club) => (
                <Link key={club.id} to={`/clubs/${club.id}`} className="ledger-row linked">
                  <span className="col-main">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{club.name}</span>
                    <span className="entry-meta" style={{ display: 'block', textTransform: 'capitalize' }}>{club.focus_type} focus</span>
                  </span>
                  <span className="col-meta" style={{ textTransform: 'capitalize' }}>{club.role}</span>
                </Link>
              ))}
            </div>
          )}
          {clubs.length > 0 && clubTotalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-small" disabled={clubPage <= 1} onClick={() => setClubPage(clubPage - 1)}>Prev</button>
              <span>Page {clubPage} of {clubTotalPages}</span>
              <button className="btn btn-small" disabled={clubPage >= clubTotalPages} onClick={() => setClubPage(clubPage + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Profile;
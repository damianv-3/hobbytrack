import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreference } from '../context/PreferenceContext.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { getUser, getFollowers, getFollowing } from '../api/users.js';
import { getLogsForUser, deleteLog, createLog } from '../api/logs.js';
import { getClubsForUser } from '../api/clubs.js';
import StarRating from '../components/StarRating.jsx';
import Pagination from '../components/Pagination.jsx';

function Profile()
{
  const { token, user } = useAuth();
  const { mediaPreference, setMediaPreference } = usePreference();
  const { refreshKey } = useDataRefresh();

  const [tab, setTab] = useState('logs');
  const [profileInfo, setProfileInfo] = useState(null);

  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  const [clubs, setClubs] = useState([]);
  const [clubPage, setClubPage] = useState(1);
  const [clubTotalPages, setClubTotalPages] = useState(1);

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
    if (user) fetchProfileInfo();
  }, [user, refreshKey]);

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
    const res = await getUser(user.userId);
    setProfileInfo(res.data);
  };

  const fetchLogs = async () =>
  {
    const res = await getLogsForUser(user.userId, logPage, 8);
    setLogs(res.data.logs);
    setLogTotalPages(res.data.pagination.totalPages);
  };

  const fetchClubs = async () =>
  {
    const res = await getClubsForUser(user.userId, clubPage, 8);
    setClubs(res.data.clubs);
    setClubTotalPages(res.data.pagination.totalPages);
  };

  const openFollowers = async () =>
  {
    const res = await getFollowers(user.userId);
    setFollowerList(res.data.followers);
    setShowFollowers(true);
  };

  const openFollowing = async () =>
  {
    const res = await getFollowing(user.userId);
    setFollowingList(res.data.following);
    setShowFollowing(true);
  };

  const handleDeleteLog = async (logId) =>
  {
    await deleteLog(token, logId);
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
      await createLog(token, { mediaId, rating: relogRating, loggedDate: relogDate, notes: '' });
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
        <button className={tab === 'logs' ? 'active-book' : ''} onClick={() => setTab('logs')}>Activity Log</button>
        <button className={tab === 'clubs' ? 'active-music' : ''} onClick={() => setTab('clubs')}>Clubs</button>
      </div>

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
              <Pagination page={logPage} totalPages={logTotalPages} onChange={setLogPage} />
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
              <Pagination page={clubPage} totalPages={clubTotalPages} onChange={setClubPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Profile;
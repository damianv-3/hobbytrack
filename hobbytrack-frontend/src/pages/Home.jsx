import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { searchUsers, getFollowing, followUser, unfollowUser } from '../api/users.js';
import { getFeed } from '../api/feed.js';
import StarRating from '../components/StarRating.jsx';
import Pagination from '../components/Pagination.jsx';
import { timeAgo } from '../utils/timeAgo.js';

function Home()
{
  const { user, token } = useAuth();
  const { refreshKey } = useDataRefresh();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [following, setFollowing] = useState([]);
  const [feed, setFeed] = useState([]);
  const [searchMsg, setSearchMsg] = useState('');
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotalPages, setFeedTotalPages] = useState(1);

  useEffect(() =>
  {
    if (user)
    {
      fetchFollowing();
      fetchFeed();
    }
  }, [user, refreshKey, feedPage]);

  const fetchFollowing = async () =>
  {
    const res = await getFollowing(user.userId);
    setFollowing(res.data.following);
  };

  const fetchFeed = async () =>
  {
    const res = await getFeed(token, feedPage, 15);
    setFeed(res.data.entries);
    setFeedTotalPages(res.data.pagination.totalPages);
  };

  const handleSearch = async (e) =>
  {
    e.preventDefault();
    setSearchMsg('');

    const res = await searchUsers(query);
    setResults(res.data.users.filter((u) => u.id !== user.userId));
  };

  const isFollowing = (id) => following.some((f) => f.id === id);

  const handleFollow = async (id) =>
  {
    try
    {
      await followUser(token, id);
      fetchFollowing();
      fetchFeed();
    }
    catch (err)
    {
      setSearchMsg(err.response?.data?.error || 'Failed to follow');
    }
  };

  const handleUnfollow = async (id) =>
  {
    await unfollowUser(token, id);
    fetchFollowing();
    fetchFeed();
  };

  if (!user)
  {
    return (
      <div className="page">
        <h1>Two forms of media. One ledger.</h1>
        <p style={{ maxWidth: '480px', color: 'var(--ink-soft)' }}>
          Ledgible keeps a running ledger of everything you listen to and everything you read:
          rate it, log it, and file it under your own system.
        </p>
        <Link to="/register" className="btn btn-primary">Start your ledger</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <span className="eyebrow">Front Desk</span>
      <h1>Welcome back, {user.username}</h1>

      <div className="card">
        <div className="card-callnumber">FIND MEMBERS</div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            style={{ flex: 1, padding: '0.55rem 0.7rem', border: '1.5px solid var(--line)', borderRadius: '3px', background: 'var(--paper)' }}
          />
          <button type="submit" className="btn">Search</button>
        </form>
        {searchMsg && <p className="error-text" style={{ marginTop: '0.5rem' }}>{searchMsg}</p>}
        {results.map((result) => (
          <div key={result.id} className="entry-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{result.username}</span>
            {isFollowing(result.id)
              ? <button className="btn btn-small" onClick={() => handleUnfollow(result.id)}>Following</button>
              : <button className="btn btn-small btn-primary" onClick={() => handleFollow(result.id)}>Follow</button>}
          </div>
        ))}
        <Pagination page={feedPage} totalPages={feedTotalPages} onChange={setFeedPage} />
      </div>

      <h3 style={{ marginTop: '2rem' }}>Activity from members you follow</h3>
      {following.length === 0 && <p className="empty-state">You're not following anyone yet — search above to find members.</p>}
      {following.length > 0 && feed.length === 0 && <p className="empty-state">Nothing filed yet by the members you follow.</p>}

      {feed.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-main">Activity</span>
            <span className="col-meta">Rating</span>
          </div>
          {feed.map((entry) => (
            <div key={entry.id} className="ledger-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>{entry.username}</strong>
                  <span className="entry-meta"> logged </span>
                  <Link to={`/media/${entry.media_id}`} style={{ fontFamily: 'var(--font-display)' }}>{entry.title}</Link>
                  <span className="entry-meta"> · {timeAgo(entry.activity_date)}</span>
                </span>
                {entry.rating && <StarRating value={parseFloat(entry.rating)} readOnly size="1rem" />}
              </div>
              {entry.notes && <p style={{ marginTop: '0.3rem', marginBottom: 0 }}>{entry.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
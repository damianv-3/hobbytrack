import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getClubs, createClub } from '../api/clubs.js';
import Pagination from '../components/Pagination.jsx';

function Clubs()
{
  const { token } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [focusFilter, setFocusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [focusType, setFocusType] = useState('both');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() =>
  {
    fetchClubs();
  }, [focusFilter, page]);

  const fetchClubs = async () =>
  {
    try
    {
      const res = await getClubs(focusFilter || undefined, page, 10);
      setClubs(res.data.clubs);
      setTotalPages(res.data.pagination.totalPages);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleCreate = async (e) =>
  {
    e.preventDefault();
    setMessage('');

    try
    {
      await createClub(token, { name, description, focusType });
      setMessage('Club chartered.');
      setName('');
      setDescription('');
      setFocusType('both');
      setShowForm(false);
      fetchClubs();
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Failed to create club');
    }
  };

  return (
    <div className="page">
      <h1>Clubs</h1>

      <div className="type-toggle">
        <button className={focusFilter === '' ? 'active-music' : ''} onClick={() => { setFocusFilter(''); setPage(1); }}>All</button>
        <button className={focusFilter === 'album' ? 'active-music' : ''} onClick={() => { setFocusFilter('album'); setPage(1); }}>Music</button>
        <button className={focusFilter === 'book' ? 'active-book' : ''} onClick={() => { setFocusFilter('book'); setPage(1); }}>Books</button>
      </div>

      {token && (
        <div className="card">
          <div className="card-callnumber">CHARTER A NEW CLUB</div>
          {!showForm
            ? <button className="btn" onClick={() => setShowForm(true)}>Start a club</button>
            : (
              <form onSubmit={handleCreate}>
                <div className="field">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <div className="field">
                  <label>Focus</label>
                  <select value={focusType} onChange={(e) => setFocusType(e.target.value)} style={{ padding: '0.5rem', border: '1.5px solid var(--line)', borderRadius: '3px', background: 'var(--paper)' }}>
                    <option value="both">Both</option>
                    <option value="album">Music only</option>
                    <option value="book">Books only</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">Charter it</button>
                  <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          {message && <p className="success-text" style={{ marginTop: '0.5rem' }}>{message}</p>}
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>Chartered clubs</h3>
      {clubs.length === 0 && <p className="empty-state">No clubs here yet.</p>}
      {clubs.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-main">Name</span>
            <span className="col-meta">Focus</span>
          </div>
          {clubs.map((club) => (
            <Link key={club.id} to={`/clubs/${club.id}`} className="ledger-row linked">
              <span className="col-main">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{club.name}</span>
                {club.description && <span className="entry-meta" style={{ display: 'block' }}>{club.description}</span>}
              </span>
              <span className="col-meta" style={{ textTransform: 'capitalize' }}>{club.focus_type}</span>
            </Link>
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export default Clubs;
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Home()
{
  const { user } = useAuth();

  return (
    <div className="page">
      <span className="eyebrow">Personal Catalog · Est. Today</span>
      <h1>Two shelves. One ledger.</h1>
      <p style={{ maxWidth: '480px', color: 'var(--ink-soft)' }}>
        HobbyTrack keeps a running ledger of everything you listen to and everything you read —
        rate it, log every revisit, and file it under your own system.
      </p>

      {user
        ? <Link to="/browse" className="btn btn-primary">Open the catalog</Link>
        : <Link to="/register" className="btn btn-primary">Start your ledger</Link>}

      <div className="corkboard">
        <div className="poster rot-1">
          <div className="poster-headline" style={{ color: 'var(--music)' }}>Now<br />Spinning</div>
          <div className="poster-sub">Albums &amp; tracklists</div>
        </div>
        <div className="poster rot-2">
          <div className="poster-headline" style={{ color: 'var(--books)' }}>On The<br />Nightstand</div>
          <div className="poster-sub">Books &amp; rereads</div>
        </div>
        <div className="poster rot-3">
          <div className="poster-headline" style={{ color: 'var(--brass-dark)' }}>Every<br />Revisit</div>
          <div className="poster-sub">Logged by date</div>
        </div>
      </div>
    </div>
  );
}

export default Home;
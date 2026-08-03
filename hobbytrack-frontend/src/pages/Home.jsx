import { useAuth } from '../context/AuthContext.jsx';

function Home()
{
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto' }}>
      <h1>HobbyTrack</h1>
      {user
        ? <p>Welcome back, {user.username}!</p>
        : <p>Please log in to get started.</p>}
    </div>
  );
}

export default Home;
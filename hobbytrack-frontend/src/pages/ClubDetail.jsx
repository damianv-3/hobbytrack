import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getClub, getMeetings, joinClub, leaveClub, deleteClub, scheduleMeeting } from '../api/clubs.js';

function ClubDetail()
{
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [message, setMessage] = useState('');

  const [mediaId, setMediaId] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [meetingMessage, setMeetingMessage] = useState('');

  const myMembership = club?.members?.find((m) => m.id === user?.userId);
  const isOwner = myMembership?.role === 'owner';
  const isMember = !!myMembership;

  useEffect(() =>
  {
    fetchClub();
    fetchMeetings();
  }, [id]);

  const fetchClub = async () =>
  {
    try
    {
      const res = await getClub(id);
      setClub(res.data);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const fetchMeetings = async () =>
  {
    try
    {
      const res = await getMeetings(id);
      setMeetings(res.data.meetings);
    }
    catch (err)
    {
      console.error(err);
    }
  };

  const handleJoin = async () =>
  {
    setMessage('');
    try
    {
      await joinClub(token, id);
      fetchClub();
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Failed to join');
    }
  };

  const handleLeave = async () =>
  {
    setMessage('');
    try
    {
      await leaveClub(token, id);
      fetchClub();
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Failed to leave');
    }
  };

  const handleDeleteClub = async () =>
  {
    try
    {
      await deleteClub(token, id);
      navigate('/clubs');
    }
    catch (err)
    {
      setMessage(err.response?.data?.error || 'Failed to delete club');
    }
  };

  const handleScheduleMeeting = async (e) =>
  {
    e.preventDefault();
    setMeetingMessage('');

    try
    {
      await scheduleMeeting(token, id, { mediaId, meetingDate, notes });
      setMeetingMessage('Meeting scheduled.');
      setMediaId('');
      setMeetingDate('');
      setNotes('');
      fetchMeetings();
    }
    catch (err)
    {
      setMeetingMessage(err.response?.data?.error || 'Failed to schedule meeting');
    }
  };

  if (!club)
  {
    return <div className="page"><p className="empty-state">Pulling the file...</p></div>;
  }

  return (
    <div className="page">
      <div className="card">
        <div className="card-callnumber" style={{ textTransform: 'capitalize' }}>
          CLUB · {club.focus_type} FOCUS
        </div>
        <h1>{club.name}</h1>
        {club.description && <p style={{ color: 'var(--ink-soft)' }}>{club.description}</p>}

        {token && !isMember && <button className="btn btn-primary" onClick={handleJoin}>Join club</button>}
        {token && isMember && !isOwner && <button className="btn" onClick={handleLeave}>Leave club</button>}
        {isOwner && <button className="btn" onClick={handleDeleteClub} style={{ marginLeft: isMember ? '0.5rem' : 0 }}>Disband club</button>}
        {message && <p className="error-text" style={{ marginTop: '0.5rem' }}>{message}</p>}
      </div>

      <h3>Members</h3>
      <div className="ledger">
        <div className="ledger-head">
          <span className="col-main">Member</span>
          <span className="col-meta">Role</span>
        </div>
        {club.members.map((member) => (
          <div key={member.id} className="ledger-row">
            <span className="col-main">{member.username}</span>
            <span className="col-meta" style={{ textTransform: 'capitalize' }}>{member.role}</span>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-callnumber">SCHEDULE A MEETING</div>
          <form onSubmit={handleScheduleMeeting}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Media ID (optional — from a media page URL)</label>
              <input type="number" value={mediaId} onChange={(e) => setMediaId(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <button type="submit" className="btn btn-primary">Schedule</button>
          </form>
          {meetingMessage && <p className="success-text" style={{ marginTop: '0.5rem' }}>{meetingMessage}</p>}
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>Meetings</h3>
      {meetings.length === 0 && <p className="empty-state">No meetings scheduled yet.</p>}
      {meetings.length > 0 && (
        <div className="ledger">
          <div className="ledger-head">
            <span className="col-num">Date</span>
            <span className="col-main">Notes</span>
          </div>
          {meetings.map((meeting) => (
            <div key={meeting.id} className="ledger-row">
              <span className="col-num">{meeting.meeting_date?.substring(0, 10)}</span>
              <span className="col-main">
                {meeting.media_title && <strong>{meeting.media_title}</strong>}
                {meeting.notes && <span style={{ color: 'var(--ink-soft)' }}> — {meeting.notes}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClubDetail;
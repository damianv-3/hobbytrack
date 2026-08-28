import { useState } from 'react';
import StarRating from './StarRating.jsx';

function LogForm({ initialDate = '', initialRating = 0, initialNotes = '', onSubmit, submitLabel = 'Stamp entry' })
{
  const [date, setDate] = useState(initialDate);
  const [rating, setRating] = useState(initialRating);
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = (e) =>
  {
    e.preventDefault();
    onSubmit({ loggedDate: date, rating: rating || null, notes });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="stack-row">
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: '1 1 160px' }}>
          <label>Rating (optional)</label>
          <StarRating value={rating} onChange={setRating} size="1.1rem" />
        </div>
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <button type="submit" className="btn btn-primary">{submitLabel}</button>
    </form>
  );
}

export default LogForm;
function StarRating({ value, onChange, readOnly = false, size = '1.4rem' })
{
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (starNumber, half) =>
  {
    if (readOnly) return;
    const newValue = half === 'left' ? starNumber - 0.5 : starNumber;
    onChange(newValue);
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
      <span className="star-rating" style={{ fontSize: size }}>
        {stars.map((starNumber) =>
        {
          let fillPercent = 0;
          if (value >= starNumber) fillPercent = 100;
          else if (value >= starNumber - 0.5) fillPercent = 50;

          return (
            <span className="star-cell" key={starNumber}>
              <span className="star-base">★</span>
              <span className="star-fill" style={{ width: `${fillPercent}%` }}>★</span>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    className="star-hit star-hit-left"
                    aria-label={`Rate ${starNumber - 0.5} stars`}
                    onClick={() => handleClick(starNumber, 'left')}
                  />
                  <button
                    type="button"
                    className="star-hit star-hit-right"
                    aria-label={`Rate ${starNumber} stars`}
                    onClick={() => handleClick(starNumber, 'right')}
                  />
                </>
              )}
            </span>
          );
        })}
      </span>
      {!readOnly && <span className="star-value-text">{value ? `${value} / 5` : 'Tap a star'}</span>}
    </span>
  );
}

export default StarRating;
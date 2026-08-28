function errorHandler(err, req, res, next)
{
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY')
  {
    return res.status(409).json({ error: 'Already exists' });
  }
  if (err.message?.includes('CONSTRAINT'))
  {
    return res.status(400).json({ error: 'Rating must be between 0.5 and 5.0, in half-star increments' });
  }

  res.status(500).json({ error: 'Server error' });
}

module.exports = errorHandler;
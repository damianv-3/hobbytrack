const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) 
{
  const authHeader = req.headers['authorization'];

  if (!authHeader) 
    {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) 
    {
    return res.status(401).json({ error: 'Malformed token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => 
    {
    if (err) 
        {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded; // Attach user ID and username to request
    next();
  });
}

module.exports = verifyToken;
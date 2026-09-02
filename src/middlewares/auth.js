function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!apiKey || apiKey!== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  console.log('[Auth] Authenticated request');
  next();
}

module.exports = authMiddleware;
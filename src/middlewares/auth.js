// Simple API Key auth - like FastAPI's APIKeyHeader
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'my_secret_key_123';

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  if (apiKey !== validKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  console.log(`[Auth] Authenticated request`);
  next();
}

module.exports = { apiKeyAuth };
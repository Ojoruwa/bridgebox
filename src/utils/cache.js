// Simple in-memory cache - no Redis needed for now
const cache = new Map();

function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function set(key, value, ttlSeconds = 60) {
  const expiry = Date.now() + (ttlSeconds * 1000);
  cache.set(key, { value, expiry });
}

module.exports = { get, set, cache };
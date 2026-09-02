const express = require('express');
const { callWithRetry } = require('../services/externalCaller');
const cache = require('../utils/cache');
const { addJob, loadQueue } = require('../services/queue');
const prisma = require('../services/db');

const router = express.Router();

// Rate Limiter
const rateLimitStore = new Map();
function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 10;
  let record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
  } else {
    record.count++;
  }
  rateLimitStore.set(ip, record);
  if (record.count > max) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}

router.post('/call', rateLimiter, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const start = Date.now();
  try {
    const cached = cache.get(url);
    if (cached) {
      await prisma.apiLog.create({ data: { url, fromCache: true, status: 'success', durationMs: Date.now() - start } });
      return res.json({ success: true, fromCache: true, source: url, data: cached });
    }
    const data = await callWithRetry(url, { method: 'GET' });
    const ttl = parseInt(process.env.CACHE_TTL_SECONDS) || 60;
    cache.set(url, data, ttl);
    await prisma.apiLog.create({ data: { url, fromCache: false, status: 'success', durationMs: Date.now() - start } });
    res.json({ success: true, fromCache: false, source: url, data });
  } catch (err) {
    await prisma.apiLog.create({ data: { url, fromCache: false, status: 'failed', durationMs: Date.now() - start } }).catch(()=>{});
    res.status(502).json({ success: false, error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  const eventId = req.headers['x-event-id'] || req.body?.eventId || `evt_${Date.now()}`;
  const payload = req.body || {};
  if (cache.get(`event:${eventId}`)) {
    await prisma.webhookEvent.create({ data: { eventId, type: payload?.type, payload, status: 'duplicate' } }).catch(()=>{});
    return res.json({ received: true, duplicate: true, eventId });
  }
  cache.set(`event:${eventId}`, true, 3600);
  try {
    if (payload.shouldFail === true) throw new Error("Simulated failure");
    await prisma.webhookEvent.create({ data: { eventId, type: payload?.type, payload, status: 'processed' } });
    res.json({ received: true, eventId });
  } catch (err) {
    await prisma.webhookEvent.create({ data: { eventId, type: payload?.type, payload, status: 'queued' } }).catch(()=>{});
    await addJob({ type: 'webhook_retry', payload, originalEventId: eventId });
    res.json({ received: true, queued: true, eventId });
  }
});

router.get('/queue', (req, res) => {
  const queue = loadQueue();
  res.json({ total: queue.length, jobs: queue });
});

// THIS WAS MISSING - now added
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.apiLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    const webhooks = await prisma.webhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    res.json({ apiLogs: logs, webhookEvents: webhooks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
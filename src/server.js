require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authMiddleware = require('./middlewares/auth');
const bridgeRoutes = require('./routes/bridge');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve landing page from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Health check for Render + keeps JSON for backwards compatibility
app.get('/health', (req, res) => {
  res.json({
    name: 'BridgeBox Global',
    status: 'live',
    location: 'Ibadan -> Global',
    db: 'Neon Postgres',
    endpoints: ['/api/bridge/call', '/api/bridge/webhook', '/api/bridge/queue', '/api/bridge/logs']
  });
});

// API routes (secured)
app.use('/api/bridge', authMiddleware, bridgeRoutes);

// Fallback - serve landing page for any non-API route
app.get('*', (req, res) => {
  // If API route, 404 json
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  // Otherwise serve landing page
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BridgeBox GLOBAL: http://0.0.0.0:${PORT}`);
  console.log(`🔑 API Key: ${process.env.API_KEY}`);
  console.log(`🌍 Landing: http://0.0.0.0:${PORT}/`);
});
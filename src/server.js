require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middlewares/auth');
const bridgeRoutes = require('./routes/bridge');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    name: 'BridgeBox Global', 
    status: 'live',
    location: 'Ibadan -> Global',
    endpoints: ['/api/bridge/call', '/api/bridge/webhook', '/api/bridge/queue', '/api/bridge/logs'] 
  });
});

app.use('/api/bridge', authMiddleware, bridgeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BridgeBox GLOBAL: http://0.0.0.0:${PORT}`);
  console.log(`🔑 API Key: ${process.env.API_KEY}`);
});
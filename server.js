// server.js
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const PAIRS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt'];
const streams = PAIRS.map(pair => `${pair}@trade`).join('/');
const wsUrl = `wss://data-stream.binance.vision:9443/stream?streams=${streams}`;

const lastPrices = {};

function connectBinance() {
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('Connecte au flux Binance en temps reel');
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      const trade = parsed.data;
      if (trade && trade.s && trade.p) {
        lastPrices[trade.s] = {
          price: parseFloat(trade.p).toFixed(2),
          time: new Date(trade.T).toISOString()
        };
      }
    } catch (err) {
      console.error('Erreur de traitement du message Binance :', err.message);
    }
  });

  ws.on('error', (err) => console.error('Erreur WebSocket Binance :', err.message));

  ws.on('close', () => {
    console.log('Flux Binance ferme. Reconnexion dans 3 secondes...');
    setTimeout(connectBinance, 3000);
  });
}

connectBinance();

app.get('/', (req, res) => {
  res.json({ message: 'Bani SaaS backend en ligne', endpoints: ['/api/health', '/api/prices'] });
});

app.get('/api/prices', (req, res) => {
  res.json({
    updated: new Date().toISOString(),
    prices: lastPrices
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pairs: PAIRS });
});

app.listen(PORT, () => {
  console.log(`Serveur Baniakissa en ecoute sur le port ${PORT}`);
});

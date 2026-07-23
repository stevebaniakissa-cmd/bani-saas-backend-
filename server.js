// server.js
// Baniakissa Corporation - Backend unique : prix crypto en direct + futur VIP
// Combine le flux Binance WebSocket avec un petit serveur web (API + page statique)

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors()); // autorise index.html (sur un autre domaine) à lire cette API
const PORT = process.env.PORT || 3000;

// ---- Partie 1 : connexion au flux Binance ----
const PAIRS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt'];
const streams = PAIRS.map(pair => `${pair}@trade`).join('/');
const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

const lastPrices = {};

function connectBinance() {
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✅ Connecté au flux Binance en temps réel');
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

  ws.on('error', (err) => console.error('❌ Erreur WebSocket Binance :', err.message));

  ws.on('close', () => {
    console.log('⚠️  Flux Binance fermé. Reconnexion dans 3 secondes...');
    setTimeout(connectBinance, 3000);
  });
}

connectBinance();

// ---- Partie 2 : API web pour que index.html lise les prix ----

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
  console.log(`🚀 Serveur Baniakissa en écoute sur le port ${PORT}`);
});

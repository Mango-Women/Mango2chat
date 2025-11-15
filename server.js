const express = require('express');
const { Server } = require('ws');
const app = express();

// Health check
app.get('/', (req, res) => {
  res.send('Mango Signaling Server IS ALIVE');
});

// Create HTTP server first
const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`Server running on port ${process.env.PORT || 8080}`);
});

// Attach WebSocket to the same server
const wss = new Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const from = msg.from;
      if (from) clients.set(from, ws);

      const targetId = from === 'mango1' ? 'mango2' : 'mango1';
      const target = clients.get(targetId);

      if (target && target.readyState === target.OPEN) {
        target.send(data);
        console.log(`Forwarded from ${from} → ${targetId}`);
      }
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    for (let [id, socket] of clients) {
      if (socket === ws) {
        clients.delete(id);
        break;
      }
    }
  });
});

// Keep Render awake
setInterval(() => {
  fetch(`https://${process.env.RENDER_EXTERNAL_URL || 'mango2achat.onrender.com.onrender.com'}`)
    .catch(() => {});
}, 10 * 60 * 1000);

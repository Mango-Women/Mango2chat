const express = require('express');
const { Server } = require('ws');
const app = express();

// Serve a tiny page so Render knows it's alive
app.get('/', (req, res) => res.send('Mango Signaling Server Running'));

const wss = new Server({ port: process.env.PORT || 8080 });

console.log('WebSocket server starting...');

const clients = new Map(); // userId → ws

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const from = msg.from;
      if (from) clients.set(from, ws);

      // Broadcast to the OTHER user only
      const targetId = from === 'mango1' ? 'mango2' : 'mango1';
      const target = clients.get(targetId);
      if (target && target.readyState === target.OPEN) {
        target.send(data);
      }
    } catch (e) { console.error(e); }
  });

  ws.on('close', () => {
    for (let [id, socket] of clients) {
      if (socket === ws) { clients.delete(id); break; }
    }
  });
});
setInterval(() => {
  fetch(`https://mango-signaling.onrender.com`);
}, 600000);
console.log('Server running on port', process.env.PORT || 8080);

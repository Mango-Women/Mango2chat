const express = require('express');
const { Server } = require('ws');
const app = express();

app.get('/', (req, res) => {
  res.send('Mango Signaling Server IS ALIVE');
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new Server({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const from = msg.from;

      if (from) {
        clients.set(from, ws);
        console.log(`Client registered: ${from}`);
      }

      // Forward to the OTHER user
      const targetId = from === 'mango1' ? 'mango2' : 'mango1';
      const target = clients.get(targetId);

      if (target && target.readyState === target.OPEN) {
        target.send(data);
        console.log(`Forwarded message from ${from} to ${targetId}`);
      } else {
        console.log(`Target ${targetId} not connected yet`);
      }

    } catch (e) {
      console.error('Invalid JSON:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    for (let [id, socket] of clients.entries()) {
      if (socket === ws) {
        clients.delete(id);
        console.log(`Unregistered: ${id}`);
        break;
      }
    }
  });
});

// Keep awake
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || 'mango2chat2a.onrender.com';
  fetch(`https://${url}`).catch(() => {});
}, 600000);

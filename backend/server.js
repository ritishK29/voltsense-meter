require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const utilityRoutes = require('./routes/utilityRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/utility', utilityRoutes);

io.on('connection', (socket) => {
  console.log(`Meter Client Connected: ${socket.id}`);

  const interval = setInterval(() => {
    const voltage = Number((229 + Math.random() * 4.5).toFixed(1));
    const powerFactor = Number((0.95 + Math.random() * 0.04).toFixed(2));
    const frequency = Number((49.92 + Math.random() * 0.14).toFixed(2));
    const gasPressureMbar = Number((20.5 + Math.random() * 1.2).toFixed(1));

    socket.emit('live_telemetry', {
      timestamp: new Date().toLocaleTimeString(),
      voltage,
      powerFactor,
      frequency,
      gasPressureMbar,
      fluctuationFactor: Number((0.96 + Math.random() * 0.08).toFixed(3))
    });
  }, 2000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log(`Meter Client Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`VoltSense Dual-Utility Server running on port ${PORT}`);
});

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { getSystemMetrics } from './services/system.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// REST API for historical data or other static actions
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket connection for real-time metrics
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const emitMetrics = async () => {
    try {
      const metrics = await getSystemMetrics();
      socket.emit('metrics', metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  // Emit immediately on connect
  emitMetrics();

  // Polling interval (e.g., every 2 seconds)
  const intervalId = setInterval(emitMetrics, 2000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(intervalId);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

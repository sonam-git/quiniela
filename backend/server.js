const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const betRoutes = require('./routes/bets');
const scheduleRoutes = require('./routes/schedule');
const resultsRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');
const announcementsRoutes = require('./routes/announcements');
const pdfRoutes = require('./routes/pdf');
const { initScheduler } = require('./services/scheduler');

const app = express();
const server = http.createServer(app);

// Production frontend URL
const PRODUCTION_FRONTEND = 'https://quiniela-ten.vercel.app';

// Configure CORS for production
const allowedOrigin = process.env.FRONTEND_URL?.replace(/\/$/, '') || PRODUCTION_FRONTEND;

// Build list of allowed origins
const allowedOrigins = [
  allowedOrigin,
  PRODUCTION_FRONTEND,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now, but log blocked ones
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Enable long polling as fallback
  transports: ['websocket', 'polling'],
  // Ping settings for keeping connection alive
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.log('🔌 Socket error:', socket.id, error);
  });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize automatic schedule creator
    initScheduler();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiniela API is running' });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.io enabled for real-time updates');
});

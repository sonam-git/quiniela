const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Startup diagnostics
console.log('🚀 Starting Quiniela API Server...');
console.log('📅 Server Time (UTC):', new Date().toISOString());
console.log('📅 Server Time (Local):', new Date().toString());
console.log('🌍 Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ NOT SET');
console.log('📦 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET');
console.log('🌐 FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');

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
    // Initialize automatic schedule creator with socket.io instance for real-time updates
    initScheduler(io);
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

// Helper to get week number (same logic as in routes)
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// Health check with diagnostic info
app.get('/api/health', (req, res) => {
  const now = new Date();
  res.json({ 
    status: 'OK', 
    message: 'Quiniela API is running',
    diagnostics: {
      serverTimeUTC: now.toISOString(),
      serverTimeLocal: now.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentWeekNumber: getWeekNumber(now),
      currentYear: now.getFullYear(),
      nodeEnv: process.env.NODE_ENV || 'not set',
      jwtSecretSet: !!process.env.JWT_SECRET,
      mongoDbSet: !!process.env.MONGODB_URI,
      frontendUrl: process.env.FRONTEND_URL || 'not set'
    }
  });
});

// Debug endpoint to diagnose betting/schedule issues
app.get('/api/debug/week-info', async (req, res) => {
  try {
    const Schedule = require('./models/Schedule');
    const Bet = require('./models/Bet');
    
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();
    
    // Find schedule for current week
    const currentSchedule = await Schedule.findOne({ weekNumber, year });
    
    // Count bets for current week
    const betCount = await Bet.countDocuments({ weekNumber, year, isPlaceholder: { $ne: true } });
    
    // Get all schedules
    const allSchedules = await Schedule.find({}).select('weekNumber year jornada isSettled').sort({ year: -1, weekNumber: -1 });
    
    res.json({
      serverTime: {
        utc: now.toISOString(),
        local: now.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      calculated: {
        weekNumber,
        year
      },
      currentSchedule: currentSchedule ? {
        id: currentSchedule._id,
        weekNumber: currentSchedule.weekNumber,
        year: currentSchedule.year,
        jornada: currentSchedule.jornada,
        isSettled: currentSchedule.isSettled,
        matchCount: currentSchedule.matches?.length || 0,
        firstMatchTime: currentSchedule.firstMatchTime
      } : null,
      betCountForCurrentWeek: betCount,
      recentSchedules: allSchedules.slice(0, 5)
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.io enabled for real-time updates');
});

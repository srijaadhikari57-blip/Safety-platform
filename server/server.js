require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const journeyRoutes = require('./routes/journey');
const sosRoutes = require('./routes/sos');
const safetyRoutes = require('./routes/safety');

const app = express();
const server = http.createServer(app);

console.log("MONGO_URI:", process.env.MONGO_URI);

initializeSocket(server);

connectDB();

app.use(helmet());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests' }
});

// app.use('/api/journeys', limiter);
// app.use('/api/safety', limiter);

const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
});

app.use('/api/sos/trigger', sosLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/safety', safetyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || '[localhost](http://localhost:3000)',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room for targeted notifications
    socket.join(`user_${socket.userId}`);

    // Handle location updates
    socket.on('location_update', (data) => {
      socket.broadcast.to(`tracking_${data.journeyId}`).emit('location_changed', {
        userId: socket.userId,
        location: data.location,
        timestamp: new Date()
      });
    });

    // Handle SOS broadcast
    socket.on('sos_triggered', (data) => {
      // Broadcast to all emergency contacts
      data.emergencyContacts.forEach(contactId => {
        io.to(`user_${contactId}`).emit('sos_alert', {
          userId: socket.userId,
          location: data.location,
          timestamp: new Date(),
          journeyId: data.journeyId
        });
      });
    });

    // Join journey tracking room
    socket.on('join_tracking', (journeyId) => {
      socket.join(`tracking_${journeyId}`);
    });

    socket.on('leave_tracking', (journeyId) => {
      socket.leave(`tracking_${journeyId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };

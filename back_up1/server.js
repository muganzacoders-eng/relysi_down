const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./socket');
const { PORT } = require('./config');


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize Socket.io
socketHandler(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
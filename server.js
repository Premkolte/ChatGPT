const app = require('./src/app');
require('dotenv').config();
const connectDB = require('./src/db/db');
const initSocketServer = require('./src/sockets/socket.server');
const httpServer = require('http').createServer(app);

// Connect to the database
connectDB();

// Initialize Socket.io server
initSocketServer(httpServer);

// Start the server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io server is initialized`);
});


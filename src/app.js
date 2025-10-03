const express = require('express');
const cookieParser = require('cookie-parser');


// Routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes');

const app = express();


// Using Middleware
app.use(express.json());
app.use(cookieParser());


// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);

module.exports = app;
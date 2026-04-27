const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cron = require('node-cron');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/chat-token', require('./routes/chatToken'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/launchpad', require('./routes/launchpad'));
app.use('/api/social', require('./routes/social'));

// Socket.io
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => socket.join(roomId));
  socket.on('send-message', (data) => io.to(data.roomId).emit('receive-message', data));
  socket.on('disconnect', () => {});
});

// Cron: expire chat tokens every minute
const ChatToken = require('./models/ChatToken');
cron.schedule('* * * * *', async () => {
  const now = new Date();
  await ChatToken.updateMany(
    { status: 'ACTIVE', endTime: { $lte: now } },
    { status: 'EXPIRED' }
  );
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.error(err));

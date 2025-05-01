const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://creator-dashboard-22c1c.web.app',
    'https://creator-dashboard-22c1c.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/users', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
// Export app for testing
module.exports = app;
const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
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
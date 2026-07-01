const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
require('dotenv').config();

const connectDB    = require('./database');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'https://gle-studio.vercel.app',
    ].filter(Boolean);
    // Also allow any *.vercel.app preview deployment
    if (allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     require('./router/auth'));
app.use('/api/orders',   require('./router/orders'));
app.use('/api/gallery',  require('./router/gallery'));
app.use('/api/frames',   require('./router/frames'));
app.use('/api/services', require('./router/services'));
app.use('/api/staff',    require('./router/staff'));
app.use('/api/settings', require('./router/settings'));
app.use('/api/users',    require('./router/users'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'GLE Studio API running ✅' }));

// Error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎯 GLE Studio server running on port ${PORT}`));
const jwt      = require('jsonwebtoken');
const { User } = require('../model');

const generateToken        = (id) => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRE         || '7d'  });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

// ── POST /api/auth/register ───────────────────────────────────
// Always registers as normal user — nobody can self-assign admin
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role: 'user' });

    res.status(201).json({
      user,
      token:        generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone,
      },
      token:        generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    res.json({ token: generateToken(decoded.id) });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────
const getMe = async (req, res) => {
  res.json(req.user);
};

// ── POST /api/auth/create-admin ───────────────────────────────
// ONLY an existing admin can call this — protected by adminOnly middleware
const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, phone, password, role: 'admin' });

    res.status(201).json({
      message: `${name} has been added as admin successfully`,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, refresh, getMe, createAdmin };
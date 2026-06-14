const { Gallery, Frame, Staff, Settings, User, Order } = require('../model');
const fs = require('fs');
const path = require('path');

// Base URL of this backend (set in .env / Render env vars), e.g. https://gle-studio-backend.onrender.com
const BASE_URL = process.env.BACKEND_URL || '';

// ======= GALLERY =======
const getGallery = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const photos = await Gallery.find(query).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const photo = await Gallery.create({
      title: req.body.title || '',
      imageUrl: `${BASE_URL}/uploads/gallery/${req.file.filename}`,
      category: req.body.category,
      featured: req.body.featured === 'true',
    });
    res.status(201).json(photo);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deletePhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    // Delete file (strip BASE_URL prefix if present to get the local relative path)
    const relativePath = photo.imageUrl.replace(BASE_URL, '');
    const filePath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ======= FRAMES =======
const getFrames = async (req, res) => {
  try {
    const frames = await Frame.find({ available: true }).sort({ price: 1 });
    res.json(frames);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createFrame = async (req, res) => {
  try {
    const frame = await Frame.create(req.body);
    res.status(201).json(frame);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateFrame = async (req, res) => {
  try {
    const frame = await Frame.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(frame);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteFrame = async (req, res) => {
  try {
    await Frame.findByIdAndDelete(req.params.id);
    res.json({ message: 'Frame deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ======= STAFF =======
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ active: true }).populate('assignedOrders', 'clientName service status');
    res.json(staff);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStaff = async (req, res) => {
  try {
    const member = await Staff.create(req.body);
    res.status(201).json(member);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStaff = async (req, res) => {
  try {
    const member = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(member);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const assignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const member = await Staff.findById(req.params.id);
    if (!member.assignedOrders.includes(orderId)) member.assignedOrders.push(orderId);
    await member.save();
    await Order.findByIdAndUpdate(orderId, { assignedStaff: req.params.id });
    res.json(member);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ======= SETTINGS =======
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    Object.assign(settings, req.body);
    if (req.file) settings.logo = `${BASE_URL}/uploads/gallery/${req.file.filename}`;
    await settings.save();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ======= USERS (admin) =======
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    const usersWithOrders = await Promise.all(users.map(async (u) => {
      const orders = await Order.find({ user: u._id }).select('service amount status');
      return { ...u.toJSON(), orders };
    }));
    res.json(usersWithOrders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getGallery, uploadPhoto, deletePhoto,
  getFrames, createFrame, updateFrame, deleteFrame,
  getStaff, createStaff, updateStaff, assignOrder,
  getSettings, updateSettings,
  getAllUsers, updateProfile,
};
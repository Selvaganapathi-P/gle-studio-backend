const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── User ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:   { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt    = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) { return next(err); }
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

// ── Order ─────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientName:    { type: String, required: true },
  clientPhone:   { type: String, required: true },
  clientEmail:   { type: String, default: '' },
  clientAddress: { type: String, default: '' },
  service:       { type: String, required: true },
  preferredDate: { type: String, default: '' },
  budget:        { type: String, default: '' },
  venue:         { type: String, default: '' },
  notes:         { type: String, default: '' },
  referenceImage:{ type: String, default: '' },
  amount:        { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Delivered'],
    default: 'Pending',
  },
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  orderType:     { type: String, enum: ['booking', 'frame'], default: 'booking' },
  frameDetails:  { size: String, material: String, quantity: Number, price: Number },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// ── Gallery ───────────────────────────────────────────────────
const gallerySchema = new mongoose.Schema({
  title:    { type: String, default: '' },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

const Gallery = mongoose.model('Gallery', gallerySchema);

// ── Frame ─────────────────────────────────────────────────────
const frameSchema = new mongoose.Schema({
  size:         { type: String, required: true },
  material:     { type: String, required: true },
  price:        { type: Number, required: true },
  available:    { type: Boolean, default: true },
  offerPercent: { type: Number, default: 0 },
  offerLabel:   { type: String, default: '' },
}, { timestamps: true });

const Frame = mongoose.model('Frame', frameSchema);

// ── Service ───────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema({
  icon:     { type: String, default: '📷' },
  title:    { type: String, required: true },
  price:    { type: Number, required: true },
  maxPrice: { type: Number, default: 0 },
  duration: { type: String, default: '' },
  desc:     { type: String, default: '' },
  features: [{ type: String }],
  active:   { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

const Service = mongoose.model('Service', serviceSchema);

// ── Staff ─────────────────────────────────────────────────────
const staffSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  role:           { type: String, required: true },
  phone:          { type: String, default: '' },
  email:          { type: String, default: '' },
  active:         { type: Boolean, default: true },
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

const Staff = mongoose.model('Staff', staffSchema);

// ── Settings ──────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  studioName:     { type: String, default: 'GLE Studio' },
  tagline:        { type: String, default: 'Capturing Your Golden Moments' },
  phone:          { type: String, default: '+91 63827 48663' },
  whatsappNumber: { type: String, default: '916382748663' },
  email:          { type: String, default: 'tirupattur.gle2024@gmail.com' },
  address:        { type: String, default: 'Tirupattur, Tamil Nadu' },
  logo:           { type: String, default: '' },
  instagramUrl:   { type: String, default: '' },
  facebookUrl:    { type: String, default: '' },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = { User, Order, Gallery, Frame, Service, Staff, Settings };
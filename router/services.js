const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { Service } = require('../model');

// Default services to seed if none exist
const DEFAULT_SERVICES = [
  { icon: '💍', title: 'Wedding Photography',     price: 45000, maxPrice: 120000, duration: 'Full Day',  active: true, order: 1 },
  { icon: '🎭', title: 'Portrait Sessions',        price: 8000,  maxPrice: 25000,  duration: '2 Hours',   active: true, order: 2 },
  { icon: '🎂', title: 'Birthday & Baby Shower',   price: 15000, maxPrice: 35000,  duration: '3 Hours',   active: true, order: 3 },
  { icon: '🏢', title: 'Corporate Events',         price: 20000, maxPrice: 60000,  duration: 'Full Day',  active: true, order: 4 },
  { icon: '📦', title: 'Commercial & Product',     price: 20000, maxPrice: 80000,  duration: 'Half Day',  active: true, order: 5 },
  { icon: '🌅', title: 'Pre-Wedding / Engagement', price: 18000, maxPrice: 45000,  duration: 'Half Day',  active: true, order: 6 },
];

// GET /api/services — public (active only)
router.get('/', async (req, res) => {
  try {
    let services = await Service.find({ active: true }).sort({ order: 1, createdAt: 1 });
    // Seed defaults if none exist
    if (services.length === 0) {
      await Service.insertMany(DEFAULT_SERVICES);
      services = await Service.find({ active: true }).sort({ order: 1 });
    }
    res.json(services);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/services/all — admin (all including hidden)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    let services = await Service.find().sort({ order: 1, createdAt: 1 });
    if (services.length === 0) {
      await Service.insertMany(DEFAULT_SERVICES);
      services = await Service.find().sort({ order: 1 });
    }
    res.json(services);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/services — admin add new service
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/services/:id — admin update
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/services/:id — admin delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { Service } = require('../model');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/supabaseUpload');

const DEFAULT_SERVICES = [
  { title: 'Wedding Photography',     price: 45000, maxPrice: 120000, duration: 'Full Day',  active: true, order: 1, imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80' },
  { title: 'Portrait Sessions',        price: 8000,  maxPrice: 25000,  duration: '2 Hours',   active: true, order: 2, imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80' },
  { title: 'Birthday & Baby Shower',   price: 15000, maxPrice: 35000,  duration: '3 Hours',   active: true, order: 3, imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' },
  { title: 'Corporate Events',         price: 20000, maxPrice: 60000,  duration: 'Full Day',  active: true, order: 4, imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80' },
  { title: 'Commercial & Product',     price: 20000, maxPrice: 80000,  duration: 'Half Day',  active: true, order: 5, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
  { title: 'Pre-Wedding / Engagement', price: 18000, maxPrice: 45000,  duration: 'Half Day',  active: true, order: 6, imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80' },
];

// GET /api/services — public (active only)
router.get('/', async (req, res) => {
  try {
    let services = await Service.find({ active: true }).sort({ order: 1, createdAt: 1 });
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
router.post('/', protect, adminOnly, upload.memory.single('serviceImage'), async (req, res) => {
  try {
    const data = {
      title:    req.body.title,
      price:    Number(req.body.price),
      maxPrice: Number(req.body.maxPrice) || 0,
      duration: req.body.duration || '',
      desc:     req.body.desc || '',
      active:   req.body.active !== 'false',
    };
    if (req.file) {
      const { url, path: filePath } = await uploadToSupabase(req.file, 'services');
      data.imageUrl  = url;
      data.imagePath = filePath;
    }
    const service = await Service.create(data);
    res.status(201).json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/services/:id — admin update
router.put('/:id', protect, adminOnly, upload.memory.single('serviceImage'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.price    !== undefined) data.price    = Number(data.price);
    if (data.maxPrice !== undefined) data.maxPrice = Number(data.maxPrice) || 0;
    if (data.active   !== undefined) data.active   = data.active === 'true' || data.active === true;

    if (req.file) {
      const existing = await Service.findById(req.params.id);
      if (existing?.imagePath) await deleteFromSupabase(existing.imagePath);
      const { url, path: filePath } = await uploadToSupabase(req.file, 'services');
      data.imageUrl  = url;
      data.imagePath = filePath;
    }

    const service = await Service.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/services/:id — admin delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    if (service.imagePath) await deleteFromSupabase(service.imagePath);
    await service.deleteOne();
    res.json({ message: 'Service deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

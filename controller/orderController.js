const { Order, Settings } = require('../model');

// ── POST /api/orders ──────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user) data.user           = req.user._id;
    if (req.file) data.referenceImage = `/uploads/orders/${req.file.filename}`;

    const order = await Order.create(data);

    // Build WhatsApp notification message for admin
    const msg = encodeURIComponent(
      `🎯 *New GLE Studio Booking!*\n` +
      `📛 Client  : ${order.clientName}\n` +
      `📞 Phone   : ${order.clientPhone}\n` +
      `📸 Service : ${order.service}\n` +
      `📅 Date    : ${order.preferredDate || 'TBD'}\n` +
      `📍 Venue   : ${order.venue || 'TBD'}\n` +
      `💬 Notes   : ${order.notes || 'None'}\n` +
      `🆔 Order ID: ${order._id}`
    );

    // Prefer the DB-stored whatsappNumber (admin can change it in Settings);
    // fall back to the env var if Settings has none set yet.
    let waNumber = process.env.ADMIN_WHATSAPP;
    try {
      const settings = await Settings.findOne({});
      if (settings?.whatsappNumber) waNumber = settings.whatsappNumber;
    } catch { /* use env fallback */ }
    const waUrl = `https://wa.me/${waNumber}?text=${msg}`;

    res.status(201).json({ order, waUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/orders — all orders (admin only) ─────────────────
const getAllOrders = async (req, res) => {
  try {
    const { status, service, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)  query.status  = status;
    if (service) query.service = service;

    const orders = await Order.find(query)
      .populate('user',          'name email')
      .populate('assignedStaff', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/orders/my — logged-in user's orders ──────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user',          'name email phone')
      .populate('assignedStaff', 'name role phone');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/orders/:id/status — update order (admin) ───────
const updateStatus = async (req, res) => {
  try {
    const { status, amount, assignedStaff } = req.body;
    const update = {};
    if (status)        update.status        = status;
    if (amount)        update.amount        = amount;
    if (assignedStaff) update.assignedStaff = assignedStaff;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/orders/:id (admin) ────────────────────────────
const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/orders/stats — analytics (admin) ─────────────────
const getStats = async (req, res) => {
  try {
    const total     = await Order.countDocuments();
    const pending   = await Order.countDocuments({ status: 'Pending' });
    const thisMonth = await Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    });

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status:    { $in: ['Confirmed', 'Delivered'] },
          createdAt: { $gte: new Date(`${new Date().getFullYear()}-01-01`) },
        },
      },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const serviceBreakdown = await Order.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ total, pending, thisMonth, revenue, monthlyRevenue, serviceBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getAllOrders, getMyOrders, getOrder, updateStatus, deleteOrder, getStats };
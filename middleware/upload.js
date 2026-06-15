const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// ── Disk storage (unchanged) ──────────────────────────────────
// Still used for order "reference image" uploads (admin-only viewing,
// not shown publicly, so persistence across redeploys is less critical).
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/orders');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

// ── Memory storage (new) ──────────────────────────────────────
// Used for Gallery and Frame images — the buffer is uploaded straight to
// Supabase Storage in the controller, giving a permanent public URL.
const memoryStorage = multer.memoryStorage();

const upload = multer({ storage: diskStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadMemory = multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = upload;
module.exports.memory = uploadMemory;
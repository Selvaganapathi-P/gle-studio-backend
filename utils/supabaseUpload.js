const path     = require('path');
const supabase = require('../config/supabase');

const BUCKET = process.env.SUPABASE_BUCKET || 'gle-studio';

// Uploads a buffer (from multer memoryStorage) to Supabase Storage.
// Returns { url, path } — store both: url to display, path to delete later.
const uploadToSupabase = async (file, folder) => {
  const ext = path.extname(file.originalname) || '.jpg';
  const filePath = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return { url: data.publicUrl, path: filePath };
};

// Deletes a file from Supabase Storage by its stored path. Safe to call with
// empty/undefined — does nothing in that case.
const deleteFromSupabase = async (filePath) => {
  if (!filePath) return;
  try {
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch {
    // Non-fatal — don't block the DB operation if cloud delete fails
  }
};

module.exports = { uploadToSupabase, deleteFromSupabase, BUCKET };
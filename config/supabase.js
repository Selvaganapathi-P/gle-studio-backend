const { createClient } = require('@supabase/supabase-js');

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY come from your Supabase project's
// Settings → API page. The service_role key bypasses storage policies, so
// uploads/deletes from this backend always work regardless of bucket RLS.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
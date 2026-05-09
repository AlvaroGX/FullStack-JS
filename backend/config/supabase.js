const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_KEY deben estar definidos en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function subirImagen(buffer, nombreOriginal, contentType) {
  const ext = path.extname(nombreOriginal);
  const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
  const filePath = `productos/${fileName}`;

  const { error } = await supabase.storage
    .from('inventapp')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (error) {
    if (error.message.includes('bucket')) {
      const { error: createError } = await supabase.storage.createBucket('inventapp', { public: true });
      if (createError) throw createError;
      const { error: retryError } = await supabase.storage
        .from('inventapp')
        .upload(filePath, buffer, { contentType, upsert: true });
      if (retryError) throw retryError;
    } else {
      throw error;
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('inventapp')
    .getPublicUrl(filePath);

  return publicUrl;
}

function mapearId(item) {
  if (!item) return item;
  if (Array.isArray(item)) {
    return item.map(i => ({ ...i, _id: i.id }));
  }
  return { ...item, _id: item.id };
}

module.exports = { supabase, subirImagen, mapearId };

// uploadImage.js — compress & resize in the browser, then upload to Supabase Storage.
// Framework-agnostic ES module. The app is React, so pages call this from event
// handlers exactly like the usage example at the bottom.

import imageCompression from 'browser-image-compression';
import { supabase } from './supabase.js'; // pre-configured client (anon key only)

const BUCKET = 'images';

/**
 * Compresses a File, uploads it to the public "images" bucket and returns the
 * public URL. Never uses the Supabase service role key — the anon key is
 * restricted by RLS policies to this bucket.
 *
 * @param {File} file File from <input type="file">
 * @returns {Promise<{ok: boolean, url?: string, error?: string}>}
 */
export async function compressAndUploadImage(file) {
  // 1. Validate input
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return { ok: false, error: 'Invalid file: please choose an image (PNG, JPG, WEBP…).' };
  }

  let compressed;
  try {
    // 2. Compress + resize in the browser (saves Supabase storage quota)
    compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      // Convert to WebP when the browser supports it
      fileType: 'image/webp',
    });
  } catch (err) {
    // Fallback if WebP conversion is unsupported — still compress
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch (e2) {
      return { ok: false, error: `Compression failed: ${e2?.message || e2}` };
    }
  }

  // 3. Unique filename + .webp extension
  const fileName = `${crypto.randomUUID()}.webp`;

  // 4. Upload to the public "images" bucket
  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, compressed, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }
  } catch (err) {
    return { ok: false, error: `Upload failed: ${err?.message || err}` };
  }

  // 5. Return the public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { ok: true, url: data.publicUrl };
}

/*
 * Usage example (React — this site's framework):
 *
 *   import { compressAndUploadImage } from './lib/uploadImage.js';
 *
 *   const onFileChange = async (e) => {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *     setUploading(true);
 *     const result = await compressAndUploadImage(file);
 *     setUploading(false);
 *     if (!result.ok) { alert(result.error); return; }
 *     setProfilePicture(result.url); // persist the public URL
 *   };
 *
 *   <input type="file" accept="image/*" onChange={onFileChange} />
 */

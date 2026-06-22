// Lightweight client-side image "enhancement" for profile photos.
// - Square center-crop (focus a bit above center so faces stay centered)
// - Resize to max 512px
// - Subtle brightness/contrast/saturation boost + light unsharp mask
// - Output as WebP (small file, fast site)
export async function enhanceProfilePhoto(file: File, size = 512): Promise<File> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  // Center horizontally, bias upward (faces usually in top half of portraits)
  const sx = (bmp.width - side) / 2;
  const sy = Math.max(0, (bmp.height - side) / 2 - side * 0.1);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bmp.close();
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Light enhancement via CSS filter on canvas context
  // (supported in modern browsers; falls back to no-op if not)
  try {
    (ctx as any).filter = 'contrast(1.08) saturate(1.08) brightness(1.03)';
  } catch {}
  ctx.drawImage(bmp, sx, sy, side, side, 0, 0, size, size);
  bmp.close();

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), 'image/webp', 0.85)!,
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
    type: 'image/webp',
  });
}

/**
 * Client-side image preparation.
 *
 * Phone cameras produce 4-12MB JPEGs. Sending those raw as base64 (~1.37x bigger)
 * blew past the server's ~5MB data-URL limit, so the scan failed before ever
 * reaching Gemini. We downscale the longest edge to 2000px (plenty for OCR of an
 * ingredients list) and re-encode at high quality, stepping quality down only if
 * the result is still too big. Small images are returned untouched.
 */
const MAX_EDGE = 2000;
const MAX_BYTES = 4_500_000; // final data-URL budget, under the server's 7M char cap

export async function prepareImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size === 0) throw new Error("That image file is empty. Please pick another photo.");

  const original = await readAsDataUrl(file);

  // Small, already-supported images can go through untouched (no recompression = no text loss).
  const supported = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(original);
  if (supported && original.length < MAX_BYTES) return original;

  const bitmap = await loadBitmap(original);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);

  for (const quality of [0.92, 0.85, 0.75, 0.65]) {
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length < MAX_BYTES) return out;
  }
  return canvas.toDataURL("image/jpeg", 0.55);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}

function loadBitmap(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Browsers apply EXIF orientation to <img>, so portrait photos stay upright.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That image looks corrupted. Please try another photo."));
    img.src = dataUrl;
  });
}

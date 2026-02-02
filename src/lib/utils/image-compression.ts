/**
 * Client-side image compression using Canvas API.
 * Reduces file sizes by 80-90% before upload, saving bandwidth and storage costs.
 */

const MAX_DIMENSION = 1920;
const COMPRESSION_QUALITY = 0.8;

let cachedWebPSupport: boolean | null = null;

function isWebPSupported(): boolean {
  if (cachedWebPSupport !== null) return cachedWebPSupport;
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  cachedWebPSupport = canvas
    .toDataURL("image/webp")
    .startsWith("data:image/webp");
  return cachedWebPSupport;
}

export function getOutputFormat(): { mimeType: string; extension: string } {
  if (isWebPSupported()) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  return { mimeType: "image/jpeg", extension: "jpg" };
}

/**
 * Compress an image file using Canvas API.
 * Resizes to max 1920px on longest side and converts to WebP (JPEG fallback).
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: width, naturalHeight: height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const { mimeType } = getOutputFormat();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Compression failed"));
          }
        },
        mimeType,
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}

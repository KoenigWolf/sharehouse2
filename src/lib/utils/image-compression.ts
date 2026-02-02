/**
 * Client-side image compression using Canvas API.
 * Reduces file sizes by 80-90% before upload, saving bandwidth and storage costs.
 *
 * Supports HEIC/HEIF (iPhone) via dynamic heic2any import.
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

function isHeic(file: File | Blob): boolean {
  if ("type" in file && typeof file.type === "string") {
    const t = file.type.toLowerCase();
    if (t === "image/heic" || t === "image/heif") return true;
  }
  if ("name" in file && typeof file.name === "string") {
    return /\.hei[cf]$/i.test(file.name);
  }
  return false;
}

/**
 * HEIC/HEIF → JPEG 変換（動的 import で heic2any を遅延ロード）
 *
 * Safari は Canvas で HEIC を直接読めるため、変換が不要な場合はスキップする。
 * 非 Safari ブラウザでは heic2any で JPEG に変換してから Canvas に渡す。
 */
async function convertHeicIfNeeded(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;

  // Safari は HEIC をネイティブでデコードできる
  if (canBrowserDecodeHeic()) return file;

  const { default: heic2any } = await import("heic2any");
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(result) ? result[0] : result;
}

/** Safari / iOS WebKit は HEIC を <img> で読める */
function canBrowserDecodeHeic(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/Chromium/i.test(ua);
}

/**
 * Compress an image file using Canvas API.
 * Resizes to max 1920px on longest side and converts to WebP (JPEG fallback).
 * Automatically converts HEIC/HEIF to JPEG before Canvas processing.
 */
export async function compressImage(file: File): Promise<Blob> {
  const input = await convertHeicIfNeeded(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(input);

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

/**
 * 画像ファイルをアップロード用に準備する（圧縮 + メタデータ生成）
 *
 * HEIC 変換 → Canvas 圧縮 → WebP/JPEG Blob を File として返す。
 * FormData に載せてサーバーアクションに送る用途。
 */
export async function prepareImageForUpload(
  file: File
): Promise<{ file: File; mimeType: string; extension: string }> {
  const compressed = await compressImage(file);
  const { mimeType, extension } = getOutputFormat();
  const outputFile = new File([compressed], `photo.${extension}`, {
    type: mimeType,
  });
  return { file: outputFile, mimeType, extension };
}

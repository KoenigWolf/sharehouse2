/**
 * Image optimization utilities
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Get optimized image URL from Supabase Storage
 * Supabase supports automatic image transformation via query parameters
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string | null {
  if (!url) return null;

  const { width = 400, height = 400, quality = 80 } = options;

  if (url.includes("supabase.co/storage")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}width=${width}&height=${height}&quality=${quality}&format=webp`;
  }

  return url;
}

/**
 * Get responsive image sizes attribute for Next.js Image
 */
export function getResponsiveImageSizes(context: "card" | "detail" | "edit"): string {
  switch (context) {
    case "card":
      return "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
    case "detail":
      return "(max-width: 640px) 100vw, 400px";
    case "edit":
      return "200px";
    default:
      return "100vw";
  }
}

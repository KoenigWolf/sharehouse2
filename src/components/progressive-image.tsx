"use client";

import { useState, useCallback, memo } from "react";
import Image, { type ImageProps } from "next/image";
import { m, AnimatePresence } from "framer-motion";

interface ProgressiveImageProps extends Omit<ImageProps, "onLoad"> {
  /** Low quality placeholder URL (optional - will generate blur if not provided) */
  placeholderSrc?: string;
  /** Fallback element when image fails to load */
  fallback?: React.ReactNode;
  /** Whether to show loading animation */
  showLoadingAnimation?: boolean;
  /** Wrapper class name */
  wrapperClassName?: string;
}

/**
 * Progressive Image Component
 *
 * Instagram-style progressive image loading with:
 * - Blur-up effect from low-quality placeholder
 * - Smooth fade-in when full image loads
 * - Shimmer animation during loading
 * - Graceful error handling with fallback
 */
export const ProgressiveImage = memo(function ProgressiveImage({
  src,
  alt,
  placeholderSrc,
  fallback,
  showLoadingAnimation = true,
  wrapperClassName = "",
  className = "",
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Handle error state
  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // No fallback provided - render a placeholder
    return (
      <div className={`relative overflow-hidden ${wrapperClassName}`}>
        <div className={`bg-muted flex items-center justify-center ${className}`}>
          <span className="text-muted-foreground text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Shimmer loading animation */}
      <AnimatePresence>
        {!isLoaded && showLoadingAnimation && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <div className="absolute inset-0 bg-muted" />
            <div className="absolute inset-0 shimmer" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Low quality placeholder (blur) */}
      {placeholderSrc && !isLoaded && (
        <Image
          src={placeholderSrc}
          alt=""
          fill={props.fill}
          width={props.fill ? undefined : props.width}
          height={props.fill ? undefined : props.height}
          className={`${className} blur-xl scale-105`}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full h-full"
      >
        <Image
          src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </m.div>
    </div>
  );
});

/**
 * Optimized Avatar with Progressive Loading
 *
 * Specialized for profile avatars with circular shape
 * and Instagram-style loading.
 */
interface ProgressiveAvatarProps {
  src: string | null | undefined;
  alt: string;
  size: number;
  fallback?: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export const ProgressiveAvatar = memo(function ProgressiveAvatar({
  src,
  alt,
  size,
  fallback,
  className = "",
  priority = false,
}: ProgressiveAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!src || hasError) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Shimmer */}
      <AnimatePresence>
        {!isLoaded && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10"
          >
            <div className="absolute inset-0 bg-muted rounded-full" />
            <div className="absolute inset-0 shimmer rounded-full" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <m.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.05 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full h-full"
      >
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
        />
      </m.div>
    </div>
  );
});

/**
 * Instant Image Component
 *
 * For images that should appear instantly (already cached/prefetched).
 * No loading animation - assumes image is immediately available.
 */
interface InstantImageProps extends Omit<ImageProps, "loading"> {
  alt: string;
}

export const InstantImage = memo(function InstantImage({
  className = "",
  alt,
  ...props
}: InstantImageProps) {
  return (
    <Image
      {...props}
      className={className}
      loading="eager"
      alt={alt}
    />
  );
});

"use client";

import { createContext, useContext, useRef, useCallback, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Shared Element Transition System
 *
 * Provides Instagram-like shared element transitions where elements
 * (like profile images) smoothly animate from their source position
 * to their destination position during page navigation.
 */

interface SharedElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SharedElementData {
  id: string;
  rect: SharedElementRect;
  src?: string;
}

interface SharedElementContextValue {
  register: (id: string, element: HTMLElement, src?: string) => void;
  unregister: (id: string) => void;
  getElement: (id: string) => SharedElementData | null;
  isTransitioning: boolean;
}

const SharedElementContext = createContext<SharedElementContextValue | null>(null);

export function SharedElementProvider({ children }: { children: ReactNode }) {
  const elementsRef = useRef<Map<string, SharedElementData>>(new Map());
  const [isTransitioning] = useState(false);

  const register = useCallback((id: string, element: HTMLElement, src?: string) => {
    const rect = element.getBoundingClientRect();
    elementsRef.current.set(id, {
      id,
      rect: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      },
      src,
    });
  }, []);

  const unregister = useCallback((id: string) => {
    elementsRef.current.delete(id);
  }, []);

  const getElement = useCallback((id: string) => {
    return elementsRef.current.get(id) ?? null;
  }, []);

  const value = useMemo(
    () => ({
      register,
      unregister,
      getElement,
      isTransitioning,
    }),
    [register, unregister, getElement, isTransitioning]
  );

  return (
    <SharedElementContext.Provider value={value}>
      {children}
    </SharedElementContext.Provider>
  );
}

export function useSharedElement() {
  const context = useContext(SharedElementContext);
  if (!context) {
    throw new Error("useSharedElement must be used within SharedElementProvider");
  }
  return context;
}

interface SharedElementProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * Shared Element Wrapper
 *
 * Wrap elements that should animate between pages with this component.
 * Uses Framer Motion's layoutId for smooth cross-page transitions.
 */
export function SharedElement({ id, children, className }: SharedElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={`shared-${id}`}
      className={className}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 30,
        mass: 0.8,
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared Avatar Wrapper
 *
 * Specialized shared element for avatar images that maintains
 * aspect ratio and border radius during transitions.
 */
export function SharedAvatar({
  id,
  children,
  className,
}: SharedElementProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={`avatar-${id}`}
      className={className}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 0.6,
      }}
      style={{
        willChange: "transform",
        transformOrigin: "center center",
      }}
    >
      {children}
    </motion.div>
  );
}

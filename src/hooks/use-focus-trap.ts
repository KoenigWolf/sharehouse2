import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  isActive: boolean;
  /** Callback when Escape key is pressed */
  onEscape?: () => void;
  /** Whether to restore focus to the previously focused element on deactivation */
  restoreFocus?: boolean;
}

/**
 * Hook to trap focus within a container element.
 * Essential for modal dialogs to meet WCAG 2.1 Level AA requirements.
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const trapRef = useFocusTrap({
 *     isActive: isOpen,
 *     onEscape: onClose,
 *     restoreFocus: true,
 *   });
 *
 *   return (
 *     <div ref={trapRef} role="dialog" aria-modal="true">
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => el.offsetParent !== null);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
          if (activeElement === firstElement || !containerRef.current?.contains(activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement || !containerRef.current?.contains(activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isActive, onEscape, getFocusableElements]
  );

  useEffect(() => {
    if (!isActive) return;

    previousActiveElement.current = document.activeElement;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Delay ensures modal is fully rendered before focusing
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, handleKeyDown, getFocusableElements, restoreFocus]);

  return containerRef;
}

import { useEffect, useCallback } from "react";

/**
 * Hook to handle Escape key press for closing modals/dialogs.
 * For modals that need full focus trapping, use useFocusTrap instead.
 *
 * @param isActive - Whether the handler is active
 * @param onEscape - Callback when Escape is pressed
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    },
    [onEscape]
  );

  useEffect(() => {
    if (!isActive) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleKeyDown]);
}

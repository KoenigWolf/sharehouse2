import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
   freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
   threshold = 0,
   root = null,
   rootMargin = "0%",
   freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): [
      React.RefObject<HTMLDivElement | null>,
      boolean
   ] {
   const ref = useRef<HTMLDivElement>(null);
   const [entry, setEntry] = useState<IntersectionObserverEntry>();

   const frozen = entry?.isIntersecting && freezeOnceVisible;

   const updateEntry = ([entry]: IntersectionObserverEntry[]) => {
      setEntry(entry);
   };

   useEffect(() => {
      const node = ref.current;
      const hasIOSupport = !!window.IntersectionObserver;

      if (!hasIOSupport || frozen || !node) return;

      const observerParams = { threshold, root, rootMargin };
      const observer = new IntersectionObserver(updateEntry, observerParams);

      observer.observe(node);

      return () => observer.disconnect();
   }, [threshold, root, rootMargin, frozen]);

   return [ref, !!entry?.isIntersecting];
}

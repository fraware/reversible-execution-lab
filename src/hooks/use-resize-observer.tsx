
import { useEffect, useRef } from 'react';

// Hook to observe size changes of an element
export const useResizeObserver = (
  ref: React.RefObject<Element>,
  callback: (entry: ResizeObserverEntry) => void
) => {
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (ref.current) {
      observer.current = new ResizeObserver((entries) => {
        callback(entries[0]);
      });
      
      observer.current.observe(ref.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [ref, callback]);
};

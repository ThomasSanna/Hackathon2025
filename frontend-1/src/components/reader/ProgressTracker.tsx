import { useEffect, useRef } from "react";
import { useProgressStore } from "../../stores/progressStore";

interface ProgressTrackerProps {
  docId: string;
}

export default function ProgressTracker({ docId }: ProgressTrackerProps) {
  const updateProgress = useProgressStore((state) => state.updateProgress);
  const startTime = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!docId) return;

    // 1. INITIALIZE / RESTORE
    const savedBook = useProgressStore.getState().books[docId];
    
    // Always touch the book to update "Last Read" immediately
    updateProgress(docId, {});

    if (savedBook && savedBook.progress > 0) {
      // Delay slightly to ensure page layout is stable
      setTimeout(() => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const position = (savedBook.progress / 100) * height;
        if (position > 0) {
          window.scrollTo({ top: position, behavior: 'smooth' });
        }
      }, 800);
    }

    // 2. TIME TRACKING
    intervalRef.current = setInterval(() => {
      const current = useProgressStore.getState().books[docId];
      if (current) {
         updateProgress(docId, { timeSpent: (current.timeSpent || 0) + 5 });
      } else {
         updateProgress(docId, { timeSpent: 5 });
      }
    }, 5000);

    // 3. SCROLL TRACKING
    // Use Throttling ideally, but simple for now
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          
          if (docHeight > 0) {
            const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
            updateProgress(docId, { progress });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [docId, updateProgress]);

  return null;
}

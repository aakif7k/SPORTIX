import { useEffect } from 'react';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function useSmoothScroll() {
  useEffect(() => {
    lenisInstance = new Lenis({ duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
    function raf(time: number) {
      lenisInstance!.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);
}

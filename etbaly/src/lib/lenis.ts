import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function initLenis() {
  lenis = new Lenis({
    duration: 2.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.6,
    touchMultiplier: 1.5,
    infinite: false,
  });

  function raf(time: number) {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
  return lenis;
}

export function destroyLenis() {
  lenis?.destroy();
  lenis = null;
}

export function getLenis() {
  return lenis;
}

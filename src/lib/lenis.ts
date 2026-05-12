import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function initLenis() {
  lenis = new Lenis({
    duration: 0.8,
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic — snappy but smooth
    smoothWheel: true,
    wheelMultiplier: 1.2,
    touchMultiplier: 1.8,
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

/**
 * Temporarily pause Lenis so inner scroll containers (cart, chat feed)
 * can receive wheel events natively.
 */
export function pauseLenis() {
  lenis?.stop();
}

export function resumeLenis() {
  lenis?.start();
}

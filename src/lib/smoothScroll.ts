/**
 * Desplazamiento suave y controlado (el del navegador es brusco en muchos celulares).
 * Se detiene si la persona toca la pantalla o mueve la rueda del ratón.
 * Devuelve una función para cancelarlo.
 */
export function smoothScrollTo(targetY: number, duration = 700): () => void {
  const startY = scrollY;
  const maxY = document.documentElement.scrollHeight - innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));
  const distance = endY - startY;

  if (Math.abs(distance) < 2) return () => {};
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    scrollTo({ top: endY, behavior: "instant" });
    return () => {};
  }

  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let raf = 0;
  let stopped = false;
  const t0 = performance.now();

  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    removeEventListener("wheel", stop);
    removeEventListener("touchstart", stop);
  };
  addEventListener("wheel", stop, { passive: true, once: true });
  addEventListener("touchstart", stop, { passive: true, once: true });

  const frame = (now: number) => {
    if (stopped) return;
    const k = Math.min(1, (now - t0) / duration);
    // "instant" para que no se mezcle con scroll-behavior: smooth del <html>
    scrollTo({ top: startY + distance * ease(k), behavior: "instant" });
    if (k < 1) raf = requestAnimationFrame(frame);
    else stop();
  };
  raf = requestAnimationFrame(frame);
  return stop;
}

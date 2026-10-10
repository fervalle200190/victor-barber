import { useEffect } from "react";

/**
 * Motor de efectos de la página. No pinta nada: lee atributos data-* del HTML
 * y escribe clases y variables CSS.
 *
 * - data-r            aparece al entrar en pantalla; data-r="clip" se descubre como una cortina (mientras espera lleva data-pre)
 * - data-count        número que cuenta hasta su valor (data-suf = sufijo)
 * - data-prog         --p de 0 a 1 mientras el elemento cruza la pantalla
 * - data-pin          --p de 0 a 1 mientras una sección alta está anclada
 * - data-words        ilumina las palabras (.sp) según el scroll
 * - data-mag          botón magnético que sigue al cursor
 * En :root escribe --sy (progreso de la página), --cx/--cy (cursor en la ventana) y --px/--py (cursor en la página).
 */
export default function ScrollFx() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const root = document.documentElement;
    const cleanups: Array<() => void> = [];

    // Aparición: solo se ocultan los que están fuera de pantalla al cargar,
    // así la primera vista siempre está completa.
    if (!reduced) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.removeAttribute("data-pre");
              io.unobserve(e.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px" },
      );
      document.querySelectorAll<HTMLElement>("[data-r]").forEach((el) => {
        if (el.getBoundingClientRect().top > innerHeight * 0.92) {
          el.setAttribute("data-pre", "");
          io.observe(el);
        }
      });
      cleanups.push(() => io.disconnect());
    }

    // Contadores
    const cio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting || reduced) return;
          cio.unobserve(e.target);
          const el = e.target as HTMLElement;
          const raw = el.dataset.count ?? "0";
          const end = parseFloat(raw);
          const decimals = (raw.split(".")[1] ?? "").length;
          const suffix = el.dataset.suf ?? "";
          const t0 = performance.now();
          const step = (t: number) => {
            const k = clamp((t - t0) / 1400);
            el.textContent = (end * (1 - Math.pow(1 - k, 3))).toFixed(decimals) + suffix;
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll("[data-count]").forEach((el) => cio.observe(el));
    cleanups.push(() => cio.disconnect());

    // Variables de scroll
    const prog = [...document.querySelectorAll<HTMLElement>("[data-prog]")];
    const pins = [...document.querySelectorAll<HTMLElement>("[data-pin]")];
    const words = [...document.querySelectorAll<HTMLElement>("[data-words]")];
    let raf = 0;
    const frame = () => {
      const H = innerHeight;
      root.style.setProperty("--sy", clamp(scrollY / (document.body.scrollHeight - H || 1)).toFixed(4));
      prog.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--p", clamp((H - r.top) / (H + r.height)).toFixed(4));
      });
      pins.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--p", clamp(-r.top / (r.height - H || 1)).toFixed(4));
      });
      words.forEach((el) => {
        const r = el.getBoundingClientRect();
        const p = clamp((H * 0.85 - r.top) / (r.height + H * 0.35));
        const spans = el.querySelectorAll(".sp");
        spans.forEach((s, i) => s.classList.toggle("on", p * spans.length > i));
      });
      raf = requestAnimationFrame(frame);
    };
    if (reduced) {
      words.forEach((el) => el.querySelectorAll(".sp").forEach((s) => s.classList.add("on")));
    } else {
      raf = requestAnimationFrame(frame);
      cleanups.push(() => cancelAnimationFrame(raf));
    }

    // Cursor: --cx/--cy en la ventana; --px/--py en la página (se actualizan también al hacer scroll)
    let lastX = 0;
    let lastY = 0;
    const setPage = () => {
      root.style.setProperty("--px", `${lastX + scrollX}px`);
      root.style.setProperty("--py", `${lastY + scrollY}px`);
    };
    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      root.style.setProperty("--cx", `${lastX}px`);
      root.style.setProperty("--cy", `${lastY}px`);
      setPage();
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", setPage, { passive: true });
    cleanups.push(() => {
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", setPage);
    });

    // Botones magnéticos
    if (!reduced && matchMedia("(hover: hover)").matches) {
      document.querySelectorAll<HTMLElement>("[data-mag]").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        };
        const leave = () => (el.style.transform = "");
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}

import { useEffect, useState } from "react";

type Preview = { image?: string; placeholder: string };

/**
 * Foto flotante que sigue al cursor sobre la carta de servicios.
 * Escucha los elementos con data-service (renderizados por Astro) y lee su
 * data-image / data-placeholder. Sigue las variables --cx/--cy que escribe ScrollFx.
 * En pantallas táctiles no se muestra.
 */
export default function ServicePreview() {
  const [active, setActive] = useState<Preview | null>(null);

  useEffect(() => {
    const items = [...document.querySelectorAll<HTMLElement>("[data-service]")];
    const enter = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      setActive({ image: el.dataset.image || undefined, placeholder: el.dataset.placeholder ?? "" });
    };
    const leave = () => setActive(null);
    items.forEach((el) => {
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
    });
    return () =>
      items.forEach((el) => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40 aspect-[3/4] w-57.5 overflow-hidden rounded-t-[115px] rounded-b shadow-[0_30px_60px_rgba(0,0,0,.25)] transition-[transform,background] duration-450 ease-silk pointer-coarse:hidden"
      style={{
        background: active && !active.image ? active.placeholder : undefined,
        transform: `translate(calc(var(--cx, 0px) + 32px), calc(var(--cy, 0px) - 50%)) scale(${active ? 1 : 0})`,
      }}
    >
      {active?.image && <img src={active.image} alt="" className="size-full object-cover" />}
    </div>
  );
}

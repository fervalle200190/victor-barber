import { useEffect, useState } from "react";

type Review = { quote: string; author: string };

/** Reseñas que rotan solas cada 5 s; al elegir una con los indicadores se detiene la rotación. */
export default function Reviews({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [auto, setAuto] = useState(true);

  const show = (i: number) => {
    setVisible(false);
    setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 350);
  };

  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => show((index + 1) % reviews.length), 5200);
    return () => clearInterval(t);
  }, [auto, index, reviews.length]);

  const current = reviews[index];

  return (
    <div className="mx-auto max-w-225 text-center">
      <p className="eyebrow">Reseñas</p>
      <blockquote className="m-0 grid min-h-[3.8em] place-items-center font-display text-[clamp(28px,4vw,52px)] leading-[1.2] italic" aria-live="polite">
        <span className={`transition-[opacity,translate] duration-600 ${visible ? "opacity-100" : "translate-y-3 opacity-0"}`}>
          “{current.quote}”
        </span>
      </blockquote>
      <p className={`eyebrow mt-5 transition-opacity duration-600 ${visible ? "opacity-100" : "opacity-0"}`}>{current.author}</p>
      <div className="mt-7 flex justify-center gap-3" role="group" aria-label="Elegir reseña">
        {reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Reseña ${i + 1}`}
            aria-current={i === index}
            onClick={() => {
              setAuto(false);
              show(i);
            }}
            className={`h-0.5 cursor-pointer border-0 p-0 transition-all duration-300 ${i === index ? "w-14 bg-ink" : "w-9 bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}

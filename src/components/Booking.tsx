import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Service } from "@/data/site";
import { longDate, splitByPartOfDay, upcomingDays, type Day } from "@/lib/booking";

/**
 * Reserva paso a paso, pensada para cualquier persona: una sola pregunta por
 * pantalla, botones grandes, siempre se puede volver, y al final se arma un
 * mensaje de WhatsApp con todo para que Victor confirme.
 *
 * Los servicios de la carta tienen un botón con data-book="<nombre>" que abre
 * la reserva con ese servicio ya elegido.
 *
 * Animación: cada paso entra deslizándose según la dirección (avanzar / volver),
 * la tarjeta ajusta su alto con suavidad y las opciones aparecen escalonadas.
 * Las clases bk-* están en global.css.
 */

type Props = { services: Service[]; whatsappNumber: string };
type Dir = "fwd" | "back";

const STEPS = ["Servicio", "Día", "Hora", "Tus datos"] as const;
/** Pausa tras elegir una opción, para que se vea marcada antes de avanzar */
const CHOICE_PAUSE_MS = 260;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Booking({ services, whatsappNumber }: Props) {
  const bookable = services.filter((s) => s.bookable !== false);

  const [step, setStep] = useState(0); // 0-3 preguntas, 4 revisar, 5 enviado
  // Sin dirección hasta el primer cambio de paso: al cargar la página no se anima nada
  const [dir, setDir] = useState<Dir | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [shake, setShake] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);
  const pending = useRef<number | undefined>(undefined);

  // Los días se calculan solo en el navegador (dependen de la fecha y hora actuales)
  const days = useMemo(() => (service && step >= 1 ? upcomingDays(service.duration) : []), [service, step]);

  // Al cambiar de paso: llevar la vista y el foco a la nueva pregunta
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 || top > innerHeight * 0.4) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => () => window.clearTimeout(pending.current), []);

  // Reinicia la sacudida del campo de nombre cada vez que se intenta seguir sin nombre
  useEffect(() => {
    const el = nameRef.current;
    if (!shake || !el) return;
    el.classList.remove("bk-shake");
    void el.offsetWidth;
    el.classList.add("bk-shake");
    el.focus();
  }, [shake]);

  // Botones "Reservar" de la carta de servicios
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-book]");
      if (!btn) return;
      const chosen = bookable.find((s) => s.name === btn.dataset.book);
      if (!chosen) return;
      e.preventDefault();
      pickService(chosen, false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  });

  function go(next: number) {
    window.clearTimeout(pending.current);
    setDir(next < step ? "back" : "fwd");
    setStep(next);
  }

  /** Marca la opción elegida y avanza tras una pausa breve */
  function goAfterChoice(next: number) {
    window.clearTimeout(pending.current);
    if (prefersReducedMotion()) return go(next);
    pending.current = window.setTimeout(() => {
      setDir("fwd");
      setStep(next);
    }, CHOICE_PAUSE_MS);
  }

  function pickService(s: Service, pause = true) {
    setService(s);
    setDay(null);
    setTime(null);
    if (pause) goAfterChoice(1);
    else go(1);
  }

  function goToReview() {
    if (name.trim().length < 2) {
      setNameError(true);
      setShake((n) => n + 1);
      return;
    }
    setNameError(false);
    go(4);
  }

  function reset() {
    setService(null);
    setDay(null);
    setTime(null);
    setNote("");
    go(0);
  }

  const message =
    service && day && time
      ? [
          "Hola Victor, quiero reservar:",
          `• ${service.name} (${service.price})`,
          `• ${capitalize(longDate(day.date))}, a las ${time}`,
          `• A nombre de: ${name.trim()}`,
          ...(note.trim() ? [`• Nota: ${note.trim()}`] : []),
          "",
          "¿Me confirmas? Gracias.",
        ].join("\n")
      : "";
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div ref={rootRef} className="scroll-mt-24 overflow-hidden border border-line bg-paper text-[19px] leading-snug max-sm:-mx-4 max-sm:border-x-0">
      {/* Cabecera: paso actual, volver, barra de progreso y lo ya elegido (se pliega en la pantalla final) */}
      <div className={`bk-collapse ${step <= 4 ? "" : "is-closed"}`}>
        <div className="min-h-0">
          <div className="px-4 pt-4 sm:px-8 sm:pt-5">
            <div className="flex min-h-12 items-center justify-between gap-4">
              <p className="text-base text-muted" aria-live="polite">
                <span key={step} className={dir ? "bk-fade inline-block" : "inline-block"}>
                  {step < 4 ? `Paso ${step + 1} de ${STEPS.length}` : "Último paso"}
                </span>
              </p>
              <button
                type="button"
                onClick={() => go(step - 1)}
                tabIndex={step > 0 && step <= 4 ? 0 : -1}
                aria-hidden={step === 0}
                className={`${btnBack} transition-[opacity,translate] duration-300 ${step > 0 ? "opacity-100" : "pointer-events-none translate-x-2 opacity-0"}`}
              >
                <span aria-hidden="true" className="bk-arrow">←</span> Volver
              </button>
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {STEPS.map((label, i) => (
                <span key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full origin-left rounded-full bg-gold transition-transform duration-500 ease-silk"
                    style={{ transform: `scaleX(${i <= step ? 1 : 0})`, transitionDelay: `${i <= step ? 80 : 0}ms` }}
                  />
                </span>
              ))}
            </div>
            {/* Lo ya elegido: tocar una etiqueta vuelve a ese paso */}
            <div className={`bk-collapse ${step >= 1 && step <= 3 ? "" : "is-closed"}`}>
              <div className="min-h-0">
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0 pt-4" aria-label="Lo que elegiste">
                  {service && step >= 1 && <Chip onClick={() => go(0)} label="servicio">{service.name}</Chip>}
                  {day && step >= 2 && <Chip onClick={() => go(1)} label="día">{`${day.label} ${day.date.getDate()}`}</Chip>}
                  {time && step >= 3 && <Chip onClick={() => go(2)} label="hora">{time}</Chip>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AutoHeight>
        <div key={step} data-dir={dir ?? undefined} className="bk-step px-4 pt-6 pb-8 sm:px-8 sm:pb-10">
          {step === 0 && (
            <Question headingRef={headingRef} title="¿Qué te vas a hacer?">
              <div className="grid gap-3 sm:grid-cols-2">
                {bookable.map((s, i) => {
                  const active = service?.name === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => pickService(s)}
                      aria-pressed={active}
                      style={stagger(i)}
                      className={`bk-item ${choice(active)} min-h-20 items-start py-4 text-left`}
                    >
                      <span className="flex w-full items-start justify-between gap-4">
                        <span className="flex min-w-0 items-center gap-2.5 font-display text-[26px] leading-tight">
                          <Check on={active} />
                          {s.name}
                        </span>
                        <span className="flex flex-none flex-col items-end">
                          <span className="font-display text-[24px] leading-tight tabular-nums">{s.price}</span>
                          <span className="text-sm whitespace-nowrap text-muted transition-colors group-aria-pressed:text-stone/75">{s.minutes}</span>
                        </span>
                      </span>
                      <span className="mt-1.5 block pr-14 text-base text-muted transition-colors group-aria-pressed:text-stone/75">
                        {s.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Question>
          )}

          {step === 1 && service && (
            <Question headingRef={headingRef} title="¿Qué día te viene bien?">
              {days.length === 0 ? (
                <NoAvailability whatsappNumber={whatsappNumber} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {days.map((d, i) => {
                    const active = day?.date.getTime() === d.date.getTime();
                    return (
                      <button
                        key={d.date.toISOString()}
                        type="button"
                        onClick={() => {
                          setDay(d);
                          setTime(null);
                          goAfterChoice(2);
                        }}
                        aria-pressed={active}
                        style={stagger(i)}
                        className={`bk-item ${choice(active)} min-h-20 items-center py-4 text-center`}
                      >
                        <span className="block font-display text-[26px] leading-tight">{d.label}</span>
                        <span className="block text-base text-muted transition-colors group-aria-pressed:text-stone/75">{d.dayMonth}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Question>
          )}

          {step === 2 && service && day && (
            <Question
              headingRef={headingRef}
              title="¿A qué hora?"
              hint={capitalize(longDate(day.date))}
            >
              {(() => {
                const parts = splitByPartOfDay(day.slots);
                let n = 0;
                return (["morning", "afternoon"] as const).map((part) => {
                  const slots = parts[part];
                  if (slots.length === 0) return null;
                  return (
                    <div key={part} className="mt-2 first:mt-0">
                      <p className="bk-item mb-3 text-base text-muted" style={stagger(n++)}>
                        {part === "morning" ? "Por la mañana" : "Por la tarde"}
                      </p>
                      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                        {slots.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setTime(t);
                              goAfterChoice(3);
                            }}
                            aria-pressed={time === t}
                            style={stagger(n++, 22)}
                            className={`bk-item ${choice(time === t)} min-h-16 items-center py-3 text-center font-display text-[24px] tabular-nums`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </Question>
          )}

          {step === 3 && (
            <Question headingRef={headingRef} title="¿A nombre de quién?">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  goToReview();
                }}
                className="flex max-w-xl flex-col gap-6"
              >
                <div className="bk-item" style={stagger(0)}>
                  <label htmlFor="bk-name" className="mb-2 block text-base text-muted">
                    Tu nombre
                  </label>
                  <input
                    id="bk-name"
                    ref={nameRef}
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(false);
                    }}
                    aria-invalid={nameError}
                    aria-describedby={nameError ? "bk-name-error" : undefined}
                    className={`${field} ${nameError ? "border-[#a33]" : "border-line"}`}
                  />
                  <div className={`bk-collapse ${nameError ? "" : "is-closed"}`}>
                    <div className="min-h-0">
                      <p id="bk-name-error" className="pt-2 text-base text-[#a33]">
                        Escribe tu nombre para que Victor sepa quién va.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bk-item" style={stagger(1)}>
                  <label htmlFor="bk-note" className="mb-2 block text-base text-muted">
                    ¿Algo que Victor deba saber? <span className="text-muted/80">(si no, déjalo en blanco)</span>
                  </label>
                  <textarea id="bk-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={`${field} resize-none border-line`} />
                </div>
                <button type="submit" className={`bk-item ${btnPrimary}`} style={stagger(2)}>
                  Continuar <span aria-hidden="true" className="bk-arrow-fwd">→</span>
                </button>
              </form>
            </Question>
          )}

          {step === 4 && service && day && time && (
            <Question headingRef={headingRef} title="Revisa tu reserva">
              <dl className="max-w-xl divide-y divide-line border-y border-line">
                <SummaryRow i={0} label="Servicio" value={`${service.name} · ${service.price}`} onChange={() => go(0)} />
                <SummaryRow i={1} label="Día" value={capitalize(longDate(day.date))} onChange={() => go(1)} />
                <SummaryRow i={2} label="Hora" value={time} onChange={() => go(2)} />
                <SummaryRow i={3} label="Nombre" value={name.trim()} onChange={() => go(3)} />
                {note.trim() && <SummaryRow i={4} label="Nota" value={note.trim()} onChange={() => go(3)} />}
              </dl>
              <a href={waUrl} target="_blank" rel="noopener" onClick={() => go(5)} className={`bk-item bk-glow ${btnPrimary} mt-6`} style={stagger(5)}>
                <ChatIcon />
                Enviar por WhatsApp
              </a>
              <p className="bk-item mt-3 max-w-xl text-base text-muted" style={stagger(6)}>
                Se abre WhatsApp con este mensaje ya escrito. Victor te responde para confirmar.
              </p>
            </Question>
          )}

          {step === 5 && (
            <div>
              <DoneMark />
              <Question headingRef={headingRef} title="Falta un toque">
                <ol className="max-w-xl list-none space-y-4 p-0">
                  {[
                    <>Se abrió WhatsApp con tu mensaje escrito.</>,
                    <>
                      Toca <strong className="font-medium">Enviar</strong> en WhatsApp.
                    </>,
                    <>Victor te contesta por ahí para confirmar tu hora.</>,
                  ].map((text, i) => (
                    <li key={i} className="bk-item flex items-center gap-4" style={stagger(i + 2, 120)}>
                      <Num>{i + 1}</Num>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="bk-item mt-8 flex max-w-xl flex-col gap-2" style={stagger(6, 120)}>
                  <p className="text-base text-muted">¿No se abrió WhatsApp?</p>
                  <a href={waUrl} target="_blank" rel="noopener" className={btnOutline}>
                    <ChatIcon />
                    Abrir WhatsApp otra vez
                  </a>
                  <button type="button" onClick={reset} className={`${btnGhost} mt-2 justify-center`}>
                    Hacer otra reserva
                  </button>
                </div>
              </Question>
            </div>
          )}
        </div>
      </AutoHeight>
    </div>
  );
}

/* ---------- piezas ---------- */

const press = "transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97]";
const choiceBase = `group flex w-full cursor-pointer flex-col justify-center rounded-md border-2 px-5 ${press} hover:border-ink focus-visible:border-ink`;
const choice = (active: boolean) => `${choiceBase} ${active ? "border-ink bg-ink text-stone" : "border-line bg-stone text-ink"}`;
const field =
  "w-full rounded-md border-2 bg-stone px-4 py-4 text-[20px] text-ink outline-none transition-colors duration-200 focus:border-ink";
const btnPrimary = `group inline-flex min-h-16 w-full max-w-xl cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-ink bg-ink px-6 text-[18px] font-normal tracking-[0.08em] text-stone uppercase no-underline ${press} hover:border-gold hover:bg-gold`;
const btnOutline = `group inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-ink px-5 text-[17px] text-ink no-underline ${press} hover:bg-ink hover:text-stone`;
const btnSmall = `inline-flex min-h-10 flex-none cursor-pointer items-center rounded-full border border-line bg-stone px-3.5 text-[15px] text-ink hover:border-ink ${press}`;
const btnBack = `inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border-2 border-line bg-stone px-4 text-[17px] text-ink hover:border-ink ${press}`;
const btnGhost =
  "group inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 text-[18px] text-ink underline-offset-4 hover:underline";

/** Retraso escalonado para las opciones que aparecen una tras otra */
const stagger = (i: number, stepMs = 45): CSSProperties => ({ animationDelay: `${90 + Math.min(i, 14) * stepMs}ms` });

/** Contenedor que anima su alto cuando cambia el contenido */
function AutoHeight({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bk-height" style={{ height }}>
      <div ref={inner}>{children}</div>
    </div>
  );
}

function Question({
  title,
  hint,
  headingRef,
  children,
}: {
  title: string;
  hint?: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 ref={headingRef} tabIndex={-1} className="bk-title text-[clamp(30px,4vw,44px)] leading-tight outline-none">
        {title}
      </h3>
      {hint && <p className="bk-title mt-1 text-muted [animation-delay:60ms]">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SummaryRow({ i, label, value, onChange }: { i: number; label: string; value: string; onChange: () => void }) {
  return (
    <div className="bk-item flex items-center justify-between gap-4 py-3" style={stagger(i, 70)}>
      <div className="min-w-0">
        <dt className="text-base text-muted">{label}</dt>
        <dd className="m-0 font-display text-[24px] leading-tight break-words">{value}</dd>
      </div>
      <button type="button" onClick={onChange} className={btnSmall} aria-label={`Cambiar ${label.toLowerCase()}`}>
        Cambiar
      </button>
    </div>
  );
}

function NoAvailability({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <p className="bk-item max-w-xl">
      No quedan horarios libres en las próximas dos semanas.{" "}
      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener" className="text-gold underline">
        Escríbele a Victor
      </a>{" "}
      y lo buscan juntos.
    </p>
  );
}

/** Etiqueta con algo ya elegido; al tocarla se vuelve a ese paso */
function Chip({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <li className="bk-fade">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Cambiar ${label}: ${children}`}
        className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3.5 text-[16px] text-ink hover:border-gold max-sm:px-3 ${press}`}
      >
        <span className="text-[13px] text-gold max-sm:hidden" aria-hidden="true">✓</span>
        {children}
      </button>
    </li>
  );
}

/** Marca circular que aparece en la opción elegida */
function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-6 flex-none place-items-center rounded-full bg-gold text-[14px] text-ink transition-[transform,opacity,width,margin] duration-300 ease-silk ${on ? "w-6 scale-100 opacity-100" : "-mr-2.5 w-0 scale-0 opacity-0"}`}
    >
      ✓
    </span>
  );
}

/** Check que se dibuja en la pantalla final */
function DoneMark() {
  return (
    <svg className="bk-done mb-6" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="33" stroke="var(--color-gold)" strokeWidth="2.5" />
      <path d="M23 37.5 32 46 50 27" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Num({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-10 flex-none place-items-center rounded-full bg-ink font-display text-[20px] text-stone" aria-hidden="true">
      {children}
    </span>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="transition-transform duration-300 group-hover:-rotate-8">
      <path d="M4 19.5 5.3 15.6A8 8 0 1 1 8.6 18.8Z" strokeLinejoin="round" />
    </svg>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

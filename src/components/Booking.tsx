import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Service } from "@/data/site";
import { longDate, splitByPartOfDay, upcomingDays, type Day } from "@/lib/booking";

/**
 * Reserva paso a paso, pensada para cualquier persona: una sola pregunta por
 * pantalla, botones grandes, siempre se puede volver, y al final se arma un
 * mensaje de WhatsApp con todo para que Victor confirme.
 *
 * Los servicios de la carta tienen un botón con data-book="<nombre>" que abre
 * la reserva con ese servicio ya elegido.
 */

type Props = { services: Service[]; whatsappNumber: string };

const STEPS = ["Servicio", "Día", "Hora", "Tus datos"] as const;

export default function Booking({ services, whatsappNumber }: Props) {
  const bookable = services.filter((s) => s.bookable !== false);

  const [step, setStep] = useState(0); // 0-3 preguntas, 4 revisar, 5 enviado
  const [service, setService] = useState<Service | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

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

  // Botones "Reservar" de la carta de servicios
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-book]");
      if (!btn) return;
      const chosen = bookable.find((s) => s.name === btn.dataset.book);
      if (!chosen) return;
      e.preventDefault();
      pickService(chosen);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  });

  function pickService(s: Service) {
    setService(s);
    setDay(null);
    setTime(null);
    setStep(1);
  }

  function goToReview() {
    if (name.trim().length < 2) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    setNameError(false);
    setStep(4);
  }

  function reset() {
    setService(null);
    setDay(null);
    setTime(null);
    setNote("");
    setStep(0);
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
    <div ref={rootRef} className="scroll-mt-24 border border-line bg-paper text-[19px] leading-snug">
      {/* Cabecera: progreso y volver */}
      {step <= 4 && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-8">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className={`${btnGhost} -ml-3`}>
              <span aria-hidden="true">←</span> Volver
            </button>
          ) : (
            <span />
          )}
          <p className="text-base text-muted" aria-live="polite">
            {step < 4 ? `Paso ${step + 1} de ${STEPS.length}` : "Último paso"}
          </p>
        </div>
      )}
      {step <= 4 && (
        <div className="flex gap-1.5 px-5 pt-4 sm:px-8" aria-hidden="true">
          {STEPS.map((label, i) => (
            <span key={label} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-gold" : "bg-line"}`} />
          ))}
        </div>
      )}

      <div className="px-5 pt-6 pb-8 sm:px-8 sm:pb-10">
        {step === 0 && (
          <Question headingRef={headingRef} title="¿Qué te vas a hacer?">
            <div className="grid gap-3 sm:grid-cols-2">
              {bookable.map((s) => (
                <button key={s.name} type="button" onClick={() => pickService(s)} aria-pressed={service?.name === s.name}
                  className={`${choice(service?.name === s.name)} min-h-20 items-start py-4 text-left`}>
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span className="font-display text-[26px] leading-tight">{s.name}</span>
                    <span className="font-display text-[24px] tabular-nums">{s.price}</span>
                  </span>
                  <span className="mt-1 block text-base text-muted group-aria-pressed:text-stone/75">
                    {s.description} · {s.minutes}
                  </span>
                </button>
              ))}
            </div>
          </Question>
        )}

        {step === 1 && service && (
          <Question headingRef={headingRef} title="¿Qué día te viene bien?" hint={`Para: ${service.name}`}>
            {days.length === 0 ? (
              <NoAvailability whatsappNumber={whatsappNumber} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {days.map((d) => (
                  <button
                    key={d.date.toISOString()}
                    type="button"
                    onClick={() => {
                      setDay(d);
                      setTime(null);
                      setStep(2);
                    }}
                    aria-pressed={day?.date.getTime() === d.date.getTime()}
                    className={`${choice(day?.date.getTime() === d.date.getTime())} min-h-20 items-center py-4 text-center`}
                  >
                    <span className="block font-display text-[26px] leading-tight">{d.label}</span>
                    <span className="block text-base text-muted group-aria-pressed:text-stone/75">{d.dayMonth}</span>
                  </button>
                ))}
              </div>
            )}
          </Question>
        )}

        {step === 2 && service && day && (
          <Question headingRef={headingRef} title="¿A qué hora?" hint={day.label === "Hoy" || day.label === "Mañana" ? `${day.label}, ${longDate(day.date)}` : capitalize(longDate(day.date))}>
            {(["morning", "afternoon"] as const).map((part) => {
              const slots = splitByPartOfDay(day.slots)[part];
              if (slots.length === 0) return null;
              return (
                <div key={part} className="mt-2 first:mt-0">
                  <p className="mb-3 text-base text-muted">{part === "morning" ? "Por la mañana" : "Por la tarde"}</p>
                  <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTime(t);
                          setStep(3);
                        }}
                        aria-pressed={time === t}
                        className={`${choice(time === t)} min-h-16 items-center py-3 text-center font-display text-[24px] tabular-nums`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
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
              <div>
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
                  className={`${field} ${nameError ? "border-[#a33]" : ""}`}
                />
                {nameError && (
                  <p id="bk-name-error" className="mt-2 text-base text-[#a33]">
                    Escribe tu nombre para que Victor sepa quién va.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="bk-note" className="mb-2 block text-base text-muted">
                  ¿Algo que Victor deba saber? <span className="text-muted/80">(si no, déjalo en blanco)</span>
                </label>
                <textarea id="bk-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={`${field} resize-none`} />
              </div>
              <button type="submit" className={btnPrimary}>
                Continuar
              </button>
            </form>
          </Question>
        )}

        {step === 4 && service && day && time && (
          <Question headingRef={headingRef} title="Revisa tu reserva">
            <dl className="max-w-xl divide-y divide-line border-y border-line">
              <SummaryRow label="Servicio" value={`${service.name} · ${service.price}`} onChange={() => setStep(0)} />
              <SummaryRow label="Día" value={capitalize(longDate(day.date))} onChange={() => setStep(1)} />
              <SummaryRow label="Hora" value={time} onChange={() => setStep(2)} />
              <SummaryRow label="Nombre" value={name.trim()} onChange={() => setStep(3)} />
              {note.trim() && <SummaryRow label="Nota" value={note.trim()} onChange={() => setStep(3)} />}
            </dl>
            <p className="mt-6 max-w-xl text-muted">
              Al tocar el botón se abre WhatsApp con este mensaje ya escrito. Victor te responde para confirmar.
            </p>
            <a href={waUrl} target="_blank" rel="noopener" onClick={() => setStep(5)} className={`${btnPrimary} mt-6`}>
              <ChatIcon />
              Enviar por WhatsApp
            </a>
          </Question>
        )}

        {step === 5 && (
          <Question headingRef={headingRef} title="Falta un toque">
            <ol className="max-w-xl list-none space-y-4 p-0">
              <li className="flex gap-4">
                <Num>1</Num>
                <span>Se abrió WhatsApp con tu mensaje escrito.</span>
              </li>
              <li className="flex gap-4">
                <Num>2</Num>
                <span>
                  Toca <strong className="font-medium">Enviar</strong> en WhatsApp.
                </span>
              </li>
              <li className="flex gap-4">
                <Num>3</Num>
                <span>Victor te contesta por ahí para confirmar tu hora.</span>
              </li>
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={waUrl} target="_blank" rel="noopener" className={btnOutline}>
                No se abrió WhatsApp, probar otra vez
              </a>
              <button type="button" onClick={reset} className={btnGhost}>
                Hacer otra reserva
              </button>
            </div>
          </Question>
        )}
      </div>
    </div>
  );
}

/* ---------- piezas ---------- */

const choiceBase =
  "group flex w-full cursor-pointer flex-col justify-center rounded-md border-2 px-5 transition-colors duration-200 hover:border-ink focus-visible:border-ink";
const choice = (active: boolean) => `${choiceBase} ${active ? "border-ink bg-ink text-stone" : "border-line bg-stone text-ink"}`;
const field =
  "w-full rounded-md border-2 border-line bg-stone px-4 py-4 text-[20px] text-ink outline-none transition-colors focus:border-ink";
const btnPrimary =
  "inline-flex min-h-16 w-full max-w-xl cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-ink bg-ink px-6 text-[18px] font-normal tracking-[0.08em] text-stone uppercase no-underline transition-colors hover:border-gold hover:bg-gold";
const btnOutline =
  "inline-flex min-h-14 cursor-pointer items-center justify-center rounded-md border-2 border-ink px-5 text-base text-ink no-underline transition-colors hover:bg-ink hover:text-stone";
const btnGhost =
  "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 text-[18px] text-ink underline-offset-4 hover:underline";

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
      <h3 ref={headingRef} tabIndex={-1} className="text-[clamp(30px,4vw,44px)] leading-tight outline-none">
        {title}
      </h3>
      {hint && <p className="mt-1 text-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, onChange }: { label: string; value: string; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <dt className="text-base text-muted">{label}</dt>
        <dd className="m-0 font-display text-[24px] leading-tight break-words">{value}</dd>
      </div>
      <button type="button" onClick={onChange} className={btnGhost} aria-label={`Cambiar ${label.toLowerCase()}`}>
        Cambiar
      </button>
    </div>
  );
}

function NoAvailability({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <p className="max-w-xl">
      No quedan horarios libres en las próximas dos semanas.{" "}
      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener" className="text-gold underline">
        Escríbele a Victor
      </a>{" "}
      y lo buscan juntos.
    </p>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 19.5 5.3 15.6A8 8 0 1 1 8.6 18.8Z" strokeLinejoin="round" />
    </svg>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

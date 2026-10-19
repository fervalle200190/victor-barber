// Contenido de la web. Los datos marcados como ejemplo hay que reemplazarlos por los reales.

export const contact = {
  name: "Victor",
  tagline: "Barbería de autor",
  // TODO: número real en formato internacional sin "+" ni espacios, p. ej. 34600111222
  whatsappNumber: "",
  phoneDisplay: "+00 000 000 0000",
  instagram: "victor.barber",
  address: ["Av. Principal 123, Local 4", "Tu ciudad"],
  mapsUrl: "https://maps.google.com/",
};

export const whatsappUrl = (text = "Hola Victor, quería consultar por un corte.") =>
  `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(text)}`;

export const instagramUrl = `https://instagram.com/${contact.instagram}`;

// Horario que se muestra en Contacto. Debe coincidir con `schedule`.
export const hours = [
  { days: "Mar – Vie", time: "10:00 am – 8:00 pm" },
  { days: "Sábado", time: "9:00 am – 7:00 pm" },
  { days: "Dom – Lun", time: "Cerrado" },
];

/**
 * Horario que usa la reserva para ofrecer días y horas.
 * Clave: día de la semana (0 = domingo … 6 = sábado). Los días sin clave están cerrados.
 */
export const schedule: Record<number, { open: string; close: string }> = {
  2: { open: "10:00", close: "20:00" },
  3: { open: "10:00", close: "20:00" },
  4: { open: "10:00", close: "20:00" },
  5: { open: "10:00", close: "20:00" },
  6: { open: "09:00", close: "19:00" },
};

export const booking = {
  /** Cada cuántos minutos se ofrece un horario */
  slotMinutes: 30,
  /** Cuántos días hacia adelante se puede reservar */
  daysAhead: 14,
  /** Margen mínimo antes de un turno de hoy */
  minNoticeMinutes: 60,
};

export type Service = {
  name: string;
  price: string;
  minutes: string;
  /** Duración en minutos, para calcular hasta qué hora se puede reservar */
  duration: number;
  /** false para extras que no se reservan solos */
  bookable?: boolean;
  description: string;
  /** Imagen para la vista previa flotante. Mientras no haya fotos se usa `placeholder`. */
  image?: string;
  placeholder: string;
};

export const services: Service[] = [
  { name: "Corte clásico", price: "$15", minutes: "40 min", duration: 40, description: "Tijera y máquina, acabado a navaja en nuca y patillas.", placeholder: "linear-gradient(160deg,#4b463e,#151410)" },
  { name: "Fade", price: "$18", minutes: "50 min", duration: 50, description: "Low, mid o high. Transición limpia desde piel.", placeholder: "linear-gradient(200deg,#8d877c,#3a362f)" },
  { name: "Barba a navaja", price: "$12", minutes: "30 min", duration: 30, description: "Perfilado, toalla caliente y aceite de cedro.", placeholder: "linear-gradient(170deg,#5a4a36,#16110b)" },
  { name: "Corte y barba", price: "$25", minutes: "75 min", duration: 75, description: "El ritual completo. El más pedido.", placeholder: "linear-gradient(150deg,#3d3a35,#0f0e0c)" },
  { name: "Diseño a mano", price: "+$5", minutes: "+15 min", duration: 15, bookable: false, description: "Líneas y figuras a mano alzada sobre el corte.", placeholder: "linear-gradient(140deg,#a39b8d,#4a453d)" },
  { name: "Corte niño", price: "$12", minutes: "30 min", duration: 30, description: "Hasta 12 años, con paciencia incluida.", placeholder: "linear-gradient(190deg,#6d665a,#1d1b17)" },
];

export type Work = { title: string; image?: string; placeholder: string };

export const works: Work[] = [
  { title: "Mid fade, textura arriba", placeholder: "linear-gradient(160deg,#4b463e,#151410)" },
  { title: "Clásico a tijera", placeholder: "linear-gradient(200deg,#8d877c,#3a362f)" },
  { title: "Barba esculpida", placeholder: "linear-gradient(170deg,#2c2925,#5d564b)" },
  { title: "Crop francés", placeholder: "linear-gradient(140deg,#a39b8d,#4a453d)" },
  { title: "Taper con navaja", placeholder: "linear-gradient(190deg,#3a362f,#0f0e0c)" },
];

// Reseñas de ejemplo: reemplazar por reseñas reales de Google.
export const reviews = [
  { quote: "El fade más limpio que me han hecho. Llegué con una foto y salí igual.", author: "Andrés M. · Google" },
  { quote: "Puntual, tranquilo y obsesivo con la barba. Ya es mi barbero fijo.", author: "Luis R. · Google" },
  { quote: "Le cortó a mi hijo con una paciencia increíble. Volvemos cada mes.", author: "Carolina P. · Google" },
];

export const stats = [
  { value: 8, suffix: "+", label: "años" },
  { value: 3200, suffix: "", label: "cortes" },
  { value: 4.9, suffix: "★", label: "Google" },
];

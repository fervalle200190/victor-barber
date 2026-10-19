# Victor · Barbería de autor

Web de presentación de Victor, barbero. Hecha con Astro, React y Tailwind CSS v4.

## Requisitos

Node 22.12 o superior (hay un `.nvmrc`; con nvm basta con `nvm use`).

## Comandos

| Comando           | Qué hace                                   |
| ----------------- | ------------------------------------------ |
| `npm install`     | Instala dependencias                       |
| `npm run dev`     | Servidor local en http://localhost:4321    |
| `npm run build`   | Genera el sitio estático en `dist/`        |
| `npm run preview` | Sirve `dist/` para revisar la versión final |
| `npm run check`   | Revisa tipos de Astro y TypeScript         |

## Dónde se edita cada cosa

- **Textos, precios, horario, contacto y reseñas:** `src/data/site.ts`. Falta poner el número de WhatsApp real en `whatsappNumber`.
- **Fotos:** guárdalas en `public/fotos/` y asigna la ruta en `image` de cada servicio o trabajo incluyendo la base del sitio (`/victor-barber/fotos/fade.jpg`). Mientras no haya foto se usa el degradado de `placeholder`. Las fotos del inicio y de "Sobre Victor" están marcadas con `TODO` en `Hero.astro` y `About.astro`.
- **Colores y tipografías:** el bloque `@theme` de `src/styles/global.css`.

## Cómo funcionan las animaciones

`src/components/ScrollFx.tsx` es un componente React sin interfaz que lee atributos `data-*` del HTML:

| Atributo       | Efecto                                                        |
| -------------- | ------------------------------------------------------------- |
| `data-r`       | Aparece al entrar en pantalla (`data-r="clip"`: cortina)      |
| `data-load`    | Entrada letra a letra al cargar (con `SplitText`)             |
| `data-words`   | Las palabras se iluminan según avanza el scroll               |
| `data-count`   | Número que cuenta hasta su valor                              |
| `data-prog`    | Variable `--p` (0 a 1) mientras el elemento cruza la pantalla |
| `data-pin`     | Variable `--p` mientras una sección alta está anclada         |
| `data-mag`     | Botón magnético                                               |

Además escribe en `:root` `--sy` (progreso de la página), `--cx`/`--cy` (cursor en la ventana) y `--px`/`--py` (cursor en la página).
Todas las animaciones se apagan si el dispositivo pide reducir el movimiento.

Los componentes React interactivos son `ServicePreview` (foto flotante en la carta), `Reviews` (reseñas rotativas) y `Booking` (reserva). El resto es HTML estático de Astro.

## Reserva

`src/components/Booking.tsx` pregunta en cuatro pasos servicio, día, hora y nombre, muestra un resumen y abre WhatsApp con el mensaje escrito para que Victor confirme. No guarda nada: el sitio es estático y la confirmación la hace Victor por WhatsApp.

- **Horario de reservas:** `schedule` en `src/data/site.ts` (tiene que coincidir con `hours`, que es el que se muestra en Contacto).
- **Intervalo entre horarios, días hacia adelante y margen para reservar hoy:** `booking` en el mismo archivo.
- **Duración de cada servicio:** `duration`. Los servicios con `bookable: false` (extras) no aparecen en la reserva.
- Cada servicio de la carta tiene un botón "Reservar" (`data-book`) que abre la reserva con ese servicio elegido.
- La lógica de días y horarios está en `src/lib/booking.ts`.
- Las animaciones del flujo (entrada de cada paso según avance o retroceso, alto de la tarjeta, opciones escalonadas, check final) usan las clases `bk-*` de `src/styles/global.css`. Solo se animan los cambios de paso, no la carga de la página.

Como no hay base de datos, la web no sabe qué horas ya están tomadas. Para eso hace falta un backend o un servicio de agenda (Google Calendar, Cal.com, etc.).

## Publicación

Se publica sola en GitHub Pages (https://fervalle200190.github.io/victor-barber/) con cada push a `main`, mediante `.github/workflows/deploy.yml`. Si se pasa a un dominio propio, cambiar `site` y quitar `base` en `astro.config.mjs`.

Los prototipos HTML anteriores están en `prototipos/`.

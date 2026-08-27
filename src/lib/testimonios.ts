/**
 * ⚠️ TESTIMONIOS DE MUESTRA — NO SON REALES ⚠️
 *
 * Están inventados para poder ver y ajustar el diseño de la sección
 * mientras se construye la tienda.
 *
 * ── Antes de publicar la web hay que reemplazarlos ──
 *
 * Publicar reseñas inventadas como si fueran de clientas de verdad es
 * publicidad engañosa: la Ley de Defensa del Consumidor lo prohíbe, y
 * además es la clase de cosa que destruye la confianza de golpe si
 * alguien lo nota. Esto es un andamio, no contenido.
 *
 * ── La regla al escribir los de verdad ──
 *
 * De LILUS-AUDIOVISUAL/05-claims/lo-que-no-se-puede-decir.md:
 *
 *   «Si una clienta dice "me curó el acné" y tú lo repites, fijas o
 *   pones en un video, ese claim pasa a ser TUYO. No te protege que lo
 *   haya dicho otra persona: al difundirlo lo estás usando como
 *   publicidad.»
 *
 * Un comentario espontáneo en Instagram no es tuyo. Ese mismo comentario
 * puesto en esta página, sí. Por eso los de abajo hablan solo de olor,
 * textura, espuma, empaque y trato — nada de curar, tratar ni eliminar.
 * Cuando entren los reales, tienen que cumplir lo mismo.
 */

export type Testimonio = {
  texto: string;
  nombre: string;
  detalle: string;
};

export const TESTIMONIOS_DE_MUESTRA: Testimonio[] = [
  {
    texto:
      "El de café huele exactamente a café, no a perfume de café. Se nota la diferencia desde que abres la caja.",
    nombre: "Andrea Salazar",
    detalle: "Quito",
  },
  {
    texto:
      "Compré el pack de lavanda para regalo y terminé quedándomelo. La espuma es mucho más cremosa de lo que esperaba.",
    nombre: "Mariela Cedeño",
    detalle: "Guayaquil",
  },
  {
    texto:
      "Llevo tres pedidos. Lo que más me gusta es que cada barra viene con su fecha: se nota que llevan la cuenta de lo que hacen.",
    nombre: "Paulina Andrade",
    detalle: "Cuenca",
  },
  {
    texto:
      "Le pregunté por WhatsApp cuál me convenía para piel grasa y me explicaron qué llevaba cada uno. No me vendieron el más caro.",
    nombre: "Doménica Ruiz",
    detalle: "Ambato",
  },
  {
    texto: "El empaque llegó impecable y el jabón entero. Se nota el cuidado.",
    nombre: "Verónica Lema",
    detalle: "Quito",
  },
  {
    texto:
      "Es transparente de verdad, se ven los pedacitos adentro. Mis hijas pelean por usarlo.",
    nombre: "Cristina Vaca",
    detalle: "Manta",
  },
];

/**
 * Los logos de Instagram y TikTok, dibujados aquí.
 *
 * Lucide —de donde sale el resto de iconos— retiró los de marca, y con
 * razón: son marcas registradas y mantenerlas al día no es su trabajo.
 * Poner una cámara genérica en su lugar sería peor: nadie reconoce
 * «Instagram» en una cámara, y el punto de estos dos botones es que se
 * reconozcan de un vistazo sin leer.
 *
 * Van como trazo y no rellenos para que hagan juego con los demás, que
 * son de línea. Heredan el color del texto (`currentColor`), así que
 * cambian solos con el tema y al pasar el cursor.
 */

type Props = { className?: string };

export function IconoInstagram({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoTikTok({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/*
        La nota musical de TikTok: el gancho de arriba a la derecha y el
        círculo de abajo a la izquierda, unidos por el tallo.
      */}
      <path d="M15 4v9.5a4.5 4.5 0 1 1-4.5-4.5" />
      <path d="M15 4c.4 2.2 2 3.7 4.2 3.9" />
    </svg>
  );
}

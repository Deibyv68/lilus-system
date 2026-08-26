import Image from "next/image";

/**
 * La foto de un artículo, o su ausencia.
 *
 * Todavía no hay fotos de tienda cargadas, así que el caso sin imagen no
 * es un borde raro: hoy es el caso normal. Un cuadro gris con un ícono roto
 * haría ver la tienda como si estuviera fallando. En su lugar va el sello
 * de la marca sobre el papel de fondo — se lee como "esto es un LILUS del
 * que todavía no hay foto", que es la verdad.
 */
export function ImagenArticulo({
  url,
  alt,
  nombre,
  prioridad = false,
  className = "",
}: {
  url: string | null;
  alt: string | null;
  nombre: string;
  prioridad?: boolean;
  className?: string;
}) {
  if (url) {
    return (
      <Image
        src={url}
        // Si nadie escribió el texto alternativo, el nombre es mejor que
        // nada: quien navega sin ver al menos sabe qué producto es.
        alt={alt ?? nombre}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        priority={prioridad}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-tienda-velo"
      // Decorativo: el nombre del producto ya está escrito al lado.
      aria-hidden="true"
    >
      <Image
        src="/brand/lilus-logo.png"
        alt=""
        width={72}
        height={72}
        className="rounded-full opacity-10 grayscale"
      />
    </div>
  );
}

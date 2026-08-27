import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ULTIMA_ACTUALIZACION_LEGAL } from "@/lib/politicas";

/**
 * El marco de las tres páginas legales.
 *
 * Se leen poco y se leen mal: casi siempre cuando alguien ya está enojado
 * y busca una frase concreta. Por eso van en columna angosta, con títulos
 * frecuentes y sin párrafos largos — para que se puedan barrer con la
 * vista en vez de tener que leerlas enteras.
 *
 * Y en el mismo castellano llano que el resto del sitio. Un texto legal
 * escrito para que no se entienda protege menos, no más: si la clienta no
 * entendió la política de devoluciones, la discusión la vas a tener igual.
 */
export function MarcoLegal({
  titulo,
  entrada,
  children,
}: {
  titulo: string;
  entrada: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 py-2 text-sm text-tienda-tenue transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Volver al catálogo
      </Link>

      <h1 className="mt-8 text-2xl font-medium tracking-tight text-balance">
        {titulo}
      </h1>
      <p className="mt-3 text-tienda-tenue leading-relaxed text-pretty">{entrada}</p>

      <div className="mt-10 space-y-9">{children}</div>

      <p className="mt-14 border-t border-tienda-linea pt-5 text-xs text-tienda-tenue">
        Última actualización: {ULTIMA_ACTUALIZACION_LEGAL}. Si algo de esto
        cambia, lo cambiamos aquí y la fecha lo dice.
      </p>
    </div>
  );
}

export function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-medium">{titulo}</h2>
      <div className="mt-2.5 space-y-3 leading-relaxed text-tienda-texto text-pretty">
        {children}
      </div>
    </section>
  );
}

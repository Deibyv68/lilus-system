import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { AvisosForm } from "./avisos-form";

export const dynamic = "force-dynamic";

/**
 * Los avisos de venta nueva.
 *
 * La clave pública VAPID se lee acá, en el servidor, y baja al navegador
 * como una prop. No va por `NEXT_PUBLIC_`: esa forma la hornea en el
 * build, y entonces cambiar las claves obligaría a reconstruir la app en
 * vez de reiniciar el servicio.
 */
export default async function PaginaAvisos() {
  const aparatos = await prisma.pushSubscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Link
        href="/sistema/configuracion"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Configuración
      </Link>

      <PageHeader
        title="Avisos de venta"
        description={
          aparatos.length > 0
            ? `${aparatos.length} aparato${aparatos.length === 1 ? "" : "s"} recibiendo avisos`
            : "Todavía ningún aparato recibe avisos"
        }
      />

      <AvisosForm
        clavePublica={process.env.VAPID_PUBLIC_KEY?.trim() || null}
        aparatos={aparatos.map((a) => ({
          id: a.id,
          endpoint: a.endpoint,
          etiqueta: a.etiqueta,
          createdAt: formatDate(a.createdAt),
        }))}
      />

      <div className="mt-10 rounded-lg border bg-muted/40 p-4">
        <h2 className="text-sm font-semibold">Qué avisa y qué no</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-foreground">Sí avisa:</strong>{" "}
            cuando alguien compra por la web. Llega al instante, con el nombre
            y el total.
          </li>
          <li>
            <strong className="font-medium text-foreground">No avisa:</strong>{" "}
            los pedidos que se crean a mano desde el panel — esos ya los sabes,
            los acabas de escribir tú.
          </li>
          <li>
            El correo sigue saliendo igual, si está configurado. El aviso al
            teléfono se suma, no lo reemplaza.
          </li>
        </ul>
      </div>
    </>
  );
}

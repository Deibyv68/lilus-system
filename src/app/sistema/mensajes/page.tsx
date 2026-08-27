import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { formatDateTime } from "@/lib/format";
import { ListaDeMensajes } from "./lista";

export const dynamic = "force-dynamic";

/**
 * Los mensajes que dejó la gente en la página de contacto.
 *
 * Existe porque el formulario guarda en la base en vez de mandar un
 * correo — el porqué está en `(tienda)/contacto/actions.ts`. Si no
 * hubiera dónde leerlos, guardarlos no serviría de nada.
 */
export default async function PaginaMensajes() {
  const mensajes = await prisma.mensajeDeContacto.findMany({
    orderBy: [{ leido: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const sinLeer = mensajes.filter((m) => !m.leido).length;

  return (
    <>
      <PageHeader
        title="Mensajes"
        description={
          mensajes.length === 0
            ? "Todavía no ha escrito nadie"
            : sinLeer > 0
              ? `${sinLeer} sin leer de ${mensajes.length}`
              : `${mensajes.length} mensaje${mensajes.length === 1 ? "" : "s"}, todos leídos`
        }
      />

      <ListaDeMensajes
        mensajes={mensajes.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          correo: m.correo,
          mensaje: m.mensaje,
          leido: m.leido,
          cuando: formatDateTime(m.createdAt),
        }))}
      />
    </>
  );
}

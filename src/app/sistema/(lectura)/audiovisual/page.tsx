import { PageHeader } from "@/components/page-header";
import { todosLosDocs, AV_SECCIONES } from "@/lib/audiovisual";
import { AvBrowser, type AvCard } from "./av-browser";

export const dynamic = "force-dynamic";

export default function AudiovisualPage() {
  const docs = todosLosDocs();

  const cards: AvCard[] = docs.map((d) => ({
    slug: d.slug,
    titulo: d.titulo,
    resumen: d.resumen,
    seccion: d.seccion,
    destacado: d.destacado,
    minutos: d.minutos,
  }));

  const secciones = AV_SECCIONES.map((s) => ({
    id: s.id,
    label: s.label,
    descripcion: s.descripcion,
    cuenta: docs.filter((d) => d.seccion === s.id).length,
  })).filter((s) => s.cuenta > 0);

  return (
    <>
      <PageHeader
        title="Audiovisual"
        description={`${docs.length} documentos · estrategia, guiones y rodaje`}
      />

      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 mb-5">
        <p className="text-sm tablet:text-base leading-relaxed">
          Todo lo del contenido para redes. Si vas a leer una sola cosa, que sea{" "}
          <strong>El ángulo</strong>; si vas a rodar mañana, empieza por{" "}
          <strong>Qué se fabrica</strong> y <strong>Tu set</strong>.
        </p>
        <p className="text-2xs tablet:text-xs text-muted-foreground mt-2 leading-snug">
          Las listas con casillas se pueden marcar y se quedan guardadas en este
          teléfono, así que sirven durante el rodaje.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No se encontraron los documentos.
          </p>
        </div>
      ) : (
        <AvBrowser docs={cards} secciones={secciones} />
      )}
    </>
  );
}

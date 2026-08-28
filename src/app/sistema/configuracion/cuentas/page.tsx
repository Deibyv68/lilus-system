import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ListaDeCuentas } from "./lista";

export const dynamic = "force-dynamic";

/**
 * Dónde te pueden pagar.
 *
 * En la página del pedido salen en un desplegable: quien compra elige su
 * banco y ve solo esos datos, cada uno con su botón de copiar. En Ecuador
 * transferir dentro del mismo banco es inmediato y sin costo, y entre
 * bancos distintos tarda y a veces cobra — así que tener varias cuentas
 * no es un lujo, es quitar una fricción que cuesta ventas.
 */
export default async function PaginaCuentas() {
  const cuentas = await prisma.cuentaDeCobro.findMany({
    orderBy: [{ orden: "asc" }, { banco: "asc" }],
  });

  const activas = cuentas.filter((c) => c.activa).length;

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
        title="Dónde te pueden pagar"
        description={
          cuentas.length === 0
            ? "Todavía sin cuentas cargadas"
            : `${activas} de ${cuentas.length} se ${
                activas === 1 ? "ofrece" : "ofrecen"
              } en la web`
        }
      />

      <ListaDeCuentas
        cuentas={cuentas.map((c) => ({
          id: c.id,
          banco: c.banco,
          tipo: c.tipo,
          numero: c.numero,
          titular: c.titular,
          cedula: c.cedula,
          correo: c.correo,
          activa: c.activa,
        }))}
      />

      <div className="mt-10 rounded-lg border bg-muted/40 p-4">
        <h2 className="text-sm font-semibold">Cómo se ven</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Al terminar su pedido, la persona elige su banco de un desplegable y
          ve solo los datos de esa cuenta, cada uno con un botón para copiar.
          El orden de arriba es el orden en que aparecen, y{" "}
          <strong className="font-medium text-foreground">
            la primera viene elegida
          </strong>{" "}
          — conviene poner el banco donde más gente tiene cuenta.
        </p>
      </div>
    </>
  );
}

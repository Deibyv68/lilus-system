"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { guardarCantonesAction } from "./actions";

type Zona = { id: string; name: string; cantones: string | null };

/**
 * Qué cantones cubre cada zona.
 *
 * De esto depende que el envío se cobre bien: la tienda deduce la zona
 * del cantón que elige quien compra, en vez de preguntárselo aparte —
 * antes eran dos respuestas independientes y podían no coincidir.
 *
 * Se escribe a mano, separado por comas. Un selector con los 222
 * cantones del país sería más bonito y bastante peor de usar: aquí se
 * escriben dos o tres nombres una vez y no se vuelve a tocar.
 */
export function CantonesPorZona({ zonas }: { zonas: Zona[] }) {
  const router = useRouter();
  const [borradores, setBorradores] = useState<Record<string, string>>(() =>
    Object.fromEntries(zonas.map((z) => [z.id, z.cantones ?? ""]))
  );
  const [guardando, startGuardado] = useTransition();

  const sinCantones = zonas.filter((z) => !(borradores[z.id] ?? "").trim());

  function guardar(id: string) {
    startGuardado(async () => {
      await guardarCantonesAction(id, borradores[id] ?? "");
      toast.success("Cantones guardados");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Escribe los cantones que cubre cada zona, separados por comas. La
        tienda decide el envío con esto, no preguntándoselo al cliente.
      </p>

      {zonas.map((z) => (
        <div key={z.id} className="space-y-1.5">
          <label htmlFor={`cantones-${z.id}`} className="text-sm font-medium">
            {z.name}
          </label>
          <div className="flex gap-2">
            <Input
              id={`cantones-${z.id}`}
              value={borradores[z.id] ?? ""}
              placeholder="Quito, Rumiñahui, Mejía"
              onChange={(e) =>
                setBorradores((p) => ({ ...p, [z.id]: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="outline"
              disabled={guardando || (borradores[z.id] ?? "") === (z.cantones ?? "")}
              onClick={() => guardar(z.id)}
            >
              Guardar
            </Button>
          </div>
          {!(borradores[z.id] ?? "").trim() && (
            <p className="text-xs text-muted-foreground">
              Vacío = «todo lo demás». Aquí caen los pedidos de cualquier
              cantón que no esté en otra lista.
            </p>
          )}
        </div>
      ))}

      {/*
        Los dos errores que rompen el cálculo del envío, dichos en el
        momento en que se pueden cometer.

        Sin ninguna zona vacía, un pedido de un cantón no listado no
        tendría dónde caer. Con dos o más, cuál gana depende del orden en
        que vengan de la base, que es tanto como decir al azar.
      */}
      {sinCantones.length === 0 && zonas.length > 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          Ninguna zona está vacía. Deja una sin cantones para que recoja los
          pedidos de los cantones que no listaste.
        </p>
      )}
      {sinCantones.length > 1 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          Hay {sinCantones.length} zonas sin cantones (
          {sinCantones.map((z) => z.name).join(", ")}). Solo una puede ser
          «todo lo demás»; si no, cuál se usa queda al azar.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createZoneAction,
  createCarrierAction,
  deleteZoneAction,
  deleteCarrierAction,
} from "./actions";
import { Trash2, Plus } from "lucide-react";

type Item = { id: string; name: string };

export function ZoneCarrierForms({
  zones,
  carriers,
}: {
  zones: Item[];
  carriers: Item[];
}) {
  const router = useRouter();
  const [zoneName, setZoneName] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [isPending, startTransition] = useTransition();

  function addZone() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", zoneName);
      const res = await createZoneAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setZoneName("");
      router.refresh();
    });
  }

  function addCarrier() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", carrierName);
      const res = await createCarrierAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCarrierName("");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Zonas de envío</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1">
            {zones.map((z) => (
              <li
                key={z.id}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted"
              >
                <span>{z.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteZoneAction(z.id);
                        router.refresh();
                      } catch {
                        toast.error("No se puede eliminar (está en uso)");
                      }
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Costa, Sierra…"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
            />
            <Button
              type="button"
              onClick={addZone}
              disabled={isPending || !zoneName.trim()}
            >
              <Plus className="size-4" /> Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transportadoras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1">
            {carriers.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-muted"
              >
                <span>{c.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteCarrierAction(c.id);
                        router.refresh();
                      } catch {
                        toast.error("No se puede eliminar (está en uso)");
                      }
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Tramaco, Laar…"
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
            />
            <Button
              type="button"
              onClick={addCarrier}
              disabled={isPending || !carrierName.trim()}
            >
              <Plus className="size-4" /> Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

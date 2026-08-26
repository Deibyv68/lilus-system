"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertRateAction } from "./actions";
import { Check } from "lucide-react";

type Zone = { id: string; name: string };
type Carrier = { id: string; name: string };
type Rate = { zoneId: string; carrierId: string; price: number };

export function ShippingMatrix({
  zones,
  carriers,
  rates,
}: {
  zones: Zone[];
  carriers: Carrier[];
  rates: Rate[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = Object.fromEntries(
    rates.map((r) => [`${r.zoneId}_${r.carrierId}`, r.price])
  );
  const [values, setValues] = useState<Record<string, number>>(initial);

  function save(zoneId: string, carrierId: string) {
    const key = `${zoneId}_${carrierId}`;
    const price = values[key];
    if (price == null || isNaN(price) || price < 0) {
      toast.error("Precio inválido");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("zoneId", zoneId);
      fd.set("carrierId", carrierId);
      fd.set("price", String(price));
      const res = await upsertRateAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Tarifa guardada");
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Zona / Transportadora</TableHead>
          {carriers.map((c) => (
            <TableHead key={c.id}>{c.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {zones.map((z) => (
          <TableRow key={z.id}>
            <TableCell className="font-medium">{z.name}</TableCell>
            {carriers.map((c) => {
              const key = `${z.id}_${c.id}`;
              return (
                <TableCell key={c.id}>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24"
                      value={values[key] ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [key]: parseFloat(e.target.value || "0"),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => save(z.id, c.id)}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

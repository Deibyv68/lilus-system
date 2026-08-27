"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { updateOrderStatusAction, markAsShippedAction } from "../actions";
import {
  buildStatusMessage,
  buildTrackingUrl,
  normalizePhoneForWhatsApp,
  pickWhatsAppPhone,
  type ShareableOrder,
} from "@/lib/share-message";

const OPTIONS = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagado" },
  { value: "PACKED", label: "Empaquetado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

type Status = (typeof OPTIONS)[number]["value"];

export function StatusSelector({
  id,
  status,
  carrierName,
  existingTracking,
  pedido,
  telefono,
  telefonoContacto,
  plantillaGuia,
}: {
  id: string;
  status: string;
  carrierName: string | null;
  existingTracking: string | null;
  /** Para poder ofrecer el aviso al cliente en el mismo gesto. */
  pedido: ShareableOrder;
  telefono: string | null;
  telefonoContacto: string | null;
  plantillaGuia: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [tracking, setTracking] = useState(existingTracking ?? "");

  /*
    Cambiar el estado y avisar al cliente son el mismo gesto.

    Antes eran dos: se cambiaba el estado arriba y el botón de avisar
    estaba más abajo, esperando a que alguien se acordara. Y avisar es lo
    que le importa a quien compró — el estado en la base no lo ve nadie.

    Se ofrece en un aviso con botón en vez de abrir WhatsApp solo. Abrirlo
    sin preguntar secuestraría la pantalla cada vez que se corrige un
    estado mal puesto, y hay veces que no hay nada que avisar.
  */
  function ofrecerAviso(nuevoEstado: Status) {
    const conGuia: ShareableOrder = {
      ...pedido,
      trackingNumber: pedido.trackingNumber ?? existingTracking,
      trackingUrl: buildTrackingUrl(
        plantillaGuia,
        pedido.trackingNumber ?? existingTracking
      ),
    };
    const mensaje = buildStatusMessage(conGuia, nuevoEstado);
    const numero = normalizePhoneForWhatsApp(
      pickWhatsAppPhone(telefonoContacto, telefono)
    );
    const url = numero
      ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    toast.success("Estado actualizado", {
      description: numero
        ? "¿Le avisas al cliente?"
        : "Sin teléfono guardado: se abrirá WhatsApp para elegir el chat.",
      duration: 12000,
      action: {
        label: "Avisar",
        onClick: () => window.open(url, "_blank", "noopener"),
      },
    });
  }

  function handleChange(value: string) {
    // Si va a SHIPPED y aún no tiene guía, abrimos el diálogo
    if (value === "SHIPPED" && !existingTracking) {
      setShipDialogOpen(true);
      return;
    }
    startTransition(async () => {
      try {
        await updateOrderStatusAction(id, value as Status);
        ofrecerAviso(value as Status);
        router.refresh();
      } catch {
        toast.error("No se pudo actualizar");
      }
    });
  }

  function confirmShip() {
    const trimmed = tracking.trim();
    if (!trimmed) {
      toast.error("Ingresa la guía de envío");
      return;
    }
    startTransition(async () => {
      const res = await markAsShippedAction(id, trimmed);
      if (!res.ok) {
        toast.error(res.error ?? "Error");
        return;
      }
      ofrecerAviso("SHIPPED");
      setShipDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Select value={status} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="size-5" />
              Marcar como enviado
            </DialogTitle>
            <DialogDescription>
              Ingresa el número de guía proporcionado por
              {carrierName ? <strong> {carrierName}</strong> : " la transportadora"}.
              Quedará guardado en el pedido y se incluirá en el mensaje al
              cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="tracking" className="text-sm">
              Número de guía
            </Label>
            <Input
              id="tracking"
              autoFocus
              placeholder="Ej: 1234567890"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmShip();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShipDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmShip} disabled={isPending}>
              {isPending ? "Guardando…" : "Confirmar envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

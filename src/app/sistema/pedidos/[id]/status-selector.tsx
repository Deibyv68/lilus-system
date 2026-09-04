"use client";

import { EscanearGuia } from "./escanear-guia";
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
import { Truck, AlertTriangle } from "lucide-react";
import { updateOrderStatusAction, markAsShippedAction } from "../actions";
import { registrarMensajeAction } from "./registrar-mensaje";
import { formatCurrency } from "@/lib/format";
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
  cobro,
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
  /**
   * Lo que dicen los comprobantes de este pedido.
   *
   * Solo para poder preguntar antes de dar por pagado algo que, según los
   * comprobantes, todavía no está cubierto. Nunca para impedirlo: ver más
   * abajo.
   */
  cobro: {
    total: number;
    confirmado: number;
    falta: number;
    porRevisar: number;
    hayComprobantes: boolean;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [cobroDialogOpen, setCobroDialogOpen] = useState(false);
  const [tracking, setTracking] = useState(existingTracking ?? "");

  /*
    Cuándo preguntar antes de dar un pedido por pagado.

    Solo si hay comprobantes Y no cubren el total. Sin comprobantes no se
    pregunta nada: los pedidos que se cargan a mano —una venta por
    WhatsApp, un pago en efectivo— no tienen ninguno, y avisar ahí sería
    una alarma en cada pedido normal. A la tercera alarma falsa ya nadie
    las lee, y entonces tampoco se lee la que sí importaba.
  */
  const faltaPorCubrir = cobro.hayComprobantes && cobro.falta > 0;

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
        onClick: () => {
          /* Ver la nota de `share-button.tsx`: primero el apunte, sin
             esperarlo, y después la ventana. */
          void registrarMensajeAction(id, "estado");
          window.open(url, "_blank", "noopener");
        },
      },
    });
  }

  function handleChange(value: string) {
    // Si va a SHIPPED y aún no tiene guía, abrimos el diálogo
    if (value === "SHIPPED" && !existingTracking) {
      setShipDialogOpen(true);
      return;
    }
    /*
      Se pregunta, no se impide.

      Un pedido puede estar pagado de verdad sin que los comprobantes lo
      demuestren: pagó en efectivo al recibir, transfirió y nunca subió la
      captura, o la transferencia se ve en el estado de cuenta y punto.
      Quien mira el banco sabe más que esta suma, y bloquearla la dejaría
      peleando con su propio sistema.

      Lo que sí hace falta es que sea un acto deliberado, porque al marcar
      pagado el cliente deja de ver que debe algo.
    */
    if (value === "PAID" && faltaPorCubrir) {
      setCobroDialogOpen(true);
      return;
    }
    aplicar(value);
  }

  function aplicar(value: string) {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(id, value as Status);
        setCobroDialogOpen(false);
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

      <Dialog open={cobroDialogOpen} onOpenChange={setCobroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Todavía falta {formatCurrency(cobro.falta)}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  {cobro.confirmado > 0 ? (
                    <>
                      Los comprobantes confirmados suman{" "}
                      <strong>{formatCurrency(cobro.confirmado)}</strong> de{" "}
                      {formatCurrency(cobro.total)}.
                    </>
                  ) : cobro.porRevisar > 0 ? (
                    <>
                      {cobro.porRevisar === 1
                        ? "Hay un comprobante subido que todavía nadie ha revisado"
                        : `Hay ${cobro.porRevisar} comprobantes subidos que todavía nadie ha revisado`}
                      , así que no hay nada confirmado de los{" "}
                      {formatCurrency(cobro.total)}.
                    </>
                  ) : (
                    <>
                      Ningún comprobante de este pedido cuenta, así que no hay
                      nada confirmado de los {formatCurrency(cobro.total)}.
                    </>
                  )}
                </p>
                <p>
                  Márcalo como pagado solo si el dinero entró de otra forma: en
                  efectivo, o una transferencia que ves en tu estado de cuenta
                  aunque no subieran la captura.
                </p>
                <p>
                  Al hacerlo, el cliente deja de ver que debe algo en su página.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCobroDialogOpen(false)}
              disabled={isPending}
            >
              Mejor lo reviso
            </Button>
            <Button onClick={() => aplicar("PAID")} disabled={isPending}>
              Sí, ya está pagado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

            {/*
              Escanear va debajo del campo y no en su lugar.

              El teclado sigue siendo el camino cuando la etiqueta está
              arrugada, cuando el código no lee, o cuando el número llega
              por mensaje sin etiqueta delante. La cámara es el atajo para
              el caso normal, no la única puerta.
            */}
            <EscanearGuia
              onLeido={(numero) => {
                setTracking(numero);
                toast.success(`Guía ${numero}`);
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

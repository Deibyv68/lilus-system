"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy, ExternalLink, Share2 } from "lucide-react";
import {
  buildStatusMessage,
  buildTrackingUrl,
  normalizePhoneForWhatsApp,
  pickWhatsAppPhone,
  statusShareLabel,
  type OrderStatus,
  type ShareableOrder,
} from "@/lib/share-message";

export function ShareButton({
  order,
  status,
  customerPhone,
  customerContactPhone,
  carrierTrackingTemplate,
}: {
  order: ShareableOrder;
  status: OrderStatus;
  customerPhone: string | null;
  customerContactPhone: string | null;
  carrierTrackingTemplate: string | null;
}) {
  const [open, setOpen] = useState(false);

  const enrichedOrder: ShareableOrder = {
    ...order,
    trackingUrl: buildTrackingUrl(
      carrierTrackingTemplate,
      order.trackingNumber
    ),
  };
  const message = buildStatusMessage(enrichedOrder, status);

  // Elegir el teléfono para WhatsApp: contactPhone > phone
  const targetPhone = pickWhatsAppPhone(customerContactPhone, customerPhone);
  const waPhone = normalizePhoneForWhatsApp(targetPhone);
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  function clickShare() {
    if (waPhone) {
      // Tiene teléfono → abre WhatsApp directo al chat
      window.open(waUrl, "_blank", "noopener");
    } else {
      // Sin teléfono → muestra el dialog con opciones
      setOpen(true);
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensaje copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function openWhatsApp() {
    window.open(waUrl, "_blank", "noopener");
  }

  return (
    <>
      <Button
        type="button"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        onClick={clickShare}
      >
        <Share2 className="size-4" />
        {statusShareLabel(status)}
      </Button>

      {/* Dialog solo aparece si no hay teléfono guardado */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-green-600" />
              Compartir pedido
            </DialogTitle>
            <DialogDescription>
              No hay teléfono del cliente registrado. Puedes copiar el mensaje
              o abrir WhatsApp Web para pegarlo manualmente.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            readOnly
            value={message}
            className="font-mono text-xs h-64 resize-none"
            onFocus={(e) => e.currentTarget.select()}
          />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={copyMessage}>
              <Copy className="size-4" /> Copiar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={openWhatsApp}
            >
              <ExternalLink className="size-4" /> Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

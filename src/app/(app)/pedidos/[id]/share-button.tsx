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
import { MessageCircle, Copy, Share2, ExternalLink } from "lucide-react";
import {
  buildShipmentMessage,
  buildTrackingUrl,
  normalizePhoneForWhatsApp,
  type ShareableOrder,
} from "@/lib/share-message";

export function ShareButton({
  order,
  customerPhone,
  carrierTrackingTemplate,
}: {
  order: ShareableOrder;
  customerPhone: string | null;
  carrierTrackingTemplate: string | null;
}) {
  const [open, setOpen] = useState(false);

  // Compose message
  const enrichedOrder: ShareableOrder = {
    ...order,
    trackingUrl: buildTrackingUrl(
      carrierTrackingTemplate,
      order.trackingNumber
    ),
  };
  const message = buildShipmentMessage(enrichedOrder);
  const waPhone = normalizePhoneForWhatsApp(customerPhone);
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function shareNative() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Pedido ${order.orderNumber} — LILUS`,
          text: message,
        });
      } catch {
        // El usuario canceló o no se pudo; sin error visible
      }
    } else {
      // Desktop sin Web Share → abrimos diálogo
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
        variant="default"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        onClick={shareNative}
      >
        <Share2 className="size-4" />
        Compartir con el cliente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-green-600" />
              Compartir pedido
            </DialogTitle>
            <DialogDescription>
              {waPhone
                ? "El mensaje se abrirá en WhatsApp dirigido al teléfono del cliente."
                : "No hay teléfono del cliente registrado. Puedes copiarlo o abrir WhatsApp Web para pegar manualmente."}
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

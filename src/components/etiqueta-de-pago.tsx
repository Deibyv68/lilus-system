import { Paperclip, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { estadoDePago, type ComprobanteParaContar } from "@/lib/pago-del-pedido";

/**
 * En qué punto está el pago de un pedido, para las listas.
 *
 * ── Qué pregunta responde ──
 *
 * «¿Este pedido necesita algo de mí ahora?». La lista es donde se decide
 * a cuál entrar, y esa decisión no se puede tomar sabiendo solo si hay un
 * archivo adjunto.
 *
 * Antes la etiqueta decía «Comprobante» tanto para el que nadie ha mirado
 * como para el que ya está comprobado contra el banco. Los dos casos
 * pedían cosas opuestas —uno hay que abrirlo ya, el otro se puede dejar—
 * y la etiqueta los pintaba igual, así que había que entrar a los dos.
 *
 * Solo se pinta en los pendientes: después de confirmado el pago la
 * pregunta ya no existe, y una etiqueta que no ayuda a decidir es ruido.
 */
export function EtiquetaDePago({
  estado,
  total,
  comprobantes,
}: {
  estado: string;
  total: number;
  comprobantes: ComprobanteParaContar[];
}) {
  if (estado !== "PENDING") return null;

  const pago = estadoDePago(comprobantes, total);

  if (!pago.hayComprobantes) {
    return (
      <Badge variant="outline" className="text-3xs text-muted-foreground">
        Sin comprobante
      </Badge>
    );
  }

  // Lo que espera revisión manda sobre todo lo demás: es lo único que
  // pide entrar al pedido ahora mismo.
  if (pago.porRevisar > 0) {
    return (
      <Badge className="text-3xs bg-sky-600 hover:bg-sky-600">
        <Paperclip className="size-2.5" />
        {pago.porRevisar === 1
          ? "Por revisar"
          : `${pago.porRevisar} por revisar`}
      </Badge>
    );
  }

  if (pago.cuadra) {
    return (
      <Badge className="text-3xs bg-emerald-600 hover:bg-emerald-600">
        <Check className="size-2.5" /> Pago completo
      </Badge>
    );
  }

  /*
    Revisado, y todavía falta plata. No es un error: aquí se abona.
    Por eso dice cuánto falta en vez de avisar de que algo va mal — el
    número es lo que hace falta para escribirle y pedirle el resto.
  */
  if (pago.confirmado > 0) {
    return (
      <Badge variant="outline" className="text-3xs">
        Faltan {formatCurrency(pago.falta)}
      </Badge>
    );
  }

  // Todos revisados y ninguno contó.
  return (
    <Badge variant="outline" className="text-3xs text-muted-foreground">
      Sin pago válido
    </Badge>
  );
}

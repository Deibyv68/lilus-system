"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Check } from "lucide-react";
import { subirComprobanteAction } from "./actions";

type Comprobante = { id: string; cuando: string; esPdf: boolean };

/**
 * Subir el comprobante desde la propia página del pedido.
 *
 * ── Por qué aquí y no por WhatsApp ──
 *
 * Un comprobante que llega por WhatsApp llega suelto: «una foto, de
 * +593 99…». Hay que adivinar a qué pedido pertenece cruzando el
 * teléfono, y eso falla en los casos normales — manda desde el teléfono
 * del esposo, tiene dos pedidos abiertos, el número que dejó tiene un
 * dígito distinto. Cuando falla, el comprobante queda huérfano, que es
 * peor que no tenerlo: la dueña cree que el sistema se encargó.
 *
 * Subido desde la página del pedido no hay nada que adivinar. Y quien
 * prefiera mandarlo por WhatsApp lo sigue haciendo: el botón de abajo no
 * se movió de sitio.
 */
export function SubirComprobante({
  token,
  yaSubidos,
}: {
  token: string;
  yaSubidos: Comprobante[];
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, startSubida] = useTransition();

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);

    const fd = new FormData();
    fd.set("comprobante", archivo);

    startSubida(async () => {
      const r = await subirComprobanteAction(token, fd);
      // Se limpia siempre: si falló, hay que poder elegir el mismo
      // archivo otra vez, y el navegador no dispara `change` si el valor
      // no cambió.
      if (entrada.current) entrada.current.value = "";
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 border-t border-tienda-linea pt-6">
      <p className="text-xs uppercase tracking-wide text-tienda-tenue">
        Tu comprobante
      </p>

      {yaSubidos.length > 0 && (
        <ul className="mt-3 space-y-2">
          {yaSubidos.map((c) => (
            <li key={c.id}>
              {/*
                Se abre en otra pestaña en vez de mostrarse aquí. La
                imagen es del banco de quien compra y no tiene por qué
                quedar a la vista de quien pase por al lado en el bus.
              */}
              <a
                href={`/api/comprobante/${c.id}?token=${encodeURIComponent(token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-tienda-sm border border-tienda-linea px-4 py-3 text-sm transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto"
              >
                <Check className="size-4 shrink-0 text-tienda-acento" />
                <span className="min-w-0 flex-1">
                  <span className="block text-tienda-texto">
                    {c.esPdf ? "Comprobante en PDF" : "Comprobante enviado"}
                  </span>
                  <span className="block text-xs text-tienda-tenue">
                    {c.cuando} · tócalo para verlo
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt px-4 py-3 text-sm leading-relaxed"
        >
          {error}
        </p>
      )}

      {/*
        El `label` es el botón, y el `input` va escondido: los navegadores
        no dejan darle forma a un campo de archivo, y el de fábrica se ve
        como un formulario de 1998 al lado de todo lo demás.

        Sin `capture`: así el teléfono ofrece la galería además de la
        cámara. El comprobante casi siempre es una captura de pantalla que
        ya está guardada, no una foto que se va a tomar ahora.
      */}
      <label
        className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-full border border-tienda-linea px-6 py-3.5 text-sm transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white ${
          subiendo ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Paperclip className="size-4" />
        {subiendo
          ? "Subiendo…"
          : yaSubidos.length > 0
            ? "Subir otro"
            : "Subir mi comprobante"}
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          onChange={onArchivo}
          disabled={subiendo}
          className="sr-only"
        />
      </label>

      <p className="mt-2 text-center text-xs text-tienda-tenue">
        Una captura de la transferencia. Así lo confirmamos más rápido.
      </p>
    </div>
  );
}

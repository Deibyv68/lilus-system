"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { marcarMensajeAction, borrarMensajeAction } from "./actions";

type Mensaje = {
  id: string;
  nombre: string;
  correo: string;
  mensaje: string;
  leido: boolean;
  cuando: string;
};

/**
 * La bandeja.
 *
 * Los sin leer van arriba y con el borde marcado. Contestar se hace por
 * correo, desde el correo de siempre: montar un editor de respuestas aquí
 * dentro sería reinventar un cliente de correo para mandar tres mensajes
 * al mes.
 */
export function ListaDeMensajes({ mensajes }: { mensajes: Mensaje[] }) {
  const router = useRouter();
  const [trabajando, startTrabajo] = useTransition();

  function alternar(m: Mensaje) {
    startTrabajo(async () => {
      await marcarMensajeAction(m.id, !m.leido);
      router.refresh();
    });
  }

  function borrar(id: string) {
    startTrabajo(async () => {
      await borrarMensajeAction(id);
      toast.success("Mensaje borrado");
      router.refresh();
    });
  }

  if (mensajes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Los mensajes de la página de contacto aparecen aquí.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {mensajes.map((m) => (
        <li
          key={m.id}
          className={`rounded-2xl border bg-card p-4 ${
            m.leido ? "" : "border-primary/40 ring-1 ring-primary/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{m.nombre}</p>
              {/*
                El correo es un enlace `mailto:` con el asunto ya puesto.
                Contestar es la única acción real de esta pantalla, así que
                tiene que estar a un toque y no obligar a copiar y pegar.
              */}
              <a
                href={`mailto:${m.correo}?subject=${encodeURIComponent("Sobre tu mensaje a LILUS")}`}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {m.correo}
              </a>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {m.cuando}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-line border-t pt-3 text-sm leading-relaxed">
            {m.mensaje}
          </p>

          <div className="mt-3 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={trabajando}
              onClick={() => alternar(m)}
            >
              {m.leido ? (
                <>
                  <Mail className="size-4" /> Marcar sin leer
                </>
              ) : (
                <>
                  <MailOpen className="size-4" /> Marcar leído
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto"
              disabled={trabajando}
              onClick={() => borrar(m.id)}
              aria-label="Borrar mensaje"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

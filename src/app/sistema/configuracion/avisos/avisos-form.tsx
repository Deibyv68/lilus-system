"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, BellOff, Monitor, Smartphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  guardarSuscripcionAction,
  borrarSuscripcionAction,
  borrarAparatoAction,
  probarAvisoAction,
} from "./actions";

type Navegador = {
  id: string;
  endpoint: string;
  etiqueta: string | null;
  createdAt: string;
};

type Telefono = {
  id: string;
  token: string;
  modelo: string | null;
  version: string | null;
  createdAt: string;
};

/**
 * El interruptor de los avisos, por aparato.
 *
 * ── Por qué el estado vive en el navegador y no en la base ──
 *
 * Que la base diga que este teléfono está suscrito no significa nada: la
 * persona pudo haber quitado el permiso desde los ajustes de Android, o
 * el navegador pudo haber caducado la suscripción solo. La única fuente
 * fiable es preguntárselo al navegador cada vez que se abre la página, y
 * eso es lo que hace `sincronizar()`.
 *
 * La lista de la base está debajo, aparte, para poder dar de baja un
 * aparato que ya no se tiene a mano.
 */

/**
 * La clave pública VAPID convertida al formato que pide el navegador.
 *
 * Viene en base64url —con `-` y `_` en vez de `+` y `/`, y sin relleno—
 * porque así viaja bien en una URL. `atob` solo entiende base64 normal,
 * de ahí la traducción.
 *
 * El `ArrayBuffer` se crea explícito en vez de usar `Uint8Array.from`:
 * `applicationServerKey` exige un buffer no compartido, y el tipo que
 * infiere `from` admite también `SharedArrayBuffer`.
 */
function claveABytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(normal);
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

/** «Chrome en Android» — para reconocer el aparato en la lista. */
function describirEsteAparato(): string {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Navegador";
  const sistema = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iPhone"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return sistema ? `${navegador} en ${sistema}` : navegador;
}

type Estado =
  | "cargando"
  /** Estamos dentro de la app de Android: sus avisos son otra cosa. */
  | "en-la-app"
  | "sin-soporte"
  | "bloqueado"
  | "activo"
  | "inactivo";

/**
 * ¿Esta página se está viendo dentro de la app de Android?
 *
 * El WebView de Android no implementa la API de Push del navegador, así
 * que sin esta comprobación la página decía «este navegador no puede
 * recibir avisos» y hablaba de iPhone y de Safari — dentro de una app de
 * Android que sí los recibe, por otro camino.
 *
 * La marca la pone la propia app en su user agent
 * (`applicationNameForUserAgent`). Es la única señal fiable: el WebView
 * se presenta como Chrome en todo lo demás.
 */
function dentroDeLaApp(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent.includes("LilusApp")
  );
}

export function AvisosForm({
  clavePublica,
  navegadores,
  telefonos,
}: {
  clavePublica: string | null;
  navegadores: Navegador[];
  telefonos: Telefono[];
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [endpointActual, setEndpointActual] = useState<string | null>(null);
  const [trabajando, startTrabajo] = useTransition();

  useEffect(() => {
    let vivo = true;

    async function sincronizar() {
      if (dentroDeLaApp()) {
        if (vivo) setEstado("en-la-app");
        return;
      }
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (vivo) setEstado("sin-soporte");
        return;
      }
      if (Notification.permission === "denied") {
        if (vivo) setEstado("bloqueado");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!vivo) return;
        setEndpointActual(sub?.endpoint ?? null);
        setEstado(sub ? "activo" : "inactivo");
      } catch {
        if (vivo) setEstado("inactivo");
      }
    }

    sincronizar();
    return () => {
      vivo = false;
    };
  }, []);

  async function activar() {
    if (!clavePublica) {
      toast.error("Faltan las claves VAPID en el servidor");
      return;
    }

    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
      toast.error("No diste permiso para los avisos");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        // Obligatorio en Chrome: todo aviso tiene que mostrarse. No se
        // pueden mandar avisos silenciosos que solo despierten la app.
        userVisibleOnly: true,
        applicationServerKey: claveABytes(clavePublica),
      });

      const datos = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      startTrabajo(async () => {
        const r = await guardarSuscripcionAction(
          { endpoint: datos.endpoint, keys: datos.keys },
          describirEsteAparato()
        );
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        setEndpointActual(datos.endpoint);
        setEstado("activo");
        toast.success("Avisos activados en este aparato");
        router.refresh();
      });
    } catch (e) {
      console.error(e);
      toast.error("El navegador no pudo suscribirse");
    }
  }

  async function desactivar() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      await sub?.unsubscribe();

      startTrabajo(async () => {
        if (endpoint) await borrarSuscripcionAction(endpoint);
        setEndpointActual(null);
        setEstado("inactivo");
        toast.success("Avisos apagados en este aparato");
        router.refresh();
      });
    } catch {
      toast.error("No se pudo desactivar");
    }
  }

  function probar() {
    startTrabajo(async () => {
      const r = await probarAvisoAction();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `Aviso mandado a ${r.cuantos} ${r.cuantos === 1 ? "aparato" : "aparatos"}`
      );
    });
  }

  function darDeBajaTelefono(token: string) {
    startTrabajo(async () => {
      await borrarAparatoAction(token);
      toast.success("Teléfono dado de baja");
      router.refresh();
    });
  }

  function darDeBaja(endpoint: string) {
    startTrabajo(async () => {
      await borrarSuscripcionAction(endpoint);
      if (endpoint === endpointActual) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        await sub?.unsubscribe();
        setEndpointActual(null);
        setEstado("inactivo");
      }
      toast.success("Aparato dado de baja");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {estado === "cargando" && (
            <p className="text-sm text-muted-foreground">Revisando…</p>
          )}

          {estado === "en-la-app" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Estás dentro de la app de LILUS
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los avisos de la app no se configuran aquí: se activaron
                  solos cuando entraste, y llegan por su propia conexión con
                  Firebase. Esta pantalla es para los navegadores.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mira abajo si tu teléfono aparece en la lista. Y manda una
                  prueba para asegurarte — mejor con la app cerrada.
                </p>
              </div>
              <Button onClick={probar} disabled={trabajando}>
                <Bell className="size-4" /> Mandar prueba
              </Button>
            </div>
          )}

          {estado === "sin-soporte" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Este navegador no puede recibir avisos
              </p>
              <p className="text-sm text-muted-foreground">
                En el iPhone hay que instalar LILUS en la pantalla de inicio
                primero: botón de compartir → «Añadir a inicio». Desde Safari
                normal no funciona, es una restricción de Apple.
              </p>
            </div>
          )}

          {estado === "bloqueado" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Los avisos están bloqueados en este navegador
              </p>
              <p className="text-sm text-muted-foreground">
                Se bloqueó una vez y el navegador ya no vuelve a preguntar. Hay
                que permitirlo a mano: toca el candado de la barra de
                direcciones → Notificaciones → Permitir. Después vuelve acá.
              </p>
            </div>
          )}

          {estado === "inactivo" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Avisos apagados en este aparato
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Con esto encendido, el teléfono suena cuando entra una venta
                  por la web, aunque el panel esté cerrado.
                </p>
              </div>
              <Button onClick={activar} disabled={trabajando || !clavePublica}>
                <Bell className="size-4" /> Activar en este aparato
              </Button>
              {!clavePublica && (
                <p className="text-xs text-destructive">
                  Faltan las claves VAPID en el <code>.env</code> del servidor.
                  Córrelas con{" "}
                  <code>npx tsx scripts/generar-claves-push.ts</code>.
                </p>
              )}
            </div>
          )}

          {estado === "activo" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Avisos encendidos en este aparato
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manda una prueba para asegurarte de que llegan de verdad.
                  Vale la pena hacerlo con la app cerrada.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={probar} disabled={trabajando}>
                  <Bell className="size-4" /> Mandar prueba
                </Button>
                <Button
                  variant="outline"
                  onClick={desactivar}
                  disabled={trabajando}
                >
                  <BellOff className="size-4" /> Apagar aquí
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {telefonos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Teléfonos con la app
          </h2>
          <ul className="mt-3 space-y-2">
            {telefonos.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {t.modelo ?? "Teléfono sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Desde el {t.createdAt}
                    {t.version && ` · versión ${t.version}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={trabajando}
                  onClick={() => darDeBajaTelefono(t.token)}
                  aria-label="Dar de baja este teléfono"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {navegadores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Navegadores
          </h2>
          <ul className="mt-3 space-y-2">
            {navegadores.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Monitor className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {a.etiqueta ?? "Navegador sin nombre"}
                    {a.endpoint === endpointActual && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · este
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Desde el {a.createdAt}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={trabajando}
                  onClick={() => darDeBaja(a.endpoint)}
                  aria-label="Dar de baja este navegador"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

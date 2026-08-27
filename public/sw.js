// Service Worker de LILUS.
//
// Hace dos cosas:
//
//   1. Cumplir el requisito de Chrome para ofrecer "Instalar app".
//   2. Recibir los avisos push y mostrarlos, incluso con la app cerrada.
//
// NO cachea nada. La app necesita conexión para servir de algo —los datos
// del panel cambian todo el tiempo— y un cache offline solo lograría
// mostrar pedidos viejos como si fueran los de ahora.

const SW_VERSION = "lilus-v2-push";

self.addEventListener("install", () => {
  // Activa el nuevo SW inmediatamente sin esperar a que se cierren las pestañas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Toma control de las páginas ya abiertas.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No interceptamos nada — todas las requests van directo a la red.
});

// ─────────────────────────────────────────────────────────────
// Avisos push
// ─────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  // Si el aviso llega sin datos o con basura, igual se muestra algo: una
  // notificación vacía se ve peor que una genérica, y el navegador exige
  // que mostremos alguna o registra un fallo contra el sitio.
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = {};
  }

  const titulo = datos.titulo || "LILUS";
  const opciones = {
    body: datos.cuerpo || "Hay novedades en el panel.",
    icon: "/brand/lilus-logo.png",
    badge: "/brand/lilus-logo.png",
    // Agrupa: dos avisos del mismo grupo se reemplazan en vez de apilarse.
    tag: datos.grupo || "lilus",
    renotify: true,
    // En Android hace vibrar aunque el teléfono esté en silencio visual.
    vibrate: [200, 100, 200],
    data: { url: datos.url || "/sistema/pedidos" },
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/sistema/pedidos";

  /*
    Si el panel ya está abierto en alguna ventana, se trae esa al frente
    en vez de abrir otra. Sin esto, cada aviso tocado deja una pestaña
    más de LILUS abierta y al final hay seis.
  */
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((ventanas) => {
        for (const v of ventanas) {
          if (v.url.includes("/sistema") && "focus" in v) {
            v.navigate(destino);
            return v.focus();
          }
        }
        return self.clients.openWindow(destino);
      })
  );
});

// Identificador para debug
self.addEventListener("message", (event) => {
  if (event.data === "version") {
    event.source?.postMessage(SW_VERSION);
  }
});

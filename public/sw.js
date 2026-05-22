// Service Worker mínimo para LILUS PWA.
//
// Solo cumple el requisito de Chrome para mostrar el prompt "Instalar app".
// NO cachea recursos — la app necesita conexión a la API (Cloudflare Tunnel
// → laptop) para funcionar, no tiene sentido un cache offline porque los
// datos del backend siempre cambian.
//
// Si más adelante quieres "modo offline limitado" se puede agregar cache
// para la carcasa estática (HTML/JS/CSS) y dejar la API siempre online.

const SW_VERSION = "lilus-v1";

self.addEventListener("install", (event) => {
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

// Identificador para debug
self.addEventListener("message", (event) => {
  if (event.data === "version") {
    event.source?.postMessage(SW_VERSION);
  }
});

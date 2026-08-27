/**
 * Todo lo que la app le pide al servidor de LILUS.
 *
 * ── La app no tiene base de datos ──
 *
 * Ni una tabla, ni un cache que sobreviva al cierre. Los pedidos que se
 * ven en pantalla acaban de llegar del servidor y se olvidan al salir.
 *
 * Es a propósito. Una copia local significa dos verdades que se pueden
 * separar: el pedido que en el teléfono sigue pendiente y en la laptop ya
 * está pagado. Con una sola base y una sola verdad, lo peor que puede
 * pasar es que la pantalla esté vieja — y eso se arregla bajando la lista
 * con el dedo.
 *
 * ── Lo único que se guarda ──
 *
 * La dirección del servidor y el token de sesión. El token va en
 * SecureStore, que en Android lo mete en el keystore del sistema: cifrado
 * por hardware y fuera del alcance de otras apps.
 */

import * as SecureStore from "expo-secure-store";

const CLAVE_TOKEN = "lilus_token";
const CLAVE_SERVIDOR = "lilus_servidor";

/**
 * A dónde apunta la app cuando nadie ha dicho otra cosa.
 *
 * Es editable desde la pantalla de entrada porque este valor va a
 * cambiar: hoy es la dirección de Tailscale, mañana será el dominio
 * propio. Si estuviera quemado en el código, ese día habría que
 * recompilar el APK y reinstalarlo en cada teléfono.
 */
export const SERVIDOR_POR_DEFECTO =
  "https://deiby-aspire-v5-123.tailb43ebc.ts.net";

let servidorEnMemoria: string | null = null;
let tokenEnMemoria: string | null = null;

export async function servidor(): Promise<string> {
  if (servidorEnMemoria) return servidorEnMemoria;
  const guardado = await SecureStore.getItemAsync(CLAVE_SERVIDOR);
  servidorEnMemoria = (guardado || SERVIDOR_POR_DEFECTO).replace(/\/+$/, "");
  return servidorEnMemoria;
}

export async function guardarServidor(url: string): Promise<void> {
  const limpio = url.trim().replace(/\/+$/, "");
  servidorEnMemoria = limpio;
  await SecureStore.setItemAsync(CLAVE_SERVIDOR, limpio);
}

export async function token(): Promise<string | null> {
  if (tokenEnMemoria) return tokenEnMemoria;
  tokenEnMemoria = await SecureStore.getItemAsync(CLAVE_TOKEN);
  return tokenEnMemoria;
}

async function guardarToken(valor: string | null): Promise<void> {
  tokenEnMemoria = valor;
  if (valor) await SecureStore.setItemAsync(CLAVE_TOKEN, valor);
  else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

// ─────────────────────────────────────────────────────────────
// Tipos: los mismos nombres que devuelve /api/movil
// ─────────────────────────────────────────────────────────────

export type NivelDeEspera = "tranquilo" | "atencion" | "vencido";

export type Espera = {
  horas: number;
  nivel: NivelDeEspera;
  aviso: string;
  detalle: string;
};

export type Pedido = {
  id: string;
  numero: string;
  estado: string;
  estadoTexto: string;
  total: number;
  creadoEn: string;
  origen: string | null;
  cliente: string;
  telefono: string | null;
  transportadora: string | null;
  guia: string | null;
  items: number;
  espera: Espera | null;
};

export type Usuario = {
  id: string;
  username: string;
  name: string;
  role: string;
};

/** Un fallo que se le puede enseñar a una persona tal cual. */
export class ErrorDeServidor extends Error {
  constructor(
    mensaje: string,
    readonly estado?: number
  ) {
    super(mensaje);
  }
}

/**
 * El `fetch` de la casa.
 *
 * Pone la cabecera de sesión, traduce los fallos a algo legible, y corta
 * a los 20 segundos. Lo del corte importa: sin él, con la laptop apagada
 * la app se queda dando vueltas para siempre sin decir nada, y quien la
 * usa no sabe si esperar o cerrar.
 */
async function pedir<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; conSesion?: boolean } = {}
): Promise<T> {
  const base = await servidor();
  const cabeceras: Record<string, string> = { "content-type": "application/json" };

  if (opciones.conSesion !== false) {
    const t = await token();
    if (!t) throw new ErrorDeServidor("Sesión no iniciada", 401);
    cabeceras.authorization = `Bearer ${t}`;
  }

  const corte = new AbortController();
  const temporizador = setTimeout(() => corte.abort(), 20_000);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${base}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: corte.signal,
    });
  } catch (e) {
    /*
      Aquí caen dos cosas distintas que a quien mira la pantalla le dan
      igual: que no haya internet, y que el servidor esté apagado. En los
      dos casos lo accionable es lo mismo — mirar si la laptop está
      prendida— así que se dice eso y no el error técnico.
    */
    const abortado = (e as Error)?.name === "AbortError";
    throw new ErrorDeServidor(
      abortado
        ? "El servidor tardó demasiado. ¿Está prendida la laptop?"
        : "No se pudo conectar. Revisa el internet y que la laptop esté prendida."
    );
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 401) {
    // La sesión caducó o la cerraron desde el panel. Se borra el token
    // para que la app vuelva a pedir entrada en vez de reintentar en vano.
    await guardarToken(null);
    throw new ErrorDeServidor("Tu sesión se cerró. Entra de nuevo.", 401);
  }

  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    // Un HTML de error en vez de JSON: suele ser un proxy delante.
  }

  if (!respuesta.ok) {
    const mensaje =
      (datos as { error?: string } | null)?.error ??
      `El servidor respondió ${respuesta.status}`;
    throw new ErrorDeServidor(mensaje, respuesta.status);
  }

  return datos as T;
}

// ─────────────────────────────────────────────────────────────
// Lo que la app usa
// ─────────────────────────────────────────────────────────────

export async function entrar(
  usuario: string,
  clave: string
): Promise<Usuario> {
  const r = await pedir<{ token: string; usuario: Usuario }>(
    "/api/movil/sesion",
    { metodo: "POST", cuerpo: { usuario, clave }, conSesion: false }
  );
  await guardarToken(r.token);
  return r.usuario;
}

/** ¿Sigue viva la sesión guardada? Se llama al abrir la app. */
export async function sesionActual(): Promise<Usuario | null> {
  if (!(await token())) return null;
  try {
    const r = await pedir<{ usuario: Usuario }>("/api/movil/sesion");
    return r.usuario;
  } catch {
    return null;
  }
}

export async function salir(tokenDelAparato?: string | null): Promise<void> {
  try {
    if (tokenDelAparato) {
      await pedir("/api/movil/dispositivo", {
        metodo: "DELETE",
        cuerpo: { token: tokenDelAparato },
      });
    }
    await pedir("/api/movil/sesion", { metodo: "DELETE" });
  } catch {
    // Si el servidor no contesta, igual se sale localmente: quedarse
    // dentro porque no hay internet sería peor.
  }
  await guardarToken(null);
}

export async function listarPedidos(): Promise<Pedido[]> {
  const r = await pedir<{ pedidos: Pedido[] }>("/api/movil/pedidos?limite=40");
  return r.pedidos;
}

export async function cambiarEstado(
  id: string,
  estado: string
): Promise<void> {
  await pedir(`/api/movil/pedidos/${id}/estado`, {
    metodo: "POST",
    cuerpo: { estado },
  });
}

export async function registrarAparato(
  tokenFcm: string,
  modelo: string,
  version: string
): Promise<void> {
  await pedir("/api/movil/dispositivo", {
    metodo: "POST",
    cuerpo: { token: tokenFcm, modelo, version },
  });
}

import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Frenar a quien prueba contraseñas.
 *
 * ── Por qué hacía falta ──
 *
 * El PIN de los dispositivos de confianza ya se bloqueaba a los cinco
 * fallos. La contraseña no: se podía probar sin límite. Mientras el
 * sistema vivía dentro de la red privada eso era teórico —había que estar
 * dentro para siquiera ver el formulario—. En el momento en que la
 * dirección sea pública, deja de serlo: un programa puede probar miles de
 * claves por minuto contra `admin` sin que nadie se entere.
 *
 * ── Cómo frena ──
 *
 * Los primeros fallos no cuestan nada, porque teclear mal la contraseña
 * es lo más normal del mundo. A partir del quinto empieza una espera que
 * se duplica: 1, 2, 4, 8… hasta media hora.
 *
 * Es a propósito que no bloquee de golpe y para siempre. Un bloqueo duro
 * es también un arma: cualquiera puede dejar a la dueña fuera de su
 * sistema un lunes por la mañana solo fallando cinco veces a propósito.
 * Con esperas crecientes, un ataque se vuelve inviable —de mil intentos
 * por minuto a dos por hora— mientras que quien de verdad se equivocó
 * espera un minuto y entra.
 *
 * ── Qué NO hace ──
 *
 * No distingue entre «esa contraseña está mal» y «ese usuario no existe»:
 * el que llama devuelve el mismo mensaje para los dos casos. Contar los
 * fallos por separado volvería a delatar qué usuarios existen, que es
 * justo lo que ese mensaje único evita.
 */

/** Fallos gratis antes de empezar a cobrar espera. */
const GRACIA = 4;

/** La primera espera. Se duplica con cada fallo posterior. */
const ESPERA_BASE_MS = 60_000;

/** El techo. Media hora ya hace inviable cualquier ataque por fuerza. */
const ESPERA_MAXIMA_MS = 30 * 60_000;

/**
 * Se olvidan los fallos después de un rato sin intentos.
 *
 * Sin esto, quien se equivocó tres veces hace seis meses arrastraría esos
 * fallos para siempre y el cuarto error de su vida le costaría una espera.
 */
const OLVIDO_MS = 60 * 60_000;

export type Freno =
  | { bloqueado: false }
  | { bloqueado: true; segundos: number };

function llaveDeUsuario(usuario: string): string {
  return `usuario:${usuario.toLowerCase().trim()}`;
}

function llaveDeIp(ip: string): string {
  return `ip:${ip}`;
}

/**
 * La IP de quien pide, mirando las cabeceras que pone el túnel.
 *
 * Detrás hay siempre un proxy —Cloudflare o Tailscale— así que la
 * dirección de la conexión es la del propio túnel y es la misma para
 * todo el mundo. La real viene en `x-forwarded-for`, y es el PRIMER
 * valor: los siguientes los añaden los saltos posteriores.
 *
 * Es un dato que quien ataca puede falsificar, y por eso el freno por IP
 * es solo el segundo cinturón: el que de verdad protege una cuenta es el
 * de usuario, que nadie puede eludir.
 */
export function ipDe(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0]!.trim().slice(0, 45);
  return cabeceras.get("x-real-ip")?.slice(0, 45) ?? "desconocida";
}

async function revisarUna(clave: string, ahora: Date): Promise<Freno> {
  const fila = await prisma.intentoDeEntrada.findUnique({ where: { clave } });
  if (!fila?.bloqueadoHasta) return { bloqueado: false };
  if (fila.bloqueadoHasta <= ahora) return { bloqueado: false };

  return {
    bloqueado: true,
    segundos: Math.ceil((fila.bloqueadoHasta.getTime() - ahora.getTime()) / 1000),
  };
}

/**
 * ¿Puede intentar? Se llama ANTES de comprobar la contraseña.
 *
 * Comprobar primero importa: si se mirara después, cada intento seguiría
 * costando un cálculo de bcrypt —unos 100 ms— y mil intentos por segundo
 * tumbarían el servidor aunque ninguno acertara.
 */
export async function puedeIntentar(
  usuario: string,
  ip: string
): Promise<Freno> {
  const ahora = new Date();
  const [porUsuario, porIp] = await Promise.all([
    revisarUna(llaveDeUsuario(usuario), ahora),
    revisarUna(llaveDeIp(ip), ahora),
  ]);

  if (porUsuario.bloqueado) return porUsuario;
  if (porIp.bloqueado) return porIp;
  return { bloqueado: false };
}

async function anotarFallo(clave: string, ahora: Date): Promise<void> {
  const fila = await prisma.intentoDeEntrada.findUnique({ where: { clave } });

  // Si lleva mucho sin intentar, se empieza de cero.
  const previos =
    fila && ahora.getTime() - fila.ultimoIntento.getTime() < OLVIDO_MS
      ? fila.intentos
      : 0;

  const intentos = previos + 1;
  const pasados = intentos - GRACIA;
  const espera =
    pasados <= 0
      ? null
      : new Date(
          ahora.getTime() +
            Math.min(ESPERA_BASE_MS * 2 ** (pasados - 1), ESPERA_MAXIMA_MS)
        );

  await prisma.intentoDeEntrada.upsert({
    where: { clave },
    create: { clave, intentos, bloqueadoHasta: espera, ultimoIntento: ahora },
    update: { intentos, bloqueadoHasta: espera, ultimoIntento: ahora },
  });
}

/** Se llama cuando la contraseña no era. */
export async function anotarFalloDeEntrada(
  usuario: string,
  ip: string
): Promise<void> {
  const ahora = new Date();
  await Promise.all([
    anotarFallo(llaveDeUsuario(usuario), ahora),
    anotarFallo(llaveDeIp(ip), ahora),
  ]);
}

/**
 * Se llama al entrar bien: borra el historial de fallos.
 *
 * Quien demuestra que sabe la contraseña no tiene por qué arrastrar los
 * intentos de nadie —ni los suyos de antes de acordarse.
 */
export async function olvidarFallos(usuario: string, ip: string): Promise<void> {
  await prisma.intentoDeEntrada.deleteMany({
    where: { clave: { in: [llaveDeUsuario(usuario), llaveDeIp(ip)] } },
  });
}

/** «1 minuto», «2 minutos», «45 segundos» — para decírselo a una persona. */
export function esperaEnPalabras(segundos: number): string {
  if (segundos < 60) return `${segundos} segundos`;
  const minutos = Math.ceil(segundos / 60);
  return `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
}

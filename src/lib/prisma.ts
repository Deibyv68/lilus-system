import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

/**
 * La conexión a la base.
 *
 * ── Por qué hay dos caminos ──
 *
 * Hasta ahora la base era un archivo en el disco de la laptop. Eso tiene
 * una consecuencia que no se ve hasta que pasa: si la laptop se apaga, la
 * tienda se apaga con ella. Nadie puede comprar de noche, ni el domingo,
 * ni mientras se reinicia por una actualización de Linux.
 *
 * Turso es la misma base —SQLite— pero servida por red, así que la puede
 * leer y escribir algo que no viva en esta casa. Con eso la tienda pasa a
 * correr en Cloudflare y sigue tomando pedidos con la laptop apagada; el
 * panel se queda en la laptop y, cuando se enciende, ve todo lo que entró
 * mientras dormía.
 *
 * ── Por qué no se cambia de golpe ──
 *
 * Porque el archivo local es la copia buena hasta que se demuestre lo
 * contrario. Mientras `TURSO_DATABASE_URL` no esté puesta, esto se
 * comporta exactamente como antes; en cuanto está, usa Turso. Así el
 * cambio se puede probar, y deshacer, borrando una línea del `.env` —
 * sin tocar código ni volver a desplegar.
 *
 * En desarrollo tampoco estorba: quien clone el proyecto sigue trabajando
 * contra su `dev.db` sin cuenta en ningún sitio.
 */

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

export const usandoTurso = Boolean(url);

function crear(): PrismaClient {
  if (!url) return new PrismaClient();

  /*
    El adaptador habla libSQL directamente, sin el motor nativo de Prisma.
    Es lo que permite que esto corra donde no se pueden ejecutar binarios
    —Cloudflare Workers—, y de paso es el mismo código en la laptop: una
    sola forma de conectarse, no dos que se van separando con el tiempo.
  */
  return new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken }) });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? crear();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

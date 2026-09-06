import { existsSync } from "node:fs";
import path from "node:path";
import { guardar, leer, borrar, usandoR2 } from "../src/lib/almacen";

/**
 * Comprueba el almacén de archivos por el camino que esté configurado.
 *
 *   npx tsx scripts/probar-almacen.ts                 # disco
 *   (con R2_ACCESS_KEY_ID puesta)                     # R2
 *
 * Lo que se comprueba no es solo que guarde y lea. Importan dos cosas
 * más:
 *
 *   · Que las claves con `..` se rechacen. Parte del nombre lo elige
 *     quien sube el archivo, y un `../` bien puesto escribe donde no debe.
 *
 *   · Que en disco los comprobantes NO caigan dentro de `public`. Ahí
 *     Next los serviría solo tras el siguiente reinicio, sin pasar por
 *     ningún control — y un comprobante lleva el nombre de quien pagó,
 *     su banco y su número de cuenta.
 */

const SELLO = `prueba-${Date.now()}`;
let fallos = 0;

function comprobar(nombre: string, bien: boolean, detalle = "") {
  console.log(`  ${bien ? "ok  " : "FALLA"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
  if (!bien) fallos++;
}

async function ciclo(clave: string, tipo: string) {
  const contenido = new TextEncoder().encode(`contenido de ${clave}`);

  await guardar(clave, contenido, tipo);
  const leido = await leer(clave);
  comprobar(
    `guardar y leer ${clave}`,
    leido !== null &&
      new TextDecoder().decode(leido.bytes) === `contenido de ${clave}`,
    leido ? `${leido.tamano} bytes, ${leido.tipo}` : "no se leyó"
  );

  await borrar(clave);
  comprobar(`borrar ${clave}`, (await leer(clave)) === null);

  // Borrar algo que ya no está no debe reventar.
  await borrar(clave);
  comprobar(`borrar dos veces ${clave}`, true);
}

async function main() {
  console.log(`almacén: ${usandoR2 ? "R2" : "disco"}\n`);

  await ciclo(`uploads/${SELLO}/foto.png`, "image/png");
  await ciclo(`comprobantes/${SELLO}.jpg`, "image/jpeg");

  console.log("\nclaves que hay que rechazar:");
  for (const mala of [
    "../fuera.txt",
    "uploads/../../fuera.txt",
    "/etc/passwd",
    "uploads\\windows.txt",
    "",
  ]) {
    let lanzo = false;
    try {
      await guardar(mala, new Uint8Array([1]), "text/plain");
    } catch {
      lanzo = true;
    }
    comprobar(`rechaza «${mala}»`, lanzo);
    comprobar(`no lee «${mala}»`, (await leer(mala)) === null);
  }

  if (!usandoR2) {
    console.log("\nen disco, cada zona en su sitio:");
    const enPublic = path.join(process.cwd(), "public", "uploads");
    const clave = `comprobantes/${SELLO}-sitio.jpg`;
    await guardar(clave, new Uint8Array([1, 2, 3]), "image/jpeg");
    comprobar(
      "el comprobante NO cae dentro de public/",
      !existsSync(path.join(enPublic, `${SELLO}-sitio.jpg`)) &&
        !existsSync(path.join(process.cwd(), "public", clave))
    );
    await borrar(clave);

    const claveFoto = `uploads/${SELLO}-sitio.png`;
    await guardar(claveFoto, new Uint8Array([1, 2, 3]), "image/png");
    comprobar(
      "la foto SÍ cae en public/uploads/",
      existsSync(path.join(process.cwd(), "public", claveFoto))
    );
    await borrar(claveFoto);
  }

  console.log(`\n${fallos === 0 ? "todo bien" : `${fallos} FALLOS`}`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("reventó:", e);
  process.exit(1);
});

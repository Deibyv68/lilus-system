/**
 * Genera el par de claves VAPID que firma los avisos push.
 *
 *   npx tsx scripts/generar-claves-push.ts
 *
 * Se corre UNA vez por instalación. Imprime las tres líneas que hay que
 * pegar en el `.env` y no toca nada más — a propósito: escribir solo en
 * un `.env` que ya tiene la contraseña del correo y la ruta de la base es
 * pedir un accidente.
 *
 * Si las claves se cambian después, todas las suscripciones que existan
 * dejan de valer y hay que volver a activar los avisos en cada teléfono.
 * No es grave, pero no se hace sin querer.
 *
 * La privada no sale del servidor. La pública sí viaja al navegador, y no
 * pasa nada: está hecha para eso.
 */

import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log(`
Pega esto al final del .env del servidor:

VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:tucorreo@gmail.com

Cambia el correo por uno real: es a quien contacta Google o Apple si
algo va mal con los avisos que mandamos.

Después reinicia el servicio para que los lea:
  sudo systemctl restart lilus.service
`);

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/*
  PRUEBA: sin cache incremental en R2.

  Las paginas dinamicas se quedaron colgadas en el Worker mientras las
  estaticas y las rutas seguian bien. La capa de cache envuelve el
  dibujado de paginas y no las rutas, asi que encaja. Esto lo comprueba.
*/
export default defineCloudflareConfig();

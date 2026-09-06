import { Suspense } from "react";
import { listarCatalogo } from "@/lib/tienda";
import { Vista } from "./vista";
import { Filtrado } from "./filtrado";

/**
 * El catálogo.
 *
 * Los packs van arriba porque es lo que conviene que se lleven: salen más
 * baratos que comprar lo mismo suelto y son una mejor primera compra que
 * un jabón de cuatro dólares al que hay que sumarle tres cincuenta de
 * envío.
 *
 * El ritmo vertical sale de la plantilla de referencia: 200 px de aire en
 * la portada y 120 px entre secciones. Es mucho más de lo que uno pondría
 * por instinto, y es justo lo que hace que se vea caro.
 *
 * ── Por qué esta página no lee la búsqueda ──
 *
 * La leía, y eso la obligaba a regenerarse en cada visita: para Next, una
 * página que mira la URL es distinta cada vez. Con la base en la laptop no
 * se notaba —el disco contesta en tres milisegundos— pero con la base en
 * la nube pintar el catálogo son unas veinte consultas cruzando medio
 * continente, y medimos dos segundos y medio.
 *
 * Ahora se compila una vez con todo el catálogo dentro y se sirve sin
 * tocar la base. La búsqueda la resuelve `Filtrado` en el navegador.
 */

export const revalidate = 1800;

export default async function Catalogo() {
  const { packs, productos } = await listarCatalogo();

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      {/*
        El respaldo del Suspense no es un esqueleto: es el catálogo entero
        sin filtrar.

        Suena raro y es lo correcto. Lo que va aquí dentro es exactamente
        lo que queda escrito en el HTML compilado, y queremos que ahí estén
        los productos —para quien llegue sin buscar nada, que son casi
        todos, y para Google—. Un esqueleto dejaría la página vacía en el
        archivo y obligaría a dibujarla en cada visita.

        Cuando no hay `?q=`, lo que pinta el navegador después es idéntico
        a esto, así que no hay parpadeo.
      */}
      <Suspense fallback={<Vista packs={packs} productos={productos} busqueda="" />}>
        <Filtrado packs={packs} productos={productos} />
      </Suspense>
    </div>
  );
}

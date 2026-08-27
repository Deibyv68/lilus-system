import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cifrasDeLaMarca, imagenesParaNosotros } from "@/lib/tienda";
import { DIAS_PREPARACION } from "@/lib/politicas";
import { Revelar } from "@/components/tienda/revelar";
import { Migas } from "@/components/tienda/migas";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Un taller pequeño en Ecuador donde el jabón se hace a mano, con recetas propias corregidas con los años.",
};

export const revalidate = 1800;

/**
 * La historia.
 *
 * ── La estructura ──
 *
 * Calcada de la referencia: miga de pan, título enorme centrado, una
 * imagen ancha, una frase grande que sostiene la página, y después
 * bloques que alternan imagen y texto de lado a lado, con una fila de
 * cifras en medio.
 *
 * ── Las cifras ──
 *
 * En la referencia son de adorno: «30+ premios, 32+ inversiones, 10k
 * premios» —repetido, además—. Aquí salen de la base: cuántos artículos
 * hay publicados, cuántos packs, a cuántas zonas se envía y en cuántos
 * días sale un pedido. Si mañana se publica otro jabón, el número sube
 * solo.
 *
 * Poner cifras inventadas en una tienda que vende cosmética es
 * exactamente el tipo de adorno que después hay que sostener delante de
 * un cliente. Y estas, además, dicen algo útil.
 *
 * ── El texto ──
 *
 * Sale del material de marca que ya existe en
 * LILUS-AUDIOVISUAL/01-estrategia/el-angulo.md — no está inventado. Lo
 * que más construye es la parte que más cuesta publicar: que una fórmula
 * se corrigió porque estaba mal. Una marca que cuenta que se equivocó es
 * una marca a la que se le cree cuando dice que algo funciona.
 *
 * Lo que NO dice: que nada cure. Ver
 * LILUS-AUDIOVISUAL/05-claims/lo-que-no-se-puede-decir.md
 */
export default async function Nosotros() {
  const [imagenes, cifras] = await Promise.all([
    imagenesParaNosotros(3),
    cifrasDeLaMarca(),
  ]);

  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        <section className="pt-[100px] sm:pt-[140px]">
          <Migas actual="Nosotros" />

          <Revelar variante="enfocar" className="mt-8 text-center">
            <h1 className="font-display text-[clamp(3.5rem,13vw,8.5rem)] leading-[0.9] tracking-[-0.03em] text-white">
              Nuestra historia
            </h1>
          </Revelar>
        </section>
      </div>

      {/* La imagen ancha, casi a sangre, como en la referencia. */}
      {imagenes[0] && (
        <Revelar retardo={80} className="mt-12 px-4 sm:px-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-tienda bg-tienda-velo sm:aspect-[2/1]">
            <Image
              src={imagenes[0]}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        </Revelar>
      )}

      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        {/* La frase que sostiene la página. */}
        <section className="py-[120px] text-center sm:py-[180px]">
          <Revelar>
            <h2 className="mx-auto max-w-4xl font-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-white text-balance">
              Cada barra sale de unas manos que llevan años equivocándose y
              corrigiendo
            </h2>
          </Revelar>
          <Revelar retardo={90}>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-tienda-tenue">
              Detrás de cada jabón hay una señora que no aprendió esto el año
              pasado en internet. Tiene recetas propias, corregidas con el
              tiempo, y clientas que vuelven. Cuando dice «esto se corta si lo
              metes caliente», lo dice porque se le cortó.
            </p>
          </Revelar>
        </section>

        {/* Imagen a la derecha, texto a la izquierda. */}
        <Bloque
          titulo="Transparente porque se puede ver lo que lleva"
          imagen={imagenes[1]}
          lado="derecha"
        >
          <p>
            Trabajamos con glicerina vegetal, no con jabón en frío. Es una
            decisión, no una casualidad: la glicerina deja pasar la luz, y eso
            permite ver lo que hay adentro — el café en suspensión, los
            pétalos, las capas.
          </p>
          <p>
            Cuesta más y es más delicada de trabajar. A cambio, lo que dice la
            etiqueta se puede comprobar mirando la barra.
          </p>
        </Bloque>

        {/* Las cifras. Todas verdaderas. */}
        <section className="py-[100px] sm:py-[140px]">
          <Revelar>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
              <Cifra numero={cifras.productos} pie="Jabones y cremas" />
              <Cifra numero={cifras.packs} pie="Packs armados" />
              <Cifra numero={DIAS_PREPARACION} pie="Días en salir" />
              <Cifra numero={cifras.zonas} pie="Zonas de envío" />
            </dl>
          </Revelar>
        </section>

        {/* Imagen a la izquierda, texto a la derecha. */}
        <Bloque
          titulo="Lo que no vas a leer en esta web"
          imagen={imagenes[2]}
          lado="izquierda"
        >
          <p>
            No vas a encontrar que un jabón cura, aclara o desinflama. No es
            timidez: un cosmético legalmente no puede prometer eso, y el que
            lo promete está mintiendo o no sabe.
          </p>
          <p>
            Un jabón está treinta segundos en la piel. Lo que sí controlamos es
            qué lleva, en qué proporción y por qué — y eso está escrito en cada
            ficha, con nombres de verdad.
          </p>
        </Bloque>

        {/* El cierre grande, como la referencia. */}
        <section className="py-[120px] text-center sm:py-[180px]">
          <Revelar variante="enfocar">
            <p className="mx-auto max-w-5xl font-display text-[clamp(2.5rem,9vw,7rem)] leading-[0.95] tracking-[-0.03em] text-white text-balance">
              Hecho a mano, en Ecuador, sin prometer milagros.
            </p>
          </Revelar>
          <Revelar retardo={120}>
            <Link
              href="/tienda"
              className="mt-12 inline-block rounded-full border border-tienda-linea px-8 py-4 text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white"
            >
              Ver el catálogo
            </Link>
          </Revelar>
        </section>
      </div>
    </div>
  );
}

/**
 * Un bloque de imagen y texto, uno a cada lado.
 *
 * Si no hay imagen no se deja el hueco: el texto pasa a ocupar el ancho
 * cómodo de lectura y centrado. Una columna de texto sola se lee bien;
 * una columna de texto al lado de un rectángulo gris se lee como una
 * página rota.
 */
function Bloque({
  titulo,
  imagen,
  lado,
  children,
}: {
  titulo: string;
  imagen?: string;
  lado: "izquierda" | "derecha";
  children: React.ReactNode;
}) {
  const texto = (
    <Revelar
      variante={lado === "derecha" ? "inclinar" : "inclinar-derecha"}
      className="max-w-md"
    >
      <h3 className="font-display text-3xl leading-[1.1] tracking-[-0.01em] text-white sm:text-4xl">
        {titulo}
      </h3>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-tienda-tenue">
        {children}
      </div>
    </Revelar>
  );

  if (!imagen) {
    return <section className="py-[60px] sm:py-[80px]">{texto}</section>;
  }

  const foto = (
    <Revelar variante={lado === "derecha" ? "inclinar-derecha" : "inclinar"}>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-tienda bg-tienda-velo">
        <Image
          src={imagen}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover"
        />
      </div>
    </Revelar>
  );

  return (
    <section className="grid items-center gap-12 py-[60px] lg:grid-cols-2 lg:gap-20 lg:py-[80px]">
      {/*
        En móvil la imagen va siempre primero, sin importar el lado: en una
        columna, alternar el orden no se percibe como ritmo — se percibe
        como que a veces el título viene antes y a veces después, que es
        justo lo contrario de un ritmo.
      */}
      {lado === "izquierda" ? (
        <>
          {foto}
          <div className="lg:justify-self-end">{texto}</div>
        </>
      ) : (
        <>
          <div className="order-2 lg:order-1">{texto}</div>
          <div className="order-1 lg:order-2">{foto}</div>
        </>
      )}
    </section>
  );
}

function Cifra({ numero, pie }: { numero: number; pie: string }) {
  return (
    <div>
      <dt className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none tracking-[-0.02em] text-white tabular-nums">
        {numero}
      </dt>
      <dd className="mt-3 text-xs uppercase tracking-[0.12em] text-tienda-tenue">
        {pie}
      </dd>
    </div>
  );
}

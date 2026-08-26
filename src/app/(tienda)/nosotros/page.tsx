import type { Metadata } from "next";
import Link from "next/link";
import { Revelar } from "@/components/tienda/revelar";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Un taller pequeño en Ecuador donde el jabón se hace a mano, con recetas propias corregidas con los años.",
};

/**
 * La historia.
 *
 * El texto sale del material de marca que ya existe en
 * LILUS-AUDIOVISUAL/01-estrategia/el-angulo.md — no está inventado. Ahí
 * está identificado lo que de verdad distingue a LILUS y que casi nadie
 * puede copiar: años de oficio, glicerina en vez de jabón en frío, y la
 * costumbre de corregir una fórmula cuando resulta que estaba mal.
 *
 * Esa última parte es la que más cuesta publicar y la que más construye:
 * una marca que cuenta que se equivocó es una marca a la que se le cree
 * cuando dice que algo funciona.
 *
 * Lo que NO dice: que nada cure. Ver
 * LILUS-AUDIOVISUAL/05-claims/lo-que-no-se-puede-decir.md
 */
export default function Nosotros() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <section className="py-[120px] sm:py-[180px]">
        <Revelar variante="enfocar" className="max-w-3xl">
          <h1 className="font-display text-6xl sm:text-8xl leading-[0.95] tracking-[-0.02em] text-white text-balance">
            Un taller, no una fábrica
          </h1>
        </Revelar>
      </section>

      <div className="max-w-2xl space-y-[100px] pb-[120px]">
        <Bloque titulo="Quién lo hace">
          <p>
            Detrás de cada barra hay una señora que lleva años haciendo esto.
            No aprendió el año pasado en internet: tiene recetas propias,
            corregidas con el tiempo, y clientas que vuelven.
          </p>
          <p>
            Cuando dice «esto se corta si lo metes caliente», lo dice porque se
            le cortó.
          </p>
        </Bloque>

        <Bloque titulo="Por qué es transparente">
          <p>
            Trabajamos con glicerina vegetal, no con jabón en frío. Es una
            decisión, no una casualidad: la glicerina deja pasar la luz, y eso
            permite ver lo que lleva adentro — el café en suspensión, los
            pétalos, las capas.
          </p>
          <p>
            Cuesta más y es más delicada de trabajar. Se puede ver lo que hay
            dentro, que es exactamente lo que queremos.
          </p>
        </Bloque>

        <Bloque titulo="Lo que sacamos de las fórmulas">
          <p>
            En los últimos meses revisamos recetas que llevaban años usándose y
            encontramos cosas que no estaban bien. Las corregimos:
          </p>
          <ul className="space-y-4 pt-2">
            <Punto>
              El jabón de carbón llevaba ácido salicílico y glicólico. Los dos
              necesitan un medio ácido para hacer algo, y un jabón no lo es.
              Estaban ahí sin poder funcionar. Salieron.
            </Punto>
            <Punto>
              El champú de romero tenía dos ingredientes que se anulaban entre
              sí por tener cargas opuestas. Se pagaban los dos para que se
              cancelaran. Se cambió uno.
            </Punto>
            <Punto>
              Unas cremas empezaron a oler raro y resultó ser el colágeno
              degradándose por el envase. Cambió el envase.
            </Punto>
          </ul>
          <p className="pt-2">
            Contamos esto porque nos parece que dice más de nosotros que
            cualquier promesa: preferimos sacar un ingrediente que no sirve
            antes que dejarlo en la etiqueta porque suena bien.
          </p>
        </Bloque>

        <Bloque titulo="Qué no vamos a decirte">
          <p>
            Que un jabón cura algo. Ninguno lo hace — está treinta segundos en
            la piel y se va por el desagüe. Lo que sí hace es limpiar, y según
            lo que lleve, dejarte la piel de una manera o de otra.
          </p>
          <p>
            Cuando un ingrediente está ahí por una razón, te la explicamos en la
            ficha del producto. Cuando está por el aroma, también lo decimos.
          </p>
        </Bloque>

        <Revelar>
          <Link
            href="/tienda"
            className="inline-block rounded-full bg-tienda-texto px-8 py-4 text-sm font-medium text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-acento active:scale-[0.97] active:duration-100 active:ease-tienda-tap"
          >
            Ver lo que hacemos
          </Link>
        </Revelar>
      </div>
    </div>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Revelar as="section">
      <h2 className="font-display text-4xl leading-none tracking-[-0.01em] text-white">
        {titulo}
      </h2>
      <div className="mt-6 space-y-5 text-base leading-[1.7] text-tienda-tenue text-pretty">
        {children}
      </div>
    </Revelar>
  );
}

function Punto({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-l border-tienda-linea pl-5 leading-[1.7]">
      {children}
    </li>
  );
}

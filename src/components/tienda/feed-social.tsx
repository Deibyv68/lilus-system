import Image from "next/image";
import { Revelar } from "@/components/tienda/revelar";

/**
 * El feed de la portada.
 *
 * Una fila de fotos del taller que se desplaza sola. No son fotos de
 * producto: son las de redes — el proceso, las manos, la tanda del día.
 * Cumplen algo que el catálogo no puede: enseñar que detrás hay alguien.
 *
 * ── Por qué se desplaza a mano y no en bucle infinito ──
 *
 * Va con `overflow-x: auto` y anclaje, no con la marquesina. Aquí lo
 * normal es pararse a mirar una foto, y una cinta que no para obliga a
 * perseguirla. La marquesina está bien para texto o para un anzuelo de
 * paso; para mirar, mejor que mande el dedo.
 */
export function FeedSocial({
  imagenes,
  titulo,
  entrada,
  perfiles,
}: {
  imagenes: { id: string; url: string; alt: string | null; enlace: string | null }[];
  titulo: string;
  entrada: string;
  perfiles: {
    instagram: string | null;
    instagramUsuario: string | null;
    tiktok: string | null;
    tiktokUsuario: string | null;
  };
}) {
  if (imagenes.length === 0) return null;

  // Si una foto no trae su publicación, lleva al perfil. Y si tampoco hay
  // perfil, no es un enlace: mejor una foto que un enlace muerto.
  const porDefecto = perfiles.instagram ?? perfiles.tiktok;

  return (
    <section>
      <div className="mx-auto mb-12 max-w-[1440px] px-6 sm:px-10">
        <Revelar className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-6xl">
              {titulo}
            </h2>
            <p className="mt-3 max-w-md text-sm text-tienda-tenue">{entrada}</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {perfiles.instagram && (
              <a
                href={perfiles.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                @{perfiles.instagramUsuario}
              </a>
            )}
            {perfiles.tiktok && (
              <a
                href={perfiles.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                TikTok
              </a>
            )}
          </div>
        </Revelar>
      </div>

      {/*
        A sangre y con desplazamiento lateral: la fila tiene que salirse
        por los dos lados para que se lea como que hay más.
      */}
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 sm:px-10">
        {imagenes.map((img, i) => {
          const destino = img.enlace ?? porDefecto;
          const foto = (
            <span className="relative block aspect-[4/5] w-[60vw] overflow-hidden rounded-tienda-sm bg-tienda-velo sm:w-[38vw] lg:w-[22vw]">
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                fill
                sizes="(max-width: 640px) 60vw, (max-width: 1024px) 38vw, 22vw"
                className="object-cover transition-transform duration-700 ease-tienda hover:scale-[1.04]"
              />
            </span>
          );

          return (
            <Revelar
              as="li"
              key={img.id}
              retardo={(i % 4) * 70}
              className="shrink-0 snap-start"
            >
              {destino ? (
                <a href={destino} target="_blank" rel="noopener noreferrer">
                  {foto}
                </a>
              ) : (
                foto
              )}
            </Revelar>
          );
        })}
      </ul>
    </section>
  );
}

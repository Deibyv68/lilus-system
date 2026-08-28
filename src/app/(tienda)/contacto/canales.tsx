import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  IconoInstagram,
  IconoTikTok,
} from "@/components/tienda/iconos-redes";

/**
 * Por dónde se puede escribir, en tarjetas y antes del formulario.
 *
 * ── Por qué van primero ──
 *
 * El formulario deja a quien escribe esperando sin saber si llegó ni
 * cuándo le van a contestar. WhatsApp no: ve las dos palomitas, tiene la
 * conversación guardada en su teléfono, y puede mandar una foto del
 * comprobante en el mismo hilo. Para casi todo el mundo es mejor camino,
 * así que va arriba y en grande.
 *
 * El formulario se queda —hay quien no quiere dar su número, y hay quien
 * escribe desde el trabajo con el teléfono guardado— pero deja de ser lo
 * único que se ve.
 *
 * ── Qué es un canal aquí ──
 *
 * Cualquiera que no obligue a crearse una cuenta EN ESTA WEB. Esa es la
 * regla que se decidió desde el principio: nadie se registra para
 * comprar jabón. Que Instagram pida su propia cuenta es asunto de
 * Instagram, y quien lo usa ya la tiene.
 *
 * ── Lo que no está cargado no se pinta ──
 *
 * En vez de dejar un botón que no lleva a ningún lado, que es peor que no
 * ofrecerlo: se toca, no pasa nada, y quien lo tocó cierra la página
 * pensando que la tienda está rota.
 */

export type CanalesDisponibles = {
  whatsapp: string | null;
  whatsappNumero: string | null;
  instagram: string | null;
  instagramUsuario: string | null;
  tiktok: string | null;
  tiktokUsuario: string | null;
  correo: string | null;
};

export function Canales({
  canales,
  mensajePorDefecto,
}: {
  canales: CanalesDisponibles;
  /** Texto ya escrito en WhatsApp, para no empezar en blanco. */
  mensajePorDefecto: string;
}) {
  const hayAlguno =
    canales.whatsapp || canales.instagram || canales.tiktok || canales.correo;
  if (!hayAlguno) return null;

  return (
    <div className="space-y-3">
      {canales.whatsapp && (
        /*
          WhatsApp ocupa el ancho entero y los demás van en rejilla. No es
          decoración: aquí se vende por WhatsApp, y quien llega a esta
          página con una duda que le frena la compra tiene que encontrar
          el camino rápido sin leer las cinco opciones.
        */
        <Canal
          href={`${canales.whatsapp}?text=${encodeURIComponent(mensajePorDefecto)}`}
          icono={<MessageCircle className="size-5" strokeWidth={1.5} />}
          titulo="WhatsApp"
          detalle="Lo más rápido. Te contestamos ahí mismo."
          principal
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {canales.instagram && (
          <Canal
            href={canales.instagram}
            icono={<IconoInstagram className="size-5" />}
            titulo="Instagram"
            detalle={`@${canales.instagramUsuario} · por mensaje directo`}
          />
        )}

        {canales.tiktok && (
          <Canal
            href={canales.tiktok}
            icono={<IconoTikTok className="size-5" />}
            titulo="TikTok"
            detalle={`@${canales.tiktokUsuario} · míranos hacerlos`}
          />
        )}

        {canales.correo && (
          <Canal
            href={`mailto:${canales.correo}`}
            icono={<Mail className="size-5" strokeWidth={1.5} />}
            titulo="Correo"
            detalle={canales.correo}
            externo={false}
          />
        )}

        {canales.whatsappNumero && (
          /*
            El mismo número, pero como llamada.

            Parece repetido y no lo es: hay clientas que no usan WhatsApp
            para escribir pero sí llaman, y las hay que prefieren hablar
            cuando el pedido es grande o hay algo que aclarar. En el
            teléfono este enlace marca solo.
          */
          <Canal
            href={`tel:+${canales.whatsappNumero}`}
            icono={<Phone className="size-5" strokeWidth={1.5} />}
            titulo="Llamar"
            detalle={`+${canales.whatsappNumero}`}
            externo={false}
          />
        )}
      </div>
    </div>
  );
}

function Canal({
  href,
  icono,
  titulo,
  detalle,
  principal = false,
  externo = true,
}: {
  href: string;
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
  principal?: boolean;
  /** `tel:` y `mailto:` abren una app, no una pestaña. */
  externo?: boolean;
}) {
  return (
    <a
      href={href}
      {...(externo
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      /*
        `min-w-0` en la propia tarjeta, no solo en el texto de dentro.

        Una celda de rejilla arranca con `min-width: auto`, o sea que se
        niega a encogerse por debajo de lo que mide su contenido. El
        `truncate` del detalle no llegaba a actuar: la tarjeta crecía y se
        salía once píxeles por la derecha en un teléfono.
      */
      className={`flex min-w-0 items-center gap-4 rounded-tienda border px-5 py-4 transition-[background-color,border-color,transform] duration-[400ms] ease-tienda active:scale-[0.99] active:duration-100 active:ease-tienda-tap ${
        principal
          ? "border-tienda-texto bg-tienda-texto text-tienda-fondo hover:bg-tienda-acento hover:border-tienda-acento"
          : "border-tienda-linea hover:border-tienda-texto"
      }`}
    >
      <span className={principal ? "" : "text-tienda-tenue"}>{icono}</span>
      <span className="min-w-0">
        <span
          className={`block whitespace-nowrap text-sm font-medium ${principal ? "" : "text-tienda-texto"}`}
        >
          {titulo}
        </span>
        {/*
          El detalle envuelve, no se corta.

          Con `truncate` en un teléfono desaparecía justo la frase que
          invita a tocar —«lo más rápido, te contesta una persona»— y
          quedaba un «Lo más rá…» que no dice nada. `break-words` es por
          los correos largos, que no tienen espacios por donde partir.
        */}
        <span
          className={`block break-words text-xs ${
            principal ? "opacity-80" : "text-tienda-tenue"
          }`}
        >
          {detalle}
        </span>
      </span>
    </a>
  );
}

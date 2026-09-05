import type { Metadata } from "next";
import Link from "next/link";
import { MarcoLegal, Seccion } from "../marco-legal";
import { datosDeContacto } from "@/lib/tienda";
import { DIAS_PREPARACION } from "@/lib/politicas";

/*
  Se vuelve a generar cada media hora, como la página de contacto.

  Estas páginas leen de la base la identidad del vendedor y sus datos de
  contacto —nombre, cédula, correo, teléfono—, y sin esta línea Next las
  daba por fijas: se armaban al compilar y ahí se quedaban para siempre.

  Se notó al cambiar el correo de contacto: la página de contacto lo
  reflejó sola y estas dos siguieron enseñando el viejo. Y son
  precisamente las páginas donde ese dato tiene que estar bien, porque es
  a donde se escribe para ejercer un derecho o hacer una devolución.

  La misma media hora que `contacto`, para que un cambio en la
  configuración aparezca en toda la tienda a la vez y no a ratos.
*/
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description:
    "Qué hacemos si tu pedido llega equivocado o roto, y cómo pedirnos la solución.",
};

/**
 * Devoluciones.
 *
 * Dice exactamente lo que la dueña respondió: se responde por lo
 * equivocado y por lo roto.
 *
 * ── Lo que este texto NO dice, a propósito ──
 *
 * No niega el derecho de retracto (arrepentirse sin motivo) que la Ley de
 * Defensa del Consumidor contempla para las ventas a distancia. Vender por
 * internet mete a LILUS en ese régimen de una forma en que vender por
 * WhatsApp no lo hacía tanto, y no sé con precisión el plazo ni si los
 * productos de higiene tienen excepción.
 *
 * Escribir «no aceptamos devoluciones por cambio de opinión» sería
 * inventarme una renuncia que quizá no se puede pedir, y un texto así no
 * se sostiene el día que alguien lo discuta. Callar no quita ningún
 * derecho: solo deja el hueco para que lo llene alguien que sepa.
 */
export default async function Devoluciones() {
  const contacto = await datosDeContacto();

  return (
    <MarcoLegal
      titulo="Cambios y devoluciones"
      entrada="Hacemos cada producto a mano y lo revisamos antes de empacarlo, pero las cosas pasan. Si algo sale mal, esto es lo que hacemos."
    >
      <Seccion titulo="Si te llegó algo equivocado o roto">
        <p>
          Lo resolvemos nosotros. Te reponemos el producto sin costo, o te
          devolvemos lo que pagaste por él — lo que prefieras.
        </p>
        <p>
          El envío de la reposición lo pagamos nosotros. Si hace falta que nos
          devuelvas el producto, también corre por nuestra cuenta: el error fue
          nuestro y no tienes por qué poner dinero para arreglarlo.
        </p>
      </Seccion>

      <Seccion titulo="Cómo avisarnos">
        <p>
          Escríbenos{" "}
          {contacto.whatsapp ? (
            <a
              href={contacto.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              por WhatsApp
            </a>
          ) : (
            "por WhatsApp"
          )}{" "}
          con el número de tu pedido y una foto de lo que llegó. Con la foto
          casi siempre alcanza y no tienes que devolver nada.
        </p>
        <p>
          Avísanos apenas lo veas. Cuanto antes lo sepamos, antes te lo
          reponemos — y si el paquete llegó golpeado, la transportadora también
          tiene plazos para responder.
        </p>
      </Seccion>

      <Seccion titulo="Si cambiaste de opinión">
        <p>
          Escríbenos y lo conversamos. Si el pedido todavía no salió del taller,
          lo más probable es que podamos cancelarlo o cambiarlo sin problema:
          tenemos unos {DIAS_PREPARACION} días de margen desde que confirmas el
          pago.
        </p>
        <p>
          Si ya salió, cuéntanos igual. Preferimos resolverlo hablando que
          escondernos detrás de una política.
        </p>
      </Seccion>

      <Seccion titulo="Productos abiertos o usados">
        <p>
          Son cosméticos de higiene: una vez abiertos no los podemos volver a
          vender, así que no los recibimos de vuelta salvo que el problema sea
          de fabricación — que se corte, que huela raro, que venga con algo que
          no corresponde. En ese caso entra en el primer punto de esta página y
          lo resolvemos nosotros.
        </p>
      </Seccion>

      <Seccion titulo="¿Dudas antes de comprar?">
        <p>
          Pregúntanos. Preferimos que sepas qué estás llevando a que te llegue
          algo que no era. En cada producto está lo que lleva y para qué tipo de
          piel es, y si te falta un dato, escríbenos.{" "}
          <Link href="/" className="underline underline-offset-4">
            Ver el catálogo
          </Link>
          .
        </p>
      </Seccion>
    </MarcoLegal>
  );
}

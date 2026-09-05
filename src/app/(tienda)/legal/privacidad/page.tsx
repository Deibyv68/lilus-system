import type { Metadata } from "next";
import { MarcoLegal, Seccion } from "../marco-legal";
import { identidadDelVendedor, datosDeContacto } from "@/lib/tienda";

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
  title: "Tus datos",
  description:
    "Qué datos te pedimos al comprar, para qué los usamos y cómo pedirnos que los borremos.",
};

/**
 * Privacidad.
 *
 * Enumera exactamente los campos que pide el checkout, ni uno más. Una
 * política que habla en genérico de «información del usuario» no le sirve
 * a nadie: quien la lee quiere saber si guardamos su cédula, y la
 * respuesta tiene que estar escrita.
 *
 * Si algún día el formulario pide un campo nuevo, esta página se actualiza
 * en el mismo cambio. La lista de abajo es la única fuente donde el
 * cliente puede verificar qué tenemos suyo.
 */
export default async function Privacidad() {
  const [vendedor, contacto] = await Promise.all([
    identidadDelVendedor(),
    datosDeContacto(),
  ]);

  return (
    <MarcoLegal
      titulo="Tus datos"
      entrada="Te pedimos lo justo para hacerte llegar el pedido. Aquí está todo lo que guardamos, para qué, y cómo pedirnos que lo borremos."
    >
      <Seccion titulo="Qué te pedimos, y para qué">
        <ul className="space-y-2.5">
          <li>
            <strong className="font-medium">Nombre.</strong> Va impreso en la
            etiqueta de envío. Sin él la transportadora no sabe a quién entregar.
          </li>
          <li>
            <strong className="font-medium">Teléfono.</strong> También va en la
            etiqueta. Es a quien llama el repartidor si no encuentra la casa.
          </li>
          <li>
            <strong className="font-medium">Correo.</strong> Para mandarte la
            confirmación del pedido y el enlace donde ves cómo va.
          </li>
          <li>
            <strong className="font-medium">Dirección y referencia.</strong>{" "}
            Para el envío. La referencia es opcional y ayuda a que te encuentren.
          </li>
          <li>
            <strong className="font-medium">Cédula o RUC.</strong>{" "}
            <em>Opcional.</em> Solo si quieres factura. Si no la necesitas, no la
            escribas: no te la pedimos para nada más.
          </li>
        </ul>
        <p>
          Eso es todo. No pedimos fecha de nacimiento, ni género, ni nada que no
          haga falta para mandarte un jabón.
        </p>
      </Seccion>

      <Seccion titulo="Qué NO hacemos">
        <ul className="space-y-2.5">
          <li>No vendemos ni cedemos tus datos a nadie.</li>
          <li>
            No usamos rastreadores ni analítica: no hay Google Analytics, ni
            píxel de Facebook, ni publicidad que te siga por otras webs.
          </li>
          <li>
            No te mandamos promociones por escribirnos. Si algún día hacemos una
            lista de correo, será algo a lo que te apuntes tú.
          </li>
          <li>No guardamos datos de tarjetas, porque el pago es por transferencia.</li>
        </ul>
      </Seccion>

      <Seccion titulo="Con quién se comparte">
        <p>
          Con <strong className="font-medium">Servientrega</strong>, y solo lo
          que va impreso en la etiqueta: tu nombre, tu teléfono y tu dirección.
          Sin eso no hay forma de entregarte el paquete.
        </p>
        <p>
          Nadie más. Los datos viven en nuestro propio servidor, no en un
          servicio de terceros.
        </p>
      </Seccion>

      <Seccion titulo="Sobre el carrito">
        <p>
          Lo que metes al carrito se guarda en tu propio navegador, en tu
          dispositivo — no en nuestro servidor, y no lo vemos. Es lo que hace
          que no se te pierda si cierras la pestaña y vuelves mañana.
        </p>
        <p>
          Se borra solo si vacías el carrito o si limpias los datos del
          navegador. No usamos cookies de rastreo, así que tampoco vas a ver ese
          cartel de aceptar cookies: no hay nada que aceptar.
        </p>
      </Seccion>

      <Seccion titulo="Cuánto tiempo lo guardamos">
        <p>
          Los pedidos los conservamos como registro del negocio. Tus datos de
          contacto se quedan mientras seas cliente, para que no tengas que
          escribirlos de nuevo la próxima vez.
        </p>
        <p>
          Si quieres que los borremos, escríbenos y lo hacemos. Ten en cuenta
          que de los pedidos ya facturados o enviados tenemos que conservar el
          registro contable, pero podemos borrar el resto.
        </p>
      </Seccion>

      <Seccion titulo="Qué puedes pedirnos">
        <p>
          Que te digamos qué tenemos tuyo, que lo corrijamos si está mal, o que
          lo borremos. Son tus datos y son tus derechos.
        </p>
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
          )}
          {vendedor.email && <> o a {vendedor.email}</>} y te respondemos. No
          hace falta que expliques por qué.
        </p>
      </Seccion>

      <Seccion titulo="Quién responde por esto">
        <p>
          {vendedor.nombre}
          {vendedor.cedula && <>, cédula {vendedor.cedula}</>}
          {vendedor.ciudad && <>, en {vendedor.ciudad}</>}.
        </p>
      </Seccion>
    </MarcoLegal>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MarcoLegal, Seccion } from "../marco-legal";
import { identidadDelVendedor, datosDeContacto } from "@/lib/tienda";
import {
  DIAS_PREPARACION,
  DIAS_PARA_TRANSFERIR,
  METODO_DE_PAGO,
} from "@/lib/politicas";

export const metadata: Metadata = {
  title: "Condiciones de compra",
  description:
    "Cómo funciona comprar en LILUS: pago por transferencia, plazos de preparación y envío a todo Ecuador.",
};

export default async function Terminos() {
  const [vendedor, contacto] = await Promise.all([
    identidadDelVendedor(),
    datosDeContacto(),
  ]);

  return (
    <MarcoLegal
      titulo="Condiciones de compra"
      entrada="Lo que pasa desde que confirmas tu pedido hasta que te llega. Está escrito para que se entienda, no para cubrirnos las espaldas."
    >
      <Seccion titulo="Quién te vende">
        <p>
          {vendedor.nombre}
          {vendedor.cedula && <>, con cédula {vendedor.cedula}</>}
          {vendedor.ciudad && <>, en {vendedor.ciudad}</>}.
        </p>
        <p>
          Somos un taller pequeño: los productos se hacen a mano, en tandas
          chicas, en Ecuador.
        </p>
      </Seccion>

      <Seccion titulo="Tu pedido no está cerrado hasta que veamos el pago">
        <p>
          Cuando confirmas en la web, tu pedido queda{" "}
          <strong className="font-medium">pendiente</strong>. Todavía no está
          confirmado: lo estará cuando veamos la {METODO_DE_PAGO} en la cuenta.
        </p>
        <p>
          Eso importa por una razón práctica: mientras esté pendiente, no
          reservamos el producto. Hacemos tandas chicas y puede agotarse. Si eso
          pasa después de que pagaste, te devolvemos el dinero completo o lo
          cambiamos por otra cosa, lo que prefieras.
        </p>
      </Seccion>

      <Seccion titulo="Cuánto tienes para transferir">
        <p>
          {DIAS_PARA_TRANSFERIR} días. Si a los {DIAS_PARA_TRANSFERIR} días no
          nos llegó la transferencia, cancelamos el pedido y lo liberamos.
        </p>
        <p>
          No es una multa ni pierdes nada: si después quieres, lo vuelves a
          hacer. Simplemente no podemos dejar pedidos abiertos para siempre.
        </p>
      </Seccion>

      <Seccion titulo="Cuánto tarda en salir">
        <p>
          Alrededor de {DIAS_PREPARACION} días desde que confirmamos el pago.
          Cada barra se corta, se cura, se etiqueta con su lote y su fecha, y se
          empaca a mano.
        </p>
        <p>
          A eso hay que sumarle lo que tarde la transportadora. Cuando el pedido
          salga te mandamos la guía para que lo sigas.
        </p>
      </Seccion>

      <Seccion titulo="Envíos">
        <p>
          Enviamos por Servientrega a todo el Ecuador. El costo se calcula
          según la zona y lo ves antes de confirmar, nunca después.
        </p>
        <p>
          La dirección que escribas es la que va impresa en la etiqueta. Si está
          incompleta y el paquete se devuelve, tendremos que cobrar el segundo
          envío — revisa que esté bien antes de confirmar.
        </p>
      </Seccion>

      <Seccion titulo="Precios">
        <p>
          En dólares de Estados Unidos, que es la moneda de Ecuador. El precio
          que ves al confirmar es el que se cobra, aunque el del catálogo cambie
          después.
        </p>
      </Seccion>

      <Seccion titulo="Qué son estos productos">
        <p>
          Cosméticos de higiene y cuidado personal. No son medicamentos: no
          tratan ni curan ninguna enfermedad, y nada de lo que decimos en la web
          debe leerse como un consejo médico.
        </p>
        <p>
          Llevan ingredientes naturales y aceites esenciales, que en algunas
          personas pueden causar reacción. Si tienes la piel sensible o una
          condición en la piel, prueba primero en una zona pequeña y consulta a
          un profesional de la salud.
        </p>
      </Seccion>

      <Seccion titulo="Si algo sale mal">
        <p>
          Está en{" "}
          <Link
            href="/legal/devoluciones"
            className="underline underline-offset-4"
          >
            cambios y devoluciones
          </Link>
          . En resumen: si te llega algo equivocado o roto, lo resolvemos
          nosotros y sin costo para ti.
        </p>
      </Seccion>

      <Seccion titulo="Cómo hablarnos">
        <p>
          {contacto.whatsapp ? (
            <>
              Por{" "}
              <a
                href={contacto.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                WhatsApp
              </a>
            </>
          ) : (
            <>Por WhatsApp</>
          )}
          {vendedor.email && <> o a {vendedor.email}</>}. Contestamos personas,
          no un robot, así que puede tomar unas horas.
        </p>
      </Seccion>
    </MarcoLegal>
  );
}

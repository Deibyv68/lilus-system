import type { Metadata } from "next";
import Link from "next/link";
import { opcionesDeEnvio } from "@/lib/tienda";
import { FormularioCheckout } from "./formulario-checkout";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Checkout() {
  const zonas = await opcionesDeEnvio();

  if (zonas.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-14">
        <h1 className="text-2xl font-medium tracking-tight">Tu pedido</h1>
        <p className="mt-5 text-tienda-tenue">
          Ahora mismo no podemos calcular el envío. Escríbenos y cerramos el
          pedido por WhatsApp.
        </p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return <FormularioCheckout zonas={zonas} />;
}

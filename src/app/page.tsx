import type { Metadata } from "next";
import Image from "next/image";

/**
 * Marcador de la tienda.
 *
 * La raíz era el escritorio del panel hasta que este se mudó a /sistema.
 * Queda esta página en su lugar para que la dirección no responda 404
 * mientras se construye la tienda de verdad.
 *
 * Es temporal a propósito: no tiene catálogo, ni carrito, ni nada que
 * mantener. Cuando llegue la tienda, este archivo se reemplaza entero.
 */

export const metadata: Metadata = {
  title: "LILUS — Jabones artesanales",
  description:
    "Jabones y cosmética artesanal hechos en Ecuador. Pronto vas a poder comprar aquí.",
};

export default function Inicio() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/brand/lilus-logo.png"
        alt="LILUS"
        width={140}
        height={140}
        priority
        className="rounded-full"
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight">LILUS</h1>
        <p className="text-muted-foreground">Jabones artesanales · Ecuador</p>
      </div>

      <p className="max-w-sm text-sm text-muted-foreground text-balance">
        Estamos preparando la tienda. Mientras tanto, los pedidos se siguen
        tomando por WhatsApp e Instagram, como siempre.
      </p>
    </main>
  );
}

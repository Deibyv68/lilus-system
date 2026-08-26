import type { Metadata } from "next";
import { VistaCarrito } from "./vista-carrito";

export const metadata: Metadata = {
  title: "Tu carrito",
  // Un carrito no tiene nada que hacer en un buscador: es distinto para
  // cada persona y no existe hasta que alguien pone algo adentro.
  robots: { index: false, follow: true },
};

export default function PaginaCarrito() {
  return <VistaCarrito />;
}

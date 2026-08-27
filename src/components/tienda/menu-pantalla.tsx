"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { CapaPantalla } from "@/components/tienda/capa-pantalla";

/**
 * El menú, a pantalla completa.
 *
 * No es un desplegable bajo la cabecera: tapa todo y deja los destinos
 * grandes en el centro. Es un cambio de contexto — mientras está abierto
 * no hay tienda que mirar, solo a dónde ir.
 *
 * ── El escalonado ──
 *
 * Los enlaces entran uno detrás de otro con 40 ms de diferencia. Es poco
 * a propósito: con más, los últimos llegan tarde y quien ya sabía a dónde
 * iba se queda esperando a que la interfaz termine de presentarse.
 */

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/tienda", texto: "Tienda" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/contacto", texto: "Contacto" },
];

const LEGALES = [
  // Va con los legales y no con los grandes de arriba: quien busca su
  // pedido ya compró, no está navegando la tienda.
  { href: "/rastrear", texto: "Dónde está mi pedido" },
  { href: "/legal/terminos", texto: "Condiciones de compra" },
  { href: "/legal/devoluciones", texto: "Cambios y devoluciones" },
  { href: "/legal/privacidad", texto: "Tus datos" },
];

export function MenuPantalla({
  abierto,
  onCerrar,
  marca,
  contacto,
}: {
  abierto: boolean;
  onCerrar: () => void;
  marca: string;
  contacto: { whatsapp: string | null; instagram: string | null; instagramUsuario: string | null };
}) {
  return (
    <CapaPantalla abierta={abierto} onCerrar={onCerrar} etiqueta="Menú">
      <div className="flex h-full flex-col">
        {/* Misma altura y márgenes que la cabecera, para que la marca no
            salte de sitio al abrir. */}
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            onClick={onCerrar}
            className="flex items-baseline gap-1.5 py-2"
          >
            <span className="font-display text-3xl leading-none tracking-[0.02em] text-white">
              {marca}
            </span>
            <span aria-hidden="true" className="text-xs text-tienda-tenue">
              ®
            </span>
          </Link>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el menú"
            className="-mr-3 p-3 text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            <X className="size-7" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
          <ul className="w-full text-center">
            {ENLACES.map((e, i) => (
              <li
                key={e.href}
                className="capa-item"
                style={{ ["--retardo" as string]: `${i * 40}ms` }}
              >
                <Link
                  href={e.href}
                  onClick={onCerrar}
                  className="block py-1.5 font-display text-4xl leading-tight tracking-[-0.01em] text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-white sm:text-6xl"
                >
                  {e.texto}
                </Link>
              </li>
            ))}

            {LEGALES.map((e, i) => (
              <li
                key={e.href}
                className="capa-item"
                style={{ ["--retardo" as string]: `${(ENLACES.length + i) * 40}ms` }}
              >
                <Link
                  href={e.href}
                  onClick={onCerrar}
                  className="mt-1 block py-2 text-sm text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-tienda-tenue sm:px-10">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {contacto.whatsapp && (
              <a
                href={contacto.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                WhatsApp
              </a>
            )}
            {contacto.instagram && (
              <a
                href={contacto.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                @{contacto.instagramUsuario}
              </a>
            )}
          </div>
          <p className="text-xs text-tienda-tenue/70">
            {marca} © {new Date().getFullYear()} · Ecuador
          </p>
        </div>
      </div>
    </CapaPantalla>
  );
}

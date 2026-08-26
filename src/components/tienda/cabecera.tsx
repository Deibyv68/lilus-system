"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCarrito, totalUnidades } from "@/lib/carrito";

/**
 * La cabecera de la tienda.
 *
 * Marca a la izquierda, navegación al centro, acciones a la derecha. Es
 * la disposición de la referencia y funciona porque separa las tres cosas
 * que hace una cabecera: decir dónde estás, llevarte a otro lado, y darte
 * las herramientas.
 *
 * El menú de hamburguesa convive con la navegación central a propósito,
 * igual que en la referencia: en pantalla grande la navegación se ve y la
 * hamburguesa abre el resto (legales, contacto); en móvil la navegación
 * se esconde y la hamburguesa es la única puerta.
 */

const ENLACES = [
  { href: "/tienda", texto: "Tienda" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/contacto", texto: "Contacto" },
];

const SECUNDARIOS = [
  { href: "/legal/terminos", texto: "Condiciones de compra" },
  { href: "/legal/devoluciones", texto: "Cambios y devoluciones" },
  { href: "/legal/privacidad", texto: "Tus datos" },
];

export function Cabecera({ marca }: { marca: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  const lineas = useCarrito((s) => s.lineas);
  const listo = useCarrito((s) => s.listo);
  const unidades = totalUnidades(lineas);

  return (
    <header className="sticky top-0 z-50 border-b border-tienda-linea bg-tienda-fondo/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 sm:px-10 lg:grid-cols-3">
        {/* Marca */}
        <Link href="/" className="group flex items-baseline gap-1.5 justify-self-start">
          <span className="font-display text-3xl leading-none tracking-[0.02em] text-white transition-colors duration-[400ms] ease-tienda group-hover:text-tienda-acento">
            {marca}
          </span>
          {/*
            El símbolo va pequeño y arriba, como en la referencia. Es
            decorativo: un lector de pantalla que lo lea letra por letra
            solo entorpece el nombre de la marca.
          */}
          <span aria-hidden="true" className="text-xs text-tienda-tenue">
            ®
          </span>
        </Link>

        {/* Navegación: solo en pantalla grande */}
        <nav className="hidden justify-center gap-10 lg:flex">
          {ENLACES.map((e) => {
            const activo = pathname === e.href || pathname.startsWith(`${e.href}/`);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={`text-sm font-medium uppercase tracking-[0.12em] transition-colors duration-[400ms] ease-tienda ${
                  activo ? "text-white" : "text-tienda-texto hover:text-white"
                }`}
              >
                {e.texto}
              </Link>
            );
          })}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-5 justify-self-end sm:gap-6">
          <Link
            href="/tienda"
            aria-label="Buscar en la tienda"
            className="transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            <Search className="size-5" strokeWidth={1.5} />
          </Link>

          <Link
            href="/carrito"
            aria-label={
              listo && unidades > 0
                ? `Carrito, ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`
                : "Carrito, vacío"
            }
            className="relative transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            <ShoppingBag className="size-5" strokeWidth={1.5} />
            {/*
              El contador espera a que el carrito se lea del navegador. El
              servidor no sabe qué hay guardado ahí y manda cero: pintarlo
              haría que quien vuelve con tres cosas viera un cero que salta
              a tres, y eso se lee como que se perdió el pedido.
            */}
            {listo && unidades > 0 && (
              <span className="absolute -bottom-1.5 -left-2 grid size-5 place-items-center rounded-full bg-tienda-acento text-[10px] font-medium tabular-nums text-tienda-fondo">
                {unidades}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-controls="menu-tienda"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            {menuAbierto ? (
              <X className="size-6" strokeWidth={1.5} />
            ) : (
              <Menu className="size-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/*
        El panel se despliega bajo la cabecera en vez de taparlo todo. En
        una tienda, cubrir la pantalla entera para mostrar cinco enlaces
        desorienta más de lo que ayuda.
      */}
      <div
        id="menu-tienda"
        hidden={!menuAbierto}
        className="border-t border-tienda-linea bg-tienda-fondo"
      >
        <nav className="mx-auto max-w-[1440px] px-6 py-8 sm:px-10">
          <ul className="space-y-4 lg:hidden">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setMenuAbierto(false)}
                  className="font-display text-3xl leading-none tracking-[-0.01em] text-white"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex flex-col gap-3 pt-6 text-sm text-tienda-tenue lg:flex-row lg:gap-10 lg:pt-0">
            {SECUNDARIOS.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setMenuAbierto(false)}
                  className="transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

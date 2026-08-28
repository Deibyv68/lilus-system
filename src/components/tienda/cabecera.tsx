"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCarrito, totalUnidades } from "@/lib/carrito";
import { PanelCarrito } from "@/components/tienda/panel-carrito";
import { MenuPantalla } from "@/components/tienda/menu-pantalla";
import { Buscador } from "@/components/tienda/buscador";

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

/*
  «Mi pedido» va arriba, con los demás.

  Estaba solo dentro del menú de hamburguesa, y en pantalla grande la
  hamburguesa casi nadie la abre: la navegación está a la vista, así que
  se da por hecho que ahí está todo. Quien vuelve a esta web después de
  comprar viene a una sola cosa —saber por dónde va su pedido— y tenía
  que buscarla.

  Se llama «Mi pedido» y no «Rastrear» porque describe lo que quien lo
  toca está buscando, no lo que hace el sistema. Y cabe: en la barra hay
  cuatro palabras en versalitas y una quinta larga las apretaría.
*/
const ENLACES = [
  { href: "/tienda", texto: "Tienda" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/contacto", texto: "Contacto" },
  { href: "/rastrear", texto: "Mi pedido" },
];

export function Cabecera({
  marca,
  contacto,
}: {
  marca: string;
  contacto: {
    whatsapp: string | null;
    instagram: string | null;
    instagramUsuario: string | null;
  };
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);

  /*
    Uno u otro, nunca los dos.

    Eran independientes, así que se podía dejar el menú desplegado y abrir
    encima el carrito: quedaban dos paneles a la vez, con el de abajo
    asomando por detrás del velo. Parecía un fallo de pintado y era solo
    que ninguno sabía del otro.
  */
  function abrirCarrito() {
    setMenuAbierto(false);
    setBuscadorAbierto(false);
    setCarritoAbierto(true);
  }

  function alternarMenu() {
    setCarritoAbierto(false);
    setBuscadorAbierto(false);
    setMenuAbierto((v) => !v);
  }

  function abrirBuscador() {
    setCarritoAbierto(false);
    setMenuAbierto(false);
    setBuscadorAbierto(true);
  }
  const pathname = usePathname();

  const lineas = useCarrito((s) => s.lineas);
  const listo = useCarrito((s) => s.listo);
  const unidades = totalUnidades(lineas);

  return (
    /*
      El panel del carrito va FUERA de <header>, como hermano.
      
      No es orden: el `backdrop-blur` de la cabecera la convierte en el
      marco de referencia de sus descendientes `fixed`. Con el panel
      dentro, su `inset-0` no medía la pantalla sino la cabecera — 88 px
      de alto en un teléfono— y el velo oscuro solo cubría esa franja.
      Sacándolo, vuelve a medir contra la ventana.
    */
    <>
      <header className="sticky top-0 z-50 border-b border-tienda-linea bg-tienda-fondo/80 backdrop-blur-md">
        {/*
          La columna del centro se mide por su contenido, no a un tercio.

          Con `grid-cols-3` los cuatro enlaces no cabían en 384 px y el
          último se partía en dos líneas: «MI / PEDIDO». Con `1fr auto 1fr`
          la navegación ocupa lo que necesita y sigue centrada, porque las
          dos columnas de los lados se reparten el resto por igual.
        */}
        <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 sm:px-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* Marca */}
          {/* py-2 no es aire decorativo: sube la zona tactil de 30 a 46 px. */}
          <Link
            href="/"
            className="group flex items-baseline gap-1.5 justify-self-start py-2"
          >
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
          <nav className="hidden justify-center gap-8 lg:flex">
            {ENLACES.map((e) => {
              const activo = pathname === e.href || pathname.startsWith(`${e.href}/`);
              return (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={activo ? "page" : undefined}
                  /*
                    `whitespace-nowrap`: una etiqueta de dos palabras no
                    puede partirse por la mitad en una barra de navegación.
                  */
                  className={`whitespace-nowrap text-sm font-medium uppercase tracking-[0.12em] transition-colors duration-[400ms] ease-tienda ${
                    activo ? "text-white" : "text-tienda-texto hover:text-white"
                  }`}
                >
                  {e.texto}
                </Link>
              );
            })}
          </nav>

          {/* Acciones */}
          {/*
            Separacion chica y relleno grande, en vez de al reves. Cada icono
            mide 20 px: con `gap-5` y sin relleno, la zona que responde al
            dedo eran esos 20 px y fallar el toque era lo normal. Con `p-3`
            cada uno pasa a 44 px —el minimo comodo— y el hueco visible entre
            ellos queda parecido. El margen negativo devuelve el ultimo a la
            linea del contenido.
          */}
          <div className="-mr-3 flex items-center gap-0 justify-self-end sm:gap-1">
            <button
              type="button"
              onClick={abrirBuscador}
              aria-haspopup="dialog"
              aria-expanded={buscadorAbierto}
              aria-label="Buscar en la tienda"
              className="p-3 transition-colors duration-[400ms] ease-tienda hover:text-white"
            >
              <Search className="size-5" strokeWidth={1.5} />
            </button>

            {/*
              Abre el panel en vez de navegar. La página /carrito sigue
              existiendo y se llega desde dentro del panel: el vistazo no
              debería costar salir de donde uno estaba.
            */}
            <button
              type="button"
              onClick={abrirCarrito}
              aria-haspopup="dialog"
              aria-expanded={carritoAbierto}
              aria-label={
                listo && unidades > 0
                  ? `Carrito, ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`
                  : "Carrito, vacío"
              }
              className="relative p-3 transition-colors duration-[400ms] ease-tienda hover:text-white"
            >
              {/*
                El contador se ancla al ICONO, no al botón.

                Estaba pegado al botón, y cuando a este se le puso relleno
                para agrandar la zona táctil a 44 px, el contador se quedó
                donde estaba: encima de la bolsa, tapándola por la mitad.
                Con su propio envoltorio, la posición del número ya no
                depende de cuánto relleno tenga el botón.
              */}
              <span className="relative block">
                <ShoppingBag className="size-5" strokeWidth={1.5} />
                {/*
                  Espera a que el carrito se lea del navegador. El servidor
                  no sabe qué hay guardado ahí y manda cero: pintarlo haría
                  que quien vuelve con tres cosas viera un cero que salta a
                  tres, y eso se lee como que se perdió el pedido.
                */}
                {listo && unidades > 0 && (
                  <span className="absolute -bottom-2 -left-2.5 grid size-[18px] place-items-center rounded-full bg-tienda-acento text-[10px] font-medium leading-none tabular-nums text-tienda-fondo">
                    {unidades}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={alternarMenu}
              aria-expanded={menuAbierto}
              aria-haspopup="dialog"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              className="p-3 transition-colors duration-[400ms] ease-tienda hover:text-white"
            >
              {menuAbierto ? (
                <X className="size-6" strokeWidth={1.5} />
              ) : (
                <Menu className="size-6" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

      </header>

      <PanelCarrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
      />

      <MenuPantalla
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        marca={marca}
        contacto={contacto}
      />

      <Buscador
        abierto={buscadorAbierto}
        onCerrar={() => setBuscadorAbierto(false)}
      />
    </>
  );
}

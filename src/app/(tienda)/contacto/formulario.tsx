"use client";

import { useRef, useState, useTransition } from "react";
import { enviarMensajeAction } from "./actions";

/**
 * El formulario de contacto, con la forma de la referencia: nombre y
 * correo en dos columnas, mensaje ancho debajo, y un botón a todo lo
 * ancho.
 *
 * Al enviarse no se va a otra página: la tarjeta se reemplaza por el
 * acuse. Mandar a alguien a una página de «gracias» le hace perder el
 * sitio donde estaba y le obliga a volver.
 */
export function FormularioDeContacto({ whatsapp }: { whatsapp: string | null }) {
  const formulario = useRef<HTMLFormElement>(null);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, startEnvio] = useTransition();

  function onEnviar(fd: FormData) {
    setError(null);
    startEnvio(async () => {
      const r = await enviarMensajeAction(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      formulario.current?.reset();
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="rounded-tienda border border-tienda-linea bg-tienda-fondo-alt p-8 text-center sm:p-12">
        <p className="font-display text-3xl leading-tight text-white sm:text-4xl">
          Nos llegó
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-tienda-tenue">
          Contestamos al correo que dejaste, normalmente el mismo día. Si es
          algo urgente, WhatsApp es más rápido.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="mt-6 text-sm text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
        >
          Escribir otro
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formulario}
      action={onEnviar}
      className="rounded-tienda border border-tienda-linea bg-tienda-fondo-alt p-6 sm:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Campo etiqueta="Tu nombre" nombre="nombre" placeholder="María Alvarado" />
        <Campo
          etiqueta="Tu correo"
          nombre="correo"
          tipo="email"
          placeholder="maria@correo.com"
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="mensaje"
          className="block text-xs uppercase tracking-[0.12em] text-tienda-tenue"
        >
          Tu mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          maxLength={2000}
          placeholder="Cuéntanos en qué te ayudamos…"
          className="mt-3 w-full resize-y rounded-tienda-sm border border-tienda-linea bg-transparent px-4 py-3 text-base text-tienda-texto placeholder:text-tienda-tenue/50 focus:border-tienda-texto focus:outline-none sm:text-sm"
        />
      </div>

      {/*
        La trampa para robots. `aria-hidden` y `tabIndex={-1}` la sacan del
        recorrido de lectores de pantalla y del tabulador, así que una
        persona no puede llenarla ni queriendo. Un programa que rellena
        campos leyendo el HTML sí la llena, y ahí se delata.

        Va escondida con posición y no con `display:none` ni `hidden`: los
        robots más nuevos ignoran los campos que están explícitamente
        ocultos.
      */}
      <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="web">No llenes esto</label>
        <input id="web" name="web" type="text" tabIndex={-1} autoComplete="off" aria-hidden />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-tienda-sm border border-tienda-linea px-4 py-3 text-sm text-tienda-texto"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-8 w-full rounded-full bg-tienda-texto px-6 py-4 text-sm font-medium uppercase tracking-[0.12em] text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-acento active:scale-[0.99] active:duration-100 disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Enviar"}
      </button>

      {whatsapp && (
        <p className="mt-5 text-center text-xs text-tienda-tenue">
          ¿Es urgente?{" "}
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
          >
            Escríbenos por WhatsApp
          </a>
        </p>
      )}
    </form>
  );
}

function Campo({
  etiqueta,
  nombre,
  tipo = "text",
  placeholder,
}: {
  etiqueta: string;
  nombre: string;
  tipo?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label
        htmlFor={nombre}
        className="block text-xs uppercase tracking-[0.12em] text-tienda-tenue"
      >
        {etiqueta}
      </label>
      {/*
        `text-base` en móvil: por debajo de 16px, iOS hace zoom al enfocar
        el campo y deja la página torcida.
      */}
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required
        placeholder={placeholder}
        className="mt-3 w-full rounded-tienda-sm border border-tienda-linea bg-transparent px-4 py-3 text-base text-tienda-texto placeholder:text-tienda-tenue/50 focus:border-tienda-texto focus:outline-none sm:text-sm"
      />
    </div>
  );
}

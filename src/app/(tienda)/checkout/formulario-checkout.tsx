"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useCarrito, subtotal } from "@/lib/carrito";
import { formatCurrency } from "@/lib/format";
import {
  PROVINCIAS,
  cantonesDe,
  cedulaValida,
  telefonoValido,
} from "@/lib/ecuador";
import {
  MapaDireccion,
  type UbicacionElegida,
} from "@/components/tienda/mapa-direccion";
import { crearPedidoWebAction } from "./actions";

/**
 * El checkout.
 *
 * Un solo formulario y no tres pantallas. Partirlo en pasos agrega clics
 * y pantallas de carga sin quitarle trabajo a nadie, y cada salto es una
 * oportunidad más de abandonar. Lo que sí se separa visualmente son los
 * bloques, para que se lea de arriba abajo.
 *
 * ── Lo que se guarda en el navegador, y lo que no ──
 *
 * Lo escrito se guarda en `localStorage` mientras se escribe, y se
 * recupera al volver. Alguien llena medio formulario, le entra una
 * llamada, y al volver lo encuentra ahí.
 *
 * Va en el navegador y NO en el servidor a propósito. Lo obvio sería
 * pedirle al servidor «dame la dirección del cliente con este correo»,
 * pero eso sería un buscador público de direcciones: cualquiera podría
 * probar correos hasta acertar y quedarse con la dirección de casa de
 * alguien. Es exactamente la fuga que ya hubo que tapar en
 * `/api/customers/search`.
 *
 * El navegador no tiene ese problema: mismo aparato es, casi siempre, la
 * misma persona. Y cubre el caso real —quien vuelve a comprar desde su
 * teléfono— sin exponer nada.
 *
 * Se borra al confirmar el pedido: no tiene sentido dejar la cédula de
 * alguien guardada en un teléfono que puede ser prestado.
 */

type Zona = {
  id: string;
  nombre: string;
  porDefecto: boolean;
  precio: number;
  transportadora: string;
};

type Datos = {
  nombre: string;
  telefono: string;
  email: string;
  cedula: string;
  provincia: string;
  ciudad: string;
  calle: string;
  referencia: string;
  nota: string;
  lat: number | null;
  lng: number | null;
};

const VACIO: Datos = {
  nombre: "",
  telefono: "",
  email: "",
  cedula: "",
  provincia: "",
  ciudad: "",
  calle: "",
  referencia: "",
  nota: "",
  lat: null,
  lng: null,
};

const GUARDADO = "lilus_checkout";

/**
 * Lo que quedó escrito la vez pasada, o el formulario vacío.
 *
 * Devuelve el MISMO objeto `VACIO` cuando no hay nada guardado, para que
 * quien lo llame pueda comparar por identidad y saber si encontró algo.
 */
function leerGuardado(): Datos {
  if (typeof window === "undefined") return VACIO;
  try {
    const crudo = localStorage.getItem(GUARDADO);
    if (!crudo) return VACIO;
    const previo = JSON.parse(crudo) as Partial<Datos>;
    if (!previo.nombre && !previo.calle) return VACIO;
    return { ...VACIO, ...previo };
  } catch {
    // Un JSON corrupto o el almacenamiento bloqueado no pueden impedir
    // comprar: se sigue con el formulario vacío.
    return VACIO;
  }
}

export function FormularioCheckout({ zonas }: { zonas: Zona[] }) {
  const router = useRouter();
  const [enviando, startTransition] = useTransition();
  const { lineas, listo, vaciar } = useCarrito();

  const [zonaId, setZonaId] = useState(
    zonas.find((z) => z.porDefecto)?.id ?? zonas[0].id
  );
  /*
    Lo guardado se lee al crear el estado, no en un efecto.

    Leerlo en un efecto obligaba a un `setState` dentro del efecto —un
    render de más y una advertencia del linter con razón—. Acá se lee una
    sola vez, cuando el estado nace.

    Es seguro pese a que esto también se renderiza en el servidor: hasta
    que el carrito termina de hidratarse, `listo` es falso y el
    formulario no se pinta. Para cuando estos valores llegan a un campo,
    ya estamos solo en el navegador.
  */
  const [d, setD] = useState<Datos>(leerGuardado);
  const [recuperado, setRecuperado] = useState(
    () => leerGuardado() !== VACIO
  );
  const [verMapa, setVerMapa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
    Recuperar lo de la vez pasada.

    El linter marca escribir estado dentro de un efecto, y con razón en
    general. Este es el caso que la propia regla exceptúa: leer de un
    sistema externo —el almacenamiento del navegador— al montar. No se
    puede hacer en el inicializador de `useState` porque ese corre también
    en el servidor, donde `localStorage` no existe.
  */
  // Y guardarlo mientras escribe.
  useEffect(() => {
    if (d === VACIO) return;
    try {
      localStorage.setItem(GUARDADO, JSON.stringify(d));
    } catch {
      /* almacenamiento lleno o en privado: no es motivo para romper nada */
    }
  }, [d]);

  const zona = zonas.find((z) => z.id === zonaId)!;
  const productos = subtotal(lineas);
  const total = productos + zona.precio;

  const cantones = cantonesDe(d.provincia);

  /*
    Los avisos solo salen si el campo tiene algo escrito. Marcar en rojo
    un campo que todavía nadie tocó es regañar a alguien por no haber
    terminado de llenar el formulario.
  */
  const malTelefono = d.telefono.length > 0 && !telefonoValido(d.telefono);
  const malCedula = d.cedula.length > 0 && !cedulaValida(d.cedula);

  function set<K extends keyof Datos>(campo: K, valor: Datos[K]) {
    setD((prev) => ({ ...prev, [campo]: valor }));
  }

  function onUbicacion(u: UbicacionElegida) {
    setD((prev) => {
      const siguiente = { ...prev, lat: u.lat, lng: u.lng };
      /*
        El mapa rellena, no pisa.

        Si alguien ya escribió su calle a mano, el mapa no se la borra: lo
        que el mapa cree saber es una aproximación, y lo que la persona
        escribió es lo que sabe. Lo mismo con la provincia y el cantón,
        que además tienen que coincidir con la lista.
      */
      if (u.calle && !prev.calle) siguiente.calle = u.calle;
      if (u.provincia && !prev.provincia) {
        const p = PROVINCIAS.find(
          (x) => x.nombre.toLowerCase() === u.provincia!.toLowerCase()
        );
        if (p) {
          siguiente.provincia = p.nombre;
          const c = p.cantones.find(
            (x) => x.toLowerCase() === (u.ciudad ?? "").toLowerCase()
          );
          if (c) siguiente.ciudad = c;
        }
      }
      return siguiente;
    });
  }

  if (!listo) return <Marco><div className="h-64" /></Marco>;

  if (lineas.length === 0) {
    return (
      <Marco>
        <p className="text-tienda-tenue">
          Tu carrito está vacío, así que no hay nada que pedir todavía.
        </p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Ver el catálogo
        </Link>
      </Marco>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!telefonoValido(d.telefono)) {
      setError("Revisa el teléfono: un celular son 10 dígitos, con el 09.");
      return;
    }
    if (d.cedula && !cedulaValida(d.cedula)) {
      setError("Esa cédula no es válida. Revísala o déjala vacía.");
      return;
    }

    startTransition(async () => {
      const r = await crearPedidoWebAction({
        cliente: {
          nombre: d.nombre,
          telefono: d.telefono,
          email: d.email,
          cedula: d.cedula,
        },
        direccion: {
          zonaId,
          provincia: d.provincia,
          ciudad: d.ciudad,
          calle: d.calle,
          referencia: d.referencia,
          lat: d.lat,
          lng: d.lng,
        },
        nota: d.nota,
        // Del carrito solo van el qué y el cuánto. El precio lo pone el
        // servidor.
        lineas: lineas.map((l) => ({
          tipo: l.tipo,
          id: l.id,
          cantidad: l.cantidad,
        })),
      });

      if (!r.ok) {
        setError(r.error);
        return;
      }

      // Se vacía recién con el pedido ya creado. Si se vaciara antes y algo
      // fallara, la persona se queda sin carrito y sin pedido.
      vaciar();
      try {
        localStorage.removeItem(GUARDADO);
      } catch {}
      router.push(`/pedido/${r.token}`);
    });
  }

  return (
    <Marco>
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1.5 py-2 text-sm text-tienda-tenue transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Volver al carrito
      </Link>

      {recuperado && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-tienda-linea bg-tienda-fondo-alt px-4 py-3">
          <p className="text-sm text-tienda-tenue">
            Te llenamos los datos de la vez pasada.
          </p>
          <button
            type="button"
            onClick={() => {
              setD(VACIO);
              setRecuperado(false);
              try {
                localStorage.removeItem(GUARDADO);
              } catch {}
            }}
            className="text-sm underline underline-offset-4"
          >
            Empezar de cero
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-9">
        <Bloque titulo="Tus datos">
          <Campo
            nombre="nombre"
            etiqueta="Nombre y apellido"
            requerido
            autoComplete="name"
            valor={d.nombre}
            onCambio={(v) => set("nombre", v)}
          />
          <Campo
            nombre="telefono"
            etiqueta="Teléfono"
            tipo="tel"
            requerido
            autoComplete="tel"
            inputMode="numeric"
            valor={d.telefono}
            onCambio={(v) => set("telefono", v)}
            ayuda="Para que la transportadora te ubique."
            error={malTelefono ? "Un celular son 10 dígitos: 09XX XXX XXX" : undefined}
          />
          <Campo
            nombre="email"
            etiqueta="Correo"
            tipo="email"
            requerido
            autoComplete="email"
            valor={d.email}
            onCambio={(v) => set("email", v)}
            ayuda="Ahí te mandamos el estado del pedido."
          />
          <Campo
            nombre="cedula"
            etiqueta="Cédula (opcional)"
            autoComplete="off"
            inputMode="numeric"
            valor={d.cedula}
            onCambio={(v) => set("cedula", v.replace(/\D/g, "").slice(0, 10))}
            ayuda="Solo si necesitas factura."
            error={malCedula ? "Esa cédula no pasa la verificación" : undefined}
          />
        </Bloque>

        <Bloque titulo="A dónde lo enviamos">
          <fieldset>
            <legend className="mb-2 text-sm text-tienda-tenue">Zona</legend>
            <div className="space-y-2">
              {zonas.map((z) => (
                <label
                  key={z.id}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                    z.id === zonaId
                      ? "border-tienda-texto bg-tienda-fondo-alt"
                      : "border-tienda-linea hover:bg-tienda-fondo-alt"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="zona"
                      value={z.id}
                      checked={z.id === zonaId}
                      onChange={() => setZonaId(z.id)}
                      className="size-4 accent-tienda-acento"
                    />
                    <span>
                      <span className="block text-sm">{z.nombre}</span>
                      <span className="block text-xs text-tienda-tenue">
                        {z.transportadora}
                      </span>
                    </span>
                  </span>
                  <span className="tabular-nums text-sm">
                    {formatCurrency(z.precio)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/*
            El mapa va antes que los campos: si alguien lo usa, baja con
            media dirección ya escrita. Va cerrado por defecto porque
            arrastra la librería y las imágenes del mapa, y quien sabe su
            dirección de memoria no tiene por qué pagar esa descarga.
          */}
          {!verMapa ? (
            <button
              type="button"
              onClick={() => setVerMapa(true)}
              className="flex w-full items-center gap-3 rounded-lg border border-tienda-linea px-4 py-3 text-left transition-colors hover:bg-tienda-fondo-alt"
            >
              <MapPin className="size-4 shrink-0 text-tienda-tenue" />
              <span>
                <span className="block text-sm">Marcar en el mapa</span>
                <span className="block text-xs text-tienda-tenue">
                  Más fácil que escribir la dirección, y el repartidor te
                  encuentra mejor.
                </span>
              </span>
            </button>
          ) : (
            <MapaDireccion
              onElegir={onUbicacion}
              valorInicial={d.lat && d.lng ? { lat: d.lat, lng: d.lng } : null}
            />
          )}

          {d.lat && d.lng && (
            <p className="flex items-center gap-2 text-xs text-tienda-acento">
              <MapPin className="size-3.5" />
              Punto marcado. El repartidor lo va a ver en su mapa.
            </p>
          )}

          <Lista
            nombre="provincia"
            etiqueta="Provincia"
            valor={d.provincia}
            opciones={PROVINCIAS.map((p) => p.nombre)}
            vacio="Elige tu provincia"
            onCambio={(v) => {
              // Al cambiar de provincia el cantón anterior deja de valer.
              setD((prev) => ({ ...prev, provincia: v, ciudad: "" }));
            }}
          />
          <Lista
            nombre="ciudad"
            etiqueta="Cantón"
            valor={d.ciudad}
            opciones={cantones}
            vacio={
              d.provincia ? "Elige tu cantón" : "Primero elige la provincia"
            }
            deshabilitado={cantones.length === 0}
            onCambio={(v) => set("ciudad", v)}
          />
          <Campo
            nombre="calle"
            etiqueta="Dirección"
            requerido
            autoComplete="street-address"
            valor={d.calle}
            onCambio={(v) => set("calle", v)}
            ayuda="Calle principal, número y calle secundaria."
          />
          <Campo
            nombre="referencia"
            etiqueta="Referencia (opcional)"
            valor={d.referencia}
            onCambio={(v) => set("referencia", v)}
            ayuda="Un punto conocido cerca, color de la casa…"
          />
          <Campo
            nombre="nota"
            etiqueta="Nota para nosotros (opcional)"
            valor={d.nota}
            onCambio={(v) => set("nota", v)}
          />
        </Bloque>

        <Bloque titulo="Total">
          <dl className="space-y-2 text-sm">
            <Fila etiqueta="Productos" valor={formatCurrency(productos)} />
            <Fila etiqueta={`Envío · ${zona.nombre}`} valor={formatCurrency(zona.precio)} />
            <div className="flex justify-between gap-4 border-t border-tienda-linea pt-2 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(total)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-tienda-velo px-4 py-3 text-sm text-tienda-tenue">
            El pago es por <strong className="font-medium">transferencia bancaria</strong>.
            Al confirmar te damos los datos de la cuenta y el número de tu
            pedido. Lo preparamos apenas veamos la transferencia.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {/*
            El aviso va pegado al boton y no escondido en el pie. Es el
            momento en que la persona entrega su direccion y su telefono:
            si va a saber que existe una politica, tiene que ser aqui.
          */}
          <p className="mt-5 text-xs leading-relaxed text-tienda-tenue">
            Al enviar el pedido aceptas las{" "}
            <Link href="/legal/terminos" className="underline underline-offset-2">
              condiciones de compra
            </Link>{" "}
            y que tratemos tus datos para enviarte el pedido, como se explica
            en{" "}
            <Link href="/legal/privacidad" className="underline underline-offset-2">
              tus datos
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={enviando}
            className="mt-3 w-full rounded-full bg-tienda-texto px-5 py-3 text-sm font-medium text-tienda-fondo transition-colors hover:bg-tienda-acento disabled:opacity-60"
          >
            {enviando ? "Creando tu pedido…" : "Confirmar pedido"}
          </button>
        </Bloque>
      </form>
    </Marco>
  );
}

function Campo({
  nombre,
  etiqueta,
  tipo = "text",
  requerido = false,
  ayuda,
  autoComplete,
  inputMode,
  valor,
  onCambio,
  error,
}: {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  requerido?: boolean;
  ayuda?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  valor: string;
  onCambio: (v: string) => void;
  error?: string;
}) {
  const idAyuda = ayuda || error ? `${nombre}-ayuda` : undefined;
  return (
    <div>
      <label htmlFor={nombre} className="block text-sm text-tienda-tenue">
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required={requerido}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        aria-describedby={idAyuda}
        aria-invalid={error ? true : undefined}
        /*
          16 px en el telefono, no 14.

          Safari en iOS hace zoom sobre la pagina entera al enfocar un
          campo con letra menor de 16 px, y despues hay que despinzar a
          mano. En un formulario de nueve campos eso son nueve zooms.
          Desde `sm` vuelve a 14, donde no existe ese comportamiento.
        */
        className={`mt-1.5 w-full rounded-lg border bg-tienda-fondo-alt px-3.5 py-2.5 text-base outline-none transition-colors sm:text-sm ${
          error
            ? "border-red-500/60 focus:border-red-400"
            : "border-tienda-linea focus:border-tienda-texto"
        }`}
      />
      {(error || ayuda) && (
        <p
          id={idAyuda}
          className={`mt-1 text-xs ${error ? "text-red-400" : "text-tienda-tenue"}`}
        >
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}

/**
 * Un desplegable.
 *
 * Nativo y no una lista hecha a mano: el selector del sistema en Android y
 * en iPhone es una rueda a pantalla completa, con búsqueda por letra, que
 * ninguna imitación en HTML iguala. Y con 24 provincias o 25 cantones, esa
 * diferencia es la mitad del tiempo de llenado.
 */
function Lista({
  nombre,
  etiqueta,
  valor,
  opciones,
  vacio,
  deshabilitado = false,
  onCambio,
}: {
  nombre: string;
  etiqueta: string;
  valor: string;
  opciones: string[];
  vacio: string;
  deshabilitado?: boolean;
  onCambio: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={nombre} className="block text-sm text-tienda-tenue">
        {etiqueta}
      </label>
      <select
        id={nombre}
        name={nombre}
        required
        value={valor}
        disabled={deshabilitado}
        onChange={(e) => onCambio(e.target.value)}
        className="mt-1.5 w-full appearance-none rounded-lg border border-tienda-linea bg-tienda-fondo-alt px-3.5 py-2.5 text-base outline-none transition-colors focus:border-tienda-texto disabled:opacity-50 sm:text-sm"
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tienda-tenue">{etiqueta}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-tienda-tenue">
        {titulo}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-tight">Tu pedido</h1>
      {children}
    </div>
  );
}

"use client";

import { aplicarPunto } from "@/lib/ubicacion-a-direccion";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useCarrito, subtotal } from "@/lib/carrito";
import { formatCurrency } from "@/lib/format";
import {
  PROVINCIAS,
  cantonEntre,
  cantonesDe,
  cedulaValida,
  telefonoValido,
} from "@/lib/ecuador";
import {
  MapaDireccion,
  type UbicacionElegida,
} from "@/components/tienda/mapa-direccion";
import { zonaParaCanton } from "@/lib/tienda";
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
  /** Los cantones que cubre. Vacío = «el resto del país». */
  cantones: string[];
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
  /** Lo saca el mapa; nunca se le pide a quien compra. */
  postal: string;
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
  /*
    El código postal no se le pide a nadie: lo saca el mapa.

    Aquí casi nadie se lo sabe, así que un campo más sería un campo vacío
    más — y en un checkout cada campo de más es una venta menos. Si se
    marca el punto, viene solo; si no, se va sin él y no pasa nada.
  */
  postal: "",
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

  /*
    La zona ya no se elige: se deduce del cantón.

    Antes eran dos preguntas independientes y se podía marcar «Fuera de
    Quito» con una dirección en Quito. No hacía falta mala intención —
    venía una zona marcada por defecto, así que pasaba solo con no
    fijarse—, y el pedido salía con el envío mal cobrado.

    Quien elige «Manta» ya dijo que es fuera de Quito. Preguntarlo otra
    vez solo abre la puerta a que las dos respuestas no coincidan.
  */
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
  /*
    La última calle que escribió el mapa.

    Hace falta para distinguir «esto lo puso el mapa» de «esto lo escribió
    la persona», y son dos cosas con derechos distintos: lo del mapa se
    puede reemplazar al mover el punto, lo escrito a mano no.
  */
  const [calleDelMapa, setCalleDelMapa] = useState<string | null>(null);
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

  const zona = zonaParaCanton(zonas, d.ciudad) ?? zonas[0];
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
    /*
      La decisión de qué se pisa y qué se respeta vive en
      `ubicacion-a-direccion.ts`, compartida con el pedido cargado a mano.

      Estaba escrita aquí, y al poner el mapa en el panel se copió solo la
      parte de las coordenadas: allá el mapa guardaba el punto y dejaba la
      provincia y la ciudad como estaban. En un sitio solo no puede volver
      a pasar.
    */
    setD((prev) => {
      const r = aplicarPunto(
        u,
        {
          calle: prev.calle,
          provincia: prev.provincia,
          ciudad: prev.ciudad,
          postal: prev.postal,
          lat: prev.lat,
          lng: prev.lng,
        },
        calleDelMapa
      );
      setCalleDelMapa(r.calleDelMapa);
      return { ...prev, ...r.direccion };
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
          zonaId: zona.id,
          provincia: d.provincia,
          ciudad: d.ciudad,
          calle: d.calle,
          referencia: d.referencia,
          postal: d.postal,
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
          {/*
            De a dos en pantalla ancha. Nueve campos en una sola columna
            hacen una página larguísima en la que no se ve dónde termina;
            emparejados, el formulario entra casi de una vez y se percibe
            corto. En el teléfono siguen uno debajo de otro, que es lo
            único que cabe.
          */}
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </Bloque>

        <Bloque titulo="A dónde lo enviamos">
          {/*
            La zona salió de elegir, y ahora solo se informa. Sigue
            visible porque el precio del envío cambia el total y eso no
            puede aparecer de sorpresa al final.
          */}
          {d.ciudad ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-tienda-linea bg-tienda-fondo-alt px-4 py-3">
              <span>
                <span className="block text-sm">Envío · {zona.nombre}</span>
                <span className="block text-xs text-tienda-tenue">
                  {zona.transportadora} · según el cantón que elegiste
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-sm">
                {formatCurrency(zona.precio)}
              </span>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-tienda-linea px-4 py-3 text-sm text-tienda-tenue">
              Elige provincia y cantón abajo y calculamos el envío.
            </p>
          )}

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

          <div className="grid gap-4 sm:grid-cols-2">
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
          <div>
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
            {/*
              El mapa marcó un punto pero no supo el cantón.

              Pasa de verdad: para un punto en Sangolquí, el mapa devuelve
              «Sangolquí» —que es la ciudad— y no «Rumiñahui», que es el
              cantón. En Quito sí lo dice, porque lo llama «Distrito
              Metropolitano de Quito».

              Y el cantón es justo lo que decide el precio del envío, así
              que dejarlo vacío en silencio hace que el total no aparezca y
              nadie sepa por qué.
            */}
            {d.lat != null && d.provincia && !d.ciudad && (
              <p className="mt-1.5 text-xs text-tienda-acento">
                El mapa no supo el cantón de ese punto. Elígelo tú y
                calculamos el envío.
              </p>
            )}
          </div>
          </div>
          <Campo
            nombre="calle"
            etiqueta="Dirección"
            requerido
            autoComplete="street-address"
            valor={d.calle}
            onCambio={(v) => {
              set("calle", v);
              // Desde que alguien la toca, la calle es suya y el mapa ya
              // no puede reemplazarla.
              setCalleDelMapa(null);
            }}
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
    /*
      Más ancho que el `max-w-xl` de antes. Con el mapa dentro, 576 px
      dejaban un cuadrado pequeño en el que costaba apuntar; y en un
      portátil sobraba pantalla a los dos lados mientras el formulario
      hacía una columna angosta y larguísima.
    */
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="mb-8 text-2xl font-medium tracking-tight">Tu pedido</h1>
      {children}
    </div>
  );
}

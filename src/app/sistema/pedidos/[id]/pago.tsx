"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Paperclip,
  Pencil,
  Loader2,
  MessageCircle,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { estadoDePago } from "@/lib/pago-del-pedido";
import {
  buildSaldoMessage,
  normalizePhoneForWhatsApp,
  pickWhatsAppPhone,
  type ShareableOrder,
} from "@/lib/share-message";
import {
  confirmarComprobanteAction,
  descartarComprobanteAction,
  reabrirComprobanteAction,
  subirComprobanteEnPanelAction,
  borrarComprobanteAction,
} from "./revisar-comprobante";
import { LeerQrDelComprobante } from "./leer-qr-comprobante";

export type ComprobanteEnPanel = {
  id: string;
  tipo: string;
  createdAt: Date;
  montoLeido: number | null;
  numeroLeido: string | null;
  fechaLeida: string | null;
  bancoLeido: string | null;
  leidoEn: Date | null;
  aceptado: boolean | null;
  montoConfirmado: number | null;
  numeroConfirmado: string | null;
  fechaConfirmada: string | null;
  bancoConfirmado: string | null;
  revisadoPor: string | null;
};

/** Lo que el OCR sacó de la imagen. Llega por la ruta de lectura. */
export type Lectura = {
  monto: number | null;
  numero: string | null;
  fecha: string | null;
  banco: string | null;
};

export type Repetido = {
  numero: string;
  orderId: string;
  orderNumber: string;
};

/**
 * El pago del pedido: cuánto entró, cuánto falta, y qué dice cada
 * comprobante.
 *
 * ── La distinción que sostiene toda la pantalla ──
 *
 * Lo que leyó la máquina y lo que confirmó una persona no se mezclan
 * nunca, ni siquiera visualmente. La lectura sale en gris y con la
 * fórmula «el comprobante dice»; lo confirmado sale en negro y suma.
 *
 * Si se mostraran igual, al día siguiente nadie sabría cuál de las dos
 * cifras alguien llegó a comprobar contra el banco — y ese es justo el
 * dato que importa cuando un cliente reclama.
 *
 * ── Por qué un pago incompleto no es una alarma ──
 *
 * Aquí se abona: la mitad hoy, la otra mitad el viernes; o dos
 * transferencias porque una cuenta tiene límite diario. Eso es una venta
 * normal. Lo que hace falta no es un aviso rojo sino un número: cuánto
 * falta. Se pone en grande, y ya.
 */
export function Pago({
  orderId,
  total,
  comprobantes,
  repetidos,
  estadoPedido,
  pedido,
  telefono,
  telefonoContacto,
}: {
  orderId: string;
  total: number;
  comprobantes: ComprobanteEnPanel[];
  repetidos: Repetido[];
  estadoPedido: string;
  /** Para poder armar el mensaje de lo que falta sin volver al servidor. */
  pedido: ShareableOrder;
  telefono: string | null;
  telefonoContacto: string | null;
}) {
  const pago = estadoDePago(comprobantes, total);

  /*
    En un pedido cancelado no hay nada que cobrar, así que la tarjeta
    sobra — salvo que ya tenga comprobantes, y entonces sigue siendo
    historia que hace falta poder consultar.
  */
  if (!pago.hayComprobantes && estadoPedido === "CANCELLED") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="size-4" />
          Pago
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/*
          Sin comprobantes no se despliega la aritmética.

          «Confirmado $0,00 · Falta $26,50» sobre un pedido que se pagó en
          efectivo no informa de nada: repite el total y llama «falta» a
          algo que no falta. Y esos son casi todos los pedidos cargados a
          mano. Aquí basta con decir de cuánto es y ofrecer dónde guardar
          la captura si llega.
        */}
        {!pago.hayComprobantes ? (
          <p className="text-sm text-muted-foreground">
            Sin comprobantes. El pedido es de{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(total)}
            </span>
            .
          </p>
        ) : (
          <div className="space-y-1.5 text-sm">
            <Linea label="Total del pedido" valor={total} />
            <Linea label="Confirmado" valor={pago.confirmado} />

            {pago.falta > 0 &&
              (estadoPedido === "PENDING" ? (
                <div className="flex items-baseline justify-between gap-3 border-t pt-1.5">
                  <span className="font-medium">Falta</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatCurrency(pago.falta)}
                  </span>
                </div>
              ) : (
                /*
                El pedido ya se dio por pagado y los comprobantes no llegan
                al total. No es un error: el dinero pudo entrar en efectivo
                o por una transferencia sin captura.

                Pero queda escrito, y en gris. Dentro de tres meses, si
                alguien viene a preguntar por qué este pedido cuadra en la
                caja y no en los comprobantes, la respuesta está aquí en
                vez de en la memoria de nadie.
              */
                <p className="border-t pt-1.5 text-xs text-muted-foreground">
                  Marcado como pagado con {formatCurrency(pago.falta)} sin
                  respaldar por comprobantes. Si entró en efectivo o por una
                  transferencia sin captura, está bien.
                </p>
              ))}

            {pago.cuadra && pago.sobra === 0 && (
              <p className="flex items-start gap-1.5 rounded bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                <Check className="mt-px size-3.5 shrink-0" />
                <span>
                  Cuadra con el total.
                  {estadoPedido === "PENDING" &&
                    " Ya puedes marcar el pedido como pagado, aquí arriba."}
                </span>
              </p>
            )}

            {/*
            De más sí es raro, y por eso sí avisa. Casi siempre es un
            comprobante de otro pedido metido en este, o el mismo subido
            dos veces y aceptado dos veces.
          */}
            {pago.sobra > 0 && (
              <p className="flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                <span>
                  Hay {formatCurrency(pago.sobra)} de más. Suele ser un
                  comprobante que pertenece a otro pedido.
                </span>
              </p>
            )}
          </div>
        )}

        {/*
          Lo que dicen los que faltan por mirar, aparte y en gris. Orienta
          —«con esto se cubre»— sin colarse en la cuenta de arriba.
        */}
        {pago.porRevisar > 0 && (
          <p className="rounded-md border border-dashed px-2.5 py-2 text-xs text-muted-foreground">
            {pago.porRevisar === 1
              ? "Queda 1 comprobante por revisar"
              : `Quedan ${pago.porRevisar} comprobantes por revisar`}
            {pago.dicenPorRevisar > 0 && (
              <>
                . Dicen {formatCurrency(pago.dicenPorRevisar)} entre todos, pero
                eso lo leyó la máquina y no cuenta hasta que lo confirmes
              </>
            )}
            .
          </p>
        )}

        {/*
          Pedir lo que falta, con la cifra ya escrita.

          Sale solo cuando alguien confirmó una parte y queda saldo: es el
          único momento en que este mensaje tiene sentido. Con el pedido
          sin pagar del todo el mensaje correcto es otro —el de «recibimos
          tu pedido»— y ese ya está en el selector de estado.

          El número va en el mensaje y no lo calcula quien escribe: restar
          de cabeza delante del teléfono es donde se pide de más o de
          menos, y pedir de menos deja una venta a medias que nadie
          reclama.
        */}
        {estadoPedido === "PENDING" &&
          pago.confirmado > 0 &&
          pago.falta > 0 && (
            <PedirElResto
              pedido={pedido}
              confirmado={pago.confirmado}
              falta={pago.falta}
              telefono={telefono}
              telefonoContacto={telefonoContacto}
            />
          )}

        {comprobantes.length > 0 && (
          <ul className="space-y-4">
            {comprobantes.map((c) => (
              <li key={c.id}>
                <Comprobante
                  comprobante={c}
                  falta={pago.falta}
                  repetidos={repetidos.filter((r) => {
                    const suyo = c.numeroConfirmado ?? c.numeroLeido;
                    return suyo !== null && r.numero === suyo;
                  })}
                />
              </li>
            ))}
          </ul>
        )}

        <Subir orderId={orderId} hayAlguno={comprobantes.length > 0} />
      </CardContent>
    </Card>
  );
}

/*
  Cada cuánto se pregunta si ya terminó de leerse, y hasta cuándo.

  Dos segundos: el OCR tarda entre cinco y quince en esta máquina, así
  que son unas pocas preguntas y ninguna espera perceptible de más.

  Dos minutos de tope: si a los dos minutos no ha terminado, es que se
  cayó o que el servidor está ahogado. Preguntar para siempre dejaría una
  pestaña abierta golpeando al servidor toda la tarde, y una imagen
  borrosa que no se aclara nunca.
*/
const CADA = 2000;
const HASTA = 120000;

/**
 * Esperar a que el OCR termine, sin recargar la página.
 *
 * El OCR corre después de responder a la subida —si no, habría que
 * esperar quince segundos mirando una pantalla muerta— y escribe el
 * resultado en la base. Alguien tiene que ir a mirar si ya está, y ese
 * alguien no puede ser la persona recargando a ver si hay suerte.
 *
 * Devuelve `null` mientras espera. Si se rinde, `{ fallo: true }`, para
 * poder decirlo en vez de dejar una rueda girando sin fin.
 */
function useLectura(
  id: string,
  hayQueEsperar: boolean,
  alLlegar: () => void,
) {
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [seRindio, setSeRindio] = useState(false);

  const esperando = hayQueEsperar && !lectura && !seRindio;

  useEffect(() => {
    if (!esperando) return;

    let vivo = true;
    const desde = Date.now();

    const reloj = setInterval(async () => {
      if (!vivo) return;

      if (Date.now() - desde > HASTA) {
        clearInterval(reloj);
        setSeRindio(true);
        return;
      }

      try {
        const r = await fetch(`/api/comprobante/${id}/lectura`, {
          cache: "no-store",
        });
        if (!r.ok || !vivo) return;
        const d = (await r.json()) as Lectura & { leido: boolean };
        if (d.leido && vivo) {
          clearInterval(reloj);
          setLectura({
            monto: d.monto,
            numero: d.numero,
            fecha: d.fecha,
            banco: d.banco,
          });
          /*
            Y se refresca la página desde el servidor.

            No es por los campos —esos ya se rellenaron solos— sino por lo
            que el servidor calcula con el número recién leído: si esa
            misma captura se usó en otro pedido. Esa comprobación es la
            que pilla la estafa más común, y sin este refresco no
            aparecería hasta que alguien recargara.
          */
          alLlegar();
        }
      } catch {
        // Un fallo de red suelto no cuenta: se vuelve a preguntar en dos
        // segundos. Solo el tope de tiempo decide rendirse.
      }
    }, CADA);

    /*
      Al desmontar se para. Sin esto, cada comprobante dejaría un reloj
      corriendo detrás cada vez que la página se vuelve a renderizar —y
      esta página se renderiza en cada confirmación.
    */
    return () => {
      vivo = false;
      clearInterval(reloj);
    };
    // `alLlegar` a propósito fuera: es una función nueva en cada render y
    // meterla aquí reiniciaría el reloj constantemente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esperando, id]);

  return { lectura, esperando, seRindio };
}

function Linea({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{formatCurrency(valor)}</span>
    </div>
  );
}

function Comprobante({
  comprobante: c,
  falta,
  repetidos,
}: {
  comprobante: ComprobanteEnPanel;
  falta: number;
  repetidos: Repetido[];
}) {
  const router = useRouter();
  const [revisando, setRevisando] = useState(false);
  const [trabajando, empezar] = useTransition();
  /*
    El número que sacó el QR, si se llegó a leer.

    Vive aquí y no dentro del formulario porque quien lo lee es el botón
    del pie, que está fuera. Pesa más que lo que leyó el OCR —un QR no
    adivina— pero menos que lo que teclee una persona.
  */
  const [numeroDelQr, setNumeroDelQr] = useState<string | null>(null);

  /*
    Los PDF no se leen —Tesseract lee imágenes— y uno ya leído no se
    vuelve a leer. En los dos casos no hay nada que esperar.
  */
  const { lectura, esperando, seRindio } = useLectura(
    c.id,
    !c.leidoEn && c.tipo !== "application/pdf",
    () => router.refresh(),
  );

  const sinRevisar = c.aceptado === null;
  const abierto = sinRevisar || revisando;

  return (
    <div className="rounded-md border bg-muted/40 p-2.5 space-y-2">
      {/*
        La imagen primero y a tamaño mirable, no detrás de un enlace.

        Quien está en esta pantalla compara una cifra con el banco abierto
        en otra pestaña. Obligarla a abrir una tercera, mirar, volver y
        acordarse del número es pedirle que haga de memoria lo único que
        importa aquí.
      */}
      <div className="relative">
        <a
          href={`/api/comprobante/${c.id}`}
          target="_blank"
          rel="noreferrer"
          className="block group"
          title="Abrir en tamaño completo"
        >
          {c.tipo === "application/pdf" ? (
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-4 text-sm group-hover:border-primary/50">
              <Paperclip className="size-4 text-muted-foreground" />
              Comprobante en PDF · tócalo para abrirlo
            </div>
          ) : (
            /*
              Con <img> y no con next/image: el optimizador pediría la
              imagen desde el servidor, sin la cookie de sesión, y la ruta
              le respondería 404. Aquí la pide el navegador, que sí la lleva.
            */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/comprobante/${c.id}`}
              alt="Comprobante de pago"
              /*
                Difuminada mientras se lee, y se aclara sola al terminar.

                Antes esto era un «· leyendo…» de ocho píxeles al pie. Era
                cierto y no servía de nada: no se veía, no parecía que
                algo estuviera pasando, y sobre todo no se entendía que
                iba a aparecer información sin hacer nada.

                Una imagen borrosa que se aclara dice las dos cosas sin
                una palabra: hay algo en marcha, y va a terminar.
              */
              className={`w-full rounded-md border bg-white object-contain transition-[filter,opacity] duration-500 group-hover:border-primary/50 ${
                esperando ? "opacity-60 blur-[3px]" : ""
              }`}
              style={{ maxHeight: 420 }}
            />
          )}
        </a>

        {esperando && (
          /*
            Encima de la imagen y no debajo: es donde está mirando quien
            acaba de subirla. `pointer-events-none` para no robarle el
            clic al enlace de abrir en grande.
          */
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Leyendo el comprobante…
            </span>
          </div>
        )}
      </div>

      {repetidos.map((r) => (
        <Link
          key={r.orderId}
          href={`/sistema/pedidos/${r.orderId}`}
          className="flex items-start gap-1.5 rounded bg-red-50 px-2 py-1.5 text-xs text-red-900 hover:underline dark:bg-red-950/50 dark:text-red-200"
        >
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          <span>Este mismo número ya se usó en {r.orderNumber}</span>
        </Link>
      ))}

      {abierto ? (
        <FormularioDeRevision
          comprobante={c}
          numeroDelQr={numeroDelQr}
          lectura={lectura}
          esperando={esperando}
          seRindio={seRindio}
          falta={falta}
          trabajando={trabajando}
          onCancelar={revisando ? () => setRevisando(false) : null}
          onConfirmar={(datos) =>
            empezar(async () => {
              const r = await confirmarComprobanteAction(c.id, datos);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success("Confirmado");
              setRevisando(false);
              router.refresh();
            })
          }
          onDescartar={() =>
            empezar(async () => {
              const r = await descartarComprobanteAction(c.id);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success("Marcado como que no cuenta");
              setRevisando(false);
              router.refresh();
            })
          }
        />
      ) : c.aceptado ? (
        <div className="space-y-1 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="size-3.5" />
            Cuenta {formatCurrency(c.montoConfirmado ?? 0)}
          </p>
          <Detalles
            banco={c.bancoConfirmado}
            numero={c.numeroConfirmado}
            fecha={c.fechaConfirmada}
          />
          {c.revisadoPor && (
            <p className="text-muted-foreground">
              Revisado por {c.revisadoPor}
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setRevisando(true)}
          >
            <Pencil className="size-3" /> Cambiar
          </Button>
        </div>
      ) : (
        <div className="space-y-1 text-xs">
          <p className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <X className="size-3.5" />
            No cuenta
            {c.revisadoPor && ` · ${c.revisadoPor}`}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={trabajando}
            onClick={() =>
              empezar(async () => {
                await reabrirComprobanteAction(c.id);
                router.refresh();
              })
            }
          >
            <RotateCcw className="size-3" /> Volver a revisarlo
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-2xs text-muted-foreground">
          Subido el {formatDateTime(c.createdAt)}
        </p>

        <div className="ml-auto flex items-center gap-1">
          {/*
            Leer el QR solo tiene sentido en una imagen. Un PDF no se
            puede decodificar en el navegador sin traerse un lector
            entero, y los PDF son la minoría.
          */}
          {c.tipo !== "application/pdf" && (
            <LeerQrDelComprobante
              src={`/api/comprobante/${c.id}`}
              onNumero={setNumeroDelQr}
            />
          )}

          {/*
            Borrar no es lo mismo que «No cuenta».

            «No cuenta» aparta el comprobante y guarda la imagen a
            propósito. Borrar es para lo que no debería estar: la foto
            que se subió al pedido equivocado, la que se coló de la
            galería. Por eso pide confirmación — es lo único de esta
            pantalla que no tiene vuelta atrás.
          */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            disabled={trabajando}
            onClick={() => {
              if (
                !confirm(
                  "¿Borrar este comprobante? Se elimina también la imagen, y eso no se puede deshacer."
                )
              ) {
                return;
              }
              empezar(async () => {
                const r = await borrarComprobanteAction(c.id);
                if (!r.ok) {
                  toast.error(r.error);
                  return;
                }
                toast.success("Comprobante borrado");
                router.refresh();
              });
            }}
          >
            <Trash2 className="size-3.5" /> Borrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Detalles({
  banco,
  numero,
  fecha,
}: {
  banco: string | null;
  numero: string | null;
  fecha: string | null;
}) {
  if (!banco && !numero && !fecha) return null;
  return (
    <p className="text-muted-foreground">
      {banco}
      {banco && (numero || fecha) && " · "}
      {numero && <span className="font-mono">nº {numero}</span>}
      {numero && fecha && " · "}
      {fecha}
    </p>
  );
}

/**
 * El formulario de revisión, ya relleno con lo que leyó la máquina.
 *
 * Viene relleno porque el trabajo aquí es COMPARAR, no transcribir: se
 * mira la imagen de arriba, se ve que las cifras coinciden, y se
 * confirma. Cuando el OCR se equivoca —que pasa— se corrige el campo, que
 * es más rápido que escribir los cuatro.
 *
 * Lo que se escriba aquí no pisa la lectura: se guarda al lado. La
 * lectura original se conserva para poder entender después por qué se
 * leyó mal.
 */
function FormularioDeRevision({
  comprobante: c,
  numeroDelQr,
  lectura,
  esperando,
  seRindio,
  falta,
  trabajando,
  onConfirmar,
  onDescartar,
  onCancelar,
}: {
  comprobante: ComprobanteEnPanel;
  /** El número que sacó el QR del propio comprobante, si se leyó. */
  numeroDelQr: string | null;
  /** La lectura que llegó sola, si llegó. */
  lectura: Lectura | null;
  esperando: boolean;
  seRindio: boolean;
  falta: number;
  trabajando: boolean;
  onConfirmar: (d: {
    monto: string;
    numero: string;
    fecha: string;
    banco: string;
  }) => void;
  onDescartar: () => void;
  onCancelar: (() => void) | null;
}) {
  /*
    Solo se guarda lo que se ha TECLEADO. El resto se deriva.

    Es lo que permite que la lectura entre sola sin pisar a nadie: cuando
    llega, los campos que nadie tocó la muestran, y el que se estaba
    escribiendo se queda como estaba. Con un estado por campo inicializado
    al montar habría que ir escribiendo encima al llegar la lectura, y
    entonces habría que decidir a mano cuáles pisar — que es la clase de
    decisión que se equivoca justo mientras alguien escribe.
  */
  const [tecleado, setTecleado] = useState<
    Record<string, string | undefined>
  >({});

  const leido = lectura ?? {
    monto: c.montoLeido,
    numero: c.numeroLeido,
    fecha: c.fechaLeida,
    banco: c.bancoLeido,
  };

  const monto =
    tecleado.monto ??
    (c.montoConfirmado != null
      ? String(c.montoConfirmado)
      : leido.monto != null
        ? String(leido.monto)
        : "");
  /*
    El orden de preferencia dice cuánto se fía uno de cada fuente: lo
    tecleado gana siempre, después el QR —que no adivina, o lo lee entero
    o no lo lee— y al final lo que creyó ver el OCR.
  */
  const numero =
    tecleado.numero ?? numeroDelQr ?? c.numeroConfirmado ?? leido.numero ?? "";
  const fecha = tecleado.fecha ?? c.fechaConfirmada ?? leido.fecha ?? "";
  const banco = tecleado.banco ?? c.bancoConfirmado ?? leido.banco ?? "";

  const escribir = (campo: string) => (v: string) =>
    setTecleado((t) => ({ ...t, [campo]: v }));

  const leyoAlgo = leido.monto != null || leido.numero || leido.banco;

  /*
    Qué pasaría con lo que falta si se confirma este monto.

    Es la frase que evita la llamada: sin ella, quien revisa un abono de
    $12 sobre un pedido de $25,50 ve un número que «no cuadra» y tiene
    que restar de cabeza para saber si eso está bien o mal.
  */
  const escrito = Number(monto.replace(",", "."));
  const quedaria =
    Number.isFinite(escrito) && escrito > 0
      ? Math.round((falta - escrito) * 100) / 100
      : null;

  return (
    <div className="space-y-2 rounded-md border bg-background p-2.5">
      {/*
        El encabezado dice en qué punto va, y siempre deja escribir.

        Ni siquiera mientras lee se bloquean los campos: quien acaba de
        mirar la captura en WhatsApp sabe el monto de memoria y no tiene
        por qué esperar a una máquina. Lo que escriba gana.
      */}
      <p className="flex items-center gap-1.5 text-2xs uppercase tracking-wide text-muted-foreground">
        {esperando ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Leyendo la imagen — o escríbelo tú, si lo sabes
          </>
        ) : leyoAlgo ? (
          "El comprobante dice — compáralo con la imagen"
        ) : seRindio ? (
          "La lectura tardó demasiado. Escríbelo mirando la imagen"
        ) : c.leidoEn || lectura ? (
          "No se pudo leer nada. Escríbelo mirando la imagen"
        ) : (
          "Escríbelo mirando la imagen"
        )}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Campo
          etiqueta="Monto"
          valor={monto}
          onChange={escribir("monto")}
          inputMode="decimal"
        />
        <Campo etiqueta="Banco" valor={banco} onChange={escribir("banco")} />
        <Campo
          etiqueta="Nº de comprobante"
          valor={numero}
          onChange={escribir("numero")}
        />
        <Campo etiqueta="Fecha" valor={fecha} onChange={escribir("fecha")} />
      </div>

      {quedaria !== null && quedaria > 0.009 && (
        <p className="text-2xs text-muted-foreground">
          Con esto seguirían faltando{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(quedaria)}
          </span>
          . Es un abono, no un error: puede mandar otro comprobante por el
          resto.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-0.5">
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={trabajando}
          onClick={() => onConfirmar({ monto, numero, fecha, banco })}
        >
          <Check className="size-3.5" /> Confirmar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={trabajando}
          onClick={onDescartar}
          title="Era de otro pedido, o no es una transferencia"
        >
          <X className="size-3.5" /> No cuenta
        </Button>
        {onCancelar && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  inputMode,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  inputMode?: "decimal";
}) {
  return (
    <label className="block space-y-1">
      <span className="text-2xs text-muted-foreground">{etiqueta}</span>
      <Input
        value={valor}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </label>
  );
}

/**
 * Adjuntar un comprobante desde el panel.
 *
 * ── Por qué hace falta aquí ──
 *
 * La mayoría manda la captura por WhatsApp, no la sube a su página. Y un
 * pedido cargado a mano ni siquiera tiene página. Hasta ahora esa imagen
 * se quedaba en la conversación, que es donde las cosas se pierden: a la
 * semana nadie encuentra de qué pedido era.
 *
 * Guardada aquí queda pegada al pedido, se lee sola, y entra en la
 * comprobación de comprobantes repetidos — que es lo que pilla la misma
 * captura mandada a dos pedidos distintos.
 */
function Subir({
  orderId,
  hayAlguno,
}: {
  orderId: string;
  hayAlguno: boolean;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, empezar] = useTransition();

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const fd = new FormData();
    fd.set("comprobante", archivo);

    empezar(async () => {
      const r = await subirComprobanteEnPanelAction(orderId, fd);
      /*
        Se limpia siempre. Si falló hay que poder elegir el mismo archivo
        otra vez, y el navegador no dispara `change` cuando el valor no
        cambia — así que sin esto el segundo intento no haría nada.
      */
      if (entrada.current) entrada.current.value = "";
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Comprobante guardado", {
        description: "Se está leyendo. Recarga en unos segundos.",
      });
      router.refresh();
    });
  }

  return (
    <div>
      {/*
        El `label` es el botón y el `input` va escondido: a un campo de
        archivo no se le puede dar forma, y el de fábrica desentona con
        todo lo demás.
      */}
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground ${
          subiendo ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Upload className="size-3.5" />
        {subiendo
          ? "Subiendo…"
          : hayAlguno
            ? "Adjuntar otro comprobante"
            : "Adjuntar el comprobante que te mandaron"}
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          onChange={onArchivo}
          disabled={subiendo}
          className="sr-only"
        />
      </label>
    </div>
  );
}

/**
 * El botón para pedir por WhatsApp lo que falta de un pago a medias.
 *
 * Abre WhatsApp con el mensaje escrito, igual que el resto de avisos al
 * cliente: no se manda solo. Un mensaje que sale sin que nadie lo lea es
 * un mensaje que tarde o temprano sale en mal momento — justo después de
 * que la clienta avisó por otro lado de que ya transfirió, por ejemplo.
 */
function PedirElResto({
  pedido,
  confirmado,
  falta,
  telefono,
  telefonoContacto,
}: {
  pedido: ShareableOrder;
  confirmado: number;
  falta: number;
  telefono: string | null;
  telefonoContacto: string | null;
}) {
  const mensaje = buildSaldoMessage(pedido, { confirmado, falta });
  const numero = normalizePhoneForWhatsApp(
    pickWhatsAppPhone(telefonoContacto, telefono)
  );
  const url = numero
    ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  return (
    <Button asChild variant="outline" className="w-full">
      <a href={url} target="_blank" rel="noreferrer">
        <MessageCircle className="size-4" />
        Pedirle los {formatCurrency(falta)} que faltan
      </a>
    </Button>
  );
}

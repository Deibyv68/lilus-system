"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Paperclip,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { estadoDePago } from "@/lib/pago-del-pedido";
import {
  confirmarComprobanteAction,
  descartarComprobanteAction,
  reabrirComprobanteAction,
} from "./revisar-comprobante";

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
  total,
  comprobantes,
  repetidos,
  estadoPedido,
}: {
  total: number;
  comprobantes: ComprobanteEnPanel[];
  repetidos: Repetido[];
  estadoPedido: string;
}) {
  const pago = estadoDePago(comprobantes, total);

  if (!pago.hayComprobantes) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="size-4" />
          Pago
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5 text-sm">
          <Linea label="Total del pedido" valor={total} />
          <Linea label="Confirmado" valor={pago.confirmado} />

          {pago.falta > 0 && (
            <div className="flex items-baseline justify-between gap-3 border-t pt-1.5">
              <span className="font-medium">Falta</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(pago.falta)}
              </span>
            </div>
          )}

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
      </CardContent>
    </Card>
  );
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
            className="w-full rounded-md border bg-white object-contain group-hover:border-primary/50"
            style={{ maxHeight: 420 }}
          />
        )}
      </a>

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
            <p className="text-muted-foreground">Revisado por {c.revisadoPor}</p>
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

      <p className="text-2xs text-muted-foreground">
        Subido el {formatDateTime(c.createdAt)}
        {!c.leidoEn && c.tipo !== "application/pdf" && (
          <span className="ml-1 opacity-70">· leyendo…</span>
        )}
      </p>
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
  falta,
  trabajando,
  onConfirmar,
  onDescartar,
  onCancelar,
}: {
  comprobante: ComprobanteEnPanel;
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
  const [monto, setMonto] = useState(
    c.montoConfirmado != null
      ? String(c.montoConfirmado)
      : c.montoLeido != null
        ? String(c.montoLeido)
        : ""
  );
  const [numero, setNumero] = useState(
    c.numeroConfirmado ?? c.numeroLeido ?? ""
  );
  const [fecha, setFecha] = useState(c.fechaConfirmada ?? c.fechaLeida ?? "");
  const [banco, setBanco] = useState(c.bancoConfirmado ?? c.bancoLeido ?? "");

  const leyoAlgo = c.montoLeido != null || c.numeroLeido || c.bancoLeido;

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
      <p className="text-2xs uppercase tracking-wide text-muted-foreground">
        {leyoAlgo
          ? "El comprobante dice — compáralo con la imagen"
          : c.leidoEn
            ? "No se pudo leer nada. Escríbelo mirando la imagen"
            : "Escríbelo mirando la imagen"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Campo
          etiqueta="Monto"
          valor={monto}
          onChange={setMonto}
          inputMode="decimal"
        />
        <Campo etiqueta="Banco" valor={banco} onChange={setBanco} />
        <Campo etiqueta="Nº de comprobante" valor={numero} onChange={setNumero} />
        <Campo etiqueta="Fecha" valor={fecha} onChange={setFecha} />
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

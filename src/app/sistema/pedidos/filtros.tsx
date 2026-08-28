"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { etiquetaDeEstado, ESTADOS } from "@/lib/estados-pedido";
import {
  ATAJOS,
  AVANZADO_VACIO,
  ETIQUETA_ATAJO,
  ETIQUETA_COBRO,
  SIN_ORIGEN,
  criteriosPuestos,
  type Atajo,
  type Avanzado,
  type EstadoDeCobro,
} from "@/lib/filtrar-pedidos";

const COBROS: EstadoDeCobro[] = ["sin", "revisar", "parcial", "completo"];

/**
 * La barra de filtros de la lista de pedidos.
 *
 * ── Dos velocidades ──
 *
 * Arriba, los atajos: un toque, y responden «¿qué tengo que hacer hoy?».
 * Es para lo que se abre esta pantalla casi siempre.
 *
 * Detrás del botón, el panel avanzado: buscar por nombre o teléfono,
 * cruzar estado con origen, acotar fechas y montos. Son preguntas raras
 * pero concretas —cuánto vendió Instagram en julio, qué pedidos de más de
 * $50 siguen sin cobrar— y hasta ahora no tenían respuesta.
 *
 * Va plegado porque si estuviera siempre abierto, ocho campos empujarían
 * la lista fuera de la pantalla en el teléfono, que es donde más se usa.
 * Cuando hay algo puesto el botón lo dice con un número, para que nunca
 * se esté mirando una lista recortada sin saberlo.
 */
export function Filtros({
  atajo,
  onAtajo,
  cuentas,
  avanzado,
  onAvanzado,
  origenes,
  transportadoras,
  visibles,
  total,
}: {
  atajo: Atajo;
  onAtajo: (a: Atajo) => void;
  cuentas: Record<Atajo, number>;
  avanzado: Avanzado;
  onAvanzado: (f: Avanzado) => void;
  origenes: string[];
  transportadoras: string[];
  visibles: number;
  total: number;
}) {
  const puestos = criteriosPuestos(avanzado);
  const [abierto, setAbierto] = useState(false);

  const cambiar = (parcial: Partial<Avanzado>) =>
    onAvanzado({ ...avanzado, ...parcial });

  /** Marcar o desmarcar un valor dentro de un criterio de varios. */
  function alternar<K extends "estados" | "origenes" | "transportadoras">(
    criterio: K,
    valor: string
  ) {
    const actuales = avanzado[criterio] as string[];
    cambiar({
      [criterio]: actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor],
    } as Partial<Avanzado>);
  }

  function alternarCobro(valor: EstadoDeCobro) {
    cambiar({
      cobros: avanzado.cobros.includes(valor)
        ? avanzado.cobros.filter((v) => v !== valor)
        : [...avanzado.cobros, valor],
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        {/*
          Los atajos se deslizan de lado en el teléfono. Antes que
          apilarlos en dos filas —que empuja la lista hacia abajo justo
          donde menos sitio hay— se desplazan.
        */}
        <div
          className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Filtrar pedidos"
        >
          {ATAJOS.filter((a) => cuentas[a] > 0 || a === atajo).map((a) => {
            const puesto = a === atajo;
            return (
              <button
                key={a}
                type="button"
                onClick={() => onAtajo(a)}
                aria-pressed={puesto}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  puesto
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {ETIQUETA_ATAJO[a]}
                <span className="ml-1.5 tabular-nums opacity-60">
                  {cuentas[a]}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant={puestos > 0 ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {puestos > 0 && (
            <span className="ml-0.5 rounded-full bg-background/25 px-1.5 tabular-nums">
              {puestos}
            </span>
          )}
        </Button>
      </div>

      {abierto && (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={avanzado.texto}
              onChange={(e) => cambiar({ texto: e.target.value })}
              placeholder="Nombre, número de pedido, teléfono, cédula o ciudad"
              className="pl-9"
              aria-label="Buscar"
            />
          </div>

          <Criterio titulo="Estado">
            {ESTADOS.map((e) => (
              <Casilla
                key={e}
                puesta={avanzado.estados.includes(e)}
                onClick={() => alternar("estados", e)}
              >
                {etiquetaDeEstado(e)}
              </Casilla>
            ))}
          </Criterio>

          {origenes.length > 1 && (
            <Criterio titulo="De dónde vino">
              {origenes.map((o) => (
                <Casilla
                  key={o}
                  puesta={avanzado.origenes.includes(o)}
                  onClick={() => alternar("origenes", o)}
                >
                  {o === SIN_ORIGEN ? "Cargado a mano" : o}
                </Casilla>
              ))}
            </Criterio>
          )}

          <Criterio titulo="Cómo va el cobro">
            {COBROS.map((c) => (
              <Casilla
                key={c}
                puesta={avanzado.cobros.includes(c)}
                onClick={() => alternarCobro(c)}
              >
                {ETIQUETA_COBRO[c]}
              </Casilla>
            ))}
          </Criterio>

          {transportadoras.length > 1 && (
            <Criterio titulo="Transportadora">
              {transportadoras.map((t) => (
                <Casilla
                  key={t}
                  puesta={avanzado.transportadoras.includes(t)}
                  onClick={() => alternar("transportadoras", t)}
                >
                  {t}
                </Casilla>
              ))}
            </Criterio>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Criterio titulo="Fecha del pedido">
              <div className="flex w-full items-center gap-2">
                <Input
                  type="date"
                  value={avanzado.desde}
                  onChange={(e) => cambiar({ desde: e.target.value })}
                  className="h-9"
                  aria-label="Desde"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={avanzado.hasta}
                  onChange={(e) => cambiar({ hasta: e.target.value })}
                  className="h-9"
                  aria-label="Hasta"
                />
              </div>
            </Criterio>

            <Criterio titulo="Total del pedido">
              <div className="flex w-full items-center gap-2">
                <Input
                  inputMode="decimal"
                  value={avanzado.min}
                  onChange={(e) => cambiar({ min: e.target.value })}
                  placeholder="Desde $"
                  className="h-9"
                  aria-label="Monto mínimo"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  inputMode="decimal"
                  value={avanzado.max}
                  onChange={(e) => cambiar({ max: e.target.value })}
                  placeholder="Hasta $"
                  className="h-9"
                  aria-label="Monto máximo"
                />
              </div>
            </Criterio>
          </div>

          {/*
            Cuántos quedan, aquí y no solo en la lista.

            Sin este número hay que cerrar el panel y contar tarjetas para
            saber si lo que se acaba de marcar dejó algo fuera. Con él, se
            ve el efecto de cada casilla en el momento de marcarla.
          */}
          <div className="flex items-center justify-between gap-3 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {visibles}
              </span>{" "}
              de {total} {total === 1 ? "pedido" : "pedidos"}
            </p>
            {puestos > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onAvanzado({ ...AVANZADO_VACIO })}
              >
                <X className="size-3.5" /> Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Criterio({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

/**
 * Una opción de las que se pueden marcar varias.
 *
 * Botón con `aria-pressed` y no una casilla de verdad: hace falta que el
 * blanco del dedo sea la etiqueta entera y no un cuadrito de 13 px, y
 * esta pantalla se usa sobre todo en el teléfono.
 */
function Casilla({
  puesta,
  onClick,
  children,
}: {
  puesta: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={puesta}
      className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
        puesta
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}


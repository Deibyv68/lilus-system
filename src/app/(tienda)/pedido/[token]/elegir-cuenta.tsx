"use client";

import { useState } from "react";
import { DatoCopiable } from "./dato-copiable";

export type CuentaParaPagar = {
  id: string;
  banco: string;
  tipo: string | null;
  numero: string;
  titular: string | null;
  cedula: string | null;
  correo: string | null;
};

/**
 * Elegir en qué banco transferir, y ver esos datos.
 *
 * ── Por qué se elige el banco primero ──
 *
 * En Ecuador, transferir entre bancos distintos tarda hasta un día y a
 * veces cobra; dentro del mismo banco es inmediato y gratis. Mostrar
 * todas las cuentas juntas obliga a leer cinco bloques buscando el suyo;
 * mostrando una sola, quien no tenga ese banco paga comisión, espera, o
 * no compra.
 *
 * Con el desplegable, encuentra su banco y ve solo lo que necesita pegar.
 *
 * ── Por qué la primera viene elegida ──
 *
 * Porque la mayoría va a usar esa —la dueña la puso primera por algo— y
 * dejar el desplegable vacío obligaría a todos a dar un toque de más
 * antes de ver un solo dato.
 */
export function ElegirCuenta({
  cuentas,
  monto,
  referencia,
}: {
  cuentas: CuentaParaPagar[];
  monto: number;
  referencia: string;
}) {
  const [elegida, setElegida] = useState(cuentas[0]?.id ?? "");
  const cuenta = cuentas.find((c) => c.id === elegida) ?? cuentas[0];

  if (!cuenta) return null;

  return (
    <div>
      {/*
        El desplegable solo aparece si hay más de una cuenta. Con una
        sola, elegir entre una cosa es un paso que no decide nada.
      */}
      {cuentas.length > 1 && (
        <div className="mb-4">
          <label
            htmlFor="banco-de-pago"
            className="block text-xs uppercase tracking-wide text-tienda-tenue"
          >
            ¿Desde qué banco vas a transferir?
          </label>
          <select
            id="banco-de-pago"
            value={elegida}
            onChange={(e) => setElegida(e.target.value)}
            /*
              `text-base` en móvil: por debajo de 16 px, iOS hace zoom al
              tocar el campo y deja la página torcida.
            */
            className="mt-2 w-full appearance-none rounded-tienda-sm border border-tienda-linea bg-transparent px-4 py-3 text-base text-tienda-texto focus:border-tienda-texto focus:outline-none sm:text-sm"
          >
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.banco}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-tienda-tenue">
            Si tienes cuenta en uno de estos, la transferencia es inmediata y
            sin costo.
          </p>
        </div>
      )}

      {/*
        El monto y la referencia van primero y en grande: son los que más
        se equivocan, y los que hacen que un pago tarde días en
        identificarse. Y no cambian con el banco, así que van fuera de la
        parte que se reemplaza.
      */}
      <DatoCopiable etiqueta="Monto" valor={monto.toFixed(2)} destacado />
      <DatoCopiable
        etiqueta="Referencia"
        valor={referencia}
        destacado
        ayuda="Ponlo en el concepto o descripción."
      />

      {cuentas.length === 1 && (
        <DatoCopiable etiqueta="Banco" valor={cuenta.banco} />
      )}
      {cuenta.tipo && <DatoCopiable etiqueta="Tipo de cuenta" valor={cuenta.tipo} />}
      <DatoCopiable etiqueta="Número de cuenta" valor={cuenta.numero} />
      {cuenta.titular && (
        <DatoCopiable etiqueta="A nombre de" valor={cuenta.titular} />
      )}
      {cuenta.cedula && (
        <DatoCopiable etiqueta="Cédula o RUC" valor={cuenta.cedula} />
      )}
      {cuenta.correo && <DatoCopiable etiqueta="Correo" valor={cuenta.correo} />}
    </div>
  );
}

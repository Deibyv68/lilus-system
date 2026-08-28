"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  crearCuentaAction,
  editarCuentaAction,
  alternarCuentaAction,
  borrarCuentaAction,
  moverCuentaAction,
} from "./actions";

export type Cuenta = {
  id: string;
  banco: string;
  tipo: string | null;
  numero: string;
  titular: string | null;
  cedula: string | null;
  correo: string | null;
  activa: boolean;
};

/**
 * Las cuentas donde se recibe el pago.
 *
 * El orden importa: en la página del pedido la primera viene elegida, y
 * la mayoría va a usar esa. Conviene poner arriba el banco donde más
 * gente tiene cuenta.
 */
export function ListaDeCuentas({ cuentas }: { cuentas: Cuenta[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [creando, setCreando] = useState(cuentas.length === 0);
  const [trabajando, startTrabajo] = useTransition();

  function refrescar() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {cuentas.length === 0 && !creando && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Todavía no hay cuentas. Sin ninguna, la web le dice al cliente que
            le enviarás los datos por WhatsApp.
          </CardContent>
        </Card>
      )}

      <ul className="space-y-3">
        {cuentas.map((c, i) => (
          <li key={c.id}>
            {editando === c.id ? (
              <Formulario
                inicial={c}
                onCancelar={() => setEditando(null)}
                onGuardar={(fd) =>
                  startTrabajo(async () => {
                    const r = await editarCuentaAction(c.id, fd);
                    if (!r.ok) {
                      toast.error(r.error);
                      return;
                    }
                    toast.success("Cuenta actualizada");
                    setEditando(null);
                    refrescar();
                  })
                }
                trabajando={trabajando}
              />
            ) : (
              <div
                className={`rounded-xl border p-4 ${c.activa ? "bg-card" : "bg-muted/40"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">
                      {c.banco}
                      {!c.activa && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          apagada
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                      {c.numero}
                      {c.tipo && ` · ${c.tipo}`}
                    </p>
                    {c.titular && (
                      <p className="text-xs text-muted-foreground">
                        {c.titular}
                        {c.cedula && ` · ${c.cedula}`}
                      </p>
                    )}
                    {c.correo && (
                      <p className="text-xs text-muted-foreground">{c.correo}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={i === 0 || trabajando}
                      onClick={() =>
                        startTrabajo(async () => {
                          await moverCuentaAction(c.id, "arriba");
                          refrescar();
                        })
                      }
                      aria-label="Subir en la lista"
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={i === cuentas.length - 1 || trabajando}
                      onClick={() =>
                        startTrabajo(async () => {
                          await moverCuentaAction(c.id, "abajo");
                          refrescar();
                        })
                      }
                      aria-label="Bajar en la lista"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditando(c.id)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={c.activa}
                      disabled={trabajando}
                      onCheckedChange={(v) =>
                        startTrabajo(async () => {
                          await alternarCuentaAction(c.id, v);
                          refrescar();
                        })
                      }
                    />
                    <span className="text-muted-foreground">
                      {c.activa ? "Se ofrece en la web" : "No se ofrece"}
                    </span>
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={trabajando}
                    onClick={() =>
                      startTrabajo(async () => {
                        await borrarCuentaAction(c.id);
                        toast.success("Cuenta borrada");
                        refrescar();
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" /> Borrar
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {creando ? (
        <Formulario
          onCancelar={() => setCreando(false)}
          onGuardar={(fd) =>
            startTrabajo(async () => {
              const r = await crearCuentaAction(fd);
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              toast.success("Cuenta añadida");
              setCreando(false);
              refrescar();
            })
          }
          trabajando={trabajando}
        />
      ) : (
        <Button type="button" variant="outline" onClick={() => setCreando(true)}>
          <Plus className="size-4" /> Añadir una cuenta
        </Button>
      )}
    </div>
  );
}

function Formulario({
  inicial,
  onGuardar,
  onCancelar,
  trabajando,
}: {
  inicial?: Cuenta;
  onGuardar: (fd: FormData) => void;
  onCancelar: () => void;
  trabajando: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form
          action={onGuardar}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Campo
            nombre="banco"
            etiqueta="Banco"
            requerido
            valor={inicial?.banco}
            placeholder="Banco Pichincha"
          />
          <Campo
            nombre="tipo"
            etiqueta="Tipo de cuenta"
            valor={inicial?.tipo ?? ""}
            placeholder="Ahorros"
          />
          <Campo
            nombre="numero"
            etiqueta="Número de cuenta"
            requerido
            valor={inicial?.numero}
            placeholder="2209876543"
          />
          <Campo
            nombre="titular"
            etiqueta="A nombre de"
            valor={inicial?.titular ?? ""}
            placeholder="Nombre del titular"
          />
          <Campo
            nombre="cedula"
            etiqueta="Cédula o RUC"
            valor={inicial?.cedula ?? ""}
            placeholder="0912345678"
          />
          <Campo
            nombre="correo"
            etiqueta="Correo (opcional)"
            valor={inicial?.correo ?? ""}
            placeholder="pagos@correo.com"
            ayuda="Algunos bancos permiten transferir por correo."
          />

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={trabajando}>
              {inicial ? "Guardar cambios" : "Añadir cuenta"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancelar}>
              <X className="size-4" /> Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Campo({
  nombre,
  etiqueta,
  valor,
  placeholder,
  requerido,
  ayuda,
}: {
  nombre: string;
  etiqueta: string;
  valor?: string;
  placeholder?: string;
  requerido?: boolean;
  ayuda?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nombre}>{etiqueta}</Label>
      <Input
        id={nombre}
        name={nombre}
        defaultValue={valor}
        placeholder={placeholder}
        required={requerido}
      />
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

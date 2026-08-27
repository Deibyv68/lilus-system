"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  subirFotoFeedAction,
  borrarFotoFeedAction,
  moverFotoFeedAction,
} from "./actions";

type Foto = { id: string; url: string; alt: string | null; enlace: string | null };

export function FeedAdmin({ fotos }: { fotos: Foto[] }) {
  const router = useRouter();
  const [subiendo, startSubida] = useTransition();
  const [moviendo, startMovida] = useTransition();
  const formulario = useRef<HTMLFormElement>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  function onSubir(fd: FormData) {
    startSubida(async () => {
      const r = await subirFotoFeedAction(fd);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Foto añadida");
      formulario.current?.reset();
      setVistaPrevia(null);
      router.refresh();
    });
  }

  function onBorrar(id: string) {
    startMovida(async () => {
      await borrarFotoFeedAction(id);
      toast.success("Foto quitada");
      router.refresh();
    });
  }

  function onMover(id: string, direccion: "arriba" | "abajo") {
    startMovida(async () => {
      await moverFotoFeedAction(id, direccion);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <form ref={formulario} action={onSubir} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="foto">Foto</Label>
              <Input
                id="foto"
                name="foto"
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const archivo = e.target.files?.[0];
                  /*
                    Con <img> y no con next/image: la dirección "blob:" que
                    arma el navegador al elegir un archivo solo existe en
                    esta pestaña, y el optimizador del servidor no puede
                    verla. Es una miniatura que se descarta al guardar.
                  */
                  setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Vertical se ve mejor: la portada las muestra en 4:5.
              </p>
            </div>

            {vistaPrevia && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPrevia}
                alt=""
                className="aspect-[4/5] w-28 rounded-md object-cover"
              />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="alt">Qué se ve en la foto</Label>
              <Input
                id="alt"
                name="alt"
                placeholder="Cortando la tanda de jabón de café"
              />
              <p className="text-xs text-muted-foreground">
                Lo lee quien navega sin ver, y también Google.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enlace">Enlace a la publicación (opcional)</Label>
              <Input
                id="enlace"
                name="enlace"
                placeholder="https://instagram.com/p/…"
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, la foto lleva a tu perfil de Instagram.
              </p>
            </div>

            <Button type="submit" disabled={subiendo}>
              {subiendo ? "Subiendo…" : "Añadir al feed"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {fotos.length > 0 && (
        <ul className="space-y-3">
          {fotos.map((f, i) => (
            <li
              key={f.id}
              className="flex items-center gap-4 rounded-lg border p-3"
            >
              <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={f.url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {f.alt || (
                    <span className="text-muted-foreground">
                      Sin descripción
                    </span>
                  )}
                </p>
                {f.enlace && (
                  <p className="truncate text-xs text-muted-foreground">
                    {f.enlace}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === 0 || moviendo}
                  onClick={() => onMover(f.id, "arriba")}
                  aria-label="Subir en el orden"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={i === fotos.length - 1 || moviendo}
                  onClick={() => onMover(f.id, "abajo")}
                  aria-label="Bajar en el orden"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={moviendo}
                  onClick={() => onBorrar(f.id)}
                  aria-label="Quitar del feed"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

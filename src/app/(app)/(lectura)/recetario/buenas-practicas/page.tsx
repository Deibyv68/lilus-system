import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  ArrowLeft,
  Thermometer,
  SprayCan,
  NotebookPen,
  FlaskConical,
  ShieldAlert,
  Droplets,
  ListChecks,
  CalendarClock,
  Wind,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Practice = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  why: string;
  points: string[];
  table?: { head: string[]; rows: string[][] };
  priority?: boolean;
};

const PRACTICES: Practice[] = [
  {
    icon: Thermometer,
    title: "Termómetro",
    why: "Es lo más barato de comprar y lo que más mejora el resultado. Sin él, toda la temperatura es a ojo, y la temperatura decide media receta.",
    priority: true,
    points: [
      "Un termómetro infrarrojo de pistola es lo más cómodo: se apunta y se lee, sin meter nada en el producto.",
      "En la crema base, el Dehyquart entra a 70–75 °C. A 100 °C se hidroliza y se rompe parte del emulsionante justo al incorporarlo.",
      "Que se pase la temperatura de la base es la causa más probable de que unas tandas queden mejor que otras sin saber por qué.",
    ],
    table: {
      head: ["Momento", "Temperatura", "Si te pasas"],
      rows: [
        ["Derretir la base", "60–65 °C", "Sobre 70 la base se degrada, amarillea y suda más"],
        ["Agregar el aroma", "55–58 °C", "Más caliente y el aroma se evapora"],
        ["Verter al molde", "55–60 °C", "Muy caliente hace burbujas; muy frío no fluye"],
      ],
    },
  },
  {
    icon: SprayCan,
    title: "Alcohol en spray",
    why: "Es la herramienta del jabón de glicerina. Alcohol al 70 % en un atomizador, siempre al alcance de la mano.",
    priority: true,
    points: [
      "Rociar el molde antes de verter: menos burbujas pegadas a la pared.",
      "Rociar la superficie apenas se vierte: las burbujas de arriba revientan solas. Esto solo ya cambia el acabado.",
      "Rociar entre capas: es lo que hace que se peguen. En el marmoleado de lavanda, sin esto el jabón se puede partir por la unión.",
    ],
  },
  {
    icon: NotebookPen,
    title: "Bitácora de lote",
    why: "Cuando apareció el olor a huevo en las cremas no había forma de saber desde cuándo, ni qué tandas estaban afectadas, ni si coincidía con un frasco nuevo de colágeno. Con bitácora se abre el cuaderno y se ve la fecha.",
    priority: true,
    points: [
      "Una hoja por tanda. Puede ser un cuaderno, no hace falta que sea digital.",
      "Fecha y código de lote.",
      "De qué frasco salió cada materia prima: esto es lo clave.",
      "Los pesos que realmente se usaron, no los que decía la receta.",
      "Temperaturas alcanzadas y pH medido.",
      "Observaciones: cómo quedó, si hubo algo raro.",
      "Quién la hizo.",
    ],
  },
  {
    icon: FlaskConical,
    title: "Muestras de retención",
    why: "Si en tres meses una clienta dice que la crema huele raro, se saca la muestra de esa tanda y se compara. Sin eso no hay forma de aprender nada del reclamo.",
    points: [
      "De cada tanda, guardar una muestra pequeña etiquetada.",
      "Conservarla hasta pasada la fecha de caducidad.",
      "Cuesta un frasquito por tanda.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Mascarilla para los polvos",
    why: "Esto es seguridad, no calidad. El dióxido de titanio en polvo inhalado está clasificado como posible carcinógeno por vía respiratoria. Sobre la piel no hay problema: el riesgo es respirarlo al manipularlo.",
    priority: true,
    points: [
      "Mascarilla N95 al abrir y pesar dióxido de titanio, óxido de zinc, carbón activado y arcillas.",
      "Pesar sin corrientes de aire.",
      "Es de las pocas cosas de esta lista que no es opcional.",
    ],
  },
  {
    icon: Droplets,
    title: "Sanitizar no es lavar",
    why: "Lavar con agua y jabón deja humedad y residuo de detergente. El residuo es alcalino, y el pH alcalino acelera la degradación de las proteínas.",
    points: [
      "Lavar → enjuagar muy bien → rociar con alcohol al 70 % → dejar secar al aire.",
      "El alcohol al 70 % desinfecta mejor que el de 96 %: el de 96 deshidrata la pared de la bacteria tan rápido que la sella por fuera. El agua del 70 % permite que penetre.",
      "Sanitizar justo antes de usar, no la noche anterior.",
      "No reutilizar frascos para el colágeno ni para la elastina.",
      "Nunca reutilizar un frasco que tuvo otro ingrediente.",
    ],
  },
  {
    icon: ListChecks,
    title: "Todo pesado antes de empezar",
    why: "La base de glicerina empieza a solidificar apenas sale del calor. Si hay que buscar el frasco del aroma mientras la base se enfría, ya se perdió temperatura.",
    points: [
      "Pesar y alinear todos los ingredientes antes de encender el fuego, en el orden en que van a entrar.",
      "Es gratis y probablemente lo que más rápido se note.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Fechas en todos los frascos",
    why: "El problema del colágeno tenía un componente de tiempo. Sin fechas no se puede saber si un frasco lleva dos meses o seis abiertos.",
    points: [
      "Dos fechas en cada materia prima: cuándo llegó y cuándo se abrió.",
      "Usar siempre el más viejo primero.",
      "El colágeno y la elastina van en vidrio ámbar, en frío y sin luz.",
      "El agua destilada deja de ser estéril al abrirse: comprar envases pequeños y no guardar uno abierto durante meses.",
      "Pedir siempre al proveedor la ficha técnica, la hoja de seguridad y el lote con fecha de caducidad.",
    ],
  },
  {
    icon: Wind,
    title: "La humedad del ambiente",
    why: "El jabón de glicerina suda porque la glicerina atrae agua del aire. Ningún aditivo pelea contra un ambiente húmedo tan bien como no trabajar en uno.",
    points: [
      "No hacer jabón en días de lluvia si se puede elegir.",
      "Envolver en film apenas se desmolda, no cuando termine todo.",
      "Si el problema es constante, un deshumidificador pequeño resuelve más que cualquier fórmula.",
      "El jabón de avena y miel es el que más suda, porque la miel es azúcar y atrae humedad. Ese se envuelve de inmediato.",
    ],
  },
];

export default function BuenasPracticasPage() {
  return (
    <>
      <div className="mb-4">
        <Link
          href="/recetario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Recetario
        </Link>
      </div>

      <PageHeader
        title="Buenas prácticas"
        description="Lo que hace que una tanda salga igual que la anterior."
      />

      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 mb-6">
        <p className="text-sm font-semibold mb-1">Si solo se adoptan tres</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          El <strong className="text-foreground">termómetro</strong>, porque es
          lo que más mejora el producto por menos dinero. El{" "}
          <strong className="text-foreground">alcohol en spray</strong>, porque
          cambia el acabado de todos los jabones. Y la{" "}
          <strong className="text-foreground">bitácora</strong>, que es la que
          convierte cada tanda en información en vez de en un intento.
        </p>
      </div>

      <div className="space-y-4">
        {PRACTICES.map((p) => {
          const Icon = p.icon;
          return (
            <section
              key={p.title}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                      p.priority
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold leading-tight">
                      {p.title}
                      {p.priority && (
                        <span className="ml-2 text-3xs uppercase tracking-wider text-primary align-middle">
                          prioritario
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {p.why}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {p.points.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-snug">
                      <span className="text-muted-foreground shrink-0">·</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {p.table && (
                <div className="border-t overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        {p.table.head.map((h) => (
                          <th
                            key={h}
                            className="text-left font-semibold px-4 py-2 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {p.table.rows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className={`px-4 py-2 align-top ${
                                j === 1 ? "font-semibold whitespace-nowrap" : ""
                              } ${j === 2 ? "text-muted-foreground" : ""}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

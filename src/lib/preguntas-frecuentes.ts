import { formatCurrency } from "./format";
import { DIAS_PREPARACION, DIAS_PARA_TRANSFERIR } from "./politicas";

/**
 * Lo que la gente pregunta antes de comprar.
 *
 * ── Por qué esto y no testimonios ──
 *
 * Aquí había cuatro reseñas de clientas inventadas, con nombre y ciudad,
 * bajo el título «Lo que dicen». Se pusieron como andamio para ver el
 * diseño, con una nota que decía que había que quitarlas antes de
 * publicar, y la web salió a internet con ellas dentro.
 *
 * Además de ser publicidad engañosa —la Ley de Defensa del Consumidor la
 * prohíbe—, era un mal negocio: este taller vende a desconocidas que
 * transfieren dinero antes de recibir nada, y eso se sostiene solo sobre
 * la confianza. Basta con que una clienta pregunte quién es «Paulina
 * Andrade» para que todo lo demás que dice la web quede en duda.
 *
 * Esta sección ocupa el mismo sitio y hace el mismo trabajo —quitar el
 * miedo a comprar— sin inventarse a nadie: contesta lo que de verdad
 * frena una compra.
 *
 * ── Por qué las cifras no están escritas a mano ──
 *
 * El precio del envío y los días de preparación salen de la base y de
 * `politicas.ts`. Si mañana sube el envío, la respuesta cambia sola. Una
 * cifra copiada aquí se queda vieja sin que nadie se entere, y una
 * respuesta vieja miente igual que una inventada.
 *
 * Lo que sí está escrito son los datos que solo sabe quien hace los
 * jabones: cuánto dura una barra y cuánto aguanta guardada. Vienen de la
 * dueña, no de una estimación.
 */

export type Pregunta = {
  pregunta: string;
  respuesta: string;
  /** Para la única que se entiende mejor en dos columnas. */
  filas?: { uso: string; duracion: string }[];
  enlace?: { texto: string; href: string };
};

export type DatosDeEnvio = {
  nombre: string;
  precio: number;
  transportadora: string;
  porDefecto: boolean;
}[];

export function preguntasFrecuentes(envios: DatosDeEnvio): Pregunta[] {
  /*
    Las tarifas van en tabla y no en una frase.

    Se intentó redactarlas —«$3,50 en Quito y $5,50 a fuera de Quito»— y
    salió mal escrito: los nombres de zona vienen de la base y no encajan
    en una oración sin retocarlos, y retocar un nombre propio a mano es
    pedir que quede en minúscula el día que alguien añada una zona. En dos
    columnas se leen mejor, no hay gramática que romper, y da igual que
    mañana haya dos zonas o siete.
  */
  const transportadora = envios[0]?.transportadora;

  return [
    {
      pregunta: "¿Cuánto me dura un jabón?",
      respuesta:
        "Depende de para qué lo uses y de si le dejas escurrir el agua entre duchas — un jabón que se queda en un charco se gasta al doble de velocidad.",
      filas: [
        { uso: "Ducha diaria, una persona", duracion: "2 a 4 semanas" },
        { uso: "Solo manos, varias veces al día", duracion: "3 a 5 semanas" },
        { uso: "Solo cara (arroz, cúrcuma, carbón)", duracion: "2 a 3 meses" },
      ],
    },
    {
      pregunta: "¿Cómo pago?",
      respuesta:
        "Por transferencia bancaria o con DeUna. Cuando la hagas, subes la foto del comprobante en tu página de pedido y lo revisamos a mano: aquí ningún pago se da por bueno automáticamente.",
    },
    {
      pregunta: "¿Cuánto cuesta el envío?",
      respuesta: transportadora
        ? `Depende de a dónde vaya. Lo lleva ${transportadora}.`
        : "Depende de a dónde vaya.",
      filas: envios.map((z) => ({
        uso: z.nombre,
        duracion: formatCurrency(z.precio),
      })),
    },
    {
      pregunta: "¿Me cuesta más el envío si compro varios?",
      respuesta:
        "No. Es tarifa fija por zona, lleves un jabón o diez. Si vas a pedir más de uno, te sale mejor en el mismo pedido que en dos separados.",
    },
    {
      pregunta: "¿Cuánto tardan en prepararlo?",
      respuesta: `${DIAS_PREPARACION} días desde que confirmamos el pago, y después lo que tarde el envío. Se prepara cuando lo pides: no está hecho de antes esperando en una bodega. Tienes ${DIAS_PARA_TRANSFERIR} días para transferir antes de que el pedido se libere.`,
    },
    {
      pregunta: "¿Los jabones caducan?",
      respuesta:
        "Aguantan entre 6 y 8 meses guardados. Cada barra sale con su número de lote y su fecha impresos, así que siempre sabes cuál tienes en la mano y nosotros sabemos cuándo y con qué se hizo.",
    },
    {
      pregunta: "¿Los packs salen más baratos?",
      respuesta:
        "Sí. Y el ahorro no es un número de marketing: cada pack te dice cuánto te ahorras restando los precios reales de los jabones que trae. Si mañana cambia el precio de uno, el número cambia solo.",
      enlace: { texto: "Ver los packs", href: "/tienda" },
    },
    {
      /*
        La pregunta que más se repite y la única con riesgo. Contestar que
        sí convertiría un cosmético en una promesa médica, y ese claim
        pasaría a ser nuestro por repetirlo. Se contesta de verdad —con la
        lista de ingredientes— sin prometer nada.
      */
      pregunta: "¿Sirve para piel sensible?",
      respuesta:
        "No somos médicos y no vendemos tratamientos. Lo que sí hacemos es decirte exactamente qué lleva cada jabón, para que decidas tú. Si tienes alguna condición de piel, pregúntale a tu dermatólogo con la lista de ingredientes delante.",
    },
    {
      pregunta: "¿Y si llega roto o equivocado?",
      respuesta:
        "Nos escribes y lo solucionamos. Está escrito en las condiciones de compra, con la ley delante: no es un favor que hacemos según el día.",
      enlace: { texto: "Cambios y devoluciones", href: "/legal/devoluciones" },
    },
  ];
}

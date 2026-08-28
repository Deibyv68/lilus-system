/** Comprueba el filtrado de pedidos con los casos que de verdad pasan. */
import {
  pasaElAtajo,
  pasaElAvanzado,
  contarPorAtajo,
  cobroDe,
  origenesDe,
  transportadorasDe,
  criteriosPuestos,
  AVANZADO_VACIO,
  SIN_ORIGEN,
  type PedidoFiltrable,
  type Avanzado,
} from "../src/lib/filtrar-pedidos";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? "ok  " : "FALLA"} ${que}` +
      (ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`)
  );
}

const base = (p: Partial<PedidoFiltrable> = {}): PedidoFiltrable => ({
  orderNumber: "LILUS-000001",
  status: "PENDING",
  source: "Web",
  total: 26.5,
  createdAt: new Date("2026-08-15T14:00:00"),
  customer: { name: "María Alvarado", phone: "0963209329", cedula: "1719799064" },
  carrier: { name: "Servientrega" },
  ciudad: "Quito",
  comprobantes: [],
  ...p,
});

const con = (f: Partial<Avanzado>): Avanzado => ({ ...AVANZADO_VACIO, ...f });

console.log("── atajos ──");
{
  const pedidos = [
    base({ status: "PENDING" }),
    base({ status: "PAID", source: "Instagram" }),
    base({ status: "SHIPPED", source: null }),
    base({ status: "DELIVERED", source: null }),
    base({
      status: "PENDING",
      comprobantes: [{ aceptado: null, montoConfirmado: null, montoLeido: 10 }],
    }),
  ];
  const c = contarPorAtajo(pedidos);
  igual("todos", c.todos, 5);
  igual("por cobrar", c.cobrar, 2);
  igual("por revisar", c.revisar, 1);
  igual("por preparar", c.preparar, 1);
  igual("en camino", c.camino, 1);
  igual("cerrados", c.cerrados, 1);
  // Dos: el primero y el quinto. Los otros tres traen otro origen o ninguno.
  igual("de la web", c.web, 2);
  igual(
    "por revisar se cruza con por cobrar",
    pasaElAtajo(pedidos[4], "cobrar") && pasaElAtajo(pedidos[4], "revisar"),
    true
  );
}

console.log("\n── el filtro vacío no filtra ──");
igual("sin criterios, pasa todo", pasaElAvanzado(base(), AVANZADO_VACIO), true);
igual("y no cuenta ninguno puesto", criteriosPuestos(AVANZADO_VACIO), 0);

console.log("\n── buscar por texto ──");
igual("por número de pedido", pasaElAvanzado(base(), con({ texto: "000001" })), true);
igual("por nombre", pasaElAvanzado(base(), con({ texto: "alvarado" })), true);
igual("sin la tilde", pasaElAvanzado(base(), con({ texto: "maria" })), true);
igual("con la tilde", pasaElAvanzado(base(), con({ texto: "María" })), true);
igual("en mayúsculas", pasaElAvanzado(base(), con({ texto: "MARIA" })), true);
igual("por cédula", pasaElAvanzado(base(), con({ texto: "1719799064" })), true);
igual("por ciudad", pasaElAvanzado(base(), con({ texto: "quito" })), true);
igual("lo que no está", pasaElAvanzado(base(), con({ texto: "carmen" })), false);

console.log("\n── el teléfono, escrito como sea ──");
igual("tal cual", pasaElAvanzado(base(), con({ texto: "0963209329" })), true);
igual("con guiones", pasaElAvanzado(base(), con({ texto: "096-320-9329" })), true);
igual("con espacios", pasaElAvanzado(base(), con({ texto: "096 320 9329" })), true);
igual("un trozo", pasaElAvanzado(base(), con({ texto: "3209329" })), true);
igual(
  "guardado con +593, buscado con 0",
  pasaElAvanzado(
    base({ customer: { name: "X", phone: "+593 96 320 9329" } }),
    con({ texto: "963209329" })
  ),
  true
);
igual(
  "dos dígitos no bastan para dar un falso positivo",
  pasaElAvanzado(base({ customer: { name: "Ana", phone: "0963209329" } }), con({ texto: "96" })),
  false
);

console.log("\n── estado, origen, transportadora ──");
igual("un estado", pasaElAvanzado(base(), con({ estados: ["PENDING"] })), true);
igual("otro estado", pasaElAvanzado(base(), con({ estados: ["PAID"] })), false);
igual("dos estados suman (O)", pasaElAvanzado(base(), con({ estados: ["PAID", "PENDING"] })), true);
igual("origen web", pasaElAvanzado(base(), con({ origenes: ["Web"] })), true);
igual(
  "cargado a mano",
  pasaElAvanzado(base({ source: null }), con({ origenes: [SIN_ORIGEN] })),
  true
);
igual(
  "cargado a mano no cae en «Web»",
  pasaElAvanzado(base({ source: null }), con({ origenes: ["Web"] })),
  false
);
igual(
  "transportadora",
  pasaElAvanzado(base(), con({ transportadoras: ["Servientrega"] })),
  true
);

console.log("\n── cómo va el cobro ──");
igual("sin comprobantes", cobroDe(base()), "sin");
igual(
  "con uno sin revisar",
  cobroDe(base({ comprobantes: [{ aceptado: null, montoConfirmado: null, montoLeido: 26.5 }] })),
  "revisar"
);
igual(
  "aceptado y cuadra",
  cobroDe(base({ comprobantes: [{ aceptado: true, montoConfirmado: 26.5, montoLeido: null }] })),
  "completo"
);
igual(
  "aceptado a medias",
  cobroDe(base({ comprobantes: [{ aceptado: true, montoConfirmado: 12, montoLeido: null }] })),
  "parcial"
);
igual(
  "sin revisar manda sobre lo demás",
  cobroDe(
    base({
      comprobantes: [
        { aceptado: true, montoConfirmado: 26.5, montoLeido: null },
        { aceptado: null, montoConfirmado: null, montoLeido: 5 },
      ],
    })
  ),
  "revisar"
);

console.log("\n── fechas ──");
igual("desde antes", pasaElAvanzado(base(), con({ desde: "2026-08-01" })), true);
igual("desde después", pasaElAvanzado(base(), con({ desde: "2026-09-01" })), false);
igual("hasta después", pasaElAvanzado(base(), con({ hasta: "2026-08-31" })), true);
igual("hasta antes", pasaElAvanzado(base(), con({ hasta: "2026-08-01" })), false);
igual(
  "el propio día cuenta como «hasta»",
  pasaElAvanzado(base(), con({ hasta: "2026-08-15" })),
  true
);
igual(
  "y también como «desde»",
  pasaElAvanzado(base(), con({ desde: "2026-08-15" })),
  true
);
igual(
  "un pedido de las 23:50 entra en su propio día",
  pasaElAvanzado(
    base({ createdAt: new Date("2026-08-15T23:50:00") }),
    con({ hasta: "2026-08-15" })
  ),
  true
);
igual(
  "rango de un solo día",
  pasaElAvanzado(base(), con({ desde: "2026-08-15", hasta: "2026-08-15" })),
  true
);

console.log("\n── montos ──");
igual("mínimo por debajo", pasaElAvanzado(base(), con({ min: "20" })), true);
igual("mínimo por encima", pasaElAvanzado(base(), con({ min: "30" })), false);
igual("máximo por encima", pasaElAvanzado(base(), con({ max: "30" })), true);
igual("máximo por debajo", pasaElAvanzado(base(), con({ max: "20" })), false);
igual("el borde entra", pasaElAvanzado(base(), con({ min: "26.5", max: "26.5" })), true);
igual("con coma decimal", pasaElAvanzado(base(), con({ min: "26,50" })), true);
igual("con símbolo de dólar", pasaElAvanzado(base(), con({ min: "$20" })), true);
igual("un campo a medias no filtra", pasaElAvanzado(base(), con({ min: "  " })), true);

console.log("\n── entre criterios manda la Y ──");
igual(
  "estado sí + origen no",
  pasaElAvanzado(base(), con({ estados: ["PENDING"], origenes: ["Instagram"] })),
  false
);
igual(
  "estado sí + origen sí + monto no",
  pasaElAvanzado(base(), con({ estados: ["PENDING"], origenes: ["Web"], min: "100" })),
  false
);
igual(
  "todo sí",
  pasaElAvanzado(
    base(),
    con({
      texto: "maria",
      estados: ["PENDING"],
      origenes: ["Web"],
      cobros: ["sin"],
      transportadoras: ["Servientrega"],
      desde: "2026-08-01",
      hasta: "2026-08-31",
      min: "10",
      max: "50",
    })
  ),
  true
);
igual(
  "y cuenta los ocho criterios",
  criteriosPuestos(
    con({
      texto: "maria",
      estados: ["PENDING"],
      origenes: ["Web"],
      cobros: ["sin"],
      transportadoras: ["Servientrega"],
      desde: "2026-08-01",
      hasta: "2026-08-31",
      min: "10",
      max: "50",
    })
  ),
  7
);

console.log("\n── lo que se puede ofrecer ──");
{
  const pedidos = [
    base({ source: "Web" }),
    base({ source: "Instagram" }),
    base({ source: null }),
    base({ source: "Web" }),
    base({ carrier: null }),
  ];
  igual("orígenes, con «a mano» al final", origenesDe(pedidos), [
    "Instagram",
    "Web",
    SIN_ORIGEN,
  ]);
  igual("transportadoras, sin repetir ni nulos", transportadorasDe(pedidos), [
    "Servientrega",
  ]);
}

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;

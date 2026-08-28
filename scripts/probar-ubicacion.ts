/** Comprueba qué pasa con la dirección al marcar un punto en el mapa. */
import { aplicarPunto, type Direccion } from "../src/lib/ubicacion-a-direccion";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${que}${ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`}`);
}

const vacia: Direccion = { calle: "", provincia: "", ciudad: "", postal: "", lat: null, lng: null };

console.log("── lo básico ──");
{
  const r = aplicarPunto(
    { lat: -0.1807, lng: -78.4678, calle: "Diego Noboa", provincia: "Pichincha",
      lugares: ["Diego Noboa", "Bellavista", "Iñaquito", "Quito", "Distrito Metropolitano de Quito"],
      recibioRespuesta: true },
    vacia, null
  );
  igual("guarda las coordenadas", [r.direccion.lat, r.direccion.lng], [-0.1807, -78.4678]);
  igual("pone la calle", r.direccion.calle, "Diego Noboa");
  igual("pone la provincia", r.direccion.provincia, "Pichincha");
  igual("saca el cantón de entre todos los lugares", r.direccion.ciudad, "Quito");
  igual("recuerda que la calle la puso el mapa", r.calleDelMapa, "Diego Noboa");
}

console.log("\n── el cantón no es el primer nombre que suene a ciudad ──");
{
  const r = aplicarPunto(
    { lat: -0.2, lng: -78.4, provincia: "Pichincha",
      lugares: ["Tumbaco", "Distrito Metropolitano de Quito"], recibioRespuesta: true },
    vacia, null
  );
  igual("Tumbaco es parroquia: el cantón es Quito", r.direccion.ciudad, "Quito");
}
{
  const r = aplicarPunto(
    { lat: -0.95, lng: -80.7, provincia: "Manabí", lugares: ["Manta", "Manta"], recibioRespuesta: true },
    vacia, null
  );
  igual("Manta sí es cantón", r.direccion.ciudad, "Manta");
  igual("...y su provincia", r.direccion.provincia, "Manabí");
}

console.log("\n── la calle escrita a mano se respeta ──");
{
  const previa: Direccion = { calle: "Casa de la esquina verde", provincia: "Pichincha", ciudad: "Quito", postal: "", lat: null, lng: null };
  const r = aplicarPunto(
    { lat: -0.18, lng: -78.46, provincia: "Pichincha", lugares: ["Quito"], recibioRespuesta: true },
    previa, null
  );
  igual("el mapa no pisa lo que escribió la persona", r.direccion.calle, "Casa de la esquina verde");
}
{
  const previa: Direccion = { calle: "Av. Amazonas", provincia: "Pichincha", ciudad: "Quito", postal: "", lat: null, lng: null };
  const r = aplicarPunto(
    { lat: -0.18, lng: -78.46, provincia: "Pichincha", lugares: ["Quito"], recibioRespuesta: true },
    previa, "Av. Amazonas"
  );
  igual("pero sí borra la que había puesto él", r.direccion.calle, "");
  igual("...y se olvida de ella", r.calleDelMapa, null);
}
{
  const previa: Direccion = { calle: "Av. Amazonas", provincia: "Pichincha", ciudad: "Quito", postal: "", lat: null, lng: null };
  const r = aplicarPunto(
    { lat: -0.18, lng: -78.46, recibioRespuesta: false },
    previa, "Av. Amazonas"
  );
  igual("si el mapa ni contestó, no borra nada", r.direccion.calle, "Av. Amazonas");
}

console.log("\n── cambiar de provincia ──");
{
  const previa: Direccion = { calle: "", provincia: "Pichincha", ciudad: "Quito", postal: "", lat: null, lng: null };
  const r = aplicarPunto(
    { lat: -0.95, lng: -80.7, provincia: "Manabí", lugares: ["Nada reconocible"], recibioRespuesta: true },
    previa, null
  );
  igual("cambia la provincia", r.direccion.provincia, "Manabí");
  igual("y limpia el cantón viejo, que ya no cuadra", r.direccion.ciudad, "");
}
{
  const previa: Direccion = { calle: "", provincia: "Pichincha", ciudad: "Quito", postal: "", lat: null, lng: null };
  const r = aplicarPunto(
    { lat: -0.18, lng: -78.46, provincia: "Pichincha", lugares: ["Sitio raro"], recibioRespuesta: true },
    previa, null
  );
  igual("en la misma provincia conserva el cantón si no sabe otro", r.direccion.ciudad, "Quito");
}

console.log("\n── lo que no debe romper ──");
{
  const r = aplicarPunto({ lat: 4.6, lng: -74.0, provincia: "Cundinamarca", lugares: ["Bogotá"], recibioRespuesta: true }, vacia, null);
  igual("una provincia que no es de Ecuador se ignora", r.direccion.provincia, "");
  igual("...pero el punto se guarda igual", r.direccion.lat, 4.6);
}
{
  const r = aplicarPunto({ lat: -0.18, lng: -78.46 }, vacia, null);
  igual("sin datos del mapa solo quedan las coordenadas", r.direccion, { calle: "", provincia: "", ciudad: "", postal: "", lat: -0.18, lng: -78.46 });
}

console.log("\n── el código postal ──");
{
  const r = aplicarPunto({ lat: -0.18, lng: -78.46, postal: "170515", recibioRespuesta: true }, vacia, null);
  igual("lo guarda cuando el mapa lo sabe", r.direccion.postal, "170515");
}
{
  const previa: Direccion = { calle: "", provincia: "", ciudad: "", postal: "170515", lat: null, lng: null };
  const r = aplicarPunto({ lat: -0.95, lng: -80.7, postal: "130802", recibioRespuesta: true }, previa, null);
  igual("lo reemplaza al cambiar de sitio", r.direccion.postal, "130802");
}
{
  const previa: Direccion = { calle: "", provincia: "", ciudad: "", postal: "170515", lat: null, lng: null };
  const r = aplicarPunto({ lat: -1.5, lng: -78.0, recibioRespuesta: true }, previa, null);
  igual("lo borra si el nuevo punto no tiene: el viejo ya no es de ahí", r.direccion.postal, "");
}
{
  const previa: Direccion = { calle: "", provincia: "", ciudad: "", postal: "170515", lat: null, lng: null };
  const r = aplicarPunto({ lat: -1.5, lng: -78.0, recibioRespuesta: false }, previa, null);
  igual("pero si el mapa ni contestó, no lo toca", r.direccion.postal, "170515");
}

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;

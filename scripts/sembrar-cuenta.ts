/**
 * Pasa los datos bancarios sueltos a la primera cuenta de cobro.
 *
 * Antes había un solo juego de datos guardado en Settings (`pago_banco`,
 * `pago_numero_cuenta`, …). Ahora son varias cuentas en su propia tabla.
 * Este script mueve lo que ya estaba escrito para que nadie tenga que
 * volver a teclear un número de cuenta — que es justo el dato donde un
 * dígito de menos manda el dinero a otra parte.
 *
 * Se puede correr dos veces sin miedo: si ya hay cuentas, no toca nada.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const yaHay = await prisma.cuentaDeCobro.count();
  if (yaHay > 0) {
    console.log(`Ya hay ${yaHay} cuenta(s). No toco nada.`);
    return;
  }

  const claves = [
    "pago_banco",
    "pago_tipo_cuenta",
    "pago_numero_cuenta",
    "pago_titular",
    "pago_cedula",
    "pago_correo",
  ];
  const filas = await prisma.setting.findMany({ where: { key: { in: claves } } });
  const v = Object.fromEntries(filas.map((f) => [f.key, f.value.trim()]));

  if (!v.pago_banco && !v.pago_numero_cuenta) {
    console.log("No había datos bancarios guardados. Nada que pasar.");
    return;
  }

  const cuenta = await prisma.cuentaDeCobro.create({
    data: {
      banco: v.pago_banco || "Banco",
      tipo: v.pago_tipo_cuenta || null,
      numero: v.pago_numero_cuenta || "",
      titular: v.pago_titular || null,
      cedula: v.pago_cedula || null,
      correo: v.pago_correo || null,
      orden: 0,
    },
  });
  console.log(`Creada: ${cuenta.banco} · ${cuenta.numero}`);

  /*
    Los ajustes viejos se borran. Dejarlos sería tener el mismo dato en
    dos sitios sin que nadie sepa cuál manda — y el día que se corrija
    uno, el otro sigue mintiendo.
  */
  await prisma.setting.deleteMany({ where: { key: { in: claves } } });
  console.log("Borrados los ajustes sueltos que reemplaza.");

  /*
    La nota libre (`bank_details`) se limpia solo si repite el número de
    cuenta que acabamos de mover.

    Antes esa nota era el único sitio donde escribir los datos, así que
    muchas veces los tiene copiados. Ahora saldría debajo de la cuenta
    elegida diciendo otro banco — y el día que se corrija el número
    arriba, la nota seguiría mintiendo abajo. Si dice cualquier otra cosa
    ("solo transferencias", un horario) se respeta: es de la dueña.
  */
  if (cuenta.numero) {
    const nota = await prisma.setting.findUnique({
      where: { key: "bank_details" },
    });
    if (nota?.value.includes(cuenta.numero)) {
      await prisma.setting.delete({ where: { key: "bank_details" } });
      console.log("Borrada la nota vieja, que repetía la misma cuenta.");
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

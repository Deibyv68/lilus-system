// LILUS — Print Agent
// Vive en la PC que tenga la impresora. Pregunta al servidor LILUS cada N
// segundos si hay trabajos pendientes. Cuando los hay, decodifica el PDF y
// lo manda a la impresora MUNBYN vía la cola de Windows.

// Se imprime al arrancar y en el diagnóstico. Sirve para responder de un
// vistazo "¿esta PC tiene el código nuevo o el viejo?", que es la primera
// pregunta cuando algo se comporta distinto en una máquina y no en otra.
const VERSION = "3 — detección por presencia física";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");

// ──────────────────────────────────────────────────────────
// Config — se lee de .env junto al script
// ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  // Se quita el BOM: varios editores de Windows lo escriben al guardar, y
  // son tres bytes invisibles que se pegan al nombre de la primera
  // variable. El archivo se ve perfecto y el agente muere diciendo que
  // falta configuración.
  const lines = fs
    .readFileSync(envPath, "utf-8")
    .replace(/^﻿/, "")
    .split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

const SERVER_URL = (process.env.LILUS_SERVER_URL || "").replace(/\/$/, "");
const TOKEN = process.env.LILUS_AGENT_TOKEN || "";
const POLL_INTERVAL_MS = parseInt(process.env.LILUS_POLL_INTERVAL_MS || "2000", 10);

// Con quién habla el servidor. Por defecto el nombre de la PC en Windows,
// que ya es único y no obliga a inventar nada al instalar. Se puede pisar
// con LILUS_AGENT_NAME si el hostname no dice nada útil.
const AGENT_NAME = (process.env.LILUS_AGENT_NAME || os.hostname() || "pc").trim();

if (!SERVER_URL || !TOKEN) {
  console.error("✗ Falta configuración. Crea .env con LILUS_SERVER_URL y LILUS_AGENT_TOKEN");
  process.exit(1);
}

// ──────────────────────────────────────────────────────────
// Verificación de estado físico de la impresora vía PowerShell.
//
// Estrategia HÍBRIDA:
//   1) Get-PnpDevice — consulta el subsistema USB / Plug and Play.
//      FUNCIONA DESDE LocalSystem SIN NECESIDAD DE LOGIN. Detecta si la
//      impresora está físicamente conectada y encendida.
//   2) Get-CimInstance Win32_Printer — consulta el driver de impresión.
//      Da detalles finos (sin papel, tapa abierta, etc.) pero depende de
//      sesión activa. Si falla o no devuelve nada, confiamos en PnP.
//
// Esto resuelve el problema de que el driver de impresión necesite una
// sesión interactiva para reportar estado correcto. Con PnP sabemos si
// está conectada incluso sin login.
// ──────────────────────────────────────────────────────────
function getPrinterStatus(printerName) {
  return new Promise((resolve) => {
    const escapedName = printerName.replace(/'/g, "''");
    const psScript = `
      $ErrorActionPreference = 'SilentlyContinue';
      $nombre = '${escapedName}';

      $cola = Get-Printer -Name $nombre;
      if (-not $cola) { Write-Output "not_installed|no existe la cola '$nombre' en Windows"; exit; }
      $puerto = [string]$cola.PortName;

      # El hardware que está REALMENTE enchufado ahora.
      #
      # -PresentOnly es la clave: sin él la lista incluye todo lo que
      # alguna vez estuvo conectado. Y se excluye SWD\\, que es la cola de
      # software: esa figura presente y OK aunque la impresora esté
      # desconectada y hasta sin corriente. Era justo lo que hacía que el
      # sistema dijera "lista" con el cable afuera.
      #
      # Se acepta tanto un dispositivo de impresión USB estándar como
      # cualquier cosa presente que lleve el nombre de la impresora,
      # porque no todos los modelos se registran igual.
      $candidatos = @(Get-PnpDevice -PresentOnly | Where-Object {
        $_.InstanceId -notlike 'SWD\\*' -and (
          $_.InstanceId -like 'USBPRINT\\*' -or
          ($_.FriendlyName -and (
            $nombre -like ('*' + $_.FriendlyName + '*') -or
            $_.FriendlyName -like ('*' + $nombre + '*')
          ))
        )
      });

      $detalle = "puerto=$puerto presentes=" + $candidatos.Count;
      if ($candidatos.Count -gt 0) {
        $detalle = $detalle + " [" + (($candidatos | ForEach-Object { $_.FriendlyName + '/' + $_.Status }) -join ', ') + "]";
      }

      if ($puerto -notlike 'USB*') {
        # No es USB (red, archivo, virtual). No se puede usar presencia
        # física, así que se cree lo que diga la cola.
        if ($cola.PrinterStatus -eq 'Error') { Write-Output "error|$detalle no-usb"; exit; }
        Write-Output "ok|$detalle no-usb"; exit;
      }

      if ($candidatos.Count -eq 0) {
        Write-Output "offline|$detalle - nada enchufado con ese nombre"; exit;
      }

      $malos = @($candidatos | Where-Object { $_.Status -eq 'Error' -or $_.Status -eq 'Degraded' });
      if ($malos.Count -gt 0) { Write-Output "error|$detalle dispositivo en estado $($malos[0].Status)"; exit; }

      $vivos = @($candidatos | Where-Object { $_.Status -eq 'OK' });
      if ($vivos.Count -eq 0) {
        Write-Output "offline|$detalle presente pero en estado $($candidatos[0].Status)"; exit;
      }

      # Está físicamente conectada. El driver solo se usa para afinar, nunca
      # para contradecir: Windows informa "lista" de impresoras que no están.
      $p = Get-CimInstance -ClassName Win32_Printer -Filter "Name='$nombre'";
      if ($p -and $p.PrinterStatus -eq 4) { Write-Output "printing|$detalle"; exit; }
      if ($p -and $p.PrinterStatus -eq 6) { Write-Output "stopped|$detalle detenida"; exit; }
      Write-Output "ok|$detalle";
    `.trim();
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        // La consulta va como texto, no como archivo, así que la política
        // de ejecución no debería tocarla. Se pide igual el permiso porque
        // en una PC restringida el costo de equivocarse es que el agente
        // reporte "error" para siempre y no imprima nunca.
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        psScript,
      ],
      { timeout: 8000 },
      (err, stdout) => {
        if (err) {
          resolve({ estado: "error", detalle: `no se pudo consultar: ${err.message}` });
          return;
        }
        // La consulta devuelve "estado|por qué". El motivo se guarda para
        // poder escribirlo en el log: sin él, un "offline" no dice si es
        // que la desenchufaron o que el nombre está mal escrito.
        const linea = (stdout || "").trim().split(/\r?\n/).pop() ?? "";
        const [estado, detalle] = linea.split("|");
        return resolve({
          estado: (estado || "unknown").trim().toLowerCase(),
          detalle: (detalle || "").trim(),
        });
      }
    );
  });
}

// ──────────────────────────────────────────────────────────
// pdf-to-printer (carga perezosa)
// ──────────────────────────────────────────────────────────
let printPdf;
try {
  const ptp = require("pdf-to-printer");
  printPdf = ptp.print;
} catch (e) {
  console.error("✗ Falta dependencia pdf-to-printer. Corre: npm install");
  process.exit(1);
}

// ──────────────────────────────────────────────────────────
// Opciones de impresión por tipo de etiqueta.
// Pasamos paperSize y orientation explícitos al driver para que no
// dependa de configuración default (que puede estar vacía).
// Los nombres de paperSize son los EXACTOS que registra el driver
// MUNBYN — se obtienen con:
//   $wmi = Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Name='Munbyn RW403B-N'"
//   $wmi.PrinterPaperNames
// ──────────────────────────────────────────────────────────
const PRINT_OPTIONS_BY_KIND = {
  "shipping": {
    orientation: "portrait",
    paperSize: '4"*6"(102mm*152mm)',
    scale: "noscale", // PDF generado por nosotros ya es exactamente 4x6
  },
  "expiry-labels": {
    orientation: "landscape",
    paperSize: '2"*1"(51mm*25mm)',
    scale: "noscale", // PDF generado por nosotros ya es exactamente 2x1
  },
  "box-logo": {
    orientation: "portrait",
    paperSize: '2"*2"(51mm*51mm)',
    scale: "noscale", // PDF generado por nosotros ya es exactamente 2x2
  },
  "product-labels": {
    // Etiquetas circulares de jabón impresas en label cuadrado 2"x2" (51mm).
    // Como los PDFs los sube el usuario (pueden ser de tamaño arbitrario),
    // usamos "fit" para que SumatraPDF los escale a 2x2 automáticamente.
    orientation: "portrait",
    paperSize: '2"*2"(51mm*51mm)',
    scale: "fit",
  },
};

// ──────────────────────────────────────────────────────────
// Helper: imprime el PDF
// ──────────────────────────────────────────────────────────
async function printJob(job) {
  const tmpDir = path.join(os.tmpdir(), "lilus-print");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `${job.id}.pdf`);
  fs.writeFileSync(tmpFile, Buffer.from(job.pdfBase64, "base64"));

  const printOpts = PRINT_OPTIONS_BY_KIND[job.kind] || {};

  try {
    const options = {
      printer: job.printerName,
      copies: Math.max(1, job.copies || 1),
      scale: printOpts.scale ?? "noscale",
    };
    if (printOpts.orientation) options.orientation = printOpts.orientation;
    if (printOpts.paperSize) options.paperSize = printOpts.paperSize;

    await printPdf(tmpFile, options);
    console.log(
      `  ✓ Impreso (job ${job.id}, ${job.kind}, ${
        printOpts.paperSize ? `paper=${printOpts.paperSize}, ` : ""
      }${printOpts.orientation ?? "auto"}, scale=${options.scale}, ${
        job.copies
      } copia${job.copies > 1 ? "s" : ""})`
    );
  } finally {
    fs.unlink(tmpFile, () => {});
  }
}

// ──────────────────────────────────────────────────────────
// API client
// ──────────────────────────────────────────────────────────
// El agente le pregunta al server el nombre de la impresora (sin que el
// usuario tenga que duplicar configuración en .env) y luego verifica
// periódicamente con Windows que la impresora esté online.
let cachedPrinterName = null;
let lastConfigFetch = 0;
const CONFIG_FETCH_INTERVAL = 60_000;

async function maybeRefreshConfig() {
  const now = Date.now();
  if (now - lastConfigFetch < CONFIG_FETCH_INTERVAL && cachedPrinterName) {
    return;
  }
  lastConfigFetch = now;
  try {
    const res = await fetch(
      `${SERVER_URL}/api/agent/config?token=${encodeURIComponent(TOKEN)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data?.printerName) cachedPrinterName = data.printerName;
  } catch {}
}

let cachedPrinterStatus = "unknown";
let lastPrinterCheck = 0;
const PRINTER_CHECK_INTERVAL = 10_000;

async function maybeCheckPrinter() {
  const now = Date.now();
  if (now - lastPrinterCheck < PRINTER_CHECK_INTERVAL) return;
  lastPrinterCheck = now;
  if (!cachedPrinterName) return;
  const antes = cachedPrinterStatus;
  let detalle = "";
  try {
    const r = await getPrinterStatus(cachedPrinterName);
    cachedPrinterStatus = r.estado;
    detalle = r.detalle;
  } catch (e) {
    cachedPrinterStatus = "error";
    detalle = e.message;
  }
  // Se avisa el cambio porque es justo lo que se mira al pasar el cable
  // de una PC a la otra: acá se ve cuál de las dos quedó a cargo.
  if (cachedPrinterStatus !== antes) {
    const tomo = ["ok", "printing"].includes(cachedPrinterStatus);
    const teniaAntes = ["ok", "printing"].includes(antes);
    console.log(`   [${cachedPrinterStatus}] ${detalle}`);
    if (tomo && !teniaAntes) {
      console.log(`🖨  Impresora conectada aquí — esta PC toma los trabajos.`);
    } else if (!tomo && teniaAntes) {
      console.log(
        `○  Impresora desconectada (${cachedPrinterStatus}) — los trabajos van a otra PC.`
      );
    }
  }
}

async function pollNext() {
  await maybeRefreshConfig();
  await maybeCheckPrinter();
  // El estado de la impresora no es informativo: es lo que decide si el
  // servidor nos entrega trabajo o no. La PC que no la tiene enchufada
  // recibe 204 siempre, aunque la cola esté llena.
  const url =
    `${SERVER_URL}/api/print-queue?token=${encodeURIComponent(TOKEN)}` +
    `&agent=${encodeURIComponent(AGENT_NAME)}` +
    `&printer=${encodeURIComponent(cachedPrinterStatus)}` +
    `&printerName=${encodeURIComponent(cachedPrinterName || "")}`;
  const res = await fetch(url);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Poll failed: HTTP ${res.status}`);
  return await res.json();
}

async function reportDone(id, success, error) {
  const url = `${SERVER_URL}/api/print-queue/${id}/done?token=${encodeURIComponent(TOKEN)}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success, error: error || undefined }),
  });
}

// ──────────────────────────────────────────────────────────
// Loop principal
// ──────────────────────────────────────────────────────────
let running = false;
let lastErrorLogged = 0;

async function tick() {
  if (running) return;
  running = true;
  try {
    const job = await pollNext();
    if (!job) return;
    console.log(`→ Trabajo recibido: ${job.kind} (impresora: ${job.printerName})`);
    try {
      await printJob(job);
      await reportDone(job.id, true);
    } catch (e) {
      console.error(`  ✗ Error imprimiendo: ${e.message}`);
      await reportDone(job.id, false, e.message);
    }
  } catch (e) {
    // Solo loguear cada 60s si el server está caído, para no inundar logs
    const now = Date.now();
    if (now - lastErrorLogged > 60000) {
      console.error(`✗ Error contactando servidor: ${e.message}`);
      lastErrorLogged = now;
    }
  } finally {
    running = false;
  }
}

// Modo diagnóstico: una foto de lo que ve Windows y se corta.
//
// Sirve para comprobar con la impresora enchufada y desenchufada sin
// tener que leer el log ni esperar los 10 segundos del ciclo normal.
//
//   node agent.js --diagnostico
if (process.argv.includes("--diagnostico")) {
  (async () => {
    console.log("\n═══ Diagnóstico de impresora ═══\n");
    console.log(` Version:   ${VERSION}`);
    console.log(` PC:        ${AGENT_NAME}`);
    console.log(` Servidor:  ${SERVER_URL}`);
    await maybeRefreshConfig();
    console.log(` Impresora configurada en LILUS: ${cachedPrinterName ?? "(no se pudo consultar)"}`);
    if (!cachedPrinterName) {
      console.log("\n No se pudo leer la configuración del servidor.");
      console.log(" Revisá la URL y el token del archivo .env.\n");
      process.exit(1);
    }
    const r = await getPrinterStatus(cachedPrinterName);
    console.log("");
    console.log(` Resultado: ${r.estado.toUpperCase()}`);
    console.log(` Por qué:   ${r.detalle}`);
    console.log("");

    // Volcado crudo: si la detección se equivoca, esto es lo que hace
    // falta para saber cómo se registra esta impresora en esta PC.
    await new Promise((listo) => {
      execFile(
        "powershell.exe",
        [
          "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
          "$ErrorActionPreference='SilentlyContinue';" +
            "Write-Output ' Enchufado ahora mismo (sin las colas de software):';" +
            "Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -notlike 'SWD\\*' -and " +
            "($_.Class -in @('Printer','USBPrint','USB') -or $_.InstanceId -like 'USBPRINT\\*') } | " +
            "Format-Table -AutoSize Status, Class, FriendlyName | Out-String -Width 120",
        ],
        { timeout: 10000 },
        (e, out) => {
          if (out) console.log(out);
          listo();
        }
      );
    });
    console.log(
      ["ok", "printing"].includes(r.estado)
        ? " → Esta PC recibiría los trabajos de impresión.\n"
        : " → Esta PC NO recibiría trabajos. Los toma la otra.\n"
    );
    process.exit(0);
  })();
  return;
}

console.log("════════════════════════════════════════════");
console.log(" LILUS Print Agent");
console.log("════════════════════════════════════════════");
console.log(` Version:   ${VERSION}`);
console.log(` Esta PC:   ${AGENT_NAME}`);
console.log(` Servidor:  ${SERVER_URL}`);
console.log(` Token:     ${TOKEN.slice(0, 4)}…${TOKEN.slice(-4)}`);
console.log(` Polling:   cada ${POLL_INTERVAL_MS}ms`);
console.log(` Token ID:  ${crypto.createHash("sha256").update(TOKEN).digest("hex").slice(0, 8)}`);
console.log("");
console.log(" Solo se imprime en la PC que tenga la impresora enchufada.");
console.log(" Esperando trabajos…");
console.log("");

setInterval(tick, POLL_INTERVAL_MS);
tick();

process.on("SIGINT", () => {
  console.log("\nDeteniendo agente.");
  process.exit(0);
});

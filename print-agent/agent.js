// LILUS — Print Agent
// Vive en la PC del 1er piso. Pregunta al servidor LILUS cada N segundos si
// hay trabajos de impresión pendientes. Cuando los hay, decodifica el PDF y
// lo manda a la impresora MUNBYN vía la cola de Windows.

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
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
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

      # ── Paso 1: Detección PnP (siempre funciona sin login) ──
      $pnp = Get-PnpDevice | Where-Object { $_.FriendlyName -like '*MUNBYN*' -or $_.FriendlyName -like '*Munbyn*' } | Select-Object -First 1;
      if (-not $pnp) { Write-Output 'offline'; exit; }
      if ($pnp.Status -eq 'Error') { Write-Output 'error'; exit; }
      if ($pnp.Status -eq 'Degraded') { Write-Output 'error'; exit; }
      if ($pnp.Status -ne 'OK') {
        # 'Unknown', 'Disabled', etc.
        Write-Output 'offline'; exit;
      }

      # ── Paso 2: Detalle vía Win32_Printer (puede no funcionar sin login) ──
      $p = Get-CimInstance -ClassName Win32_Printer -Filter "Name='${escapedName}'";
      if (-not $p) {
        # PnP la ve pero el driver no está disponible — probablemente
        # falta sesión activa. Confiamos en PnP: está físicamente OK.
        Write-Output 'ok'; exit;
      }

      # Si Win32 dice offline pero PnP la ve presente: ignoramos el
      # Win32 (suele ser falso positivo por falta de sesión).
      if ($p.WorkOffline -eq $true) { Write-Output 'ok'; exit; }

      switch ($p.PrinterStatus) {
        3 { Write-Output 'ok' }
        4 { Write-Output 'printing' }
        5 { Write-Output 'ok' }
        6 { Write-Output 'stopped' }
        7 { Write-Output 'ok' }
        default { Write-Output 'ok' }
      }
    `.trim();
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", psScript],
      { timeout: 8000 },
      (err, stdout) => {
        if (err) {
          resolve("error");
          return;
        }
        const out = (stdout || "").trim().toLowerCase();
        resolve(out || "unknown");
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
  try {
    cachedPrinterStatus = await getPrinterStatus(cachedPrinterName);
  } catch {
    cachedPrinterStatus = "error";
  }
}

async function pollNext() {
  await maybeRefreshConfig();
  await maybeCheckPrinter();
  const url = `${SERVER_URL}/api/print-queue?token=${encodeURIComponent(
    TOKEN
  )}&printer=${encodeURIComponent(cachedPrinterStatus)}`;
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

console.log("════════════════════════════════════════════");
console.log(" LILUS Print Agent");
console.log("════════════════════════════════════════════");
console.log(` Servidor:  ${SERVER_URL}`);
console.log(` Token:     ${TOKEN.slice(0, 4)}…${TOKEN.slice(-4)}`);
console.log(` Polling:   cada ${POLL_INTERVAL_MS}ms`);
console.log(` Token ID:  ${crypto.createHash("sha256").update(TOKEN).digest("hex").slice(0, 8)}`);
console.log("");
console.log(" Esperando trabajos…");
console.log("");

setInterval(tick, POLL_INTERVAL_MS);
tick();

process.on("SIGINT", () => {
  console.log("\nDeteniendo agente.");
  process.exit(0);
});

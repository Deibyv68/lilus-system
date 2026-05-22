// LILUS — Print Agent
// Vive en la PC del 1er piso. Pregunta al servidor LILUS cada N segundos si
// hay trabajos de impresión pendientes. Cuando los hay, decodifica el PDF y
// lo manda a la impresora MUNBYN vía la cola de Windows.

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

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
// Helper: imprime el PDF
// ──────────────────────────────────────────────────────────
async function printJob(job) {
  const tmpDir = path.join(os.tmpdir(), "lilus-print");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, `${job.id}.pdf`);
  fs.writeFileSync(tmpFile, Buffer.from(job.pdfBase64, "base64"));

  try {
    await printPdf(tmpFile, {
      printer: job.printerName,
      copies: Math.max(1, job.copies || 1),
      // Sin escalado: que respete el tamaño del PDF (importante para etiquetas)
      scale: "noscale",
    });
    console.log(`  ✓ Impreso (job ${job.id}, ${job.kind}, ${job.copies} copia${job.copies > 1 ? "s" : ""})`);
  } finally {
    fs.unlink(tmpFile, () => {});
  }
}

// ──────────────────────────────────────────────────────────
// API client
// ──────────────────────────────────────────────────────────
async function pollNext() {
  const res = await fetch(`${SERVER_URL}/api/print-queue?token=${encodeURIComponent(TOKEN)}`);
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

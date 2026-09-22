const net = require('net');
const os = require('os');
const config = require('../config');

const INTERVALO_MS = 8000;
const TIMEOUT_SONDA_MS = 350;

function esIPLocal(ip) {
  if (ip.startsWith('127.') || ip.startsWith('169.254.')) return false;
  const docker = ip.match(/^172\.(\d+)\./);
  if (docker && Number(docker[1]) >= 17 && Number(docker[1]) <= 31) return false;
  return true;
}

function ipsLocales() {
  const resultado = [];
  for (const lista of Object.values(os.networkInterfaces())) {
    for (const n of lista || []) {
      if (n.family === 'IPv4' && !n.internal && esIPLocal(n.address)) {
        resultado.push(n.address);
      }
    }
  }
  return resultado;
}

function subredes() {
  // Asume máscara /24: escanea la subred de cada IP local
  return [...new Set(ipsLocales().map((ip) => ip.split('.').slice(0, 3).join('.')))];
}

function puertos() {
  const extras = (process.env.SCAN_PORTS || '')
    .split(',')
    .map((p) => Number(p.trim()))
    .filter((p) => p > 0 && p < 65536);
  return [...new Set([config.port, ...extras])];
}

function puertoAbierto(ip, puerto) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(TIMEOUT_SONDA_MS);
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('timeout', () => { s.destroy(); resolve(false); });
    s.once('error', () => { s.destroy(); resolve(false); });
    s.connect(puerto, ip);
  });
}

async function identificar(ip, puerto) {
  try {
    const res = await fetch(`http://${ip}:${puerto}/health?simple=1`, {
      signal: AbortSignal.timeout(1500),
    });
    const data = await res.json();
    return res.ok && data.node ? data.node : null;
  } catch {
    return null;
  }
}

const conocidos = new Set();

function registrar(ip, puerto, nodeId) {
  if (nodeId === config.nodeId) return;
  if (conocidos.has(nodeId)) return;
  const url = `http://${ip}:${puerto}`;
  if (config.peers.includes(url)) return;
  conocidos.add(nodeId);
  config.peers.push(url);
  console.log(`[${config.nodeId}] Nodo encontrado: ${nodeId} en ${url}`);
}

async function enParalelo(items, limite, tarea) {
  const cola = [...items];
  const trabajadores = Array.from({ length: Math.min(limite, cola.length) }, async () => {
    while (cola.length > 0) {
      const item = cola.shift();
      if (item !== undefined) await tarea(item);
    }
  });
  await Promise.all(trabajadores);
}

let escaneando = false;

async function escanear() {
  if (escaneando) return;
  escaneando = true;
  try {
    for (const base of subredes()) {
      for (const puerto of puertos()) {
        const ips = [];
        for (let i = 1; i <= 254; i++) ips.push(`${base}.${i}`);
        await enParalelo(ips, 96, async (ip) => {
          if (await puertoAbierto(ip, puerto)) {
            const nodeId = await identificar(ip, puerto);
            if (nodeId) registrar(ip, puerto, nodeId);
          }
        });
      }
    }
  } finally {
    escaneando = false;
  }
}

function iniciar() {
  console.log(`[${config.nodeId}] Descubrimiento automático activo (PEERS=auto)`);
  escanear();
  setInterval(escanear, INTERVALO_MS);
}

module.exports = { iniciar };

const config = require('../config');

async function replicate(message) {
  const envios = config.peers.map(async (peer) => {
    try {
      const res = await fetch(`${peer}/replicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(5000),
      });
      console.log(`[${config.nodeId}] Réplica -> ${peer}: ${res.status}`);
    } catch (err) {
      console.error(`[${config.nodeId}] No se pudo replicar a ${peer}: ${err.message}`);
    }
  });
  await Promise.allSettled(envios);
}

module.exports = { replicate };

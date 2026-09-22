const { Router } = require('express');
const store = require('../services/store');
const config = require('../config');

const router = Router();

router.get('/', async (req, res) => {
  if ('simple' in req.query) {
    return res.json({ node: config.nodeId, status: 'activo' });
  }

  const peers = await Promise.all(
    config.peers.map(async (peer) => {
      try {
        const res = await fetch(`${peer}/health?simple=1`, {
          signal: AbortSignal.timeout(2000),
        });
        const data = await res.json().catch(() => ({}));
        return { peer, node: data.node || null, status: res.ok ? 'activo' : `error-${res.status}` };
      } catch {
        return { peer, node: null, status: 'caído' };
      }
    })
  );

  res.json({
    node: config.nodeId,
    status: 'activo',
    uptime: Math.round(process.uptime()),
    messages: store.count(),
    peers,
  });
});

module.exports = router;

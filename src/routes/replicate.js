const { Router } = require('express');
const store = require('../services/store');
const config = require('../config');

const router = Router();

router.post('/', (req, res) => {
  const message = req.body || {};
  if (!message.id || !message.author || !message.text || !message.timestamp) {
    return res.status(400).json({ error: 'Réplica inválida' });
  }

  const esNuevo = store.save(message);
  if (!esNuevo) {
    return res.status(200).json({ status: 'duplicado-ignorado', node: config.nodeId });
  }

  console.log(`[${config.nodeId}] Réplica guardada: ${message.id} (origen: ${message.origin})`);
  res.status(201).json({ status: 'guardado', node: config.nodeId });
});

module.exports = router;

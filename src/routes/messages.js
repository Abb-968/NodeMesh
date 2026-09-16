const { Router } = require('express');
const { randomUUID } = require('crypto');
const store = require('../services/store');
const { replicate } = require('../services/replication');
const config = require('../config');

const router = Router();

router.post('/', async (req, res) => {
  const { author, text } = req.body || {};
  if (!author || !text) {
    return res.status(400).json({ error: 'Se requieren los campos "author" y "text"' });
  }

  const message = {
    id: randomUUID(),
    author,
    text,
    timestamp: Date.now(),
    origin: config.nodeId,
  };

  store.save(message);
  await replicate(message);

  res.status(201).json(message);
});

router.get('/', (req, res) => {
  res.json({
    node: config.nodeId,
    count: store.count(),
    messages: store.all(),
  });
});

module.exports = router;

const path = require('path');
const express = require('express');
const messagesRouter = require('./routes/messages');
const replicateRouter = require('./routes/replicate');
const healthRouter = require('./routes/health');

const app = express();

app.use(express.json());

app.use('/messages', messagesRouter);
app.use('/replicate', replicateRouter);
app.use('/health', healthRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;

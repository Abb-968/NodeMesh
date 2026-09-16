const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`[${config.nodeId}] Escuchando en el puerto ${config.port}`);
  console.log(`[${config.nodeId}] Nodos pares: ${config.peers.join(', ') || '(ninguno)'}`);
});

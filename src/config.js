const config = {
  nodeId: process.env.NODE_ID || 'nodo-local',
  port: Number(process.env.PORT) || 3000,
  peers: (process.env.PEERS || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean),
};

module.exports = config;

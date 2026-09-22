require('dotenv').config();

const auto = (process.env.PEERS || '').trim().toLowerCase() === 'auto';

const config = {
  nodeId: process.env.NODE_ID || 'nodo-local',
  port: Number(process.env.PORT) || 3000,
  autoDiscovery: auto,
  peers: auto
    ? []
    : (process.env.PEERS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
};

module.exports = config;

// Configuración guiada: pregunta qué nodo es esta PC y crea el .env
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = (q) => new Promise((res) => rl.question(q, res));

(async () => {
  console.log('Configuración automática de NodeMesh (un nodo por PC)\n');
  const letra = (await preguntar('¿Qué nodo es esta PC? [a/b/c/d]: ')).trim().toLowerCase();
  if (!/^[a-z]$/.test(letra)) {
    console.error('Respuesta inválida: escribe una letra (a, b, c, d...).');
    process.exit(1);
  }
  const nodeId = `nodo-${letra}`;
  const env = `# .env de ESTA PC (generado por npm run setup)\nNODE_ID=${nodeId}\nPORT=3001\nPEERS=auto\n`;
  fs.writeFileSync(path.join(__dirname, '..', '.env'), env);
  console.log(`\nListo: .env creado con NODE_ID=${nodeId} y PEERS=auto.`);
  console.log('Los demás nodos se descubrirán solos en la red local.');
  console.log('Ahora ejecuta: npm start\n');
  rl.close();
})();

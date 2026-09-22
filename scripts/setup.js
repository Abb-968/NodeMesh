// Configuración del nodo de esta PC.
// Uso:
//   npm run setup        -> pregunta interactivamente la letra del nodo
//   npm run setup b      -> directo, sin pregunta
// Si ya existe un .env se respeta (edítalo o bórralo para regenerarlo).
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env');

function escribirEnv(letra) {
  const nodeId = `nodo-${letra}`;
  fs.writeFileSync(
    envPath,
    `# .env de ESTA PC (generado por npm run setup)\nNODE_ID=${nodeId}\nPORT=3001\nPEERS=auto\n`,
  );
  console.log(`Listo: .env creado con NODE_ID=${nodeId} y PEERS=auto.`);
  console.log('Los demás nodos se descubrirán solos en la red local.');
  console.log('Ahora ejecuta: npm start');
}

(async () => {
  if (fs.existsSync(envPath)) {
    console.log('Ya existe un .env en esta PC; se respeta.');
    console.log('(Para cambiar el nodo, edítalo o bórralo y vuelve a correr npm run setup.)');
    return;
  }

  let letra = (process.argv[2] || '').trim().toLowerCase();
  if (!letra) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    letra = (await new Promise((res) => rl.question('¿Qué nodo es esta PC? [a/b/c/d]: ', res))).trim().toLowerCase();
    rl.close();
  }

  if (!/^[a-z]$/.test(letra)) {
    console.error('Respuesta inválida: escribe una letra (a, b, c, d...).');
    process.exit(1);
  }

  escribirEnv(letra);
})();

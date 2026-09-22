# NodeMesh en red local: una PC, un nodo

Guía para levantar el sistema con **un nodo por PC** (la forma distribuida "real"): la PC 1 corre solo `nodo-a`, la PC 2 solo `nodo-b`, la PC 3 solo `nodo-c`. Todos usan el **mismo puerto (3001)**; lo que distingue a cada nodo es la IP de su PC.

Cada PC se configura con un archivo `.env` en la raíz del proyecto — no hace falta tocar el código ni exportar variables a mano.

> **Cómo se conectan:** cada nodo replica solo a los que tenga en su lista `PEERS`. Por eso el `.env` de cada PC debe listar las IPs de las **otras dos** PCs.

---

## Paso 0 — Requisitos en cada PC

- Node.js 18 o superior (`node --version`)
- El código del proyecto (clonar el repo o copiar la carpeta) y `npm install`

## Paso 1 — Obtener la IP de cada PC

Ejecutar en **cada una**:

```bash
ip route | awk '/src/ {for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}'
```

Anotar las tres IPs. En esta guía usamos de ejemplo:

| PC | IP de ejemplo | Nodo |
|---|---|---|
| PC 1 | `10.20.8.221` | nodo-a |
| PC 2 | `192.168.1.51` | nodo-b |
| PC 3 | `192.168.1.52` | nodo-c |

## Paso 2 — Crear el `.env` de cada PC

En la raíz del proyecto hay plantillas listas en `envs/`. Cada PC copia la suya y edita los placeholders `IP_NODO_X` por las IPs reales del Paso 1:

```bash
# PC 1
cp envs/nodo-a.env .env

# PC 2
cp envs/nodo-b.env .env

# PC 3
cp envs/nodo-c.env .env
```

Ejemplo del `.env` resultante en la PC 2 (nodo-b):

```bash
NODE_ID=nodo-b
PORT=3001
PEERS=http://10.20.8.221:3001,http://192.168.1.52:3001
```

`10.20.8.221` ya viene precargado en `envs/nodo-b.env` y `envs/nodo-c.env` porque es la IP actual de la PC del nodo A; solo falta completar la IP de la tercera PC. El archivo `.env` está en el `.gitignore`, así que cada PC puede tener el suyo sin conflictos.

## Paso 3 — Arrancar el nodo en cada PC

```bash
npm start
```

El comando lee el `.env` automáticamente (gracias a `dotenv`) y levanta el nodo con la identidad y pares configurados. Para comprobar qué configuración tomó, fíjate en el arranque:

```
[nodo-b] Escuchando en el puerto 3001
[nodo-b] Nodos pares: http://10.20.8.221:3001, http://192.168.1.52:3001
```

## Paso 4 — Firewall (solo si algo marca "caído")

Si el firewall está activo, abrir el puerto en cada PC:

```bash
sudo ufw allow 3001
```

Express ya escucha en todas las interfaces de red, no requiere cambios de código.

## Paso 5 — Verificación

**1. Estado desde cualquier PC:**

```bash
curl http://localhost:3001/health
```

Los dos pares deben aparecer como `"status":"activo"`.

**2. Replicación entre PCs** — desde la PC 1:

```bash
curl -X POST http://localhost:3001/messages \
  -H 'Content-Type: application/json' \
  -d '{"author":"Javier","text":"Hola desde la PC 1"}'

# desde la PC 2, hacia la PC 1:
curl http://10.20.8.221:3001/messages
```

El mensaje enviado en una PC debe verse desde las otras dos.

**3. Interfaz web:** abrir en el navegador de cualquier PC `http://localhost:3001/`, o desde otra PC `http://IP_DE_ESA_PC:3001/`. Cada nodo sirve la misma interfaz Vue.

**4. Con Postman:** cambiar las variables `nodo_a` / `nodo_b` / `nodo_c` del entorno por las URLs reales (`http://10.20.8.221:3001`, etc.) y ejecutar la colección normalmente.

---

## Demo de tolerancia a fallos

Con un nodo por PC es trivial: `Ctrl+C` en la terminal de una PC. Los `/health` de las otras dos la marcarán como `caído` y el chat seguirá funcionando entre ellas. Al reincorporarla (reiniciar `npm start`), volverá a recibir solo los mensajes nuevos (la memoria no persiste).

## Prueba en una sola PC (ensayo sin compañeros)

Sin tocar el modelo de 1 nodo por PC, se pueden simular los 3 nodos en una misma máquina usando puertos distintos **definidos en la terminal** (tienen prioridad sobre el `.env`):

```bash
# Terminal 1
NODE_ID=nodo-a PORT=3001 PEERS=http://localhost:3002,http://localhost:3003 npm start

# Terminal 2
NODE_ID=nodo-b PORT=3002 PEERS=http://localhost:3001,http://localhost:3003 npm start

# Terminal 3
NODE_ID=nodo-c PORT=3003 PEERS=http://localhost:3001,http://localhost:3002 npm start
```

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Un par aparece `caído` en `/health` | Firewall, IP incorrecta o esa PC no tiene su nodo corriendo | Verificar Paso 4, que la IP sea la correcta y que en esa PC `npm start` esté activo |
| El nodo arranca como `nodo-local` en el puerto 3000 | No existe `.env` o no se copió desde `envs/` | Copiar la plantilla del Paso 2 y reiniciar |
| Cambié el `.env` pero sigue la config vieja | Las variables se leen solo al arrancar | Detener (`Ctrl+C`) y volver a correr `npm start` |
| El nodo "nuevo" no tiene mensajes antiguos | El almacén es en memoria | Comportamiento esperado: solo ve los mensajes desde que se unió |
| `EADDRINUSE: puerto en uso` | Otro proceso usa el 3001 | Cambiar el `PORT` en el `.env` y en los `PEERS` de las otras PCs |

## Agregar un cuarto nodo (escalabilidad horizontal)

Levantar el proyecto en una cuarta PC con:

```bash
NODE_ID=nodo-d
PORT=3001
PEERS=http://IP_NODO_A:3001,http://IP_NODO_B:3001,http://IP_NODO_C:3001
```

y agregar `http://IP_NODO_D:3001` al `PEERS` del `.env` de las tres PCs existentes (reiniciándolas). Sin cambiar una sola línea de código.

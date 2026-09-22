# NodeMesh en red local: una PC, un nodo (descubrimiento automático)

Guía para levantar el sistema con **un nodo por PC** (la forma distribuida "real"): la PC 1 corre solo `nodo-a`, la PC 2 solo `nodo-b`, la PC 3 solo `nodo-c`. Todos usan el **mismo puerto (3001)** y, gracias a `PEERS=auto`, **se descubren entre sí solos**: no hay que averiguar IPs ni editar archivos de configuración.

---

## En cada PC: una sola línea

Requisito: Node.js 18 o superior. Con esta única línea cada PC queda montada completa (cada PC cambia la `b` por la letra de su nodo: a, b o c):

```bash
git clone https://github.com/Abb-968/NodeMesh.git && cd NodeMesh && npm install && npm run setup b && npm start
```

Qué hace, paso a paso: clona el repo → instala dependencias → crea el `.env` (nodo-b, puerto 3001, `PEERS=auto`) → arranca el nodo, que también sirve la interfaz web en `http://IP_DE_LA_PC:3001`. Funciona igual en Linux, macOS y Windows (CMD/PowerShell).

Al arrancar verás:

```
[nodo-b] Escuchando en el puerto 3001
[nodo-b] Nodos pares: (descubrimiento automático)
[nodo-b] Descubrimiento automático activo (PEERS=auto)
```

y cuando las otras PCs enciendan su nodo, cada uno los encontrará solo y avisará:

```
[nodo-b] Nodo encontrado: nodo-a en http://192.168.1.50:3001
[nodo-b] Nodo encontrado: nodo-c en http://192.168.1.52:3001
```

> ¿El proyecto ya está clonado en esa PC? Entonces le basta con: `npm install && npm run setup b && npm start`.
> `npm run setup` sin letra pregunta interactivamente en vez de asumir; y si ya existe un `.env` en la PC, lo respeta (para cambiarlo, edítalo o bórralo).

## Firewall (una vez por PC)

El descubrimiento sale de cada PC, pero para que los demás puedan **entrar** hay que permitir el puerto **una sola vez por PC**:

```bash
# Linux
sudo ufw allow 3001
```

**Windows:** la primera vez que `npm start` corre, Windows Defender Firewall muestra un aviso pidiendo permiso para Node.js — marca las casillas y acepta. Si no apareció o lo negaste:

```bat
netsh advfirewall firewall add rule name="NodeMesh" dir=in action=allow protocol=TCP localport=3001
```

(ejecutar CMD/PowerShell **como administrador**)

## Verificación

**1. Estado de tu nodo** (desde cualquier PC):

```bash
curl http://localhost:3001/health
```

Cuando la malla esté completa, `peers` lista a los otros dos con su nombre y `"status":"activo"`.

**2. Replicación entre PCs** — envía desde tu PC:

```bash
curl -X POST http://localhost:3001/messages \
  -H 'Content-Type: application/json' \
  -d '{"author":"Javier","text":"Hola desde mi PC"}'
```

y pide a un compañero que revise la interfaz o el historial en la suya — el mensaje debe aparecer en todas.

**3. Interfaz web:** en el navegador de cualquier PC abre `http://localhost:3001/`; desde otra PC o un teléfono de la misma red, `http://IP_DE_LA_PC:3001/`. Verás los nodos detectados como chips en el encabezado y cada mensaje indica por cuál nodo entró (`vía nodo-x`).

**4. Con Postman:** apunta las variables del entorno a `http://IP_DE_CADA_PC:3001` (la IP se obtiene con `ipconfig` en Windows o `ip route` en Linux) y ejecuta la colección.

---

## Cómo funciona el descubrimiento

Cada ~8 segundos el nodo:

1. Toma sus IPs locales (ignorando localhost y redes de Docker) y asume su subred `/24`.
2. Sondea los 254 equipos de esa subred buscando quién escucha en el puerto 3001.
3. A cada equipo encontrado le pregunta `GET /health?simple=1` para saber **quién es** (su `NODE_ID`).
4. Registra como par a cada nodo nuevo (por identidad, sin duplicados) y desde ese momento replica con él.

Limitaciones: funciona dentro de la misma subred (/24). Si la red aísla equipos entre sí (común en redes institucionales), usa un **hotspot de teléfono** con todas las PCs conectadas — es la forma más confiable para la demo.

## Demo de tolerancia a fallos

Con un nodo por PC es trivial: `Ctrl+C` en la terminal de una PC. Los `/health` de las otras la marcarán `caído` y el chat seguirá funcionando. Al reincorporarla (`npm start`), la red la redescubre sola en pocos segundos (arranca con el historial vacío, como cualquier nodo nuevo).

## Prueba en una sola PC (ensayo sin compañeros)

Sin tocar el modelo de 1 nodo por PC, se pueden simular los 3 nodos en una misma máquina con puertos distintos **definidos en la terminal** (tienen prioridad sobre el `.env`):

```bash
# Terminal 1
NODE_ID=nodo-a PORT=3001 PEERS=http://localhost:3002,http://localhost:3003 npm start

# Terminal 2
NODE_ID=nodo-b PORT=3002 PEERS=http://localhost:3001,http://localhost:3003 npm start

# Terminal 3
NODE_ID=nodo-c PORT=3003 PEERS=http://localhost:3001,http://localhost:3002 npm start
```

En Windows (CMD) los `set` van por separado: `set NODE_ID=nodo-a&& set PORT=3001&& set PEERS=http://localhost:3002,http://localhost:3003&& npm start`.

## Modo manual (alternativa a auto)

Si se prefiere fijar los pares a mano (como hace Docker), basta con listarlos en el `.env`:

```bash
NODE_ID=nodo-b
PORT=3001
PEERS=http://192.168.1.50:3001,http://192.168.1.52:3001
```

Recuerda que cada nodo solo replica a quienes tenga en su lista, y que la lista se lee al arrancar (cámbiala y reinicia). Las IPs se averiguan así:

| Sistema | Comando |
|---|---|
| Linux | `ip route \| awk '/src/ {for(i=1;i<=NF;i++) if($i=="src") {print $(i+1); exit}}'` |
| Windows | `ipconfig` → línea "Dirección IPv4" del adaptador activo |

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Un nodo aparece `caído` en `/health` | Esa PC no tiene su nodo corriendo o su firewall bloquea el 3001 | Paso 2 y Paso 3 en esa PC |
| Ningún nodo encuentra a nadie | Red que aísla equipos (aislamiento de clientes), típico de redes universitarias | Conectar todas las PCs a un **hotspot** de teléfono |
| Los nodos se ven pero con mucho delay | Subred grande o Wi-Fi saturado | Es normal el primer descubrimiento (~8 s); luego es inmediato |
| El nodo arranca como `nodo-local` en el puerto 3000 | No existe `.env` | Correr `npm run setup` (o copiar una plantilla de `envs/`) y reiniciar |
| Cambié el `.env` pero sigue la config vieja | Las variables se leen solo al arrancar | Detener (`Ctrl+C`) y volver a correr `npm start` |
| El nodo "nuevo" no tiene mensajes antiguos | El almacén es en memoria | Comportamiento esperado: solo ve los mensajes desde que se unió |
| `EADDRINUSE: puerto en uso` | Otro proceso usa el 3001 | Cambiar el `PORT` en el `.env` (y ajustar el firewall al nuevo puerto) |

## Agregar un cuarto nodo (escalabilidad horizontal)

Levantar el proyecto en una cuarta PC y contestar `d` en `npm run setup`. Sin configurar nada más: la malla lo descubre y lo integra en vivo. Así de sencillo es escalar horizontalmente con `PEERS=auto`.

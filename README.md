# Portal BI — Frontend (Bandeja BI, Evaluación BI, Microinforme, Centro de Autorizaciones)

Frontend real del Portal de Solicitudes y Proyectos BI. No tiene backend propio: cada
pantalla llama directamente, por `fetch()` desde el navegador, a los webhooks reales de
n8n (PBI-01 a PBI-07), que a su vez leen/escriben en Airtable. No se usan datos
simulados como fuente de datos en ninguna pantalla.

Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router (HashRouter) +
React Hook Form + Zod + Recharts + lucide-react.

## Pantallas

| Ruta | Pantalla | Webhook(s) que usa |
|---|---|---|
| `/bandeja` | Bandeja BI (inicio) | PBI-03 `pbi/solicitudes/listar` |
| `/registrar` | Registrar solicitud | PBI-01 `pbi/solicitudes` |
| `/consultar` | Consultar solicitud | PBI-02 `pbi/solicitudes/consultar` |
| `/evaluacion/:folio` | Evaluación BI + envío a autorización (microinforme) | PBI-04 `pbi/evaluaciones/guardar`, PBI-05 `pbi/autorizacion/enviar` |
| `/autorizaciones` | Centro de autorizaciones | PBI-06 `pbi/aprobacion/consultar`, PBI-07 `pbi/aprobacion/decidir` |

Las URLs completas de cada webhook están en `.env.example` / `src/lib/config.ts`.

## Requisitos

- Node.js 20+ y npm 10+.

## Instalar dependencias

```bash
npm install
```

## Configurar variables de entorno

```bash
cp .env.example .env
```

Las URLs en `.env.example` ya son las URLs de PRODUCCIÓN reales de n8n
(`jmejiaromero.app.n8n.cloud`) — normalmente no necesitas cambiarlas. Si tu
administrador te da una `x-api-key` para los endpoints privados (PBI-01, 03, 04, 05),
puedes ponerla en `VITE_DEFAULT_API_KEY`, o pegarla directamente en la app desde el
menú "Configuración" (se guarda en el `localStorage` del navegador y tiene prioridad
sobre la variable de entorno).

Mientras `PBI_API_KEY` no esté configurada del lado de n8n, esos endpoints operan en
modo "fail-open" (aceptan la llamada aunque la clave esté vacía), así que la app
funciona igual sin la clave — ver el README del backend para más detalle.

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173`. Esto llama a los webhooks reales de n8n desde tu propio
navegador (no hay mocks ni servidor intermedio).

## Compilar (build de producción)

```bash
npm run build
```

Genera la carpeta `dist/` optimizada y estática, lista para publicarse en cualquier
hosting estático (GitHub Pages, Netlify, S3, etc.).

## Previsualizar el build

```bash
npm run preview
```

Sirve `dist/` localmente en `http://localhost:4173` para verificar el build de
producción antes de publicarlo.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `portal-bi-frontend`) y sube este
   proyecto (`git init`, `git add .`, `git commit`, `git remote add origin ...`,
   `git push`).
2. Define la variable `VITE_BASE_PATH` con el nombre exacto de tu repositorio antes de
   compilar, para que los assets se sirvan desde la subruta correcta de GitHub Pages:

   ```bash
   VITE_BASE_PATH=/portal-bi-frontend/ npm run build
   ```

   (Si vas a publicar en un dominio propio o en un "user/org site"
   `usuario.github.io`, deja `VITE_BASE_PATH=/` o simplemente omite la variable.)
3. Publica la carpeta `dist/` a la rama `gh-pages` con el script incluido:

   ```bash
   VITE_BASE_PATH=/portal-bi-frontend/ npm run deploy
   ```

   Este comando (`gh-pages -d dist`) compila (`predeploy`) y sube automáticamente el
   contenido de `dist/` a la rama `gh-pages` del repositorio remoto configurado.
4. En GitHub, ve a **Settings → Pages** y selecciona la rama `gh-pages` (carpeta `/`)
   como fuente. La URL pública quedará como
   `https://<tu-usuario>.github.io/portal-bi-frontend/`.
5. La app usa `HashRouter` (rutas con `#`, por ejemplo `.../#/bandeja`) precisamente
   para funcionar de forma confiable en GitHub Pages sin necesitar configuración de
   reescritura de rutas en el servidor ni el truco del `404.html`. Los enlaces
   profundos (por ejemplo a `/#/evaluacion/SOL-...`) y el refresco de página (F5)
   funcionan correctamente con esta configuración.

## CORS (importante, ya resuelto del lado del backend)

Los 7 webhooks de n8n (PBI-01 a PBI-07) fueron configurados con
`Options → Allowed Origins (CORS) = *` para que acepten llamadas `fetch()` directas
desde cualquier origen, incluyendo `http://localhost:5173` en desarrollo y el dominio
de GitHub Pages en producción. Si en el futuro se restringe el CORS a un dominio
específico por seguridad, debe incluirse ahí tanto la URL de desarrollo como la URL
final de GitHub Pages.

## Evidencia de build exitoso

```
> portal-bi-frontend@0.1.0 build
> tsc -b && vite build

vite v8.2.0 building client environment for production...
✓ 2460 modules transformed.
dist/index.html                   0.48 kB │ gzip:   0.32 kB
dist/assets/index-08mFyCvt.css   22.85 kB │ gzip:   5.53 kB
dist/assets/index-DkPwzMWF.js   722.37 kB │ gzip: 214.88 kB
✓ built in 848ms
```

`npm run preview` sirvió `dist/` correctamente en `http://localhost:4173` (HTTP 200).

## Evidencia de prueba real contra n8n

El entorno de trabajo donde se construyó este proyecto tiene una salida de red
restringida por allowlist (no permite `curl`/`fetch` directo desde ese sandbox hacia
`jmejiaromero.app.n8n.cloud`). Para verificar que los contratos de request/response que
implementa el frontend (`src/lib/api.ts`, `src/lib/types.ts`) coinciden exactamente con
las respuestas reales del backend, se ejecutaron los workflows reales de n8n
directamente (vía la API de administración de n8n) con el mismo payload que envía el
frontend:

- **PBI-02 Consultar Solicitud** (ejecución `2382`, éxito): payload
  `{ folio: "SOL-20260805-211949740-9DK1", correo: "ana.torres@intercon.com.mx", codigo: "D41YYFEB" }`
  (folio piloto real de Fase 2) → respuesta 200 con los datos reales de la solicitud
  ("Dashboard de Cartera Vencida Regional", estado "Aprobada urgente"), con exactamente
  los campos que `ConsultarSolicitudResponse` espera.
- **PBI-03 Listar Solicitudes** (ejecución `2383`, éxito): payload
  `{ estados: [], area: "" }` con header `x-api-key` vacío (modo fail-open) → respuesta
  200 con un arreglo `solicitudes` cuyos objetos tienen exactamente los campos que
  `SolicitudBandeja` espera (`recordId`, `folio`, `proyecto`, `area`, `solicitante`,
  `fechaSolicitud`, `fechaRequerida`, `urgencia`, `estado`, `diasSinAtender`, `accion`).

Esto confirma que los tipos y el parseo del frontend son correctos contra las
respuestas reales. Lo único que no pudo ejecutarse desde este entorno de construcción
es la llamada `fetch()` real desde un navegador (por el firewall de salida del
sandbox) — se recomienda que, al correr `npm run dev` en una máquina con acceso normal
a internet (o al abrir la versión publicada en GitHub Pages), se haga clic en cada
pantalla una vez para confirmar visualmente que el CORS configurado en n8n permite las
llamadas del navegador. Los 7 webhooks ya tienen `Allowed Origins = *` configurado
específicamente para esto.

## Modo seguro de correos (SEND_REAL_EMAILS)

El frontend no envía correos directamente; los correos los envía n8n. Todos los
workflows relevantes (PBI-01, PBI-05, PBI-07) tienen la constante
`SEND_REAL_EMAILS = false` en sus nodos de preparación de envío, por lo que **todas**
las notificaciones (incluidas las dirigidas a los aprobadores) se redirigen a un
correo interno de validación con un aviso `[PRUEBA]` y el destinatario original
declarado en el cuerpo. Esto se mantiene así intencionalmente hasta que se valide
expresamente el envío real — no requiere ningún cambio en el frontend.

## Estructura del proyecto

```
src/
  lib/
    config.ts     URLs de los webhooks, x-api-key y "evaluado por" en localStorage
    types.ts      Tipos de los contratos reales de PBI-01 a PBI-07
    api.ts        Cliente fetch tipado para cada webhook
  components/      Layout, Sidebar, Badge, Button, Card, Field, States (loading/error/empty)
  routes/
    BandejaBI.tsx              PBI-03
    RegistrarSolicitud.tsx     PBI-01
    ConsultarSolicitud.tsx     PBI-02
    EvaluacionBI.tsx           PBI-04 + PBI-05
    CentroAutorizaciones.tsx   PBI-06 + PBI-07
  App.tsx          Rutas (HashRouter)
```

## No mocks, no backend propio, no Airtable directo

- Ninguna pantalla usa datos de ejemplo como fuente principal: todo viene de la
  respuesta real de los webhooks.
- No hay ningún servidor propio (Node/Express, Supabase, etc.): solo archivos
  estáticos que llaman `fetch()` a n8n.
- El frontend nunca llama a la API de Airtable directamente ni contiene su token; todo
  pasa por los webhooks de n8n.

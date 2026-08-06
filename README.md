# Portal BI — Frontend (Bandeja BI, Evaluación BI, Microinforme, Centro de Autorizaciones)

**Repositorio definitivo:** https://github.com/IC-Academy/Jirajorge
**URL pública (GitHub Pages):** https://ic-academy.github.io/Jirajorge/

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

`.env` **nunca** se sube al repositorio (está en `.gitignore`: `.env`, `.env.*`, con
excepción explícita de `!.env.example`) y tampoco se incluye en los ZIP de entrega —
solo `.env.example` se versiona y se entrega. Cada persona que clone o descargue el
proyecto debe crear su propio `.env` local a partir de `.env.example`.

Las URLs en `.env.example` ya son las URLs de PRODUCCIÓN reales de n8n
(`jmejiaromero.app.n8n.cloud`) — normalmente no necesitas cambiarlas. `src/lib/config.ts`
ya **no** tiene URLs de producción "hardcodeadas" como respaldo: las URLs se leen
exclusivamente de las variables `VITE_PBI01_URL` … `VITE_PBI07_URL`. Si falta alguna,
la app no arranca en silencio con una URL equivocada — muestra una pantalla de error
clara (`ConfigError`) listando exactamente qué variable falta.

Si tu administrador te da una `x-api-key` para los endpoints privados (PBI-01, 03, 04,
05), puedes ponerla en `VITE_DEFAULT_API_KEY`, o pegarla directamente en la app desde
el menú "Configuración" (campo de tipo contraseña, con botón para mostrar/ocultar; se
guarda en el `localStorage` del navegador y tiene prioridad sobre la variable de
entorno).

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

## Publicar en GitHub Pages (repositorio IC-Academy/Jirajorge)

Este proyecto se publica sobre el repositorio ya existente
**https://github.com/IC-Academy/Jirajorge**, en la URL
**https://ic-academy.github.io/Jirajorge/**. No se crea un repositorio nuevo.

`vite.config.ts` ya trae `base: "/Jirajorge/"` como valor por defecto (respetando
mayúsculas/minúsculas exactas, ya que GitHub Pages distingue la ruta), así que no hace
falta pasar `VITE_BASE_PATH` a mano salvo que se quiera servir desde otra ruta.

### Método preferido: GitHub Actions (`.github/workflows/deploy.yml`)

El repositorio incluye un workflow listo en `.github/workflows/deploy.yml` que:

1. Se dispara automáticamente en cada `push` a `main` (y también admite disparo manual
   desde la pestaña **Actions** vía `workflow_dispatch`).
2. Instala dependencias con `npm ci`.
3. Ejecuta `npm run build` — si el build falla (error de TypeScript, de Vite, etc.), el
   job falla y **no se publica nada**.
4. Sube `dist/` como artefacto de Pages (`actions/upload-pages-artifact`) y lo despliega
   con `actions/deploy-pages`.

Antes del primer despliegue, configurar en el repositorio:

- **Settings → Pages → Source = "GitHub Actions"** (no "Deploy from a branch").
- **Settings → Secrets and variables → Actions → Variables**, agregar las 7 variables
  con las URLs reales de los webhooks (ver sección "Variables de entorno requeridas
  para el build de CI" más abajo).
- Si se usa `VITE_DEFAULT_API_KEY`, agregarla en la pestaña **Secrets** (no en
  Variables), ya que ese valor sí es sensible.

Con eso configurado, cada `git push origin main` recompila y republica el sitio
automáticamente; no se requiere ningún paso manual adicional.

### Alternativa: `gh-pages` (publicación manual desde tu máquina)

Si se prefiere no usar Actions, el script `npm run deploy` (paquete `gh-pages`) sigue
disponible como alternativa manual:

```bash
npm run deploy
```

Esto compila (`predeploy`) y sube el contenido de `dist/` a la rama `gh-pages`. En ese
caso, **Settings → Pages → Source** debe apuntar a la rama `gh-pages` en vez de a
"GitHub Actions". No usar ambos métodos a la vez para evitar publicaciones que se
pisen entre sí.

### HashRouter

La app usa `HashRouter` (rutas con `#`, por ejemplo `.../#/bandeja`) precisamente para
funcionar de forma confiable en GitHub Pages sin necesitar configuración de
reescritura de rutas en el servidor ni el truco del `404.html`. Bajo
`https://ic-academy.github.io/Jirajorge/`, las rutas quedan como:

- `https://ic-academy.github.io/Jirajorge/#/bandeja`
- `https://ic-academy.github.io/Jirajorge/#/registrar` (registrar solicitud)
- `https://ic-academy.github.io/Jirajorge/#/consultar` (consultar solicitud)
- `https://ic-academy.github.io/Jirajorge/#/autorizaciones` (Centro de autorizaciones;
  también acepta `?token=TOKEN` para autocompletar el token desde el correo)

Los enlaces profundos y el refresco de página (F5) funcionan correctamente con esta
configuración.

## Variables de entorno requeridas para el build de CI

El workflow de GitHub Actions (y cualquier build de producción) necesita estas 7
variables definidas como **Repository variables** (Settings → Secrets and variables →
Actions → Variables) para que `npm run build` no falle con el error de `ConfigError`:

| Variable | Webhook |
|---|---|
| `VITE_PBI01_URL` | PBI-01 Registrar Solicitud |
| `VITE_PBI02_URL` | PBI-02 Consultar Solicitud |
| `VITE_PBI03_URL` | PBI-03 Listar Solicitudes / Bandeja BI |
| `VITE_PBI04_URL` | PBI-04 Guardar Evaluación BI |
| `VITE_PBI05_URL` | PBI-05 Enviar a Autorización / Microinforme |
| `VITE_PBI06_URL` | PBI-06 Consultar Aprobación por token |
| `VITE_PBI07_URL` | PBI-07 Registrar Decisión de aprobador |

Los valores exactos están en `.env.example`. `VITE_DEFAULT_API_KEY` es opcional y, si
se usa, debe configurarse como **Secret** (no como Variable) porque sí es sensible.
`VITE_BASE_PATH` no es necesario definirlo en CI: `vite.config.ts` ya trae
`"/Jirajorge/"` como valor por defecto.

Si falta cualquiera de las 7 variables anteriores, la app no arranca en silencio con
una URL equivocada: `src/lib/config.ts` ya no tiene URLs de producción
"hardcodeadas" como respaldo, y `App.tsx` muestra una pantalla `ConfigError` listando
exactamente qué variable falta.

## CORS — restringido al origen definitivo de GitHub Pages

Los 7 webhooks de n8n (PBI-01 a PBI-07) están configurados con
`Options → Allowed Origins (CORS) = https://ic-academy.github.io` (origen exacto, sin
`/Jirajorge/`, sin rutas, sin `#` ni parámetros — así es como los navegadores envían el
encabezado `Origin`). Esto ya está aplicado y publicado en los 7 workflows.

Notas importantes sobre este valor:

- El origen **no incluye** la ruta del repositorio (`/Jirajorge/`): CORS solo compara
  esquema + host + puerto, nunca la ruta. `https://ic-academy.github.io` es correcto
  para cualquier ruta bajo ese dominio, incluyendo `/Jirajorge/`.
- Si en algún momento se necesita seguir probando localmente
  (`http://localhost:5173`), hay que agregar ese origen también, separado por coma,
  en el nodo Webhook de cada workflow (`Options → Allowed Origins`), por ejemplo:
  `https://ic-academy.github.io,http://localhost:5173`.
- Si se publica una versión de prueba en otro dominio (por ejemplo un preview de
  Netlify), ese origen también debe agregarse explícitamente o las llamadas
  `fetch()` fallarán por CORS desde ese dominio.

La protección real contra escrituras no autorizadas sigue siendo la `x-api-key` (ver
sección de Seguridad más abajo); restringir el CORS es una capa adicional que evita
que páginas de terceros hagan llamadas silenciosas a estos webhooks desde el
navegador de un usuario.

## ⚠️ Seguridad — advertencia técnica importante

Este frontend es un sitio **estático** (HTML/JS/CSS servido desde GitHub Pages, sin
servidor propio). La `x-api-key` que protege los endpoints privados de n8n (PBI-01,
03, 04, 05) se guarda en el `localStorage` del navegador de quien la haya pegado en el
menú "Configuración", y viaja en cada `fetch()` como encabezado `x-api-key`.

**Una API key almacenada y usada así en un frontend estático NO constituye
autenticación segura**, por las siguientes razones:

- Cualquier persona con acceso a las herramientas de desarrollador del navegador (o al
  propio `localStorage`) puede leer la clave en texto plano.
- La clave es la misma para todas las personas que la usan: no hay identidad
  individual, no hay expiración, no hay revocación por usuario, no hay registro de
  quién hizo qué.
- No hay control de acceso por rol: quien tenga la clave puede llamar a cualquiera de
  los endpoints privados, no solo a los que le correspondan por su función.

Esto es aceptable para una **fase piloto interna** con un grupo reducido y de
confianza (como la actual), pero **no es aceptable para una versión productiva** con
más usuarios o datos sensibles. Antes de considerar este portal "productivo", se debe
reemplazar este esquema por una capa de autenticación real, por ejemplo:

- **Microsoft Entra ID** (Azure AD) con OAuth2/OIDC y un backend (aunque sea mínimo,
  tipo Azure Function o API Management) que valide el token antes de reenviar la
  petición a n8n — así cada usuario tiene su propia identidad y los permisos se
  pueden auditar.
- **Cloudflare Access** (o equivalente) delante del dominio de GitHub Pages y/o de los
  webhooks de n8n, exigiendo login corporativo (SSO) antes de servir cualquier
  contenido o aceptar cualquier llamada.
- Cualquier capa autenticada equivalente que reemplace la clave compartida por
  identidad individual verificable.

Los endpoints públicos sin `x-api-key` (PBI-02 Consultar Solicitud, PBI-06 Consultar
Aprobación, PBI-07 Registrar Decisión) están diseñados así intencionalmente: se
protegen con un folio+correo+código de consulta (PBI-02) o con un token de un solo uso
con expiración (PBI-06/07), no con la API key compartida. Esa parte del diseño es
razonable tal cual está; lo que requiere reforzarse antes de producción es el acceso
del Analista BI a los endpoints privados de escritura.

## Enlace de aprobación por correo (token en la URL)

El Centro de Autorizaciones (`/#/autorizaciones`) acepta el token directamente en la
URL: `/#/autorizaciones?token=TOKEN`. Si la pantalla se abre con ese parámetro, lee el
token automáticamente y consulta PBI-06 sin que el aprobador tenga que copiar/pegar
nada. El campo de token manual se mantiene visible como alternativa (por si el enlace
no funciona o el aprobador prefiere pegar el token a mano).

El correo que genera PBI-05 (nodo "Generar Token y Microinforme") ya construye este
enlace (`approvalUrl = PORTAL_BASE_URL + '/#/autorizaciones?token=' + token`) y lo usa
como botón principal ("Revisar y decidir") en el cuerpo del correo, con el enlace de
texto plano y el token en crudo como respaldo. **`PORTAL_BASE_URL` ya tiene el valor
definitivo**: `'https://ic-academy.github.io/Jirajorge'` (sin slash final; el propio
código del nodo agrega `/#/autorizaciones?token=...`). Ya no queda ningún placeholder
tipo `https://REEMPLAZAR-CON-TU-DOMINIO-GITHUB-PAGES` en el workflow publicado.

## Vista previa del microinforme antes de enviar

En Evaluación BI, el botón "Revisar microinforme y enviar" ya no dispara PBI-05
directamente: abre primero una vista previa con el contenido exacto que recibirán
Armando y Gabriel (diagnóstico, solución propuesta, viabilidad, complejidad, horas,
riesgos, dependencias, prioridad sugerida, recomendación y fechas aproximadas — los
mismos campos que arma el nodo de PBI-05), más el encabezado de la solicitud (folio,
proyecto, área, solicitante) obtenido en vivo de PBI-03. El Analista BI debe confirmar
explícitamente ("Confirmar y enviar a Armando y Gabriel") para que se ejecute el envío
real; puede cancelar sin que se dispare nada.

## Bloqueo de tokens ya utilizados (doble respuesta)

El Centro de Autorizaciones ahora distingue tres estados al consultar un token
(PBI-06):

1. **Token pendiente** (`decisionPrevia === 'Pendiente'` o vacío): se muestra el
   microinforme y el formulario normal de "Registrar decisión".
2. **Token ya respondido** (`decisionPrevia` tiene cualquier otro valor, por ejemplo
   `Aprobar` o `Rechazar`): el formulario **se oculta por completo** y en su lugar se
   muestra la tarjeta "Esta autorización ya fue respondida" con la decisión
   registrada. No es posible intentar enviar una segunda decisión desde la interfaz.
3. **Token inválido, usado o expirado** (validado del lado del servidor): PBI-07
   sigue siendo, como antes, la última línea de defensa — el nodo "Validar Vigencia
   Token" rechaza con `410 Token ya fue utilizado` o `410 Token expirado` incluso si,
   por algún motivo, la interfaz llegara a enviar una segunda solicitud. Esto no
   cambió con esta ronda de ajustes: ya funcionaba así antes y se verificó de nuevo
   al revisar el workflow.

## Evidencia de build exitoso

```
> portal-bi-frontend@0.1.0 build
> tsc -b && vite build

vite v8.2.0 building client environment for production...
✓ 2461 modules transformed.
dist/index.html                   0.48 kB │ gzip:   0.32 kB
dist/assets/index-PFb4QOie.css   24.22 kB │ gzip:   5.76 kB
dist/assets/index-C_8sAkbp.js   731.80 kB │ gzip: 217.10 kB
✓ built in 4.57s
```

`npm run preview` sirvió `dist/` correctamente en `http://localhost:4173` (`curl` local
respondió `HTTP 200`). Build re-verificado el 2026-08-05 después de la ronda de
ajustes de seguridad/UX (token en URL, vista previa del microinforme, remoción de
fallbacks de URL, `.env` excluido).

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
específicamente para esto (recordatorio: restringir antes de producción, ver sección
CORS más abajo).

### Prueba del enlace de aprobación completo (token en URL → PBI-06)

Tras agregar el botón de aprobación con token embebido en el correo (PBI-05), se
re-probó el flujo completo contra datos reales de Airtable (folio piloto
`SOL-20260805-211949740-9DK1`, reutilizando el mismo registro de la Fase 2 y
restaurando su estado original al terminar la prueba):

1. **PBI-05** (ejecución `2384`, éxito): payload
   `{ folio: "SOL-20260805-211949740-9DK1", enviadoPor: "Jorge Mejia (prueba revision)" }`
   → generó un token de un solo uso por cada aprobador activo (Gabriel Sabogal,
   Armando Acosta) y un `approvalUrl` con la forma
   `https://REEMPLAZAR-CON-TU-DOMINIO-GITHUB-PAGES/#/autorizaciones?token=<token>`,
   incluido como botón "Revisar y decidir" en el HTML del correo (verificado en la
   salida completa del nodo "Generar Token y Microinforme").
2. **PBI-06** (ejecución `2385`, éxito): se tomó el token real generado en el paso
   anterior y se llamó a Consultar Aprobación con
   `{ token: "m6YGJ7TPG8CMc9H2ev6hHR5SMaT7nxw3QUR82kAe" }` → respondió 200 con el
   microinforme correcto (folio, proyecto, área, solicitante, diagnóstico, solución
   propuesta, etc.), confirmando que el token que viaja en la URL del correo es
   exactamente el que el Centro de Autorizaciones necesita para el auto-consulta al
   cargar `/#/autorizaciones?token=...`.

No fue posible hacer clic físicamente en el botón del correo desde este entorno (el
correo real no se envía mientras `SEND_REAL_EMAILS=false`, y el sandbox de este
entorno no tiene salida de red hacia `n8n.cloud` para un `fetch()` de navegador real),
pero la cadena completa token-generado-por-PBI-05 → token-aceptado-por-PBI-06 quedó
verificada extremo a extremo contra el backend real, que es la parte que realmente
importa para garantizar que el enlace del correo funcionará una vez publicado el
frontend con la `PORTAL_BASE_URL` correcta.

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
  components/      Layout, ConfigError, Badge, Button, Card, Field, States (loading/error/empty)
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

# Implementación backend pendiente: acceso ejecutivo OTP

Este PR agrega el frontend del acceso privado y un dashboard de solicitudes reales, **pero no implementa seguridad de servidor**. No desplegar como autorización efectiva sin cumplir este contrato.

## n8n: webhook VITE_AUTH_URL
POST JSON con campo `action` y HTTPS. Todas las respuestas exitosas incluyen `ok: true`.

- `request-code`: `{action,email}`. Responder uniformemente para correos permitidos y desconocidos. Permitir únicamente las cuentas corporativas registradas para Admin BI, Dirección Financiera y Dirección General. Código aleatorio criptográfico, hash en reposo, TTL 5 min, máximo 5 intentos, cooldown 60 s y límites por IP/correo.
- `verify-code`: `{action,email,code}` → `{ok:true,token,user:{id,email,name,role}}`. El rol viene del catálogo seguro del backend y solo puede ser `admin_bi` o `direccion`. Emitir token opaco aleatorio, expiración e invalidación real por servidor. No devolver claves del catálogo.
- `me`: `{action,token}` → `{ok:true,user}`, solo si la sesión sigue activa.
- `logout`: `{action,token}` → revocar token y responder `{ok:true}`.
- Para errores usar HTTP 4xx/5xx y `{ok:false,error:"..."}`. Configurar CORS restringido al origen del portal.

## Protección obligatoria de datos
**Antes de publicar el cambio**, modificar PBI-03, PBI-04, PBI-05 y cualquier endpoint de lectura/escritura interno: exigir token de sesión verificable en n8n, determinar el rol desde esa sesión y aplicar controles de autorización por operación. No confiar en rutas React, correo del cuerpo ni `x-api-key` compartida en el navegador. En PBI-06/PBI-07 conservar la validación de token de aprobación de un solo uso, vinculada a su aprobador; no sustituirla por el OTP.

El frontend aún usa PBI-03 para los datos del dashboard. Añadir `Authorization: Bearer <token>` a peticiones internas está previsto en el cliente web, pero será seguro solo cuando n8n valide ese encabezado. Permitir acceso a `/registrar` y `/consultar` sin inicio de sesión, siempre con los controles actuales de consulta por folio+correo+código.

## Pendiente para un dashboard de proyectos completo
Crear PBI-08 `cartera/listar` para proyectos con identificador, nombre, responsable, estado, % avance calculado, fecha compromiso y tareas, filtrados/validados por sesión. No atribuir a PBI-03 porcentajes de ejecución que no devuelve.

## Despliegue
Agregar `VITE_AUTH_URL` en GitHub Actions antes de activar la autenticación. Mantener `VITE_*` solo para URLs públicas; nunca colocar secretos, tokens fijos o credenciales de servicio en el bundle. Revisar el archivo `.env` actualmente versionado y rotar cualquier secreto que se hubiera expuesto. Validar tres cuentas reales y accesos denegados en staging antes de mergear.

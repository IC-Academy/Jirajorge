# Migración Jirajorge: n8n + Airtable → Microsoft Fabric

## Arquitectura objetivo (sin n8n)

Frontend React/TypeScript de GitHub Pages → inicio de sesión **Microsoft Entra ID** (MSAL, redirect Authorization Code + PKCE) → **Microsoft Fabric User Data Functions (Python)** → **SQL database in Fabric** (operacional) → OneLake / modelo semántico Power BI (analítica).

**No usar un Lakehouse SQL Analytics Endpoint como base transaccional de la aplicación**. Las funciones pueden leer y escribir en SQL Database de Fabric. Los endpoints de UDF requieren tokens de Entra. El frontend no debe recibir secretos de servicio ni permisos indiscriminados de SQL.

## Estado de esta rama
- Entregados DDL SQL y primeras dos funciones de UDF (lectura de cartera, actualización de actividad con auditoría), **sin publicar**.
- SQL y UDF son artefactos iniciales para ejecutar en tu workspace Fabric: NO se ha creado aún una SQL Database, una UDF ni una conexión desde este chat.
- La aplicación React sigue apuntando al backend anterior hasta que se complete la migración y se cambie de forma controlada. No fusionar esta rama en producción como si estuviera migrada.

## Decisión de identidad: reemplazar OTP de n8n
- Para los tres usuarios internos: Microsoft Entra ID empresarial. Resolverlos por `Oid` + `TenantId`, con asignación de rol en SQL; **no por correo editable del cliente**.
- La UI OTP previa se sustituirá por MSAL con PKCE y los endpoints UDF específicos al momento de configurar tenant, app registration y permisos reales. Fabric UDF no ofrece un endpoint REST anónimo para un formulario público.
- **Solicitud pública sin login**: punto pendiente de arquitectura. Requiere un *ingress* externo autenticado a Fabric (por ejemplo Azure Functions HTTP con protección antiabuso y su propia identidad de servicio) o cambiar el requisito a usuarios corporativos autenticados. No conectar el formulario anónimo directamente a UDF ni a SQL. Si se exige que toda ejecución de negocio viva dentro de Fabric, se debe exigir Entra ID también a solicitantes.

## Fuente existente para migración
Base Airtable "Portal de Proyectos BI" (`appnkOMMKoAQgexMD`): Solicitudes, Evaluaciones BI, Aprobaciones, Proyectos, Actividades, Historial, Usuarios y Áreas, además de dos tablas vacías OTP/sesiones creadas para el enfoque anterior. No borrar ni modificar datos originales hasta validar un paralelo.

### Extracción y carga
1. Exportar Airtable por API paginada, incluyendo IDs, relaciones, registros históricos y fechas con zona horaria.
2. Cargar en tablas `stg_*` con `airtable_record_id` y lote de importación; desduplicar por claves naturales, mapear elecciones, porcentaje `0..1` → `0..100`.
3. Migrar con claves foráneas en orden: Usuarios → Solicitudes → Evaluaciones/Aprobaciones → Proyectos → Actividades → Historial.
4. Reconciliar conteos, importes/porcentajes, claves y relaciones. No destruir origen hasta confirmar.
5. Habilitar UDF, invocación Entra y prueba real por perfil.
6. Mover frontend a adaptador Fabric; probar y después desactivar webhooks de n8n.

## Componentes por desarrollar/verificar
- Crear SQL Database de Fabric y ejecutar `sql/001_jirajorge_schema.sql`; ajustar funciones según configuración real y validar transacciones.
- Completar UDF: registro seguro, consulta por folio, bandeja, evaluación, autorizaciones individuales, listado/actualización de proyectos, Gantt, creación de proyectos aprobados.
- Registrar app en Entra, asignar permisos mínimos, conectar MSAL en GitHub Pages; validar CORS/PKCE.
- Definir si el formulario público se conserva anónimo mediante una entrada externa o se restringe a personal corporativo.
- Correo de confirmación/avisos: integrar Graph/Outlook por servicio autorizado sin secretos en frontend.
- Pruebas E2E y de seguridad + carga/consumo de CU en capacidad F2. El servicio UDF consume capacidad Fabric y tiene límites de ejecución.
- Particularidad regional: Microsoft señala restricciones del botón de prueba en **Mexico Central**; probar función publicada o vía extensión VS Code si corresponde.
- No usar cadenas de conexión de SQL en browser, ni credenciales dentro de .env versionado.

## Fuentes oficiales
- https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/user-data-functions-overview
- https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/user-data-functions-service-limits
- https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/connect-to-data-sources
- https://learn.microsoft.com/en-us/fabric/database/sql/overview

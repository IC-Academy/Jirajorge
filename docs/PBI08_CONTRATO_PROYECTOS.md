# PBI-08 — Contrato de backend de proyectos y actividades (n8n ↔ Airtable)

**Estado:** implementación de servidor pendiente; el frontend ya consume este contrato. El workflow debe publicarse en n8n y configurar su URL HTTPS en `VITE_PROJECTS_URL`. No se debe activar con un simulador.

## Origen de datos comprobado

Base existente: `Portal de Proyectos BI` (`appnkOMMKoAQgexMD`). Ya existen datos de proyectos y actividades reales; **no recrear tablas ni sobreescribir registros**.

| Tabla | ID | Identificador | Columnas para respuesta |
|---|---|---|---|
| Proyectos | `tbliAJp9HfeO0dH3k` | `ID Proyecto` | Proyecto, Área solicitante, Responsable funcional, Patrocinador, Estado proyecto, Prioridad, Avance, Fecha estimada inicio, Fecha estimada entrega, Salud, Bloqueo actual, Próximo hito, Fecha próximo hito |
| Actividades | `tblhqxyFQHg7bDs0i` | `ID Actividad` | ID Proyecto, Actividad, Fase, Responsable, Estado actividad, Avance, Fecha inicio, Fecha fin, Bloqueo |
| Usuarios y Áreas | `tble4AMHspQXxbIlp` | `ID Usuario` | Nombre, Correo, Rol en portal, Activo |
| Historial | `tblhdZRJAqdAfBTuU` | `ID Movimiento` | Tipo de registro, Folio o ID, Tipo de cambio, Valor anterior, Valor nuevo, Justificación, Usuario, Fecha del movimiento |

Airtable devuelve los porcentajes como fracción `0..1` en el campo percent; **convertirlos a `0..100` al responder al frontend**, y al actualizar usar `0..1` en Airtable. Los campos singleSelect se devuelven con objeto `name`; mapear a cadena de texto.

## Seguridad obligatoria (n8n)

- Endpoint `POST` con `Content-Type: application/json` y `Authorization: Bearer <token>`.
- Recuperar una sesión válida, no vencida ni revocada del servidor. Vincular la sesión a un usuario existente y activo del catálogo. Derivar el rol desde el registro, **nunca aceptar `role`, `email`, `managerId` o `isAdmin` enviados por el navegador**.
- `direccion` / `admin_bi` pueden leer todos los proyectos y actividades; **solamente `admin_bi` puede modificar**.
- Responder 401 por token ausente/vencido, 403 por permisos y 400 por campos inválidos. No aceptar claves de Airtable por el navegador.
- Restringir CORS al dominio real GitHub Pages, registrar auditoría en `Historial`; limitar solicitudes.
- Para autorización de proyectos, usar PBI-06/PBI-07 con sus tokens por aprobador, sin dar a todos facultad para votar por otros.

## Acciones y contratos

### `{action:"list"}` — lectura
```json
{
  "ok": true,
  "projects": [{
    "id":"PRY-2026-001","name":"...","area":"...","owner":"...","sponsor":"...",
    "status":"Programado","priority":"Alta","health":"Amarillo","progress":0,
    "startDate":"2026-06-17","dueDate":"2026-07-10","nextMilestone":"...",
    "milestoneDate":"2026-06-18","blocker":""
  }],
  "activities": [{
    "id":"ACT-001-01","projectId":"PRY-2026-001","name":"...","phase":"...",
    "owner":"...","status":"No iniciada","progress":0,
    "startDate":"2026-06-17","dueDate":"2026-06-19","blocker":""
  }]
}
```

**Los ejemplos anteriores son únicamente un contrato de forma; el backend siempre lee los registros vigentes.**

### `{action:"activity-update",id,patch:{status,progress,blocker}}`
Actualizar solo la actividad existente y los 3 campos permitidos. Validar que `status` sea uno de:
`No iniciada`, `En proceso`, `Bloqueada`, `En validación`, `Completada`, `Cancelada`.
`progress` debe ser entero 0..100 y `blocker` texto limitado en longitud. Registrar valor anterior/nuevo en Historial. Devolver `{ok:true}`.

### `{action:"project-update",id,patch:{status,priority,blocker,nextMilestone,milestoneDate}}`
Actualizar solo proyecto existente y estos campos, con auditoría.
Estatus permitidos (Airtable): `Backlog`, `Priorizado`, `Programado`, `En análisis`, `En desarrollo`, `Bloqueado`, `En pausa`, `En pruebas`, `Publicado`, `Cerrado`, `Cancelado`.
Prioridades: `Baja`, `Media`, `Alta`, `Crítica`, `Urgente dirección`.
`milestoneDate` debe ser una fecha ISO `YYYY-MM-DD` o vacío para limpiar, con control explícito.

**Paginación:** el backend debe recorrer todos los registros de ambas tablas (no limitar a primera página). Orden sugerido: posición de backlog y fecha de entrega. Restringir y validar cada error; jamás devolver falsos éxitos.

## Casos que faltan para cierre total
- Crear actividades y proyectos desde el portal con generación de folios atómicos.
- Cierre de solicitud aprobada → creación de proyecto, sin duplicados.
- Dashboard de avance real con datos de Proyectos y Actividades.
- Pruebas de autenticación/revocación, usuarios autorizados, idempotencia, concurrencia, CORS y auditoría.
- Publicación de workflows y su configuración con secretos dentro de n8n.

# Jirajorge — Guion demo ejecutiva · 6 de noviembre de 2026

## Abrir la demo
Abrir `demo/index.html` directamente en Chrome o Edge con doble clic. No requiere internet ni instalar Node. También puede abrirse descargando el HTML independiente de este chat. **No se publica automáticamente en GitHub Pages**: la rama es de demostración y no debe reemplazar producción.

## Guion sugerido (7 minutos)
1. **Ingreso (30 s)**: seleccionar perfil Analista BI. Aclarar que el selector de perfiles es solo para la demo; en producción será Microsoft Entra ID.
2. **Dashboard ejecutivo (1 min)**: observar cartera, avance, vencidos, solicitudes en autorización y alertas. Exportar CSV si se requiere.
3. **Cartera de proyectos (1 min)**: alternar Tabla, Kanban y Gantt. Abrir un proyecto y revisar tareas, hitos, bloqueos y compromiso.
4. **Administrador BI (1 min)**: editar estado o progreso de actividad, registrar una actividad nueva y observar que el cambio se refleja al volver al expediente.
5. **Solicitudes (1 min)**: registrar una solicitud con información precargada del usuario; abrir el folio, pasar a evaluación y a autorización.
6. **Aprobaciones (1 min)**: cambiar perfil a Armando y resolver su solicitud. Cambiar a Gabriel y comprobar que observa el **mismo dashboard** y emite su propia decisión independiente.
7. **Cierre (30 s)**: explicar la siguiente etapa: conectar Microsoft Entra ID y Microsoft Fabric SQL Database + User Data Functions, migrar la cartera real y sustituir todos los datos ilustrativos.

## Comportamiento
Los cambios de la demo se almacenan solo en `localStorage` de ese navegador. `Reiniciar demo` restaura el escenario inicial. Las cifras, correos genéricos, fechas, estados, decisiones y porcentajes son **ilustrativos**; aunque algunos nombres de proyectos corresponden a iniciativas conocidas, esto **no** representa un reporte de producción ni implica consulta de Airtable o Fabric.

## Restricciones y seguridad
- No hay autenticación real ni validación en backend: el selector de perfil no es seguro y no debe usarse en producción.
- No existen envíos de correo, archivos adjuntos, llamadas a APIs ni persistencia compartida entre equipos.
- El archivo es autocontenido y no depende de servicios externos, ideal para evitar fallas de conexión durante la presentación.
- **No fusionar a producción** hasta que se implementen los flujos reales con Entra ID y Fabric.

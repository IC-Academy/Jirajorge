"""Funciones Microsoft Fabric User Data Functions para Jirajorge.

Requiere:
  - Item UDF publicado y SQL Database Fabric con esquema jirajorge.
  - Connection alias EXACTO 'jirajorge_sql' creado en Manage connections.
  - Usuarios EntraOid/tenant verificados y cargados en jirajorge.Usuarios.
  - Invocación autenticada con Microsoft Entra ID (NO anonymous).
  - Contratos y pruebas documentados en fabric/README.md.
No contiene credenciales ni tokens fijos.
"""
import fabric.functions as fn

udf = fn.UserDataFunctions()


def _identity(context):
    user = context.executing_user
    oid = user.get("Oid")
    tenant = user.get("TenantId")
    if not oid or not tenant:
        raise fn.UserThrownError("Identidad corporativa requerida")
    return oid, tenant


def _role(cursor, context):
    oid, tenant = _identity(context)
    cursor.execute(
        """SELECT Rol FROM jirajorge.Usuarios
           WHERE EntraOid = ? AND TenantId = ? AND Activo = 1""", (oid, tenant)
    )
    row = cursor.fetchone()
    if not row:
        raise fn.UserThrownError("Usuario sin acceso al portal")
    return row[0]


def _require(cursor, context, *roles):
    role = _role(cursor, context)
    if role not in roles:
        raise fn.UserThrownError("Operación no autorizada")
    return role


def _as_projects(rows):
    return [
        dict(
            id=r[0], name=r[1], area=r[2] or "", owner=r[3] or "",
            sponsor=r[4] or "", status=r[5], priority=r[6], health=r[7] or "",
            progress=float(r[8]) if r[8] is not None else None,
            startDate=r[9].isoformat() if r[9] else None,
            dueDate=r[10].isoformat() if r[10] else None,
            nextMilestone=r[11] or "", milestoneDate=r[12].isoformat() if r[12] else None,
            blocker=r[13] or "",
        ) for r in rows
    ]


@udf.connection(argName="db", alias="jirajorge_sql")
@udf.context(argName="ctx")
@udf.function()
def list_portfolio(db: fn.FabricSqlConnection, ctx: fn.UserDataFunctionContext) -> dict:
    """Lectura completa del portafolio en una consulta autenticada."""
    conn = db.connect()
    try:
        cursor = conn.cursor()
        _require(cursor, ctx, "admin_bi", "direccion")
        cursor.execute(
            """SELECT Codigo, Nombre, Area, Responsable, Patrocinador,
                      Estado, Prioridad, Salud, Avance, FechaInicio,
                      FechaEntrega, ProximoHito, FechaHito, Bloqueo
               FROM jirajorge.Proyectos ORDER BY FechaEntrega, Codigo"""
        )
        projects = _as_projects(cursor.fetchall())
        cursor.execute(
            """SELECT a.Codigo, p.Codigo, a.Nombre, a.Fase, a.Responsable,
                      a.Estado, a.Avance, a.FechaInicio, a.FechaFin, a.Bloqueo
               FROM jirajorge.Actividades a
               JOIN jirajorge.Proyectos p ON a.ProyectoId=p.ProyectoId
               ORDER BY p.Codigo, a.FechaFin, a.Codigo"""
        )
        activities = [
            dict(
                id=r[0], projectId=r[1], name=r[2], phase=r[3] or "",
                owner=r[4] or "", status=r[5],
                progress=float(r[6]) if r[6] is not None else None,
                startDate=r[7].isoformat() if r[7] else None,
                dueDate=r[8].isoformat() if r[8] else None,
                blocker=r[9] or "",
            ) for r in cursor.fetchall()
        ]
        return {"ok": True, "projects": projects, "activities": activities}
    finally:
        conn.close()


@udf.connection(argName="db", alias="jirajorge_sql")
@udf.context(argName="ctx")
@udf.function()
def change_activity(
    db: fn.FabricSqlConnection, ctx: fn.UserDataFunctionContext,
    activity_code: str, status: str, progress: int, blocker: str
) -> dict:
    """Operación transaccional autorizada; rechazo por actividad inexistente."""
    allowed = {"No iniciada", "En proceso", "Bloqueada", "En validación", "Completada", "Cancelada"}
    if status not in allowed or not isinstance(progress, int) or not 0 <= progress <= 100:
        raise fn.UserThrownError("Estado o avance inválido")
    if len(blocker) > 4000 or len(activity_code) > 32:
        raise fn.UserThrownError("Texto excesivamente largo")
    conn = db.connect()
    try:
        cursor = conn.cursor()
        _require(cursor, ctx, "admin_bi")
        cursor.execute(
            "SELECT ActividadId, Estado, Avance, Bloqueo FROM jirajorge.Actividades WITH (UPDLOCK, ROWLOCK) WHERE Codigo = ?",
            (activity_code,)
        )
        old = cursor.fetchone()
        if not old:
            raise fn.UserThrownError("Actividad no encontrada")
        cursor.execute(
            """UPDATE jirajorge.Actividades
               SET Estado=?, Avance=?, Bloqueo=?, ActualizadoUtc=SYSUTCDATETIME()
               WHERE ActividadId=?""",
            (status, progress, blocker, old[0])
        )
        oid, _ = _identity(ctx)
        cursor.execute(
            """INSERT INTO jirajorge.Historial
               (Entidad, EntidadId, Accion, Anterior, Nuevo, ActorOid)
               VALUES ('Actividad', ?, 'Edición',
                       ?, ?, ?)""",
            (old[0], str({"estado": old[1], "avance": str(old[2]), "bloqueo": old[3]}),
             str({"estado": status, "avance": progress, "bloqueo": blocker}), oid)
        )
        conn.commit()
        return {"ok": True}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

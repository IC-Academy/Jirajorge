-- Microsoft Fabric SQL Database (OLTP) · Jirajorge
-- Ejecutar en nueva SQL database de Fabric, NO en el Warehouse ni Lakehouse SQL endpoint.
-- Idempotencia limitada: creación inicial en DB vacía, revisar antes de ejecutar.
CREATE SCHEMA jirajorge;
GO
CREATE TABLE jirajorge.Usuarios (
    UsuarioId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    EntraOid uniqueidentifier NULL,
    TenantId uniqueidentifier NULL,
    Correo nvarchar(255) NOT NULL UNIQUE,
    Nombre nvarchar(200) NOT NULL,
    Rol varchar(20) NOT NULL CHECK (Rol IN ('admin_bi','direccion','solicitante')),
    Activo bit NOT NULL DEFAULT 1,
    CreadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE jirajorge.Solicitudes (
    SolicitudId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Folio nvarchar(32) NOT NULL UNIQUE,
    Proyecto nvarchar(250) NOT NULL,
    Area nvarchar(150) NOT NULL,
    Solicitante nvarchar(200) NOT NULL,
    Correo nvarchar(255) NOT NULL,
    TipoProyecto nvarchar(100) NOT NULL,
    ProblemaActual nvarchar(max) NOT NULL,
    ResultadoEsperado nvarchar(max) NOT NULL,
    Beneficio nvarchar(max) NULL,
    FechaRequerida date NULL,
    Urgencia nvarchar(30) NOT NULL,
    Estado nvarchar(60) NOT NULL DEFAULT 'Nueva',
    CodigoConsultaHash varbinary(32) NULL,
    CreadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ActualizadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE jirajorge.Evaluaciones (
    EvaluacionId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    SolicitudId uniqueidentifier NOT NULL REFERENCES jirajorge.Solicitudes(SolicitudId),
    Diagnostico nvarchar(max) NOT NULL,
    SolucionPropuesta nvarchar(max) NOT NULL,
    Viabilidad nvarchar(50) NULL,
    HorasEstimadas decimal(12,2) NULL,
    Recomendacion nvarchar(100) NULL,
    EvaluadorId uniqueidentifier NOT NULL REFERENCES jirajorge.Usuarios(UsuarioId),
    CreadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE jirajorge.Aprobaciones (
    AprobacionId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    SolicitudId uniqueidentifier NOT NULL REFERENCES jirajorge.Solicitudes(SolicitudId),
    AprobadorId uniqueidentifier NOT NULL REFERENCES jirajorge.Usuarios(UsuarioId),
    Decision nvarchar(70) NOT NULL DEFAULT 'Pendiente',
    Comentarios nvarchar(max) NULL,
    DecididoUtc datetime2 NULL,
    CONSTRAINT UQ_Aprobaciones_Solicitud_Aprobador UNIQUE(SolicitudId,AprobadorId)
);
CREATE TABLE jirajorge.Proyectos (
    ProyectoId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Codigo nvarchar(32) NOT NULL UNIQUE,
    SolicitudId uniqueidentifier NULL REFERENCES jirajorge.Solicitudes(SolicitudId),
    Nombre nvarchar(250) NOT NULL,
    Area nvarchar(150) NULL,
    Responsable nvarchar(200) NULL,
    Patrocinador nvarchar(200) NULL,
    Estado nvarchar(40) NOT NULL DEFAULT 'Backlog',
    Prioridad nvarchar(30) NOT NULL DEFAULT 'Media',
    Salud nvarchar(20) NULL,
    Avance decimal(5,2) NULL CHECK(Avance BETWEEN 0 AND 100),
    FechaInicio date NULL,
    FechaEntrega date NULL,
    ProximoHito nvarchar(250) NULL,
    FechaHito date NULL,
    Bloqueo nvarchar(max) NULL,
    ModificadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE jirajorge.Actividades (
    ActividadId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Codigo nvarchar(32) NOT NULL UNIQUE,
    ProyectoId uniqueidentifier NOT NULL REFERENCES jirajorge.Proyectos(ProyectoId),
    Nombre nvarchar(250) NOT NULL,
    Fase nvarchar(60) NULL,
    Responsable nvarchar(200) NULL,
    Estado nvarchar(40) NOT NULL DEFAULT 'No iniciada',
    Avance decimal(5,2) NULL CHECK(Avance BETWEEN 0 AND 100),
    FechaInicio date NULL,
    FechaFin date NULL,
    Bloqueo nvarchar(max) NULL,
    ActualizadoUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE jirajorge.Historial (
    MovimientoId uniqueidentifier NOT NULL DEFAULT NEWID() PRIMARY KEY,
    Entidad nvarchar(60) NOT NULL,
    EntidadId uniqueidentifier NOT NULL,
    Accion nvarchar(80) NOT NULL,
    Anterior nvarchar(max) NULL,
    Nuevo nvarchar(max) NULL,
    ActorOid uniqueidentifier NULL,
    FechaUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UX_Usuarios_TenantOid ON jirajorge.Usuarios(TenantId, EntraOid) WHERE TenantId IS NOT NULL AND EntraOid IS NOT NULL;
CREATE UNIQUE INDEX UX_Proyectos_SolicitudOrigen ON jirajorge.Proyectos(SolicitudId) WHERE SolicitudId IS NOT NULL;
CREATE INDEX IX_Actividades_Proyecto ON jirajorge.Actividades(ProyectoId);
CREATE INDEX IX_Solicitudes_Estado ON jirajorge.Solicitudes(Estado,CreadoUtc);
CREATE INDEX IX_Proyectos_Estado ON jirajorge.Proyectos(Estado,FechaEntrega);
CREATE INDEX IX_Aprobaciones_Aprobador ON jirajorge.Aprobaciones(AprobadorId,Decision);
GO
-- Los tres usuarios se migran desde Airtable después de comprobar los OID reales de Entra;
-- NUNCA inferir EntraOid a partir del correo, ni insertar usuarios administrativos de demostración.

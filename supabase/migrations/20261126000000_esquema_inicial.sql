-- Plataforma SG-SST: esquema inicial
-- Multiempresa: cada fila lleva empresa_id y la seguridad a nivel de fila (RLS)
-- garantiza que un usuario solo vea las empresas de las que es miembro.
-- Conservación: los registros y evidencias no se borran; se anulan
-- (Decreto 1072 de 2015, art. 2.2.4.6.13: conservación mínima de 20 años).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type rol_miembro as enum ('ADMIN', 'RESPONSABLE_SST', 'COPASST', 'TRABAJADOR', 'CONSULTA');
create type grupo_estandares as enum ('7', '21', '60');
create type estado_item as enum ('CUMPLE', 'NO_CUMPLE', 'NO_APLICA');
create type valoracion as enum ('CRITICO', 'MODERADAMENTE_ACEPTABLE', 'ACEPTABLE');
create type tipo_documento as enum ('MANUAL', 'POLITICA', 'REGLAMENTO', 'PROCEDIMIENTO', 'PROGRAMA', 'PLAN', 'FORMATO');
create type estado_documento as enum ('BORRADOR', 'EN_REVISION', 'VIGENTE', 'OBSOLETO');
create type tipo_indicador as enum ('ESTRUCTURA', 'PROCESO', 'RESULTADO');
create type periodicidad as enum ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
create type sentido_meta as enum ('MAYOR_O_IGUAL', 'MENOR_O_IGUAL');
create type tipo_accion as enum ('CORRECTIVA', 'PREVENTIVA', 'MEJORA');
create type estado_accion as enum ('ABIERTA', 'EN_CURSO', 'CERRADA', 'VERIFICADA_EFICAZ', 'NO_EFICAZ');

-- ---------------------------------------------------------------------------
-- Empresas y miembros
-- ---------------------------------------------------------------------------
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nit text not null unique,
  razon_social text not null,
  actividades_ciiu text[] not null default '{}',
  clase_riesgo smallint not null check (clase_riesgo between 1 and 5),
  numero_trabajadores integer not null check (numero_trabajadores >= 1),
  usar_tabla_completa boolean not null default false,
  arl text,
  representante_legal text,
  responsable_sst text,
  direccion text,
  municipio text,
  departamento text,
  telefono text,
  -- Ruta del logo en el bucket "logos"; se imprime en el encabezado de cada PDF.
  logo_path text,
  -- Carpeta de Drive donde se replican las evidencias (opcional).
  drive_folder_id text,
  creado_en timestamptz not null default now()
);

create table miembros (
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol rol_miembro not null,
  creado_en timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

create or replace function es_miembro(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where empresa_id = eid and user_id = auth.uid());
$$;

create or replace function puede_editar(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros
    where empresa_id = eid and user_id = auth.uid() and rol in ('ADMIN', 'RESPONSABLE_SST')
  );
$$;

-- Función aparte para que la política de "miembros" no se consulte a sí misma (recursión infinita).
create or replace function es_admin(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from miembros where empresa_id = eid and user_id = auth.uid() and rol = 'ADMIN');
$$;

-- Cualquier miembro (incluidos trabajadores) puede diligenciar formatos en la app.
create or replace function puede_registrar(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from miembros
    where empresa_id = eid and user_id = auth.uid() and rol <> 'CONSULTA'
  );
$$;

create table trabajadores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  documento text not null,
  nombres text not null,
  cargo text,
  area text,
  fecha_ingreso date,
  fecha_retiro date,
  user_id uuid references auth.users(id),
  unique (empresa_id, documento)
);

-- ---------------------------------------------------------------------------
-- Listado maestro de documentos (copia por empresa de la plantilla base)
-- ---------------------------------------------------------------------------
create table documentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  tipo tipo_documento not null,
  items text[] not null default '{}',
  version text not null default '1',
  fecha_version date not null default current_date,
  estado estado_documento not null default 'BORRADOR',
  elaboro text,
  reviso text,
  aprobo text,
  formulario_digital boolean not null default false,
  -- Archivo editable o PDF cargado por la empresa (bucket "documentos").
  archivo_path text,
  mejora_sugerida text,
  activo boolean not null default true,
  actualizado_en timestamptz not null default now(),
  unique (empresa_id, codigo)
);

create table documento_versiones (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos(id) on delete cascade,
  version text not null,
  fecha date not null,
  descripcion_cambio text not null,
  archivo_path text,
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Autoevaluación de estándares mínimos
-- ---------------------------------------------------------------------------
create table autoevaluaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  anio smallint not null,
  grupo grupo_estandares not null,
  porcentaje numeric(5, 2),
  valoracion valoracion,
  cerrada boolean not null default false,
  fecha_cierre date,
  creado_en timestamptz not null default now(),
  unique (empresa_id, anio)
);

create table autoevaluacion_respuestas (
  autoevaluacion_id uuid not null references autoevaluaciones(id) on delete cascade,
  codigo text not null,
  estado estado_item not null,
  justificacion text,
  observacion text,
  actualizado_en timestamptz not null default now(),
  primary key (autoevaluacion_id, codigo)
);

-- ---------------------------------------------------------------------------
-- Registros diligenciados (formatos digitales de la app) y evidencias
-- ---------------------------------------------------------------------------
create table registros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  documento_id uuid not null references documentos(id),
  fecha date not null default current_date,
  datos jsonb not null default '{}',
  -- [{ nombre, documento, cargo, firma_path, firmado_en }]
  firmas jsonb not null default '[]',
  creado_por uuid references auth.users(id),
  creado_en timestamptz not null default now(),
  -- Los registros no se eliminan: se anulan con motivo.
  anulado boolean not null default false,
  motivo_anulacion text
);

create table evidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  item_codigo text,
  documento_id uuid references documentos(id),
  registro_id uuid references registros(id),
  nombre text not null,
  archivo_path text not null,
  tipo_mime text not null,
  tamano_bytes bigint not null check (tamano_bytes > 0),
  sha256 text,
  subido_por uuid references auth.users(id),
  subido_en timestamptz not null default now(),
  anulado boolean not null default false,
  motivo_anulacion text
);

create or replace function impedir_borrado() returns trigger language plpgsql as $$
begin
  raise exception 'Los % del SG-SST se conservan por 20 años: anúlelo en lugar de borrarlo', tg_table_name;
end;
$$;

create trigger registros_sin_borrado before delete on registros
  for each row execute function impedir_borrado();
create trigger evidencias_sin_borrado before delete on evidencias
  for each row execute function impedir_borrado();

-- ---------------------------------------------------------------------------
-- Indicadores
-- ---------------------------------------------------------------------------
-- Datos mensuales para los indicadores mínimos (Resolución 0312, art. 30).
create table datos_mes (
  empresa_id uuid not null references empresas(id) on delete cascade,
  anio smallint not null,
  mes smallint not null check (mes between 1 and 12),
  trabajadores integer not null check (trabajadores >= 0),
  accidentes integer not null default 0,
  accidentes_mortales integer not null default 0,
  dias_incapacidad_at integer not null default 0,
  dias_cargados integer not null default 0,
  dias_ausencia_causa_medica integer not null default 0,
  dias_programados integer not null default 0,
  casos_nuevos_el integer not null default 0,
  casos_totales_el integer not null default 0,
  primary key (empresa_id, anio, mes)
);

create table kpi_definiciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  tipo tipo_indicador not null,
  objetivo text not null,
  numerador text not null,
  denominador text not null,
  factor numeric not null default 100,
  unidad text not null default '%',
  meta numeric not null,
  sentido sentido_meta not null,
  periodicidad periodicidad not null,
  item_estandar text,
  fuente text,
  activo boolean not null default true,
  unique (empresa_id, codigo)
);

create table kpi_mediciones (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpi_definiciones(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fin date not null,
  numerador numeric not null,
  denominador numeric not null,
  valor numeric not null,
  cumple_meta boolean not null,
  analisis text,
  registrado_en timestamptz not null default now(),
  unique (kpi_id, periodo_inicio)
);

-- ---------------------------------------------------------------------------
-- Plan anual y acciones correctivas, preventivas y de mejora
-- ---------------------------------------------------------------------------
create table plan_actividades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  anio smallint not null,
  actividad text not null,
  item_estandar text,
  responsable text,
  recursos text,
  fecha_programada date not null,
  fecha_ejecucion date,
  evidencia_id uuid references evidencias(id)
);

create table acciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo tipo_accion not null,
  origen text not null,
  descripcion text not null,
  causa_raiz text,
  item_estandar text,
  responsable text,
  fecha_limite date not null,
  fecha_cierre date,
  estado estado_accion not null default 'ABIERTA',
  verificacion_eficacia text,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seguridad a nivel de fila
-- ---------------------------------------------------------------------------
alter table empresas enable row level security;
alter table miembros enable row level security;
alter table trabajadores enable row level security;
alter table documentos enable row level security;
alter table documento_versiones enable row level security;
alter table autoevaluaciones enable row level security;
alter table autoevaluacion_respuestas enable row level security;
alter table registros enable row level security;
alter table evidencias enable row level security;
alter table datos_mes enable row level security;
alter table kpi_definiciones enable row level security;
alter table kpi_mediciones enable row level security;
alter table plan_actividades enable row level security;
alter table acciones enable row level security;

create policy empresas_leer on empresas for select using (es_miembro(id));
create policy empresas_editar on empresas for update using (puede_editar(id)) with check (puede_editar(id));

create policy miembros_leer on miembros for select using (es_miembro(empresa_id));
create policy miembros_admin on miembros for all
  using (es_admin(empresa_id)) with check (es_admin(empresa_id));

-- Tablas con empresa_id: leer si es miembro; escribir si puede editar.
do $$
declare t text;
begin
  foreach t in array array['trabajadores', 'documentos', 'autoevaluaciones', 'datos_mes',
                           'kpi_definiciones', 'plan_actividades', 'acciones']
  loop
    execute format('create policy %1$s_leer on %1$I for select using (es_miembro(empresa_id))', t);
    execute format('create policy %1$s_escribir on %1$I for all using (puede_editar(empresa_id)) with check (puede_editar(empresa_id))', t);
  end loop;
end $$;

-- Registros y evidencias: cualquier miembro activo puede crearlos (app de campo).
create policy registros_leer on registros for select using (es_miembro(empresa_id));
create policy registros_crear on registros for insert with check (puede_registrar(empresa_id) and creado_por = auth.uid());
create policy registros_anular on registros for update using (puede_editar(empresa_id)) with check (puede_editar(empresa_id));

create policy evidencias_leer on evidencias for select using (es_miembro(empresa_id));
create policy evidencias_crear on evidencias for insert with check (puede_registrar(empresa_id) and subido_por = auth.uid());
create policy evidencias_anular on evidencias for update using (puede_editar(empresa_id)) with check (puede_editar(empresa_id));

-- Tablas hijas: heredan el permiso de su padre.
create policy versiones_leer on documento_versiones for select
  using (exists (select 1 from documentos d where d.id = documento_id and es_miembro(d.empresa_id)));
create policy versiones_escribir on documento_versiones for all
  using (exists (select 1 from documentos d where d.id = documento_id and puede_editar(d.empresa_id)))
  with check (exists (select 1 from documentos d where d.id = documento_id and puede_editar(d.empresa_id)));

create policy respuestas_leer on autoevaluacion_respuestas for select
  using (exists (select 1 from autoevaluaciones a where a.id = autoevaluacion_id and es_miembro(a.empresa_id)));
create policy respuestas_escribir on autoevaluacion_respuestas for all
  using (exists (select 1 from autoevaluaciones a where a.id = autoevaluacion_id and not a.cerrada and puede_editar(a.empresa_id)))
  with check (exists (select 1 from autoevaluaciones a where a.id = autoevaluacion_id and not a.cerrada and puede_editar(a.empresa_id)));

create policy mediciones_leer on kpi_mediciones for select
  using (exists (select 1 from kpi_definiciones k where k.id = kpi_id and es_miembro(k.empresa_id)));
create policy mediciones_escribir on kpi_mediciones for all
  using (exists (select 1 from kpi_definiciones k where k.id = kpi_id and puede_editar(k.empresa_id)))
  with check (exists (select 1 from kpi_definiciones k where k.id = kpi_id and puede_editar(k.empresa_id)));

-- ---------------------------------------------------------------------------
-- Almacenamiento de archivos: la primera carpeta de la ruta es el empresa_id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('logos', 'logos', false),
  ('documentos', 'documentos', false),
  ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy archivos_leer on storage.objects for select
  using (bucket_id in ('logos', 'documentos', 'evidencias')
         and es_miembro(((storage.foldername(name))[1])::uuid));

create policy archivos_subir on storage.objects for insert
  with check (
    (bucket_id = 'evidencias' and puede_registrar(((storage.foldername(name))[1])::uuid))
    or (bucket_id in ('logos', 'documentos') and puede_editar(((storage.foldername(name))[1])::uuid))
  );
-- Sin políticas de update/delete en storage: los archivos cargados no se reemplazan ni se borran.

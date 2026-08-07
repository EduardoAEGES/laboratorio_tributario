-- =====================================================================
-- SIMULADOR SUNAT - Multiusuario, roles, matriculas y reinicio de avance
-- Proyecto: klmjmlhwuzhymrplemgw
-- Ejecutar DESPUES de haber cargado la data (00 a 20).
--
-- Modelo:
--   Capa 1 (identidad)  : usuarios.tipo = 'PERSONA'   -> usuario + clave propios + rol
--   Capa 2 (aplicativo) : usuarios.tipo = 'CLAVE_SOL' -> RUC + SIST + NORTON (elige empresa)
--   El avance se guarda por (usuario_persona, ruc): independiente por alumno y por empresa.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Ajustes a la tabla usuarios
-- ---------------------------------------------------------------------
alter table public.usuarios add column if not exists tipo text not null default 'PERSONA';
alter table public.usuarios add column if not exists creado_por bigint;
alter table public.usuarios add column if not exists ultimo_acceso timestamptz;

-- Las 10 filas SIST/NORTON no son personas: son la Clave SOL de cada empresa
update public.usuarios
   set tipo = 'CLAVE_SOL'
 where upper(usuario) = 'SIST' and clave = 'NORTON';

-- Rol legado 'USUARIO' -> 'ESTUDIANTE'; los nuevos registros nacen como INVITADO
update public.usuarios set rol = 'ESTUDIANTE' where rol = 'USUARIO';
alter table public.usuarios alter column rol set default 'INVITADO';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_usuarios_tipo') then
    alter table public.usuarios
      add constraint ck_usuarios_tipo check (tipo in ('PERSONA', 'CLAVE_SOL'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_usuarios_rol') then
    alter table public.usuarios
      add constraint ck_usuarios_rol check (rol in
        ('INVITADO','ESTUDIANTE','ASISTENTE','PRO','DOCENTE','PRUEBA','MASTER'));
  end if;
end $$;

-- Un mismo nombre de usuario no se puede repetir entre personas
create unique index if not exists ux_usuarios_persona
  on public.usuarios (upper(usuario)) where tipo = 'PERSONA';
-- Una sola Clave SOL por RUC
create unique index if not exists ux_usuarios_clave_sol
  on public.usuarios (ruc) where tipo = 'CLAVE_SOL';

-- ---------------------------------------------------------------------
-- 2) Secciones y matriculas (DOCENTE <-> ESTUDIANTE)
-- ---------------------------------------------------------------------
create table if not exists public.secciones (
  id                bigint generated always as identity primary key,
  docente_id        bigint not null references public.usuarios(id) on delete cascade,
  nombre            text   not null,
  curso             text,
  ciclo             text,
  codigo_matricula  text   not null unique,
  activa            boolean not null default true,
  creado_at         timestamptz not null default now()
);
create index if not exists ix_secciones_docente on public.secciones (docente_id);

create table if not exists public.matriculas (
  id             bigint generated always as identity primary key,
  seccion_id     bigint not null references public.secciones(id) on delete cascade,
  estudiante_id  bigint not null references public.usuarios(id) on delete cascade,
  estado         text   not null default 'ACTIVA' check (estado in ('ACTIVA','RETIRADA')),
  matriculado_at timestamptz not null default now(),
  retirado_at    timestamptz,
  unique (seccion_id, estudiante_id)
);
create index if not exists ix_matriculas_estudiante on public.matriculas (estudiante_id);

-- ---------------------------------------------------------------------
-- 3) Avance por usuario y empresa (reemplaza a sire_estado)
--    modulo: 'sire' | 'rvie' | 'rce' | 'plame' | 'tregistro' | 'declaraciones' | 'ajustes' ...
-- ---------------------------------------------------------------------
create table if not exists public.avance_usuario (
  id              bigint generated always as identity primary key,
  usuario_id      bigint not null references public.usuarios(id) on delete cascade,
  ruc             text   not null,
  modulo          text   not null,
  estado          jsonb  not null default '{}'::jsonb,
  actualizado_at  timestamptz not null default now(),
  unique (usuario_id, ruc, modulo)
);
create index if not exists ix_avance_usuario_ruc on public.avance_usuario (usuario_id, ruc);

-- ---------------------------------------------------------------------
-- 4) Declaraciones presentadas (para calificar contra resumen_fv621 / fv710)
-- ---------------------------------------------------------------------
create table if not exists public.declaraciones (
  id               bigint generated always as identity primary key,
  usuario_id       bigint not null references public.usuarios(id) on delete cascade,
  ruc              text   not null,
  formulario       text   not null check (formulario in
                     ('FV621','FV710','PLAME','TREGISTRO','SEE-SOL','OTRO')),
  periodo          text,
  nro_orden        text,
  rectificatoria   boolean not null default false,
  datos            jsonb   not null default '{}'::jsonb,
  importe_a_pagar  double precision,
  estado           text    not null default 'PRESENTADA'
                     check (estado in ('BORRADOR','PRESENTADA','ANULADA')),
  puntaje          numeric,
  observacion      text,
  presentado_at    timestamptz not null default now()
);
create unique index if not exists ux_declaracion
  on public.declaraciones (usuario_id, ruc, formulario, coalesce(periodo,''), coalesce(nro_orden,''));
create index if not exists ix_declaraciones_usuario on public.declaraciones (usuario_id, ruc);

-- ---------------------------------------------------------------------
-- 5) Capa propia del alumno sobre la data base (que es de solo lectura)
--    Aqui van los comprobantes que emite, las anulaciones, altas y ceses
--    de trabajadores, etc. La data base (registro_ventas, t_registro...)
--    nunca se toca.
-- ---------------------------------------------------------------------
create table if not exists public.movimientos_usuario (
  id          bigint generated always as identity primary key,
  usuario_id  bigint not null references public.usuarios(id) on delete cascade,
  ruc         text   not null,
  entidad     text   not null check (entidad in
                ('VENTA','COMPRA','TRABAJADOR','PLANILLA','DETRACCION','OTRO')),
  accion      text   not null check (accion in ('ALTA','MODIFICA','ANULA')),
  ref         text,               -- id_venta / id_compra / id_trabajador afectado
  periodo     text,
  datos       jsonb  not null default '{}'::jsonb,
  creado_at   timestamptz not null default now()
);
create index if not exists ix_mov_usuario on public.movimientos_usuario (usuario_id, ruc, entidad);

-- ---------------------------------------------------------------------
-- 6) Bitacora de reinicios
-- ---------------------------------------------------------------------
create table if not exists public.reinicios (
  id              bigint generated always as identity primary key,
  actor_id        bigint not null references public.usuarios(id),
  objetivo_id     bigint not null references public.usuarios(id),
  ruc             text,            -- null = todas las empresas
  filas_borradas  jsonb,
  motivo          text,
  creado_at       timestamptz not null default now()
);

-- =====================================================================
-- 7) REGLAS DE PERMISO
-- =====================================================================

-- ¿p_estudiante esta matriculado en alguna seccion activa de p_docente?
create or replace function public.fn_es_estudiante_de(p_docente bigint, p_estudiante bigint)
returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
      from public.matriculas m
      join public.secciones  s on s.id = m.seccion_id
     where s.docente_id = p_docente
       and m.estudiante_id = p_estudiante
       and m.estado = 'ACTIVA'
       and s.activa
  );
$$;

-- MASTER  -> reinicia a cualquiera
-- DOCENTE -> a si mismo y a sus estudiantes matriculados
-- PRO     -> solo a si mismo
create or replace function public.fn_puede_reiniciar(p_actor bigint, p_objetivo bigint)
returns boolean
language plpgsql stable
set search_path = public
as $$
declare
  v_rol text;
begin
  select rol into v_rol from public.usuarios where id = p_actor and activo and tipo = 'PERSONA';
  if v_rol is null then
    return false;
  elsif v_rol = 'MASTER' then
    return true;
  elsif v_rol = 'DOCENTE' then
    return p_actor = p_objetivo or public.fn_es_estudiante_de(p_actor, p_objetivo);
  elsif v_rol = 'PRO' then
    return p_actor = p_objetivo;
  else
    return false;
  end if;
end;
$$;

-- =====================================================================
-- 8) ACCIONES
-- =====================================================================

-- Reiniciar el avance de un usuario (todas sus empresas o solo una).
-- Devuelve cuantas filas borro en cada tabla.
create or replace function public.fn_reiniciar_avance(
  p_actor    bigint,
  p_objetivo bigint,
  p_ruc      text default null,
  p_motivo   text default null
) returns jsonb
language plpgsql volatile
set search_path = public
as $$
declare
  n_avance int; n_decl int; n_mov int; v_res jsonb;
begin
  if not public.fn_puede_reiniciar(p_actor, p_objetivo) then
    raise exception 'El usuario % no tiene permiso para reiniciar al usuario %', p_actor, p_objetivo
      using errcode = '42501';
  end if;

  delete from public.avance_usuario
   where usuario_id = p_objetivo and (p_ruc is null or ruc = p_ruc);
  get diagnostics n_avance = row_count;

  delete from public.declaraciones
   where usuario_id = p_objetivo and (p_ruc is null or ruc = p_ruc);
  get diagnostics n_decl = row_count;

  delete from public.movimientos_usuario
   where usuario_id = p_objetivo and (p_ruc is null or ruc = p_ruc);
  get diagnostics n_mov = row_count;

  v_res := jsonb_build_object(
    'avance_usuario', n_avance,
    'declaraciones',  n_decl,
    'movimientos',    n_mov,
    'ruc',            coalesce(p_ruc, 'TODAS')
  );

  insert into public.reinicios (actor_id, objetivo_id, ruc, filas_borradas, motivo)
  values (p_actor, p_objetivo, p_ruc, v_res, p_motivo);

  return v_res;
end;
$$;

-- Reiniciar a toda una seccion de golpe (docente dueño de la seccion o MASTER)
create or replace function public.fn_reiniciar_seccion(
  p_actor   bigint,
  p_seccion bigint,
  p_ruc     text default null,
  p_motivo  text default null
) returns jsonb
language plpgsql volatile
set search_path = public
as $$
declare
  v_rol text; v_docente bigint; v_est record; n int := 0;
begin
  select rol into v_rol from public.usuarios where id = p_actor and activo;
  select docente_id into v_docente from public.secciones where id = p_seccion;
  if v_docente is null then
    raise exception 'La seccion % no existe', p_seccion using errcode = 'P0002';
  end if;
  if v_rol <> 'MASTER' and v_docente <> p_actor then
    raise exception 'Solo el docente dueño de la seccion o un MASTER puede reiniciarla'
      using errcode = '42501';
  end if;

  for v_est in
    select estudiante_id from public.matriculas
     where seccion_id = p_seccion and estado = 'ACTIVA'
  loop
    perform public.fn_reiniciar_avance(p_actor, v_est.estudiante_id, p_ruc,
              coalesce(p_motivo, 'Reinicio masivo de seccion ' || p_seccion));
    n := n + 1;
  end loop;

  return jsonb_build_object('estudiantes_reiniciados', n, 'seccion', p_seccion,
                            'ruc', coalesce(p_ruc, 'TODAS'));
end;
$$;

-- Crear seccion (solo DOCENTE o MASTER). Genera el codigo de matricula.
create or replace function public.fn_crear_seccion(
  p_docente bigint,
  p_nombre  text,
  p_curso   text default null,
  p_ciclo   text default null
) returns public.secciones
language plpgsql volatile
set search_path = public
as $$
declare
  v_rol text; v_cod text; v_row public.secciones;
begin
  select rol into v_rol from public.usuarios where id = p_docente and activo and tipo = 'PERSONA';
  if v_rol not in ('DOCENTE','MASTER') then
    raise exception 'Solo un DOCENTE o MASTER puede crear secciones' using errcode = '42501';
  end if;

  loop
    v_cod := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.secciones where codigo_matricula = v_cod);
  end loop;

  insert into public.secciones (docente_id, nombre, curso, ciclo, codigo_matricula)
  values (p_docente, p_nombre, p_curso, p_ciclo, v_cod)
  returning * into v_row;

  return v_row;
end;
$$;

-- Matricular a un estudiante por su nombre de usuario.
-- Si el usuario tiene rol INVITADO, lo promueve a ESTUDIANTE.
create or replace function public.fn_matricular(
  p_docente  bigint,
  p_seccion  bigint,
  p_usuario  text
) returns jsonb
language plpgsql volatile
set search_path = public
as $$
declare
  v_rol text; v_docente bigint; v_est bigint; v_rol_est text;
begin
  select rol into v_rol from public.usuarios where id = p_docente and activo;
  select docente_id into v_docente from public.secciones where id = p_seccion and activa;
  if v_docente is null then
    raise exception 'La seccion % no existe o esta inactiva', p_seccion using errcode = 'P0002';
  end if;
  if v_rol <> 'MASTER' and v_docente <> p_docente then
    raise exception 'Solo el docente dueño de la seccion puede matricular' using errcode = '42501';
  end if;

  select id, rol into v_est, v_rol_est
    from public.usuarios
   where upper(usuario) = upper(p_usuario) and tipo = 'PERSONA';
  if v_est is null then
    raise exception 'No existe el usuario %', p_usuario using errcode = 'P0002';
  end if;

  if v_rol_est = 'INVITADO' then
    update public.usuarios set rol = 'ESTUDIANTE' where id = v_est;
    v_rol_est := 'ESTUDIANTE';
  end if;

  insert into public.matriculas (seccion_id, estudiante_id)
  values (p_seccion, v_est)
  on conflict (seccion_id, estudiante_id)
  do update set estado = 'ACTIVA', retirado_at = null, matriculado_at = now();

  return jsonb_build_object('estudiante_id', v_est, 'usuario', p_usuario,
                            'rol', v_rol_est, 'seccion', p_seccion, 'estado', 'ACTIVA');
end;
$$;

-- Quitar (retirar) a un estudiante de la seccion. No borra su avance.
create or replace function public.fn_retirar_matricula(
  p_docente bigint,
  p_seccion bigint,
  p_usuario text
) returns jsonb
language plpgsql volatile
set search_path = public
as $$
declare
  v_rol text; v_docente bigint; v_est bigint;
begin
  select rol into v_rol from public.usuarios where id = p_docente and activo;
  select docente_id into v_docente from public.secciones where id = p_seccion;
  if v_docente is null then
    raise exception 'La seccion % no existe', p_seccion using errcode = 'P0002';
  end if;
  if v_rol <> 'MASTER' and v_docente <> p_docente then
    raise exception 'Solo el docente dueño de la seccion puede retirar alumnos' using errcode = '42501';
  end if;

  select id into v_est from public.usuarios
   where upper(usuario) = upper(p_usuario) and tipo = 'PERSONA';

  update public.matriculas
     set estado = 'RETIRADA', retirado_at = now()
   where seccion_id = p_seccion and estudiante_id = v_est;

  return jsonb_build_object('estudiante_id', v_est, 'seccion', p_seccion, 'estado', 'RETIRADA');
end;
$$;

-- Guardar / actualizar el avance de un modulo (upsert)
create or replace function public.fn_guardar_avance(
  p_usuario bigint,
  p_ruc     text,
  p_modulo  text,
  p_estado  jsonb
) returns public.avance_usuario
language plpgsql volatile
set search_path = public
as $$
declare v_row public.avance_usuario;
begin
  insert into public.avance_usuario (usuario_id, ruc, modulo, estado)
  values (p_usuario, p_ruc, p_modulo, coalesce(p_estado, '{}'::jsonb))
  on conflict (usuario_id, ruc, modulo)
  do update set estado = excluded.estado, actualizado_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

-- =====================================================================
-- 9) VISTAS DE APOYO
-- =====================================================================

-- Estudiantes de cada docente
create or replace view public.v_mis_estudiantes as
select s.docente_id,
       s.id                as seccion_id,
       s.nombre            as seccion,
       s.curso,
       s.ciclo,
       s.codigo_matricula,
       u.id                as estudiante_id,
       u.usuario,
       u.denominacion,
       u.rol,
       m.estado            as estado_matricula,
       m.matriculado_at,
       u.ultimo_acceso
  from public.secciones  s
  join public.matriculas m on m.seccion_id = s.id
  join public.usuarios   u on u.id = m.estudiante_id
 where s.activa;

-- Cuanto ha avanzado cada usuario en cada empresa
create or replace view public.v_avance_resumen as
select u.id as usuario_id, u.usuario, u.rol, e.ruc, e.razon_social,
       (select count(*) from public.avance_usuario a
         where a.usuario_id = u.id and a.ruc = e.ruc)                as modulos_con_avance,
       (select count(*) from public.declaraciones d
         where d.usuario_id = u.id and d.ruc = e.ruc
           and d.estado = 'PRESENTADA')                              as declaraciones,
       (select count(*) from public.movimientos_usuario mv
         where mv.usuario_id = u.id and mv.ruc = e.ruc)              as movimientos,
       (select max(a.actualizado_at) from public.avance_usuario a
         where a.usuario_id = u.id and a.ruc = e.ruc)                as ultima_actividad
  from public.usuarios u
 cross join public.empresas_simulador e
 where u.tipo = 'PERSONA' and u.activo;

-- Comparacion de lo declarado en el FV 621 contra el resultado esperado
create or replace view public.v_calificacion_fv621 as
select d.usuario_id, d.ruc, d.periodo,
       (d.datos ->> 'igv_a_pagar')::double precision   as declarado_igv,
       r.igv_a_pagar                                   as esperado_igv,
       (d.datos ->> 'pago_a_cuenta_ir')::double precision as declarado_ir,
       r.pago_a_cuenta_ir                              as esperado_ir,
       abs(coalesce((d.datos ->> 'igv_a_pagar')::double precision, 0) - r.igv_a_pagar) <= 1
       and abs(coalesce((d.datos ->> 'pago_a_cuenta_ir')::double precision, 0) - r.pago_a_cuenta_ir) <= 1
                                                       as correcto,
       d.presentado_at
  from public.declaraciones d
  join public.resumen_fv621 r on r.ruc = d.ruc and r.periodo = d.periodo
 where d.formulario = 'FV621' and d.estado = 'PRESENTADA';

-- =====================================================================
-- 10) MIGRACION DEL ESTADO ANTIGUO (sire_estado -> avance_usuario)
--     sire_estado guarda un estado por RUC, sin distinguir usuario.
--     Ejecuta esto solo si quieres conservar lo que ya habias guardado,
--     asignandoselo a un usuario concreto (por ejemplo el MASTER):
-- ---------------------------------------------------------------------
-- insert into public.avance_usuario (usuario_id, ruc, modulo, estado)
-- select (select id from public.usuarios where upper(usuario) = 'ADMIN' and tipo='PERSONA'),
--        s.ruc, 'sire', s.estado
--   from public.sire_estado s
-- on conflict (usuario_id, ruc, modulo) do nothing;

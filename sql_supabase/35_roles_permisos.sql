-- =====================================================================
-- SIMULADOR SUNAT - Matriz de permisos por rol
-- Ejecutar DESPUES de 30_multiusuario.sql
--
--  INVITADO : solo PLAN CONTABLE y FV 621, solo con el RUC 20123456789.
--             Puede simular y declarar, pero NO se guarda nada.
--  PRUEBA   : acceso a todos los modulos y las 10 empresas, pero NO guarda.
--  ESTUDIANTE / ASISTENTE : todo, guardan su avance, no reinician.
--  PRO      : todo, guarda y se reinicia a si mismo.
--  DOCENTE  : todo, guarda, gestiona alumnos y los reinicia.
--  MASTER   : todo, sin restricciones.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Catalogo de modulos del simulador
-- ---------------------------------------------------------------------
create table if not exists public.modulos (
  clave       text primary key,
  nombre      text not null,
  archivo     text,
  requiere_ruc boolean not null default true,
  orden       int default 100
);

insert into public.modulos (clave, nombre, archivo, requiere_ruc, orden) values
  ('plan_contable', 'Plan Contable General Empresarial', 'dinamica/index.html', false, 10),
  ('sol',           'SUNAT Operaciones en Linea (portal)','sol.html',          false, 15),
  ('fv621',         'Formulario Virtual 621 - IGV Renta','declaraciones.html',  true, 20),
  ('fv710',         'Formulario Virtual 710 - Renta Anual','renta.html',       true, 30),
  ('rvie',          'SIRE - Registro de Ventas (RVIE)',  'rvie.html',         true, 40),
  ('rce',           'SIRE - Registro de Compras (RCE)',  'rce.html',          true, 50),
  ('see_sol',       'SEE SOL - Emision de comprobantes', 'comprobantes.html', true, 60),
  ('tregistro',     'T-Registro',                        'tregistro.html',    true, 70),
  ('plame',         'PLAME',                             'tregistro.html',    true, 80),
  ('tramites',      'Mis tramites y consultas',          'tramites.html',     true, 90),
  ('reemplazo',     'Aplicativo de reemplazo',           'reemplazo.html',    true, 92),
  ('ajustes',       'Ajustes del simulador',             'ajustes.html',      false, 95),
  ('gestor_usuarios','Gestor de usuarios',               'login.html',        false, 96),
  ('afpnet',        'AFP NET (externo)',                 'https://www.afpnet.com.pe', false, 97),
  ('remype',        'REMYPE',                            'tregistro.html',    true, 98)
on conflict (clave) do nothing;

-- ---------------------------------------------------------------------
-- 2) Matriz de permisos (editable: cambiar aqui cambia el comportamiento)
-- ---------------------------------------------------------------------
create table if not exists public.roles_permisos (
  rol                     text primary key,
  puede_ingresar          boolean not null default true,
  puede_guardar           boolean not null default false,
  todas_las_empresas      boolean not null default true,
  rucs_permitidos         text[],          -- solo si todas_las_empresas = false
  todos_los_modulos       boolean not null default true,
  modulos_permitidos      text[],          -- solo si todos_los_modulos = false
  puede_reiniciarse       boolean not null default false,
  reinicia_a              text not null default 'NADIE'
                            check (reinicia_a in ('NADIE','PROPIOS_ESTUDIANTES','TODOS')),
  puede_gestionar_alumnos boolean not null default false,
  descripcion             text
);

insert into public.roles_permisos
 (rol, puede_ingresar, puede_guardar, todas_las_empresas, rucs_permitidos,
  todos_los_modulos, modulos_permitidos, puede_reiniciarse, reinicia_a,
  puede_gestionar_alumnos, descripcion) values
 ('INVITADO',  true, false, false, array['20123456789'],
   false, array['plan_contable','sol','fv621'], false, 'NADIE', false,
   'Acceso libre al Plan Contable y al FV 621 con la empresa demo. Puede simular declaraciones, pero nada se guarda.'),
 ('PRUEBA',    true, false, true,  null, true, null, false, 'NADIE', false,
   'Acceso completo a los 10 RUC y a todos los modulos, en modo demostracion: nada se guarda.'),
 ('ESTUDIANTE',true, true,  true,  null, true, null, false, 'NADIE', false,
   'Guarda su avance por empresa. No puede reiniciarse: lo hace su docente.'),
 ('ASISTENTE', true, true,  true,  null, true, null, false, 'NADIE', false,
   'Igual que el estudiante; apoya al docente pero no gestiona alumnos.'),
 ('PRO',       true, true,  true,  null, true, null, true,  'NADIE', false,
   'Guarda su avance y puede reiniciarse a si mismo cuando quiera.'),
 ('DOCENTE',   true, true,  true,  null, true, null, true,  'PROPIOS_ESTUDIANTES', true,
   'Guarda su avance, matricula y retira estudiantes, y los reinicia.'),
 ('MASTER',    true, true,  true,  null, true, null, true,  'TODOS', true,
   'Sin restricciones. Reinicia a cualquier usuario.')
on conflict (rol) do update set
  puede_ingresar          = excluded.puede_ingresar,
  puede_guardar           = excluded.puede_guardar,
  todas_las_empresas      = excluded.todas_las_empresas,
  rucs_permitidos         = excluded.rucs_permitidos,
  todos_los_modulos       = excluded.todos_los_modulos,
  modulos_permitidos      = excluded.modulos_permitidos,
  puede_reiniciarse       = excluded.puede_reiniciarse,
  reinicia_a              = excluded.reinicia_a,
  puede_gestionar_alumnos = excluded.puede_gestionar_alumnos,
  descripcion             = excluded.descripcion;

-- El gestor de usuarios solo lo ve quien administra alumnos (DOCENTE y MASTER)
update public.roles_permisos
   set todos_los_modulos = false,
       modulos_permitidos = (select array_agg(clave) from public.modulos where clave <> 'gestor_usuarios')
 where rol in ('ESTUDIANTE','ASISTENTE','PRO','PRUEBA');

-- ---------------------------------------------------------------------
-- 3) Funciones de consulta de permisos
-- ---------------------------------------------------------------------

-- ¿Este usuario puede persistir su avance?
create or replace function public.fn_puede_guardar(p_usuario bigint)
returns boolean language sql stable set search_path = public as $fn$
  select coalesce(rp.puede_guardar, false)
    from public.usuarios u
    join public.roles_permisos rp on rp.rol = u.rol
   where u.id = p_usuario and u.activo and u.tipo = 'PERSONA';
$fn$;

-- ¿Puede entrar a este modulo con este RUC?
create or replace function public.fn_puede_acceder(
  p_usuario bigint, p_modulo text, p_ruc text default null)
returns boolean language plpgsql stable set search_path = public as $fn$
declare rp public.roles_permisos%rowtype; v_rol text;
begin
  select u.rol into v_rol from public.usuarios u
   where u.id = p_usuario and u.activo and u.tipo = 'PERSONA';
  if v_rol is null then return false; end if;
  select * into rp from public.roles_permisos where rol = v_rol;
  if rp.rol is null or not rp.puede_ingresar then return false; end if;
  if not rp.todos_los_modulos and not (p_modulo = any(rp.modulos_permitidos)) then
    return false;
  end if;
  if p_ruc is not null and not rp.todas_las_empresas
     and not (p_ruc = any(rp.rucs_permitidos)) then
    return false;
  end if;
  return true;
end; $fn$;

-- Todo lo que la interfaz necesita saber, en una sola llamada al hacer login
create or replace function public.fn_permisos(p_usuario bigint)
returns jsonb language plpgsql stable set search_path = public as $fn$
declare u public.usuarios%rowtype; rp public.roles_permisos%rowtype;
begin
  select * into u from public.usuarios where id = p_usuario and tipo = 'PERSONA';
  if u.id is null then return jsonb_build_object('error','usuario no encontrado'); end if;
  select * into rp from public.roles_permisos where rol = u.rol;

  return jsonb_build_object(
    'usuario_id',  u.id,
    'usuario',     u.usuario,
    'denominacion',u.denominacion,
    'rol',         u.rol,
    'activo',      u.activo,
    'puede_ingresar', coalesce(rp.puede_ingresar,false),
    'puede_guardar',  coalesce(rp.puede_guardar,false),
    'modo_demo',      not coalesce(rp.puede_guardar,false),
    'puede_reiniciarse', coalesce(rp.puede_reiniciarse,false),
    'reinicia_a',        coalesce(rp.reinicia_a,'NADIE'),
    'puede_gestionar_alumnos', coalesce(rp.puede_gestionar_alumnos,false),
    'descripcion', rp.descripcion,
    'empresas', case when coalesce(rp.todas_las_empresas,true)
                     then (select jsonb_agg(jsonb_build_object('ruc',e.ruc,'razon_social',e.razon_social)
                                            order by e.cod_empresa)
                             from public.empresas_simulador e)
                     else (select jsonb_agg(jsonb_build_object('ruc',e.ruc,'razon_social',e.razon_social))
                             from public.empresas_simulador e
                            where e.ruc = any(rp.rucs_permitidos)) end,
    'modulos',  case when coalesce(rp.todos_los_modulos,true)
                     then (select jsonb_agg(jsonb_build_object('clave',m.clave,'nombre',m.nombre,'archivo',m.archivo)
                                            order by m.orden) from public.modulos m)
                     else (select jsonb_agg(jsonb_build_object('clave',m.clave,'nombre',m.nombre,'archivo',m.archivo)
                                            order by m.orden)
                             from public.modulos m where m.clave = any(rp.modulos_permitidos)) end
  );
end; $fn$;

-- ---------------------------------------------------------------------
-- 4) fn_puede_reiniciar ahora lee la matriz (antes tenia los roles fijos)
-- ---------------------------------------------------------------------
create or replace function public.fn_puede_reiniciar(p_actor bigint, p_objetivo bigint)
returns boolean language plpgsql stable set search_path = public as $fn$
declare rp public.roles_permisos%rowtype; v_rol text;
begin
  select rol into v_rol from public.usuarios
   where id = p_actor and activo and tipo = 'PERSONA';
  if v_rol is null then return false; end if;
  select * into rp from public.roles_permisos where rol = v_rol;
  if rp.rol is null then return false; end if;

  if p_actor = p_objetivo then
    return rp.puede_reiniciarse;
  elsif rp.reinicia_a = 'TODOS' then
    return true;
  elsif rp.reinicia_a = 'PROPIOS_ESTUDIANTES' then
    return public.fn_es_estudiante_de(p_actor, p_objetivo);
  else
    return false;
  end if;
end; $fn$;

-- ---------------------------------------------------------------------
-- 5) Candado en la base: los roles que no guardan, NO guardan
--    (aunque alguien llame a la API directamente)
-- ---------------------------------------------------------------------
create or replace function public.trg_valida_guardado()
returns trigger language plpgsql set search_path = public as $fn$
declare rp public.roles_permisos%rowtype; v_rol text;
begin
  select u.rol into v_rol from public.usuarios u
   where u.id = new.usuario_id and u.activo and u.tipo = 'PERSONA';
  if v_rol is null then
    raise exception 'Usuario % inexistente, inactivo o no es una persona', new.usuario_id
      using errcode = '42501';
  end if;
  select * into rp from public.roles_permisos where rol = v_rol;

  if not coalesce(rp.puede_guardar, false) then
    raise exception 'El rol % trabaja en modo demostracion: su avance no se guarda', v_rol
      using errcode = '42501';
  end if;

  if not coalesce(rp.todas_las_empresas, true)
     and not (new.ruc = any(rp.rucs_permitidos)) then
    raise exception 'El rol % no tiene acceso a la empresa %', v_rol, new.ruc
      using errcode = '42501';
  end if;

  return new;
end; $fn$;

drop trigger if exists tg_avance_guardado on public.avance_usuario;
create trigger tg_avance_guardado before insert or update on public.avance_usuario
  for each row execute function public.trg_valida_guardado();

drop trigger if exists tg_declaracion_guardado on public.declaraciones;
create trigger tg_declaracion_guardado before insert or update on public.declaraciones
  for each row execute function public.trg_valida_guardado();

drop trigger if exists tg_movimiento_guardado on public.movimientos_usuario;
create trigger tg_movimiento_guardado before insert or update on public.movimientos_usuario
  for each row execute function public.trg_valida_guardado();

-- ---------------------------------------------------------------------
-- 6) Vista de consulta rapida de la matriz
-- ---------------------------------------------------------------------
create or replace view public.v_matriz_roles as
select rp.rol,
       rp.puede_ingresar,
       rp.puede_guardar,
       case when rp.todas_las_empresas then 'Las 10 empresas'
            else array_to_string(rp.rucs_permitidos, ', ') end as empresas,
       case when rp.todos_los_modulos then 'Todos'
            else array_to_string(rp.modulos_permitidos, ', ') end as modulos,
       rp.puede_reiniciarse,
       rp.reinicia_a,
       rp.puede_gestionar_alumnos,
       (select count(*) from public.usuarios u where u.rol = rp.rol and u.tipo='PERSONA') as usuarios,
       rp.descripcion
  from public.roles_permisos rp
 order by case rp.rol when 'MASTER' then 1 when 'DOCENTE' then 2 when 'PRO' then 3
                      when 'ASISTENTE' then 4 when 'ESTUDIANTE' then 5
                      when 'PRUEBA' then 6 else 7 end;

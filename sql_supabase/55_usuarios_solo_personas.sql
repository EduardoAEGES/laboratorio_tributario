-- =====================================================================
-- SIMULADOR SUNAT - usuarios = SOLO personas (sin RUC)
-- Proyecto: klmjmlhwuzhymrplemgw
-- Ejecutar DESPUES de 30_multiusuario / 40_acceso / 45_gestor / 50_seguridad.
--
-- Motivo:
--   La tabla `usuarios` mezclaba dos cosas con la columna `tipo`:
--     - PERSONA   : el alumno/docente real, pero arrastraba un `ruc` obligatorio
--                   que al registrarse se rellenaba a la fuerza con 20123456789.
--     - CLAVE_SOL : 10 filas SIST/NORTON por RUC, que duplicaban datos que ya
--                   viven en `empresas_simulador`.
--
--   Nuevo modelo (dos puertas, dos tablas limpias):
--     Puerta 1 -> `usuarios`           : SOLO personas. usuario + clave + datos
--                                        personales (nombres, apellidos, correo,
--                                        telefono) + rol. SIN RUC.
--     Puerta 2 -> `empresas_simulador` : el RUC y todos los datos de la empresa.
--                                        La Clave SOL es fija para todas: SIST / NORTON.
--
--   El avance se sigue guardando por (usuario_id, ruc), donde el RUC lo aporta la
--   Clave SOL en tiempo de ejecucion, no la ficha del usuario.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Datos personales reales en usuarios
-- ---------------------------------------------------------------------
alter table public.usuarios add column if not exists nombres           text;
alter table public.usuarios add column if not exists apellido_paterno  text;
alter table public.usuarios add column if not exists apellido_materno  text;
alter table public.usuarios add column if not exists correo            text;
alter table public.usuarios add column if not exists telefono          text;

-- Backfill de las cuentas de prueba existentes (para que el gestor las muestre).
update public.usuarios set nombres='Usuario',       apellido_paterno='De',  apellido_materno='Prueba',  correo='prueba@laboratorio.local',     telefono='000000000' where id=1 and nombres is null;
update public.usuarios set nombres='Administrador',  apellido_paterno='Del', apellido_materno='Sistema', correo='admin@laboratorio.local',      telefono='000000000' where id=2 and nombres is null;
update public.usuarios set nombres='Estudiante',     apellido_paterno='De',  apellido_materno='Ejemplo', correo='estudiante@laboratorio.local', telefono='000000000' where id=3 and nombres is null;
update public.usuarios set nombres='Docente',        apellido_paterno='De',  apellido_materno='Ejemplo', correo='docente@laboratorio.local',    telefono='000000000' where id=8 and nombres is null;

-- ---------------------------------------------------------------------
-- 2) La Clave SOL sale de usuarios (ya vive en empresas_simulador)
-- ---------------------------------------------------------------------
delete from public.usuarios where tipo = 'CLAVE_SOL';

-- ---------------------------------------------------------------------
-- 3) usuarios ya no tiene RUC. Al soltar la columna se descartan en
--    cascada usuarios_ruc_usuario_key y ux_usuarios_clave_sol.
--    La unicidad de nombre de usuario la sigue dando ux_usuarios_persona.
-- ---------------------------------------------------------------------
alter table public.usuarios drop column if exists ruc cascade;

-- ---------------------------------------------------------------------
-- 4) fn_login_clave_sol: SIST / NORTON fijas para todas las empresas.
--    Ya no consulta usuarios; valida el RUC contra empresas_simulador.
-- ---------------------------------------------------------------------
create or replace function public.fn_login_clave_sol(
  p_usuario_sesion bigint, p_ruc text, p_usuario text, p_clave text, p_modulo text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public','pg_temp'
as $function$
declare v_emp public.empresas_simulador%rowtype; v_rol text; rp public.roles_permisos%rowtype;
begin
  select rol into v_rol from public.usuarios where id=p_usuario_sesion and activo and tipo='PERSONA';
  if v_rol is null then
    return jsonb_build_object('ok',false,'motivo','SIN_SESION',
      'mensaje','Debes iniciar sesion en el simulador antes de usar la Clave SOL.');
  end if;
  select * into rp from public.roles_permisos where rol=v_rol;

  select * into v_emp from public.empresas_simulador where ruc = trim(p_ruc);
  if v_emp.ruc is null then
    return jsonb_build_object('ok',false,'motivo','RUC_NO_EXISTE',
      'mensaje','El numero de RUC no corresponde a ninguna empresa registrada.');
  end if;

  -- La Clave SOL es la misma para todas las empresas: usuario SIST / clave NORTON
  if upper(trim(coalesce(p_usuario,''))) <> 'SIST' or coalesce(p_clave,'') <> 'NORTON' then
    return jsonb_build_object('ok',false,'motivo','CLAVE_SOL_INCORRECTA',
      'mensaje','El usuario o la contrasena de la Clave SOL no son correctos (usa SIST / NORTON).');
  end if;

  if not coalesce(rp.todas_las_empresas,true) and not (v_emp.ruc = any(rp.rucs_permitidos)) then
    return jsonb_build_object('ok',false,'motivo','EMPRESA_NO_PERMITIDA',
      'mensaje','Con tu rol '||v_rol||' solo puedes trabajar con el RUC '||
                array_to_string(rp.rucs_permitidos,', ')||'.');
  end if;
  if p_modulo is not null and not public.fn_puede_acceder(p_usuario_sesion, p_modulo, v_emp.ruc) then
    return jsonb_build_object('ok',false,'motivo','MODULO_NO_PERMITIDO',
      'mensaje','Tu rol '||v_rol||' no tiene habilitado este aplicativo.');
  end if;

  return jsonb_build_object('ok',true,
    'empresa', jsonb_build_object('ruc',v_emp.ruc,'razon_social',v_emp.razon_social,
      'nombre_comercial',v_emp.nombre_comercial,'regimen',v_emp.regimen_tributario,
      'cod_empresa',v_emp.cod_empresa),
    'modo_demo', not coalesce(rp.puede_guardar,false));
end; $function$;

-- ---------------------------------------------------------------------
-- 5) fn_registrar_usuario: nueva firma con datos personales (todos obligatorios).
-- ---------------------------------------------------------------------
drop function if exists public.fn_registrar_usuario(text, text, text);

create or replace function public.fn_registrar_usuario(
  p_usuario           text,
  p_clave             text,
  p_nombres           text,
  p_apellido_paterno  text,
  p_apellido_materno  text,
  p_correo            text,
  p_telefono          text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public','pg_temp'
as $function$
declare v_id bigint; v_denom text;
begin
  if length(trim(coalesce(p_usuario,''))) < 3 then
    return jsonb_build_object('ok',false,'mensaje','El usuario debe tener al menos 3 caracteres.');
  end if;
  if length(coalesce(p_clave,'')) < 4 then
    return jsonb_build_object('ok',false,'mensaje','La contrasena debe tener al menos 4 caracteres.');
  end if;
  if length(trim(coalesce(p_nombres,''))) = 0 then
    return jsonb_build_object('ok',false,'mensaje','Ingresa tus nombres.');
  end if;
  if length(trim(coalesce(p_apellido_paterno,''))) = 0 then
    return jsonb_build_object('ok',false,'mensaje','Ingresa tu apellido paterno.');
  end if;
  if length(trim(coalesce(p_apellido_materno,''))) = 0 then
    return jsonb_build_object('ok',false,'mensaje','Ingresa tu apellido materno.');
  end if;
  if position('@' in coalesce(p_correo,'')) = 0 or position('.' in coalesce(p_correo,'')) = 0 then
    return jsonb_build_object('ok',false,'mensaje','Ingresa un correo electronico valido.');
  end if;
  if length(regexp_replace(coalesce(p_telefono,''),'\D','','g')) < 6 then
    return jsonb_build_object('ok',false,'mensaje','Ingresa un telefono valido.');
  end if;
  if exists (select 1 from public.usuarios
              where upper(usuario)=upper(trim(p_usuario)) and tipo='PERSONA') then
    return jsonb_build_object('ok',false,'mensaje','Ese nombre de usuario ya esta tomado.');
  end if;

  v_denom := upper(trim(regexp_replace(
               trim(p_nombres)||' '||trim(p_apellido_paterno)||' '||trim(p_apellido_materno),
               '\s+',' ','g')));

  insert into public.usuarios
    (usuario, clave, clave_hash, denominacion,
     nombres, apellido_paterno, apellido_materno, correo, telefono,
     rol, activo, tipo)
  values
    (trim(p_usuario), null, extensions.crypt(p_clave, extensions.gen_salt('bf',10)), v_denom,
     trim(p_nombres), trim(p_apellido_paterno), trim(p_apellido_materno),
     lower(trim(p_correo)), trim(p_telefono),
     'INVITADO', true, 'PERSONA')
  returning id into v_id;

  return jsonb_build_object('ok',true,'sesion',public.fn_permisos(v_id));
end; $function$;

-- ---------------------------------------------------------------------
-- 6) Vista publica y listado del gestor con los datos personales
-- ---------------------------------------------------------------------
drop view if exists public.v_usuarios_publico;
create view public.v_usuarios_publico as
select id, usuario, denominacion,
       nombres, apellido_paterno, apellido_materno, correo, telefono,
       rol, activo, tipo, ultimo_acceso
from public.usuarios;

create or replace function public.fn_listar_usuarios(p_actor bigint, p_busqueda text default null::text)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public','pg_temp'
as $function$
declare v_rol text;
begin
  select rol into v_rol from public.usuarios where id=p_actor and activo and tipo='PERSONA';
  if v_rol is null or v_rol not in ('MASTER','DOCENTE') then
    return jsonb_build_object('ok',false,'mensaje','Tu perfil no puede gestionar usuarios.');
  end if;

  return jsonb_build_object('ok',true,'rol',v_rol,'usuarios', coalesce((
    select jsonb_agg(x order by x->>'usuario')
      from (
        select jsonb_build_object(
                 'id',u.id,'usuario',u.usuario,'denominacion',u.denominacion,'rol',u.rol,
                 'nombres',u.nombres,'apellido_paterno',u.apellido_paterno,
                 'apellido_materno',u.apellido_materno,'correo',u.correo,'telefono',u.telefono,
                 'activo',u.activo,'ultimo_acceso',u.ultimo_acceso,'creado',u.created_at,
                 'mio', (v_rol='MASTER' or public.fn_es_estudiante_de(p_actor,u.id) or u.id=p_actor),
                 'secciones', coalesce((select jsonb_agg(distinct s.nombre)
                     from public.matriculas m join public.secciones s on s.id=m.seccion_id
                    where m.estudiante_id=u.id and m.estado='ACTIVA'),'[]'::jsonb),
                 'avance', (select count(*) from public.avance_usuario a where a.usuario_id=u.id),
                 'declaraciones', (select count(*) from public.declaraciones d where d.usuario_id=u.id)
               ) as x
          from public.usuarios u
         where u.tipo='PERSONA'
           and (p_busqueda is null or u.usuario ilike '%'||p_busqueda||'%'
                or coalesce(u.denominacion,'') ilike '%'||p_busqueda||'%'
                or coalesce(u.correo,'') ilike '%'||p_busqueda||'%')
           and (v_rol='MASTER' or u.id=p_actor or public.fn_es_estudiante_de(p_actor,u.id)
                or (p_busqueda is not null and u.rol in ('INVITADO','ESTUDIANTE')))
      ) t),'[]'::jsonb));
end; $function$;

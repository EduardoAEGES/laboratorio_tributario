-- =====================================================================
-- SIMULADOR SUNAT - Funciones del GESTOR DE USUARIOS (gestor.html)
-- Ejecutar DESPUES de 40_acceso.sql
--
--   MASTER  : ve y administra a cualquier usuario, cambia roles y activa/desactiva
--   DOCENTE : ve a los alumnos de sus secciones, los matricula, retira y reinicia,
--             y solo puede moverlos entre INVITADO y ESTUDIANTE
-- =====================================================================

-- Lista de usuarios visible para el gestor
create or replace function public.fn_listar_usuarios(p_actor bigint, p_busqueda text default null)
returns jsonb language plpgsql stable set search_path = public as $fn$
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
                or coalesce(u.denominacion,'') ilike '%'||p_busqueda||'%')
           and (v_rol='MASTER' or u.id=p_actor or public.fn_es_estudiante_de(p_actor,u.id)
                or (p_busqueda is not null and u.rol in ('INVITADO','ESTUDIANTE')))
      ) t),'[]'::jsonb));
end; $fn$;

-- Secciones del docente (o todas, si es MASTER) con su conteo de alumnos
create or replace function public.fn_mis_secciones(p_actor bigint)
returns jsonb language plpgsql stable set search_path = public as $fn$
declare v_rol text;
begin
  select rol into v_rol from public.usuarios where id=p_actor and activo and tipo='PERSONA';
  if v_rol is null or v_rol not in ('MASTER','DOCENTE') then
    return jsonb_build_object('ok',false,'mensaje','Tu perfil no puede gestionar secciones.');
  end if;
  return jsonb_build_object('ok',true,'secciones', coalesce((
    select jsonb_agg(jsonb_build_object(
             'id',s.id,'nombre',s.nombre,'curso',s.curso,'ciclo',s.ciclo,
             'codigo',s.codigo_matricula,'activa',s.activa,'docente_id',s.docente_id,
             'docente',(select usuario from public.usuarios d where d.id=s.docente_id),
             'alumnos',(select count(*) from public.matriculas m
                         where m.seccion_id=s.id and m.estado='ACTIVA'))
           order by s.creado_at)
      from public.secciones s
     where v_rol='MASTER' or s.docente_id=p_actor),'[]'::jsonb));
end; $fn$;

-- Cambio de rol
create or replace function public.fn_cambiar_rol(p_actor bigint, p_objetivo bigint, p_rol text)
returns jsonb language plpgsql volatile set search_path = public as $fn$
declare v_rol text; v_obj text;
begin
  select rol into v_rol from public.usuarios where id=p_actor and activo and tipo='PERSONA';
  select rol into v_obj from public.usuarios where id=p_objetivo and tipo='PERSONA';
  if v_obj is null then
    return jsonb_build_object('ok',false,'mensaje','El usuario no existe.');
  end if;
  if not exists (select 1 from public.roles_permisos where rol=p_rol) then
    return jsonb_build_object('ok',false,'mensaje','El rol '||p_rol||' no existe.');
  end if;
  if v_rol = 'MASTER' then
    null;
  elsif v_rol = 'DOCENTE' then
    if not public.fn_es_estudiante_de(p_actor,p_objetivo) then
      return jsonb_build_object('ok',false,'mensaje','Solo puedes cambiar el rol de tus estudiantes.');
    end if;
    if p_rol not in ('INVITADO','ESTUDIANTE') then
      return jsonb_build_object('ok',false,'mensaje','Un docente solo asigna los roles INVITADO o ESTUDIANTE.');
    end if;
  else
    return jsonb_build_object('ok',false,'mensaje','Tu perfil no puede cambiar roles.');
  end if;

  update public.usuarios set rol = p_rol where id = p_objetivo;
  return jsonb_build_object('ok',true,'usuario_id',p_objetivo,'rol_anterior',v_obj,'rol',p_rol);
end; $fn$;

-- Activar / desactivar cuenta
create or replace function public.fn_activar_usuario(p_actor bigint, p_objetivo bigint, p_activo boolean)
returns jsonb language plpgsql volatile set search_path = public as $fn$
declare v_rol text;
begin
  select rol into v_rol from public.usuarios where id=p_actor and activo and tipo='PERSONA';
  if v_rol = 'MASTER' or (v_rol='DOCENTE' and public.fn_es_estudiante_de(p_actor,p_objetivo)) then
    update public.usuarios set activo = p_activo where id = p_objetivo;
    return jsonb_build_object('ok',true,'usuario_id',p_objetivo,'activo',p_activo);
  end if;
  return jsonb_build_object('ok',false,'mensaje','No tienes permiso sobre ese usuario.');
end; $fn$;

-- El gestor vive en su propia pagina
update public.modulos set archivo = 'gestor.html' where clave = 'gestor_usuarios';

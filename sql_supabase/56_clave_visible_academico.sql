-- =====================================================================
-- MODO ACADEMICO — clave visible en la tabla usuarios
-- Proyecto: klmjmlhwuzhymrplemgw
-- Ejecutar DESPUES de 55_usuarios_solo_personas.sql
--
-- ATENCION: esto guarda la contrasena TAMBIEN en texto plano (columna `clave`),
-- ademas del hash bcrypt (clave_hash). Se hace a proposito porque es un
-- laboratorio de ensenanza con data ficticia y el docente necesita poder ver /
-- entregar la clave a un alumno que la olvido. NO replicar en un sistema real:
-- las contrasenas jamas deben almacenarse en texto plano.
--
-- Las claves ya cifradas (bcrypt) no se pueden recuperar; por eso a las cuentas
-- que quedaron con clave NULL se les asigna una clave conocida = su usuario.
-- =====================================================================

-- 1) Registro: guarda clave visible + hash
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
    (trim(p_usuario), p_clave, extensions.crypt(p_clave, extensions.gen_salt('bf',10)), v_denom,
     trim(p_nombres), trim(p_apellido_paterno), trim(p_apellido_materno),
     lower(trim(p_correo)), trim(p_telefono),
     'INVITADO', true, 'PERSONA')
  returning id into v_id;

  return jsonb_build_object('ok',true,'sesion',public.fn_permisos(v_id));
end; $function$;

-- 2) Restablecer clave: tambien deja la clave visible
create or replace function public.fn_cambiar_clave(p_actor bigint, p_objetivo bigint, p_clave_nueva text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public','pg_temp'
as $function$
declare v_rol text;
begin
  if length(coalesce(p_clave_nueva,'')) < 4 then
    return jsonb_build_object('ok',false,'mensaje','La contrasena debe tener al menos 4 caracteres.');
  end if;
  select rol into v_rol from public.usuarios where id=p_actor and activo and tipo='PERSONA';
  if v_rol is null then
    return jsonb_build_object('ok',false,'mensaje','Sesion no valida.');
  end if;
  if p_actor <> p_objetivo
     and v_rol <> 'MASTER'
     and not (v_rol='DOCENTE' and public.fn_es_estudiante_de(p_actor,p_objetivo)) then
    return jsonb_build_object('ok',false,'mensaje','No puedes cambiar la contrasena de ese usuario.');
  end if;
  update public.usuarios
     set clave_hash = extensions.crypt(p_clave_nueva, extensions.gen_salt('bf',10)),
         clave      = p_clave_nueva
   where id = p_objetivo;
  return jsonb_build_object('ok',true,'usuario_id',p_objetivo);
end; $function$;

-- 3) Cuentas con clave NULL (bcrypt no recuperable) -> clave conocida = su usuario
update public.usuarios
   set clave      = usuario,
       clave_hash = extensions.crypt(usuario, extensions.gen_salt('bf',10))
 where clave is null;

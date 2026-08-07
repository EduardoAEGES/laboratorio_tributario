-- =====================================================================
-- SIMULADOR SUNAT - Funciones de acceso (las dos puertas)
-- Ejecutar DESPUES de 35_roles_permisos.sql
--
--  PUERTA 1  fn_login             usuario + contrasena  -> quien eres
--  PUERTA 2  fn_login_clave_sol   RUC + SIST + NORTON   -> con que empresa
--            fn_registrar_usuario crea la cuenta como INVITADO y la deja lista
-- =====================================================================

-- ---------------------------------------------------------------------
-- PUERTA 1: login de la plataforma
-- Devuelve { ok, sesion:{ usuario_id, rol, modulos, empresas, modo_demo... } }
-- ---------------------------------------------------------------------
create or replace function public.fn_login(p_usuario text, p_clave text)
returns jsonb language plpgsql volatile set search_path = public as $fn$
declare u public.usuarios%rowtype; v_perm jsonb;
begin
  select * into u from public.usuarios
   where upper(usuario) = upper(trim(p_usuario)) and tipo = 'PERSONA';
  if u.id is null then
    return jsonb_build_object('ok',false,'motivo','USUARIO_NO_EXISTE',
      'mensaje','El usuario no existe. Verifica o registrate.');
  end if;
  if u.clave <> p_clave then
    return jsonb_build_object('ok',false,'motivo','CLAVE_INCORRECTA',
      'mensaje','La contrasena no coincide.');
  end if;
  if not u.activo then
    return jsonb_build_object('ok',false,'motivo','INACTIVO',
      'mensaje','Tu cuenta esta desactivada. Solicitalo a tu docente.');
  end if;
  if not exists (select 1 from public.roles_permisos rp
                  where rp.rol = u.rol and rp.puede_ingresar) then
    return jsonb_build_object('ok',false,'motivo','ROL_SIN_ACCESO',
      'mensaje','Tu rol '||u.rol||' no tiene acceso al simulador.');
  end if;

  update public.usuarios set ultimo_acceso = now() where id = u.id;
  v_perm := public.fn_permisos(u.id);
  return jsonb_build_object('ok',true,'sesion',v_perm);
end; $fn$;

-- ---------------------------------------------------------------------
-- Registro: nace INVITADO, activo, y entra de inmediato con acceso limitado
-- (Plan Contable + FV 621 con el RUC demo, sin guardar avance)
-- ---------------------------------------------------------------------
create or replace function public.fn_registrar_usuario(
  p_usuario text, p_clave text, p_denominacion text default null)
returns jsonb language plpgsql volatile set search_path = public as $fn$
declare v_id bigint;
begin
  if length(trim(coalesce(p_usuario,''))) < 3 then
    return jsonb_build_object('ok',false,'mensaje','El usuario debe tener al menos 3 caracteres.');
  end if;
  if length(coalesce(p_clave,'')) < 4 then
    return jsonb_build_object('ok',false,'mensaje','La contrasena debe tener al menos 4 caracteres.');
  end if;
  if exists (select 1 from public.usuarios
              where upper(usuario)=upper(trim(p_usuario)) and tipo='PERSONA') then
    return jsonb_build_object('ok',false,'mensaje','Ese nombre de usuario ya esta tomado.');
  end if;

  insert into public.usuarios (ruc, usuario, clave, denominacion, rol, activo, tipo)
  values ('20123456789', trim(p_usuario), p_clave,
          coalesce(nullif(trim(p_denominacion),''), trim(p_usuario)),
          'INVITADO', true, 'PERSONA')
  returning id into v_id;

  return jsonb_build_object('ok',true,'sesion',public.fn_permisos(v_id));
end; $fn$;

-- ---------------------------------------------------------------------
-- PUERTA 2: Clave SOL del aplicativo
-- Valida el RUC contra empresas_simulador, exige SIST/NORTON y comprueba
-- que el rol de la sesion tenga permitida esa empresa y ese modulo.
-- ---------------------------------------------------------------------
create or replace function public.fn_login_clave_sol(
  p_usuario_sesion bigint, p_ruc text, p_usuario text, p_clave text,
  p_modulo text default null)
returns jsonb language plpgsql volatile set search_path = public as $fn$
declare v_emp public.empresas_simulador%rowtype; v_rol text; rp public.roles_permisos%rowtype;
begin
  select rol into v_rol from public.usuarios
   where id = p_usuario_sesion and activo and tipo = 'PERSONA';
  if v_rol is null then
    return jsonb_build_object('ok',false,'motivo','SIN_SESION',
      'mensaje','Debes iniciar sesion en el simulador antes de usar la Clave SOL.');
  end if;
  select * into rp from public.roles_permisos where rol = v_rol;

  select * into v_emp from public.empresas_simulador where ruc = trim(p_ruc);
  if v_emp.ruc is null then
    return jsonb_build_object('ok',false,'motivo','RUC_NO_EXISTE',
      'mensaje','El numero de RUC no corresponde a ninguna empresa registrada.');
  end if;
  if upper(trim(p_usuario)) <> 'SIST' or p_clave <> 'NORTON' then
    return jsonb_build_object('ok',false,'motivo','CLAVE_SOL_INCORRECTA',
      'mensaje','El usuario o la contrasena de la Clave SOL no son correctos.');
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
end; $fn$;

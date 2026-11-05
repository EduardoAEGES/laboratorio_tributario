-- =====================================================================
-- SIMULADOR SUNAT - Registrar clientes y proveedores (tabla empresas)
-- Proyecto: klmjmlhwuzhymrplemgw
-- Ejecutar DESPUES de 68_empresas_aa4_sci.sql (no depende de 70/71).
--
-- Problema:
--   El botón "+ Registrar Nueva Empresa" de SEE - SOL (tramites.html) hacía
--   un insert directo en `empresas`. Desde 50_seguridad.sql anon solo puede
--   leer esa tabla, así que respondía "permission denied for table empresas"
--   y la empresa vivía solo mientras la página estaba abierta.
--
-- Solución (convención del proyecto: toda escritura pasa por una fn_*):
--   fn_registrar_empresa(p_datos jsonb) inserta la empresa si el RUC no existe.
--   Si ya existe (en empresas o en empresas_simulador) NO la sobrescribe:
--   devuelve la registrada, para que un alumno no pueda cambiar la razón
--   social que otro ya usa.
-- Se puede ejecutar más de una vez.
-- =====================================================================

create or replace function public.fn_registrar_empresa(p_datos jsonb)
returns jsonb language plpgsql volatile
security definer set search_path = public, pg_temp as $fn$
declare
  v_ruc   text := regexp_replace(coalesce(p_datos->>'ruc', ''), '\D', '', 'g');
  v_razon text := upper(trim(regexp_replace(coalesce(p_datos->>'razon_social', ''), '\s+', ' ', 'g')));
  v_fila  public.empresas;
  v_ex    jsonb;
begin
  if v_ruc !~ '^(10|15|16|17|20)\d{9}$' then
    return jsonb_build_object('ok', false, 'motivo', 'RUC_INVALIDO',
      'mensaje', 'El RUC debe tener 11 dígitos y empezar con 10, 15, 16, 17 o 20.');
  end if;
  if length(v_razon) < 3 then
    return jsonb_build_object('ok', false, 'motivo', 'SIN_RAZON_SOCIAL',
      'mensaje', 'Ingresa la razón social o los apellidos y nombres del contribuyente.');
  end if;

  -- Ya registrada: se devuelve tal cual, sin modificarla
  select to_jsonb(e) into v_ex from public.empresas e where e.ruc = v_ruc limit 1;
  if v_ex is null then
    select jsonb_build_object('ruc', s.ruc, 'razon_social', s.razon_social,
             'direccion_legal', s.direccion_fiscal, 'distrito_ciudad', s.distrito,
             'provincia', s.provincia, 'departamento', s.departamento)
      into v_ex from public.empresas_simulador s where s.ruc = v_ruc;
  end if;
  if v_ex is not null then
    return jsonb_build_object('ok', true, 'nueva', false, 'empresa', v_ex,
      'mensaje', 'El RUC ' || v_ruc || ' ya estaba registrado como "' || (v_ex->>'razon_social') ||
                 '". Se usarán esos datos.');
  end if;

  -- Convierte cada dato al tipo de su columna y nombra solo las columnas que
  -- llena el formulario (si la tabla tiene otras, como un id, se dejan a su default)
  v_fila := jsonb_populate_record(null::public.empresas,
              p_datos || jsonb_build_object('ruc', v_ruc, 'razon_social', v_razon));
  insert into public.empresas
    (ruc, razon_social, nombre_comercial, tipo_empresa, condicion, estado_domicilio,
     fecha_inicio_actividades, actividad_comercial, ciiu, direccion_legal, urbanizacion,
     distrito_ciudad, provincia, departamento, pais, codigo_postal, comercio_exterior)
  values
    (v_fila.ruc, v_fila.razon_social, v_fila.nombre_comercial, v_fila.tipo_empresa,
     coalesce(v_fila.condicion, 'Activo'), coalesce(v_fila.estado_domicilio, 'Habido'),
     v_fila.fecha_inicio_actividades, v_fila.actividad_comercial, v_fila.ciiu,
     v_fila.direccion_legal, v_fila.urbanizacion, v_fila.distrito_ciudad, v_fila.provincia,
     v_fila.departamento, coalesce(v_fila.pais, 'Perú'), v_fila.codigo_postal,
     v_fila.comercio_exterior)
  returning * into v_fila;

  return jsonb_build_object('ok', true, 'nueva', true, 'empresa', to_jsonb(v_fila),
    'mensaje', 'Empresa registrada. Desde ahora aparecerá al buscar el RUC ' || v_ruc || '.');
end; $fn$;

revoke execute on function public.fn_registrar_empresa(jsonb) from public;
grant execute on function public.fn_registrar_empresa(jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Comprobación (registra una empresa de prueba y la borra)
-- ---------------------------------------------------------------------
-- select fn_registrar_empresa('{"ruc":"20999999999","razon_social":"Prueba Registro S.A.C."}');
--   -> ok:true, nueva:true
-- select fn_registrar_empresa('{"ruc":"20999999999","razon_social":"Otro nombre"}');
--   -> ok:true, nueva:false, conserva "PRUEBA REGISTRO S.A.C."
-- delete from empresas where ruc = '20999999999';

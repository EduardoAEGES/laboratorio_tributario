-- =============================================================================
-- 75 · Clave SOL con un RUC que no está en el simulador (ingreso TEMPORAL)
-- =============================================================================
-- Si el alumno escribe un RUC que no figura en empresas_simulador (por ejemplo,
-- la empresa que inventó su equipo), puede entrar igual de forma temporal:
--   * escribe la razón social (y opcionalmente el domicilio);
--   * no se crea ninguna fila en empresas_simulador;
--   * no hay registros de compras/ventas precargados;
--   * el avance NO se guarda en el servidor (solo en esa computadora).
-- Las reglas de rol se respetan: si el rol solo puede usar ciertos RUC
-- (todas_las_empresas = false, p. ej. INVITADO) no puede entrar con un RUC libre.
-- Re-ejecutable.
-- =============================================================================

create or replace function public.fn_login_clave_sol_temporal(
    p_usuario_sesion bigint, p_ruc text, p_razon_social text,
    p_usuario text, p_clave text, p_modulo text default null, p_direccion text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_rol   text;
    rp      public.roles_permisos%rowtype;
    v_ruc   text := trim(coalesce(p_ruc, ''));
    v_razon text := upper(regexp_replace(trim(coalesce(p_razon_social, '')), '\s+', ' ', 'g'));
    v_dir   text := nullif(upper(trim(coalesce(p_direccion, ''))), '');
begin
    -- 1) Sesión de persona válida
    select rol into v_rol from public.usuarios where id = p_usuario_sesion and activo and tipo = 'PERSONA';
    if v_rol is null then
        return jsonb_build_object('ok', false, 'motivo', 'SIN_SESION',
            'mensaje', 'Debes iniciar sesion en el simulador antes de usar la Clave SOL.');
    end if;
    select * into rp from public.roles_permisos where rol = v_rol;

    -- 2) Formato del RUC
    if v_ruc !~ '^(10|15|17|20)[0-9]{9}$' then
        return jsonb_build_object('ok', false, 'motivo', 'RUC_INVALIDO',
            'mensaje', 'El RUC debe tener 11 digitos y empezar con 10 (persona natural) o 20 (empresa). Revisa el numero.');
    end if;
    if exists (select 1 from public.empresas_simulador where ruc = v_ruc) then
        return jsonb_build_object('ok', false, 'motivo', 'RUC_REGISTRADO',
            'mensaje', 'Ese RUC ya esta registrado en el simulador: ingresa con la Clave SOL normal.');
    end if;
    if length(v_razon) < 3 then
        return jsonb_build_object('ok', false, 'motivo', 'RAZON_SOCIAL_REQUERIDA',
            'mensaje', 'Escribe la razon social (o los apellidos y nombres) del contribuyente.');
    end if;

    -- 3) Clave SOL: SIST / NORTON
    if upper(trim(coalesce(p_usuario, ''))) <> 'SIST' or coalesce(p_clave, '') <> 'NORTON' then
        return jsonb_build_object('ok', false, 'motivo', 'CLAVE_SOL_INCORRECTA',
            'mensaje', 'El usuario o la contrasena de la Clave SOL no son correctos (usa SIST / NORTON).');
    end if;

    -- 4) Reglas del rol (matriz roles_permisos)
    if not coalesce(rp.todas_las_empresas, true) then
        return jsonb_build_object('ok', false, 'motivo', 'EMPRESA_NO_PERMITIDA',
            'mensaje', 'Con tu rol ' || v_rol || ' solo puedes trabajar con el RUC ' ||
                       array_to_string(rp.rucs_permitidos, ', ') || '.');
    end if;
    if p_modulo is not null and not public.fn_puede_acceder(p_usuario_sesion, p_modulo, v_ruc) then
        return jsonb_build_object('ok', false, 'motivo', 'MODULO_NO_PERMITIDO',
            'mensaje', 'Tu rol ' || v_rol || ' no tiene habilitado este aplicativo.');
    end if;

    return jsonb_build_object('ok', true,
        'empresa', jsonb_build_object(
            'ruc', v_ruc, 'razon_social', v_razon, 'nombre_comercial', v_razon,
            'regimen', case when v_ruc like '10%' then 'Renta de Cuarta Categoria' else 'Regimen General' end,
            'cod_empresa', 'TEMP', 'direccion', v_dir, 'temporal', true),
        'modo_demo', true);
end; $$;

grant execute on function public.fn_login_clave_sol_temporal(bigint, text, text, text, text, text, text) to anon, authenticated;

-- El avance solo se guarda para las empresas del simulador: un RUC temporal
-- nunca deja filas en avance_usuario.
create or replace function public.fn_guardar_avance(p_usuario bigint, p_ruc text, p_modulo text, p_estado jsonb)
returns public.avance_usuario
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_row public.avance_usuario;
begin
    if not exists (select 1 from public.empresas_simulador where ruc = p_ruc) then
        return null;
    end if;
    insert into public.avance_usuario (usuario_id, ruc, modulo, estado)
    values (p_usuario, p_ruc, p_modulo, coalesce(p_estado, '{}'::jsonb))
    on conflict (usuario_id, ruc, modulo) do update set estado = excluded.estado, actualizado_at = now()
    returning * into v_row;
    return v_row;
end; $$;

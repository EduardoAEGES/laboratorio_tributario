-- =====================================================================
-- SIMULADOR SUNAT - Endurecimiento de la base (Paso 1)
-- Ejecutar DESPUES de 45_gestor.sql
--
-- Que hace:
--   1. Todas las funciones fn_* pasan a SECURITY DEFINER (ademas de ser lo
--      correcto, ARREGLA un bug: como INVOKER corrian con el rol anon y
--      fn_login / fn_registrar_usuario fallaban al escribir en usuarios).
--   2. Las contrasenas se guardan hasheadas con bcrypt (pgcrypto).
--   3. Nadie puede leer la tabla usuarios desde el navegador.
--   4. La data del simulador queda de SOLO LECTURA para anon; escribir
--      solo es posible llamando a las funciones.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) SECURITY DEFINER + search_path fijo en todas las funciones
-- ---------------------------------------------------------------------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as firma
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname='public' and p.proname like 'fn\_%'
  loop
    execute format('alter function %s security definer', f.firma);
    execute format('alter function %s set search_path = public, pg_temp', f.firma);
    execute format('grant execute on function %s to anon, authenticated', f.firma);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2) Contrasenas hasheadas
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

alter table public.usuarios add column if not exists clave_hash text;
alter table public.usuarios alter column clave drop not null;

-- Migrar las claves existentes y borrar el texto plano
update public.usuarios
   set clave_hash = extensions.crypt(clave, extensions.gen_salt('bf', 10))
 where clave_hash is null and clave is not null;
update public.usuarios set clave = null where clave is not null;

-- fn_login, fn_registrar_usuario, fn_login_clave_sol y fn_cambiar_clave
-- verifican contra el hash: ver 40_acceso.sql (version actualizada).

-- ---------------------------------------------------------------------
-- 3) La tabla usuarios deja de ser legible desde el navegador
-- ---------------------------------------------------------------------
drop policy if exists usuarios_select_anon on public.usuarios;
revoke all on public.usuarios from anon, authenticated;

create or replace view public.v_usuarios_publico as
  select id, usuario, denominacion, rol, activo, tipo, ultimo_acceso from public.usuarios;
grant select on public.v_usuarios_publico to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) Solo lectura para todo lo demas del simulador
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    -- data base del simulador
    'registro_ventas','registro_compras','ventas_adicional','ventas_detalle','ventas_cuotas',
    'compras_adicional','compras_detalle','compras_cuotas','t_registro','plame_detalle',
    'plame_resumen','conceptos_plame','catalogo_productos','catalogo_compras',
    'resumen_fv621','resumen_fv710','parametros_tributarios','empresas_simulador',
    'empresas','modulos','roles_permisos','ubigeo','pcge_catalogo',
    -- avance y gestion (se escriben solo por funciones)
    'avance_usuario','declaraciones','movimientos_usuario','secciones','matriculas',
    'reinicios','sire_estado']
  loop
    if exists (select 1 from pg_tables where schemaname='public' and tablename=t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
      execute format('grant select on public.%I to anon, authenticated', t);
      execute format('drop policy if exists %I on public.%I', t||'_lectura', t);
      execute format('create policy %I on public.%I for select to anon, authenticated using (true)',
                     t||'_lectura', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5) Comprobacion
-- ---------------------------------------------------------------------
select c.relname as tabla, c.relrowsecurity as rls,
       has_table_privilege('anon',c.oid,'SELECT') as anon_lee,
       (has_table_privilege('anon',c.oid,'INSERT') or has_table_privilege('anon',c.oid,'UPDATE')
        or has_table_privilege('anon',c.oid,'DELETE')) as anon_escribe
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
   and c.relname in ('usuarios','avance_usuario','declaraciones','registro_ventas','secciones')
 order by 1;
-- Esperado: rls=true en todas, anon_escribe=false en todas,
--           anon_lee=false solo en usuarios.

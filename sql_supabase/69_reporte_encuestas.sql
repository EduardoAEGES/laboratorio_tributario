-- ============================================================================
-- 69_reporte_encuestas.sql
-- ----------------------------------------------------------------------------
-- Lectura del reporte de la tabla public.encuestas para el modo MASTER.
--
-- La tabla encuestas tiene RLS activado y una unica policy de INSERT publico
-- ("Permitir inserciones publicas"), por lo que anon puede GUARDAR encuestas
-- pero NO leerlas con un select directo (RLS filtra todas las filas).
--
-- Esta funcion SECURITY DEFINER devuelve las filas unicamente si el actor
-- (p_actor = usuario_id de la sesion) tiene rol MASTER en public.usuarios.
-- Cualquier otro actor recibe un conjunto vacio. La usa encuestas_reporte.html
-- via rpc('fn_reporte_encuestas', { p_actor: Sesion.uid() }).
--
-- Nota: mientras no exista el token de sesion (pendiente #1 de CLAUDE.md),
-- p_actor viaja como parametro; alguien que conozca el id de un MASTER podria
-- invocarla. Aun asi, es mejor que abrir SELECT a anon sobre toda la tabla.
-- ============================================================================
create or replace function public.fn_reporte_encuestas(p_actor bigint)
returns setof public.encuestas
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.usuarios u
    where u.id = p_actor and upper(u.rol) = 'MASTER'
  ) then
    return;  -- no es MASTER: no devuelve nada
  end if;
  return query
    select * from public.encuestas order by created_at desc;
end;
$$;

revoke all on function public.fn_reporte_encuestas(bigint) from public;
grant execute on function public.fn_reporte_encuestas(bigint) to anon, authenticated;

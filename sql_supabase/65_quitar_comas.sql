-- =============================================================================
-- 65 · Quitar las comas de todos los textos de las tablas del simulador
-- =============================================================================
-- El importador del RVIE/RCE separa los campos por coma: un nombre como
-- "Peralta Benavides, Ricardo" parte la fila en dos y da error.
--
-- Reglas (en este orden):
--   1. Separador de miles entre dígitos: "S/ 5,350.00"     -> "S/ 5350.00"
--   2. Cualquier otra coma pasa a espacio: "Peralta Benavides, Ricardo"
--                                          -> "Peralta Benavides Ricardo"
--      "CO., LTD."                         -> "CO. LTD."
--   3. Se juntan los espacios dobles y se recorta.
--
-- Solo toca tablas del simulador (no las de otros proyectos de la misma base).
-- Es re-ejecutable: si ya no hay comas, no cambia nada.
-- =============================================================================

create or replace function pg_temp.sin_comas(t text) returns text
language sql immutable as $$
  select btrim(regexp_replace(
           regexp_replace(
             regexp_replace(t, '(\d),(?=\d{3}(\D|$))', '\1', 'g'),   -- 1) miles
           '\s*,\s*', ' ', 'g'),                                       -- 2) comas
         '\s{2,}', ' ', 'g'))                                          -- 3) espacios
$$;

do $$
declare
  r record;
  n bigint;
  total bigint := 0;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.data_type in ('text', 'character varying')
      and c.table_name in (
        'registro_ventas', 'registro_compras',
        'ventas_adicional', 'ventas_detalle', 'ventas_cuotas',
        'compras_adicional', 'compras_detalle', 'compras_cuotas',
        't_registro', 'plame_detalle', 'plame_resumen', 'conceptos_plame',
        'catalogo_productos', 'catalogo_compras',
        'resumen_fv621', 'resumen_fv710', 'parametros_tributarios',
        'empresas_simulador', 'empresas')
  loop
    execute format(
      'update public.%I set %I = pg_temp.sin_comas(%I) where %I like ''%%,%%''',
      r.table_name, r.column_name, r.column_name, r.column_name);
    get diagnostics n = row_count;
    if n > 0 then
      raise notice '%.%: % filas', r.table_name, r.column_name, n;
      total := total + n;
    end if;
  end loop;
  raise notice 'Total de celdas corregidas: %', total;
end $$;

-- Verificación: debe devolver 0 filas
-- select 'registro_ventas' t, count(*) from registro_ventas where "Apellidos Nombres/ Razón Social" like '%,%'
-- union all
-- select 'registro_compras', count(*) from registro_compras where "Apellidos Nombres/ Razón  Social" like '%,%'
-- union all
-- select 'plame_detalle', count(*) from plame_detalle where nombre_completo like '%,%'
-- union all
-- select 't_registro', count(*) from t_registro where nombre_completo like '%,%';

-- Vaciar el SIRE antes de importar: los scripts traen las 10 empresas completas,
-- incluida la empresa demo que ya estaba cargada (387 ventas / 459 compras).
truncate table public.registro_ventas;
truncate table public.registro_compras;

select 'registro_ventas' as tabla, count(*) as filas from public.registro_ventas
union all
select 'registro_compras', count(*) from public.registro_compras;

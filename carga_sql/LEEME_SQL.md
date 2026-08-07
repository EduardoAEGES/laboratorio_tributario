# Scripts SQL para cargar la data en Supabase

Todo el contenido de los CSV convertido a sentencias `INSERT`, listo para pegar en el
**SQL Editor** de Supabase (proyecto `klmjmlhwuzhymrplemgw`). 39,897 filas en 23 scripts.

## Orden de ejecución

| Paso | Script | Tabla | Filas |
|---|---|---|---|
| 1 | `00_crear_tablas.sql` | ajusta tipos, crea tablas nuevas, índices y vistas | — |
| 2 | `00_vaciar_sire.sql` | vacía registro_ventas y registro_compras | — |
| 3 | `01_usuarios.sql` | usuarios | 10 |
| 4 | `02_empresas.sql` | empresas | 62 |
| 5 | `03_registro_ventas_parte1.sql` … `parte2` | registro_ventas | 4 181 |
| 6 | `04_registro_compras_parte1.sql` … `parte3` | registro_compras | 4 553 |
| 7 | `05_ventas_adicional.sql` | ventas_adicional | 4 181 |
| 8 | `06_ventas_detalle.sql` | ventas_detalle | 7 220 |
| 9 | `07_ventas_cuotas.sql` | ventas_cuotas | 3 270 |
| 10 | `08_compras_adicional.sql` | compras_adicional | 4 553 |
| 11 | `09_compras_detalle.sql` | compras_detalle | 4 775 |
| 12 | `10_compras_cuotas.sql` | compras_cuotas | 4 344 |
| 13 | `11_t_registro.sql` | t_registro | 115 |
| 14 | `12_plame_detalle.sql` | plame_detalle | 1 936 |
| 15 | `13_plame_resumen.sql` | plame_resumen | 190 |
| 16 | `14_conceptos_plame.sql` | conceptos_plame | 18 |
| 17 | `15_catalogo_productos.sql` | catalogo_productos | 115 |
| 18 | `16_catalogo_compras.sql` | catalogo_compras | 127 |
| 19 | `17_resumen_fv621.sql` | resumen_fv621 | 190 |
| 20 | `18_resumen_fv710.sql` | resumen_fv710 | 20 |
| 21 | `19_parametros_tributarios.sql` | parametros_tributarios | 27 |
| 22 | `20_empresas_simulador.sql` | empresas_simulador | 10 |

Los scripts llevan `on conflict … do nothing`, así que se pueden volver a ejecutar sin
duplicar filas (excepto `01_usuarios` y `16_catalogo_compras`, que no tienen clave única:
esos solo deben correrse una vez).

## Dos formas de ejecutarlos

**A) SQL Editor (sin instalar nada).** Abrir el `.sql` con el Bloc de notas, seleccionar todo
(Ctrl+E, Ctrl+C), pegar en el SQL Editor y *Run*. Los archivos más pesados son de ~1.1 MB
(`03_registro_ventas_parte1`, `04_registro_compras_parte1` y `parte2`); el editor los acepta,
aunque el navegador tarda unos segundos.

**B) psql (más rápido para los archivos grandes).** En *Project Settings → Database →
Connection string* copias la cadena y ejecutas:

```bash
psql "postgresql://postgres:TU_PASSWORD@db.klmjmlhwuzhymrplemgw.supabase.co:5432/postgres" \
  -f 00_crear_tablas.sql -f 01_usuarios.sql -f 02_empresas.sql
```

o uno por uno con `-f archivo.sql`.

## Verificación después de cargar

```sql
select 'registro_ventas' t, count(*) from registro_ventas
union all select 'registro_compras', count(*) from registro_compras
union all select 't_registro', count(*) from t_registro
union all select 'plame_detalle', count(*) from plame_detalle
union all select 'resumen_fv621', count(*) from resumen_fv621
union all select 'usuarios', count(*) from usuarios;
-- esperado: 4181 / 4553 / 115 / 1936 / 190 / 13 (10 nuevos + 3 que ya existían)
```

Prueba de que quedó todo enlazado por RUC:

```sql
select u.ruc, u.denominacion,
       (select count(*) from registro_ventas v where v."Ruc"::text = u.ruc) as ventas,
       (select count(*) from registro_compras c where c."RUC"::text = u.ruc) as compras,
       (select count(*) from t_registro t where t.ruc_empleador = u.ruc) as trabajadores,
       (select count(*) from plame_detalle p where p.ruc_empleador = u.ruc) as filas_plame
from usuarios u
where u.usuario = 'SIST'
order by u.ruc;
```

## Nota técnica

Los valores van entre comillas simples aunque la columna sea numérica: Postgres convierte el
literal al tipo de la columna. Las celdas vacías van como `NULL`. Esto ya se probó contra tu
base creando un esquema temporal, insertando y verificando que `pg_typeof` devuelve
`double precision` / `bigint` correctamente.

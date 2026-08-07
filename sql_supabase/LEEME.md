# Carga en Supabase — scripts partidos (máx. 293 KB)

El SQL Editor de Supabase rechaza queries de más de ~1 MB
(*"Query is too large to be run via the SQL Editor"*). Estos scripts están partidos para que
ninguno pase de **293 KB**. Usa **esta carpeta**, no `carga_sql` (esa quedó obsoleta).

## Ya ejecutaste (según tu avance)

1. ✅ `00_crear_tablas.sql`
2. ✅ `00_vaciar_sire.sql`
3. ✅ `01_usuarios.sql`
4. ✅ `02_empresas.sql`

## Sigue desde aquí

| Orden | Archivos | Tabla | Filas |
|---|---|---|---|
| 5 | `03_registro_ventas_parte1` … `parte6` | registro_ventas | 4 181 |
| 6 | `04_registro_compras_parte1` … `parte11` | registro_compras | 4 553 |
| 7 | `05_ventas_adicional_parte1` … `parte4` | ventas_adicional | 4 181 |
| 8 | `06_ventas_detalle_parte1` … `parte3` | ventas_detalle | 7 220 |
| 9 | `07_ventas_cuotas.sql` | ventas_cuotas | 3 270 |
| 10 | `08_compras_adicional_parte1` … `parte5` | compras_adicional | 4 553 |
| 11 | `09_compras_detalle_parte1` … `parte2` | compras_detalle | 4 775 |
| 12 | `10_compras_cuotas.sql` | compras_cuotas | 4 344 |
| 13 | `11_t_registro.sql` | t_registro | 115 |
| 14 | `12_plame_detalle_parte1` … `parte4` | plame_detalle | 1 936 |
| 15 | `13_plame_resumen.sql` | plame_resumen | 190 |
| 16 | `14_conceptos_plame.sql` | conceptos_plame | 18 |
| 17 | `15_catalogo_productos.sql` | catalogo_productos | 115 |
| 18 | `16_catalogo_compras.sql` | catalogo_compras | 127 |
| 19 | `17_resumen_fv621.sql` | resumen_fv621 | 190 |
| 20 | `18_resumen_fv710.sql` | resumen_fv710 | 20 |
| 21 | `19_parametros_tributarios.sql` | parametros_tributarios | 27 |
| 22 | `20_empresas_simulador.sql` | empresas_simulador | 10 |

Son 46 scripts de datos. Todos llevan `on conflict … do nothing` (salvo `01_usuarios` y
`16_catalogo_compras`), así que si repites uno por error no se duplica nada.

## Atajo recomendado para las tablas grandes

En vez de pegar 31 scripts de las 6 tablas más pesadas, puedes subir su CSV desde el
**Table Editor** — ahí no hay límite de tamaño y es un clic por tabla:

1. Table Editor → seleccionas la tabla → botón **Insert** → *Import data from CSV*
2. Eliges el archivo correspondiente de la carpeta `carga_csv`
3. *Import*

| Tabla | CSV a subir | Reemplaza a |
|---|---|---|
| registro_ventas | `03_registro_ventas.csv` | 6 scripts |
| registro_compras | `04_registro_compras.csv` | 11 scripts |
| ventas_adicional | `05_ventas_adicional.csv` | 4 scripts |
| ventas_detalle | `06_ventas_detalle.csv` | 3 scripts |
| compras_adicional | `08_compras_adicional.csv` | 5 scripts |
| plame_detalle | `12_plame_detalle.csv` | 4 scripts |

No necesitas abrir el CSV en Excel: el navegador solo lo sube. El resto de tablas las cargas
con su script SQL, que son de una sola parte.

## Al terminar, verifica

```sql
select 'registro_ventas' t, count(*) from registro_ventas
union all select 'registro_compras', count(*) from registro_compras
union all select 'ventas_adicional', count(*) from ventas_adicional
union all select 'ventas_detalle', count(*) from ventas_detalle
union all select 'ventas_cuotas', count(*) from ventas_cuotas
union all select 'compras_adicional', count(*) from compras_adicional
union all select 'compras_detalle', count(*) from compras_detalle
union all select 'compras_cuotas', count(*) from compras_cuotas
union all select 't_registro', count(*) from t_registro
union all select 'plame_detalle', count(*) from plame_detalle
union all select 'plame_resumen', count(*) from plame_resumen
union all select 'resumen_fv621', count(*) from resumen_fv621;
```

Esperado: 4181 · 4553 · 4181 · 7220 · 3270 · 4553 · 4775 · 4344 · 115 · 1936 · 190 · 190

Y el cruce por RUC (debe listar las 10 empresas con datos en todo):

```sql
select u.ruc, u.denominacion,
       (select count(*) from registro_ventas v where v."Ruc"::text = u.ruc) as ventas,
       (select count(*) from registro_compras c where c."RUC"::text = u.ruc) as compras,
       (select count(*) from t_registro t where t.ruc_empleador = u.ruc) as trabajadores,
       (select count(*) from plame_detalle p where p.ruc_empleador = u.ruc) as filas_plame
from usuarios u where u.usuario = 'SIST' order by u.ruc;
```

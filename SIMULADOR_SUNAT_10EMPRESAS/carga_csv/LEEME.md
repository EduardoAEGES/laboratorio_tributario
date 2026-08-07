# Carga de datos del Simulador SUNAT (10 empresas)

Datos ficticios de **10 empresas**, periodos **01/2025 a 07/2026** (19 meses), listos para
importar en el proyecto Supabase `klmjmlhwuzhymrplemgw` y que el simulador muestre el SIRE,
el T-Registro y la PLAME precargados al iniciar sesión con la Clave SOL.

## 1. Acceso (tabla `usuarios`)

| RUC | Empresa | Usuario | Clave |
|---|---|---|---|
| 20123456789 | EMPRESA DEMO S.A.C. | SIST | NORTON |
| 20601458722 | COMERCIAL FERRETERA SUR S.A.C. | SIST | NORTON |
| 20548912343 | RESTAURANTES SABOR ANDINO E.I.R.L. | SIST | NORTON |
| 20512347895 | BOTICA SALUD TOTAL S.A.C. | SIST | NORTON |
| 20487563219 | TEXTILES ALPACA EXPORT S.A.C. | SIST | NORTON |
| 20455678120 | TRANSPORTES CARGA RAPIDA S.R.L. | SIST | NORTON |
| 20601987458 | CONSTRUCTORA HORIZONTE ANDINO S.A.C. | SIST | NORTON |
| 20530147852 | AGROEXPORT VALLE VERDE S.A.C. | SIST | NORTON |
| 20602345671 | CONSULTORES CONTABLES & ASOCIADOS E.I.R.L. | SIST | NORTON |
| 20609876540 | MINIMARKET DON PEPE E.I.R.L. | SIST | NORTON |

> El rol asignado es **PRUEBA** porque es el único que `auth.js` permite ingresar hoy.
> Los RUC de las 9 empresas nuevas tienen dígito verificador válido (módulo 11).

## 2. Orden de importación

1. **Ejecutar `00_crear_tablas.sql`** en el SQL Editor de Supabase.
   Ajusta tipos de `registro_ventas`, crea índices por RUC/periodo, crea las tablas nuevas
   (T-Registro, PLAME, detalle, cuotas, catálogos, resúmenes) y las vistas de apoyo.
2. **Vaciar** las tablas del SIRE antes de importar (los CSV traen las 10 empresas completas,
   incluida la demo que ya está cargada):

   ```sql
   truncate table public.registro_ventas;
   truncate table public.registro_compras;
   ```

3. Importar los CSV en este orden (Table Editor → tabla → *Import data from CSV*):

| # | Archivo | Tabla destino | Filas |
|---|---|---|---|
| 01 | 01_usuarios.csv | usuarios | 10 |
| 02 | 02_empresas.csv | empresas | 62 |
| 03 | 03_registro_ventas.csv | registro_ventas | 4 181 |
| 04 | 04_registro_compras.csv | registro_compras | 4 553 |
| 05 | 05_ventas_adicional.csv | ventas_adicional | 4 181 |
| 06 | 06_ventas_detalle.csv | ventas_detalle | 7 220 |
| 07 | 07_ventas_cuotas.csv | ventas_cuotas | 3 270 |
| 08 | 08_compras_adicional.csv | compras_adicional | 4 553 |
| 09 | 09_compras_detalle.csv | compras_detalle | 4 775 |
| 10 | 10_compras_cuotas.csv | compras_cuotas | 4 344 |
| 11 | 11_t_registro.csv | t_registro | 115 |
| 12 | 12_plame_detalle.csv | plame_detalle | 1 936 |
| 13 | 13_plame_resumen.csv | plame_resumen | 190 |
| 14 | 14_conceptos_plame.csv | conceptos_plame | 18 |
| 15 | 15_catalogo_productos.csv | catalogo_productos | 115 |
| 16 | 16_catalogo_compras.csv | catalogo_compras | 127 |
| 17 | 17_resumen_fv621.csv | resumen_fv621 | 190 |
| 18 | 18_resumen_fv710.csv | resumen_fv710 | 20 |
| 19 | 19_parametros_tributarios.csv | parametros_tributarios | 27 |
| 20 | 20_empresas_simulador.csv | empresas_simulador | 10 |

Formato: **UTF-8**, separador **coma**, comillas dobles solo cuando el valor lo necesita,
celda vacía = NULL. Fechas en texto `dd/mm/aaaa` (igual que la data que ya tenías cargada).

## 3. Cómo consultar la data desde el simulador

Después del login, `usuarioActual().ruc` ya tiene el RUC. Con eso:

```js
// SIRE - Registro de Ventas del periodo
const { data: ventas } = await supabase
  .from('registro_ventas')
  .select('*')
  .eq('Ruc', Number(ruc))
  .eq('Periodo', Number(periodo));

// SIRE - Registro de Compras
const { data: compras } = await supabase
  .from('registro_compras')
  .select('*')
  .eq('RUC', Number(ruc))
  .eq('Periodo', Number(periodo));

// T-Registro (trabajadores del empleador)
const { data: trabajadores } = await supabase
  .from('t_registro')
  .select('*')
  .eq('ruc_empleador', ruc);

// PLAME del periodo
const { data: plame } = await supabase
  .from('plame_detalle')
  .select('*')
  .eq('ruc_empleador', ruc)
  .eq('periodo', periodo);

// Casillas esperadas del FV 621 (para validar el ejercicio del alumno)
const { data: casillas } = await supabase
  .from('resumen_fv621')
  .select('*')
  .eq('ruc', ruc)
  .eq('periodo', periodo)
  .single();
```

`Ruc` y `Periodo` en `registro_ventas`/`registro_compras` son **bigint** (así estaba la tabla),
por eso van con `Number()`. En las tablas nuevas son **text**.

## 4. Qué contiene cada bloque

- **SIRE**: ventas y compras en el layout oficial (CAR SUNAT, tipo de CP, notas de crédito con
  documento modificado, exportaciones en USD, recibos por honorarios, invoices de no
  domiciliado, ICBPER). Las hojas *adicional*, *detalle* y *cuotas* guardan lo que el layout
  SIRE no tiene: forma de pago, cuotas, detracciones con constancia, ítems y descripciones.
- **T-Registro**: 115 trabajadores con alta/baja, contrato, régimen pensionario con CUSPP,
  EsSalud/SIS, SCTR, cuentas de haberes y CTS.
- **PLAME**: 1 936 filas trabajador × periodo con básico, asignación familiar, horas extras,
  gratificaciones de julio y diciembre, bonificación extraordinaria 9 %, ONP/AFP, renta de 5ta,
  y el resumen mensual por empresa (incluye la renta de 4ta retenida de los recibos por
  honorarios).
- **Resúmenes**: `resumen_fv621` (190 declaraciones mensuales con arrastre del saldo a favor) y
  `resumen_fv710` (declaración anual estimada). Sirven como **respuesta esperada** para
  corregir automáticamente lo que declare el alumno.

## 5. Aviso de seguridad

El asesor de Supabase reporta que `registro_ventas`, `registro_compras`, `empresas` y otras 16
tablas tienen **RLS deshabilitado**: cualquiera con la clave anon (que está en `auth.js`, del
lado del cliente) puede leer y modificar todas las filas. Para un laboratorio con data ficticia
puede estar bien, pero si vas a publicarlo conviene activar RLS con políticas de solo lectura.
El SQL sugerido está en `00_crear_tablas.sql`, comentado al final — no lo ejecutes sin crear
antes las políticas, porque activar RLS sin políticas bloquea todo acceso.

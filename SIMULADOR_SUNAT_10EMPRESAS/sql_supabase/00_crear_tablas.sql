-- =====================================================================
-- SIMULADOR SUNAT - creacion de tablas para la data de las 10 empresas
-- Proyecto Supabase: klmjmlhwuzhymrplemgw
-- Ejecutar en el SQL Editor ANTES de importar los CSV de la carpeta carga_csv
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Ajuste de tipos en las tablas que ya existen (registro_ventas /
--    registro_compras). Algunas columnas estan como bigint y la nueva data
--    trae decimales (montos exonerados, ICBPER, etc.).
-- ---------------------------------------------------------------------
ALTER TABLE public.registro_ventas ALTER COLUMN "Mto Exonerado" TYPE double precision USING "Mto Exonerado"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "Mto Inafecto" TYPE double precision USING "Mto Inafecto"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "ISC" TYPE double precision USING "ISC"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "BI Grav IVAP" TYPE double precision USING "BI Grav IVAP"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "IVAP" TYPE double precision USING "IVAP"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "ICBPER" TYPE double precision USING "ICBPER"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "Otros Tributos" TYPE double precision USING "Otros Tributos"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "Valor FOB Embarcado" TYPE double precision USING "Valor FOB Embarcado"::double precision;
ALTER TABLE public.registro_ventas ALTER COLUMN "Valor OP Gratuitas" TYPE double precision USING "Valor OP Gratuitas"::double precision;

-- Indices para filtrar rapido por RUC y periodo desde el simulador
CREATE INDEX IF NOT EXISTS idx_rv_ruc_periodo ON public.registro_ventas ("Ruc", "Periodo");
CREATE INDEX IF NOT EXISTS idx_rc_ruc_periodo ON public.registro_compras ("RUC", "Periodo");

-- ---------------------------------------------------------------------
-- 2) Tablas nuevas (SIRE complementario, T-Registro, PLAME, catalogos)
-- ---------------------------------------------------------------------

drop table if exists public.ventas_adicional cascade;
create table public.ventas_adicional (
  id_venta text not null,
  periodo text,
  serie_del_cdp text,
  nro_cp bigint,
  comprobante text,
  tipo_de_cliente text,
  detalle_de_la_operacion text,
  descripcion text,
  forma_de_pago text,
  nro_cuotas bigint,
  motivo_nota_de_credito text,
  sujeto_a_detraccion text,
  pct_detraccion double precision,
  monto_detraccion double precision,
  nro_constancia_deposito text,
  anticipos bigint,
  otros_cargos bigint,
  monto_de_redondeo double precision,
  primary key (id_venta)
);

drop table if exists public.ventas_detalle cascade;
create table public.ventas_detalle (
  id_venta text not null,
  item_nro bigint not null,
  codigo_sku text,
  descripcion text,
  unidad_medida text,
  cantidad bigint,
  valor_unitario double precision,
  valor_de_venta_total double precision,
  moneda text,
  primary key (id_venta, item_nro)
);

drop table if exists public.ventas_cuotas cascade;
create table public.ventas_cuotas (
  id_venta text not null,
  nro_cuota bigint not null,
  total_cuotas bigint,
  fecha_de_vencimiento text,
  monto_de_la_cuota double precision,
  moneda text,
  primary key (id_venta, nro_cuota)
);

drop table if exists public.compras_adicional cascade;
create table public.compras_adicional (
  id_compra text not null,
  periodo text,
  serie_del_cdp text,
  nro_cp text,
  comprobante text,
  tipo_de_proveedor text,
  detalle_de_la_operacion text,
  descripcion text,
  forma_de_pago text,
  nro_cuotas bigint,
  motivo_nota_de_credito text,
  sujeto_detraccion_retencion text,
  tipo_detraccion_retencion text,
  pct_detraccion_retencion double precision,
  monto_detraccion_retencion double precision,
  nro_constancia_deposito text,
  anticipos bigint,
  otros_cargos bigint,
  monto_de_redondeo double precision,
  primary key (id_compra)
);

drop table if exists public.compras_detalle cascade;
create table public.compras_detalle (
  id_compra text not null,
  item_nro bigint not null,
  descripcion text,
  cantidad bigint,
  valor_unitario double precision,
  valor_total double precision,
  moneda text,
  primary key (id_compra, item_nro)
);

drop table if exists public.compras_cuotas cascade;
create table public.compras_cuotas (
  id_compra text not null,
  nro_cuota bigint not null,
  total_cuotas bigint,
  fecha_de_vencimiento text,
  monto_de_la_cuota double precision,
  moneda text,
  primary key (id_compra, nro_cuota)
);

drop table if exists public.t_registro cascade;
create table public.t_registro (
  id_trabajador text not null,
  ruc_empleador text,
  razon_social_empleador text,
  tipo_documento text,
  nro_documento text,
  apellido_paterno text,
  apellido_materno text,
  nombres text,
  nombre_completo text,
  fecha_nacimiento text,
  sexo text,
  nacionalidad text,
  estado_civil text,
  domicilio text,
  distrito text,
  provincia text,
  departamento text,
  telefono text,
  correo_electronico text,
  nivel_educativo text,
  ocupacion_cargo text,
  codigo_ciuo text,
  categoria_ocupacional text,
  tipo_trabajador text,
  area text,
  regimen_laboral text,
  tipo_contrato text,
  fecha_ingreso text,
  fecha_cese text,
  motivo_cese text,
  situacion text,
  periodicidad_remuneracion text,
  remuneracion_basica double precision,
  asignacion_familiar text,
  jornada_horas_semana bigint,
  dias_semana bigint,
  sujeto_horario_trabajo text,
  trabajador_con_discapacidad text,
  sindicalizado text,
  tipo_pago text,
  banco_haberes text,
  nro_cuenta_haberes text,
  banco_cts text,
  nro_cuenta_cts text,
  regimen_pensionario text,
  cuspp text,
  tipo_comision_afp text,
  regimen_salud text,
  essalud_vida text,
  sctr text,
  fecha_alta_tregistro text,
  fecha_baja_tregistro text,
  primary key (id_trabajador)
);

drop table if exists public.plame_detalle cascade;
create table public.plame_detalle (
  id_planilla text not null,
  periodo text,
  ruc_empleador text,
  razon_social_empleador text,
  id_trabajador text,
  nro_documento text,
  nombre_completo text,
  cargo text,
  categoria_ocupacional text,
  regimen_pensionario text,
  situacion text,
  dias_laborados bigint,
  dias_subsidiados bigint,
  dias_no_laborados bigint,
  horas_ordinarias bigint,
  horas_extras_25 bigint,
  remuneracion_basica double precision,
  asignacion_familiar double precision,
  monto_horas_extras double precision,
  bonificaciones double precision,
  gratificacion double precision,
  bonif_extraordinaria_9 double precision,
  vacaciones double precision,
  total_ingresos double precision,
  base_imponible_essalud double precision,
  essalud_9 double precision,
  sctr_salud double precision,
  sctr_pension double precision,
  essalud_vida bigint,
  base_imponible_pension double precision,
  onp_13 double precision,
  afp_aporte_10 double precision,
  afp_prima_seguro double precision,
  afp_comision double precision,
  total_aporte_pension double precision,
  renta_5ta_categoria double precision,
  otros_descuentos bigint,
  total_descuentos double precision,
  neto_a_pagar double precision,
  primary key (id_planilla)
);

drop table if exists public.plame_resumen cascade;
create table public.plame_resumen (
  periodo text not null,
  cod_empresa text,
  ruc_empleador text not null,
  razon_social_empleador text,
  nro_trabajadores bigint,
  total_ingresos double precision,
  total_base_essalud double precision,
  essalud_9 double precision,
  sctr_salud double precision,
  sctr_pension double precision,
  essalud_vida bigint,
  onp_13 double precision,
  afp_total_retenido double precision,
  renta_5ta_retenida double precision,
  renta_4ta_retenida_rxh double precision,
  total_tributos_a_pagar_plame double precision,
  total_neto_planilla double precision,
  costo_total_planilla_empresa double precision,
  primary key (periodo, ruc_empleador)
);

drop table if exists public.conceptos_plame cascade;
create table public.conceptos_plame (
  codigo_concepto text not null,
  descripcion text,
  tipo text,
  afecto_essalud text,
  afecto_pension text,
  afecto_renta_5ta text,
  primary key (codigo_concepto)
);

drop table if exists public.catalogo_productos cascade;
create table public.catalogo_productos (
  cod_empresa text not null,
  ruc text,
  razon_social text,
  codigo_sku text not null,
  descripcion text,
  unidad_medida text,
  tipo_bien_servicio text,
  precio_venta_unitario_sin_igv double precision,
  afectacion_igv text,
  sujeto_detraccion text,
  porc_detraccion double precision,
  moneda text,
  primary key (cod_empresa, codigo_sku)
);

drop table if exists public.catalogo_compras cascade;
create table public.catalogo_compras (
  id bigint generated always as identity primary key,
  cod_empresa text,
  ruc text,
  razon_social text,
  concepto_de_compra text,
  tipo_bien_servicio text,
  afectacion_igv text,
  sujeto_detraccion text,
  porc_detraccion double precision,
  cod_bien_servicio_spot text,
  gasto_recurrente_mensual text
);

drop table if exists public.resumen_fv621 cascade;
create table public.resumen_fv621 (
  periodo text not null,
  cod_empresa text not null,
  ruc text,
  razon_social text,
  regimen_tributario text,
  nro_comprobantes_venta bigint,
  ventas_gravadas_bi double precision,
  igv_ventas_debito_fiscal double precision,
  exportaciones_facturadas double precision,
  ventas_exoneradas double precision,
  ventas_inafectas bigint,
  icbper_cobrado double precision,
  total_ventas_periodo double precision,
  nro_comprobantes_compra bigint,
  compras_gravadas_bi double precision,
  igv_compras_credito_fiscal double precision,
  adquisiciones_no_gravadas double precision,
  total_compras_periodo double precision,
  detracciones_compras double precision,
  saldo_favor_periodo_anterior double precision,
  igv_resultante_del_mes double precision,
  igv_a_pagar double precision,
  saldo_a_favor_arrastrable double precision,
  ingresos_netos_mes double precision,
  tasa_pago_a_cuenta_ir double precision,
  pago_a_cuenta_ir double precision,
  total_tributos_a_pagar_621 double precision,
  primary key (periodo, cod_empresa)
);

drop table if exists public.resumen_fv710 cascade;
create table public.resumen_fv710 (
  ejercicio text not null,
  cod_empresa text not null,
  ruc text,
  razon_social text,
  regimen_tributario text,
  meses_declarados bigint,
  ventas_netas_gravadas double precision,
  exportaciones double precision,
  ventas_exoneradas_inafectas double precision,
  ingresos_netos_totales double precision,
  compras_y_gastos_netos double precision,
  costo_total_planilla double precision,
  utilidad_contable_estimada double precision,
  adiciones_estimadas double precision,
  renta_neta_imponible_estimada double precision,
  impuesto_a_la_renta_anual double precision,
  pagos_a_cuenta_del_ejercicio double precision,
  saldo_por_regularizar double precision,
  observacion text,
  primary key (ejercicio, cod_empresa)
);

drop table if exists public.parametros_tributarios cascade;
create table public.parametros_tributarios (
  parametro text not null,
  valor text,
  observacion text,
  primary key (parametro)
);

drop table if exists public.empresas_simulador cascade;
create table public.empresas_simulador (
  cod_empresa text not null,
  ruc text,
  razon_social text,
  nombre_comercial text,
  tipo_sociedad text,
  rubro text,
  que_vende text,
  mercado_clientes text,
  ciiu text,
  actividad_economica_sunat text,
  regimen_tributario text,
  regimen_laboral text,
  condicion text,
  estado_domicilio text,
  fecha_inicio_actividades text,
  direccion_fiscal text,
  distrito text,
  provincia text,
  departamento text,
  telefono text,
  email text,
  web text,
  representante_legal text,
  dni_representante text,
  tipo_contabilidad text,
  serie_factura text,
  serie_boleta text,
  serie_nota_credito text,
  emisor_electronico text,
  exportador text,
  nro_trabajadores bigint,
  banco_principal text,
  cuenta_detracciones_bn text,
  obligado_pdt_plame text,
  libros_electronicos text,
  primary key (cod_empresa)
);

-- Indices de consulta del simulador
create index on public.t_registro (ruc_empleador);
create index on public.plame_detalle (ruc_empleador, periodo);
create index on public.plame_detalle (id_trabajador);
create index on public.plame_resumen (ruc_empleador, periodo);
create index on public.resumen_fv621 (ruc, periodo);
create index on public.resumen_fv710 (ruc, ejercicio);
create index on public.ventas_detalle (id_venta);
create index on public.compras_detalle (id_compra);
create index on public.catalogo_productos (ruc);
create index on public.catalogo_compras (ruc);

-- ---------------------------------------------------------------------
-- 3) Credenciales de acceso (Clave SOL simulada)
--    El CSV 01_usuarios.csv trae las 10 empresas con usuario SIST / clave NORTON
--    y rol PRUEBA (el unico rol habilitado hoy en auth.js).
--    Si prefieres insertarlas por SQL en lugar de importar el CSV, usa:
-- ---------------------------------------------------------------------
-- insert into public.usuarios (ruc, usuario, clave, denominacion, rol, activo)
-- select ruc, 'SIST', 'NORTON', razon_social, 'PRUEBA', true
-- from public.empresas_simulador
-- on conflict do nothing;

-- ---------------------------------------------------------------------
-- 4) Vistas de apoyo: lo que el simulador necesita por RUC y periodo
-- ---------------------------------------------------------------------
create or replace view public.v_sire_ventas as
select v."Ruc"::text as ruc, v."Periodo"::text as periodo, v.*
from public.registro_ventas v;

create or replace view public.v_sire_compras as
select c."RUC"::text as ruc, c."Periodo"::text as periodo, c.*
from public.registro_compras c;

create or replace view public.v_plame_por_periodo as
select p.ruc_empleador as ruc, p.periodo, count(*) as trabajadores,
       sum(p.total_ingresos) as total_ingresos, sum(p.essalud_9) as essalud,
       sum(p.onp_13) as onp, sum(p.renta_5ta_categoria) as renta_5ta,
       sum(p.neto_a_pagar) as neto
from public.plame_detalle p group by 1, 2;

create or replace view public.v_tregistro_activos as
select ruc_empleador as ruc, id_trabajador, nombre_completo, ocupacion_cargo,
       remuneracion_basica, fecha_ingreso, fecha_cese, situacion, regimen_pensionario
from public.t_registro;


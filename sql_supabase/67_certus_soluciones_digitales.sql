-- =============================================================================
-- 67 · CERTUS SOLUCIONES DIGITALES S.A. (RUC 20235678895)
--      Caso de la UD Cierre Contable Tributario (AA1 a AA4)
-- =============================================================================
-- Datos del caso:
--   AA1  Venta al por mayor de ordenadores, equipo periférico y programas de
--        informática; varios locales en distintas regiones del Perú.
--   AA2  RUC 20235678895, actividades desde 2015, Régimen MYPE Tributario.
--   AA3  Operaciones del ejercicio 2024 que se registran en el Registro de
--        Compras (8.1) y el Registro de Ventas (14.1).  <- se cargan aquí
--   AA4  Pérdida tributaria y renta anual 2024 (se trabaja en el FV 710).
--
-- Adaptación para el simulador:
--   * Las operaciones de la AA3 se ubican en DICIEMBRE 2024 (periodo 202412).
--   * Estado SIRE: presentado hasta 2024-11; diciembre 2024 queda pendiente.
--   * Solo van al SIRE los comprobantes. El aumento de capital, la planilla,
--     el devengo del alquiler, la depreciación y el inventario final son
--     asientos contables (no comprobantes) y no se cargan.
--   * El alquiler pagado a José Padilla (persona natural, 1ra categoría) no
--     lleva IGV ni se anota en el RCE: no se carga.
--   * Nombres sin comas (el importador separa por coma).
--
-- Es re-ejecutable: borra primero lo que hubiera de esta empresa.
-- =============================================================================

begin;

-- 1) Empresa
delete from public.empresas_simulador where ruc = '20235678895';
insert into public.empresas_simulador (
  cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende,
  mercado_clientes, ciiu, actividad_economica_sunat, regimen_tributario, regimen_laboral,
  condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito,
  provincia, departamento, telefono, email, web, representante_legal, dni_representante,
  tipo_contabilidad, serie_factura, serie_boleta, serie_nota_credito, emisor_electronico,
  exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame,
  libros_electronicos, sire_presentado_hasta,
  contador_nombre, contador_dni, contador_cpc, contador_correo, contador_celular)
values (
  'E12', '20235678895', 'CERTUS SOLUCIONES DIGITALES S.A.', 'Certus Soluciones Digitales', 'Sociedad Anonima',
  'Comercio al por mayor de equipos de computo y software',
  'Ordenadores laptops servidores equipo periferico y programas de informatica.',
  'Empresas e instituciones en Lima y regiones (varios locales)', '46510',
  'Vta. May. de Computadoras Equipo Periferico y Programas de Informatica',
  'Regimen MYPE Tributario', 'Regimen Laboral General',
  'Activo', 'Habido', '2015-03-02', 'Av. Javier Prado Este Nro. 1850', 'San Isidro',
  'Lima', 'Lima', '01-6145200', 'ventas@certussoluciones.com.pe', null,
  'Mendoza Salas Ricardo Alonso', '41827365',
  'Completa', 'E001', 'EB01', 'EC01', 'SI - SEE SOL / Facturador SUNAT',
  'NO', 24, 'BCP', null, 'SI',
  'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2024-11',
  'Quispe Rojas Mario Alberto', '45782391', '15-23841', 'contabilidad@certussoluciones.com.pe', '987412365');

-- 2) Limpieza previa de sus registros
delete from public.registro_ventas  where "Ruc" = 20235678895;
delete from public.registro_compras where "RUC" = 20235678895;

-- 3) Registro de Ventas (14.1 / RVIE) - diciembre 2024
--    Venta de mercaderías por S/ 420,000 más IGV al cliente INRESA S.A.
insert into public.registro_ventas (
  id_venta, "Ruc", "Razon Social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago",
  "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Nro Final (Rango)",
  "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón Social",
  "Valor Facturado Exportación", "BI Gravada", "Dscto BI", "IGV / IPM", "Dscto IGV / IPM",
  "Mto Exonerado", "Mto Inafecto", "ISC", "BI Grav IVAP", "IVAP", "ICBPER", "Otros Tributos",
  "Total CP", "Moneda", "Tipo Cambio", "Est. Comp", "Valor FOB Embarcado", "Valor OP Gratuitas",
  "Tipo Operación")
values
  ('CSD-V0001', 20235678895, 'CERTUS SOLUCIONES DIGITALES S.A.', 202412, '2023567889501E0010000000350',
   '20/12/2024', '19/01/2025', '01', 'E001', 350, null, '6', 20604827391, 'INRESA S.A.',
   0, 420000.00, 0, 75600.00, 0, 0, 0, 0, 0, 0, 0, 0, 495600.00, 'PEN', 1, 1, 0, 0, '0101');

-- 4) Registro de Compras (8.1 / RCE) - diciembre 2024
insert into public.registro_compras (
  id_compra, "RUC", "Apellidos y Nombres o Razón social", "Periodo", "CAR SUNAT", "Fecha de emisión",
  "Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)",
  "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón  Social",
  "BI Gravado DG", "IGV / IPM DG", "BI Gravado DGNG", "IGV / IPM DGNG", "BI Gravado DNG", "IGV / IPM DNG",
  "Valor Adq. NG", "ISC", "ICBPER", "Otros Trib/ Cargos", "Total CP", "Moneda", "Tipo de Cambio",
  "IMB", "Est. Comp.", "Incal")
select 'CSD-C' || lpad(c.k::text, 4, '0'), 20235678895, 'CERTUS SOLUCIONES DIGITALES S.A.', 202412,
       c.ruc::text || c.tipo || c.serie || lpad(c.nro, 10, '0'), c.fe, c.fv, c.tipo, c.serie, c.nro,
       c.tdoc, c.ruc, c.nom, c.bi, c.igv, 0, 0, 0, 0, c.ng, 0, 0, 0, c.bi + c.igv + c.ng, 'PEN', 1, 0, 1, 0
from (values
  -- Mercaderías S/ 32,000 + IGV al crédito, factura N° 002-3227 de la filial INRESA S.A.
  (1, '03/12/2024', '02/01/2025', '01', 'F002', '3227', '6', 20604827391, 'INRESA S.A.',                         32000.00, 5760.00,    0.00),
  -- Honorarios del contador S/ 3,200 (recibo por honorarios: no lleva IGV; retención 8% = S/ 256)
  (2, '10/12/2024', null,         '02', 'E001', '45',   '6', 10457823916, 'VALDEZ HUAMAN CARLOS ENRIQUE',          0.00,    0.00, 3200.00),
  -- Computadora para el practicante contable: factura N° 002-700 de COMPUCENTRO S.A.
  (3, '11/12/2024', null,         '01', 'F002', '700',  '6', 20605193846, 'COMPUCENTRO S.A.',                     1800.00,  324.00,    0.00),
  -- Recibo de luz (Luz del Sur) S/ 300 con IGV
  (4, '16/12/2024', '30/12/2024', '14', 'S001', '884512', '6', 20331898008, 'LUZ DEL SUR S.A.A.',                 254.24,   45.76,    0.00),
  -- Recibo de agua (Sedapal) S/ 100 con IGV
  (5, '17/12/2024', '31/12/2024', '14', 'S002', '512087', '6', 20100152356, 'SERVICIO DE AGUA POTABLE Y ALCANTARILLADO DE LIMA - SEDAPAL', 84.75, 15.25, 0.00),
  -- Vehículo para reparto S/ 40,000 + IGV al crédito
  (6, '23/12/2024', '21/02/2025', '01', 'F001', '1580', '6', 20603971528, 'AUTOMOTRIZ ANDINA S.A.C.',            40000.00, 7200.00,    0.00)
) as c(k, fe, fv, tipo, serie, nro, tdoc, ruc, nom, bi, igv, ng);

commit;

-- 5) Verificación
-- select * from empresas_simulador where ruc = '20235678895';
-- select "Periodo", count(*), sum("BI Gravada") bi, sum("IGV / IPM") igv from registro_ventas  where "Ruc" = 20235678895 group by 1;
-- select "Periodo", count(*), sum("BI Gravado DG") bi, sum("IGV / IPM DG") igv, sum("Valor Adq. NG") ng
--   from registro_compras where "RUC" = 20235678895 group by 1;

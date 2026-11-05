-- =============================================================================
-- 70 · Empresas del EFSRT Módulo 1 (Semestre 2026-II) · Semana 3: comprobantes
-- =============================================================================
-- Empresas E21 a E25 tomadas del caso de Moodle "Semana 3 — Llenado de
-- comprobantes de pago" (Moodle_Comprobantes_Semana3.html). Una por equipo:
--   E21 Código Queso           COMERCIAL DON JUAN E.I.R.L.   enero 2026
--   E22 Contadores de frijoles COMERCIAL MUNDO PELUCHE E.I.R.L. enero 2026
--   E23 Grupo MAI              L-MOBILE E.I.R.L.             enero 2026 (RMT)
--   E24 Trío Dinámico          COMERCIAL PASO FIRME E.I.R.L. octubre 2026
--   E25 Dream Makers           DREAM MAKERS PERU E.I.R.L.    octubre 2026
--
-- Los RUC son EXACTAMENTE los del caso (los alumnos los copian en sus
-- comprobantes), aunque varios no cumplen el dígito verificador. La Clave SOL
-- no valida el dígito, igual que con el RUC demo 20123456789.
--
-- OJO: Grupo MAI escribió en su Evidencia 1 el RUC 20611045418; el caso dice
-- 20611045411. Se carga el del caso.
--
-- sire_presentado_hasta = mes anterior al periodo del caso, para que el SIRE
-- abra justo en el mes que trabaja cada equipo.
-- Contador: la CPC Ana María Quispe Flores (RUC 10457821634, presta la
-- asesoría contable en los cinco casos). DNI sacado de su RUC.
-- Nombres sin comas (el importador separa por coma). Es re-ejecutable.
-- =============================================================================

begin;

delete from public.empresas_simulador
 where ruc in ('20454876231', '20455103284', '20611045411', '20455720163', '20456318742');

insert into public.empresas_simulador (
  cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende,
  mercado_clientes, ciiu, actividad_economica_sunat, regimen_tributario, regimen_laboral,
  condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito,
  provincia, departamento, telefono, email, web, representante_legal, dni_representante,
  tipo_contabilidad, serie_factura, serie_boleta, serie_nota_credito, emisor_electronico,
  exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame,
  libros_electronicos, sire_presentado_hasta,
  contador_nombre, contador_dni, contador_cpc, contador_correo, contador_celular)
values
  ('E21', '20454876231', 'COMERCIAL DON JUAN E.I.R.L.', 'Don Juan', 'Empresa Individual de Responsabilidad Limitada',
   'Comercio mayorista y minorista de prendas de vestir de oficina para dama',
   'Blusas de vestir manga larga vestidos de oficina y casacas de dama',
   'Boutiques y tiendas mayoristas de Arequipa y Lima y consumidores finales',
   '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado',
   'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2021-03-01',
   'Av. Ejercito Nro. 1245', 'Yanahuara', 'Arequipa', 'Arequipa', null, 'ventas@comercialdonjuan.com.pe', null,
   'Rivera Zapata Juan Esteban', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT',
   'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12',
   'Quispe Flores Ana Maria', '45782163', null, null, null),

  ('E22', '20455103284', 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 'Mundo Peluche', 'Empresa Individual de Responsabilidad Limitada',
   'Comercio mayorista y minorista de peluches y juguetes de regalo',
   'Peluches jumbo de 90 cm medianos de 50 cm y pequenos de 25 cm',
   'Tiendas de regalos y distribuidoras de Arequipa y Lima y consumidores finales',
   '4649', 'Venta al por mayor de otros enseres domesticos',
   'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2021-05-03',
   'Av. Ejercito Nro. 1245', 'Yanahuara', 'Arequipa', 'Arequipa', null, 'ventas@mundopeluche.com.pe', null,
   'Rivera Zapata Juan Esteban', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT',
   'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12',
   'Quispe Flores Ana Maria', '45782163', null, null, null),

  ('E23', '20611045411', 'L-MOBILE E.I.R.L.', 'L-Mobile', 'Empresa Individual de Responsabilidad Limitada',
   'Comercio de telefonos celulares y accesorios',
   'Celulares de gama media y basica y audifonos inalambricos',
   'Tiendas de tecnologia de Arequipa y Lima y consumidores finales',
   '4741', 'Venta al por menor de computadoras equipo periferico programas de informatica y equipo de telecomunicaciones en comercios especializados',
   'Regimen MYPE Tributario', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2023-08-14',
   'Av. Jorge Chavez Nro. 247', 'Cercado', 'Arequipa', 'Arequipa', null, 'ventas@lmobile.com.pe', null,
   'Herrera Cardenas Linet Sadit', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT',
   'NO', 3, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12',
   'Quispe Flores Ana Maria', '45782163', null, null, null),

  ('E24', '20455720163', 'COMERCIAL PASO FIRME E.I.R.L.', 'Paso Firme', 'Empresa Individual de Responsabilidad Limitada',
   'Comercio mayorista y minorista de calzado deportivo y de vestir',
   'Zapatillas deportivas de dama y caballero y zapatos de vestir de caballero',
   'Zapaterias y tiendas deportivas de Arequipa y Lima y consumidores finales',
   '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado',
   'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2021-07-01',
   'Av. Ejercito Nro. 1245', 'Yanahuara', 'Arequipa', 'Arequipa', null, 'ventas@pasofirme.com.pe', null,
   'Rivera Zapata Juan Esteban', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT',
   'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2026-09',
   'Quispe Flores Ana Maria', '45782163', null, null, null),

  ('E25', '20456318742', 'DREAM MAKERS PERU E.I.R.L.', 'Dream Makers', 'Empresa Individual de Responsabilidad Limitada',
   'Comercio de equipos de streaming para creadores de contenido',
   'Microfonos de condensador USB camaras web 4K y aros de luz LED',
   'Productoras audiovisuales y tiendas de streaming de Arequipa y Lima y creadores de contenido',
   '4652', 'Venta al por mayor de equipo partes y piezas electronicos y de telecomunicaciones',
   'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2022-02-07',
   'Av. Independencia Nro. 1180', 'Cercado', 'Arequipa', 'Arequipa', null, 'ventas@dreammakers.com.pe', null,
   'Cuadros Vilca Renzo Alberto', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT',
   'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2026-09',
   'Quispe Flores Ana Maria', '45782163', null, null, null);

commit;

-- Verificación
-- select cod_empresa, ruc, razon_social, regimen_tributario, sire_presentado_hasta
--   from empresas_simulador where cod_empresa between 'E21' and 'E25' order by 1;

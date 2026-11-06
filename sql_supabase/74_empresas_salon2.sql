-- =============================================================================
-- 74 · Empresas del segundo salón (EFSRT Módulo 1, semana 3) y sus registros
-- =============================================================================
-- GENERADO por generar_74_salon2.py con los datos del enunciado de Moodle.
-- Los recibos por honorarios los emiten P01 y P02 (73_prestadores_cuarta.sql).
-- Es re-ejecutable.
-- =============================================================================
begin;
delete from public.ventas_cuotas where id_venta like any (array['E26-V%', 'E27-V%', 'E28-V%']);
delete from public.ventas_detalle where id_venta like any (array['E26-V%', 'E27-V%', 'E28-V%']);
delete from public.ventas_adicional where id_venta like any (array['E26-V%', 'E27-V%', 'E28-V%']);
delete from public.registro_ventas where id_venta like any (array['E26-V%', 'E27-V%', 'E28-V%']);
delete from public.compras_detalle where id_compra like any (array['E26-C%', 'E27-C%', 'E28-C%']);
delete from public.compras_adicional where id_compra like any (array['E26-C%', 'E27-C%', 'E28-C%']);
delete from public.registro_compras where id_compra like any (array['E26-C%', 'E27-C%', 'E28-C%']);
delete from public.empresas_simulador where ruc in ('20457182601', '20459264133', '20461375821');
insert into public.empresas_simulador (cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende, mercado_clientes, ciiu, actividad_economica_sunat, regimen_tributario, regimen_laboral, condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito, provincia, departamento, telefono, email, web, representante_legal, dni_representante, tipo_contabilidad, serie_factura, serie_boleta, serie_nota_credito, emisor_electronico, exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame, libros_electronicos, sire_presentado_hasta, contador_nombre, contador_dni, contador_cpc, contador_correo, contador_celular) values
('E26', '20457182601', 'COMERCIAL CGM S.A.C.', 'CGM', 'Sociedad Anonima Cerrada', 'Comercio mayorista y minorista de zapatillas urbanas y deportivas', 'Zapatilla urbana de cuero Zapatilla de running Zapatilla de basquet de cana baja', 'Tiendas mayoristas de Arequipa y Lima y consumidores finales', '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado', 'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2022-03-01', 'Av. Ejercito Nro. 1245', 'Yanahuara', 'Arequipa', 'Arequipa', null, null, null, 'Pachao Auquilla Carol Rosio', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT', 'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Quispe Flores Ana Maria', '45782163', null, null, null),
('E27', '20459264133', 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 'Esencias', 'Empresa Individual de Responsabilidad Limitada', 'Comercio mayorista y minorista de perfumes y sets de regalo', 'Perfume para dama de 100 ml Perfume para caballero de 100 ml Set de regalo navideno (perfume y crema)', 'Tiendas mayoristas de Arequipa y Lima y consumidores finales', '4649', 'Venta al por mayor de otros enseres domesticos', 'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2021-09-06', 'Calle San Agustin Nro. 123', 'Cercado', 'Arequipa', 'Arequipa', null, null, null, 'Torres Carpio Valeria Ginella', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT', 'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Quispe Flores Ana Maria', '45782163', null, null, null),
('E28', '20461375821', 'SPORT ACTIVE PERU S.A.C.', 'Sport Active Perú', 'Sociedad Anonima Cerrada', 'Comercio mayorista y minorista de ropa deportiva para dama y varon', 'Short deportivo unisex Casaca cortavientos Leggings de tiro alto para dama', 'Tiendas mayoristas de Arequipa y Lima y consumidores finales', '4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado', 'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', '2023-02-13', 'Av. Ejercito Nro. 1245', 'Yanahuara', 'Arequipa', 'Arequipa', null, null, null, 'Chacondori Chuquicana Mayly Afrika', null, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT', 'NO', 4, 'BCP', null, 'NO', 'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Quispe Flores Ana Maria', '45782163', null, null, null);
insert into public.registro_ventas (id_venta, "Ruc", "Razon Social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Nro Final (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón Social", "Valor Facturado Exportación", "BI Gravada", "Dscto BI", "IGV / IPM", "Dscto IGV / IPM", "Mto Exonerado", "Mto Inafecto", "ISC", "BI Grav IVAP", "IVAP", "ICBPER", "Otros Tributos", "Total CP", "Moneda", "Tipo Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "Est. Comp", "Valor FOB Embarcado", "Valor OP Gratuitas", "Tipo Operación") values
('E26-V1', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045718260101F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'URBAN SHOES STORE S.A.C.', 0, 17000.00, 0, 3060.00, 0, 0, 0, 0, 0, 0, 0, 0, 20060.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E26-V2', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045718260103B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 42318765, 'PEREZ LUNA JUAN CARLOS', 0, 1320.00, 0, 237.60, 0, 0, 0, 0, 0, 0, 0, 0, 1557.60, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E26-V3', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045718260101F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'KELLY''S SHOES S.R.L.', 0, 13750.00, 0, 2475.00, 0, 0, 0, 0, 0, 0, 0, 0, 16225.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E26-V4', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045718260107F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'URBAN SHOES STORE S.A.C.', 0, -850.00, 0, -153.00, 0, 0, 0, 0, 0, 0, 0, 0, -1003.00, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E26-V5', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045718260108F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'KELLY''S SHOES S.R.L.', 0, 300.00, 0, 54.00, 0, 0, 0, 0, 0, 0, 0, 0, 354.00, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E27-V1', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045926413301F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'BOUTIQUE PERFUMES ELEGANCE S.A.C.', 0, 11100.00, 0, 1998.00, 0, 0, 0, 0, 0, 0, 0, 0, 13098.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E27-V2', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045926413303B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 45872103, 'ROJAS CHAVEZ MARIA FERNANDA', 0, 750.00, 0, 135.00, 0, 0, 0, 0, 0, 0, 0, 0, 885.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E27-V3', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045926413301F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'TIENDAS REGALO PERFECTO S.A.C.', 0, 7500.00, 0, 1350.00, 0, 0, 0, 0, 0, 0, 0, 0, 8850.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E27-V4', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045926413307F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'BOUTIQUE PERFUMES ELEGANCE S.A.C.', 0, -555.00, 0, -99.90, 0, 0, 0, 0, 0, 0, 0, 0, -654.90, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E27-V5', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045926413308F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'TIENDAS REGALO PERFECTO S.A.C.', 0, 250.00, 0, 45.00, 0, 0, 0, 0, 0, 0, 0, 0, 295.00, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E28-V1', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2046137582101F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'TIENDAS CORRE LIBRE S.A.C.', 0, 6900.00, 0, 1242.00, 0, 0, 0, 0, 0, 0, 0, 0, 8142.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E28-V2', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2046137582103B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 46213578, 'ALVARADO RAMIREZ CINTHIA', 0, 793.00, 0, 142.74, 0, 0, 0, 0, 0, 0, 0, 0, 935.74, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E28-V3', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2046137582101F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'WIN ROPA DEPORTIVA S.A.C.', 0, 6850.00, 0, 1233.00, 0, 0, 0, 0, 0, 0, 0, 0, 8083.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E28-V4', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2046137582107F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'TIENDAS CORRE LIBRE S.A.C.', 0, -345.00, 0, -62.10, 0, 0, 0, 0, 0, 0, 0, 0, -407.10, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E28-V5', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2046137582108F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'WIN ROPA DEPORTIVA S.A.C.', 0, 200.00, 0, 36.00, 0, 0, 0, 0, 0, 0, 0, 0, 236.00, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101');
insert into public.ventas_adicional (id_venta, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_cliente, detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_a_detraccion, pct_detraccion, monto_detraccion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values
('E26-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E26-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E26-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E26-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E26-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E27-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E27-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E27-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E27-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E27-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E28-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E28-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E28-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E28-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E28-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0);
insert into public.ventas_detalle (id_venta, item_nro, codigo_sku, descripcion, unidad_medida, cantidad, valor_unitario, valor_de_venta_total, moneda) values
('E26-V1', 1, 'ZAP-001', 'ZAPATILLA URBANA DE CUERO', 'NIU', 25, 680.00, 17000.00, 'PEN'),
('E26-V2', 1, 'ZAP-003', 'ZAPATILLA DE BASQUET DE CANA BAJA', 'NIU', 2, 425.00, 850.00, 'PEN'),
('E26-V2', 2, 'ZAP-002', 'ZAPATILLA DE RUNNING', 'NIU', 1, 470.00, 470.00, 'PEN'),
('E26-V3', 1, 'ZAP-002', 'ZAPATILLA DE RUNNING', 'NIU', 30, 400.00, 12000.00, 'PEN'),
('E26-V3', 2, 'ZAP-003', 'ZAPATILLA DE BASQUET DE CANA BAJA', 'NIU', 5, 350.00, 1750.00, 'PEN'),
('E26-V4', 1, 'DSCTO', 'DESCUENTO POR PRONTO PAGO DEL 5% SOBRE LA FACTURA F001-00321', 'ZZ', 1, 850.00, 850.00, 'PEN'),
('E26-V5', 1, 'INTER', 'INTERESES POR EL FINANCIAMIENTO A 60 DIAS DE LA FACTURA F001-00322', 'ZZ', 1, 300.00, 300.00, 'PEN'),
('E27-V1', 1, 'PER-001', 'PERFUME PARA DAMA DE 100 ML', 'NIU', 50, 170.00, 8500.00, 'PEN'),
('E27-V1', 2, 'PER-003', 'SET DE REGALO NAVIDENO (PERFUME Y CREMA)', 'NIU', 20, 130.00, 2600.00, 'PEN'),
('E27-V2', 1, 'PER-001', 'PERFUME PARA DAMA DE 100 ML', 'NIU', 2, 210.00, 420.00, 'PEN'),
('E27-V2', 2, 'PER-003', 'SET DE REGALO NAVIDENO (PERFUME Y CREMA)', 'NIU', 2, 165.00, 330.00, 'PEN'),
('E27-V3', 1, 'PER-002', 'PERFUME PARA CABALLERO DE 100 ML', 'NIU', 40, 155.00, 6200.00, 'PEN'),
('E27-V3', 2, 'PER-003', 'SET DE REGALO NAVIDENO (PERFUME Y CREMA)', 'NIU', 10, 130.00, 1300.00, 'PEN'),
('E27-V4', 1, 'DSCTO', 'DESCUENTO POR PRONTO PAGO DEL 5% SOBRE LA FACTURA F001-00321', 'ZZ', 1, 555.00, 555.00, 'PEN'),
('E27-V5', 1, 'INTER', 'INTERESES POR EL FINANCIAMIENTO A 60 DIAS DE LA FACTURA F001-00322', 'ZZ', 1, 250.00, 250.00, 'PEN'),
('E28-V1', 1, 'ROP-001', 'SHORT DEPORTIVO UNISEX', 'NIU', 80, 55.00, 4400.00, 'PEN'),
('E28-V1', 2, 'ROP-002', 'CASACA CORTAVIENTOS', 'NIU', 20, 125.00, 2500.00, 'PEN'),
('E28-V2', 1, 'ROP-002', 'CASACA CORTAVIENTOS', 'NIU', 3, 159.00, 477.00, 'PEN'),
('E28-V2', 2, 'ROP-003', 'LEGGINGS DE TIRO ALTO PARA DAMA', 'NIU', 4, 79.00, 316.00, 'PEN'),
('E28-V3', 1, 'ROP-002', 'CASACA CORTAVIENTOS', 'NIU', 30, 125.00, 3750.00, 'PEN'),
('E28-V3', 2, 'ROP-003', 'LEGGINGS DE TIRO ALTO PARA DAMA', 'NIU', 50, 62.00, 3100.00, 'PEN'),
('E28-V4', 1, 'DSCTO', 'DESCUENTO POR PRONTO PAGO DEL 5% SOBRE LA FACTURA F001-00321', 'ZZ', 1, 345.00, 345.00, 'PEN'),
('E28-V5', 1, 'INTER', 'INTERESES POR EL FINANCIAMIENTO A 60 DIAS DE LA FACTURA F001-00322', 'ZZ', 1, 200.00, 200.00, 'PEN');
insert into public.ventas_cuotas (id_venta, nro_cuota, total_cuotas, fecha_de_vencimiento, monto_de_la_cuota, moneda) values
('E26-V1', 1, 1, '07/02/2026', 20060.00, 'PEN'),
('E26-V3', 1, 1, '19/03/2026', 16225.00, 'PEN'),
('E27-V1', 1, 1, '07/02/2026', 13098.00, 'PEN'),
('E27-V3', 1, 1, '19/03/2026', 8850.00, 'PEN'),
('E28-V1', 1, 1, '07/02/2026', 8142.00, 'PEN'),
('E28-V3', 1, 1, '19/03/2026', 8083.00, 'PEN');
insert into public.registro_compras (id_compra, "RUC", "Apellidos y Nombres o Razón social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón  Social", "BI Gravado DG", "IGV / IPM DG", "BI Gravado DGNG", "IGV / IPM DGNG", "BI Gravado DNG", "IGV / IPM DNG", "Valor Adq. NG", "ISC", "ICBPER", "Otros Trib/ Cargos", "Total CP", "Moneda", "Tipo de Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "IMB", "Est. Comp.", "Incal") values
('E26-C1', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045178963201E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451789632, 'CALZADOS IMPORTADOS DEL PACIFICO S.A.C.', 15000.00, 2700.00, 0, 0, 0, 0, 0, 0, 0, 0, 17700.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E26-C2', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2050874126301E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20508741263, 'DISTRIBUIDORA PISADAS DEL SUR S.A.C.', 14750.00, 2655.00, 0, 0, 0, 0, 0, 0, 0, 0, 17405.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E26-C3', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 480.00, 86.40, 0, 0, 0, 0, 0, 0, 0, 0, 566.40, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E26-C4', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 650.00, 117.00, 0, 0, 0, 0, 0, 0, 0, 0, 767.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E26-C5', 20457182601, 'COMERCIAL CGM S.A.C.', 202601, '2045178963207E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451789632, 'CALZADOS IMPORTADOS DEL PACIFICO S.A.C.', -1000.00, -180.00, 0, 0, 0, 0, 0, 0, 0, 0, -1180.00, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E27-C1', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045178963201E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451789632, 'FRAGANCIAS IMPORTADAS DEL PERU S.A.C.', 9600.00, 1728.00, 0, 0, 0, 0, 0, 0, 0, 0, 11328.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E27-C2', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2050874126301E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20508741263, 'AROMAS Y ESENCIAS LIMA S.A.C.', 10200.00, 1836.00, 0, 0, 0, 0, 0, 0, 0, 0, 12036.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E27-C3', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 420.00, 75.60, 0, 0, 0, 0, 0, 0, 0, 0, 495.60, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E27-C4', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 550.00, 99.00, 0, 0, 0, 0, 0, 0, 0, 0, 649.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E27-C5', 20459264133, 'COMERCIAL ESENCIAS AREQUIPA E.I.R.L.', 202601, '2045178963207E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451789632, 'FRAGANCIAS IMPORTADAS DEL PERU S.A.C.', -480.00, -86.40, 0, 0, 0, 0, 0, 0, 0, 0, -566.40, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E28-C1', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2045178963201E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451789632, 'TEXTILES DEPORTIVOS ANDINOS S.A.C.', 4200.00, 756.00, 0, 0, 0, 0, 0, 0, 0, 0, 4956.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E28-C2', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2050874126301E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20508741263, 'CONFECCIONES GAMARRA SPORT S.A.C.', 8300.00, 1494.00, 0, 0, 0, 0, 0, 0, 0, 0, 9794.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E28-C3', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 450.00, 81.00, 0, 0, 0, 0, 0, 0, 0, 0, 531.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E28-C4', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E28-C5', 20461375821, 'SPORT ACTIVE PERU S.A.C.', 202601, '2045178963207E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451789632, 'TEXTILES DEPORTIVOS ANDINOS S.A.C.', -350.00, -63.00, 0, 0, 0, 0, 0, 0, 0, 0, -413.00, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0);
insert into public.compras_adicional (id_compra, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_proveedor, detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_detraccion_retencion, tipo_detraccion_retencion, pct_detraccion_retencion, monto_detraccion_retencion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values
('E26-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E26-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E26-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E26-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E26-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E27-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E27-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E27-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E27-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E27-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E28-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E28-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E28-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E28-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E28-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0);
insert into public.compras_detalle (id_compra, item_nro, descripcion, cantidad, valor_unitario, valor_total, moneda) values
('E26-C1', 1, 'Zapatilla urbana de cuero', 30, 500.00, 15000.00, 'PEN'),
('E26-C2', 1, 'Zapatilla de running', 40, 300.00, 12000.00, 'PEN'),
('E26-C2', 2, 'Zapatilla de basquet de cana baja', 10, 275.00, 2750.00, 'PEN'),
('E26-C3', 1, 'Energia electrica del local del mes', 1, 480.00, 480.00, 'PEN'),
('E26-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 650.00, 650.00, 'PEN'),
('E26-C5', 1, 'Zapatilla urbana de cuero (devolucion con la suela despegada)', 2, 500.00, 1000.00, 'PEN'),
('E27-C1', 1, 'Perfume para dama de 100 ml', 80, 120.00, 9600.00, 'PEN'),
('E27-C2', 1, 'Perfume para caballero de 100 ml', 60, 110.00, 6600.00, 'PEN'),
('E27-C2', 2, 'Set de regalo navideno (perfume y crema)', 40, 90.00, 3600.00, 'PEN'),
('E27-C3', 1, 'Energia electrica del local del mes', 1, 420.00, 420.00, 'PEN'),
('E27-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 550.00, 550.00, 'PEN'),
('E27-C5', 1, 'Perfume para dama de 100 ml (devolucion con el frasco roto)', 4, 120.00, 480.00, 'PEN'),
('E28-C1', 1, 'Short deportivo unisex', 120, 35.00, 4200.00, 'PEN'),
('E28-C2', 1, 'Casaca cortavientos', 60, 85.00, 5100.00, 'PEN'),
('E28-C2', 2, 'Leggings de tiro alto para dama', 80, 40.00, 3200.00, 'PEN'),
('E28-C3', 1, 'Energia electrica del local del mes', 1, 450.00, 450.00, 'PEN'),
('E28-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E28-C5', 1, 'Short deportivo unisex (devolucion con la costura abierta)', 10, 35.00, 350.00, 'PEN');
commit;

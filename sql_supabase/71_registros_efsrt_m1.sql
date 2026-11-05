-- =============================================================================
-- 71 · Registros SIRE de las empresas E21-E25 (EFSRT Módulo 1, Semana 3)
-- =============================================================================
-- GENERADO por generar_71_registros_efsrt_m1.py: no editar a mano.
-- Carga en la propuesta del SIRE los 10 comprobantes de pago de cada caso:
--   RCE: C1 y C2 (mercadería), C3 (energía), C4 (flete), C5 (NC recibida).
--   RVIE: V1 y V3 (facturas), V2 (boleta), V4 (NC emitida), V5 (ND emitida).
-- Los recibos por honorarios y la guía de remisión no van a estos registros.
-- Importes que el caso no trae: la ND se deduce exacta de la suma de ventas;
-- energía + flete se deduce de la suma de compras, con el flete fijado en
-- S/ 600 y la energía con el resto. Es re-ejecutable.
-- =============================================================================

begin;

-- Limpieza previa
delete from public.ventas_cuotas where id_venta in ('E21-V1', 'E21-V2', 'E21-V3', 'E21-V4', 'E21-V5', 'E22-V1', 'E22-V2', 'E22-V3', 'E22-V4', 'E22-V5', 'E23-V1', 'E23-V2', 'E23-V3', 'E23-V4', 'E23-V5', 'E24-V1', 'E24-V2', 'E24-V3', 'E24-V4', 'E24-V5', 'E25-V1', 'E25-V2', 'E25-V3', 'E25-V4', 'E25-V5');
delete from public.ventas_detalle where id_venta in ('E21-V1', 'E21-V2', 'E21-V3', 'E21-V4', 'E21-V5', 'E22-V1', 'E22-V2', 'E22-V3', 'E22-V4', 'E22-V5', 'E23-V1', 'E23-V2', 'E23-V3', 'E23-V4', 'E23-V5', 'E24-V1', 'E24-V2', 'E24-V3', 'E24-V4', 'E24-V5', 'E25-V1', 'E25-V2', 'E25-V3', 'E25-V4', 'E25-V5');
delete from public.ventas_adicional where id_venta in ('E21-V1', 'E21-V2', 'E21-V3', 'E21-V4', 'E21-V5', 'E22-V1', 'E22-V2', 'E22-V3', 'E22-V4', 'E22-V5', 'E23-V1', 'E23-V2', 'E23-V3', 'E23-V4', 'E23-V5', 'E24-V1', 'E24-V2', 'E24-V3', 'E24-V4', 'E24-V5', 'E25-V1', 'E25-V2', 'E25-V3', 'E25-V4', 'E25-V5');
delete from public.registro_ventas where id_venta in ('E21-V1', 'E21-V2', 'E21-V3', 'E21-V4', 'E21-V5', 'E22-V1', 'E22-V2', 'E22-V3', 'E22-V4', 'E22-V5', 'E23-V1', 'E23-V2', 'E23-V3', 'E23-V4', 'E23-V5', 'E24-V1', 'E24-V2', 'E24-V3', 'E24-V4', 'E24-V5', 'E25-V1', 'E25-V2', 'E25-V3', 'E25-V4', 'E25-V5');
delete from public.compras_detalle where id_compra in ('E21-C1', 'E21-C2', 'E21-C3', 'E21-C4', 'E21-C5', 'E22-C1', 'E22-C2', 'E22-C3', 'E22-C4', 'E22-C5', 'E23-C1', 'E23-C2', 'E23-C3', 'E23-C4', 'E23-C5', 'E24-C1', 'E24-C2', 'E24-C3', 'E24-C4', 'E24-C5', 'E25-C1', 'E25-C2', 'E25-C3', 'E25-C4', 'E25-C5');
delete from public.compras_adicional where id_compra in ('E21-C1', 'E21-C2', 'E21-C3', 'E21-C4', 'E21-C5', 'E22-C1', 'E22-C2', 'E22-C3', 'E22-C4', 'E22-C5', 'E23-C1', 'E23-C2', 'E23-C3', 'E23-C4', 'E23-C5', 'E24-C1', 'E24-C2', 'E24-C3', 'E24-C4', 'E24-C5', 'E25-C1', 'E25-C2', 'E25-C3', 'E25-C4', 'E25-C5');
delete from public.registro_compras where id_compra in ('E21-C1', 'E21-C2', 'E21-C3', 'E21-C4', 'E21-C5', 'E22-C1', 'E22-C2', 'E22-C3', 'E22-C4', 'E22-C5', 'E23-C1', 'E23-C2', 'E23-C3', 'E23-C4', 'E23-C5', 'E24-C1', 'E24-C2', 'E24-C3', 'E24-C4', 'E24-C5', 'E25-C1', 'E25-C2', 'E25-C3', 'E25-C4', 'E25-C5');

-- Registro de Ventas (RVIE)
insert into public.registro_ventas (id_venta, "Ruc", "Razon Social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Nro Final (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón Social", "Valor Facturado Exportación", "BI Gravada", "Dscto BI", "IGV / IPM", "Dscto IGV / IPM", "Mto Exonerado", "Mto Inafecto", "ISC", "BI Grav IVAP", "IVAP", "ICBPER", "Otros Tributos", "Total CP", "Moneda", "Tipo Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "Est. Comp", "Valor FOB Embarcado", "Valor OP Gratuitas", "Tipo Operación") values
('E21-V1', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045487623101F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'BOUTIQUE ELEGANCIA S.A.C.', 0, 4700.00, 0, 846.00, 0, 0, 0, 0, 0, 0, 0, 0, 5546.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E21-V2', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045487623103B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 45872103, 'ROJAS CHAVEZ MARIA FERNANDA', 0, 350.00, 0, 63.00, 0, 0, 0, 0, 0, 0, 0, 0, 413.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E21-V3', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045487623101F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'TIENDAS MODA FEMENINA S.A.C.', 0, 7750.00, 0, 1395.00, 0, 0, 0, 0, 0, 0, 0, 0, 9145.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E21-V4', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045487623107F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'BOUTIQUE ELEGANCIA S.A.C.', 0, -235.00, 0, -42.30, 0, 0, 0, 0, 0, 0, 0, 0, -277.30, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E21-V5', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045487623108F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'TIENDAS MODA FEMENINA S.A.C.', 0, 250.00, 0, 45.00, 0, 0, 0, 0, 0, 0, 0, 0, 295.00, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E22-V1', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045510328401F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'CORPORACION DETALLES S.A.C.', 0, 5070.00, 0, 912.60, 0, 0, 0, 0, 0, 0, 0, 0, 5982.60, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E22-V2', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045510328403B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 42318765, 'PEREZ LUNA JUAN CARLOS', 0, 690.00, 0, 124.20, 0, 0, 0, 0, 0, 0, 0, 0, 814.20, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E22-V3', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045510328401F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'DISTRIBUIDORA PELUCHERIA LIMA S.A.C.', 0, 7760.00, 0, 1396.80, 0, 0, 0, 0, 0, 0, 0, 0, 9156.80, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E22-V4', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045510328407F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'CORPORACION DETALLES S.A.C.', 0, -253.50, 0, -45.63, 0, 0, 0, 0, 0, 0, 0, 0, -299.13, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E22-V5', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045510328408F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'DISTRIBUIDORA PELUCHERIA LIMA S.A.C.', 0, 230.00, 0, 41.40, 0, 0, 0, 0, 0, 0, 0, 0, 271.40, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E23-V1', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2061104541101F0010000000321', '08/01/2026', '07/02/2026', '01', 'F001', 321, null, '6', 20604587123, 'CORPORACION ANDINA S.A.C.', 0, 10500.00, 0, 1890.00, 0, 0, 0, 0, 0, 0, 0, 0, 12390.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E23-V2', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2061104541103B0010000000450', '12/01/2026', null, '03', 'B001', 450, null, '1', 42318765, 'PEREZ LUNA JUAN CARLOS', 0, 1240.00, 0, 223.20, 0, 0, 0, 0, 0, 0, 0, 0, 1463.20, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E23-V3', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2061104541101F0010000000322', '18/01/2026', '19/03/2026', '01', 'F001', 322, null, '6', 20601234561, 'TIENDAS CONECTADAS DEL SUR S.A.C.', 0, 11600.00, 0, 2088.00, 0, 0, 0, 0, 0, 0, 0, 0, 13688.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E23-V4', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2061104541107F0010000000015', '22/01/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'CORPORACION ANDINA S.A.C.', 0, -525.00, 0, -94.50, 0, 0, 0, 0, 0, 0, 0, 0, -619.50, 'PEN', 1, '08/01/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E23-V5', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2061104541108F0010000000008', '26/01/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'TIENDAS CONECTADAS DEL SUR S.A.C.', 0, 300.00, 0, 54.00, 0, 0, 0, 0, 0, 0, 0, 0, 354.00, 'PEN', 1, '18/01/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E24-V1', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045572016301F0010000000321', '08/10/2026', '07/11/2026', '01', 'F001', 321, null, '6', 20604587123, 'ZAPATOS ELEGANTES S.A.C.', 0, 9000.00, 0, 1620.00, 0, 0, 0, 0, 0, 0, 0, 0, 10620.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E24-V2', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045572016303B0010000000450', '12/10/2026', null, '03', 'B001', 450, null, '1', 42318765, 'PEREZ LUNA JUAN CARLOS', 0, 716.00, 0, 128.88, 0, 0, 0, 0, 0, 0, 0, 0, 844.88, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E24-V3', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045572016301F0010000000322', '18/10/2026', '17/12/2026', '01', 'F001', 322, null, '6', 20601234561, 'CORPORACION DEPORTIVA DEL NORTE S.A.C.', 0, 9675.00, 0, 1741.50, 0, 0, 0, 0, 0, 0, 0, 0, 11416.50, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E24-V4', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045572016307F0010000000015', '22/10/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'ZAPATOS ELEGANTES S.A.C.', 0, -450.00, 0, -81.00, 0, 0, 0, 0, 0, 0, 0, 0, -531.00, 'PEN', 1, '08/10/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E24-V5', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045572016308F0010000000008', '26/10/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'CORPORACION DEPORTIVA DEL NORTE S.A.C.', 0, 280.00, 0, 50.40, 0, 0, 0, 0, 0, 0, 0, 0, 330.40, 'PEN', 1, '18/10/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101'),
('E25-V1', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045631874201F0010000000321', '08/10/2026', '07/11/2026', '01', 'F001', 321, null, '6', 20604587123, 'PRODUCTORA ANDINA MEDIA S.A.C.', 0, 8300.00, 0, 1494.00, 0, 0, 0, 0, 0, 0, 0, 0, 9794.00, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E25-V2', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045631874203B0010000000450', '12/10/2026', null, '03', 'B001', 450, null, '1', 42318765, 'PEREZ LUNA JUAN CARLOS', 0, 710.00, 0, 127.80, 0, 0, 0, 0, 0, 0, 0, 0, 837.80, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E25-V3', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045631874201F0010000000322', '18/10/2026', '17/12/2026', '01', 'F001', 322, null, '6', 20601234561, 'STREAMING STORE LIMA S.A.C.', 0, 6960.00, 0, 1252.80, 0, 0, 0, 0, 0, 0, 0, 0, 8212.80, 'PEN', 1, null, null, null, null, null, 1, 0, 0, '0101'),
('E25-V4', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045631874207F0010000000015', '22/10/2026', null, '07', 'F001', 15, null, '6', 20604587123, 'PRODUCTORA ANDINA MEDIA S.A.C.', 0, -415.00, 0, -74.70, 0, 0, 0, 0, 0, 0, 0, 0, -489.70, 'PEN', 1, '08/10/2026', '01', 'F001', '321', '04', 1, 0, 0, '0101'),
('E25-V5', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045631874208F0010000000008', '26/10/2026', null, '08', 'F001', 8, null, '6', 20601234561, 'STREAMING STORE LIMA S.A.C.', 0, 260.00, 0, 46.80, 0, 0, 0, 0, 0, 0, 0, 0, 306.80, 'PEN', 1, '18/10/2026', '01', 'F001', '322', '02', 1, 0, 0, '0101');

insert into public.ventas_adicional (id_venta, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_cliente, detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_a_detraccion, pct_detraccion, monto_detraccion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values
('E21-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E21-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E21-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E21-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E21-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E22-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E22-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E22-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E22-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E22-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E23-V1', '202601', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E23-V2', '202601', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E23-V3', '202601', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E23-V4', '202601', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E23-V5', '202601', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E24-V1', '202610', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E24-V2', '202610', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E24-V3', '202610', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E24-V4', '202610', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E24-V5', '202610', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0),
('E25-V1', '202610', 'F001', 321, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta con guia de remision remitente T001-00120', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E25-V2', '202610', 'B001', 450, 'Boleta de Venta', 'Persona Natural', 'Bienes', 'Venta al consumidor final', 'Contado', 0, null, 'No', 0, 0, null, 0, 0, 0),
('E25-V3', '202610', 'F001', 322, 'Factura', 'Empresa Nacional', 'Bienes', 'Venta al credito a 60 dias', 'Credito', 1, null, 'No', 0, 0, null, 0, 0, 0),
('E25-V4', '202610', 'F001', 15, 'Nota de Credito', 'Empresa Nacional', 'Nota de Credito', 'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', null, 0, 'Descuento global', 'No', 0, 0, null, 0, 0, 0),
('E25-V5', '202610', 'F001', 8, 'Nota de Debito', 'Empresa Nacional', 'Nota de Debito', 'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', null, 0, 'Aumento en el valor', 'No', 0, 0, null, 0, 0, 0);

insert into public.ventas_detalle (id_venta, item_nro, codigo_sku, descripcion, unidad_medida, cantidad, valor_unitario, valor_de_venta_total, moneda) values
('E21-V1', 1, 'BLU-001', 'Blusa de vestir manga larga', 'NIU', 50, 52.00, 2600.00, 'PEN'),
('E21-V1', 2, 'VES-002', 'Vestido de oficina', 'NIU', 20, 105.00, 2100.00, 'PEN'),
('E21-V2', 1, 'BLU-001', 'Blusa de vestir manga larga', 'NIU', 3, 65.00, 195.00, 'PEN'),
('E21-V2', 2, 'CAS-003', 'Casaca de dama', 'NIU', 1, 155.00, 155.00, 'PEN'),
('E21-V3', 1, 'VES-002', 'Vestido de oficina', 'NIU', 50, 105.00, 5250.00, 'PEN'),
('E21-V3', 2, 'CAS-003', 'Casaca de dama', 'NIU', 20, 125.00, 2500.00, 'PEN'),
('E21-V4', 1, 'DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 'ZZ', 1, 235.00, 235.00, 'PEN'),
('E21-V5', 1, 'INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 'ZZ', 1, 250.00, 250.00, 'PEN'),
('E22-V1', 1, 'PEL-002', 'Peluche pequeno de 25 cm', 'NIU', 40, 88.00, 3520.00, 'PEN'),
('E22-V1', 2, 'PEL-003', 'Peluche mediano de 50 cm', 'NIU', 10, 155.00, 1550.00, 'PEN'),
('E22-V2', 1, 'PEL-001', 'Peluche jumbo de 90 cm', 'NIU', 2, 290.00, 580.00, 'PEN'),
('E22-V2', 2, 'PEL-002', 'Peluche pequeno de 25 cm', 'NIU', 1, 110.00, 110.00, 'PEN'),
('E22-V3', 1, 'PEL-001', 'Peluche jumbo de 90 cm', 'NIU', 25, 240.00, 6000.00, 'PEN'),
('E22-V3', 2, 'PEL-002', 'Peluche pequeno de 25 cm', 'NIU', 20, 88.00, 1760.00, 'PEN'),
('E22-V4', 1, 'DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 'ZZ', 1, 253.50, 253.50, 'PEN'),
('E22-V5', 1, 'INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 'ZZ', 1, 230.00, 230.00, 'PEN'),
('E23-V1', 1, 'CEL-001', 'Celular de gama media modelo A', 'NIU', 15, 700.00, 10500.00, 'PEN'),
('E23-V2', 1, 'CEL-002', 'Celular de gama basica modelo B', 'NIU', 3, 350.00, 1050.00, 'PEN'),
('E23-V2', 2, 'ACC-003', 'Audifonos inalambricos', 'NIU', 2, 95.00, 190.00, 'PEN'),
('E23-V3', 1, 'CEL-002', 'Celular de gama basica modelo B', 'NIU', 40, 290.00, 11600.00, 'PEN'),
('E23-V4', 1, 'DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 'ZZ', 1, 525.00, 525.00, 'PEN'),
('E23-V5', 1, 'INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 'ZZ', 1, 300.00, 300.00, 'PEN'),
('E24-V1', 1, 'ZDM-001', 'Zapatilla deportiva de dama (par)', 'NIU', 40, 135.00, 5400.00, 'PEN'),
('E24-V1', 2, 'ZVC-003', 'Zapato de vestir de caballero (par)', 'NIU', 20, 180.00, 3600.00, 'PEN'),
('E24-V2', 1, 'ZDH-002', 'Zapatilla deportiva de caballero (par)', 'NIU', 2, 189.00, 378.00, 'PEN'),
('E24-V2', 2, 'ZDM-001', 'Zapatilla deportiva de dama (par)', 'NIU', 2, 169.00, 338.00, 'PEN'),
('E24-V3', 1, 'ZDH-002', 'Zapatilla deportiva de caballero (par)', 'NIU', 45, 155.00, 6975.00, 'PEN'),
('E24-V3', 2, 'ZDM-001', 'Zapatilla deportiva de dama (par)', 'NIU', 20, 135.00, 2700.00, 'PEN'),
('E24-V4', 1, 'DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 'ZZ', 1, 450.00, 450.00, 'PEN'),
('E24-V5', 1, 'INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 'ZZ', 1, 280.00, 280.00, 'PEN'),
('E25-V1', 1, 'MIC-001', 'Microfono de condensador USB', 'NIU', 20, 250.00, 5000.00, 'PEN'),
('E25-V1', 2, 'CAM-002', 'Camara web 4K para streaming', 'NIU', 10, 330.00, 3300.00, 'PEN'),
('E25-V2', 1, 'CAM-002', 'Camara web 4K para streaming', 'NIU', 1, 410.00, 410.00, 'PEN'),
('E25-V2', 2, 'LUZ-003', 'Aro de luz LED de 18 pulgadas', 'NIU', 2, 150.00, 300.00, 'PEN'),
('E25-V3', 1, 'LUZ-003', 'Aro de luz LED de 18 pulgadas', 'NIU', 25, 120.00, 3000.00, 'PEN'),
('E25-V3', 2, 'CAM-002', 'Camara web 4K para streaming', 'NIU', 12, 330.00, 3960.00, 'PEN'),
('E25-V4', 1, 'DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 'ZZ', 1, 415.00, 415.00, 'PEN'),
('E25-V5', 1, 'INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 'ZZ', 1, 260.00, 260.00, 'PEN');

insert into public.ventas_cuotas (id_venta, nro_cuota, total_cuotas, fecha_de_vencimiento, monto_de_la_cuota, moneda) values
('E21-V1', 1, 1, '07/02/2026', 5546.00, 'PEN'),
('E21-V3', 1, 1, '19/03/2026', 9145.00, 'PEN'),
('E22-V1', 1, 1, '07/02/2026', 5982.60, 'PEN'),
('E22-V3', 1, 1, '19/03/2026', 9156.80, 'PEN'),
('E23-V1', 1, 1, '07/02/2026', 12390.00, 'PEN'),
('E23-V3', 1, 1, '19/03/2026', 13688.00, 'PEN'),
('E24-V1', 1, 1, '07/11/2026', 10620.00, 'PEN'),
('E24-V3', 1, 1, '17/12/2026', 11416.50, 'PEN'),
('E25-V1', 1, 1, '07/11/2026', 9794.00, 'PEN'),
('E25-V3', 1, 1, '17/12/2026', 8212.80, 'PEN');

-- Registro de Compras (RCE)
insert into public.registro_compras (id_compra, "RUC", "Apellidos y Nombres o Razón social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón  Social", "BI Gravado DG", "IGV / IPM DG", "BI Gravado DGNG", "IGV / IPM DGNG", "BI Gravado DNG", "IGV / IPM DNG", "Valor Adq. NG", "ISC", "ICBPER", "Otros Trib/ Cargos", "Total CP", "Moneda", "Tipo de Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "IMB", "Est. Comp.", "Incal") values
('E21-C1', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045123897401E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451238974, 'TEXTILES DEL SUR S.A.C.', 5250.00, 945.00, 0, 0, 0, 0, 0, 0, 0, 0, 6195.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E21-C2', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2050987412501E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20509874125, 'CONFECCIONES LIMA MODA S.A.C.', 5600.00, 1008.00, 0, 0, 0, 0, 0, 0, 0, 0, 6608.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E21-C3', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 450.00, 81.00, 0, 0, 0, 0, 0, 0, 0, 0, 531.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E21-C4', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E21-C5', 20454876231, 'COMERCIAL DON JUAN E.I.R.L.', 202601, '2045123897407E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451238974, 'TEXTILES DEL SUR S.A.C.', -350.00, -63.00, 0, 0, 0, 0, 0, 0, 0, 0, -413.00, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E22-C1', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045178963201E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451789632, 'FULL PELUCHES PERU S.A.C.', 3900.00, 702.00, 0, 0, 0, 0, 0, 0, 0, 0, 4602.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E22-C2', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2050874126301E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20508741263, 'IMPORTACIONES LUMAK S.A.C.', 5700.00, 1026.00, 0, 0, 0, 0, 0, 0, 0, 0, 6726.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E22-C3', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 420.00, 75.60, 0, 0, 0, 0, 0, 0, 0, 0, 495.60, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E22-C4', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES ABRAZOS S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E22-C5', 20455103284, 'COMERCIAL MUNDO PELUCHE E.I.R.L.', 202601, '2045178963207E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451789632, 'FULL PELUCHES PERU S.A.C.', -520.00, -93.60, 0, 0, 0, 0, 0, 0, 0, 0, -613.60, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E23-C1', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2045178963201E0010000001250', '03/01/2026', '02/02/2026', '01', 'E001', '1250', '6', 20451789632, 'DISTRIBUIDORA MOVIL DEL SUR S.A.C.', 10000.00, 1800.00, 0, 0, 0, 0, 0, 0, 0, 0, 11800.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E23-C2', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2050874126301E0010000000890', '05/01/2026', null, '01', 'E001', '0890', '6', 20508741263, 'IMPORTACIONES TECNOLOGICAS PERU S.A.C.', 10000.00, 1800.00, 0, 0, 0, 0, 0, 0, 0, 0, 11800.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E23-C3', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2010004567201E0010000000045', '10/01/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 380.00, 68.40, 0, 0, 0, 0, 0, 0, 0, 0, 448.40, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E23-C4', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2033445566101E0010000002210', '20/01/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E23-C5', 20611045411, 'L-MOBILE E.I.R.L.', 202601, '2045178963207E0010000000033', '15/01/2026', null, '07', 'E001', '0033', '6', 20451789632, 'DISTRIBUIDORA MOVIL DEL SUR S.A.C.', -1000.00, -180.00, 0, 0, 0, 0, 0, 0, 0, 0, -1180.00, 'PEN', 1, '03/01/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E24-C1', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045178963201E0010000001250', '03/10/2026', '02/11/2026', '01', 'E001', '1250', '6', 20451789632, 'CALZADOS DEL NORTE S.A.C.', 7600.00, 1368.00, 0, 0, 0, 0, 0, 0, 0, 0, 8968.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E24-C2', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2050874126301E0010000000890', '05/10/2026', null, '01', 'E001', '0890', '6', 20508741263, 'CALZADOS DEL SUR S.A.C.', 7800.00, 1404.00, 0, 0, 0, 0, 0, 0, 0, 0, 9204.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E24-C3', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2010004567201E0010000000045', '10/10/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 460.00, 82.80, 0, 0, 0, 0, 0, 0, 0, 0, 542.80, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E24-C4', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2033445566101E0010000002210', '20/10/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES RAPIDOS DEL SUR S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E24-C5', 20455720163, 'COMERCIAL PASO FIRME E.I.R.L.', 202610, '2045178963207E0010000000033', '15/10/2026', null, '07', 'E001', '0033', '6', 20451789632, 'CALZADOS DEL NORTE S.A.C.', -570.00, -102.60, 0, 0, 0, 0, 0, 0, 0, 0, -672.60, 'PEN', 1, '03/10/2026', '01', 'E001', '1250', '07', 0, 1, 0),
('E25-C1', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045178963201E0010000001250', '03/10/2026', '02/11/2026', '01', 'E001', '1250', '6', 20451789632, 'AUDIO PRO IMPORT S.A.C.', 4500.00, 810.00, 0, 0, 0, 0, 0, 0, 0, 0, 5310.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E25-C2', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2050874126301E0010000000890', '05/10/2026', null, '01', 'E001', '0890', '6', 20508741263, 'TECNOLOGIA VISUAL PERU S.A.C.', 4800.00, 864.00, 0, 0, 0, 0, 0, 0, 0, 0, 5664.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E25-C3', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2010004567201E0010000000045', '10/10/2026', null, '01', 'E001', '0045', '6', 20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.', 520.00, 93.60, 0, 0, 0, 0, 0, 0, 0, 0, 613.60, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E25-C4', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2033445566101E0010000002210', '20/10/2026', null, '01', 'E001', '2210', '6', 20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.', 600.00, 108.00, 0, 0, 0, 0, 0, 0, 0, 0, 708.00, 'PEN', 1, null, null, null, null, null, 0, 1, 0),
('E25-C5', 20456318742, 'DREAM MAKERS PERU E.I.R.L.', 202610, '2045178963207E0010000000033', '15/10/2026', null, '07', 'E001', '0033', '6', 20451789632, 'AUDIO PRO IMPORT S.A.C.', -540.00, -97.20, 0, 0, 0, 0, 0, 0, 0, 0, -637.20, 'PEN', 1, '03/10/2026', '01', 'E001', '1250', '07', 0, 1, 0);

insert into public.compras_adicional (id_compra, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_proveedor, detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_detraccion_retencion, tipo_detraccion_retencion, pct_detraccion_retencion, monto_detraccion_retencion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values
('E21-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E21-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E21-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E21-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E21-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E22-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E22-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E22-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E22-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E22-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E23-C1', '202601', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E23-C2', '202601', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E23-C3', '202601', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E23-C4', '202601', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E23-C5', '202601', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E24-C1', '202610', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E24-C2', '202610', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E24-C3', '202610', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E24-C4', '202610', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E24-C5', '202610', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0),
('E25-C1', '202610', 'E001', '1250', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Credito', 1, null, 'No', null, 0, 0, null, 0, 0, 0),
('E25-C2', '202610', 'E001', '0890', 'Factura', 'Nacional - Bienes/Servicios', 'Bienes', 'Compra de mercaderia', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E25-C3', '202610', 'E001', '0045', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Energia electrica del local del mes', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E25-C4', '202610', 'E001', '2210', 'Factura', 'Nacional - Bienes/Servicios', 'Servicios', 'Flete por el despacho de la factura F001-00321', 'Contado', 0, null, 'No', null, 0, 0, null, 0, 0, 0),
('E25-C5', '202610', 'E001', '0033', 'Nota de Credito', 'Nacional - Bienes/Servicios', 'Nota de Credito', 'NC ref. Factura E001-1250 - Devolucion por item', null, 0, 'Devolución por ítem', 'No', null, 0, 0, null, 0, 0, 0);

insert into public.compras_detalle (id_compra, item_nro, descripcion, cantidad, valor_unitario, valor_total, moneda) values
('E21-C1', 1, 'Blusa de vestir manga larga', 150, 35.00, 5250.00, 'PEN'),
('E21-C2', 1, 'Vestido de oficina', 80, 70.00, 5600.00, 'PEN'),
('E21-C3', 1, 'Energia electrica del local del mes', 1, 450.00, 450.00, 'PEN'),
('E21-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E21-C5', 1, 'Blusa de vestir manga larga (devolucion por costura abierta)', 10, 35.00, 350.00, 'PEN'),
('E22-C1', 1, 'Peluche pequeno de 25 cm', 60, 65.00, 3900.00, 'PEN'),
('E22-C2', 1, 'Peluche jumbo de 90 cm', 30, 190.00, 5700.00, 'PEN'),
('E22-C3', 1, 'Energia electrica del local del mes', 1, 420.00, 420.00, 'PEN'),
('E22-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E22-C5', 1, 'Peluche pequeno de 25 cm (devolucion por costura abierta)', 8, 65.00, 520.00, 'PEN'),
('E23-C1', 1, 'Celular de gama media modelo A', 20, 500.00, 10000.00, 'PEN'),
('E23-C2', 1, 'Celular de gama basica modelo B', 50, 200.00, 10000.00, 'PEN'),
('E23-C3', 1, 'Energia electrica del local del mes', 1, 380.00, 380.00, 'PEN'),
('E23-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E23-C5', 1, 'Celular de gama media modelo A (devolucion por falla de pantalla)', 2, 500.00, 1000.00, 'PEN'),
('E24-C1', 1, 'Zapatilla deportiva de dama (par)', 80, 95.00, 7600.00, 'PEN'),
('E24-C2', 1, 'Zapato de vestir de caballero (par)', 60, 130.00, 7800.00, 'PEN'),
('E24-C3', 1, 'Energia electrica del local del mes', 1, 460.00, 460.00, 'PEN'),
('E24-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E24-C5', 1, 'Zapatilla deportiva de dama (devolucion por defecto de pegado)', 6, 95.00, 570.00, 'PEN'),
('E25-C1', 1, 'Microfono de condensador USB', 25, 180.00, 4500.00, 'PEN'),
('E25-C2', 1, 'Camara web 4K para streaming', 20, 240.00, 4800.00, 'PEN'),
('E25-C3', 1, 'Energia electrica del local del mes', 1, 520.00, 520.00, 'PEN'),
('E25-C4', 1, 'Flete por el despacho de la factura F001-00321', 1, 600.00, 600.00, 'PEN'),
('E25-C5', 1, 'Microfono de condensador USB (devolucion por falla de captacion)', 3, 180.00, 540.00, 'PEN');

commit;

-- Cuadre (coincide con la tabla "Para comprobar sus comprobantes" del caso):
--   E21 202601  compras BI 11550.00 IGV 2079.00 | ventas BI 12815.00 IGV 2306.70 | energia 450.00 flete 600.00 ND 250.00
--   E22 202601  compras BI 10100.00 IGV 1818.00 | ventas BI 13496.50 IGV 2429.37 | energia 420.00 flete 600.00 ND 230.00
--   E23 202601  compras BI 19980.00 IGV 3596.40 | ventas BI 23115.00 IGV 4160.70 | energia 380.00 flete 600.00 ND 300.00
--   E24 202610  compras BI 15890.00 IGV 2860.20 | ventas BI 19221.00 IGV 3459.78 | energia 460.00 flete 600.00 ND 280.00
--   E25 202610  compras BI 9880.00 IGV 1778.40 | ventas BI 15815.00 IGV 2846.70 | energia 520.00 flete 600.00 ND 260.00

-- Verificación
-- select "Ruc", "Periodo", count(*), sum("BI Gravada"), sum("IGV / IPM") from registro_ventas
--  where id_venta like 'E2_-V_' group by 1, 2 order by 1;
-- select "RUC", "Periodo", count(*), sum("BI Gravado DG"), sum("IGV / IPM DG") from registro_compras
--  where id_compra like 'E2_-C_' group by 1, 2 order by 1;

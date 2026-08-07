-- Tabla: public.parametros_tributarios
-- Parte 1 de 1 | filas totales del archivo: 27
-- Se puede volver a ejecutar sin duplicar (on conflict do nothing).

insert into public.parametros_tributarios ("parametro", "valor", "observacion") values
('UIT 2025', 'S/ 5,350.00', 'Unidad Impositiva Tributaria usada para renta de 5ta y multas (valor referencial)'),
('UIT 2026', 'S/ 5,600.00', 'Valor referencial utilizado en la simulacion'),
('RMV (Remuneracion Minima Vital)', 'S/ 1,130.00', 'Base minima de calculo de EsSalud y aportes'),
('Asignacion Familiar', 'S/ 113.00', '10% de la RMV, para trabajadores con hijos menores de 18 anos'),
('Tasa IGV', '18%', '16% IGV + 2% IPM'),
('EsSalud regular', '9%', 'A cargo del empleador, base minima = RMV'),
('EsSalud - Seguro Agrario', '6%', 'Aplicable al regimen laboral agrario'),
('SIS Microempresa', 'S/ 0.00', 'Trabajadores de microempresa afiliados al SIS (aporte semisubsidiado)'),
('ONP (SNP)', '13%', 'Retencion al trabajador afiliado al Sistema Nacional de Pensiones'),
('AFP aporte obligatorio', '10%', 'Cuenta individual de capitalizacion'),
('AFP prima de seguro', '1.74%', 'Sobre la Remuneracion Maxima Asegurable'),
('AFP comision sobre flujo', '1.47% a 1.69%', 'Varia segun la AFP'),
('Remuneracion Maxima Asegurable (RMA)', 'S/ 13,000.00', 'Tope para la prima de seguro AFP (referencial)'),
('SCTR Salud', '1.30%', 'Solo actividades de riesgo (construccion, transporte, industria)'),
('SCTR Pension', '1.75%', 'Solo actividades de riesgo'),
('Renta 5ta - tramos', '8% / 14% / 17% / 20% / 30%', 'Sobre el exceso de 7 UIT: hasta 5, 20, 35, 45 y mas de 45 UIT'),
('Renta 4ta - retencion', '8%', 'Recibos por honorarios mayores a S/ 1,500'),
('Detraccion servicios (Anexo 3)', '12%', 'Cuando el importe de la operacion supera S/ 700'),
('Detraccion transporte de carga', '4%', 'Cuando el importe supera S/ 400'),
('Detraccion arrendamiento', '10%', 'Bienes muebles e inmuebles'),
('Detraccion contratos de construccion', '4%', 'Cuando el importe supera S/ 700'),
('ICBPER', 'S/ 0.50 por bolsa', 'Impuesto al consumo de bolsas plasticas (valor referencial)'),
('Pago a cuenta IR - Regimen General', '1.5% o coeficiente', 'El mayor entre el coeficiente y el 1.5% de ingresos netos'),
('Pago a cuenta IR - MYPE Tributario', '1% / 1.5%', '1% hasta 300 UIT de ingresos netos anuales'),
('Cuota RER', '1.5%', 'De los ingresos netos mensuales, es pago definitivo'),
('Tasa IR anual - Regimen General', '29.5%', 'Sobre la renta neta imponible'),
('Tasa IR anual - MYPE Tributario', '10% hasta 15 UIT / 29.5% exceso', 'Escala progresiva')
on conflict (parametro) do nothing;

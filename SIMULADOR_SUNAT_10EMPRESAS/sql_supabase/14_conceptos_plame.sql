-- Tabla: public.conceptos_plame
-- Parte 1 de 1 | filas totales del archivo: 18
-- Se puede volver a ejecutar sin duplicar (on conflict do nothing).

insert into public.conceptos_plame ("codigo_concepto", "descripcion", "tipo", "afecto_essalud", "afecto_pension", "afecto_renta_5ta") values
('0121', 'Remuneracion o jornal basico', 'Ingreso', 'SI', 'SI', 'SI'),
('0201', 'Asignacion familiar', 'Ingreso', 'SI', 'SI', 'SI'),
('0106', 'Horas extras 25%', 'Ingreso', 'SI', 'SI', 'SI'),
('0119', 'Bonificaciones y otros conceptos remunerativos', 'Ingreso', 'SI', 'SI', 'SI'),
('0406', 'Gratificacion de Fiestas Patrias / Navidad', 'Ingreso', 'NO', 'NO', 'SI'),
('0312', 'Bonificacion extraordinaria Ley 30334 (9%)', 'Ingreso', 'NO', 'NO', 'SI'),
('0100', 'Vacaciones truncas / gozadas', 'Ingreso', 'SI', 'SI', 'SI'),
('0601', 'Sistema Nacional de Pensiones - ONP 13%', 'Descuento', '-', '-', '-'),
('0605', 'SPP - Aporte obligatorio AFP 10%', 'Descuento', '-', '-', '-'),
('0606', 'SPP - Prima de seguro', 'Descuento', '-', '-', '-'),
('0607', 'SPP - Comision AFP', 'Descuento', '-', '-', '-'),
('0701', 'Renta de Quinta Categoria retenida', 'Descuento', '-', '-', '-'),
('0703', 'Adelantos y otros descuentos', 'Descuento', '-', '-', '-'),
('0804', 'EsSalud - Seguro Regular Trabajador 9%', 'Aporte del empleador', '-', '-', '-'),
('0805', 'EsSalud - Seguro Agrario 6%', 'Aporte del empleador', '-', '-', '-'),
('0806', 'SCTR Salud (EsSalud o EPS)', 'Aporte del empleador', '-', '-', '-'),
('0807', 'SCTR Pension (ONP o Cia. de Seguros)', 'Aporte del empleador', '-', '-', '-'),
('0808', 'EsSalud Vida (seguro potestativo)', 'Aporte del empleador', '-', '-', '-')
on conflict (codigo_concepto) do nothing;

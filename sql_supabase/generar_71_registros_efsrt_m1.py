# -*- coding: utf-8 -*-
"""
Genera 71_registros_efsrt_m1.sql: los comprobantes del caso de Moodle
"Semana 3 — Llenado de comprobantes de pago" de las empresas E21-E25, cargados
en registro_ventas / registro_compras (propuesta del SIRE) y en sus tablas
_adicional, _detalle y ventas_cuotas.

Importes que el caso NO trae y que se deducen de la tabla "Para comprobar sus
comprobantes" de cada equipo:
  - Nota de débito (intereses): sale exacta de la suma de ventas.
  - Energía (C3) + flete (C4): la suma sale exacta de la suma de compras; el
    reparto no. Se fija el flete en S/ 600 (igual que en el ejemplo de la
    Evidencia 1) y la energía es el resto.
Los recibos por honorarios no van al Registro de Compras (no son de IGV) y la
guía de remisión no es comprobante de pago: no se cargan.

Uso:  python generar_71_registros_efsrt_m1.py   (escribe el .sql al lado)
"""
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP
import os

def r2(x):
    return D(x).quantize(D('0.01'), rounding=ROUND_HALF_UP)

FLETE = D('600.00')

# Terceros comunes a los cinco casos
ENERGIA = (20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.')

EMPRESAS = [
    dict(cod='E21', ruc=20454876231, razon='COMERCIAL DON JUAN E.I.R.L.', anio=2026, mes=1,
         prov1=(20451238974, 'TEXTILES DEL SUR S.A.C.'), prov2=(20509874125, 'CONFECCIONES LIMA MODA S.A.C.'),
         transp=(20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.'),
         cli1=(20604587123, 'BOUTIQUE ELEGANCIA S.A.C.'), cli2=(20601234561, 'TIENDAS MODA FEMENINA S.A.C.'),
         consumidor=(45872103, 'ROJAS CHAVEZ MARIA FERNANDA'),
         c1=[('BLU-001', 'Blusa de vestir manga larga', 150, '35.00')],
         c2=[('VES-002', 'Vestido de oficina', 80, '70.00')],
         c5=[('BLU-001', 'Blusa de vestir manga larga (devolucion por costura abierta)', 10, '35.00')],
         v1=[('BLU-001', 'Blusa de vestir manga larga', 50, '52.00'), ('VES-002', 'Vestido de oficina', 20, '105.00')],
         v2=[('BLU-001', 'Blusa de vestir manga larga', 3, '65.00'), ('CAS-003', 'Casaca de dama', 1, '155.00')],
         v3=[('VES-002', 'Vestido de oficina', 50, '105.00'), ('CAS-003', 'Casaca de dama', 20, '125.00')],
         compras_vv='11550.00', ventas_vv='12815.00', ventas_igv='2306.70', compras_igv='2079.00'),
    dict(cod='E22', ruc=20455103284, razon='COMERCIAL MUNDO PELUCHE E.I.R.L.', anio=2026, mes=1,
         prov1=(20451789632, 'FULL PELUCHES PERU S.A.C.'), prov2=(20508741263, 'IMPORTACIONES LUMAK S.A.C.'),
         transp=(20334455661, 'TRANSPORTES ABRAZOS S.A.C.'),
         cli1=(20604587123, 'CORPORACION DETALLES S.A.C.'), cli2=(20601234561, 'DISTRIBUIDORA PELUCHERIA LIMA S.A.C.'),
         consumidor=(42318765, 'PEREZ LUNA JUAN CARLOS'),
         c1=[('PEL-002', 'Peluche pequeno de 25 cm', 60, '65.00')],
         c2=[('PEL-001', 'Peluche jumbo de 90 cm', 30, '190.00')],
         c5=[('PEL-002', 'Peluche pequeno de 25 cm (devolucion por costura abierta)', 8, '65.00')],
         v1=[('PEL-002', 'Peluche pequeno de 25 cm', 40, '88.00'), ('PEL-003', 'Peluche mediano de 50 cm', 10, '155.00')],
         v2=[('PEL-001', 'Peluche jumbo de 90 cm', 2, '290.00'), ('PEL-002', 'Peluche pequeno de 25 cm', 1, '110.00')],
         v3=[('PEL-001', 'Peluche jumbo de 90 cm', 25, '240.00'), ('PEL-002', 'Peluche pequeno de 25 cm', 20, '88.00')],
         compras_vv='10100.00', ventas_vv='13496.50', ventas_igv='2429.37', compras_igv='1818.00'),
    dict(cod='E23', ruc=20611045411, razon='L-MOBILE E.I.R.L.', anio=2026, mes=1,
         prov1=(20451789632, 'DISTRIBUIDORA MOVIL DEL SUR S.A.C.'), prov2=(20508741263, 'IMPORTACIONES TECNOLOGICAS PERU S.A.C.'),
         transp=(20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.'),
         cli1=(20604587123, 'CORPORACION ANDINA S.A.C.'), cli2=(20601234561, 'TIENDAS CONECTADAS DEL SUR S.A.C.'),
         consumidor=(42318765, 'PEREZ LUNA JUAN CARLOS'),
         c1=[('CEL-001', 'Celular de gama media modelo A', 20, '500.00')],
         c2=[('CEL-002', 'Celular de gama basica modelo B', 50, '200.00')],
         c5=[('CEL-001', 'Celular de gama media modelo A (devolucion por falla de pantalla)', 2, '500.00')],
         v1=[('CEL-001', 'Celular de gama media modelo A', 15, '700.00')],
         v2=[('CEL-002', 'Celular de gama basica modelo B', 3, '350.00'), ('ACC-003', 'Audifonos inalambricos', 2, '95.00')],
         v3=[('CEL-002', 'Celular de gama basica modelo B', 40, '290.00')],
         compras_vv='19980.00', ventas_vv='23115.00', ventas_igv='4160.70', compras_igv='3596.40'),
    dict(cod='E24', ruc=20455720163, razon='COMERCIAL PASO FIRME E.I.R.L.', anio=2026, mes=10,
         prov1=(20451789632, 'CALZADOS DEL NORTE S.A.C.'), prov2=(20508741263, 'CALZADOS DEL SUR S.A.C.'),
         transp=(20334455661, 'TRANSPORTES RAPIDOS DEL SUR S.A.C.'),
         cli1=(20604587123, 'ZAPATOS ELEGANTES S.A.C.'), cli2=(20601234561, 'CORPORACION DEPORTIVA DEL NORTE S.A.C.'),
         consumidor=(42318765, 'PEREZ LUNA JUAN CARLOS'),
         c1=[('ZDM-001', 'Zapatilla deportiva de dama (par)', 80, '95.00')],
         c2=[('ZVC-003', 'Zapato de vestir de caballero (par)', 60, '130.00')],
         c5=[('ZDM-001', 'Zapatilla deportiva de dama (devolucion por defecto de pegado)', 6, '95.00')],
         v1=[('ZDM-001', 'Zapatilla deportiva de dama (par)', 40, '135.00'), ('ZVC-003', 'Zapato de vestir de caballero (par)', 20, '180.00')],
         v2=[('ZDH-002', 'Zapatilla deportiva de caballero (par)', 2, '189.00'), ('ZDM-001', 'Zapatilla deportiva de dama (par)', 2, '169.00')],
         v3=[('ZDH-002', 'Zapatilla deportiva de caballero (par)', 45, '155.00'), ('ZDM-001', 'Zapatilla deportiva de dama (par)', 20, '135.00')],
         compras_vv='15890.00', ventas_vv='19221.00', ventas_igv='3459.78', compras_igv='2860.20'),
    dict(cod='E25', ruc=20456318742, razon='DREAM MAKERS PERU E.I.R.L.', anio=2026, mes=10,
         prov1=(20451789632, 'AUDIO PRO IMPORT S.A.C.'), prov2=(20508741263, 'TECNOLOGIA VISUAL PERU S.A.C.'),
         transp=(20334455661, 'TRANSPORTES SUR EXPRESS S.A.C.'),
         cli1=(20604587123, 'PRODUCTORA ANDINA MEDIA S.A.C.'), cli2=(20601234561, 'STREAMING STORE LIMA S.A.C.'),
         consumidor=(42318765, 'PEREZ LUNA JUAN CARLOS'),
         c1=[('MIC-001', 'Microfono de condensador USB', 25, '180.00')],
         c2=[('CAM-002', 'Camara web 4K para streaming', 20, '240.00')],
         c5=[('MIC-001', 'Microfono de condensador USB (devolucion por falla de captacion)', 3, '180.00')],
         v1=[('MIC-001', 'Microfono de condensador USB', 20, '250.00'), ('CAM-002', 'Camara web 4K para streaming', 10, '330.00')],
         v2=[('CAM-002', 'Camara web 4K para streaming', 1, '410.00'), ('LUZ-003', 'Aro de luz LED de 18 pulgadas', 2, '150.00')],
         v3=[('LUZ-003', 'Aro de luz LED de 18 pulgadas', 25, '120.00'), ('CAM-002', 'Camara web 4K para streaming', 12, '330.00')],
         compras_vv='9880.00', ventas_vv='15815.00', ventas_igv='2846.70', compras_igv='1778.40'),
]

def q(v):
    if v is None:
        return 'null'
    if isinstance(v, (int, D)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

def fmt(d):
    return d.strftime('%d/%m/%Y')

def suma(items):
    return sum((D(cant) * D(pu) for _, _, cant, pu in items), D('0'))

out = []
w = out.append
w('-- =============================================================================')
w('-- 71 · Registros SIRE de las empresas E21-E25 (EFSRT Módulo 1, Semana 3)')
w('-- =============================================================================')
w('-- GENERADO por generar_71_registros_efsrt_m1.py: no editar a mano.')
w('-- Carga en la propuesta del SIRE los 10 comprobantes de pago de cada caso:')
w('--   RCE: C1 y C2 (mercadería), C3 (energía), C4 (flete), C5 (NC recibida).')
w('--   RVIE: V1 y V3 (facturas), V2 (boleta), V4 (NC emitida), V5 (ND emitida).')
w('-- Los recibos por honorarios y la guía de remisión no van a estos registros.')
w('-- Importes que el caso no trae: la ND se deduce exacta de la suma de ventas;')
w('-- energía + flete se deduce de la suma de compras, con el flete fijado en')
w('-- S/ 600 y la energía con el resto. Es re-ejecutable.')
w('-- =============================================================================')
w('')
w('begin;')
w('')

ids_v, ids_c = [], []
for e in EMPRESAS:
    ids_v += [f"{e['cod']}-V{i}" for i in range(1, 6)]
    ids_c += [f"{e['cod']}-C{i}" for i in range(1, 6)]
lv = ', '.join(q(i) for i in ids_v)
lc = ', '.join(q(i) for i in ids_c)
w('-- Limpieza previa')
for t in ('ventas_cuotas', 'ventas_detalle', 'ventas_adicional', 'registro_ventas'):
    w(f'delete from public.{t} where id_venta in ({lv});')
for t in ('compras_detalle', 'compras_adicional', 'registro_compras'):
    w(f'delete from public.{t} where id_compra in ({lc});')
w('')

RV_COLS = ('id_venta, "Ruc", "Razon Social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", '
           '"Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Nro Final (Rango)", '
           '"Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón Social", '
           '"Valor Facturado Exportación", "BI Gravada", "Dscto BI", "IGV / IPM", "Dscto IGV / IPM", '
           '"Mto Exonerado", "Mto Inafecto", "ISC", "BI Grav IVAP", "IVAP", "ICBPER", "Otros Tributos", '
           '"Total CP", "Moneda", "Tipo Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", '
           '"Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "Est. Comp", "Valor FOB Embarcado", '
           '"Valor OP Gratuitas", "Tipo Operación"')
RC_COLS = ('id_compra, "RUC", "Apellidos y Nombres o Razón social", "Periodo", "CAR SUNAT", "Fecha de emisión", '
           '"Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", '
           '"Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón  Social", '
           '"BI Gravado DG", "IGV / IPM DG", "BI Gravado DGNG", "IGV / IPM DGNG", "BI Gravado DNG", "IGV / IPM DNG", '
           '"Valor Adq. NG", "ISC", "ICBPER", "Otros Trib/ Cargos", "Total CP", "Moneda", "Tipo de Cambio", '
           '"Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", "Nro CP Modificado", '
           '"Tipo de Nota", "IMB", "Est. Comp.", "Incal"')

rv, rc, va, vd, vc, ca, cd = [], [], [], [], [], [], []
control = []

for e in EMPRESAS:
    y, m = e['anio'], e['mes']
    per = y * 100 + m
    dia = lambda d: date(y, m, d)
    ruc = e['ruc']

    # ---------------- Compras ----------------
    b1, b2 = suma(e['c1']), suma(e['c2'])
    b5 = -suma(e['c5'])
    resto = D(e['compras_vv']) - (b1 + b2 + b5)
    b4 = FLETE
    b3 = resto - FLETE
    assert b3 > 0, e['cod']
    compras = [
        # k, fecha, venc, tipo, serie, nro, prov, base, modif, nota, forma, desc, items, detalle_op
        (1, dia(3), dia(3) + timedelta(days=30), '01', 'E001', '1250', e['prov1'], b1, None, None, 'Credito',
         'Compra de mercaderia', e['c1'], 'Bienes'),
        (2, dia(5), None, '01', 'E001', '0890', e['prov2'], b2, None, None, 'Contado',
         'Compra de mercaderia', e['c2'], 'Bienes'),
        (3, dia(10), None, '01', 'E001', '0045', ENERGIA, b3, None, None, 'Contado',
         'Energia electrica del local del mes', [('SERV-LUZ', 'Energia electrica del local del mes', 1, str(b3))], 'Servicios'),
        (4, dia(20), None, '01', 'E001', '2210', e['transp'], b4, None, None, 'Contado',
         'Flete por el despacho de la factura F001-00321', [('SERV-FLT', 'Flete por el despacho de la factura F001-00321', 1, str(b4))], 'Servicios'),
        (5, dia(15), None, '07', 'E001', '0033', e['prov1'], b5, (dia(3), '01', 'E001', '1250'), '07', None,
         'NC ref. Factura E001-1250 - Devolucion por item', e['c5'], 'Nota de Credito'),
    ]
    tc_bi = tc_igv = D('0')
    for k, fe, fv, tipo, serie, nro, prov, base, modif, nota, forma, desc, items, dop in compras:
        igv = r2(base * D('0.18'))
        tot = base + igv
        tc_bi += base; tc_igv += igv
        idc = f"{e['cod']}-C{k}"
        car = f"{prov[0]}{tipo}{serie}{nro.zfill(10)}"
        mf = modif or (None, None, None, None)
        rc.append('(' + ', '.join([
            q(idc), q(ruc), q(e['razon']), q(per), q(car), q(fmt(fe)), q(fmt(fv) if fv else None), q(tipo), q(serie), q(nro),
            q('6'), q(prov[0]), q(prov[1]), q(base), q(igv), '0', '0', '0', '0', '0', '0', '0', '0', q(tot), q('PEN'), '1',
            q(fmt(mf[0]) if mf[0] else None), q(mf[1]), q(mf[2]), q(mf[3]), q(nota), '0', '1', '0']) + ')')
        ca.append('(' + ', '.join([
            q(idc), q(str(per)), q(serie), q(nro), q('Nota de Credito' if tipo == '07' else 'Factura'),
            q('Nacional - Bienes/Servicios'), q(dop), q(desc), q(forma), q(1 if forma == 'Credito' else 0),
            q('Devolución por ítem' if tipo == '07' else None), q('No'), 'null', '0', '0', 'null', '0', '0', '0']) + ')')
        for i, (sku, des, cant, pu) in enumerate(items, 1):
            cd.append('(' + ', '.join([q(idc), q(i), q(des), q(int(cant)), q(D(pu)), q(r2(D(cant) * D(pu))), q('PEN')]) + ')')

    # ---------------- Ventas ----------------
    s1, s2, s3 = suma(e['v1']), suma(e['v2']), suma(e['v3'])
    s4 = -r2(s1 * D('0.05'))
    s5 = D(e['ventas_vv']) - (s1 + s2 + s3 + s4)
    assert s5 > 0, e['cod']
    ventas = [
        (1, dia(8), dia(8) + timedelta(days=30), '01', 'F001', 321, e['cli1'], '6', s1, None, None, 'Credito', 'Factura',
         'Venta con guia de remision remitente T001-00120', e['v1']),
        (2, dia(12), None, '03', 'B001', 450, e['consumidor'], '1', s2, None, None, 'Contado', 'Boleta de Venta',
         'Venta al consumidor final', e['v2']),
        (3, dia(18), dia(18) + timedelta(days=60), '01', 'F001', 322, e['cli2'], '6', s3, None, None, 'Credito', 'Factura',
         'Venta al credito a 60 dias', e['v3']),
        (4, dia(22), None, '07', 'F001', 15, e['cli1'], '6', s4, (dia(8), '01', 'F001', '321'), '04', None, 'Nota de Credito',
         'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', [('DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 1, str(-s4))]),
        (5, dia(26), None, '08', 'F001', 8, e['cli2'], '6', s5, (dia(18), '01', 'F001', '322'), '02', None, 'Nota de Debito',
         'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', [('INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 1, str(s5))]),
    ]
    tv_bi = tv_igv = D('0')
    for k, fe, fv, tipo, serie, nro, cli, tdoc, base, modif, nota, forma, comp, desc, items in ventas:
        igv = r2(base * D('0.18'))
        tot = base + igv
        tv_bi += base; tv_igv += igv
        idv = f"{e['cod']}-V{k}"
        car = f"{ruc}{tipo}{serie}{str(nro).zfill(10)}"
        mf = modif or (None, None, None, None)
        rv.append('(' + ', '.join([
            q(idv), q(ruc), q(e['razon']), q(per), q(car), q(fmt(fe)), q(fmt(fv) if fv else None), q(tipo), q(serie), q(nro),
            'null', q(tdoc), q(cli[0]), q(cli[1]), '0', q(base), '0', q(igv), '0', '0', '0', '0', '0', '0', '0', '0',
            q(tot), q('PEN'), '1', q(fmt(mf[0]) if mf[0] else None), q(mf[1]), q(mf[2]), q(mf[3]), q(nota),
            '1', '0', '0', q('0101')]) + ')')
        motivo = {'07': 'Descuento global', '08': 'Aumento en el valor'}.get(tipo)
        va.append('(' + ', '.join([
            q(idv), q(str(per)), q(serie), q(nro), q(comp), q('Persona Natural' if tdoc == '1' else 'Empresa Nacional'),
            q('Bienes' if tipo in ('01', '03') else comp), q(desc), q(forma), q(1 if forma == 'Credito' else 0),
            q(motivo), q('No'), '0', '0', 'null', '0', '0', '0']) + ')')
        for i, (sku, des, cant, pu) in enumerate(items, 1):
            um = 'NIU' if tipo in ('01', '03') else 'ZZ'
            vd.append('(' + ', '.join([q(idv), q(i), q(sku), q(des), q(um), q(int(cant)), q(D(pu)), q(r2(D(cant) * D(pu))), q('PEN')]) + ')')
        if forma == 'Credito':
            vc.append('(' + ', '.join([q(idv), '1', '1', q(fmt(fv)), q(tot), q('PEN')]) + ')')

    # Cuadre contra la tabla "Para comprobar" del caso
    assert tc_bi == D(e['compras_vv']) and tc_igv == D(e['compras_igv']), (e['cod'], tc_bi, tc_igv)
    assert tv_bi == D(e['ventas_vv']) and tv_igv == D(e['ventas_igv']), (e['cod'], tv_bi, tv_igv)
    control.append(f"--   {e['cod']} {per}  compras BI {tc_bi} IGV {tc_igv} | ventas BI {tv_bi} IGV {tv_igv} | "
                   f"energia {b3} flete {b4} ND {s5}")

w('-- Registro de Ventas (RVIE)')
w(f'insert into public.registro_ventas ({RV_COLS}) values')
w(',\n'.join(rv) + ';')
w('')
w('insert into public.ventas_adicional (id_venta, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_cliente, '
  'detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_a_detraccion, '
  'pct_detraccion, monto_detraccion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values')
w(',\n'.join(va) + ';')
w('')
w('insert into public.ventas_detalle (id_venta, item_nro, codigo_sku, descripcion, unidad_medida, cantidad, '
  'valor_unitario, valor_de_venta_total, moneda) values')
w(',\n'.join(vd) + ';')
w('')
w('insert into public.ventas_cuotas (id_venta, nro_cuota, total_cuotas, fecha_de_vencimiento, monto_de_la_cuota, moneda) values')
w(',\n'.join(vc) + ';')
w('')
w('-- Registro de Compras (RCE)')
w(f'insert into public.registro_compras ({RC_COLS}) values')
w(',\n'.join(rc) + ';')
w('')
w('insert into public.compras_adicional (id_compra, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_proveedor, '
  'detalle_de_la_operacion, descripcion, forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_detraccion_retencion, '
  'tipo_detraccion_retencion, pct_detraccion_retencion, monto_detraccion_retencion, nro_constancia_deposito, anticipos, '
  'otros_cargos, monto_de_redondeo) values')
w(',\n'.join(ca) + ';')
w('')
w('insert into public.compras_detalle (id_compra, item_nro, descripcion, cantidad, valor_unitario, valor_total, moneda) values')
w(',\n'.join(cd) + ';')
w('')
w('commit;')
w('')
w('-- Cuadre (coincide con la tabla "Para comprobar sus comprobantes" del caso):')
out += control
w('')
w('-- Verificación')
w('-- select "Ruc", "Periodo", count(*), sum("BI Gravada"), sum("IGV / IPM") from registro_ventas')
w("--  where id_venta like 'E2_-V_' group by 1, 2 order by 1;")
w('-- select "RUC", "Periodo", count(*), sum("BI Gravado DG"), sum("IGV / IPM DG") from registro_compras')
w("--  where id_compra like 'E2_-C_' group by 1, 2 order by 1;")

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '71_registros_efsrt_m1.sql')
with open(dst, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out) + '\n')
print('\n'.join(control))
print('Escrito', dst)

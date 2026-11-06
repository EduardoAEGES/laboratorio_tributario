# -*- coding: utf-8 -*-
"""
Genera 74_empresas_salon2.sql: las empresas E26-E28 del segundo salón (EFSRT
Módulo 1, semana 3) y sus comprobantes en la propuesta del SIRE, con los mismos
datos del enunciado de Moodle (enunciados/generar_semana3_salon2.py).

  E26 Las Auditoras   COMERCIAL CGM S.A.C.                 20457182601
  E27 Grupo 1         COMERCIAL ESENCIAS AREQUIPA E.I.R.L. 20459264133
  E28 Debe y Haber    SPORT ACTIVE PERU S.A.C.             20461375821

Los recibos por honorarios los emiten los prestadores P01 y P02
(73_prestadores_cuarta.sql), que son los mismos para los dos salones.

Uso:  python generar_74_salon2.py
"""
import os, sys, unicodedata
from datetime import date, timedelta
from decimal import Decimal as D, ROUND_HALF_UP

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(AQUI), 'enunciados'))
import generar_semana3_salon2 as enu   # noqa: E402

def r2(x): return D(x).quantize(D('0.01'), rounding=ROUND_HALF_UP)
def sin_tildes(s): return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
def mayus(s): return sin_tildes(s).upper().replace(',', '')
def q(v):
    if v is None: return 'null'
    if isinstance(v, (int, D)): return str(v)
    return "'" + str(v).replace("'", "''") + "'"
def fmt(d): return d.strftime('%d/%m/%Y')

COD = {'Las Auditoras': 'E26', 'Grupo 1': 'E27', 'Debe y Haber': 'E28'}
CIIU = {'E26': ('4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado'),
        'E27': ('4649', 'Venta al por mayor de otros enseres domesticos'),
        'E28': ('4641', 'Venta al por mayor de productos textiles prendas de vestir y calzado')}
INICIO = {'E26': '2022-03-01', 'E27': '2021-09-06', 'E28': '2023-02-13'}
ENERGIA = (20100045672, 'SERVICIOS ELECTRICOS AREQUIPA S.R.L.')

out = []; w = out.append
w('-- =============================================================================')
w('-- 74 · Empresas del segundo salón (EFSRT Módulo 1, semana 3) y sus registros')
w('-- =============================================================================')
w('-- GENERADO por generar_74_salon2.py con los datos del enunciado de Moodle.')
w('-- Los recibos por honorarios los emiten P01 y P02 (73_prestadores_cuarta.sql).')
w('-- Es re-ejecutable.')
w('-- =============================================================================')
w('begin;')
emp_rows, rv, va, vd, vc, rc, ca, cd = [], [], [], [], [], [], [], []
rucs = []
for e in enu.EQUIPOS:
    cod = COD[e['equipo']]; ruc = int(e['ruc']); rucs.append(e['ruc'])
    razon = mayus(e['empresa'])
    dom = e['domicilio'].split(',')
    direccion, distrito = dom[0].strip(), dom[1].strip()
    gerente = e['gerente'].split()
    rep = mayus(' '.join(gerente[2:] + gerente[:2])) if len(gerente) >= 4 else mayus(e['gerente'])
    rep = rep.title()
    emp_rows.append('(' + ', '.join(q(v) for v in [
        cod, e['ruc'], razon, e['empresa'].split(' ')[1] if e['empresa'].startswith('Comercial') else e['empresa'].split(' S.A.C')[0],
        'Sociedad Anonima Cerrada' if 'S.A.C' in e['empresa'] else 'Empresa Individual de Responsabilidad Limitada',
        'Comercio mayorista y minorista de ' + sin_tildes(e['giro']), sin_tildes(', '.join(p[1] for p in e['catalogo'])).replace(',', ''),
        'Tiendas mayoristas de Arequipa y Lima y consumidores finales', CIIU[cod][0], CIIU[cod][1],
        'Regimen General', 'Microempresa (REMYPE)', 'Activo', 'Habido', INICIO[cod],
        sin_tildes(direccion).replace(' 1245', ' Nro. 1245').replace(' 123', ' Nro. 123'), sin_tildes(distrito), 'Arequipa', 'Arequipa',
        None, None, None, rep, None, 'Completa', 'F001', 'B001', 'F001', 'SI - SEE SOL / Facturador SUNAT', 'NO', 4, 'BCP', None, 'NO',
        'Registro de Ventas e Ingresos y Registro de Compras (SIRE)', '2025-12', 'Quispe Flores Ana Maria', '45782163', None, None, None]) + ')')

    y, mth, per = 2026, 1, 202601
    dia = lambda d: date(y, mth, d)
    prod = lambda c: enu.producto(e, c)
    def base(items, col): return sum((D(cant) * D(prod(c)[col]) for c, cant in items), D('0'))
    # ---- compras
    b1, b2 = base(e['c1'], 2), base(e['c2'], 2)
    c5c, c5n, falla = e['c5']; b5 = -(c5n * D(prod(c5c)[2]))
    prov1 = (int(e['prov1'][1]), mayus(e['prov1'][0])); prov2 = (int(e['prov2'][1]), mayus(e['prov2'][0]))
    transp = (int(e['transp'][1]), mayus(e['transp'][0]))
    compras = [
        (1, dia(3), dia(3) + timedelta(30), '01', '1250', prov1, b1, None, None, 'Credito', 'Bienes', 'Compra de mercaderia',
         [(prod(c)[1], cant, prod(c)[2]) for c, cant in e['c1']]),
        (2, dia(5), None, '01', '0890', prov2, b2, None, None, 'Contado', 'Bienes', 'Compra de mercaderia',
         [(prod(c)[1], cant, prod(c)[2]) for c, cant in e['c2']]),
        (3, dia(10), None, '01', '0045', ENERGIA, e['energia'], None, None, 'Contado', 'Servicios', 'Energia electrica del local del mes',
         [('Energia electrica del local del mes', 1, e['energia'])]),
        (4, dia(20), None, '01', '2210', transp, e['flete'], None, None, 'Contado', 'Servicios', 'Flete por el despacho de la factura F001-00321',
         [('Flete por el despacho de la factura F001-00321', 1, e['flete'])]),
        (5, dia(15), None, '07', '0033', prov1, b5, (dia(3), '01', 'E001', '1250'), '07', None, 'Nota de Credito',
         'NC ref. Factura E001-1250 - Devolucion por item', [(prod(c5c)[1] + ' (devolucion ' + falla + ')', c5n, prod(c5c)[2])]),
    ]
    for k, fe, fv, tipo, nro, pv, bi, mf, nota, forma, dop, desc, items in compras:
        igv = r2(bi * enu.IGV); idc = '%s-C%d' % (cod, k); mf = mf or (None,) * 4
        rc.append('(' + ', '.join([q(idc), q(ruc), q(razon), q(per), q('%d%sE001%s' % (pv[0], tipo, nro.zfill(10))), q(fmt(fe)),
                                   q(fmt(fv) if fv else None), q(tipo), q('E001'), q(nro), q('6'), q(pv[0]), q(pv[1]), q(r2(bi)), q(igv),
                                   '0', '0', '0', '0', '0', '0', '0', '0', q(r2(bi) + igv), q('PEN'), '1',
                                   q(fmt(mf[0]) if mf[0] else None), q(mf[1]), q(mf[2]), q(mf[3]), q(nota), '0', '1', '0']) + ')')
        ca.append('(' + ', '.join([q(idc), q(str(per)), q('E001'), q(nro), q('Nota de Credito' if tipo == '07' else 'Factura'),
                                   q('Nacional - Bienes/Servicios'), q(dop), q(desc), q(forma), q(1 if forma == 'Credito' else 0),
                                   q('Devolución por ítem' if tipo == '07' else None), q('No'), 'null', '0', '0', 'null', '0', '0', '0']) + ')')
        for i, (dsc, cant, vu) in enumerate(items, 1):
            cd.append('(' + ', '.join([q(idc), q(i), q(sin_tildes(dsc)), q(int(cant)), q(r2(vu)), q(r2(D(cant) * D(vu))), q('PEN')]) + ')')
    # ---- ventas
    s1, s2, s3 = base(e['v1'], 3), base(e['v2'], 4), base(e['v3'], 3)
    s4 = -r2(s1 * D('0.05')); s5 = e['interes']
    cli1 = (int(e['cli1'][1]), mayus(e['cli1'][0])); cli2 = (int(e['cli2'][1]), mayus(e['cli2'][0]))
    cons = (int(e['consumidor'][1]), mayus(' '.join(e['consumidor'][0].split()[-2:] + e['consumidor'][0].split()[:-2])))
    sku = lambda items, col: [(c, prod(c)[1], cant, prod(c)[col]) for c, cant in items]
    ventas = [
        (1, dia(8), dia(8) + timedelta(30), '01', 'F001', 321, cli1, '6', s1, None, None, 'Credito', 'Factura', 'Venta con guia de remision remitente T001-00120', sku(e['v1'], 3)),
        (2, dia(12), None, '03', 'B001', 450, cons, '1', s2, None, None, 'Contado', 'Boleta de Venta', 'Venta al consumidor final', sku(e['v2'], 4)),
        (3, dia(18), dia(18) + timedelta(60), '01', 'F001', 322, cli2, '6', s3, None, None, 'Credito', 'Factura', 'Venta al credito a 60 dias', sku(e['v3'], 3)),
        (4, dia(22), None, '07', 'F001', 15, cli1, '6', s4, (dia(8), '01', 'F001', '321'), '04', None, 'Nota de Credito',
         'NC ref. Factura F001-00321 - Descuento por pronto pago del 5%', [('DSCTO', 'Descuento por pronto pago del 5% sobre la factura F001-00321', 1, -s4)]),
        (5, dia(26), None, '08', 'F001', 8, cli2, '6', s5, (dia(18), '01', 'F001', '322'), '02', None, 'Nota de Debito',
         'ND ref. Factura F001-00322 - Intereses por financiamiento a 60 dias', [('INTER', 'Intereses por el financiamiento a 60 dias de la factura F001-00322', 1, s5)]),
    ]
    for k, fe, fv, tipo, serie, nro, cl, tdoc, bi, mf, nota, forma, comp, desc, items in ventas:
        igv = r2(bi * enu.IGV); idv = '%s-V%d' % (cod, k); mf = mf or (None,) * 4; tot = r2(bi) + igv
        rv.append('(' + ', '.join([q(idv), q(ruc), q(razon), q(per), q('%d%s%s%s' % (ruc, tipo, serie, str(nro).zfill(10))), q(fmt(fe)),
                                   q(fmt(fv) if fv else None), q(tipo), q(serie), q(nro), 'null', q(tdoc), q(cl[0]), q(cl[1]), '0', q(r2(bi)), '0',
                                   q(igv), '0', '0', '0', '0', '0', '0', '0', '0', q(tot), q('PEN'), '1',
                                   q(fmt(mf[0]) if mf[0] else None), q(mf[1]), q(mf[2]), q(mf[3]), q(nota), '1', '0', '0', q('0101')]) + ')')
        va.append('(' + ', '.join([q(idv), q(str(per)), q(serie), q(nro), q(comp), q('Persona Natural' if tdoc == '1' else 'Empresa Nacional'),
                                   q('Bienes' if tipo in ('01', '03') else comp), q(desc), q(forma), q(1 if forma == 'Credito' else 0),
                                   q({'07': 'Descuento global', '08': 'Aumento en el valor'}.get(tipo)), q('No'), '0', '0', 'null', '0', '0', '0']) + ')')
        for i, (sk, dsc, cant, vu) in enumerate(items, 1):
            vd.append('(' + ', '.join([q(idv), q(i), q(sk), q(mayus(dsc)), q('NIU' if tipo in ('01', '03') else 'ZZ'), q(int(cant)),
                                       q(r2(vu)), q(r2(D(cant) * D(vu))), q('PEN')]) + ')')
        if forma == 'Credito':
            vc.append('(' + ', '.join([q(idv), '1', '1', q(fmt(fv)), q(tot), q('PEN')]) + ')')

lr = ', '.join(q(r) for r in rucs)
w('delete from public.ventas_cuotas where id_venta like any (array[%s]);' % ', '.join(q(c + '-V%') for c in COD.values()))
for t in ('ventas_detalle', 'ventas_adicional', 'registro_ventas'):
    w('delete from public.%s where id_venta like any (array[%s]);' % (t, ', '.join(q(c + '-V%') for c in COD.values())))
for t in ('compras_detalle', 'compras_adicional', 'registro_compras'):
    w('delete from public.%s where id_compra like any (array[%s]);' % (t, ', '.join(q(c + '-C%') for c in COD.values())))
w('delete from public.empresas_simulador where ruc in (%s);' % lr)
w('insert into public.empresas_simulador (cod_empresa, ruc, razon_social, nombre_comercial, tipo_sociedad, rubro, que_vende, mercado_clientes, ciiu, '
  'actividad_economica_sunat, regimen_tributario, regimen_laboral, condicion, estado_domicilio, fecha_inicio_actividades, direccion_fiscal, distrito, '
  'provincia, departamento, telefono, email, web, representante_legal, dni_representante, tipo_contabilidad, serie_factura, serie_boleta, '
  'serie_nota_credito, emisor_electronico, exportador, nro_trabajadores, banco_principal, cuenta_detracciones_bn, obligado_pdt_plame, '
  'libros_electronicos, sire_presentado_hasta, contador_nombre, contador_dni, contador_cpc, contador_correo, contador_celular) values')
w(',\n'.join(emp_rows) + ';')
w('insert into public.registro_ventas (id_venta, "Ruc", "Razon Social", "Periodo", "CAR SUNAT", "Fecha de emisión", "Fecha Vcto/Pago", "Tipo CP/Doc.", '
  '"Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Nro Final (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", "Apellidos Nombres/ Razón Social", '
  '"Valor Facturado Exportación", "BI Gravada", "Dscto BI", "IGV / IPM", "Dscto IGV / IPM", "Mto Exonerado", "Mto Inafecto", "ISC", "BI Grav IVAP", "IVAP", '
  '"ICBPER", "Otros Tributos", "Total CP", "Moneda", "Tipo Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", "Serie CP Modificado", '
  '"Nro CP Modificado", "Tipo de Nota", "Est. Comp", "Valor FOB Embarcado", "Valor OP Gratuitas", "Tipo Operación") values')
w(',\n'.join(rv) + ';')
w('insert into public.ventas_adicional (id_venta, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_cliente, detalle_de_la_operacion, descripcion, '
  'forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_a_detraccion, pct_detraccion, monto_detraccion, nro_constancia_deposito, anticipos, otros_cargos, '
  'monto_de_redondeo) values')
w(',\n'.join(va) + ';')
w('insert into public.ventas_detalle (id_venta, item_nro, codigo_sku, descripcion, unidad_medida, cantidad, valor_unitario, valor_de_venta_total, moneda) values')
w(',\n'.join(vd) + ';')
w('insert into public.ventas_cuotas (id_venta, nro_cuota, total_cuotas, fecha_de_vencimiento, monto_de_la_cuota, moneda) values')
w(',\n'.join(vc) + ';')
w('insert into public.registro_compras (id_compra, "RUC", "Apellidos y Nombres o Razón social", "Periodo", "CAR SUNAT", "Fecha de emisión", '
  '"Fecha Vcto/Pago", "Tipo CP/Doc.", "Serie del CDP", "Nro CP o Doc. Nro Inicial (Rango)", "Tipo Doc Identidad", "Nro Doc Identidad", '
  '"Apellidos Nombres/ Razón  Social", "BI Gravado DG", "IGV / IPM DG", "BI Gravado DGNG", "IGV / IPM DGNG", "BI Gravado DNG", "IGV / IPM DNG", '
  '"Valor Adq. NG", "ISC", "ICBPER", "Otros Trib/ Cargos", "Total CP", "Moneda", "Tipo de Cambio", "Fecha Emisión Doc Modificado", "Tipo CP Modificado", '
  '"Serie CP Modificado", "Nro CP Modificado", "Tipo de Nota", "IMB", "Est. Comp.", "Incal") values')
w(',\n'.join(rc) + ';')
w('insert into public.compras_adicional (id_compra, periodo, serie_del_cdp, nro_cp, comprobante, tipo_de_proveedor, detalle_de_la_operacion, descripcion, '
  'forma_de_pago, nro_cuotas, motivo_nota_de_credito, sujeto_detraccion_retencion, tipo_detraccion_retencion, pct_detraccion_retencion, '
  'monto_detraccion_retencion, nro_constancia_deposito, anticipos, otros_cargos, monto_de_redondeo) values')
w(',\n'.join(ca) + ';')
w('insert into public.compras_detalle (id_compra, item_nro, descripcion, cantidad, valor_unitario, valor_total, moneda) values')
w(',\n'.join(cd) + ';')
w('commit;')
dst = os.path.join(AQUI, '74_empresas_salon2.sql')
open(dst, 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
print('Escrito', dst, len('\n'.join(out)), 'caracteres;', len(rv), 'ventas,', len(rc), 'compras')

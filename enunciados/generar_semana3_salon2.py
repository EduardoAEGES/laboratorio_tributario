# -*- coding: utf-8 -*-
"""
Genera el enunciado navideño de Moodle "Semana 3 — Llenado de comprobantes de
pago" para el segundo salón (equipos Las Auditoras, Grupo 1 y Debe y Haber).
Mismo formato que Moodle_Comprobantes_Semana3.html (estilos en línea).

Todos los importes se calculan aquí: cantidades × precio, IGV 18 %, NC del 5 %
sobre V1 y totales de control. Así el enunciado siempre cuadra.

Uso:  python generar_semana3_salon2.py   -> Moodle_Comprobantes_Semana3_Salon2.html
"""
import os
from decimal import Decimal as D, ROUND_HALF_UP

def r2(x): return D(x).quantize(D('0.01'), rounding=ROUND_HALF_UP)
def m(x): return '{:,.2f}'.format(r2(x))
IGV = D('0.18')

# --------------------------------------------------------------------- estilos
F = "font-family: 'Segoe UI',Arial,Helvetica,sans-serif;"
TH = F + " font-size: 13.5px; background-color: #137547; color: #ffffff; padding: 7px 9px; border: 1px solid #0B5A33; text-align: %s;"
TD = F + " font-size: 13.5px; padding: 6px 9px; border: 1px solid #CFE3D6; color: #1a1a1a; vertical-align: top;%s background-color: %s;"
H3 = F + " font-size: 17px; color: #9e2a2b; background-color: #fdf3e7; border-left: 6px solid #C9A227; border-radius: 0 8px 8px 0; padding: 8px 12px; margin: 22px 0 10px 0;"
P = F + " font-size: 15px; line-height: 1.55; color: #1a1a1a; margin: 0 0 10px 0;"
UL = F + " font-size: 15px; line-height: 1.55; color: #1a1a1a; margin: 0 0 12px 0; padding-left: 22px;"
LI = "margin-bottom: 7px;"
STRONG = "color: #0b5a33;"

def h3(t): return '<h3 style="%s">%s</h3>\n' % (H3, t)

def tabla(cabeceras, filas, derecha=()):
    """cabeceras: lista de textos; derecha: índices de columnas numéricas."""
    h = '<table style="width: 100%; border-collapse: collapse; margin: 0 0 6px 0;">\n<thead><tr>'
    for i, c in enumerate(cabeceras):
        h += '<th style="%s">%s</th>' % (TH % ('right' if i in derecha else 'left'), c)
    h += '</tr></thead>\n<tbody>\n'
    for k, f in enumerate(filas):
        fondo = '#ffffff' if k % 2 == 0 else '#f4faf6'
        h += '<tr>'
        for i, c in enumerate(f):
            extra = ' text-align: right; white-space: nowrap;' if i in derecha else ''
            h += '<td style="%s">%s</td>' % (TD % (extra, fondo), c)
        h += '</tr>\n'
    return h + '</tbody>\n</table>\n'

def lista(items):
    return '<ul style="%s">\n' % UL + ''.join('<li style="%s">%s</li>\n' % (LI, i) for i in items) + '</ul>\n'

def b(t): return '<strong style="%s">%s</strong>' % (STRONG, t)

SEPARADOR = ('<div style="height: 9px; border-radius: 6px; margin: 16px 0; background: repeating-linear-gradient(45deg,#9E2A2B 0px,'
             '#9E2A2B 11px,#ffffff 11px,#ffffff 22px); border: 1px solid #E3C9C9;"> </div>\n')

# --------------------------------------------------------------------- terceros comunes
ENERGIA = ('Servicios Eléctricos Arequipa S.R.L.', '20100045672')
RH = [('CPC Ana María Quispe Flores', '10457821634', 'Asesoría contable del mes', D('2000'), True),
      ('Ing. Luis Alberto Torres Mamani', '10428765391', 'Diseño del catálogo digital de productos', D('1800'), False)]

# --------------------------------------------------------------------- equipos
EQUIPOS = [
    dict(
        ancla='eq-lasauditoras-zapatillas', equipo='Las Auditoras',
        empresa='Comercial CGM S.A.C.', ruc='20457182601', giro='zapatillas urbanas y deportivas',
        domicilio='Av. Ejército 1245, Yanahuara, Arequipa', gerente='Carol Rosio Pachao Auquilla',
        prov1=('Calzados Importados del Pacífico S.A.C.', '20451789632', 'Mercadería: zapatillas urbanas'),
        prov2=('Distribuidora Pisadas del Sur S.A.C.', '20508741263', 'Mercadería: zapatillas de running y de básquet'),
        transp=('Transportes Sur Express S.A.C.', '20334455661'),
        cli1=('Urban Shoes Store S.A.C.', '20604587123'), cli2=("Kelly's Shoes S.R.L.", '20601234561'),
        consumidor=('Juan Carlos Pérez Luna', '42318765'),
        catalogo=[('ZAP-001', 'Zapatilla urbana de cuero', 500, 680, 780),
                  ('ZAP-002', 'Zapatilla de running', 300, 400, 470),
                  ('ZAP-003', 'Zapatilla de básquet de caña baja', 275, 350, 425)],
        unidad=('par', 'pares'),
        c1=[('ZAP-001', 30)], c2=[('ZAP-002', 40), ('ZAP-003', 10)], c5=('ZAP-001', 2, 'con la suela despegada'),
        v1=[('ZAP-001', 25)], v2=[('ZAP-003', 2), ('ZAP-002', 1)], v3=[('ZAP-002', 30), ('ZAP-003', 5)],
        energia=D('480'), flete=D('650'), interes=D('300'),
        llegada='Av. Javier Prado Este 4200, Santiago de Surco, Lima', destino_flete='a Lima',
        observaciones=[
            'La razón social aparece de tres formas (CGM S.A.C., Comercial C.G.M S.A.C., CGM GOLBALS.A.C) y la portada dice Comercial Don Juan. Usen <b>Comercial CGM S.A.C.</b> en todos los documentos.',
            'El RUC 20454876231 es el de la empresa del ejemplo. Su RUC es <b>20457182601</b>.',
            'El inventario inicial dice «40 escritorios y 100 sillas»: es del ejemplo. Debe describir zapatillas.',
            'Vendían el modelo Forum Low en la boleta sin haberlo comprado ni tenerlo en inventario. Cada producto que se vende debe haberse comprado antes.',
            'Usen nombres de empresas ficticios: no pongan marcas reales (Adidas) como proveedor ni como cliente.',
        ]),
    dict(
        ancla='eq-grupo1-perfumes', equipo='Grupo 1',
        empresa='Comercial Esencias Arequipa E.I.R.L.', ruc='20459264133', giro='perfumes y sets de regalo',
        domicilio='Calle San Agustín 123, Cercado, Arequipa', gerente='Valeria Ginella Torres Carpio',
        prov1=('Fragancias Importadas del Perú S.A.C.', '20451789632', 'Mercadería: perfumes para dama'),
        prov2=('Aromas y Esencias Lima S.A.C.', '20508741263', 'Mercadería: perfumes para caballero y sets de regalo'),
        transp=('Transportes Sur Express S.A.C.', '20334455661'),
        cli1=('Boutique Perfumes Elegance S.A.C.', '20604587123'), cli2=('Tiendas Regalo Perfecto S.A.C.', '20601234561'),
        consumidor=('María Fernanda Rojas Chávez', '45872103'),
        catalogo=[('PER-001', 'Perfume para dama de 100 ml', 120, 170, 210),
                  ('PER-002', 'Perfume para caballero de 100 ml', 110, 155, 195),
                  ('PER-003', 'Set de regalo navideño (perfume y crema)', 90, 130, 165)],
        unidad=('unidad', 'unidades'),
        c1=[('PER-001', 80)], c2=[('PER-002', 60), ('PER-003', 40)], c5=('PER-001', 4, 'con el frasco roto'),
        v1=[('PER-001', 50), ('PER-003', 20)], v2=[('PER-001', 2), ('PER-003', 2)], v3=[('PER-002', 40), ('PER-003', 10)],
        energia=D('420'), flete=D('550'), interes=D('250'),
        llegada='Calle Mercaderes 212, Cercado, Arequipa', destino_flete='al cliente',
        observaciones=[
            'Su empresa vende perfumes, pero el Anexo 1 sigue con los escritorios y sillas del ejemplo. Todos los comprobantes deben ser de perfumes.',
            'La portada dice Comercial Don Juan E.I.R.L. y la ficha dice «Purificación García», que es una marca real y no lleva el tipo de empresa. Usen <b>Comercial Esencias Arequipa E.I.R.L.</b>',
            'El RUC 20454876231 es el de la empresa del ejemplo. Su RUC es <b>20459264133</b>.',
            'En C1 escribieron «80 escritorios a S/ 500» con una base de S/ 15,000: 80 × 500 son S/ 40,000. La base siempre es cantidad × valor unitario.',
            'El domicilio de la ficha (Calle San Agustín) no coincide con el punto de partida de la guía (Av. Ejército). Deben ser el mismo.',
        ]),
    dict(
        ancla='eq-debeyhaber-deportiva', equipo='Debe y Haber',
        empresa='Sport Active Perú S.A.C.', ruc='20461375821', giro='ropa deportiva para dama y varón',
        domicilio='Av. Ejército 1245, Yanahuara, Arequipa', gerente='Mayly Afrika Chacondori Chuquicaña',
        prov1=('Textiles Deportivos Andinos S.A.C.', '20451789632', 'Mercadería: shorts deportivos'),
        prov2=('Confecciones Gamarra Sport S.A.C.', '20508741263', 'Mercadería: casacas y leggings'),
        transp=('Transportes Sur Express S.A.C.', '20334455661'),
        cli1=('Tiendas Corre Libre S.A.C.', '20604587123'), cli2=('Win Ropa Deportiva S.A.C.', '20601234561'),
        consumidor=('Cinthia Alvarado Ramírez', '46213578'),
        catalogo=[('ROP-001', 'Short deportivo unisex', 35, 55, 69),
                  ('ROP-002', 'Casaca cortavientos', 85, 125, 159),
                  ('ROP-003', 'Leggings de tiro alto para dama', 40, 62, 79)],
        unidad=('unidad', 'unidades'),
        c1=[('ROP-001', 120)], c2=[('ROP-002', 60), ('ROP-003', 80)], c5=('ROP-001', 10, 'con la costura abierta'),
        v1=[('ROP-001', 80), ('ROP-002', 20)], v2=[('ROP-002', 3), ('ROP-003', 4)], v3=[('ROP-002', 30), ('ROP-003', 50)],
        energia=D('450'), flete=D('600'), interes=D('200'),
        llegada='Av. Javier Prado Este 4200, Santiago de Surco, Lima', destino_flete='a Lima',
        observaciones=[
            'Las bases no salen de las cantidades: «12 topcitos» por S/ 15,000 y «12 polos» por S/ 12,000 darían S/ 1,250 y S/ 1,000 por prenda. La base es cantidad × valor unitario del catálogo.',
            'El catálogo tenía un short de costo S/ 15 que se vendía a S/ 850 y usaba los códigos del ejemplo (ESC, SIL). Ahora cada prenda tiene su código y precios razonables.',
            'Las notas de crédito y de débito iban a clientes distintos del de la factura (NATHAN SPORTS, FITPOINT) y el 10 % se calculó sobre V3. La nota se emite al mismo cliente y sobre la factura que modifica.',
            'La nota de crédito recibida (C4) era de un proveedor distinto del de la factura E001-1250. Debe ser del mismo proveedor.',
            'La guía decía 200 unidades para otro cliente, pero la factura F001-00321 es de 52 unidades. Bienes, cantidades y destinatario deben ser los mismos de la factura.',
            'La suma del IGV de las ventas no cuadraba: con sus bases daba S/ 11,634.30 y no S/ 11,526.30. Calculen el IGV con fórmula.',
            'El RUC 20454876231 es el de la empresa del ejemplo. Su RUC es <b>20461375821</b>. Usen nombres de empresas ficticios, no marcas reales.',
        ]),
]

def producto(e, cod):
    return next(p for p in e['catalogo'] if p[0] == cod)

def detalle_items(e, items, col):           # col: 3 = mayor, 4 = menor, 2 = costo
    partes, base = [], D('0')
    for cod, cant in items:
        p = producto(e, cod)
        precio = D(p[col])
        base += cant * precio
        uni = e['unidad'][0] if cant == 1 else e['unidad'][1]
        partes.append('%d %s de %s (%s) a S/ %s' % (cant, uni, p[1].lower(), cod, m(precio)))
    txt = ' y '.join([', '.join(partes[:-1]), partes[-1]]) if len(partes) > 1 else partes[0]
    return txt, base

def bloque_equipo(e, mes='enero', anio=2026, mm='01'):
    f = lambda d: '%02d/%s' % (d, mm)
    h = ('<div id="%s" style="max-width: 960px; margin: 0 auto 26px auto; background-color: #fff9f0; border: 3px solid #0B5A33; border-radius: 16px; overflow: hidden;">\n'
         '<div style="background-color: #0b5a33; border-bottom: 5px solid #C9A227; padding: 16px 22px;">\n'
         '<p style="%s font-size: 23px; font-weight: bold; color: #ffffff; margin: 0 0 4px 0;">🎄 Equipo %s</p>\n'
         '<p style="%s font-size: 16px; color: #c9a227; margin: 0; font-weight: bold;">%s  ·  %s  ·  periodo de %s de %d</p>\n'
         '</div>\n<div style="padding: 16px 22px 20px 22px;">\n') % (e['ancla'], F, e['equipo'], F, e['empresa'], e['giro'], mes, anio)

    # Observaciones a la Evidencia 1
    h += ('<div style="background-color: #fff4e5; border: 2px solid #C9A227; border-radius: 10px; padding: 12px 16px; margin: 8px 0 6px 0;">\n'
          '<p style="%s font-size: 15.5px; font-weight: bold; color: #9e2a2b; margin: 0 0 6px 0;">🔍 Antes de llenar: lo que hay que corregir de su Evidencia 1</p>\n'
          % F) + lista(e['observaciones']) + '</div>\n'

    h += h3('Datos del emisor, para la cabecera de los comprobantes')
    h += tabla(['Dato', 'Detalle'], [['Razón social', e['empresa']], ['RUC', e['ruc']], ['Domicilio fiscal', e['domicilio']],
                                     ['Régimen tributario', 'Régimen General del Impuesto a la Renta'], ['Titular gerente', e['gerente']]])
    h += h3('Terceros que intervienen')
    h += tabla(['Nombre o razón social', 'RUC o DNI', 'Rol', 'Detalle'], [
        [e['prov1'][0], e['prov1'][1], 'Proveedor', e['prov1'][2]],
        [e['prov2'][0], e['prov2'][1], 'Proveedor', e['prov2'][2]],
        [ENERGIA[0], ENERGIA[1], 'Proveedor', 'Energía eléctrica'],
        [e['transp'][0], e['transp'][1], 'Proveedor', 'Flete de despacho'],
        [e['cli1'][0], e['cli1'][1], 'Cliente', 'Mayorista'],
        [e['cli2'][0], e['cli2'][1], 'Cliente', 'Mayorista'],
        [e['consumidor'][0], 'DNI ' + e['consumidor'][1], 'Cliente', 'Consumidor final'],
        [RH[0][0], RH[0][1], 'Prestador de servicios', RH[0][2]],
        [RH[1][0], RH[1][1], 'Prestador de servicios', RH[1][2]]])
    h += h3('Catálogo y precios, sin IGV')
    h += tabla(['Código', 'Producto', 'Costo unitario (S/)', 'Precio al por mayor (S/)', 'Precio al por menor (S/)'],
               [[p[0], p[1], m(p[2]), m(p[3]), m(p[4])] for p in e['catalogo']], derecha=(2, 3, 4))
    h += SEPARADOR

    # Compras
    t1, b1 = detalle_items(e, e['c1'], 2)
    t2, b2 = detalle_items(e, e['c2'], 2)
    cod5, cant5, falla = e['c5']
    p5 = producto(e, cod5); b5 = cant5 * D(p5[2])
    h += h3('🛒 Comprobantes de compra que debe llenar')
    h += tabla(['N.°', 'Fecha', 'Documento', 'Proveedor', 'Detalle que va en el comprobante', 'Condición de pago'], [
        ['C1', f(3), 'Factura E001-1250', '%s (RUC %s)' % e['prov1'][:2], t1 + '.', 'Crédito 30 días'],
        ['C2', f(5), 'Factura E001-0890', '%s (RUC %s)' % e['prov2'][:2], t2 + '.', 'Contado, transferencia'],
        ['C3', f(10), 'Factura E001-0045', '%s (RUC %s)' % ENERGIA, 'Energía eléctrica del local del mes: S/ %s más IGV.' % m(e['energia']), 'Contado, efectivo'],
        ['C4', f(20), 'Factura E001-2210', '%s (RUC %s)' % e['transp'], 'Flete por el despacho de la factura F001-00321 %s: S/ %s más IGV.' % (e['destino_flete'], m(e['flete'])), 'Contado, transferencia'],
        ['C5', f(15), 'Nota de crédito E001-0033', '%s (RUC %s)' % e['prov1'][:2],
         'Devolución de %d %s de %s (%s) %s, a S/ %s. Modifica la factura E001-1250. Motivo: Catálogo 09, código 07 — Devolución por ítem.'
         % (cant5, e['unidad'][1], p5[1].lower(), cod5, falla, m(p5[2])), 'Rebaja la deuda de la factura E001-1250']])

    # Ventas
    tv1, s1 = detalle_items(e, e['v1'], 3)
    tv2, s2 = detalle_items(e, e['v2'], 4)
    tv3, s3 = detalle_items(e, e['v3'], 3)
    s4 = r2(s1 * D('0.05'))
    s5 = e['interes']
    boleta_total = r2(s2 * (1 + IGV))
    h += h3('💰 Comprobantes de venta que debe emitir')
    h += tabla(['N.°', 'Fecha', 'Documento', 'Cliente', 'Detalle que va en el comprobante', 'Condición de pago'], [
        ['V1', f(8), 'Factura F001-00321', '%s (RUC %s)' % e['cli1'], tv1 + ', con guía T001-00120.', 'Crédito 30 días'],
        ['V2', f(12), 'Boleta de venta B001-00450', '%s (DNI %s)' % e['consumidor'], tv2 + '.', 'Contado, efectivo'],
        ['V3', f(18), 'Factura F001-00322', '%s (RUC %s)' % e['cli2'], tv3 + '.', 'Crédito 60 días'],
        ['V4', f(22), 'Nota de crédito F001-00015', '%s (RUC %s)' % e['cli1'],
         'Descuento por pronto pago del 5 % sobre la factura F001-00321. Modifica la factura F001-00321. Motivo: Catálogo 09, código 04 — Descuento global.',
         'Rebaja la cobranza de la factura F001-00321'],
        ['V5', f(26), 'Nota de débito F001-00008', '%s (RUC %s)' % e['cli2'],
         'Intereses por el financiamiento a 60 días de la factura F001-00322: S/ %s más IGV. Modifica la factura F001-00322. Motivo: Catálogo 10, código 02 — Aumento en el valor.' % m(s5),
         'Se cobra con la factura']])

    h += h3('🧾 Recibos por honorarios que debe recibir')
    h += tabla(['N.°', 'Fecha', 'Documento', 'Prestador', 'Servicio', 'Honorario bruto (S/)', 'Tratamiento'], [
        ['RH1', f(5), 'Recibo E001-125', '%s (RUC %s)' % RH[0][:2], RH[0][2], m(RH[0][3]), 'Retención del 8 % del importe del recibo'],
        ['RH2', f(20), 'Recibo E001-087', '%s (RUC %s)' % RH[1][:2], RH[1][2], m(RH[1][3]),
         'Sin retención: el prestador presenta la constancia de suspensión, Formulario Virtual 1609']], derecha=(5,))

    bienes = ' y '.join(['%d %s de %s (%s)' % (c, e['unidad'][1] if c > 1 else e['unidad'][0], producto(e, k)[1].lower(), k) for k, c in e['v1']])
    h += h3('🚚 Guía de remisión remitente que debe emitir')
    h += tabla(['Campo', 'Contenido'], [
        ['Serie y número', 'T001-00120'], ['Fecha de emisión e inicio del traslado', '08 de %s de %d' % (mes, anio)],
        ['Motivo del traslado', 'Venta (catálogo 20, código 01)'], ['Remitente', '%s, RUC %s' % (e['empresa'], e['ruc'])],
        ['Destinatario', '%s, RUC %s' % e['cli1']], ['Punto de partida', e['domicilio']], ['Punto de llegada', e['llegada']],
        ['Transportista', '%s, RUC %s' % e['transp']], ['Bienes trasladados', bienes], ['Documento relacionado', 'Factura F001-00321']])

    # Totales de control
    compras = [b1, b2, e['energia'], e['flete'], -b5]
    ventas = [s1, s2, s3, -s4, s5]
    cb = sum(compras); ci = sum(r2(x * IGV) for x in compras)
    vb = sum(ventas); vi = sum(r2(x * IGV) for x in ventas)
    ret = r2(RH[0][3] * D('0.08'))
    h += ('<div style="background-color: #eaf6ee; border: 2px solid #137547; border-radius: 10px; padding: 12px 16px; margin: 0 0 14px 0;">\n'
          '<p style="%s font-size: 15.5px; font-weight: bold; color: #0b5a33; margin: 0 0 8px 0;">✅ Para comprobar sus comprobantes</p>\n'
          '<p style="%s">Sumen sus trece documentos y comparen. Si un total no coincide, el error está en una cantidad, en un precio o en el cálculo del IGV. '
          'La boleta V2 cobra al público S/ %s (el IGV va incluido en el precio).</p>\n') % (F, P, m(boleta_total))
    h += tabla(['Concepto', 'Importe (S/)'], [
        ['Suma del valor de venta de las compras, neta de la nota de crédito', m(cb)],
        ['Suma del IGV de las compras', m(ci)],
        ['Suma del importe total de las compras', m(cb + ci)],
        ['Suma del valor de venta de las ventas, neta de la nota de crédito', m(vb)],
        ['Suma del IGV de las ventas', m(vi)],
        ['Suma del importe total de las ventas', m(vb + vi)],
        ['Retención de cuarta categoría del mes', m(ret)]], derecha=(1,))
    h += '</div>\n</div>\n</div>\n'

    # Inventario: todo lo vendido debe haberse comprado
    stock = {}
    for k, c in e['c1'] + e['c2']: stock[k] = stock.get(k, 0) + c
    stock[cod5] -= cant5
    for k, c in e['v1'] + e['v2'] + e['v3']: stock[k] = stock.get(k, 0) - c
    assert all(v >= 0 for v in stock.values()), (e['equipo'], stock)
    resumen = '%-14s compras BI %10s IGV %9s | ventas BI %10s IGV %9s | saldo %s' % (e['equipo'], m(cb), m(ci), m(vb), m(vi), stock)
    return h, resumen

# --------------------------------------------------------------------- documento
def generar():
    out = ['<meta charset="utf-8">\n<!-- Para Moodle: copie únicamente lo que está entre INICIO y FIN y péguelo en el editor de Moodle usando el botón de código fuente (<>). '
           'Todo el estilo va en línea, de modo que Moodle no lo elimina. --><!-- INICIO -->']
    out.append('<div style="max-width: 960px; margin: 0 auto 18px auto; background-color: #0b5a33; border: 3px solid #C9A227; border-radius: 16px; padding: 24px; text-align: center;">'
               '<p style="%s font-size: 13px; color: #dff3e6; margin: 0 0 6px 0; letter-spacing: 1px;">❄️ CERTUS  ·  Contabilidad y Tributación  ·  EFSRT Módulo 1  ·  Semestre 2026-II</p>'
               '<p style="%s font-size: 28px; font-weight: bold; color: #ffffff; margin: 0 0 6px 0;">🎄 Semana 3: llenado de comprobantes de pago</p>'
               '<p style="%s font-size: 16px; color: #c9a227; margin: 0;">Cada equipo llena los 12 comprobantes de su empresa y la guía de remisión</p></div>' % (F, F, F))
    out.append('<div style="max-width: 960px; margin: 0 auto 18px auto; background-color: #fff9f0; border: 3px solid #0B5A33; border-radius: 16px; padding: 18px 22px;">')
    out.append(h3('🎁 Qué tiene que hacer su equipo'))
    out.append('<p style="%s">Su empresa recibió y emitió trece documentos en el mes. El trabajo de esta semana es llenarlos completos, uno por hoja del archivo '
               'de cálculo, en el orden en que aparecen. Todavía no se registran en los libros: eso viene en la semana 5. Antes de empezar, lean el recuadro '
               '<b>🔍 Antes de llenar</b> de su equipo: ahí están las correcciones a su Evidencia 1.</p>' % P)
    out.append(lista([
        b('Doce comprobantes de pago.') + ' Cuatro facturas de compra, una nota de crédito recibida, dos facturas de venta, una boleta de venta, una nota de crédito emitida, una nota de débito emitida y dos recibos por honorarios.',
        b('Una guía de remisión remitente.') + ' Sustenta el traslado de la factura F001-00321. No es comprobante de pago y no se anota en el Registro de Ventas.',
        b('Los importes se calculan con fórmula.') + ' El valor de venta sale de multiplicar cantidad por precio unitario, el IGV sale del valor de venta y el importe total es la suma de los dos. No digiten los resultados.',
        b('Todo lo que se vende se compró antes.') + ' Revisen que cada producto vendido esté en sus compras y que no vendan más unidades de las que tienen.',
        b('Pueden practicar en el Simulador SUNAT.') + ' En TAXLAB 360 (Trámites y consultas → SEE - SOL) emitan factura, boleta, notas de crédito y de débito, guía de remisión y recibo por honorarios, y descarguen cada comprobante en PDF.']))
    out.append(h3('🧾 Datos mínimos que debe llevar cada documento'))
    out.append(tabla(['Documento', 'Datos que no pueden faltar'], [
        ['Factura', 'Serie y número correlativo; fecha de emisión; razón social, RUC y domicilio fiscal del emisor; razón social y RUC del adquirente; descripción, cantidad y valor unitario del bien o servicio; valor de venta; IGV del 18 %; importe total; importe total en letras; condición de pago.'],
        ['Boleta de venta', 'Serie y número correlativo; fecha; datos del emisor; descripción y cantidad; importe total. En la boleta el IGV no se discrimina: el precio al público ya lo incluye. Cuando el importe supera los S/ 700 es obligatorio consignar el nombre y el DNI del comprador.'],
        ['Nota de crédito', 'Los mismos datos del comprobante que modifica, más la serie y el número de ese comprobante, el motivo según el catálogo 09 de la SUNAT y el monto que se rebaja, con su IGV. Se emite al mismo cliente o la emite el mismo proveedor de la factura.'],
        ['Nota de débito', 'Los mismos datos del comprobante que modifica, más la serie y el número de ese comprobante, el motivo según el catálogo 10 de la SUNAT y el monto que se aumenta, con su IGV.'],
        ['Recibo por honorarios', 'Serie y número; fecha; nombre y RUC del prestador; razón social y RUC del usuario; descripción del servicio; honorario bruto; retención del 8 % cuando corresponde; monto neto a cobrar. No lleva IGV.'],
        ['Guía de remisión remitente', 'Serie y número; fecha de emisión e inicio del traslado; motivo del traslado; datos del remitente, del destinatario y del transportista; punto de partida y de llegada; descripción y cantidad de los bienes; documento relacionado. Se emite antes de que la mercadería salga del almacén.']]))
    out.append(h3('🔢 Códigos que deben usar'))
    out.append(tabla(['Concepto', 'Código', 'Cuándo se usa en este caso'], [
        ['Tipo de comprobante (catálogo 01)', '01 Factura', 'Las cuatro compras y las dos ventas con factura'],
        ['', '03 Boleta de venta', 'La venta al consumidor final'],
        ['', '07 Nota de crédito', 'La devolución al proveedor y el descuento al cliente'],
        ['', '08 Nota de débito', 'Los intereses cobrados al cliente'],
        ['', '02 Recibo por honorarios', 'Los dos servicios de cuarta categoría'],
        ['', '09 Guía de remisión remitente', 'El traslado de la factura F001-00321'],
        ['Motivo de la nota de crédito (catálogo 09)', '07 Devolución por ítem', 'Nota de crédito recibida del proveedor por la mercadería devuelta'],
        ['', '04 Descuento global', 'Nota de crédito emitida al cliente por el descuento de pronto pago'],
        ['Motivo de la nota de débito (catálogo 10)', '02 Aumento en el valor', 'Nota de débito emitida al cliente por los intereses del financiamiento'],
        ['Motivo del traslado (catálogo 20)', '01 Venta', 'Guía de remisión remitente T001-00120']]))
    out.append(h3('🧮 Reglas de cálculo'))
    out.append(lista([
        b('IGV.') + ' La tasa es 18 % del valor de venta. En las facturas se muestra por separado; en la boleta va incluido en el precio y, si hace falta separarlo, se divide el importe total entre 1.18.',
        b('Retención de cuarta categoría.') + ' Se retiene el 8 % cuando el recibo por honorarios supera los S/ 1,500 y quien paga es agente de retención. Si el prestador entrega la constancia de suspensión, Formulario Virtual 1609, no se retiene.',
        b('Notas de crédito y de débito.') + ' No son ventas nuevas. Cada una modifica un comprobante y debe citar su serie y su número. La de crédito rebaja la base y el IGV; la de débito los aumenta.',
        b('Guía de remisión.') + ' Los bienes y las cantidades de la guía deben coincidir exactamente con los de la factura que sustenta. Si no coinciden, el traslado queda sin sustento.',
        b('Precios del catálogo.') + ' Están sin IGV. El costo unitario se usa en las compras, el precio al por mayor en las ventas con factura a empresas y el precio al por menor en la venta con boleta.']))
    enlaces = '  ·  '.join('<a style="color: #9e2a2b; font-weight: bold; text-decoration: none;" href="#%s">%s</a>' % (e['ancla'], e['equipo']) for e in EQUIPOS)
    out.append('<div style="background-color: #fdecec; border: 2px solid #9E2A2B; border-radius: 10px; padding: 12px 16px; margin: 0 0 14px 0;">'
               '<p style="%s font-size: 15.5px; font-weight: bold; color: #9e2a2b; margin: 0 0 8px 0;">⭐ Busque aquí los datos de su equipo</p>'
               '<p style="%s margin-bottom: 0;">%s</p></div>' % (F, P, enlaces))
    out.append('</div>')
    resumenes = []
    for e in EQUIPOS:
        h, r = bloque_equipo(e)
        out.append(h); resumenes.append(r)
    out.append('<div style="max-width: 960px; margin: 0 auto; background-color: #0b5a33; border: 3px solid #C9A227; border-radius: 16px; padding: 18px 22px;">'
               '<p style="%s font-size: 16px; color: #ffffff; margin: 0 0 8px 0; font-weight: bold;">🎁 Cómo se entrega</p>'
               '<p style="%s font-size: 15px; line-height: 1.55; color: #dff3e6; margin: 0 0 8px 0;">Un solo archivo de cálculo por equipo, con una hoja por documento y en el orden '
               'en que se piden, nombrado con el nombre del equipo. Los importes deben estar calculados con fórmula. Se revisa en pares en clase antes de subirlo al Campus Digital.</p>'
               '<p style="%s font-size: 14px; color: #c9a227; margin: 0; text-align: center;">⭐ Felices fiestas y buen llenado. Docente: Eduardo Mamani Roque 🎄</p></div>' % (F, F, F))
    out.append('<!-- FIN -->')
    return '\n'.join(out), resumenes

if __name__ == '__main__':
    html, res = generar()
    destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Moodle_Comprobantes_Semana3_Salon2.html')
    open(destino, 'w', encoding='utf-8').write(html)
    print('\n'.join(res)); print('Escrito', destino, len(html), 'caracteres')

/* ============================================================================
 * TAXLAB 360 - Emisión de GRE Remitente: pasos 3 a 6, vista previa y emisión
 * ----------------------------------------------------------------------------
 * Sigue el procedimiento del portal SOL de SUNAT:
 *   1. Datos de emisión            (tramites.html)
 *   2. Actores - destinatario      (tramites.html)
 *   3. Documentos relacionados     (aviso SPOT / IVAP)
 *   4. Bienes a transportar        (bien normalizado, unidad, cantidad, peso bruto)
 *   5. Punto de partida y llegada  (establecimiento, tercero inscrito u otra dirección)
 *   6. Datos de transporte         (privado: vehículos y conductores / público: transportista)
 *   Vista previa -> Emitir GRE -> descargar PDF, imprimir o enviar por correo
 *
 * Cargar DESPUÉS del script principal de tramites.html (usa greDestinatarios,
 * supabaseClient, almacenFacturas, currentEmisorData y mostrarToastExito).
 * ==========================================================================*/
(function () {
  'use strict';

  var SERIE_GRE = 'EG07';   // serie de la GRE Remitente emitida desde SEE - SOL

  // ------------------------------------------------------------- catálogos
  var UNIDADES = [
    ['NIU', 'NIU - UNIDAD (BIENES)'], ['BX', 'BX - CAJA'], ['BO', 'BO - BOTELLAS'],
    ['BG', 'BG - BOLSA'], ['PK', 'PK - PAQUETE'], ['SA', 'SA - SACO'], ['DZN', 'DZN - DOCENA'],
    ['KGM', 'KGM - KILOGRAMO'], ['TNE', 'TNE - TONELADAS'], ['LTR', 'LTR - LITRO'],
    ['GLL', 'GLL - GALON'], ['MTR', 'MTR - METRO'], ['MTK', 'MTK - METRO CUADRADO'],
    ['MTQ', 'MTQ - METRO CUBICO'], ['CEN', 'CEN - CIENTO DE UNIDADES'], ['MLL', 'MLL - MILLARES']
  ];

  // Bienes normalizados (afectos al SPOT o al IVAP). Códigos referenciales del simulador.
  var BIENES_NORMALIZADOS = [
    ['1701130000', 'Azúcar de caña', '50161509'],
    ['1701140000', 'Los demás azúcares de caña', '50161509'],
    ['1701910000', 'Con adición de aromatizante o colorante', '50161509'],
    ['1701999000', 'Los demás', '50161509'],
    ['1703100000', 'Melaza de caña', '50161509'],
    ['2208901000', 'Alcohol etílico sin desnaturalizar', '12352104'],
    ['2207100000', 'Alcohol etílico sin desnaturalizar con grado alcohólico >= 80% vol', '12352104'],
    ['1006200000', 'Arroz descascarillado (arroz cargo o arroz pardo)', '50221101'],
    ['1006300000', 'Arroz semiblanqueado o blanqueado, incluso pulido o glaseado', '50221101'],
    ['1006400000', 'Arroz partido', '50221101']
  ];

  var TIPOS_DOC_REL = [
    ['01', 'Factura'], ['03', 'Boleta de Venta'], ['09', 'Guía de Remisión Remitente'],
    ['12', 'Ticket o cinta emitido por máquina registradora'],
    ['IVAP', 'Constancia de Depósito - IVAP (Ley 28211)'],
    ['DET', 'Constancia de Depósito - Detracción'],
    ['OTR', 'Otros']
  ];

  var ENTIDADES_AUT = [
    'MTC - Ministerio de Transportes y Comunicaciones',
    'SUCAMEC - Superintendencia Nacional de Control de Servicios de Seguridad, Armas, Municiones y Explosivos',
    'DIGESA - Dirección General de Salud Ambiental',
    'SENASA - Servicio Nacional de Sanidad Agraria',
    'SERFOR - Servicio Nacional Forestal y de Fauna Silvestre',
    'DIGEMID - Dirección General de Medicamentos, Insumos y Drogas',
    'PRODUCE - Ministerio de la Producción',
    'SANIPES - Organismo Nacional de Sanidad Pesquera',
    'OSINERGMIN - Registro de Hidrocarburos'
  ];

  var TIPOS_DOC_ID = [
    ['1', 'DOCUMENTO NACIONAL DE IDENTIDAD'], ['4', 'CARNET DE EXTRANJERÍA'],
    ['7', 'PASAPORTE'], ['P', 'PERMISO TEMPORAL DE PERMANENCIA - PTP']
  ];

  // ---------------------------------------------------------------- estado
  var S;
  function estadoInicial() {
    return {
      destinatario: null, docs: [], bienes: [], unidadPeso: '', pesoBruto: '',
      partida: null, llegada: null,
      modalidad: '', transbordo: false, m1l: false, placaM1L: '',
      autorizaciones: [], vehiculos: [], conductores: [], transportista: null, regVehTransp: false,
      fechaTraslado: '', retornoEnvases: false, retornoVacio: false,
      observaciones: '', avisoSpot: false, emitida: null
    };
  }
  S = estadoInicial();

  // --------------------------------------------------------------- helpers
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fechaPE(iso) {
    if (!iso) return '-';
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function almacen() {
    if (typeof almacenFacturas === 'function') return almacenFacturas();
    try { localStorage.setItem('taxlab_prueba', '1'); localStorage.removeItem('taxlab_prueba'); return localStorage; }
    catch (e) { return sessionStorage; }
  }
  function cliente() { return (typeof supabaseClient !== 'undefined' && supabaseClient) || window.authSupabaseClient || null; }
  function toast(t, d) {
    if (typeof mostrarToastExito === 'function') mostrarToastExito(t, d); else alert(t + '\n' + (d || ''));
  }
  function emisor() {
    var e = window.currentEmisorData || {};
    return {
      ruc: e.ruc || ($('gre-ruc-display') || {}).textContent || '20123456789',
      razon_social: e.razon_social || ($('gre-denominacion-display') || {}).textContent || 'EMPRESA DEMO S.A.C.',
      direccion: e.direccion || ''
    };
  }
  function motivo() { return ($('gre-motivo-traslado') || {}).value || ''; }

  // Activa / desactiva un botón con el estilo de SUNAT (celeste o gris)
  function boton(btn, activo) {
    if (!btn) return;
    btn.disabled = !activo;
    btn.style.background = activo ? '#00aeef' : '#fff';
    btn.style.color = activo ? '#fff' : '#999';
    btn.style.border = activo ? '1px solid #00aeef' : '1px solid #ccc';
    btn.style.cursor = activo ? 'pointer' : 'default';
  }

  // Frecuentes por empresa (destinatario, bien, vehículo, conductor, transportista, punto)
  function frecuentes(tipo) {
    try { return JSON.parse(almacen().getItem('taxlab_gre_frec_' + emisor().ruc + '_' + tipo) || '[]'); }
    catch (e) { return []; }
  }
  function guardarFrecuente(tipo, obj, clave) {
    var lista = frecuentes(tipo).filter(function (x) { return x[clave] !== obj[clave]; });
    lista.unshift(obj);
    try { almacen().setItem('taxlab_gre_frec_' + emisor().ruc + '_' + tipo, JSON.stringify(lista.slice(0, 30))); } catch (e) {}
  }

  // Busca una empresa por RUC: primero las 10 del simulador, luego la tabla empresas
  async function buscarEmpresa(ruc) {
    var c = cliente(); if (!c || !/^\d{11}$/.test(ruc)) return null;
    try {
      var r = await c.from('empresas_simulador')
        .select('ruc, razon_social, direccion_fiscal, distrito, provincia, departamento').eq('ruc', ruc).maybeSingle();
      if (r.data) return { ruc: ruc, razon_social: r.data.razon_social, direccion: r.data.direccion_fiscal,
                           distrito: r.data.distrito, provincia: r.data.provincia, departamento: r.data.departamento };
      r = await c.from('empresas')
        .select('ruc, razon_social, direccion_legal, distrito_ciudad, provincia, departamento').eq('ruc', ruc).maybeSingle();
      if (r.data) return { ruc: ruc, razon_social: r.data.razon_social, direccion: r.data.direccion_legal,
                           distrito: r.data.distrito_ciudad, provincia: r.data.provincia, departamento: r.data.departamento };
    } catch (e) { console.warn('[GRE] no se pudo consultar el RUC', e); }
    // Resto: la misma búsqueda de Factura SEE - SOL (RUCs de prueba y consulta a SUNAT)
    if (typeof resolverRuc === 'function') {
      var info = await resolverRuc(ruc);
      if (info.ok) return { ruc: ruc, razon_social: info.razon_social,
                            direccion: (info.direccion_legal && info.direccion_legal !== '-') ? info.direccion_legal : '' };
    }
    return null;
  }

  async function buscarPersona(dni) {
    var c = cliente(); if (!c || !/^\d{8}$/.test(dni)) return null;
    try {
      var r = await c.from('personas').select('dni, nombres').eq('dni', dni).maybeSingle();
      return r.data || null;
    } catch (e) { return null; }
  }

  // ----------------------------------------------------------------- ubigeo
  var cacheUbigeo = {};
  async function ubigeoHijos(padre) {
    var k = padre || 'raiz';
    if (cacheUbigeo[k]) return cacheUbigeo[k];
    var c = cliente(); if (!c) return [];
    var q = c.from('ubigeo').select('codigo, nombre').order('nombre');
    q = padre ? q.eq('padre', padre) : q.eq('nivel', 1);
    var r = await q;
    cacheUbigeo[k] = r.data || [];
    return cacheUbigeo[k];
  }
  function sinTildes(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim(); }
  // Ubigeo de 6 dígitos a partir de los nombres (para el domicilio fiscal)
  async function ubigeoDe(dep, prov, dist) {
    try {
      var d = (await ubigeoHijos(null)).find(function (x) { return sinTildes(x.nombre) === sinTildes(dep); });
      if (!d) return '';
      var p = (await ubigeoHijos(d.codigo)).find(function (x) { return sinTildes(x.nombre) === sinTildes(prov); });
      if (!p) return '';
      var lista = await ubigeoHijos(p.codigo);
      var t = lista.find(function (x) { return sinTildes(x.nombre) === sinTildes(dist); }) ||
              (/CERCADO/.test(sinTildes(dist)) ? lista.find(function (x) { return sinTildes(x.nombre) === sinTildes(prov); }) : null);
      return t ? t.codigo : '';
    } catch (e) { return ''; }
  }
  function textoDireccion(p) {
    return [p.direccion, [p.distrito, p.provincia, p.departamento].filter(Boolean).join(' - ')]
      .filter(Boolean).join(' - ').toUpperCase();
  }

  // ------------------------------------------------------------ plantillas
  var ESTILO_INPUT = 'width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:13px;' +
                     'font-family:Roboto,sans-serif;box-sizing:border-box;background:#fff;';
  var ESTILO_LABEL = 'font-size:13px;font-weight:500;color:#333;display:block;margin-bottom:6px;';
  var ESTILO_BTN_AZUL = 'padding:10px 30px;background:#00aeef;color:#fff;border:none;border-radius:4px;font-size:14px;' +
                        'cursor:pointer;font-family:Roboto,sans-serif;display:inline-flex;align-items:center;gap:6px;';
  var ESTILO_LINK = 'color:#006699;font-size:13px;text-decoration:none;cursor:pointer;margin-left:20px;';
  var ESTILO_TH = 'text-align:left;font-size:12px;color:#333;font-weight:700;padding:8px 6px;border-bottom:2px solid #ddd;';
  var ESTILO_TD = 'font-size:12px;color:#333;padding:8px 6px;border-bottom:1px solid #eee;vertical-align:top;';

  function barra(n) {
    var h = '<div style="display:flex;gap:4px;margin-bottom:25px;">';
    for (var i = 1; i <= 6; i++) {
      h += '<div style="flex:1;height:4px;background:' + (i <= n ? '#006699' : '#ccc') + ';border-radius:2px;"></div>';
    }
    return h + '</div>';
  }
  function cabecera(n, titulo, ayuda) {
    return barra(n) +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
      '<h3 style="color:#006699;font-size:15px;font-weight:400;margin:0;">' + titulo + '</h3>' +
      '<a href="#" onclick="GRE.ayuda(\'' + ayuda + '\');return false;" style="color:#c0392b;text-decoration:none;font-size:13px;">' +
      '<i class="fas fa-question-circle"></i> Ayuda</a></div>' +
      '<p class="gre-motivo-lbl" style="color:#006699;font-size:13px;margin:0 0 25px 0;">Motivo: -</p>';
  }
  function pie(n, idSig, textoSig) {
    return '<div style="display:flex;justify-content:flex-end;gap:15px;margin-top:30px;">' +
      '<button type="button" onclick="GRE.ir(' + (n - 1) + ')" style="padding:10px 40px;background:#00aeef;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer;">Volver</button>' +
      '<button type="button" id="' + idSig + '" onclick="GRE.siguiente(' + n + ')" style="padding:10px 40px;border:1px solid #ccc;background:#fff;color:#999;font-size:14px;border-radius:4px;">' + (textoSig || 'Siguiente') + '</button></div>';
  }
  function paso(n, interior) {
    return '<div class="factura-form-container" id="gre-step-' + n + '" style="display:none;"><div style="padding:20px 30px;">' + interior + '</div></div>';
  }
  function opciones(lista, conVacio) {
    return (conVacio ? '<option value="">Seleccione</option>' : '') + lista.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '">' + esc(t) + '</option>';
    }).join('');
  }

  function modal(id, titulo, cuerpo, ancho) {
    var m = document.createElement('div');
    m.id = id;
    m.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;align-items:center;' +
                      'justify-content:center;font-family:Roboto,sans-serif;';
    m.innerHTML =
      '<div style="background:#fff;width:94%;max-width:' + (ancho || 600) + 'px;max-height:92vh;overflow:auto;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
      '<div style="background:#006699;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;">' +
      '<span style="font-size:15px;font-weight:500;" class="gre-modal-titulo">' + titulo + '</span>' +
      '<button type="button" onclick="GRE.cerrar(\'' + id + '\')" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&times;</button></div>' +
      '<div style="padding:22px 20px;">' + cuerpo + '</div></div>';
    document.body.appendChild(m);
    return m;
  }
  function abrir(id) { $(id).style.display = 'flex'; }
  function cerrar(id) { $(id).style.display = 'none'; }
  function campo(label, control, flex) {
    return '<div style="flex:' + (flex || 1) + ';min-width:200px;"><label style="' + ESTILO_LABEL + '">' + label + '</label>' + control + '</div>';
  }
  function fila(html) { return '<div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap;">' + html + '</div>'; }
  function error(id) { return '<span id="' + id + '" style="font-size:11px;color:#c0392b;margin-top:3px;display:none;"></span>'; }
  function mostrarError(id, texto) { var e = $(id); if (!e) return; e.textContent = texto || ''; e.style.display = texto ? 'block' : 'none'; }

  // ============================================================ PASO 3
  var HTML_PASO3 = cabecera(3, '3. Documentos Relacionados', 'docs') +
    '<p style="font-size:13px;color:#555;margin:0 0 15px;">Agrega el comprobante de pago que sustenta el traslado (opcional). ' +
    'Si trasladas bienes afectos al SPOT o al IVAP, agrega aquí la constancia de depósito.</p>' +
    '<div id="gre-docs-lista" style="margin-bottom:20px;"></div>' +
    '<button type="button" onclick="GRE.abrirDoc()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    pie(3, 'gre-step3-sig');

  var HTML_MODAL_DOC =
    fila(campo('Tipo de documento relacionado', '<select id="gre-doc-tipo" onchange="GRE.docTipo()" style="' + ESTILO_INPUT + '">' + opciones(TIPOS_DOC_REL, true) + '</select>') +
         campo('Número de RUC del emisor', '<input id="gre-doc-ruc" maxlength="11" style="' + ESTILO_INPUT + '">')) +
    fila('<div id="gre-doc-serie-box" style="flex:1;min-width:200px;">' +
           '<label style="' + ESTILO_LABEL + '">Serie de documento</label>' +
           '<input id="gre-doc-serie" maxlength="4" placeholder="F001" oninput="this.value=this.value.toUpperCase()" style="' + ESTILO_INPUT + '"></div>' +
         campo('<span id="gre-doc-num-lbl">Número de documento</span>', '<input id="gre-doc-num" maxlength="10" style="' + ESTILO_INPUT + '">')) +
    error('gre-doc-err') +
    '<div style="display:flex;justify-content:flex-end;margin-top:10px;"><button type="button" onclick="GRE.agregarDoc()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  var HTML_MODAL_SPOT =
    '<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">Le recordamos que si va a trasladar bienes afectos al ' +
    '<b>SPOT</b> o al <b>IVAP</b> se debe consignar los números de las Constancias de Depósito respectivas en esta sección.</p>' +
    '<div style="text-align:right;"><button type="button" onclick="GRE.cerrar(\'gre-modal-spot\')" style="' + ESTILO_BTN_AZUL + '">Entendido</button></div>';

  function renderDocs() {
    var c = $('gre-docs-lista');
    if (!S.docs.length) {
      c.innerHTML = '<p style="font-size:13px;color:#999;margin:0;">No hay documentos relacionados.</p>';
    } else {
      c.innerHTML = '<table style="width:100%;border-collapse:collapse;"><tr>' +
        ['Tipo de documento', 'Serie', 'Número', 'RUC del emisor', ''].map(function (t) { return '<th style="' + ESTILO_TH + '">' + t + '</th>'; }).join('') +
        '</tr>' + S.docs.map(function (d, i) {
          return '<tr><td style="' + ESTILO_TD + '">' + esc(d.tipoTxt) + '</td><td style="' + ESTILO_TD + '">' + esc(d.serie || '-') +
            '</td><td style="' + ESTILO_TD + '">' + esc(d.numero) + '</td><td style="' + ESTILO_TD + '">' + esc(d.ruc) + '</td>' +
            '<td style="' + ESTILO_TD + 'white-space:nowrap;text-align:right;">' +
            (d.serie ? '<a href="#" onclick="GRE.verDoc(' + i + ');return false;" style="color:#006699;margin-right:14px;"><i class="fas fa-eye"></i> Visualizar</a>' : '') +
            '<a href="#" onclick="GRE.quitar(\'docs\',' + i + ');return false;" style="color:#c0392b;"><i class="fas fa-times"></i></a></td></tr>';
        }).join('') + '</table>';
    }
    boton($('gre-step3-sig'), true);   // los documentos relacionados son opcionales
  }

  function docTipo() {
    var t = $('gre-doc-tipo').value, ruc = $('gre-doc-ruc');
    var constancia = (t === 'IVAP' || t === 'DET');
    $('gre-doc-serie-box').style.display = constancia ? 'none' : '';
    $('gre-doc-num-lbl').textContent = constancia ? 'Número de constancia' : 'Número de documento';
    // El comprobante de una venta lo emite el propio remitente
    ruc.value = (t && t !== 'OTR') ? emisor().ruc : '';
    ruc.readOnly = !!t && t !== 'OTR';
    ruc.style.background = ruc.readOnly ? '#f5f5f5' : '#fff';
  }

  function agregarDoc() {
    var t = $('gre-doc-tipo').value, ruc = $('gre-doc-ruc').value.trim();
    var serie = $('gre-doc-serie').value.trim().toUpperCase(), num = $('gre-doc-num').value.trim();
    var constancia = (t === 'IVAP' || t === 'DET');
    if (!t) return mostrarError('gre-doc-err', 'Seleccione el tipo de documento relacionado.');
    if (!/^\d{11}$/.test(ruc)) return mostrarError('gre-doc-err', 'El RUC del emisor debe tener 11 dígitos.');
    if (!constancia && !/^[A-Z0-9]{4}$/.test(serie)) return mostrarError('gre-doc-err', 'La serie debe tener 4 caracteres (ejemplo: F001, B001, EG07).');
    if (t === '01' && serie[0] !== 'F' && serie[0] !== 'E') return mostrarError('gre-doc-err', 'La serie de una factura empieza con F (electrónica) o E (emitida desde SEE-SOL).');
    if (t === '03' && serie[0] !== 'B' && serie[0] !== 'E') return mostrarError('gre-doc-err', 'La serie de una boleta empieza con B (electrónica) o E (emitida desde SEE-SOL).');
    if (!/^\d{1,10}$/.test(num)) return mostrarError('gre-doc-err', 'Ingrese solo números en el número de documento.');
    if (S.docs.some(function (d) { return d.tipo === t && d.serie === serie && +d.numero === +num; })) {
      return mostrarError('gre-doc-err', 'Ese documento ya fue agregado.');
    }
    var txt = TIPOS_DOC_REL.find(function (x) { return x[0] === t; })[1];
    S.docs.push({ tipo: t, tipoTxt: txt, ruc: ruc, serie: constancia ? '' : serie, numero: constancia ? num : String(+num).padStart(8, '0') });
    cerrar('gre-modal-doc');
    renderDocs();
  }

  // Busca el comprobante entre las facturas que el alumno emitió en SEE - SOL
  function verDoc(i) {
    var d = S.docs[i], lista = [];
    try { lista = JSON.parse(almacen().getItem('taxlab_facturas') || sessionStorage.getItem('taxlab_facturas') || '[]'); } catch (e) {}
    var f = lista.find(function (x) {
      var p = String(x.comprobante || '').split('-');
      return String(x.emisor_ruc) === String(d.ruc) && p[0] === d.serie && +p[1] === +d.numero;
    });
    var cuerpo = f
      ? '<table style="width:100%;font-size:13px;line-height:2;">' +
        '<tr><td><b>Comprobante</b></td><td>' + esc(f.comprobante) + '</td></tr>' +
        '<tr><td><b>Fecha de emisión</b></td><td>' + esc(f.fecha || '-') + '</td></tr>' +
        '<tr><td><b>Emisor</b></td><td>' + esc(f.emisor) + ' (RUC ' + esc(f.emisor_ruc) + ')</td></tr>' +
        '<tr><td><b>Adquiriente</b></td><td>' + esc(f.receptor) + ' (RUC ' + esc(f.receptor_ruc) + ')</td></tr>' +
        '<tr><td><b>Importe total</b></td><td>' + esc(f.total) + '</td></tr></table>' +
        '<p style="font-size:12px;color:#27ae60;margin:12px 0 0;"><i class="fas fa-check-circle"></i> Documento verificado: corresponde a un comprobante emitido en el simulador.</p>'
      : '<p style="font-size:13px;color:#b45309;line-height:1.6;margin:0;"><i class="fas fa-exclamation-triangle"></i> No se encontró ' +
        esc(d.tipoTxt) + ' ' + esc(d.serie + '-' + d.numero) + ' entre los comprobantes emitidos en SEE - SOL con este RUC.<br>' +
        'Revisa la serie y el número, o emite primero el comprobante en <b>Factura Electrónica</b>.</p>';
    $('gre-modal-ver').querySelector('.gre-ver-cuerpo').innerHTML = cuerpo;
    abrir('gre-modal-ver');
  }

  // ============================================================ PASO 4
  var HTML_PASO4 = cabecera(4, '4. Bienes a transportar', 'bienes') +
    '<h4 style="font-size:14px;color:#333;margin:0 0 10px;">Detalle de bienes</h4>' +
    '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:760px;"><thead><tr>' +
    ['#', 'Bien normalizado', 'Código bien', 'Cod. prod. SUNAT', 'Cod. subpar. nacional', 'Cod. GTIN', 'Descripción detallada', 'Unid. medida', 'Cantidad', '']
      .map(function (t) { return '<th style="' + ESTILO_TH + '">' + t + '</th>'; }).join('') +
    '</tr></thead><tbody id="gre-bienes-tbody"></tbody></table></div>' +
    '<div style="margin:20px 0 30px;"><button type="button" onclick="GRE.abrirBien()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'bien\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Bienes Frecuentes</a></div>' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 12px;">Datos generales de la carga</h4>' +
    fila(campo('Unidad de medida de peso bruto', '<select id="gre-peso-um" onchange="GRE.validar4()" style="' + ESTILO_INPUT + '">' +
               opciones([['KGM', 'KGM - KILOGRAMOS'], ['TNE', 'TNE - TONELADAS']], true) + '</select>') +
         campo('Peso bruto total de la carga', '<input id="gre-peso" type="number" min="0" step="0.001" placeholder="Escriba" oninput="GRE.validar4()" style="' + ESTILO_INPUT + '">')) +
    pie(4, 'gre-step4-sig');

  var HTML_MODAL_BIEN =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-bien-norm" onchange="GRE.bienNorm()"> Bien normalizado</label>' +
    '<span style="font-size:13px;color:#c0392b;">Visualice <a href="#" onclick="GRE.abrir(\'gre-modal-lista\');return false;" style="color:#c0392b;font-weight:700;">la lista de bienes</a></span></div>' +
    fila(campo('Código del bien', '<input id="gre-bien-cod" maxlength="30" style="' + ESTILO_INPUT + '">') +
         campo('Código de subpartida nacional', '<select id="gre-bien-subp" disabled onchange="GRE.bienSubp()" style="' + ESTILO_INPUT + 'background:#f5f5f5;">' +
               opciones(BIENES_NORMALIZADOS.map(function (b) { return [b[0], b[0] + ' - ' + b[1]]; }), true) + '</select>')) +
    fila(campo('Código de producto SUNAT', '<input id="gre-bien-sunat" maxlength="8" style="' + ESTILO_INPUT + '">') +
         campo('Código GTIN', '<input id="gre-bien-gtin" maxlength="14" style="' + ESTILO_INPUT + '">')) +
    '<div style="margin-bottom:16px;">' + campo('Descripción detallada del bien', '<textarea id="gre-bien-desc" rows="3" maxlength="500" style="' + ESTILO_INPUT + 'resize:vertical;"></textarea>') + '</div>' +
    fila(campo('Unidad de medida del bien', '<select id="gre-bien-um" style="' + ESTILO_INPUT + '">' + opciones(UNIDADES, true) + '</select>') +
         campo('Cantidad', '<input id="gre-bien-cant" type="number" min="0" step="0.01" style="' + ESTILO_INPUT + '">')) +
    error('gre-bien-err') +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-bien-frec"> Guardar como bien frecuente</label>' +
    '<button type="button" onclick="GRE.agregarBien()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  var HTML_MODAL_LISTA =
    '<p style="font-size:13px;color:#555;margin:0 0 12px;">Bienes normalizados afectos al SPOT o al IVAP: azúcares y endulzantes, granos, alcoholes y sus sustitutos.</p>' +
    '<table style="width:100%;border-collapse:collapse;"><tr><th style="' + ESTILO_TH + '">Subpartida nacional</th><th style="' + ESTILO_TH +
    '">Descripción</th><th style="' + ESTILO_TH + '">Cod. producto SUNAT</th></tr>' +
    BIENES_NORMALIZADOS.map(function (b) {
      return '<tr><td style="' + ESTILO_TD + '">' + b[0] + '</td><td style="' + ESTILO_TD + '">' + esc(b[1]) + '</td><td style="' + ESTILO_TD + '">' + b[2] + '</td></tr>';
    }).join('') + '</table>';

  var bienEditando = -1;

  function renderBienes() {
    var tb = $('gre-bienes-tbody');
    if (!S.bienes.length) {
      tb.innerHTML = '<tr><td colspan="10" style="' + ESTILO_TD + 'text-align:center;color:#777;">No hay registros disponibles</td></tr>';
    } else {
      tb.innerHTML = S.bienes.map(function (b, i) {
        return '<tr>' + [i + 1, b.normalizado ? 'SI' : 'NO', b.codigo || '-', b.codSunat || '-', b.subpartida || '-', b.gtin || '-',
                         b.descripcion, b.unidad, b.cantidad].map(function (v) { return '<td style="' + ESTILO_TD + '">' + esc(v) + '</td>'; }).join('') +
          '<td style="' + ESTILO_TD + 'white-space:nowrap;"><a href="#" onclick="GRE.abrirBien(' + i + ');return false;" style="color:#006699;margin-right:12px;" title="Editar"><i class="fas fa-pen"></i></a>' +
          '<a href="#" onclick="GRE.quitar(\'bienes\',' + i + ');return false;" style="color:#c0392b;" title="Eliminar"><i class="fas fa-times"></i></a></td></tr>';
      }).join('');
    }
    validar4();
  }

  function validar4() {
    var um = $('gre-peso-um').value, peso = parseFloat($('gre-peso').value);
    S.unidadPeso = um; S.pesoBruto = $('gre-peso').value;
    boton($('gre-step4-sig'), S.bienes.length > 0 && !!um && peso > 0);
  }

  function abrirBien(i) {
    bienEditando = (typeof i === 'number') ? i : -1;
    var b = bienEditando >= 0 ? S.bienes[bienEditando] : {};
    $('gre-bien-norm').checked = !!b.normalizado;
    $('gre-bien-cod').value = b.codigo || '';
    $('gre-bien-subp').value = b.subpartida || '';
    $('gre-bien-sunat').value = b.codSunat || '';
    $('gre-bien-gtin').value = b.gtin || '';
    $('gre-bien-desc').value = b.descripcion || '';
    $('gre-bien-um').value = b.unidad || '';
    $('gre-bien-cant').value = b.cantidad || '';
    $('gre-bien-frec').checked = false;
    bienNorm(true);
    mostrarError('gre-bien-err', '');
    $('gre-modal-bien').querySelector('.gre-modal-titulo').textContent = bienEditando >= 0 ? 'Editar Bien' : 'Agregar Bien';
    abrir('gre-modal-bien');
  }

  function bienNorm(sinLimpiar) {
    var on = $('gre-bien-norm').checked, sel = $('gre-bien-subp'), sunat = $('gre-bien-sunat');
    sel.disabled = !on;
    sel.style.background = on ? '#fff' : '#f5f5f5';
    sunat.readOnly = on;
    sunat.style.background = on ? '#f5f5f5' : '#fff';
    if (!on) { sel.value = ''; if (sinLimpiar !== true) sunat.value = ''; }
    if (on) bienSubp();
  }

  function bienSubp() {
    var b = BIENES_NORMALIZADOS.find(function (x) { return x[0] === $('gre-bien-subp').value; });
    $('gre-bien-sunat').value = b ? b[2] : '';
    if (b && !$('gre-bien-desc').value.trim()) $('gre-bien-desc').value = b[1].toUpperCase();
  }

  function agregarBien() {
    var b = {
      normalizado: $('gre-bien-norm').checked,
      codigo: $('gre-bien-cod').value.trim(),
      subpartida: $('gre-bien-subp').value,
      codSunat: $('gre-bien-sunat').value.trim(),
      gtin: $('gre-bien-gtin').value.trim(),
      descripcion: $('gre-bien-desc').value.trim().toUpperCase(),
      unidad: $('gre-bien-um').value,
      cantidad: $('gre-bien-cant').value
    };
    if (b.normalizado && !b.subpartida) return mostrarError('gre-bien-err', 'Un bien normalizado requiere el código de subpartida nacional.');
    if (b.codSunat && !/^\d{8}$/.test(b.codSunat)) return mostrarError('gre-bien-err', 'El código de producto SUNAT tiene 8 dígitos.');
    if (b.gtin && !/^\d{8,14}$/.test(b.gtin)) return mostrarError('gre-bien-err', 'El código GTIN tiene entre 8 y 14 dígitos.');
    if (b.descripcion.length < 3) return mostrarError('gre-bien-err', 'Escriba la descripción detallada del bien.');
    if (!b.unidad) return mostrarError('gre-bien-err', 'Seleccione la unidad de medida del bien.');
    if (!(parseFloat(b.cantidad) > 0)) return mostrarError('gre-bien-err', 'La cantidad debe ser mayor a cero.');
    if ($('gre-bien-frec').checked) guardarFrecuente('bien', b, 'descripcion');
    if (bienEditando >= 0) S.bienes[bienEditando] = b; else S.bienes.push(b);
    cerrar('gre-modal-bien');
    renderBienes();
  }

  // ============================================================ PASO 5
  var HTML_PASO5 = cabecera(5, '5. Punto de partida y llegada', 'puntos') +
    '<h4 style="font-size:14px;color:#333;margin:0 0 10px;">Agrega el punto de partida</h4>' +
    '<div id="gre-partida-box" style="margin-bottom:12px;"></div>' +
    '<div style="margin-bottom:30px;"><button type="button" id="gre-partida-btn" onclick="GRE.abrirPunto(\'partida\')" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'partida\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Puntos de partida frecuentes</a></div>' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 10px;">Agrega el punto de llegada</h4>' +
    '<div id="gre-llegada-box" style="margin-bottom:12px;"></div>' +
    '<div><button type="button" id="gre-llegada-btn" onclick="GRE.abrirPunto(\'llegada\')" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'llegada\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Puntos de llegada frecuentes</a></div>' +
    error('gre-step5-err') +
    pie(5, 'gre-step5-sig');

  var HTML_MODAL_PUNTO =
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px;font-size:13px;">' +
    '<label style="cursor:pointer;"><input type="radio" name="gre-punto-op" value="remitente" onchange="GRE.puntoOpcion()"> <span id="gre-punto-op1">Establecimiento del Remitente</span></label>' +
    '<label style="cursor:pointer;"><input type="radio" name="gre-punto-op" value="tercero" onchange="GRE.puntoOpcion()"> Establecimiento de un tercero inscrito en el RUC</label>' +
    '<label style="cursor:pointer;"><input type="radio" name="gre-punto-op" value="otra" onchange="GRE.puntoOpcion()"> Otra dirección</label></div>' +
    '<div id="gre-punto-tercero" style="display:none;margin-bottom:14px;">' +
    fila(campo('Número de RUC', '<div style="display:flex;gap:8px;"><input id="gre-punto-ruc" maxlength="11" style="' + ESTILO_INPUT + '">' +
               '<button type="button" onclick="GRE.puntoBuscarRuc()" style="' + ESTILO_BTN_AZUL + 'padding:8px 16px;"><i class="fas fa-search"></i></button></div>')) +
    '</div>' +
    '<div id="gre-punto-tabla"></div>' +
    '<div id="gre-punto-otra" style="display:none;">' +
    '<p style="font-size:13px;font-weight:700;margin:0 0 10px;">Ingrese una dirección</p>' +
    fila(campo('Departamento', '<select id="gre-punto-dep" onchange="GRE.puntoUbigeo(1)" style="' + ESTILO_INPUT + '"></select>') +
         campo('Provincia', '<select id="gre-punto-prov" onchange="GRE.puntoUbigeo(2)" style="' + ESTILO_INPUT + '"></select>')) +
    fila(campo('Distrito', '<select id="gre-punto-dist" style="' + ESTILO_INPUT + '"></select>') + '<div style="flex:1;min-width:200px;"></div>') +
    '<div style="margin-bottom:12px;">' + campo('Dirección detallada', '<input id="gre-punto-dir" maxlength="200" style="' + ESTILO_INPUT + '">') + '</div>' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-punto-frec"> <span id="gre-punto-frec-lbl">Guardar como punto frecuente</span></label>' +
    '</div>' + error('gre-punto-err') +
    '<div style="display:flex;justify-content:flex-end;margin-top:14px;"><button type="button" onclick="GRE.agregarPunto()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  var puntoModo = 'partida', puntoCandidatos = [];

  function renderPuntos() {
    ['partida', 'llegada'].forEach(function (k) {
      var p = S[k], box = $('gre-' + k + '-box');
      box.innerHTML = p
        ? '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #e3e3e3;border-radius:4px;font-size:13px;">' +
          '<i class="fas fa-check-square" style="color:#006699;"></i><span style="flex:1;">' + esc(textoDireccion(p)) +
          (p.ubigeo ? ' <span style="color:#777;">(Ubigeo ' + esc(p.ubigeo) + ')</span>' : '') + '</span>' +
          '<a href="#" onclick="GRE.quitarPunto(\'' + k + '\');return false;" style="color:#c0392b;"><i class="fas fa-times"></i></a></div>'
        : '';
      boton($('gre-' + k + '-btn'), !p);
    });
    var iguales = S.partida && S.llegada && textoDireccion(S.partida) === textoDireccion(S.llegada);
    mostrarError('gre-step5-err', iguales ? 'El punto de partida y el punto de llegada no pueden ser la misma dirección.' : '');
    boton($('gre-step5-sig'), !!(S.partida && S.llegada && !iguales));
  }

  async function abrirPunto(modo) {
    puntoModo = modo;
    $('gre-modal-punto').querySelector('.gre-modal-titulo').textContent = modo === 'partida' ? 'Punto de partida' : 'Punto de llegada';
    $('gre-punto-frec-lbl').textContent = 'Guardar como punto de ' + modo + ' frecuente';
    $('gre-punto-ruc').value = '';
    $('gre-punto-dir').value = '';
    $('gre-punto-frec').checked = false;
    mostrarError('gre-punto-err', '');
    // Venta: la llegada suele ser el local del destinatario (tercero inscrito en el RUC)
    var op = (modo === 'llegada' && S.destinatario && S.destinatario.tipoDoc === 'RUC' &&
              S.destinatario.numDoc !== emisor().ruc) ? 'tercero' : 'remitente';
    document.querySelector('input[name="gre-punto-op"][value="' + op + '"]').checked = true;
    if (op === 'tercero') $('gre-punto-ruc').value = S.destinatario.numDoc;
    abrir('gre-modal-punto');
    await puntoOpcion();
  }

  async function puntoOpcion() {
    var op = (document.querySelector('input[name="gre-punto-op"]:checked') || {}).value;
    $('gre-punto-tercero').style.display = op === 'tercero' ? '' : 'none';
    $('gre-punto-otra').style.display = op === 'otra' ? '' : 'none';
    $('gre-punto-tabla').innerHTML = '';
    puntoCandidatos = [];
    mostrarError('gre-punto-err', '');
    if (op === 'remitente') {
      var e = window.currentEmisorData || {};
      var dom = await domicilioDe(emisor().ruc);
      puntoCandidatos = dom ? [dom] : (e.direccion ? [{ tipo: 'DOMICILIO FISCAL', direccion: e.direccion, ubigeo: '' }] : []);
      pintarCandidatos();
    } else if (op === 'tercero') {
      if ($('gre-punto-ruc').value) await puntoBuscarRuc();
    } else if (op === 'otra') {
      await llenarSelect('gre-punto-dep', null);
      $('gre-punto-prov').innerHTML = '<option value="">Seleccione</option>';
      $('gre-punto-dist').innerHTML = '<option value="">Seleccione</option>';
    }
  }

  async function domicilioDe(ruc) {
    var emp = await buscarEmpresa(ruc);
    if (!emp) return null;
    // Dirección en un solo texto que termina en "DEPARTAMENTO-PROVINCIA-DISTRITO"
    // (formato de la consulta RUC): se separa para poder calcular el ubigeo
    var partes = (emp.direccion || '').split('-');
    if (!emp.distrito && partes.length >= 3) {
      var dist = partes.pop().trim(), prov = partes.pop().trim(), resto = partes.join('-');
      var deps = (await ubigeoHijos(null)).slice().sort(function (a, b) { return b.nombre.length - a.nombre.length; });
      var dep = deps.find(function (d) { return sinTildes(resto).endsWith(sinTildes(d.nombre)); });
      if (dep && await ubigeoDe(dep.nombre, prov, dist)) {
        emp.direccion = resto.trim().slice(0, resto.trim().length - dep.nombre.length).replace(/[\s,]+$/, '');
        emp.departamento = dep.nombre; emp.provincia = prov; emp.distrito = dist;
      }
    }
    return {
      tipo: 'DOMICILIO FISCAL', ruc: ruc, razon_social: emp.razon_social,
      direccion: emp.direccion, distrito: emp.distrito, provincia: emp.provincia, departamento: emp.departamento,
      ubigeo: await ubigeoDe(emp.departamento, emp.provincia, emp.distrito)
    };
  }

  async function puntoBuscarRuc() {
    var ruc = $('gre-punto-ruc').value.trim();
    if (!/^\d{11}$/.test(ruc)) return mostrarError('gre-punto-err', 'Ingrese un RUC de 11 dígitos.');
    $('gre-punto-tabla').innerHTML = '<p style="font-size:13px;color:#006699;"><i class="fas fa-spinner fa-spin"></i> Buscando establecimientos...</p>';
    var dom = await domicilioDe(ruc);
    puntoCandidatos = dom ? [dom] : [];
    mostrarError('gre-punto-err', dom ? '' : 'No se encontraron establecimientos para el RUC ' + ruc + '.');
    pintarCandidatos();
  }

  function pintarCandidatos() {
    if (!puntoCandidatos.length) { $('gre-punto-tabla').innerHTML = ''; return; }
    $('gre-punto-tabla').innerHTML = '<p style="font-size:13px;font-weight:700;margin:0 0 8px;">Seleccione un establecimiento:</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;"><tr><th style="' + ESTILO_TH + '"></th><th style="' + ESTILO_TH +
      '">Tipo</th><th style="' + ESTILO_TH + '">Ubigeo</th><th style="' + ESTILO_TH + '">Domicilio</th></tr>' +
      puntoCandidatos.map(function (c, i) {
        return '<tr><td style="' + ESTILO_TD + '"><input type="radio" name="gre-punto-cand" value="' + i + '"' + (i === 0 ? ' checked' : '') + '></td>' +
          '<td style="' + ESTILO_TD + '">' + esc(c.tipo) + '</td><td style="' + ESTILO_TD + '">' + esc(c.ubigeo || '-') + '</td>' +
          '<td style="' + ESTILO_TD + '">' + esc(textoDireccion(c)) + '</td></tr>';
      }).join('') + '</table>';
  }

  async function llenarSelect(id, padre) {
    var sel = $(id);
    sel.innerHTML = '<option value="">Cargando...</option>';
    var lista = await ubigeoHijos(padre);
    sel.innerHTML = '<option value="">Seleccione</option>' + lista.map(function (u) {
      return '<option value="' + u.codigo + '">' + esc(u.nombre) + '</option>';
    }).join('');
    if (!lista.length) sel.innerHTML = '<option value="">Sin conexión con el catálogo de ubigeo</option>';
  }

  async function puntoUbigeo(nivel) {
    if (nivel === 1) {
      $('gre-punto-dist').innerHTML = '<option value="">Seleccione</option>';
      if ($('gre-punto-dep').value) await llenarSelect('gre-punto-prov', $('gre-punto-dep').value);
      else $('gre-punto-prov').innerHTML = '<option value="">Seleccione</option>';
    } else if ($('gre-punto-prov').value) {
      await llenarSelect('gre-punto-dist', $('gre-punto-prov').value);
    }
  }

  function textoSel(id) { var s = $(id); return s.value ? s.options[s.selectedIndex].text : ''; }

  function agregarPunto() {
    var op = (document.querySelector('input[name="gre-punto-op"]:checked') || {}).value, p = null;
    if (op === 'otra') {
      if (!$('gre-punto-dist').value) return mostrarError('gre-punto-err', 'Seleccione departamento, provincia y distrito.');
      var dir = $('gre-punto-dir').value.trim();
      if (dir.length < 5) return mostrarError('gre-punto-err', 'Escriba la dirección detallada (calle, número, urbanización).');
      p = { tipo: 'OTRA DIRECCIÓN', direccion: dir, departamento: textoSel('gre-punto-dep'),
            provincia: textoSel('gre-punto-prov'), distrito: textoSel('gre-punto-dist'), ubigeo: $('gre-punto-dist').value };
      if ($('gre-punto-frec').checked) guardarFrecuente(puntoModo, p, 'direccion');
    } else {
      var sel = document.querySelector('input[name="gre-punto-cand"]:checked');
      if (!sel || !puntoCandidatos[+sel.value]) return mostrarError('gre-punto-err', 'Seleccione un establecimiento.');
      p = puntoCandidatos[+sel.value];
      if (op === 'remitente') p.tipo = 'DOMICILIO FISCAL';
    }
    S[puntoModo] = p;
    cerrar('gre-modal-punto');
    renderPuntos();
  }

  // ============================================================ PASO 6
  var HTML_PASO6 = cabecera(6, '6. Datos de transporte', 'transporte') +
    '<h4 style="font-size:14px;color:#333;margin:0 0 12px;">Seleccione Modalidad de traslado</h4>' +
    '<div style="display:flex;gap:15px;margin-bottom:18px;flex-wrap:wrap;">' +
    '<button type="button" id="gre-mod-privado" onclick="GRE.modalidad(\'privado\')" style="flex:1;min-width:200px;padding:10px;border:2px solid #006699;background:#fff;color:#006699;border-radius:4px;font-size:14px;cursor:pointer;">Transporte Privado</button>' +
    '<button type="button" id="gre-mod-publico" onclick="GRE.modalidad(\'publico\')" style="flex:1;min-width:200px;padding:10px;border:2px solid #006699;background:#fff;color:#006699;border-radius:4px;font-size:14px;cursor:pointer;">Transporte Público</button></div>' +
    '<div id="gre-transp-cuerpo" style="display:none;">' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:22px;font-size:13px;">' +
    '<label style="cursor:pointer;"><input type="checkbox" id="gre-transbordo" onchange="GRE.validar6()"> Realiza transbordo programado</label>' +
    '<label style="cursor:pointer;"><input type="checkbox" id="gre-m1l" onchange="GRE.validar6()"> Traslado en vehículos de categoría M1 o L</label></div>' +
    '<div id="gre-m1l-box" style="display:none;margin-bottom:22px;max-width:320px;">' +
    campo('Placa del vehículo (categoría M1 o L)', '<input id="gre-m1l-placa" maxlength="8" oninput="this.value=this.value.toUpperCase();GRE.validar6()" style="' + ESTILO_INPUT + '">') + '</div>' +
    // --- público
    '<div id="gre-sec-transportista">' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 10px;">Datos del transportista</h4>' +
    '<div id="gre-transportista-lista"></div>' +
    '<div style="margin:12px 0 14px;"><button type="button" id="gre-transportista-btn" onclick="GRE.abrirTransportista()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'transportista\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Ver transportistas frecuentes</a></div>' +
    '<label style="font-size:13px;cursor:pointer;display:block;margin-bottom:4px;"><input type="checkbox" id="gre-reg-veh-transp" onchange="GRE.validar6()"> Registrar vehículos y conductores del transportista</label>' +
    '<p style="font-size:11px;color:#777;font-style:italic;margin:0 0 22px;">*de acuerdo con el último párrafo del numeral 3.1 del artículo 3) de la RS N° 255-2015-SUNAT y modificatorias</p></div>' +
    // --- privado
    '<div id="gre-sec-autorizacion">' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 10px;">Datos de la autorización especial para el traslado de la carga <span style="font-weight:400;color:#777;">(opcional)</span></h4>' +
    '<p style="font-size:12px;color:#777;margin:0 0 8px;">Solo para bienes que requieren condiciones especiales: carga refrigerada, automóviles, ganado en pie, productos frágiles, combustibles, entre otros.</p>' +
    '<div id="gre-aut-lista"></div>' +
    '<div style="margin:12px 0 26px;"><button type="button" onclick="GRE.abrirAutorizacion()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button></div></div>' +
    '<div id="gre-sec-vehiculos">' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 4px;">Datos de vehículos</h4>' +
    '<p style="font-size:12px;color:#777;margin:0 0 8px;">El primer registro corresponde al vehículo principal.</p>' +
    '<div id="gre-veh-lista"></div>' +
    '<div style="margin:12px 0 26px;"><button type="button" onclick="GRE.abrirVehiculo()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'vehiculo\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Ver vehículos frecuentes</a></div></div>' +
    '<div id="gre-sec-conductores">' +
    '<h4 style="font-size:14px;color:#333;margin:0 0 4px;">Datos de conductores</h4>' +
    '<p style="font-size:12px;color:#777;margin:0 0 8px;">El primer registro corresponde al conductor principal.</p>' +
    '<div id="gre-cond-lista"></div>' +
    '<div style="margin:12px 0 26px;"><button type="button" onclick="GRE.abrirConductor()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-plus"></i> Agregar</button>' +
    '<a onclick="GRE.verFrecuentes(\'conductor\')" style="' + ESTILO_LINK + '"><i class="fas fa-search"></i> Ver conductores frecuentes</a></div></div>' +
    // --- fecha e indicadores
    '<div style="max-width:320px;margin-bottom:12px;">' +
    campo('<span id="gre-fecha-lbl">Fecha de inicio de traslado</span>', '<input type="date" id="gre-fecha-traslado" onchange="GRE.validar6()" style="' + ESTILO_INPUT + '">') + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">' +
    '<label style="cursor:pointer;"><input type="checkbox" id="gre-ret-envases" onchange="GRE.validar6()"> Retorno de vehículo con envases o embalajes vacíos</label>' +
    '<label style="cursor:pointer;"><input type="checkbox" id="gre-ret-vacio" onchange="GRE.validar6()"> Retorno de vehículo vacío</label></div>' +
    error('gre-step6-err') +
    '</div>' +
    pie(6, 'gre-step6-sig');

  var HTML_MODAL_VEH =
    '<div style="max-width:300px;margin-bottom:16px;">' + campo('Número de placa', '<input id="gre-veh-placa" maxlength="8" placeholder="V6A863" oninput="this.value=this.value.toUpperCase()" style="' + ESTILO_INPUT + '">') + '</div>' +
    '<p style="font-size:13px;font-weight:700;margin:0 0 10px;">Datos de la autorización especial para el traslado de la carga</p>' +
    fila(campo('Entidad emisora de la autorización', '<select id="gre-veh-ent" style="' + ESTILO_INPUT + '">' + opciones(ENTIDADES_AUT, true) + '</select>') +
         campo('Número de autorización', '<input id="gre-veh-aut" maxlength="50" style="' + ESTILO_INPUT + '">')) +
    error('gre-veh-err') +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-veh-frec"> Guardar como vehículo frecuente</label>' +
    '<button type="button" onclick="GRE.agregarVehiculo()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  var HTML_MODAL_COND =
    fila(campo('Número de licencia de conducir', '<input id="gre-cond-lic" maxlength="10" placeholder="Q43408176" oninput="this.value=this.value.toUpperCase()" style="' + ESTILO_INPUT + '">') +
         campo('Tipo de documento de identidad', '<select id="gre-cond-tipo" style="' + ESTILO_INPUT + '">' + opciones(TIPOS_DOC_ID) + '</select>')) +
    fila(campo('Número de documento de identidad', '<input id="gre-cond-doc" maxlength="12" onblur="GRE.condBuscar()" style="' + ESTILO_INPUT + '">') +
         campo('Apellidos y Nombres', '<input id="gre-cond-nom" maxlength="120" style="' + ESTILO_INPUT + '">')) +
    error('gre-cond-err') +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-cond-frec"> Guardar como conductor frecuente</label>' +
    '<button type="button" onclick="GRE.agregarConductor()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  var HTML_MODAL_TRANSP =
    fila(campo('Número de RUC', '<input id="gre-tr-ruc" maxlength="11" onblur="GRE.trBuscar()" style="' + ESTILO_INPUT + '">') +
         campo('Apellidos y nombres, denominación o razón social', '<input id="gre-tr-razon" readonly style="' + ESTILO_INPUT + 'background:#f5f5f5;">')) +
    '<div style="max-width:300px;margin-bottom:16px;">' + campo('Número de registro MTC', '<input id="gre-tr-mtc" maxlength="20" oninput="this.value=this.value.toUpperCase()" style="' + ESTILO_INPUT + '">') + '</div>' +
    '<p style="font-size:13px;font-weight:700;margin:0 0 10px;">Datos de la autorización especial para el traslado de la carga</p>' +
    fila(campo('Entidad emisora de la autorización', '<select id="gre-tr-ent" style="' + ESTILO_INPUT + '">' + opciones(ENTIDADES_AUT, true) + '</select>') +
         campo('Número de autorización', '<input id="gre-tr-aut" maxlength="50" style="' + ESTILO_INPUT + '">')) +
    error('gre-tr-err') +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">' +
    '<label style="font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" id="gre-tr-frec"> Guardar como transportista frecuente</label>' +
    '<button type="button" onclick="GRE.agregarTransportista()" style="' + ESTILO_BTN_AZUL + '">Aceptar</button></div>';

  var HTML_MODAL_AUT =
    fila(campo('Entidad emisora de la autorización', '<select id="gre-aut-ent" style="' + ESTILO_INPUT + '">' + opciones(ENTIDADES_AUT, true) + '</select>') +
         campo('Número de autorización', '<input id="gre-aut-num" maxlength="50" style="' + ESTILO_INPUT + '">')) +
    error('gre-aut-err') +
    '<div style="display:flex;justify-content:flex-end;margin-top:10px;"><button type="button" onclick="GRE.agregarAutorizacion()" style="' + ESTILO_BTN_AZUL + '">Agregar</button></div>';

  function siglaEntidad(e) { return String(e || '').split(' - ')[0]; }
  function siglaDoc(tipo) { return { '1': 'DNI', '4': 'CE', '7': 'PASAPORTE', 'P': 'PTP' }[tipo] || 'DOC.'; }

  function lista(items, textoFn, tipo) {
    if (!items.length) return '';
    return items.map(function (x, i) {
      return '<div style="display:flex;align-items:center;gap:14px;padding:9px 12px;border:1px solid #e3e3e3;border-radius:4px;font-size:12px;margin-bottom:6px;">' +
        '<i class="fas fa-check-circle" style="color:#006699;"></i><span style="color:#777;min-width:60px;">' + (i === 0 ? 'principal' : 'secundario') + '</span>' +
        '<span style="flex:1;">' + textoFn(x) + '</span>' +
        '<a href="#" onclick="GRE.quitar(\'' + tipo + '\',' + i + ');return false;" style="color:#c0392b;"><i class="fas fa-times"></i></a></div>';
    }).join('');
  }

  function renderTransporte() {
    var priv = S.modalidad === 'privado', pub = S.modalidad === 'publico';
    $('gre-transp-cuerpo').style.display = S.modalidad ? '' : 'none';
    [['gre-mod-privado', priv], ['gre-mod-publico', pub]].forEach(function (b) {
      $(b[0]).style.background = b[1] ? '#006699' : '#fff';
      $(b[0]).style.color = b[1] ? '#fff' : '#006699';
    });
    if (!S.modalidad) { boton($('gre-step6-sig'), false); return; }

    S.transbordo = $('gre-transbordo').checked;
    S.m1l = $('gre-m1l').checked;
    S.regVehTransp = $('gre-reg-veh-transp').checked;
    S.placaM1L = $('gre-m1l-placa').value.trim();
    S.fechaTraslado = $('gre-fecha-traslado').value;
    S.retornoEnvases = $('gre-ret-envases').checked;
    S.retornoVacio = $('gre-ret-vacio').checked;

    $('gre-m1l-box').style.display = S.m1l ? '' : 'none';
    $('gre-sec-transportista').style.display = (pub && !S.m1l) ? '' : 'none';
    var conVehiculos = (priv && !S.m1l) || (pub && !S.m1l && S.regVehTransp);
    $('gre-sec-autorizacion').style.display = (priv && !S.m1l) ? '' : 'none';
    $('gre-sec-vehiculos').style.display = conVehiculos ? '' : 'none';
    $('gre-sec-conductores').style.display = conVehiculos ? '' : 'none';
    $('gre-fecha-lbl').textContent = pub ? 'Fecha de entrega de bienes al transportista' : 'Fecha de inicio de traslado';

    $('gre-transportista-lista').innerHTML = S.transportista
      ? lista([S.transportista], function (t) { return 'RUC ' + esc(t.ruc) + ' &nbsp; ' + esc(t.razon_social) + ' &nbsp; MTC: ' + esc(t.mtc || '-'); }, 'transportista')
      : '';
    boton($('gre-transportista-btn'), !S.transportista);
    $('gre-aut-lista').innerHTML = lista(S.autorizaciones, function (a) { return esc(siglaEntidad(a.entidad)) + ' &nbsp; N° ' + esc(a.numero); }, 'autorizaciones');
    $('gre-veh-lista').innerHTML = lista(S.vehiculos, function (v) {
      return 'PLACA: ' + esc(v.placa) + (v.entidad ? ' &nbsp; ' + esc(siglaEntidad(v.entidad)) + ' &nbsp; ' + esc(v.autorizacion) : '');
    }, 'vehiculos');
    $('gre-cond-lista').innerHTML = lista(S.conductores, function (c) {
      return 'LIC.: ' + esc(c.licencia) + ' &nbsp; ' + esc(c.tipoTxt) + ' &nbsp; ' + esc(c.doc) + ' &nbsp; ' + esc(c.nombre);
    }, 'conductores');

    var err = '';
    if (S.m1l && !/^[A-Z0-9]{6,8}$/.test(S.placaM1L)) err = 'Digite la placa del vehículo de categoría M1 o L (6 caracteres, sin guion).';
    else if (pub && !S.m1l && !S.transportista) err = 'Agregue los datos del transportista.';
    else if (conVehiculos && priv && !S.vehiculos.length) err = 'Agregue al menos un vehículo (el primero es el principal).';
    else if (conVehiculos && priv && !S.conductores.length) err = 'Agregue al menos un conductor (el primero es el principal).';
    else if (!S.fechaTraslado) err = '';
    else if (S.fechaTraslado < hoyISO()) err = 'La fecha no puede ser anterior a la fecha de emisión de la guía (' + fechaPE(hoyISO()) + ').';
    else if (S.retornoEnvases && S.retornoVacio) err = 'Marque solo uno de los indicadores de retorno del vehículo.';
    mostrarError('gre-step6-err', err);
    boton($('gre-step6-sig'), !err && !!S.fechaTraslado);
  }

  function abrirVehiculo() {
    ['gre-veh-placa', 'gre-veh-aut'].forEach(function (id) { $(id).value = ''; });
    $('gre-veh-ent').value = ''; $('gre-veh-frec').checked = false;
    mostrarError('gre-veh-err', '');
    abrir('gre-modal-veh');
  }
  function agregarVehiculo() {
    var v = { placa: $('gre-veh-placa').value.trim().replace(/-/g, ''), entidad: $('gre-veh-ent').value, autorizacion: $('gre-veh-aut').value.trim() };
    if (!/^[A-Z0-9]{6,8}$/.test(v.placa)) return mostrarError('gre-veh-err', 'La placa tiene 6 caracteres alfanuméricos, sin guion (ejemplo: V6A863).');
    if (!!v.entidad !== !!v.autorizacion) return mostrarError('gre-veh-err', 'Complete la entidad emisora y el número de autorización, o deje ambos vacíos.');
    if (S.vehiculos.some(function (x) { return x.placa === v.placa; })) return mostrarError('gre-veh-err', 'Ese vehículo ya fue agregado.');
    if ($('gre-veh-frec').checked) guardarFrecuente('vehiculo', v, 'placa');
    S.vehiculos.push(v);
    cerrar('gre-modal-veh');
    renderTransporte();
  }

  function abrirConductor() {
    ['gre-cond-lic', 'gre-cond-doc', 'gre-cond-nom'].forEach(function (id) { $(id).value = ''; });
    $('gre-cond-tipo').value = '1'; $('gre-cond-frec').checked = false;
    mostrarError('gre-cond-err', '');
    abrir('gre-modal-cond');
  }
  async function condBuscar() {
    if ($('gre-cond-tipo').value !== '1') return;
    var dni = $('gre-cond-doc').value.trim();
    var p = await buscarPersona(dni);
    if (p && p.nombres) $('gre-cond-nom').value = p.nombres;
  }
  function agregarConductor() {
    var tipo = $('gre-cond-tipo').value;
    var c = { licencia: $('gre-cond-lic').value.trim(), tipo: tipo, tipoTxt: TIPOS_DOC_ID.find(function (x) { return x[0] === tipo; })[1],
              doc: $('gre-cond-doc').value.trim(), nombre: $('gre-cond-nom').value.trim().toUpperCase() };
    if (!/^[A-Z]\d{8}$/.test(c.licencia)) return mostrarError('gre-cond-err', 'La licencia de conducir es una letra seguida de 8 dígitos (ejemplo: Q43408176).');
    if (tipo === '1' && !/^\d{8}$/.test(c.doc)) return mostrarError('gre-cond-err', 'El DNI tiene 8 dígitos.');
    if (c.doc.length < 6) return mostrarError('gre-cond-err', 'Ingrese el número de documento de identidad.');
    if (c.nombre.length < 5) return mostrarError('gre-cond-err', 'Ingrese los apellidos y nombres del conductor.');
    if (S.conductores.some(function (x) { return x.doc === c.doc; })) return mostrarError('gre-cond-err', 'Ese conductor ya fue agregado.');
    if ($('gre-cond-frec').checked) guardarFrecuente('conductor', c, 'doc');
    S.conductores.push(c);
    cerrar('gre-modal-cond');
    renderTransporte();
  }

  function abrirTransportista() {
    ['gre-tr-ruc', 'gre-tr-razon', 'gre-tr-mtc', 'gre-tr-aut'].forEach(function (id) { $(id).value = ''; });
    $('gre-tr-ent').value = ''; $('gre-tr-frec').checked = false;
    $('gre-tr-razon').readOnly = true; $('gre-tr-razon').style.background = '#f5f5f5';
    mostrarError('gre-tr-err', '');
    abrir('gre-modal-tr');
  }
  async function trBuscar() {
    var ruc = $('gre-tr-ruc').value.trim(), raz = $('gre-tr-razon');
    raz.value = '';
    raz.readOnly = true; raz.style.background = '#f5f5f5';
    if (!/^\d{11}$/.test(ruc)) return;
    raz.value = 'Buscando...';
    var e = await buscarEmpresa(ruc);
    raz.value = e ? e.razon_social : '';
    if (!e) {
      // No figura en el padrón: la razón social se escribe a mano
      raz.readOnly = false; raz.style.background = '#FFF6E0';
      raz.placeholder = 'Escriba la razón social del transportista';
      raz.oninput = function () { raz.value = raz.value.toUpperCase(); };
      raz.focus();
    }
    mostrarError('gre-tr-err', e ? '' : 'El RUC ' + ruc + ' no figura en el padrón del simulador. Escriba la razón social del transportista tal como figura en su ficha RUC.');
  }
  function agregarTransportista() {
    var t = { ruc: $('gre-tr-ruc').value.trim(), razon_social: $('gre-tr-razon').value.trim(), mtc: $('gre-tr-mtc').value.trim(),
              entidad: $('gre-tr-ent').value, autorizacion: $('gre-tr-aut').value.trim() };
    if (!/^\d{11}$/.test(t.ruc) || !t.razon_social || t.razon_social === 'Buscando...') return mostrarError('gre-tr-err', 'Ingrese un RUC válido del transportista y su razón social.');
    if (t.ruc === emisor().ruc) return mostrarError('gre-tr-err', 'En transporte público el transportista es un tercero, no el propio remitente. Si trasladas con tus vehículos elige Transporte Privado.');
    if (!/^[A-Z0-9]{3,20}$/.test(t.mtc)) return mostrarError('gre-tr-err', 'Ingrese el número de registro MTC del transportista.');
    if (!!t.entidad !== !!t.autorizacion) return mostrarError('gre-tr-err', 'Complete la entidad emisora y el número de autorización, o deje ambos vacíos.');
    if ($('gre-tr-frec').checked) guardarFrecuente('transportista', t, 'ruc');
    S.transportista = t;
    cerrar('gre-modal-tr');
    renderTransporte();
  }

  function abrirAutorizacion() {
    $('gre-aut-ent').value = ''; $('gre-aut-num').value = '';
    mostrarError('gre-aut-err', '');
    abrir('gre-modal-aut');
  }
  function agregarAutorizacion() {
    var a = { entidad: $('gre-aut-ent').value, numero: $('gre-aut-num').value.trim() };
    if (!a.entidad || !a.numero) return mostrarError('gre-aut-err', 'Seleccione la entidad emisora e ingrese el número de autorización.');
    S.autorizaciones.push(a);
    cerrar('gre-modal-aut');
    renderTransporte();
  }

  function modalidad(m) {
    if (S.modalidad !== m) {
      S.vehiculos = []; S.conductores = []; S.autorizaciones = []; S.transportista = null;
      $('gre-reg-veh-transp').checked = false;
    }
    S.modalidad = m;
    if (!$('gre-fecha-traslado').value) $('gre-fecha-traslado').value = hoyISO();
    renderTransporte();
  }

  // ======================================================== FRECUENTES
  var HTML_MODAL_FREC = '<div class="gre-frec-cuerpo"></div>';
  var FREC_CFG = {
    bien:          { titulo: 'Bienes frecuentes', texto: function (x) { return x.descripcion + ' - ' + x.unidad + (x.codigo ? ' (cód. ' + x.codigo + ')' : ''); } },
    vehiculo:      { titulo: 'Vehículos frecuentes', texto: function (x) { return 'PLACA ' + x.placa + (x.entidad ? ' - ' + siglaEntidad(x.entidad) + ' ' + x.autorizacion : ''); } },
    conductor:     { titulo: 'Conductores frecuentes', texto: function (x) { return x.nombre + ' - ' + x.doc + ' - LIC. ' + x.licencia; } },
    transportista: { titulo: 'Transportistas frecuentes', texto: function (x) { return x.razon_social + ' - RUC ' + x.ruc; } },
    partida:       { titulo: 'Puntos de partida frecuentes', texto: textoDireccion },
    llegada:       { titulo: 'Puntos de llegada frecuentes', texto: textoDireccion }
  };
  var frecTipo = '';
  function verFrecuentes(tipo) {
    frecTipo = tipo;
    var items = frecuentes(tipo), cfg = FREC_CFG[tipo];
    $('gre-modal-frec').querySelector('.gre-modal-titulo').textContent = cfg.titulo;
    $('gre-modal-frec').querySelector('.gre-frec-cuerpo').innerHTML = items.length
      ? items.map(function (x, i) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #eee;font-size:13px;">' +
            '<span style="flex:1;">' + esc(cfg.texto(x)) + '</span>' +
            '<button type="button" onclick="GRE.usarFrecuente(' + i + ')" style="' + ESTILO_BTN_AZUL + 'padding:6px 14px;font-size:12px;">Seleccionar</button></div>';
        }).join('')
      : '<p style="font-size:13px;color:#777;margin:0;">Aún no tienes registros frecuentes. Marca la casilla <b>Guardar como frecuente</b> al agregar uno.</p>';
    abrir('gre-modal-frec');
  }
  function usarFrecuente(i) {
    var x = JSON.parse(JSON.stringify(frecuentes(frecTipo)[i]));
    cerrar('gre-modal-frec');
    if (frecTipo === 'bien') { S.bienes.push(x); renderBienes(); }
    else if (frecTipo === 'vehiculo') { if (!S.vehiculos.some(function (v) { return v.placa === x.placa; })) S.vehiculos.push(x); renderTransporte(); }
    else if (frecTipo === 'conductor') { if (!S.conductores.some(function (c) { return c.doc === x.doc; })) S.conductores.push(x); renderTransporte(); }
    else if (frecTipo === 'transportista') { S.transportista = x; renderTransporte(); }
    else { S[frecTipo] = x; renderPuntos(); }
  }

  // ========================================================= VISTA PREVIA
  var HTML_PASO7 = barra(6) +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">' +
    '<h3 style="color:#006699;font-size:15px;font-weight:400;margin:0;">Vista previa de la Guía de Remisión Electrónica Remitente</h3></div>' +
    '<p class="gre-motivo-lbl" style="color:#006699;font-size:13px;margin:0 0 20px 0;">Motivo: -</p>' +
    '<div id="gre-preview"></div>' +
    '<div style="margin-top:20px;">' + campo('Observaciones:', '<textarea id="gre-obs" rows="3" maxlength="250" placeholder="OBSERVACIONES POR EL TRASLADO..." style="' + ESTILO_INPUT + 'resize:vertical;"></textarea>') + '</div>' +
    '<div style="display:flex;justify-content:flex-end;gap:15px;margin-top:25px;">' +
    '<button type="button" onclick="GRE.ir(6)" style="padding:10px 40px;background:#00aeef;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer;">Volver</button>' +
    '<button type="button" onclick="GRE.confirmarEmision()" style="padding:10px 40px;background:#006699;color:#fff;border:none;border-radius:4px;font-size:14px;cursor:pointer;">Emitir GRE</button></div>';

  function seccion(titulo, html) {
    return '<div style="border-top:1px solid #e3e3e3;padding:14px 0;"><h4 style="color:#006699;font-size:14px;margin:0 0 10px;">' + titulo + '</h4>' + html + '</div>';
  }
  function dato(k, v) {
    return '<div style="display:flex;gap:10px;font-size:13px;margin-bottom:5px;"><span style="color:#555;min-width:260px;">' + k + '</span><span style="color:#222;">' + esc(v) + '</span></div>';
  }
  function siNo(b) { return b ? 'SI' : 'NO'; }

  function renderPreview() {
    var e = emisor(), d = S.destinatario || {};
    var h = seccion('Datos de la guía',
        dato('Tipo de guía:', 'Guía de Remisión Remitente') +
        dato('Remitente:', e.razon_social + ' - RUC ' + e.ruc) +
        dato('Fecha de emisión:', fechaPE(hoyISO())) +
        dato('Motivo de traslado:', motivo())) +
      seccion('Destinatario', dato(d.tipoDocLabel || 'Documento', (d.numDoc || '-') + ' - ' + (d.razonSocial || '-'))) +
      seccion('Documentos relacionados', S.docs.length
        ? S.docs.map(function (x) { return dato(x.tipoTxt + ':', (x.serie ? x.serie + '-' : '') + x.numero + ' (RUC ' + x.ruc + ')'); }).join('')
        : '<p style="font-size:13px;color:#777;margin:0;">Ninguno</p>') +
      seccion('Punto de partida y llegada',
        dato('Punto de partida:', textoDireccion(S.partida) + (S.partida.ubigeo ? ' (' + S.partida.ubigeo + ')' : '')) +
        dato('Punto de llegada:', textoDireccion(S.llegada) + (S.llegada.ubigeo ? ' (' + S.llegada.ubigeo + ')' : ''))) +
      seccion('Bienes a transportar',
        '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:640px;"><tr>' +
        ['N°', 'Bien normalizado', 'Código bien', 'Cod. prod. SUNAT', 'Cod. subpar. arancelaria', 'Descripción detallada', 'Unid. medida', 'Cantidad']
          .map(function (t) { return '<th style="' + ESTILO_TH + '">' + t + '</th>'; }).join('') + '</tr>' +
        S.bienes.map(function (b, i) {
          return '<tr>' + [i + 1, siNo(b.normalizado), b.codigo || '-', b.codSunat || '-', b.subpartida || '-', b.descripcion, b.unidad, b.cantidad]
            .map(function (v) { return '<td style="' + ESTILO_TD + '">' + esc(v) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</table></div>' +
        '<div style="margin-top:10px;">' + dato('Peso bruto total de la carga:', S.pesoBruto + ' ' + S.unidadPeso) + '</div>') +
      seccion('Datos del traslado',
        dato('Modalidad de traslado:', S.modalidad === 'privado' ? 'Privado' : 'Público') +
        dato(S.modalidad === 'publico' ? 'Fecha de entrega de bienes al transportista:' : 'Fecha de inicio de traslado:', fechaPE(S.fechaTraslado)) +
        dato('Indicador de traslado en vehículos de categoría M1 o L:', siNo(S.m1l) + (S.m1l ? ' - Placa ' + S.placaM1L : '')) +
        dato('Indicador de transbordo programado:', siNo(S.transbordo)) +
        dato('Indicador de retorno de vehículo con envases o embalajes vacíos:', siNo(S.retornoEnvases)) +
        dato('Indicador de retorno de vehículo vacío:', siNo(S.retornoVacio))) +
      (S.transportista ? seccion('Datos del transportista',
        dato('Transportista:', S.transportista.razon_social + ' - RUC ' + S.transportista.ruc) +
        dato('N° de registro MTC:', S.transportista.mtc) +
        (S.transportista.entidad ? dato('Autorización especial:', siglaEntidad(S.transportista.entidad) + ' - ' + S.transportista.autorizacion) : '')) : '') +
      (S.autorizaciones.length ? seccion('Autorizaciones especiales de la carga',
        S.autorizaciones.map(function (a) { return dato(siglaEntidad(a.entidad) + ':', a.numero); }).join('')) : '') +
      (S.vehiculos.length ? seccion('Datos de los vehículos', S.vehiculos.map(function (v, i) {
        return dato((i ? 'Secundario' : 'Principal') + ':', 'N° de placa: ' + v.placa +
          (v.entidad ? ' | Entidad emisora: ' + siglaEntidad(v.entidad) + ' - N° de autorización: ' + v.autorizacion : ''));
      }).join('')) : '') +
      (S.conductores.length ? seccion('Datos de los conductores', S.conductores.map(function (c, i) {
        return dato((i ? 'Secundario' : 'Principal') + ':', siglaDoc(c.tipo) + ' ' + c.doc + ' - ' + c.nombre + ' | N° de licencia de conducir: ' + c.licencia);
      }).join('')) : '');
    $('gre-preview').innerHTML = h;
    $('gre-obs').value = S.observaciones;
  }

  // ============================================================ EMISIÓN
  var HTML_MODAL_CONF =
    '<p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 20px;">¿Está seguro de emitir la Guía de Remisión Electrónica? ' +
    'Una vez emitida no podrá modificarse; solo podrá darse de baja si el traslado no se inició.</p>' +
    '<div style="display:flex;justify-content:flex-end;gap:12px;">' +
    '<button type="button" onclick="GRE.cerrar(\'gre-modal-conf\')" style="padding:10px 26px;background:#fff;color:#006699;border:1px solid #006699;border-radius:4px;cursor:pointer;">Cancelar</button>' +
    '<button type="button" onclick="GRE.emitir()" style="' + ESTILO_BTN_AZUL + '">Sí, emitir</button></div>';

  var HTML_MODAL_OK =
    '<div style="text-align:center;padding:6px 0 4px;">' +
    '<div style="width:64px;height:64px;margin:0 auto 14px;border-radius:50%;background:#e8f5e9;display:flex;align-items:center;justify-content:center;">' +
    '<i class="fas fa-check" style="font-size:30px;color:#2e7d32;"></i></div>' +
    '<p style="font-size:15px;color:#333;margin:0 0 6px;">La Guía de Remisión Electrónica Remitente</p>' +
    '<p id="gre-ok-num" style="font-size:22px;font-weight:700;color:#006699;margin:0 0 6px;"></p>' +
    '<p id="gre-ok-det" style="font-size:13px;color:#555;margin:0 0 22px;"></p>' +
    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">' +
    '<button type="button" onclick="GRE.pdf(\'descargar\')" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-file-pdf"></i> Descargar PDF</button>' +
    '<button type="button" onclick="GRE.pdf(\'imprimir\')" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-print"></i> Imprimir</button>' +
    '<button type="button" onclick="GRE.correo()" style="' + ESTILO_BTN_AZUL + '"><i class="fas fa-envelope"></i> Enviar por correo</button></div>' +
    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
    '<button type="button" onclick="GRE.nueva()" style="padding:9px 22px;background:#fff;color:#006699;border:1px solid #006699;border-radius:4px;cursor:pointer;">Emitir otra GRE</button>' +
    '<button type="button" onclick="GRE.cerrar(\'gre-modal-ok\');hideEmisionGRE();" style="padding:9px 22px;background:#fff;color:#006699;border:1px solid #006699;border-radius:4px;cursor:pointer;">Ir al inicio</button></div></div>';

  function confirmarEmision() {
    S.observaciones = $('gre-obs').value.trim();
    abrir('gre-modal-conf');
  }

  function emitir() {
    cerrar('gre-modal-conf');
    var e = emisor(), st = almacen();
    var key = 'taxlab_correlativo_' + e.ruc + '_' + SERIE_GRE;
    var n = (parseInt(st.getItem(key) || '0', 10) || 0) + 1;
    try { st.setItem(key, String(n)); } catch (x) {}
    var numero = SERIE_GRE + '-' + String(n).padStart(8, '0');
    var ahora = new Date();
    S.emitida = { numero: numero, fecha: fechaPE(hoyISO()), hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) };

    // Registro de las GRE emitidas por empresa (para consulta y reporte)
    try {
      var lista = JSON.parse(st.getItem('taxlab_gres') || '[]');
      lista.push({ numero: numero, fecha: S.emitida.fecha, emisor_ruc: e.ruc, emisor: e.razon_social,
                   motivo: motivo(), destinatario: (S.destinatario || {}).razonSocial || '', destinatario_doc: (S.destinatario || {}).numDoc || '',
                   partida: textoDireccion(S.partida), llegada: textoDireccion(S.llegada), modalidad: S.modalidad,
                   bienes: S.bienes.length, peso: S.pesoBruto + ' ' + S.unidadPeso });
      st.setItem('taxlab_gres', JSON.stringify(lista));
    } catch (x) {}

    $('gre-ok-num').textContent = numero;
    $('gre-ok-det').innerHTML = 'ha sido emitida el ' + S.emitida.fecha + ' a las ' + esc(S.emitida.hora.replace(/\.$/, '')) + '.<br>' +
      'Destinatario: ' + esc((S.destinatario || {}).razonSocial || '-');
    abrir('gre-modal-ok');
  }

  function correo() {
    var c = prompt('Correo electrónico del destinatario de la GRE ' + (S.emitida || {}).numero + ':', '');
    if (c === null) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.trim())) { alert('Ingrese un correo electrónico válido (ejemplo: cliente@empresa.com).'); return; }
    toast('GRE enviada', 'Se envió la representación impresa a ' + esc(c.trim()) + ' (simulación).');
  }

  // Representación impresa de la GRE en PDF (jsPDF se carga solo si hace falta)
  function pdf(modo) {
    function build() {
      if (!window.jspdf) { alert('No se pudo cargar el generador de PDF. Intente de nuevo.'); return; }
      var doc = new window.jspdf.jsPDF(), e = emisor(), d = S.destinatario || {}, y;
      var azul = [0, 102, 153];
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(e.razon_social, 15, 18, { maxWidth: 110 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.text(String((window.currentEmisorData || {}).direccion || ''), 15, 25, { maxWidth: 110 });
      doc.setDrawColor(azul[0], azul[1], azul[2]); doc.setLineWidth(0.6); doc.rect(130, 10, 65, 26);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      doc.text('GUÍA DE REMISIÓN ELECTRÓNICA', 162.5, 17, { align: 'center' });
      doc.text('REMITENTE', 162.5, 22, { align: 'center' });
      doc.text('RUC N° ' + e.ruc, 162.5, 27, { align: 'center' });
      doc.setFontSize(11); doc.text(S.emitida.numero, 162.5, 33, { align: 'center' });

      y = 46;
      function titulo(t) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(azul[0], azul[1], azul[2]); doc.rect(15, y - 4.5, 180, 6.5, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(t, 17, y); doc.setTextColor(30, 30, 30); y += 7;
      }
      function linea(k, v) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.text(k, 17, y);
        doc.setFont('helvetica', 'normal');
        var t = doc.splitTextToSize(String(v == null ? '-' : v), 120);
        doc.text(t, 75, y); y += 4.6 * t.length + 0.6;
      }
      titulo('DATOS DEL TRASLADO');
      linea('Fecha de emisión:', S.emitida.fecha + ' ' + S.emitida.hora);
      linea('Motivo de traslado:', motivo());
      linea('Modalidad de traslado:', S.modalidad === 'privado' ? 'Transporte privado' : 'Transporte público');
      linea(S.modalidad === 'publico' ? 'Fecha de entrega al transportista:' : 'Fecha de inicio de traslado:', fechaPE(S.fechaTraslado));
      linea('Peso bruto total:', S.pesoBruto + ' ' + S.unidadPeso);
      linea('Indicadores:', 'M1 o L: ' + siNo(S.m1l) + ' | Transbordo: ' + siNo(S.transbordo) +
            ' | Retorno con envases: ' + siNo(S.retornoEnvases) + ' | Retorno vacío: ' + siNo(S.retornoVacio));
      y += 2; titulo('DESTINATARIO');
      linea('Documento:', (d.tipoDocLabel || '') + ' ' + (d.numDoc || ''));
      linea('Denominación:', d.razonSocial || '-');
      y += 2; titulo('PUNTO DE PARTIDA Y PUNTO DE LLEGADA');
      linea('Punto de partida:', textoDireccion(S.partida) + (S.partida.ubigeo ? ' - Ubigeo ' + S.partida.ubigeo : ''));
      linea('Punto de llegada:', textoDireccion(S.llegada) + (S.llegada.ubigeo ? ' - Ubigeo ' + S.llegada.ubigeo : ''));
      if (S.docs.length) {
        y += 2; titulo('DOCUMENTOS RELACIONADOS');
        S.docs.forEach(function (x) { linea(x.tipoTxt + ':', (x.serie ? x.serie + '-' : '') + x.numero + ' (RUC ' + x.ruc + ')'); });
      }
      if (S.transportista) {
        y += 2; titulo('DATOS DEL TRANSPORTISTA');
        linea('Transportista:', S.transportista.razon_social + ' - RUC ' + S.transportista.ruc);
        linea('N° de registro MTC:', S.transportista.mtc);
      }
      if (S.vehiculos.length || S.m1l) {
        y += 2; titulo('VEHÍCULOS');
        if (S.m1l) linea('Vehículo M1 o L:', 'Placa ' + S.placaM1L);
        S.vehiculos.forEach(function (v, i) {
          linea((i ? 'Secundario' : 'Principal') + ':', 'Placa ' + v.placa + (v.entidad ? ' | ' + siglaEntidad(v.entidad) + ' N° ' + v.autorizacion : ''));
        });
      }
      if (S.conductores.length) {
        y += 2; titulo('CONDUCTORES');
        S.conductores.forEach(function (c, i) {
          linea((i ? 'Secundario' : 'Principal') + ':', siglaDoc(c.tipo) + ' ' + c.doc + ' - ' + c.nombre + ' | Licencia ' + c.licencia);
        });
      }
      y += 2; titulo('BIENES A TRANSPORTAR');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      var cols = [17, 25, 45, 70, 162, 182];
      ['N°', 'Código', 'Cod. SUNAT', 'Descripción', 'Unidad', 'Cantidad'].forEach(function (t, i) { doc.text(t, cols[i], y); });
      y += 2; doc.setDrawColor(200, 200, 200); doc.line(15, y, 195, y); y += 4;
      doc.setFont('helvetica', 'normal');
      S.bienes.forEach(function (b, i) {
        if (y > 280) { doc.addPage(); y = 20; }
        var desc = doc.splitTextToSize(b.descripcion, 88);
        doc.text(String(i + 1), cols[0], y); doc.text(b.codigo || '-', cols[1], y); doc.text(b.codSunat || '-', cols[2], y);
        doc.text(desc, cols[3], y); doc.text(b.unidad, cols[4], y); doc.text(String(b.cantidad), cols[5], y);
        y += 4.4 * desc.length + 1.5;
      });
      if (S.observaciones) { y += 3; titulo('OBSERVACIONES'); linea('', S.observaciones); }
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.text('Representación impresa de la Guía de Remisión Electrónica Remitente - Simulador LABORATORIO TRIBUTARIO CERTUS', 105, 290, { align: 'center' });

      if (modo === 'imprimir') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(e.ruc + '-09-' + S.emitida.numero + '.pdf');
      }
    }
    if (window.jspdf) build();
    else {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = build;
      s.onerror = function () { alert('No se pudo cargar el generador de PDF (sin conexión).'); };
      document.head.appendChild(s);
    }
  }

  // ============================================================ AYUDA
  var AYUDAS = {
    docs: 'Registra el comprobante que sustenta el traslado (factura, boleta, ticket) o la constancia de depósito del SPOT / IVAP. Es opcional, pero en una venta se recomienda relacionar la factura o boleta emitida.',
    bienes: 'Agrega cada bien con su descripción, unidad de medida y cantidad. Marca "Bien normalizado" para bienes afectos al SPOT o IVAP (azúcar, arroz, alcohol) y elige su subpartida nacional. Al final indica el peso bruto total de la carga.',
    puntos: 'El punto de partida es donde se inicia el traslado (normalmente tu domicilio fiscal o un establecimiento anexo). El punto de llegada es donde se entregan los bienes. No pueden ser la misma dirección.',
    transporte: 'Transporte privado: el remitente traslada con sus propios vehículos; registra placa(s) y conductor(es). Transporte público: contrata a una empresa de transporte; registra su RUC y número MTC. Si el vehículo es categoría M1 o L, basta con la placa.'
  };

  // ============================================================ NAVEGACIÓN
  function ir(n) {
    for (var i = 1; i <= 7; i++) { var el = $('gre-step-' + i); if (el) el.style.display = (i === n) ? 'block' : 'none'; }
    document.querySelectorAll('.gre-motivo-lbl').forEach(function (p) { p.textContent = 'Motivo: ' + motivo(); });
    if (n === 3) { renderDocs(); if (!S.avisoSpot) { S.avisoSpot = true; abrir('gre-modal-spot'); } }
    if (n === 4) renderBienes();
    if (n === 5) renderPuntos();
    if (n === 6) renderTransporte();
    if (n === 7) renderPreview();
    var w = $('emision-gre-wrapper'); if (w && w.scrollIntoView) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Desde el paso 2 (Actores) del HTML principal
  function desdeActores() {
    var lista = (typeof greDestinatarios !== 'undefined') ? greDestinatarios : [];
    if (!lista.length) { alert('Agrega un destinatario para continuar.'); return; }
    var sel = document.querySelector('input[name="gre-destinatario-selected"]:checked');
    S.destinatario = lista[sel ? +sel.value : 0];
    ir(3);
  }

  function siguiente(n) {
    if (n === 4 && $('gre-step4-sig').disabled) return;
    if (n === 5 && $('gre-step5-sig').disabled) return;
    if (n === 6 && $('gre-step6-sig').disabled) return;
    ir(n + 1);
  }

  function quitar(tipo, i) {
    if (tipo === 'transportista') S.transportista = null; else S[tipo].splice(i, 1);
    if (tipo === 'docs') renderDocs();
    else if (tipo === 'bienes') renderBienes();
    else renderTransporte();
  }

  function reiniciar() {
    S = estadoInicial();
    if (typeof greDestinatarios !== 'undefined') greDestinatarios.length = 0;
    if (!$('gre-step-3')) return;
    ['gre-peso', 'gre-obs', 'gre-m1l-placa', 'gre-fecha-traslado'].forEach(function (id) { $(id).value = ''; });
    $('gre-peso-um').value = '';
    ['gre-transbordo', 'gre-m1l', 'gre-reg-veh-transp', 'gre-ret-envases', 'gre-ret-vacio'].forEach(function (id) { $(id).checked = false; });
    ir(1);
  }

  function nueva() {
    cerrar('gre-modal-ok');
    reiniciar();
    if (typeof showEmisionGRE === 'function') showEmisionGRE();
  }

  // ============================================================ ARRANQUE
  function montar() {
    var paso2 = $('gre-step-2');
    if (!paso2 || $('gre-step-3')) return;
    paso2.insertAdjacentHTML('afterend',
      paso(3, HTML_PASO3) + paso(4, HTML_PASO4) + paso(5, HTML_PASO5) + paso(6, HTML_PASO6) + paso(7, HTML_PASO7));
    modal('gre-modal-spot', 'Atención Contribuyente', HTML_MODAL_SPOT, 520);
    modal('gre-modal-doc', 'Agregar Documento', HTML_MODAL_DOC, 620);
    modal('gre-modal-ver', 'Documento relacionado', '<div class="gre-ver-cuerpo"></div>', 560);
    modal('gre-modal-bien', 'Agregar Bien', HTML_MODAL_BIEN, 640);
    modal('gre-modal-lista', 'Lista de bienes normalizados', HTML_MODAL_LISTA, 680);
    modal('gre-modal-punto', 'Punto de partida', HTML_MODAL_PUNTO, 680);
    modal('gre-modal-veh', 'Agregar Vehículo', HTML_MODAL_VEH, 620);
    modal('gre-modal-cond', 'Agregar Conductor', HTML_MODAL_COND, 620);
    modal('gre-modal-tr', 'Agregar Transportista', HTML_MODAL_TRANSP, 640);
    modal('gre-modal-aut', 'Autorización especial', HTML_MODAL_AUT, 600);
    modal('gre-modal-frec', 'Frecuentes', HTML_MODAL_FREC, 600);
    modal('gre-modal-conf', 'Emitir Guía de Remisión', HTML_MODAL_CONF, 500);
    modal('gre-modal-ok', 'Guía de Remisión Electrónica emitida', HTML_MODAL_OK, 560);
    $('gre-modal-ok').querySelector('button[onclick^="GRE.cerrar"]').style.display = 'none';
  }

  window.GRE = {
    ir: ir, siguiente: siguiente, desdeActores: desdeActores, reiniciar: reiniciar, nueva: nueva,
    abrir: abrir, cerrar: cerrar, quitar: quitar,
    ayuda: function (k) { alert(AYUDAS[k] || ''); },
    abrirDoc: function () {
      $('gre-doc-tipo').value = ''; $('gre-doc-serie').value = ''; $('gre-doc-num').value = '';
      docTipo(); mostrarError('gre-doc-err', ''); abrir('gre-modal-doc');
    },
    docTipo: docTipo, agregarDoc: agregarDoc, verDoc: verDoc,
    abrirBien: abrirBien, bienNorm: bienNorm, bienSubp: bienSubp, agregarBien: agregarBien, validar4: validar4,
    abrirPunto: abrirPunto, puntoOpcion: puntoOpcion, puntoBuscarRuc: puntoBuscarRuc, puntoUbigeo: puntoUbigeo,
    agregarPunto: agregarPunto, quitarPunto: function (k) { S[k] = null; renderPuntos(); },
    modalidad: modalidad, validar6: renderTransporte,
    abrirVehiculo: abrirVehiculo, agregarVehiculo: agregarVehiculo,
    abrirConductor: abrirConductor, condBuscar: condBuscar, agregarConductor: agregarConductor,
    abrirTransportista: abrirTransportista, trBuscar: trBuscar, agregarTransportista: agregarTransportista,
    abrirAutorizacion: abrirAutorizacion, agregarAutorizacion: agregarAutorizacion,
    verFrecuentes: verFrecuentes, usarFrecuente: usarFrecuente,
    confirmarEmision: confirmarEmision, emitir: emitir, pdf: pdf, correo: correo,
    estado: function () { return S; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();

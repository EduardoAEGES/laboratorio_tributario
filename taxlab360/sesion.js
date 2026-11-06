/* ============================================================================
 * TAXLAB 360 - Control de sesion, roles y permisos
 * ----------------------------------------------------------------------------
 * PUERTA 1: usuario + contrasena propios  -> quien eres y que puedes hacer
 * PUERTA 2: RUC + SIST + NORTON           -> con que empresa trabajas
 *
 * Cargar DESPUES de auth.js:
 *   <script src="auth.js"></script>
 *   <script src="sesion.js"></script>
 * ==========================================================================*/
(function () {
  'use strict';

  var SB_URL = 'https://klmjmlhwuzhymrplemgw.supabase.co';
  var SB_KEY = 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b';
  var cli = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      cli = window.authSupabaseClient || window.supabase.createClient(SB_URL, SB_KEY);
    }
  } catch (e) { console.warn('[sesion] Supabase no disponible', e); }

  // --------------------------------------------------------------- destinos
  // Que modulo corresponde a cada enlace de la portada y del portal SOL
  var MAPA = [
    [/dinamica\/index\.html/i,      'plan_contable'],
    [/declaraciones\.html/i,        'fv621'],
    [/renta\.html/i,                'fv710'],
    [/tramites\.html/i,             'tramites'],
    [/rvie\.html/i,                 'rvie'],
    [/rce\.html/i,                  'rce'],
    [/comprobantes\.html/i,         'see_sol'],
    [/tregistro\.html/i,            'tregistro'],
    [/reemplazo\.html/i,            'reemplazo'],
    [/ajustes\.html/i,              'ajustes'],
    [/afpnet\.com\.pe/i,            'afpnet'],
    [/(^|\/)sol\.html/i,            'sol'],
    [/(^|\/)gestor\.html/i,         'gestor_usuarios']
  ];

  function moduloDe(href) {
    if (!href) return null;
    // login.html?redirect=xxx es la PUERTA 2, no el gestor: manda el destino
    var m = href.match(/login\.html\?.*redirect=([^&]+)/i);
    if (m) return moduloDe(decodeURIComponent(m[1]));
    for (var i = 0; i < MAPA.length; i++) {
      if (MAPA[i][0].test(href)) return MAPA[i][1];
    }
    return null;
  }

  // ------------------------------------------------------------ sesion base
  function leer() {
    try { return JSON.parse(sessionStorage.getItem('sunat_auth') || 'null'); }
    catch (e) { return null; }
  }
  function escribir(s) { sessionStorage.setItem('sunat_auth', JSON.stringify(s)); }

  var Sesion = {
    hay: function () { var s = leer(); return !!(s && (s.usuario_id || s.id)); },
    uid: function () { var s = leer() || {}; return s.usuario_id || s.id || null; },
    datos: function () { return leer() || {}; },
    rol: function () { return String((leer() || {}).rol || '').toUpperCase(); },

    /** Modulos permitidos segun la matriz roles_permisos */
    modulos: function () {
      var s = leer() || {};
      return (s.modulos || []).map(function (m) { return m.clave; });
    },
    puede: function (modulo) {
      if (!modulo) return true;               // enlaces sin modulo asociado
      if (!this.hay()) return false;
      return this.modulos().indexOf(modulo) !== -1;
    },
    /** true = todo lo que haga es demostracion, no se guarda */
    esDemo: function () { return !!(leer() || {}).modo_demo; },
    puedeGuardar: function () { return !!(leer() || {}).puede_guardar; },
    empresasPermitidas: function () { return (leer() || {}).empresas || []; },

    // ------------------------------------------------------ PUERTA 1: login
    login: async function (usuario, clave) {
      if (!cli) return { ok: false, mensaje: 'Sin conexion con el servidor.' };
      var r = await cli.rpc('fn_login', { p_usuario: usuario, p_clave: clave });
      if (r.error) return { ok: false, mensaje: r.error.message };
      var res = r.data || {};
      if (res.ok) { escribir(res.sesion); }
      return res;
    },

    // ------------------------------------------ ACCESO DIRECTO MASTER
    // Entra como MASTER (usuario ADMIN) validando una clave fija en el
    // frontend, sin pedir usuario. NO pasa por fn_login: trae la sesion
    // viva con fn_permisos, asi los modulos y empresas siempre estan al
    // dia aunque cambie la base. Pensado para el docente/administrador.
    // Nota: la clave vive en el codigo del navegador (publico); es solo
    // una puerta de conveniencia para el aula, no una barrera real.
    MASTER_ID: 2,          // id del usuario ADMIN (rol MASTER)
    MASTER_CLAVE: '200192',
    entrarMaster: async function (clave) {
      if (String(clave == null ? '' : clave).trim() !== this.MASTER_CLAVE) {
        return { ok: false, mensaje: 'Clave MASTER incorrecta.' };
      }
      if (!cli) return { ok: false, mensaje: 'Sin conexion con el servidor.' };
      var r = await cli.rpc('fn_permisos', { p_usuario: this.MASTER_ID });
      if (r.error) return { ok: false, mensaje: r.error.message };
      var s = r.data || {};
      if (!s || s.error || String(s.rol || '').toUpperCase() !== 'MASTER') {
        return { ok: false, mensaje: 'No se pudo obtener la sesion MASTER.' };
      }
      escribir(s);
      return { ok: true, sesion: s };
    },

    // datos = { nombres, apellido_paterno, apellido_materno, correo, telefono }
    registrar: async function (usuario, clave, datos) {
      if (!cli) return { ok: false, mensaje: 'Sin conexion con el servidor.' };
      datos = datos || {};
      var r = await cli.rpc('fn_registrar_usuario', {
        p_usuario: usuario,
        p_clave: clave,
        p_nombres: datos.nombres || null,
        p_apellido_paterno: datos.apellido_paterno || null,
        p_apellido_materno: datos.apellido_materno || null,
        p_correo: datos.correo || null,
        p_telefono: datos.telefono || null
      });
      if (r.error) return { ok: false, mensaje: r.error.message };
      var res = r.data || {};
      if (res.ok) { escribir(res.sesion); }
      return res;
    },

    refrescar: async function () {
      var s = leer(); if (!s || !cli) return;
      var r = await cli.rpc('fn_permisos', { p_usuario: this.uid() });
      if (!r.error && r.data && !r.data.error) escribir(r.data);
    },

    salir: function () {
      sessionStorage.removeItem('sunat_auth');
      sessionStorage.removeItem('sunat_empresa');
      window.location.href = 'index.html';
    },

    // -------------------------------------------------- PUERTA 2: Clave SOL
    // MODO PÚBLICO (TAXLAB 360): la Clave SOL se valida localmente (Usuario SIST /
    // Contraseña NORTON) y el RUC se busca en empresas_simulador (lectura pública
    // en Supabase, con respaldo en window.EMPRESAS_TAXLAB). No requiere sesión de
    // plataforma ni el RPC fn_login_clave_sol.
    claveSol: async function (ruc, usuario, clave, modulo) {
      ruc = String(ruc || '').trim();
      var u = String(usuario || '').trim().toUpperCase();
      var c = String(clave || '').trim().toUpperCase();
      if (u !== 'SIST' || c !== 'NORTON') {
        return { ok: false, mensaje: 'Clave SOL incorrecta. Usa Usuario: SIST y Contraseña: NORTON.' };
      }
      var emp = null;
      try {
        if (cli) {
          var r = await cli.from('empresas_simulador')
            .select('ruc, razon_social, regimen_tributario, actividad_economica_sunat, regimen_laboral')
            .eq('ruc', ruc).maybeSingle();
          if (!r.error && r.data) emp = r.data;
        }
      } catch (e) { /* sin conexión: se usa el respaldo local */ }
      if (!emp) {
        emp = (window.EMPRESAS_TAXLAB || []).filter(function (x) { return x.ruc === ruc; })[0] || null;
      }
      if (!emp) {
        return { ok: false, motivo: 'RUC_NO_EXISTE',
                 mensaje: 'El RUC ' + ruc + ' no corresponde a ninguna empresa del laboratorio. ' +
                 'Abre "Ver empresas" (gato, abajo a la derecha) para ver los RUC disponibles.' };
      }
      sessionStorage.setItem('sunat_empresa', JSON.stringify(emp));
      return { ok: true, empresa: emp };
    },
    /** Clave SOL con un RUC que NO está en el laboratorio: ingreso temporal
     *  (solo en esta computadora; no crea la empresa). */
    claveSolTemporal: async function (ruc, usuario, clave, modulo, razonSocial, direccion) {
      ruc = String(ruc || '').trim();
      var razon = String(razonSocial || '').trim().replace(/\s+/g, ' ').toUpperCase();
      if (String(usuario || '').trim().toUpperCase() !== 'SIST' || String(clave || '').trim().toUpperCase() !== 'NORTON') {
        return { ok: false, mensaje: 'Clave SOL incorrecta. Usa Usuario: SIST y Contraseña: NORTON.' };
      }
      if (!/^(10|15|17|20)\d{9}$/.test(ruc)) {
        return { ok: false, mensaje: 'El RUC debe tener 11 dígitos y empezar con 10 (persona natural) o 20 (empresa). Revisa el número.' };
      }
      if (razon.length < 3) {
        return { ok: false, mensaje: 'Escribe la razón social (o los apellidos y nombres) del contribuyente.' };
      }
      var emp = { ruc: ruc, razon_social: razon, nombre_comercial: razon,
                  regimen: /^10/.test(ruc) ? 'Renta de Cuarta Categoria' : 'Regimen General',
                  cod_empresa: 'TEMP', direccion: String(direccion || '').trim().toUpperCase() || null, temporal: true };
      sessionStorage.setItem('sunat_empresa', JSON.stringify(emp));
      return { ok: true, empresa: emp };
    },
    esTemporal: function () { return !!(this.empresa() || {}).temporal; },
    empresa: function () {
      try { return JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null'); }
      catch (e) { return null; }
    },
    ruc: function () { return (this.empresa() || {}).ruc || null; },

    // ------------------------------------------------ avance por usuario+ruc
    /** Namespace de localStorage: sim_<usuario>_<ruc>_<clave> */
    ns: function (clave) {
      var s = leer() || {};
      return 'sim_' + (this.uid() || 'anon') + '_' + (this.ruc() || 'sinruc') + '_' + clave;
    },

    guardarAvance: async function (modulo, estado) {
      if (!this.puedeGuardar()) return { ok: false, demo: true };
      var r = await cli.rpc('fn_guardar_avance', {
        p_usuario: this.uid(), p_ruc: this.ruc(), p_modulo: modulo, p_estado: estado
      });
      return r.error ? { ok: false, mensaje: r.error.message } : { ok: true };
    },

    leerAvance: async function (modulo) {
      var s = leer(); if (!s || !cli) return null;
      var q = cli.from('avance_usuario').select('modulo, estado')
                 .eq('usuario_id', this.uid()).eq('ruc', this.ruc());
      if (modulo) q = q.eq('modulo', modulo);
      var r = await q;
      return r.error ? null : r.data;
    },

    reiniciar: async function (objetivoId, ruc, motivo) {
      var r = await cli.rpc('fn_reiniciar_avance', {
        p_actor: this.uid(), p_objetivo: objetivoId || this.uid(),
        p_ruc: ruc || null, p_motivo: motivo || null
      });
      return r.error ? { ok: false, mensaje: r.error.message } : { ok: true, detalle: r.data };
    }
  };

  // ======================================================== CARTELES Y GUARD

  var CSS = [
    '.tl-bloqueado{position:relative;filter:grayscale(85%);opacity:.55;cursor:not-allowed!important}',
    '.tl-bloqueado::after{content:"\\f023";font-family:"Font Awesome 5 Free";font-weight:900;',
    'position:absolute;top:6px;right:10px;font-size:13px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5)}',
    '.tl-cartel{position:fixed;left:50%;transform:translateX(-50%);z-index:99999;max-width:520px;',
    'background:#1E395B;color:#fff;padding:14px 20px;border-radius:10px;font-family:Roboto,sans-serif;',
    'font-size:14px;line-height:1.45;box-shadow:0 10px 30px rgba(0,0,0,.35);top:24px;display:flex;',
    'gap:12px;align-items:flex-start}',
    '.tl-cartel b{display:block;margin-bottom:3px;font-size:15px}',
    '.tl-cartel button{margin-left:auto;background:none;border:none;color:#9EC5FF;font-size:18px;cursor:pointer}',
    '.tl-cinta{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#B45309;color:#fff;',
    'text-align:center;padding:7px 14px;font-family:Roboto,sans-serif;font-size:13px;font-weight:600;',
    'letter-spacing:.3px;box-shadow:0 -2px 10px rgba(0,0,0,.25)}',
    '.tl-cinta span{opacity:.9;font-weight:400}'
  ].join('');

  function inyectarCss() {
    if (document.getElementById('tl-css')) return;
    var st = document.createElement('style');
    st.id = 'tl-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  var cartelTimer = null;
  function cartel(titulo, texto) {
    inyectarCss();
    var old = document.getElementById('tl-cartel');
    if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'tl-cartel'; d.className = 'tl-cartel';
    d.innerHTML = '<i class="fas fa-lock" style="margin-top:2px"></i><div><b>' + titulo +
                  '</b>' + texto + '</div><button title="Cerrar">&times;</button>';
    d.querySelector('button').onclick = function () { d.remove(); };
    document.body.appendChild(d);
    clearTimeout(cartelTimer);
    cartelTimer = setTimeout(function () { if (d.parentNode) d.remove(); }, 7000);
  }
  Sesion.cartel = cartel;

  function cintaDemo() {
    if (!Sesion.esDemo() || document.getElementById('tl-cinta')) return;
    inyectarCss();
    var rol = Sesion.rol();
    var d = document.createElement('div');
    d.id = 'tl-cinta'; d.className = 'tl-cinta';
    d.innerHTML = '<i class="fas fa-flask"></i> MODO DEMOSTRACION (' + rol + ') ' +
                  '<span>&mdash; puedes simular todo, pero tu avance no se guarda al salir.</span>';
    document.body.appendChild(d);
  }

  function pedirLogin(destino) {
    if (typeof window.mostrarModalLogin === 'function') {
      window.mostrarModalLogin(destino || '', function () { location.reload(); });
    } else {
      sessionStorage.setItem('loginReferrer', destino || '');
      window.location.href = 'login.html';
    }
  }
  Sesion.pedirLogin = pedirLogin;

  // Recorre los enlaces de la pagina y bloquea lo que no corresponde
  function aplicarGuard() {
    inyectarCss();
    var logueado = Sesion.hay();
    var rol = Sesion.rol();

    var nodos = document.querySelectorAll('a[href], [data-modulo]');
    Array.prototype.forEach.call(nodos, function (el) {
      var modulo = el.getAttribute('data-modulo') || moduloDe(el.getAttribute('href'));
      if (!modulo) return;
      if (modulo === 'plan_contable' && !logueado) { /* tambien exige sesion */ }

      // --- sin sesion: nada se abre, solo un aviso breve (sin abrir el modal)
      if (!logueado) {
        el.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          if (typeof window.mostrarAvisoLogin === 'function') {
            window.mostrarAvisoLogin('Debe iniciar sesion para usar el laboratorio.');
          } else {
            cartel('Necesitas iniciar sesion',
                   'Ingresa con tu usuario y contrasena para usar el laboratorio.');
          }
        }, true);
        return;
      }

      // --- con sesion pero sin permiso para ese modulo
      if (!Sesion.puede(modulo)) {
        el.classList.add('tl-bloqueado');
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('title', 'No disponible para el perfil ' + rol);
        el.addEventListener('click', function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          cartel('Aplicativo no disponible para tu perfil',
                 'Tu cuenta <b style="display:inline">' + rol + '</b> no incluye este modulo. ' +
                 (rol === 'INVITADO'
                   ? 'Como invitado puedes usar la Dinamica del Plan Contable y el Formulario Virtual 621 ' +
                     'con la empresa demo. Para lo demas, pide a tu docente que te matricule como estudiante.'
                   : 'Solicita el acceso a tu docente o al administrador.'));
        }, true);
      }
    });

    cintaDemo();
  }

  // Protege la pagina en la que estamos (por si entran escribiendo la URL)
  function guardDePagina() {
    var archivo = (location.pathname.split('/').pop() || 'index.html');
    var libres = ['index.html', 'login.html', ''];
    if (libres.indexOf(archivo) !== -1) return;

    if (!Sesion.hay()) {
      sessionStorage.setItem('loginReferrer', archivo + location.search);
      window.location.replace('index.html?login=1');
      return;
    }
    var modulo = moduloDe(archivo);
    if (modulo && !Sesion.puede(modulo)) {
      sessionStorage.setItem('tl_bloqueo', modulo);
      window.location.replace('index.html');
    }
  }

  function avisoDeBloqueoPrevio() {
    var m = sessionStorage.getItem('tl_bloqueo');
    if (!m) return;
    sessionStorage.removeItem('tl_bloqueo');
    cartel('Aplicativo no disponible para tu perfil',
           'Intentaste abrir un modulo que tu rol ' + Sesion.rol() + ' no tiene habilitado.');
  }

  // Si llegamos con ?login=1 (por intentar abrir algo sin sesion) solo avisamos.
  // El modal de acceso se abre unicamente con el boton "Iniciar Sesion".
  function loginAutomatico() {
    if (!/[?&]login=1/.test(location.search) || Sesion.hay()) return;
    if (typeof window.mostrarAvisoLogin === 'function') {
      window.mostrarAvisoLogin('Debe iniciar sesion para abrir ese aplicativo.');
    } else {
      cartel('Necesitas iniciar sesion',
             'Ingresa con tu usuario y contrasena para abrir ese aplicativo.');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    guardDePagina();
    aplicarGuard();
    avisoDeBloqueoPrevio();
    loginAutomatico();
  });

  window.Sesion = Sesion;
  window.moduloDeDestino = moduloDe;
})();

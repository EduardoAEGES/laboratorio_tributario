/* ============================================================================
 * Gestor de usuarios - solo DOCENTE y MASTER
 *   DOCENTE : sus secciones, matricular / retirar y reiniciar a sus estudiantes
 *   MASTER  : todo lo anterior sobre cualquier usuario, y cambio de rol
 * ==========================================================================*/
(function () {
  'use strict';

  var cli = window.authSupabaseClient;
  var YO = null;                 // { usuario_id, rol, ... }
  var ROLES = ['INVITADO', 'ESTUDIANTE', 'ASISTENTE', 'PRO', 'DOCENTE', 'PRUEBA', 'MASTER'];

  function aviso(texto, tipo) {
    var d = document.getElementById('aviso');
    d.className = 'aviso ' + (tipo || 'ok');
    d.innerHTML = '<i class="fas fa-' + (tipo === 'err' ? 'exclamation-triangle' : 'check-circle') +
                  '"></i> ' + texto;
    d.style.display = 'block';
    clearTimeout(aviso._t);
    aviso._t = setTimeout(function () { d.style.display = 'none'; }, 6000);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fecha(f) {
    if (!f) return '<span class="mini">nunca</span>';
    var d = new Date(f);
    return d.toLocaleDateString('es-PE') + ' ' +
           d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  // ------------------------------------------------------------- arranque
  document.addEventListener('DOMContentLoaded', async function () {
    if (!window.Sesion || !window.Sesion.hay()) {
      sessionStorage.setItem('loginReferrer', 'gestor.html');
      window.location.replace('index.html?login=1');
      return;
    }
    YO = window.Sesion.datos();
    if (!YO.puede_gestionar_alumnos) {
      document.querySelector('.wrap').innerHTML =
        '<div class="card"><h2><i class="fas fa-lock"></i> Sin permiso</h2>' +
        '<div class="vacio">El perfil <b>' + esc(YO.rol) + '</b> no puede gestionar usuarios.<br><br>' +
        'Esta pantalla es solo para <b>DOCENTE</b> y <b>MASTER</b>.<br><br>' +
        '<a class="btn btn-p" style="text-decoration:none" href="index.html">Volver al inicio</a></div></div>';
      return;
    }
    document.getElementById('quien').innerHTML =
      esc(YO.denominacion || YO.usuario) + ' &middot; <b>' + esc(YO.rol) + '</b>';

    llenarEmpresas();
    await cargarSecciones();
    await cargarUsuarios();
  });

  function llenarEmpresas() {
    var sel = document.getElementById('r-empresa');
    (YO.empresas || []).forEach(function (e) {
      var o = document.createElement('option');
      o.value = e.ruc; o.textContent = e.ruc + ' - ' + e.razon_social;
      sel.appendChild(o);
    });
  }

  // ------------------------------------------------------------ secciones
  async function cargarSecciones() {
    var r = await cli.rpc('fn_mis_secciones', { p_actor: YO.usuario_id });
    var cont = document.getElementById('tabla-secciones');
    var sel = document.getElementById('m-seccion');
    sel.innerHTML = '';
    if (r.error || !r.data || !r.data.ok) {
      cont.innerHTML = '<div class="vacio">No se pudieron cargar las secciones.</div>';
      return;
    }
    var secs = r.data.secciones || [];
    if (!secs.length) {
      cont.innerHTML = '<div class="vacio">Todavía no tienes secciones. Crea la primera arriba.</div>';
      sel.innerHTML = '<option value="">-- crea una sección primero --</option>';
      return;
    }
    var h = '<table><tr><th>Sección</th><th>Curso</th><th>Ciclo</th><th>Código</th>' +
            '<th>Alumnos</th><th>Acciones</th></tr>';
    secs.forEach(function (s) {
      h += '<tr><td><b>' + esc(s.nombre) + '</b>' +
           (YO.rol === 'MASTER' ? '<div class="mini">docente: ' + esc(s.docente) + '</div>' : '') +
           '</td><td>' + esc(s.curso || '-') + '</td><td>' + esc(s.ciclo || '-') + '</td>' +
           '<td><span class="codigo">' + esc(s.codigo) + '</span></td>' +
           '<td>' + s.alumnos + '</td>' +
           '<td><button class="btn btn-w" onclick="reiniciarSeccion(' + s.id + ',\'' +
           esc(s.nombre) + '\')"><i class="fas fa-undo"></i> Reiniciar sección</button></td></tr>';
      sel.innerHTML += '<option value="' + s.id + '">' + esc(s.nombre) +
                       (s.curso ? ' - ' + esc(s.curso) : '') + '</option>';
    });
    cont.innerHTML = h + '</table>';
  }

  window.crearSeccion = async function () {
    var n = document.getElementById('s-nombre').value.trim();
    if (!n) { aviso('Escribe el nombre de la sección.', 'err'); return; }
    var r = await cli.rpc('fn_crear_seccion', {
      p_docente: YO.usuario_id, p_nombre: n,
      p_curso: document.getElementById('s-curso').value.trim() || null,
      p_ciclo: document.getElementById('s-ciclo').value.trim() || null
    });
    if (r.error) { aviso(r.error.message, 'err'); return; }
    aviso('Sección creada. Código de matrícula: <b>' + esc(r.data.codigo_matricula) + '</b>');
    document.getElementById('s-nombre').value = '';
    document.getElementById('s-curso').value = '';
    document.getElementById('s-ciclo').value = '';
    cargarSecciones();
  };

  window.matricular = async function () {
    var sec = document.getElementById('m-seccion').value;
    var usr = document.getElementById('m-usuario').value.trim();
    if (!sec || !usr) { aviso('Elige la sección y escribe el usuario del alumno.', 'err'); return; }
    var r = await cli.rpc('fn_matricular', {
      p_docente: YO.usuario_id, p_seccion: Number(sec), p_usuario: usr
    });
    if (r.error) { aviso(r.error.message, 'err'); return; }
    aviso('<b>' + esc(usr) + '</b> quedó matriculado con el rol ' + esc(r.data.rol) + '.');
    document.getElementById('m-usuario').value = '';
    cargarSecciones(); cargarUsuarios();
  };

  window.retirar = async function (usuario) {
    var sec = document.getElementById('m-seccion').value;
    if (!sec) { aviso('Elige primero la sección de la que quieres retirarlo.', 'err'); return; }
    if (!confirm('¿Retirar a ' + usuario + ' de la sección seleccionada?\n\n' +
                 'Su avance NO se borra, solo deja de estar a tu cargo.')) return;
    var r = await cli.rpc('fn_retirar_matricula', {
      p_docente: YO.usuario_id, p_seccion: Number(sec), p_usuario: usuario
    });
    if (r.error) { aviso(r.error.message, 'err'); return; }
    aviso(esc(usuario) + ' fue retirado de la sección.');
    cargarSecciones(); cargarUsuarios();
  };

  window.reiniciarSeccion = async function (id, nombre) {
    var ruc = document.getElementById('r-empresa').value || null;
    if (!confirm('¿Reiniciar el avance de TODOS los alumnos de "' + nombre + '"?\n\n' +
                 'Empresa: ' + (ruc || 'TODAS') + '\nEsta acción no se puede deshacer.')) return;
    var r = await cli.rpc('fn_reiniciar_seccion', {
      p_actor: YO.usuario_id, p_seccion: id, p_ruc: ruc,
      p_motivo: 'Reinicio de seccion desde el gestor'
    });
    if (r.error) { aviso(r.error.message, 'err'); return; }
    aviso('Se reinició a ' + r.data.estudiantes_reiniciados + ' alumno(s) de "' + esc(nombre) + '".');
    cargarUsuarios();
  };

  // ------------------------------------------------------------- usuarios
  window.cargarUsuarios = async function () {
    var q = document.getElementById('q').value.trim();
    var r = await cli.rpc('fn_listar_usuarios', {
      p_actor: YO.usuario_id, p_busqueda: q || null
    });
    var cont = document.getElementById('tabla-usuarios');
    if (r.error || !r.data || !r.data.ok) {
      cont.innerHTML = '<div class="vacio">' +
        esc((r.data && r.data.mensaje) || 'No se pudieron cargar los usuarios.') + '</div>';
      return;
    }
    var us = r.data.usuarios || [];
    if (!us.length) {
      cont.innerHTML = '<div class="vacio">' + (q
        ? 'Ningún usuario coincide con "' + esc(q) + '".'
        : 'Todavía no tienes estudiantes matriculados. Búscalos por su usuario para matricularlos.') +
        '</div>';
      return;
    }
    var h = '<table><tr><th>Usuario</th><th>Perfil</th><th>Secciones</th><th>Avance</th>' +
            '<th>Último acceso</th><th>Acciones</th></tr>';
    us.forEach(function (u) {
      var puedo = u.mio;
      h += '<tr><td><b>' + esc(u.usuario) + '</b>' +
           '<div class="mini">' + esc(u.denominacion || '') + (u.activo ? '' : ' · <b>inactivo</b>') +
           '</div></td>' +
           '<td>' + (YO.rol === 'MASTER'
             ? '<select onchange="cambiarRol(' + u.id + ',this.value)">' +
               ROLES.map(function (x) {
                 return '<option ' + (x === u.rol ? 'selected' : '') + '>' + x + '</option>';
               }).join('') + '</select>'
             : '<span class="chip r-' + esc(u.rol) + '">' + esc(u.rol) + '</span>') + '</td>' +
           '<td class="mini">' + ((u.secciones || []).map(esc).join(', ') || '-') + '</td>' +
           '<td class="mini">' + u.avance + ' módulo(s)<br>' + u.declaraciones + ' declaración(es)</td>' +
           '<td class="mini">' + fecha(u.ultimo_acceso) + '</td>' +
           '<td>' +
             '<button class="btn btn-w" ' + (puedo ? '' : 'disabled') +
               ' onclick="reiniciarUsuario(' + u.id + ',\'' + esc(u.usuario) + '\')">' +
               '<i class="fas fa-undo"></i> Reiniciar</button> ' +
             '<button class="btn btn-d" ' + (puedo && u.id !== YO.usuario_id ? '' : 'disabled') +
               ' onclick="retirar(\'' + esc(u.usuario) + '\')">' +
               '<i class="fas fa-user-minus"></i> Retirar</button>' +
             (YO.rol === 'MASTER' && u.id !== YO.usuario_id
               ? ' <button class="btn btn-s" onclick="activar(' + u.id + ',' + (!u.activo) + ')">' +
                 '<i class="fas fa-power-off"></i> ' + (u.activo ? 'Desactivar' : 'Activar') + '</button>'
               : '') +
           '</td></tr>';
    });
    cont.innerHTML = h + '</table>';
  };

  window.reiniciarUsuario = async function (id, usuario) {
    var ruc = document.getElementById('r-empresa').value || null;
    if (!confirm('¿Reiniciar el avance de ' + usuario + '?\n\nEmpresa: ' + (ruc || 'TODAS') +
                 '\nSe borran sus declaraciones y movimientos. No se puede deshacer.')) return;
    var r = await window.Sesion.reiniciar(id, ruc, 'Reinicio desde el gestor de usuarios');
    if (!r.ok) { aviso(r.mensaje, 'err'); return; }
    var d = r.detalle;
    aviso('Avance de <b>' + esc(usuario) + '</b> reiniciado: ' + d.avance_usuario +
          ' módulo(s), ' + d.declaraciones + ' declaración(es), ' + d.movimientos +
          ' movimiento(s). Empresa: ' + esc(d.ruc) + '.');
    cargarUsuarios();
  };

  window.cambiarRol = async function (id, rol) {
    var r = await cli.rpc('fn_cambiar_rol', {
      p_actor: YO.usuario_id, p_objetivo: id, p_rol: rol
    });
    if (r.error || !r.data.ok) {
      aviso((r.error && r.error.message) || r.data.mensaje, 'err'); cargarUsuarios(); return;
    }
    aviso('Rol actualizado a <b>' + esc(rol) + '</b>.');
    cargarUsuarios();
  };

  window.activar = async function (id, activo) {
    var r = await cli.rpc('fn_activar_usuario', {
      p_actor: YO.usuario_id, p_objetivo: id, p_activo: activo
    });
    if (r.error || !r.data.ok) {
      aviso((r.error && r.error.message) || r.data.mensaje, 'err'); return;
    }
    aviso('Cuenta ' + (activo ? 'activada' : 'desactivada') + '.');
    cargarUsuarios();
  };
})();

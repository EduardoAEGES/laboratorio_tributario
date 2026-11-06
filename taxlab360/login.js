document.addEventListener('DOMContentLoaded', () => {
    const modeLogin = document.getElementById('mode-login');
    const modeRegister = document.getElementById('mode-register');
    const loginSubtitle = document.getElementById('login-subtitle');
    
    const rucField = document.getElementById('ruc-field');
    const userField = document.getElementById('user-field');
    const passField = document.getElementById('pass-field');
    // Datos personales (registro): la tabla usuarios ya no lleva RUC
    const regFieldsExtra = document.getElementById('reg-fields-extra');
    const nombresField = document.getElementById('nombres-field');
    const paternoField = document.getElementById('paterno-field');
    const maternoField = document.getElementById('materno-field');
    const emailField = document.getElementById('email-field');
    const telefonoField = document.getElementById('telefono-field');
    const chkCapacitacionesBox = document.getElementById('chk-capacitaciones-box');
    const regRoleBox = document.getElementById('reg-role-box');
    const rememberBox = document.getElementById('remember-box');
    const forgotBox = document.getElementById('forgot-box');
    const btnSubmit = document.getElementById('btn-submit-form');
    const togglePass = document.getElementById('toggle-pass');

    let currentMode = 'login'; // 'login' | 'register'

    // Detectar si venimos de un aplicativo (redirect=xxx.html)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    const isClaveSolMode = !!redirectParam; // Modo Clave SOL cuando hay redirect

    // ===== MODO CLAVE SOL (con redirect) =====
    // Ocultar selector de modo completo y mostrar campo RUC
    if (isClaveSolMode) {
        // Ocultar ambos botones de modo (Iniciar Sesión / Registrarse)
        if (modeLogin) modeLogin.parentElement.style.display = 'none';
        // Mostrar campo RUC
        if (rucField) rucField.style.display = 'block';
        // Actualizar textos
        if (loginSubtitle) loginSubtitle.textContent = 'Ingresa los datos de tu Clave SOL';
        if (btnSubmit) btnSubmit.textContent = 'Entrar';

        // Campo del estudiante (su nombre saldrá en los PDF y reportes)
        const estBox = document.getElementById('estudiante-box');
        const estField = document.getElementById('estudiante-field');
        const estSwitch = document.getElementById('estudiante-switch');
        if (estBox) estBox.style.display = 'block';
        if (estField) {
            try {
                const prev = sessionStorage.getItem('taxlab_estudiante');
                if (prev && prev !== 'USER') estField.value = prev;
            } catch (e) {}
            estField.addEventListener('focus', () => { if (estField.value.trim() === 'USER') estField.select(); });
        }
        if (estSwitch && estField) {
            estSwitch.addEventListener('change', () => {
                if (estSwitch.checked) {
                    estField.style.display = 'block';
                    if (!estField.value.trim()) estField.value = 'USER';
                } else {
                    estField.style.display = 'none';
                    estField.value = 'USER';
                }
            });
        }
    }

    // Alternar entre Iniciar Sesión y Registrarse (solo si NO es modo Clave SOL)
    if (modeLogin && modeRegister && !isClaveSolMode) {
        modeLogin.addEventListener('click', () => {
            currentMode = 'login';
            modeLogin.classList.add('active');
            modeLogin.style.background = '#004B91';
            modeLogin.style.color = 'white';
            modeRegister.classList.remove('active');
            modeRegister.style.background = '#ffffff';
            modeRegister.style.color = '#004B91';

            if (loginSubtitle) loginSubtitle.textContent = 'Ingresa tu Usuario y Contraseña';
            if (regFieldsExtra) regFieldsExtra.style.display = 'none';
            if (chkCapacitacionesBox) chkCapacitacionesBox.style.display = 'none';
            if (regRoleBox) regRoleBox.style.display = 'none';
            if (rememberBox) rememberBox.style.display = 'flex';
            if (forgotBox) forgotBox.style.display = 'block';
            if (btnSubmit) btnSubmit.textContent = 'Entrar';
        });

        modeRegister.addEventListener('click', () => {
            currentMode = 'register';
            modeRegister.classList.add('active');
            modeRegister.style.background = '#004B91';
            modeRegister.style.color = 'white';
            modeLogin.classList.remove('active');
            modeLogin.style.background = '#ffffff';
            modeLogin.style.color = '#004B91';

            if (loginSubtitle) loginSubtitle.textContent = 'Registra tu usuario (Rol INVITADO por defecto)';
            if (regFieldsExtra) regFieldsExtra.style.display = 'flex';
            if (chkCapacitacionesBox) chkCapacitacionesBox.style.display = 'block';
            if (regRoleBox) regRoleBox.style.display = 'block';
            if (rememberBox) rememberBox.style.display = 'none';
            if (forgotBox) forgotBox.style.display = 'none';
            if (btnSubmit) btnSubmit.textContent = 'Registrar Cuenta';
        });
    }

    // Mostrar / ocultar contraseña
    if (togglePass && passField) {
        togglePass.addEventListener('click', () => {
            const oculto = passField.type === 'password';
            passField.type = oculto ? 'text' : 'password';
            togglePass.setAttribute('aria-label', oculto ? 'Ocultar contraseña' : 'Mostrar contraseña');
            const icono = togglePass.querySelector('i');
            if (icono) {
                icono.classList.toggle('fa-eye', !oculto);
                icono.classList.toggle('fa-eye-slash', oculto);
            }
        });
    }

    // Submit Handler (Login or Register)
    btnSubmit.addEventListener('click', async () => {
        const ruc = rucField ? rucField.value.trim() : '';
        const user = userField.value.trim();
        const pass = passField.value.trim();

        // Get redirect parameter or fallback
        const referrer = sessionStorage.getItem('loginReferrer');
        let redirectUrl = redirectParam || referrer || 'dashboard.html';

        const irADashboard = () => {
            if (referrer) {
                sessionStorage.removeItem('loginReferrer');
            }
            window.location.href = redirectUrl;
        };

        if (currentMode === 'register') {
            // REGISTRO EN SUPABASE (solo disponible sin redirect)
            const nombres = nombresField ? nombresField.value.trim() : '';
            const paterno = paternoField ? paternoField.value.trim() : '';
            const materno = maternoField ? maternoField.value.trim() : '';
            const email = emailField ? emailField.value.trim() : '';
            const telefono = telefonoField ? telefonoField.value.trim() : '';

            if (!user || !pass) {
                alert('Por favor ingrese Usuario y Contraseña para registrarse.');
                return;
            }
            if (!nombres || !paterno || !materno || !email || !telefono) {
                alert('Completa nombres, apellido paterno, apellido materno, correo y teléfono.');
                return;
            }
            if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
                alert('Ingresa un correo electrónico válido.');
                return;
            }
            if (telefono.replace(/\D/g, '').length < 6) {
                alert('Ingresa un número de teléfono válido.');
                return;
            }

            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Registrando...';

            try {
                const datos = {
                    nombres: nombres,
                    apellido_paterno: paterno,
                    apellido_materno: materno,
                    correo: email,
                    telefono: telefono
                };
                const res = window.Sesion
                    ? await window.Sesion.registrar(user, pass, datos)
                    : await registrarUsuarioExtendido('', user, pass, '', 'INVITADO',
                        { nombres, paterno, materno, email, telefono });
                if (res.ok || res.success) {
                    alert('¡Cuenta creada! Entras con el perfil INVITADO: Plan Contable y FV 621 con la empresa demo (RUC 20123456789). Tu avance no se guarda hasta que un docente te matricule como estudiante.');
                    irADashboard();
                } else {
                    alert('No se pudo completar el registro: ' + (res.mensaje || res.error || 'Error desconocido'));
                }
            } catch (err) {
                console.error('Error al registrar usuario:', err);
                alert('Error al conectar con Supabase: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
            }

        } else {
            // INICIO DE SESIÓN
            if (isClaveSolMode) {
                // Modo Clave SOL: requiere RUC + Usuario + Contraseña → tabla 'usuarios'
                if (!ruc || !user || !pass) {
                    alert('Por favor ingrese su RUC, Usuario y Contraseña.');
                    return;
                }
            } else {
                // Modo participantes: requiere Usuario + Contraseña
                if (!user || !pass) {
                    alert('Por favor ingrese su usuario y contraseña.');
                    return;
                }
            }

            btnSubmit.disabled = true;
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.textContent = 'Verificando...';

            try {
                if (isClaveSolMode) {
                    // ---- PUERTA 2: Clave SOL (RUC + SIST + NORTON) ----
                    // Exige haber iniciado sesión antes y valida que el rol
                    // tenga permitido ese RUC y ese aplicativo.
                    if (!window.Sesion || !window.Sesion.hay()) {
                        alert('Primero debes iniciar sesión en el laboratorio con tu usuario y contraseña.');
                        sessionStorage.setItem('loginReferrer', redirectUrl);
                        window.location.href = 'index.html?login=1';
                        return;
                    }
                    const modulo = window.moduloDeDestino
                        ? window.moduloDeDestino(redirectParam || '')
                        : null;
                    let res = await window.Sesion.claveSol(ruc, user, pass, modulo);
                    // RUC fuera del simulador: ofrecer el ingreso temporal
                    if (res && !res.ok && res.motivo === 'RUC_NO_EXISTE' && window.Sesion.claveSolTemporal) {
                        res = (await ofrecerIngresoTemporal(ruc, user, pass, modulo)) || { ok: false, cancelado: true };
                    }
                    if (res && res.ok) {
                        // Guardar el nombre del estudiante para los PDF/reportes
                        try {
                            const estF = document.getElementById('estudiante-field');
                            const estS = document.getElementById('estudiante-switch');
                            const nombre = (estS && !estS.checked) ? 'USER'
                                : ((estF && estF.value.trim()) ? estF.value.trim() : 'USER');
                            sessionStorage.setItem('taxlab_estudiante', nombre);
                        } catch (e) {}
                        // Cargar el avance guardado de este usuario para esa empresa
                        try { await window.SimStore.hydrate(); } catch (e) {}
                        irADashboard();
                    } else if (!(res && res.cancelado)) {
                        alert((res && res.mensaje) || 'No se pudo validar la Clave SOL.');
                    }
                } else {
                    // ---- PUERTA 1: usuario y contraseña de la plataforma ----
                    const loginRes = await loginConSupabase(user, pass, null);
                    if (loginRes.success) {
                        irADashboard();
                    } else {
                        alert(loginRes.mensaje || 'Credenciales incorrectas o usuario no registrado.');
                    }
                }
            } catch (e) {
                console.error('Error al iniciar sesión:', e);
                alert('No se pudo conectar con el servidor. Intente nuevamente.');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        }
    });

    // Iniciar sesión/Registro al presionar la tecla ENTER en los campos
    const inputs = [rucField, userField, nombresField, paternoField, maternoField,
                    emailField, telefonoField, passField];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btnSubmit.click();
                }
            });
        }
    });
});


// ---------------------------------------------------------------------------
// Ingreso TEMPORAL con un RUC que no está en el simulador.
// Pide la razón social (y, si se quiere, el domicilio) y entra con esa empresa
// solo durante esta sesión: no se crea en la base, no trae registros
// precargados y el avance no se guarda en el servidor.
// Devuelve la respuesta de Sesion.claveSolTemporal, o null si se cancela.
// ---------------------------------------------------------------------------
function ofrecerIngresoTemporal(ruc, user, pass, modulo) {
    return new Promise(function (resolver) {
        var esPersona = /^10/.test(String(ruc));
        var fondo = document.createElement('div');
        fondo.style.cssText = 'position:fixed;inset:0;background:rgba(10,25,45,.55);z-index:100000;display:flex;' +
            'align-items:center;justify-content:center;padding:16px;font-family:Roboto,Arial,sans-serif;';
        fondo.innerHTML =
            '<div role="dialog" aria-modal="true" aria-labelledby="tmp-titulo" style="background:#fff;border-radius:10px;max-width:440px;width:100%;' +
            'box-shadow:0 18px 50px rgba(0,0,0,.35);overflow:hidden;">' +
            '<div style="background:#1E395B;color:#fff;padding:13px 18px;font-weight:700;font-size:15px;" id="tmp-titulo">' +
            'RUC ' + ruc + ' no registrado en el simulador</div>' +
            '<div style="padding:16px 18px;font-size:13px;color:#333;line-height:1.5;">' +
            '<p style="margin:0 0 10px;">Puedes entrar con este RUC <b>de forma temporal</b>. Ten en cuenta que:</p>' +
            '<ul style="margin:0 0 12px;padding-left:18px;">' +
            '<li>No tendrá compras ni ventas precargadas en el SIRE.</li>' +
            '<li>Lo que hagas queda solo en esta computadora; no se guarda en el servidor.</li>' +
            '<li>Si el RUC está mal escrito, pulsa <b>Corregir el RUC</b>.</li></ul>' +
            '<label style="display:block;font-weight:600;margin-bottom:4px;" for="tmp-razon">' +
            (esPersona ? 'Apellidos y nombres' : 'Razón social') + ' <span style="color:#c00;">*</span></label>' +
            '<input id="tmp-razon" type="text" maxlength="120" autocomplete="off" style="width:100%;box-sizing:border-box;padding:8px 10px;' +
            'border:1px solid #9aa7b5;border-radius:5px;font-size:13px;text-transform:uppercase;" placeholder="' +
            (esPersona ? 'Ej.: QUISPE MAMANI JUAN CARLOS' : 'Ej.: COMERCIAL LOS ANDES S.A.C.') + '">' +
            '<label style="display:block;font-weight:600;margin:10px 0 4px;" for="tmp-dir">Domicilio fiscal <span style="color:#777;font-weight:400;">(opcional)</span></label>' +
            '<input id="tmp-dir" type="text" maxlength="160" autocomplete="off" style="width:100%;box-sizing:border-box;padding:8px 10px;' +
            'border:1px solid #9aa7b5;border-radius:5px;font-size:13px;text-transform:uppercase;" placeholder="Ej.: AV. EJERCITO 1245, YANAHUARA, AREQUIPA">' +
            '<div id="tmp-error" role="alert" style="display:none;margin-top:10px;background:#fdecea;color:#a12622;border-radius:5px;padding:7px 10px;font-size:12.5px;"></div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 18px;background:#f4f6f9;border-top:1px solid #e3e7ec;flex-wrap:wrap;">' +
            '<button type="button" id="tmp-cancelar" style="padding:8px 14px;border:1px solid #9aa7b5;background:#fff;border-radius:5px;cursor:pointer;font-size:13px;">Corregir el RUC</button>' +
            '<button type="button" id="tmp-entrar" style="padding:8px 14px;border:none;background:#004B91;color:#fff;border-radius:5px;cursor:pointer;font-size:13px;font-weight:700;">Ingresar temporalmente</button>' +
            '</div></div>';
        document.body.appendChild(fondo);
        var razon = fondo.querySelector('#tmp-razon');
        var dir = fondo.querySelector('#tmp-dir');
        var error = fondo.querySelector('#tmp-error');
        var btnEntrar = fondo.querySelector('#tmp-entrar');
        setTimeout(function () { razon.focus(); }, 30);

        function cerrar(valor) {
            document.removeEventListener('keydown', teclas, true);
            fondo.remove();
            resolver(valor);
        }
        function mostrarError(t) { error.textContent = t; error.style.display = 'block'; }
        async function entrar() {
            if (razon.value.trim().length < 3) {
                mostrarError('Escribe ' + (esPersona ? 'los apellidos y nombres' : 'la razón social') + ' para continuar.');
                razon.focus();
                return;
            }
            btnEntrar.disabled = true;
            btnEntrar.textContent = 'Verificando...';
            try {
                var r = await window.Sesion.claveSolTemporal(ruc, user, pass, modulo, razon.value, dir.value);
                if (r && r.ok) { cerrar(r); return; }
                mostrarError((r && r.mensaje) || 'No se pudo ingresar con este RUC.');
            } catch (e) {
                mostrarError('No se pudo conectar con el servidor. Intenta nuevamente.');
            }
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Ingresar temporalmente';
        }
        // En fase de captura, para que el Enter no dispare también el login de fondo
        function teclas(ev) {
            if (ev.key === 'Escape') { ev.stopPropagation(); cerrar(null); }
            else if (ev.key === 'Enter') {
                ev.preventDefault(); ev.stopPropagation();
                if (ev.target !== fondo.querySelector('#tmp-cancelar')) entrar();
                else cerrar(null);
            }
        }
        document.addEventListener('keydown', teclas, true);
        btnEntrar.addEventListener('click', entrar);
        fondo.querySelector('#tmp-cancelar').addEventListener('click', function () {
            cerrar(null);
            var campo = document.getElementById('ruc-field');
            if (campo) { campo.focus(); if (campo.select) campo.select(); }
        });
    });
}

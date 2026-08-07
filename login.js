document.addEventListener('DOMContentLoaded', () => {
    const modeLogin = document.getElementById('mode-login');
    const modeRegister = document.getElementById('mode-register');
    const loginSubtitle = document.getElementById('login-subtitle');
    
    const rucField = document.getElementById('ruc-field');
    const userField = document.getElementById('user-field');
    const denomField = document.getElementById('denom-field');
    const passField = document.getElementById('pass-field');
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
            if (denomField) denomField.style.display = 'none';
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
            if (denomField) denomField.style.display = 'block';
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
        const denom = denomField ? denomField.value.trim() : user;
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
            if (!user || !pass) {
                alert('Por favor ingrese Usuario y Contraseña para registrarse.');
                return;
            }

            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Registrando...';

            try {
                const res = await registrarUsuarioExtendido(user, user, pass, denom, 'INVITADO');
                if (res.success) {
                    alert(`¡Registro guardado exitosamente en Supabase!\n\nUsuario: ${user}\nRol asignado: INVITADO\n\nNota: De momento el ingreso está restringido sólo a usuarios con el rol PRUEBA. Solicita a un administrador activar tu rol PRUEBA.`);
                } else {
                    alert('No se pudo completar el registro: ' + (res.error || 'Error desconocido'));
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
                    const res = await window.Sesion.claveSol(ruc, user, pass, modulo);
                    if (res && res.ok) {
                        // Cargar el avance guardado de este usuario para esa empresa
                        try { await window.SimStore.hydrate(); } catch (e) {}
                        irADashboard();
                    } else {
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
    const inputs = [rucField, userField, denomField, passField];
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

document.addEventListener('DOMContentLoaded', () => {
    const modeLogin = document.getElementById('mode-login');
    const modeRegister = document.getElementById('mode-register');
    const loginSubtitle = document.getElementById('login-subtitle');
    
    const userField = document.getElementById('user-field');
    const denomField = document.getElementById('denom-field');
    const passField = document.getElementById('pass-field');
    const regRoleBox = document.getElementById('reg-role-box');
    const rememberBox = document.getElementById('remember-box');
    const forgotBox = document.getElementById('forgot-box');
    const btnSubmit = document.getElementById('btn-submit-form');
    const togglePass = document.getElementById('toggle-pass');

    let currentMode = 'login'; // 'login' | 'register'

    // Alternar entre Iniciar Sesión y Registrarse
    if (modeLogin && modeRegister) {
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

            if (loginSubtitle) loginSubtitle.textContent = 'Registra tu usuario en Supabase (Rol INVITADO por defecto)';
            if (denomField) denomField.style.display = 'block';
            if (regRoleBox) regRoleBox.style.display = 'block';
            if (rememberBox) rememberBox.style.display = 'none';
            if (forgotBox) forgotBox.style.display = 'none';
            if (btnSubmit) btnSubmit.textContent = 'Registrar Cuenta en Supabase';
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
        const user = userField.value.trim();
        const denom = denomField ? denomField.value.trim() : user;
        const pass = passField.value.trim();

        // Get redirect parameter or fallback
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = sessionStorage.getItem('loginReferrer');
        let redirectUrl = urlParams.get('redirect') || referrer || 'dashboard.html';

        const irADashboard = () => {
            if (referrer) {
                sessionStorage.removeItem('loginReferrer');
            }
            window.location.href = redirectUrl;
        };

        if (currentMode === 'register') {
            // REGISTRO EN SUPABASE
            if (!user || !pass) {
                alert('Por favor ingrese Usuario y Contraseña para registrarse.');
                return;
            }

            btnSubmit.disabled = true;
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = 'Registrando en Supabase...';

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
            if (!user || !pass) {
                alert('Por favor ingrese su usuario y contraseña.');
                return;
            }

            btnSubmit.disabled = true;
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.textContent = 'Verificando...';

            try {
                const loginRes = await loginConSupabase(user, pass);
                if (loginRes.success) {
                    irADashboard();
                } else if (loginRes.reason === 'ROL_RESTRINGIDO') {
                    alert(`Acceso Restringido:\n\nTu usuario fue encontrado pero tiene el rol '${loginRes.rol || 'INVITADO'}'.\nDe momento sólo se permite el acceso a usuarios con el rol PRUEBA.`);
                } else {
                    alert('Credenciales incorrectas o usuario no registrado.');
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
    const inputs = [userField, denomField, passField];
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

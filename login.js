document.addEventListener('DOMContentLoaded', () => {
    const tabRuc = document.getElementById('tab-ruc');
    const tabDni = document.getElementById('tab-dni');
    const rucField = document.getElementById('ruc-field');
    const userField = document.getElementById('user-field');
    const passField = document.getElementById('pass-field');
    const btnSubmit = document.querySelector('.btn-entrar-simple');
    const togglePass = document.getElementById('toggle-pass');

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

    // Tab Logic
    tabRuc.addEventListener('click', () => {
        tabRuc.classList.add('active');
        tabDni.classList.remove('active');
        rucField.placeholder = "RUC";
        userField.style.display = "block";
    });

    tabDni.addEventListener('click', () => {
        tabDni.classList.add('active');
        tabRuc.classList.remove('active');
        rucField.placeholder = "DNI";
        userField.style.display = "none";
    });

    // Login Logic
    btnSubmit.addEventListener('click', async () => {
        const ruc = rucField.value.trim();
        const user = userField.value.trim();
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

        if (tabRuc.classList.contains('active')) {
            if (!ruc || !user || !pass) {
                alert('Por favor complete RUC, usuario y contraseña.');
                return;
            }

            // Deshabilitar el botón mientras se valida contra Supabase
            btnSubmit.disabled = true;
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.textContent = 'Verificando...';

            try {
                const ok = await loginConSupabase(ruc, user, pass);
                if (ok) {
                    irADashboard();
                } else {
                    alert('Credenciales incorrectas. Verifique los datos.');
                }
            } catch (e) {
                console.error('Error al iniciar sesión:', e);
                alert('No se pudo conectar con el servidor. Intente nuevamente.');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        } else {
            // DNI login (validación genérica)
            if (ruc !== '' && pass !== '') {
                sessionStorage.setItem('sunat_auth', JSON.stringify({ ruc: '00000000', usuario: ruc, denominacion: 'EMPRESA EJEMPLO S.A.C.' }));
                irADashboard();
            } else {
                alert('Por favor complete los campos.');
            }
        }
    });

    // Iniciar sesión al presionar la tecla ENTER en cualquiera de los inputs
    const inputs = [rucField, userField, passField];
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

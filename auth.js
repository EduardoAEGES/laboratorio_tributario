/**
 * auth.js
 * Configuración de Supabase y funciones de autenticación
 */

// NOTA: Reemplazar estas constantes con las reales de Supabase proporcionadas por el usuario.
const AUTH_SUPABASE_URL = 'https://klmjmlhwuzhymrplemgw.supabase.co';
const AUTH_SUPABASE_ANON_KEY = 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b';

// ============================================================================
// SimStore: persistencia del estado de la simulación según el rol del usuario.
//   - Rol MASTER  -> localStorage (los cambios se conservan al cerrar el
//                    navegador), con espacio de nombres por RUC para no mezclar
//                    datos entre distintos usuarios MASTER.
//   - Otros roles -> sessionStorage (temporal, se borra al cerrar la pestaña).
// Solo se persisten las claves del estado de la simulación (SIM_KEYS); las
// claves que no son de simulación (sunat_auth, loginReferrer, etc.) siempre
// usan sessionStorage.
// ============================================================================
window.SimStore = (function () {
    // Se persiste CUALQUIER clave con prefijo 'sire_' (estado + contenido de los
    // registros, p. ej. sire_aceptado, sire_presentado, sire_export_tickets,
    // sire_rvie_content_<periodo>, sire_rce_content_<periodo>, ...).
    const SIM_PREFIX = 'sire_';

    function esClaveSim(key) {
        return typeof key === 'string' && key.indexOf(SIM_PREFIX) === 0;
    }

    function usuarioActual() {
        try { return JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); }
        catch (e) { return {}; }
    }

    function esMaster() {
        return String(usuarioActual().rol || '').toUpperCase() === 'MASTER';
    }

    // Convención de nombre para localStorage: sim_<ruc>_<clave>
    function nsKey(ruc, key) {
        return 'sim_' + (ruc || 'anon') + '_' + key;
    }

    // Recorre las claves sim_<ruc>_sire_* guardadas en localStorage
    function clavesSimLocal(ruc) {
        const prefijo = 'sim_' + (ruc || 'anon') + '_';
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const full = localStorage.key(i);
            if (full && full.indexOf(prefijo + SIM_PREFIX) === 0) {
                out.push({ full: full, key: full.slice(prefijo.length) });
            }
        }
        return out;
    }

    function persistente(key) {
        return esClaveSim(key) && esMaster();
    }

    // ---- Sincronización con Supabase (solo rol MASTER) ----
    // Se guarda todo el estado del usuario (una fila por RUC) en la tabla
    // public.sire_estado. La escritura es "debounced" para no saturar la red.
    let _syncTimer = null;

    function syncToServer() {
        if (!esMaster() || typeof authSupabaseClient === 'undefined' || !authSupabaseClient) return;
        clearTimeout(_syncTimer);
        _syncTimer = setTimeout(async function () {
            const ruc = usuarioActual().ruc;
            if (!ruc) return;
            const estado = {};
            clavesSimLocal(ruc).forEach(function (item) {
                const v = localStorage.getItem(item.full);
                if (v !== null) estado[item.key] = v;
            });
            try {
                await authSupabaseClient
                    .from('sire_estado')
                    .upsert({ ruc: ruc, estado: estado, actualizado_at: new Date().toISOString() }, { onConflict: 'ruc' });
            } catch (e) {
                console.warn('No se pudo sincronizar el estado con Supabase:', e);
            }
        }, 600);
    }

    // Carga el estado guardado en Supabase hacia localStorage (se llama al
    // iniciar sesión, antes de entrar a los simuladores).
    async function hydrate() {
        if (!esMaster() || typeof authSupabaseClient === 'undefined' || !authSupabaseClient) return;
        const ruc = usuarioActual().ruc;
        if (!ruc) return;
        try {
            const { data, error } = await authSupabaseClient
                .from('sire_estado')
                .select('estado')
                .eq('ruc', ruc)
                .maybeSingle();
            if (error || !data || !data.estado) return;
            Object.keys(data.estado).forEach(function (k) {
                if (esClaveSim(k) && data.estado[k] != null) {
                    localStorage.setItem(nsKey(ruc, k), data.estado[k]);
                }
            });
        } catch (e) {
            console.warn('No se pudo cargar el estado desde Supabase:', e);
        }
    }

    // Borra el estado del usuario actual en localStorage y en Supabase.
    async function clearAll() {
        const ruc = usuarioActual().ruc || 'anon';
        // Claves de sesión conocidas (no llevan prefijo persistente para no-MASTER)
        ['sire_aceptado', 'sire_presentado', 'sire_resumen',
         'sire_export_tickets', 'sire_rce_export_tickets'].forEach(function (k) {
            sessionStorage.removeItem(k);
        });
        // Todas las claves persistidas sim_<ruc>_sire_* del MASTER
        clavesSimLocal(ruc).forEach(function (item) {
            try { localStorage.removeItem(item.full); } catch (e) {}
        });
        if (typeof authSupabaseClient !== 'undefined' && authSupabaseClient && ruc !== 'anon') {
            try { await authSupabaseClient.from('sire_estado').delete().eq('ruc', ruc); } catch (e) {}
        }
    }

    return {
        esClaveSim: esClaveSim,
        esMaster: esMaster,
        hydrate: hydrate,
        clearAll: clearAll,
        getItem: function (key) {
            if (persistente(key)) return localStorage.getItem(nsKey(usuarioActual().ruc, key));
            return sessionStorage.getItem(key);
        },
        setItem: function (key, val) {
            if (persistente(key)) {
                localStorage.setItem(nsKey(usuarioActual().ruc, key), val);
                syncToServer();
            } else {
                sessionStorage.setItem(key, val);
            }
        },
        removeItem: function (key) {
            // Elimina en ambos backends para evitar residuos al cambiar de rol
            sessionStorage.removeItem(key);
            try { localStorage.removeItem(nsKey(usuarioActual().ruc, key)); } catch (e) {}
            if (esClaveSim(key)) syncToServer();
        }
    };
})();

// Si las credenciales son inválidas o no están configuradas, las funciones fallarán graciosamente en local.
let authSupabaseClient = null;

if (typeof window.supabase !== 'undefined' && AUTH_SUPABASE_URL !== 'URL_DE_SUPABASE') {
    authSupabaseClient = window.supabase.createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_ANON_KEY);
}

// Roles del Sistema
window.ROLES_SISTEMA = ['INVITADO', 'ESTUDIANTE', 'ASISTENTE', 'PRO', 'DOCENTE', 'PRUEBA', 'MASTER'];

/**
 * Función central para iniciar sesión verificando contra la tabla 'usuarios'
 * Asume una tabla pública en Supabase llamada 'usuarios' con columnas: ruc, usuario, clave, denominacion, rol
 */
async function loginConSupabase(usuario, clave, ruc = null) {
    if (!authSupabaseClient) {
        console.warn("Supabase no está configurado.");
        return { success: false, reason: 'NO_SUPABASE' };
    }

    try {
        let sessionUser = null;

        // 1. Si NO se especifica RUC, buscar primero en la tabla 'participantes' (alumnos/participantes sin RUC)
        if (!ruc) {
            const { data: partData } = await authSupabaseClient
                .from('participantes')
                .select('*')
                .or(`usuario.eq.${usuario},email.eq.${usuario}`)
                .eq('clave', clave)
                .maybeSingle();

            if (partData) {
                const nombreComp = `${partData.nombres || ''} ${partData.apellido_paterno || ''}`.trim() || partData.usuario;
                sessionUser = {
                    ruc: partData.usuario,
                    usuario: partData.usuario,
                    denominacion: nombreComp,
                    email: partData.email || '',
                    rol: partData.rol || 'INVITADO'
                };
            }
        }

        // 2. Si no se encontró en participantes (o si se especificó RUC), buscar en tabla 'usuarios' (empresas Clave SOL con RUC)
        if (!sessionUser) {
            let queryBuilder = authSupabaseClient
                .from('usuarios')
                .select('*')
                .eq('usuario', usuario)
                .eq('clave', clave);

            if (ruc) {
                queryBuilder = queryBuilder.eq('ruc', ruc);
            }

            const { data, error } = await queryBuilder.maybeSingle();
            if (data) {
                sessionUser = {
                    ...data,
                    rol: data.rol || 'INVITADO'
                };
            }
        }

        if (!sessionUser) {
            console.error("Credenciales inválidas");
            return { success: false, reason: 'INVALID_CREDENTIALS' };
        }

        // VERIFICACIÓN DE ROL: De momento sólo permite el ingreso si el rol es PRUEBA o MASTER
        const userRolUpper = (sessionUser.rol || '').toUpperCase();
        if (userRolUpper !== 'PRUEBA' && userRolUpper !== 'MASTER') {
            return { 
                success: false, 
                reason: 'ROL_RESTRINGIDO', 
                rol: userRolUpper || 'INVITADO',
                user: sessionUser 
            };
        }

        // Guardar sesión sólo si cumple el rol exigido
        sessionStorage.setItem('sunat_auth', JSON.stringify(sessionUser));

        // Si es MASTER, cargar el estado guardado en Supabase antes de continuar
        try { await window.SimStore.hydrate(); } catch (e) {}

        return { success: true, user: sessionUser };
    } catch (e) {
        console.error("Error en login:", e);
        return { success: false, reason: 'ERROR', error: e.message };
    }
}

/**
 * Ventana modal flotante sobre la pantalla para solicitar credenciales o registrarse en Supabase
 * antes de abrir cualquier botón o aplicativo.
 */
window.mostrarModalLogin = function (targetUrl, callback) {
    let modal = document.getElementById('global-auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-auth-modal';
        modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; font-family: 'Roboto', Arial, sans-serif;">
            <div style="background: #ffffff; width: 100%; max-width: 440px; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.4); overflow: hidden; position: relative; max-height: 92vh; display: flex; flex-direction: column;">
                
                <!-- Modal Header -->
                <div style="background: #004B91; color: white; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="LOGO_SUNAT.png" alt="SUNAT" style="height: 22px; background: white; padding: 2px 6px; border-radius: 4px;">
                        <span style="font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">Acceso al Simulador</span>
                    </div>
                    <button type="button" id="auth-modal-close" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
                </div>

                <!-- Tabs: Iniciar Sesión / Registrarse -->
                <div style="display: flex; background: #EBF3FA; padding: 6px; gap: 6px; border-bottom: 1px solid #CDE0EE; flex-shrink: 0;">
                    <button type="button" id="modal-tab-login" style="flex: 1; padding: 9px 12px; border: none; border-radius: 6px; background: #004B91; color: white; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <button type="button" id="modal-tab-register" style="flex: 1; padding: 9px 12px; border: none; border-radius: 6px; background: transparent; color: #004B91; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-user-plus"></i> Registrarse (Supabase)
                    </button>
                </div>

                <!-- Body / Form -->
                <div style="padding: 20px 24px; overflow-y: auto; flex: 1;">
                    <p id="modal-subtitle" style="font-size: 12.5px; color: #555; margin: 0 0 14px 0; text-align: center;">Ingrese Usuario y Contraseña para continuar</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 11px;">
                        
                        <!-- Campos de Registro Extendido (Nombres, Apellidos, Correo, Teléfono) -->
                        <div id="modal-reg-fields" style="display: none; flex-direction: column; gap: 11px;">
                            <input type="text" id="modal-nombres" placeholder="Nombres" style="padding: 10px 14px; font-size: 13.5px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="modal-paterno" placeholder="Apellido Paterno" style="flex: 1; padding: 10px 12px; font-size: 13px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                                <input type="text" id="modal-materno" placeholder="Apellido Materno" style="flex: 1; padding: 10px 12px; font-size: 13px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                            </div>
                            <input type="email" id="modal-email" placeholder="Correo Electrónico" style="padding: 10px 14px; font-size: 13.5px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                            <input type="tel" id="modal-telefono" placeholder="Teléfono / Celular" style="padding: 10px 14px; font-size: 13.5px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                        </div>

                        <!-- Campos Comunes: Usuario y Contraseña -->
                        <input type="text" id="modal-user" placeholder="Usuario o Correo" style="padding: 11px 14px; font-size: 13.5px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none;">
                        
                        <div style="position: relative;">
                            <input type="password" id="modal-pass" placeholder="Contraseña" style="width: 100%; padding: 11px 40px 11px 14px; font-size: 13.5px; border: 1px solid #B0C4DE; border-radius: 6px; outline: none; box-sizing: border-box;">
                            <button type="button" id="modal-toggle-pass" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #666; cursor: pointer;">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>

                        <!-- Checkbox Capacitaciones (Sólo visible en registro) -->
                        <div id="modal-chk-box" style="display: none; margin-top: 2px;">
                            <label style="font-size: 12px; color: #333; display: flex; align-items: flex-start; gap: 8px; cursor: pointer; text-align: left; line-height: 1.3;">
                                <input type="checkbox" id="modal-chk-capacitaciones" checked style="margin-top: 2px; accent-color: #004B91; cursor: pointer;">
                                <span>Deseo recibir información sobre charlas, capacitaciones y novedades académicas.</span>
                            </label>
                        </div>

                        <!-- Role Info Box -->
                        <div id="modal-role-info" style="display: none; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #0369A1; margin-top: 2px;">
                            <div style="font-weight: bold; margin-bottom: 2px;"><i class="fas fa-info-circle"></i> Rol por defecto: <span style="background: #0284C7; color: white; padding: 1px 6px; border-radius: 10px;">INVITADO</span></div>
                            <div>Roles: INVITADO, ESTUDIANTE, ASISTENTE, PRO, DOCENTE, PRUEBA, MASTER</div>
                        </div>

                        <div id="modal-error-msg" style="display: none; color: #DC2626; font-size: 12px; font-weight: bold; text-align: center;"></div>

                        <button type="button" id="modal-btn-submit" style="margin-top: 4px; width: 100%; padding: 12px; background: #004B91; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 13.5px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,75,145,0.3); transition: all 0.2s;">
                            Entrar y Abrir Aplicativo
                        </button>
                    </div>
                </div>

                <!-- Footer con información de contacto -->
                <div style="background: #F8FAFC; padding: 10px 16px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #475569; flex-shrink: 0; line-height: 1.4;">
                    <div>Simulador de prueba | <strong>Eduardo Estrategico</strong></div>
                    <div style="color: #0369A1; font-weight: 500; margin-top: 3px;">
                        Para mayor información contactar al <a href="https://wa.me/51973590390" target="_blank" style="color: #0284C7; text-decoration: none; font-weight: bold;"><i class="fab fa-whatsapp" style="color: #25D366;"></i> 973590390 (WhatsApp)</a> o correo <a href="mailto:edu.mamaniroque@gmail.com" style="color: #0284C7; text-decoration: none; font-weight: bold;"><i class="fas fa-envelope"></i> edu.mamaniroque@gmail.com</a>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.body.appendChild(modal);

        // Events inside modal
        const closeBtn = document.getElementById('auth-modal-close');
        const tabLogin = document.getElementById('modal-tab-login');
        const tabRegister = document.getElementById('modal-tab-register');
        const regFields = document.getElementById('modal-reg-fields');
        const userInp = document.getElementById('modal-user');
        const passInp = document.getElementById('modal-pass');
        const nombresInp = document.getElementById('modal-nombres');
        const paternoInp = document.getElementById('modal-paterno');
        const maternoInp = document.getElementById('modal-materno');
        const emailInp = document.getElementById('modal-email');
        const telefonoInp = document.getElementById('modal-telefono');
        const chkCapacitaciones = document.getElementById('modal-chk-capacitaciones');
        const chkBox = document.getElementById('modal-chk-box');

        const togglePassBtn = document.getElementById('modal-toggle-pass');
        const roleInfo = document.getElementById('modal-role-info');
        const errorMsg = document.getElementById('modal-error-msg');
        const btnSubmit = document.getElementById('modal-btn-submit');
        const subtitle = document.getElementById('modal-subtitle');

        let mode = 'login';

        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        togglePassBtn.onclick = () => {
            const isPass = passInp.type === 'password';
            passInp.type = isPass ? 'text' : 'password';
            togglePassBtn.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
        };

        tabLogin.onclick = () => {
            mode = 'login';
            tabLogin.style.background = '#004B91';
            tabLogin.style.color = 'white';
            tabRegister.style.background = 'transparent';
            tabRegister.style.color = '#004B91';
            regFields.style.display = 'none';
            chkBox.style.display = 'none';
            roleInfo.style.display = 'none';
            userInp.placeholder = 'Usuario o Correo';
            btnSubmit.textContent = 'Entrar y Abrir Aplicativo';
            subtitle.textContent = 'Ingrese Usuario y Contraseña para continuar';
            errorMsg.style.display = 'none';
        };

        tabRegister.onclick = () => {
            mode = 'register';
            tabRegister.style.background = '#004B91';
            tabRegister.style.color = 'white';
            tabLogin.style.background = 'transparent';
            tabLogin.style.color = '#004B91';
            regFields.style.display = 'flex';
            chkBox.style.display = 'block';
            roleInfo.style.display = 'block';
            userInp.placeholder = 'Crear Nombre de Usuario';
            btnSubmit.textContent = 'Registrar en Supabase y Abrir';
            subtitle.textContent = 'Complete sus datos para crear su cuenta';
            errorMsg.style.display = 'none';
        };

        btnSubmit.onclick = async () => {
            const user = userInp.value.trim();
            const pass = passInp.value.trim();

            if (!user || !pass) {
                errorMsg.textContent = 'Por favor ingrese su Usuario y Contraseña.';
                errorMsg.style.display = 'block';
                return;
            }

            if (mode === 'register') {
                const nombres = nombresInp.value.trim();
                const email = emailInp.value.trim();

                if (!nombres || !email) {
                    errorMsg.textContent = 'Por favor complete sus Nombres y Correo Electrónico.';
                    errorMsg.style.display = 'block';
                    return;
                }
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Verificando...';
            errorMsg.style.display = 'none';

            try {
                if (mode === 'register') {
                    const nombres = nombresInp.value.trim();
                    const paterno = paternoInp.value.trim();
                    const materno = maternoInp.value.trim();
                    const email = emailInp.value.trim();
                    const telefono = telefonoInp.value.trim();
                    const deseaCapacitaciones = chkCapacitaciones.checked;
                    const denom = `${nombres} ${paterno} ${materno}`.trim() || user;

                    const extraData = {
                        nombres, paterno, materno, email, telefono, deseaCapacitaciones
                    };

                    const res = await registrarUsuarioExtendido(user, user, pass, denom, 'INVITADO', extraData);
                    if (res.success) {
                        errorMsg.style.color = '#0284C7';
                        errorMsg.style.background = '#E0F2FE';
                        errorMsg.style.padding = '10px';
                        errorMsg.style.borderRadius = '6px';
                        errorMsg.innerHTML = `<i class="fas fa-check-circle"></i> <strong>¡Registro guardado exitosamente!</strong><br>Tu cuenta se creó con el rol <strong>INVITADO</strong>.<br><br><span style="color:#C2410C; font-weight:bold;"><i class="fas fa-lock"></i> De momento el ingreso está restringido sólo a usuarios con el rol PRUEBA.</span> Solicita a tu docente o administrador que active el rol PRUEBA en tu cuenta.`;
                        errorMsg.style.display = 'block';
                    } else {
                        errorMsg.style.color = '#DC2626';
                        errorMsg.style.background = 'transparent';
                        errorMsg.style.padding = '0';
                        errorMsg.textContent = res.error || 'Error al registrar usuario en Supabase.';
                        errorMsg.style.display = 'block';
                    }
                } else {
                    const loginRes = await loginConSupabase(user, pass);
                    if (loginRes.success) {
                        modal.style.display = 'none';
                        // Actualizar botones del header si existen
                        if (typeof actualizarBotonesAuth === 'function') actualizarBotonesAuth();
                        const dest = modal.dataset.pendingUrl;
                        if (dest) window.location.href = dest;
                        else if (callback) callback();
                    } else if (loginRes.reason === 'ROL_RESTRINGIDO') {
                        errorMsg.style.color = '#B91C1C';
                        errorMsg.style.background = '#FEF2F2';
                        errorMsg.style.padding = '10px';
                        errorMsg.style.borderRadius = '6px';
                        errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Acceso Restringido</strong><br>Tu cuenta tiene el rol <strong>${loginRes.rol || 'INVITADO'}</strong>.<br>De momento sólo se permite el ingreso a usuarios con el rol <strong>PRUEBA</strong>.`;
                        errorMsg.style.display = 'block';
                    } else {
                        errorMsg.style.color = '#DC2626';
                        errorMsg.style.background = 'transparent';
                        errorMsg.style.padding = '0';
                        errorMsg.textContent = 'Credenciales incorrectas o usuario no registrado.';
                        errorMsg.style.display = 'block';
                    }
                }
            } catch (err) {
                errorMsg.style.color = '#DC2626';
                errorMsg.style.background = 'transparent';
                errorMsg.style.padding = '0';
                errorMsg.textContent = err.message || 'Error en autenticación.';
                errorMsg.style.display = 'block';
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = mode === 'register' ? 'Registrar en Supabase' : 'Entrar y Abrir Aplicativo';
            }
        };

        // Enter key inside modal
        [userInp, passInp, nombresInp, paternoInp, maternoInp, emailInp, telefonoInp].forEach(inp => {
            if (inp) {
                inp.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        btnSubmit.click();
                    }
                });
            }
        });
    }

    modal.dataset.pendingUrl = targetUrl || '';
    modal.style.display = 'flex';
    document.getElementById('modal-user').focus();
};

/**
 * Función para registrar un participante/alumno (registro académico personal sin RUC).
 * Se diferencia del registro de Usuarios/Empresas con RUC.
 */
async function registrarUsuarioExtendido(ruc, usuario, clave, denominacion, rol = 'INVITADO', extra = {}) {
    if (!authSupabaseClient) {
        console.warn("Supabase no está configurado.");
        return { success: true, rol: 'INVITADO' }; // Fallback local
    }

    try {
        const userRol = window.ROLES_SISTEMA.includes(rol) ? rol : 'INVITADO';

        const recordParticipante = {
            usuario: usuario,
            clave: clave,
            nombres: extra.nombres || '',
            apellido_paterno: extra.paterno || '',
            apellido_materno: extra.materno || '',
            email: extra.email || '',
            telefono: extra.telefono || '',
            desea_capacitaciones: extra.deseaCapacitaciones !== false,
            rol: userRol
        };

        // Intentar registrar en tabla dedicada 'participantes'
        let { data, error } = await authSupabaseClient
            .from('participantes')
            .insert([recordParticipante]);

        if (error) {
            console.warn("No se pudo insertar en 'participantes', intentando en 'usuarios'...", error.message);
            // Fallback a tabla 'usuarios' guardando denominacion
            const recordUsuario = {
                ruc: usuario,
                usuario: usuario,
                clave: clave,
                denominacion: denominacion || `${extra.nombres || ''} ${extra.paterno || ''}`.trim() || usuario,
                rol: userRol
            };
            const { error: err2 } = await authSupabaseClient.from('usuarios').insert([recordUsuario]);
            if (err2) {
                console.error("Error al registrar en Supabase:", err2);
                return { success: false, error: err2.message };
            }
        }

        return { success: true, rol: userRol };
    } catch (e) {
        console.error("Error al registrar participante:", e);
        return { success: true, rol: 'INVITADO' };
    }
}

/**
 * Interceptar clics en botones de aplicativo si el usuario no está autenticado.
 */
document.addEventListener('click', function (e) {
    const authData = sessionStorage.getItem('sunat_auth');
    if (authData) return; // Si ya inició sesión, permitir navegación directa

    const targetBtn = e.target.closest('a.sol-btn, a.quick-btn, a.app-btn-reemplazo, a.app-btn-ajustes, button[onclick*="irAlCurso"], a[href$=".html"]');
    if (!targetBtn) return;

    const href = targetBtn.getAttribute('href') || '';
    // Excepciones (links externos o de gobierno)
    if (href === '#' || href === '' || href.startsWith('http://') || href.startsWith('https://') || targetBtn.id === 'auth-modal-close') {
        if (!href.includes(window.location.hostname) && !href.endsWith('.html')) return;
    }
    if (href.includes('login.html')) return;

    // Detener navegación directa y mostrar la ventana flotante sobre la pantalla
    e.preventDefault();
    e.stopPropagation();

    window.mostrarModalLogin(href, null);
}, true);

/**
 * Función para verificar si hay una sesión activa en páginas protegidas.
 */
function checkAuth() {
    const authData = sessionStorage.getItem('sunat_auth');
    if (!authData) {
        const currentPage = window.location.pathname.split('/').pop() || '';
        sessionStorage.setItem('loginReferrer', currentPage);
        window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
    }
}

/**
 * Cierra la sesión
 */
function logout() {
    // Cierra la sesión pero CONSERVA el estado temporal de la simulación
    sessionStorage.removeItem('sunat_auth');
    window.location.href = 'login.html';
}

/**
 * Registra un nuevo usuario en la base de datos de Supabase.
 * Por defecto asigna el rol INVITADO.
 */
async function registrarUsuario(ruc, usuario, clave, denominacion, rol = 'INVITADO') {
    if (!authSupabaseClient) {
        console.error("Supabase no está configurado.");
        return { success: false, error: "Conexión a base de datos de Supabase no configurada." };
    }

    try {
        const userRol = window.ROLES_SISTEMA.includes(rol) ? rol : 'INVITADO';

        const { data, error } = await authSupabaseClient
            .from('usuarios')
            .insert([
                { 
                    ruc: ruc, 
                    usuario: usuario, 
                    clave: clave, 
                    denominacion: denominacion || usuario,
                    rol: userRol 
                }
            ]);

        if (error) {
            console.error("Error al registrar en Supabase:", error);
            return { success: false, error: error.message };
        }

        return { success: true, rol: userRol };
    } catch (e) {
        console.error("Error al registrar:", e);
        return { success: false, error: e.message };
    }
}

// Verifica en qué página estamos
const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname.endsWith('login');
const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
const isSolPage = window.location.pathname.includes('sol.html');

// Solo requerir autenticación para otras páginas (los simuladores)
if (!isLoginPage && !isIndexPage && !isSolPage) {
    checkAuth();
}

// Adjuntar evento salir a botones de salir si existen
document.addEventListener('DOMContentLoaded', () => {
    const btnSalir = document.querySelector('.btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Autocompletar nombre de empresa si hay un lugar para ello en simuladores
    const userSession = sessionStorage.getItem('sunat_auth');
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
            // Si estemos en el header azul de los simuladores, lo reemplazamos
            const nameDisplays = document.querySelectorAll('.user-info-right span:first-child');
            if (nameDisplays.length > 0 && userData.denominacion) {
                // Mantener la flecha si existe
                nameDisplays.forEach(el => {
                    const hasCaret = el.innerHTML.includes('fa-caret-down');
                    el.innerHTML = `Bienvenido, ${userData.denominacion} ${hasCaret ? '<i class="fas fa-caret-down"></i>' : ''}`;
                });
            }

            // Mostrar el tipo de usuario (rol) junto al estado de domicilio
            const domicilioEls = document.querySelectorAll('.domicilio, .user-status, .status-badge');
            if (domicilioEls.length > 0 && userData.rol) {
                domicilioEls.forEach(el => {
                    if (!el.parentElement.querySelector('.user-tipo-badge')) {
                        const badge = document.createElement('span');
                        badge.className = 'user-tipo-badge';
                        badge.style.cssText = 'margin-left:15px; padding:2px 10px; background:rgba(255,255,255,0.15); border-radius:3px; font-size:12px; font-weight:600;';
                        badge.textContent = `Perfil: ${userData.rol}`;
                        el.insertAdjacentElement('afterend', badge);
                    }
                });
            }
        } catch (e) { }
    }
});

// ============================================================================
// Reproductor de Sonido UI al hacer clic en cualquier botón o elemento interactivo
// ============================================================================
(function initButtonSoundEffect() {
    let audioCtx = null;

    function playClickSound() {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.035);

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.035);
        } catch (e) {}
    }

    document.addEventListener('click', function (e) {
        const target = e.target.closest('button, a, input[type="button"], input[type="submit"], select, .btn, [role="button"], .tab-btn-simple, .nav-item, .sol-btn, .quick-btn, .app-btn-reemplazo, .app-btn-ajustes');
        if (target) {
            playClickSound();
        }
    }, true);

    window.playClickSound = playClickSound;
})();

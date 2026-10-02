/**
 * auth.js
 * Configuración de Supabase y funciones de autenticación
 */

/* ============================================================================
 * TAXLAB 360 - MODO PÚBLICO (sin inicio de sesión)
 * ----------------------------------------------------------------------------
 * Esta carpeta es una copia independiente del simulador que NO pide usuario ni
 * contraseña. Al cargar, se siembra una sesión pública con acceso a todos los
 * módulos; su avance vive solo en sessionStorage y se pierde al cerrar el
 * navegador (nada se guarda en Supabase). La empresa se sigue eligiendo con la
 * Clave SOL (RUC + SIST + NORTON), validada localmente.
 * Debe ejecutarse ANTES que checkAuth() de este mismo archivo.
 * ==========================================================================*/
(function sembrarSesionPublica() {
    try {
        if (sessionStorage.getItem('sunat_auth')) return;
        var modulos = ['sol', 'fv621', 'fv710', 'tramites', 'rvie', 'rce',
                       'see_sol', 'tregistro', 'reemplazo', 'ajustes', 'plan_contable']
                      .map(function (c) { return { clave: c }; });
        sessionStorage.setItem('sunat_auth', JSON.stringify({
            id: 'publico',
            usuario_id: 'publico',
            usuario: 'invitado',
            denominacion: 'Acceso Público',
            rol: 'PUBLICO',
            modo_demo: false,
            puede_guardar: false,   // no va a Supabase: SimStore lo guarda en esta computadora (localStorage)
            modulos: modulos,
            empresas: []
        }));
    } catch (e) { /* sessionStorage no disponible */ }
})();

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
    //
    // AVANCE INDEPENDIENTE: todo se guarda por la pareja (usuario, RUC de la
    // empresa activa) en la tabla public.avance_usuario. Los roles en modo
    // demostracion (INVITADO y PRUEBA) no persisten nada.
    // El acceso PUBLICO (taxlab360) guarda en el localStorage de la computadora,
    // sin enviar nada a Supabase.
    const SIM_PREFIX = 'sire_';
    const MODULO = 'sire';

    function esClaveSim(key) {
        return typeof key === 'string' && key.indexOf(SIM_PREFIX) === 0;
    }

    function usuarioActual() {
        try { return JSON.parse(sessionStorage.getItem('sunat_auth') || '{}'); }
        catch (e) { return {}; }
    }

    function uid() {
        const u = usuarioActual();
        return u.usuario_id || u.id || null;
    }

    /** RUC de la empresa elegida en la Clave SOL (puerta 2) */
    function rucActivo() {
        try {
            const e = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null');
            if (e && e.ruc) return e.ruc;
        } catch (err) {}
        return usuarioActual().ruc || null;
    }

    function esMaster() {
        return String(usuarioActual().rol || '').toUpperCase() === 'MASTER';
    }

    /** ¿Este perfil guarda su avance? Lo dice la matriz roles_permisos. */
    function guardaAvance() {
        const u = usuarioActual();
        if (typeof u.puede_guardar === 'boolean') return u.puede_guardar;
        return esMaster();   // sesiones antiguas sin permisos cargados
    }

    // Convención de nombre para localStorage: sim_<usuario_id>_<ruc>_<clave>
    function nsKey(ruc, key) {
        return 'sim_' + (uid() || 'anon') + '_' + (ruc || 'anon') + '_' + key;
    }

    function prefijoLocal(ruc) {
        return 'sim_' + (uid() || 'anon') + '_' + (ruc || 'anon') + '_';
    }

    // Recorre las claves sim_<usuario>_<ruc>_sire_* guardadas en localStorage
    function clavesSimLocal(ruc) {
        const prefijo = prefijoLocal(ruc);
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const full = localStorage.key(i);
            if (full && full.indexOf(prefijo + SIM_PREFIX) === 0) {
                out.push({ full: full, key: full.slice(prefijo.length) });
            }
        }
        return out;
    }

    /** Acceso público: el avance queda en esta computadora (no va a Supabase). */
    function guardaLocal() {
        return String(usuarioActual().rol || '').toUpperCase() === 'PUBLICO';
    }

    function persistente(key) {
        return esClaveSim(key) && !!uid() && (guardaAvance() || guardaLocal());
    }

    // ---- Sincronización con Supabase: una fila por (usuario, RUC, modulo) ----
    let _syncTimer = null;

    function syncToServer() {
        if (!persistente('sire_') || !guardaAvance()) return;
        if (typeof authSupabaseClient === 'undefined' || !authSupabaseClient) return;
        clearTimeout(_syncTimer);
        _syncTimer = setTimeout(async function () {
            const ruc = rucActivo();
            if (!ruc) return;
            const estado = {};
            clavesSimLocal(ruc).forEach(function (item) {
                const v = localStorage.getItem(item.full);
                if (v !== null) estado[item.key] = v;
            });
            try {
                await authSupabaseClient.rpc('fn_guardar_avance', {
                    p_usuario: uid(), p_ruc: ruc, p_modulo: MODULO, p_estado: estado
                });
            } catch (e) {
                console.warn('No se pudo sincronizar el avance:', e);
            }
        }, 600);
    }

    // Carga el avance del usuario para la empresa activa hacia localStorage.
    // Se llama al iniciar sesión y al elegir empresa en la Clave SOL.
    async function hydrate() {
        if (!uid() || !guardaAvance() || typeof authSupabaseClient === 'undefined' || !authSupabaseClient) return;
        const ruc = rucActivo();
        if (!ruc) return;
        try {
            const { data, error } = await authSupabaseClient
                .from('avance_usuario')
                .select('estado')
                .eq('usuario_id', uid())
                .eq('ruc', ruc)
                .eq('modulo', MODULO)
                .maybeSingle();
            if (error || !data || !data.estado) return;
            Object.keys(data.estado).forEach(function (k) {
                if (esClaveSim(k) && data.estado[k] != null) {
                    localStorage.setItem(nsKey(ruc, k), data.estado[k]);
                }
            });
        } catch (e) {
            console.warn('No se pudo cargar el avance:', e);
        }
    }

    // Deja la simulación de la empresa activa como al inicio: propuestas
    // aceptadas, reemplazos, periodos presentados, constancias, contenido
    // editado y facturas emitidas. Devuelve { servidor: 'ok' | 'sin_permiso' |
    // 'no_aplica' } para avisar si el avance guardado en Supabase se mantuvo.
    async function clearAll(rucOpcional) {
        const ruc = rucOpcional || rucActivo() || 'anon';
        Object.keys(sessionStorage).forEach(function (k) {
            if (esClaveSim(k) || k.indexOf('rce_nav_generacion') === 0 || k === 'rce_gen_periodo') {
                sessionStorage.removeItem(k);
            }
        });
        clavesSimLocal(ruc).forEach(function (item) {
            try { localStorage.removeItem(item.full); } catch (e) {}
        });
        // Facturas emitidas en SEE - SOL por esta empresa (correlativo y reporte)
        [sessionStorage, localStorage].forEach(function (st) {
            try {
                Object.keys(st)
                    .filter(function (k) { return k.indexOf('taxlab_correlativo_' + ruc + '_') === 0; })
                    .forEach(function (k) { st.removeItem(k); });
                const lista = JSON.parse(st.getItem('taxlab_facturas') || '[]');
                const resto = lista.filter(function (f) { return String(f.emisor_ruc) !== String(ruc); });
                if (resto.length !== lista.length) st.setItem('taxlab_facturas', JSON.stringify(resto));
            } catch (e) { /* almacenamiento no disponible */ }
        });
        if (!guardaAvance() || !uid() || typeof authSupabaseClient === 'undefined' || !authSupabaseClient) {
            return { servidor: 'no_aplica' };
        }
        try {
            const r = await authSupabaseClient.rpc('fn_reiniciar_avance', {
                p_actor: uid(), p_objetivo: uid(), p_ruc: ruc,
                p_motivo: 'Reinicio desde el simulador'
            });
            return { servidor: r && r.error ? 'sin_permiso' : 'ok' };
        } catch (e) {
            return { servidor: 'sin_permiso' };
        }
    }

    return {
        esClaveSim: esClaveSim,
        esMaster: esMaster,
        guardaAvance: guardaAvance,
        rucActivo: rucActivo,
        hydrate: hydrate,
        clearAll: clearAll,
        getItem: function (key) {
            if (persistente(key)) return localStorage.getItem(nsKey(rucActivo(), key));
            return sessionStorage.getItem(key);
        },
        setItem: function (key, val) {
            if (persistente(key)) {
                localStorage.setItem(nsKey(rucActivo(), key), val);
                syncToServer();
            } else {
                sessionStorage.setItem(key, val);
            }
        },
        removeItem: function (key) {
            sessionStorage.removeItem(key);
            try { localStorage.removeItem(nsKey(rucActivo(), key)); } catch (e) {}
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
 * Función central para iniciar sesión verificando contra la tabla 'usuarios'.
 * La tabla 'usuarios' es SOLO personas (sin RUC): usuario, clave, nombres,
 * apellido_paterno, apellido_materno, correo, telefono, rol. El RUC y los datos
 * de cada empresa viven en 'empresas_simulador' (Puerta 2 / Clave SOL).
 */
async function loginConSupabase(usuario, clave, ruc = null) {
    // PUERTA 1 (usuario + contraseña, sin RUC): lo resuelve la función fn_login de
    // Supabase, que valida el rol contra la matriz roles_permisos y devuelve en la
    // sesión los módulos y empresas que ese rol tiene permitidos.
    if (!ruc && window.Sesion) {
        try {
            const res = await window.Sesion.login(usuario, clave);
            if (res && res.ok) return { success: true, user: res.sesion };
            return {
                success: false,
                reason: (res && res.motivo) || 'INVALID_CREDENTIALS',
                mensaje: (res && res.mensaje) || 'Credenciales incorrectas.'
            };
        } catch (e) {
            console.error('[auth] fn_login falló, se usa el método anterior', e);
        }
    }
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

        // VERIFICACIÓN DE ROL: entran todos los perfiles habilitados; lo que cada uno
        // puede hacer lo decide la matriz roles_permisos (ver sesion.js y fn_permisos).
        const ROLES_CON_ACCESO = ['INVITADO', 'ESTUDIANTE', 'ASISTENTE', 'PRO',
                                  'DOCENTE', 'PRUEBA', 'MASTER'];
        const userRolUpper = (sessionUser.rol || '').toUpperCase();
        if (ROLES_CON_ACCESO.indexOf(userRolUpper) === -1) {
            return {
                success: false,
                reason: 'ROL_RESTRINGIDO',
                rol: userRolUpper || 'INVITADO',
                mensaje: 'Tu perfil no tiene acceso al laboratorio.',
                user: sessionUser
            };
        }

        // Enriquecer la sesión con los permisos del rol antes de guardarla
        try {
            const perm = await authSupabaseClient.rpc('fn_permisos', { p_usuario: sessionUser.id });
            if (perm && perm.data && !perm.data.error) {
                sessionUser = Object.assign({}, sessionUser, perm.data);
            }
        } catch (e) { console.warn('[auth] no se pudieron cargar los permisos', e); }

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
                        <i class="fas fa-user-plus"></i> Registrarse
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
                    <div>Simulador de prueba | <strong>el Equipo Académico de Contabilidad CERTUS</strong></div>
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
            btnSubmit.textContent = 'Registrar y Abrir';
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
                const paterno = paternoInp.value.trim();
                const materno = maternoInp.value.trim();
                const email = emailInp.value.trim();
                const telefono = telefonoInp.value.trim();

                if (!nombres || !paterno || !materno || !email || !telefono) {
                    errorMsg.textContent = 'Completa nombres, apellido paterno, apellido materno, correo y teléfono.';
                    errorMsg.style.display = 'block';
                    return;
                }
                if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
                    errorMsg.textContent = 'Ingresa un correo electrónico válido.';
                    errorMsg.style.display = 'block';
                    return;
                }
                if (telefono.replace(/\D/g, '').length < 6) {
                    errorMsg.textContent = 'Ingresa un número de teléfono válido.';
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

                    // Datos personales que ahora viven en la tabla usuarios (sin RUC).
                    const datos = {
                        nombres: nombres,
                        apellido_paterno: paterno,
                        apellido_materno: materno,
                        correo: email,
                        telefono: telefono
                    };
                    const extraData = {
                        nombres, paterno, materno, email, telefono, deseaCapacitaciones
                    };

                    // El registro crea la cuenta como INVITADO y la deja lista para
                    // entrar de inmediato con el acceso limitado de ese perfil.
                    const res = window.Sesion
                        ? await window.Sesion.registrar(user, pass, datos)
                        : await registrarUsuarioExtendido(user, user, pass, denom, 'INVITADO', extraData);
                    if (res.ok || res.success) {
                        errorMsg.style.color = '#0284C7';
                        errorMsg.style.background = '#E0F2FE';
                        errorMsg.style.padding = '10px';
                        errorMsg.style.borderRadius = '6px';
                        errorMsg.innerHTML = `<i class="fas fa-check-circle"></i> <strong>¡Cuenta creada!</strong><br>Entras con el perfil <strong>INVITADO</strong>: puedes usar la <strong>Dinámica del Plan Contable</strong> y el <strong>Formulario Virtual 621</strong> con la empresa demo (RUC 20123456789).<br><br><span style="color:#B45309; font-weight:bold;"><i class="fas fa-flask"></i> Es un modo de demostración: tu avance no se guarda.</span> Para acceder a todos los aplicativos y guardar tu progreso, pide a tu docente que te matricule como estudiante.`;
                        errorMsg.style.display = 'block';
                        setTimeout(function () {
                            modal.style.display = 'none';
                            const dest = modal.dataset.pendingUrl;
                            if (dest) window.location.href = dest; else location.reload();
                        }, 4000);
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
                        const dest = modal.dataset.pendingUrl;
                        // Recargamos (o navegamos al destino) para que TODO se rearme
                        // ya con la sesion activa: nombre y rol en el header, y los
                        // guardias de los enlaces dejan de pedir iniciar sesion.
                        if (dest) window.location.href = dest;
                        else location.reload();
                    } else {
                        errorMsg.style.color = '#DC2626';
                        errorMsg.style.background = 'transparent';
                        errorMsg.style.padding = '0';
                        errorMsg.textContent = loginRes.mensaje ||
                            'Credenciales incorrectas o usuario no registrado.';
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
                btnSubmit.textContent = mode === 'register' ? 'Registrar' : 'Entrar y Abrir Aplicativo';
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
        // El alta SIEMPRE pasa por la función fn_registrar_usuario (SECURITY DEFINER):
        // anon no puede escribir en usuarios directamente, y ese RPC es el único
        // camino sancionado. Crea la cuenta como INVITADO con sus datos personales.
        const { data, error } = await authSupabaseClient.rpc('fn_registrar_usuario', {
            p_usuario: usuario,
            p_clave: clave,
            p_nombres: extra.nombres || null,
            p_apellido_paterno: extra.paterno || null,
            p_apellido_materno: extra.materno || null,
            p_correo: extra.email || null,
            p_telefono: extra.telefono || null
        });
        if (error) {
            console.error("Error al registrar en Supabase:", error);
            return { success: false, error: error.message };
        }
        if (!data || !data.ok) {
            return { success: false, error: (data && data.mensaje) || 'No se pudo registrar el usuario.' };
        }
        // Deja la sesión activa igual que Sesion.registrar
        if (window.Sesion && data.sesion) {
            try { sessionStorage.setItem('sunat_auth', JSON.stringify(data.sesion)); } catch (e) {}
        }
        return { success: true, ok: true, rol: 'INVITADO', sesion: data.sesion };
    } catch (e) {
        console.error("Error al registrar participante:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Aviso breve "Debe iniciar sesión": un mensaje flotante que se borra solo a los
 * pocos segundos. NO abre el modal de acceso; para iniciar sesión el usuario usa
 * el botón "Iniciar Sesión" de la portada.
 */
let _avisoLoginTimer = null;
window.mostrarAvisoLogin = function (texto) {
    let aviso = document.getElementById('aviso-login-flash');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'aviso-login-flash';
        aviso.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);' +
            'z-index:1000000;background:#1E395B;color:#fff;padding:12px 22px;border-radius:10px;' +
            'font-family:Roboto,Arial,sans-serif;font-size:14px;font-weight:600;' +
            'box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;align-items:center;gap:10px;' +
            'opacity:0;transition:opacity .2s ease;';
        document.body.appendChild(aviso);
    }
    aviso.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' +
        (texto || 'Debe iniciar sesión para continuar.');
    requestAnimationFrame(function () { aviso.style.opacity = '1'; });
    clearTimeout(_avisoLoginTimer);
    _avisoLoginTimer = setTimeout(function () {
        aviso.style.opacity = '0';
        setTimeout(function () { if (aviso.parentNode) aviso.remove(); }, 250);
    }, 2500);
};

/**
 * Interceptar clics en botones de aplicativo si el usuario no está autenticado.
 * Sin sesión sólo se muestra un aviso breve; el modal de acceso queda reservado
 * para el botón "Iniciar Sesión" de la portada.
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

    // Detener navegación directa y avisar sin abrir el modal
    e.preventDefault();
    e.stopPropagation();

    window.mostrarAvisoLogin('Debe iniciar sesión para abrir el aplicativo.');
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
 * "Salir" de la empresa: cierra SOLO la Clave SOL (empresa activa) y vuelve a la
 * portada. CONSERVA la sesión de plataforma (sunat_auth), por lo que NO se vuelve
 * a pedir usuario y contraseña. Para cerrar la sesión de plataforma por completo
 * está el botón "Cerrar Sesión" de la portada (cerrarSesionIndex).
 */
function logout() {
    sessionStorage.removeItem('sunat_empresa');
    window.location.href = 'index.html';
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

/**
 * Pinta en el header del simulador la EMPRESA elegida en la Clave SOL
 * (sunat_empresa: razon_social + ruc). Si aun no se eligio empresa, cae al
 * nombre del usuario de plataforma (sunat_auth). Cubre los distintos formatos
 * de header de las paginas: #header-razon (dashboard), .company-name/.company-ruc
 * (tramites) y los <span>Bienvenido, ...</span> del resto.
 */
window.pintarEmpresaEnHeader = function () {
    let nombre = null, ruc = null;
    try {
        const emp = JSON.parse(sessionStorage.getItem('sunat_empresa') || 'null');
        if (emp && (emp.razon_social || emp.ruc)) {
            nombre = emp.razon_social || null;
            ruc = emp.ruc || null;
        }
    } catch (e) {}
    if (!nombre) {
        try {
            const a = JSON.parse(sessionStorage.getItem('sunat_auth') || 'null');
            if (a) { nombre = a.denominacion || a.usuario || null; ruc = ruc || a.ruc || null; }
        } catch (e) {}
    }
    if (!nombre) return;

    // dashboard.html: <strong id="header-razon">
    const razonEl = document.getElementById('header-razon');
    if (razonEl) razonEl.textContent = nombre;

    // tramites.html: nombre y RUC en el dropdown
    document.querySelectorAll('.company-name').forEach(el => { el.textContent = nombre; });
    if (ruc) document.querySelectorAll('.company-ruc').forEach(el => { el.textContent = 'RUC: ' + ruc; });

    // Resto de paginas: <span>Bienvenido, EMPRESA ... <i caret></i></span>
    const caret = '<i class="fas fa-caret-down"></i>';
    document.querySelectorAll('span').forEach(function (sp) {
        const t = (sp.textContent || '').replace(/^\s+/, '');
        if (t.indexOf('Bienvenido,') !== 0) return;
        if (sp.querySelector('#header-razon')) return; // dashboard: ya actualizado arriba
        const tieneCaret = !!sp.querySelector('.fa-caret-down');
        sp.innerHTML = 'Bienvenido, ' + nombre + (tieneCaret ? ' ' + caret : '');
    });
};

// Adjuntar evento salir a botones de salir si existen
document.addEventListener('DOMContentLoaded', () => {
    const btnSalir = document.querySelector('.btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Nombre de la empresa (Clave SOL) en el header del simulador
    window.pintarEmpresaEnHeader();

    // Mostrar el tipo de usuario (rol de plataforma) junto al estado de domicilio
    const userSession = sessionStorage.getItem('sunat_auth');
    if (userSession) {
        try {
            const userData = JSON.parse(userSession);
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

// ============================================================================
// Widget flotante "Ver empresas": boton con el logo del gato en movimiento que
// abre el listado de las 10 empresas del laboratorio (RUC, razon social, regimen
// tributario, actividad economica y regimen laboral). Recuerda que la Clave SOL
// de TODAS es Usuario: SIST / Contrasena: NORTON. Se inyecta en todas las paginas.
// ============================================================================
(function initEmpresasWidget() {
    'use strict';

    // Datos de respaldo por si no hay conexion con Supabase (se refrescan al abrir)
    var EMPRESAS_FALLBACK = [
        { ruc: '20123456789', razon_social: 'EMPRESA DEMO S.A.C.', regimen_tributario: 'Regimen General', actividad_economica_sunat: 'Vta. May. de Computadoras, Equipo Periferico y Programas de Informatica', regimen_laboral: 'Regimen Laboral General' },
        { ruc: '20455678120', razon_social: 'TRANSPORTES CARGA RAPIDA S.R.L.', regimen_tributario: 'Regimen MYPE Tributario', actividad_economica_sunat: 'Transporte de Carga por Carretera', regimen_laboral: 'Pequena Empresa (REMYPE)' },
        { ruc: '20487563219', razon_social: 'TEXTILES ALPACA EXPORT S.A.C.', regimen_tributario: 'Regimen General', actividad_economica_sunat: 'Fabricacion de Prendas de Vestir, Excepto Prendas de Piel', regimen_laboral: 'Regimen Laboral General' },
        { ruc: '20512347895', razon_social: 'BOTICA SALUD TOTAL S.A.C.', regimen_tributario: 'Regimen MYPE Tributario', actividad_economica_sunat: 'Vta. Min. de Productos Farmaceuticos y Articulos de Tocador en Comercios Especializados', regimen_laboral: 'Regimen Laboral General' },
        { ruc: '20530147852', razon_social: 'AGROEXPORT VALLE VERDE S.A.C.', regimen_tributario: 'Regimen General', actividad_economica_sunat: 'Vta. May. de Otras Materias Primas Agropecuarias', regimen_laboral: 'Regimen Laboral Agrario' },
        { ruc: '20548912343', razon_social: 'RESTAURANTES SABOR ANDINO E.I.R.L.', regimen_tributario: 'Regimen MYPE Tributario', actividad_economica_sunat: 'Actividades de Restaurantes y de Servicio Movil de Comidas', regimen_laboral: 'Pequena Empresa (REMYPE)' },
        { ruc: '20601458722', razon_social: 'COMERCIAL FERRETERA SUR S.A.C.', regimen_tributario: 'Regimen General', actividad_economica_sunat: 'Vta. May. de Materiales de Construccion, Articulos de Ferreteria y Equipo', regimen_laboral: 'Regimen Laboral General' },
        { ruc: '20601987458', razon_social: 'CONSTRUCTORA HORIZONTE ANDINO S.A.C.', regimen_tributario: 'Regimen General', actividad_economica_sunat: 'Construccion de Edificios Completos', regimen_laboral: 'Regimen Laboral de Construccion Civil' },
        { ruc: '20602345671', razon_social: 'CONSULTORES CONTABLES & ASOCIADOS E.I.R.L.', regimen_tributario: 'Regimen Especial de Renta (RER)', actividad_economica_sunat: 'Actividades de Contabilidad, Teneduria de Libros y Auditoria', regimen_laboral: 'Microempresa (REMYPE)' },
        { ruc: '20609876540', razon_social: 'MINIMARKET DON PEPE E.I.R.L.', regimen_tributario: 'Regimen Especial de Renta (RER)', actividad_economica_sunat: 'Vta. Min. en Almacenes No Especializados con Surtido de Alimentos', regimen_laboral: 'Microempresa (REMYPE)' }
    ];

    // Expuesto para el modo público: la Clave SOL local (sesion.js) valida el RUC
    // contra esta lista cuando no hay conexión con Supabase.
    window.EMPRESAS_TAXLAB = EMPRESAS_FALLBACK;

    var CSS = [
        '#emp-fab{position:fixed;bottom:20px;right:20px;z-index:100000;display:flex;align-items:center;gap:10px;',
        'background:#004B91;color:#fff;padding:6px 18px 6px 6px;border-radius:40px;cursor:pointer;',
        'font-family:Roboto,Arial,sans-serif;font-weight:700;font-size:14px;border:2px solid #fff;',
        'box-shadow:0 8px 22px rgba(0,0,0,.28);transition:transform .15s ease,background .15s ease;}',
        '#emp-fab:hover{transform:translateY(-2px) scale(1.03);background:#003a72;}',
        '#emp-fab .emp-fab-cat{width:52px;height:52px;border-radius:50%;overflow:hidden;flex-shrink:0;',
        'background:#fff;border:2px solid #EAF3FB;}',
        '#emp-fab .emp-fab-cat video{width:100%;height:100%;object-fit:cover;display:block;}',
        '#emp-fab .emp-fab-text{white-space:nowrap;line-height:1;}',
        '#emp-fab .emp-fab-text small{display:block;font-weight:400;font-size:10.5px;opacity:.85;margin-top:2px;}',
        '#emp-modal-ov{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);',
        'display:flex;align-items:center;justify-content:center;padding:16px;font-family:Roboto,Arial,sans-serif;}',
        '#emp-modal{background:#fff;width:100%;max-width:1000px;max-height:92vh;border-radius:14px;overflow:hidden;',
        'display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,.45);}',
        '#emp-modal .emp-head{background:#004B91;color:#fff;padding:14px 20px;display:flex;align-items:center;gap:12px;}',
        '#emp-modal .emp-head .emp-cat{width:38px;height:38px;border-radius:50%;overflow:hidden;background:#fff;flex-shrink:0;}',
        '#emp-modal .emp-head .emp-cat video{width:100%;height:100%;object-fit:cover;display:block;}',
        '#emp-modal .emp-head b{font-size:16px;letter-spacing:.3px;}',
        '#emp-modal .emp-head span{font-size:12px;opacity:.9;display:block;font-weight:400;}',
        '#emp-modal .emp-x{margin-left:auto;background:none;border:none;color:#fff;font-size:26px;cursor:pointer;line-height:1;}',
        '#emp-modal .emp-cred{background:#FEF3C7;border-bottom:1px solid #F59E0B;color:#7C4A03;padding:11px 20px;',
        'font-size:13.5px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
        '#emp-modal .emp-cred .k{background:#B45309;color:#fff;padding:2px 10px;border-radius:6px;font-weight:700;letter-spacing:.5px;}',
        '#emp-modal .emp-body{overflow:auto;padding:0;}',
        '#emp-modal table{border-collapse:collapse;width:100%;font-size:12.5px;color:#1f2937;}',
        '#emp-modal thead th{position:sticky;top:0;background:#EAF3FB;color:#004B91;text-align:left;padding:10px 12px;',
        'font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid #CDE0EE;white-space:nowrap;}',
        '#emp-modal tbody td{padding:9px 12px;border-bottom:1px solid #EEF2F7;vertical-align:top;}',
        '#emp-modal tbody tr:nth-child(even){background:#F8FAFC;}',
        '#emp-modal tbody tr:hover{background:#EFF6FF;}',
        '#emp-modal td.ruc{font-variant-numeric:tabular-nums;font-weight:700;color:#004B91;white-space:nowrap;}',
        '#emp-modal td.emp{font-weight:600;}',
        '#emp-modal .emp-foot{padding:8px 20px;font-size:11.5px;color:#64748b;border-top:1px solid #E2E8F0;background:#F8FAFC;}',
        '#emp-fab-menu{position:fixed;bottom:84px;right:20px;z-index:100000;display:flex;flex-direction:column;gap:8px;font-family:Roboto,Arial,sans-serif;}',
        '#emp-fab-menu .emp-fab-menu-item{background:#fff;color:#004B91;border:1px solid #cfe0f2;border-radius:10px;padding:11px 16px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.20);display:flex;align-items:center;gap:10px;white-space:nowrap;transition:transform .15s ease,background .15s ease,color .15s ease;}',
        '#emp-fab-menu .emp-fab-menu-item:hover{background:#004B91;color:#fff;transform:translateY(-1px);}',
        // Preferencias del alumno: botón a la izquierda y/o reducido (solo el gatito)
        'html.emp-fab-izq #emp-fab,html.emp-fab-izq #emp-fab-menu{right:auto;left:20px;}',
        'html.emp-fab-mini #emp-fab .emp-fab-text{display:none;}',
        'html.emp-fab-mini #emp-fab{padding:5px;}',
        'html.emp-fab-mini #emp-fab .emp-fab-cat{width:40px;height:40px;}',
        'html.emp-fab-mini #emp-fab-menu{bottom:66px;}',
        '#emp-fab-menu .emp-fab-menu-sep{height:1px;background:#cfe0f2;margin:2px 4px;}',
        '#emp-fab-menu .emp-fab-menu-item.sec{font-weight:500;font-size:12px;padding:8px 14px;color:#334155;}',
        '@media(max-width:640px){#emp-fab .emp-fab-text{display:none;}#emp-fab{padding:6px;} #emp-modal table{font-size:11.5px;}}'
    ].join('');

    function inyectarCss() {
        if (document.getElementById('emp-widget-css')) return;
        var st = document.createElement('style');
        st.id = 'emp-widget-css';
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    function catVideo(clase) {
        return '<div class="' + clase + '"><video src="logo_gif_gato.mp4" autoplay loop muted playsinline></video></div>';
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function filas(lista) {
        return lista.map(function (e, i) {
            return '<tr><td>' + (i + 1) + '</td>' +
                '<td class="ruc">' + esc(e.ruc) + '</td>' +
                '<td class="emp">' + esc(e.razon_social) + '</td>' +
                '<td>' + esc(e.regimen_tributario) + '</td>' +
                '<td>' + esc(e.actividad_economica_sunat) + '</td>' +
                '<td>' + esc(e.regimen_laboral) + '</td></tr>';
        }).join('');
    }

    // Sonido del gatito: suena al abrir la lista de empresas y se apaga al cerrarla
    var miau = null;
    function sonarMiau() {
        try {
            if (!miau) miau = new Audio('miau-triste.mp3');
            miau.currentTime = 0;
            var p = miau.play();
            if (p && p.catch) p.catch(function () { /* el navegador bloqueó el audio */ });
        } catch (e) { /* sin audio disponible */ }
    }
    function callarMiau() {
        if (!miau) return;
        try { miau.pause(); miau.currentTime = 0; } catch (e) {}
    }
    function cerrarModal(ov) {
        ov.style.display = 'none';
        callarMiau();
    }

    function abrirModal() {
        inyectarCss();
        sonarMiau();
        var ov = document.getElementById('emp-modal-ov');
        if (ov) { ov.style.display = 'flex'; return; }

        ov = document.createElement('div');
        ov.id = 'emp-modal-ov';
        ov.innerHTML =
            '<div id="emp-modal">' +
                '<div class="emp-head">' + catVideo('emp-cat') +
                    '<div><b>Empresas del laboratorio</b>' +
                    '<span>Elige el RUC en la Clave SOL para trabajar con esa empresa</span></div>' +
                    '<button class="emp-x" title="Cerrar">&times;</button>' +
                '</div>' +
                '<div class="emp-cred"><i class="fas fa-key"></i>' +
                    '<span>La Clave SOL es la misma para <b>todas</b> las empresas:</span>' +
                    '<span class="k">Usuario: SIST</span>' +
                    '<span class="k">Contrase&ntilde;a: NORTON</span></div>' +
                '<div class="emp-body">' +
                    '<table><thead><tr>' +
                        '<th>N&deg;</th><th>RUC</th><th>Empresa</th>' +
                        '<th>R&eacute;gimen Tributario</th><th>Actividad Econ&oacute;mica</th>' +
                        '<th>R&eacute;gimen Laboral</th>' +
                    '</tr></thead><tbody id="emp-tbody">' + filas(EMPRESAS_FALLBACK) + '</tbody></table>' +
                '</div>' +
                '<div class="emp-foot"><i class="fas fa-info-circle"></i> Datos ficticios para fines academicos. ' +
                    'Son ' + EMPRESAS_FALLBACK.length + ' empresas simuladas.</div>' +
            '</div>';
        document.body.appendChild(ov);

        ov.querySelector('.emp-x').onclick = function () { cerrarModal(ov); };
        ov.addEventListener('click', function (ev) { if (ev.target === ov) cerrarModal(ov); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && ov.style.display !== 'none') cerrarModal(ov);
        });

        // Refrescar desde Supabase (si esta disponible) para no depender del respaldo
        try {
            if (typeof authSupabaseClient !== 'undefined' && authSupabaseClient) {
                authSupabaseClient.from('empresas_simulador')
                    .select('ruc, razon_social, regimen_tributario, actividad_economica_sunat, regimen_laboral')
                    .order('razon_social', { ascending: true })
                    .then(function (r) {
                        if (!r.error && r.data && r.data.length) {
                            var tb = document.getElementById('emp-tbody');
                            if (tb) tb.innerHTML = filas(r.data);
                        }
                    });
            }
        } catch (e) { /* queda el respaldo */ }
    }

    // Posición y tamaño del botón: preferencia del navegador (no es avance del alumno)
    var PREF_FAB = 'taxlab_fab_pref';
    function leerPrefFab() {
        try { return JSON.parse(localStorage.getItem(PREF_FAB) || '{}') || {}; } catch (e) { return {}; }
    }
    function aplicarPrefFab(p) {
        var h = document.documentElement;
        h.classList.toggle('emp-fab-izq', !!p.izq);
        h.classList.toggle('emp-fab-mini', !!p.mini);
    }
    function cambiarPrefFab(clave) {
        var p = leerPrefFab();
        p[clave] = !p[clave];
        try { localStorage.setItem(PREF_FAB, JSON.stringify(p)); } catch (e) { /* se aplica solo en esta página */ }
        aplicarPrefFab(p);
    }

    function cerrarMenuFab() {
        var m = document.getElementById('emp-fab-menu');
        if (m) m.remove();
    }

    function abrirEncuestaVentana() {
        window.open('encuesta.html', 'encuestaCertus',
            'width=560,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
    }

    function toggleMenuFab(e) {
        if (e) e.stopPropagation();
        if (document.getElementById('emp-fab-menu')) { cerrarMenuFab(); return; }
        inyectarCss();
        var m = document.createElement('div');
        var pref = leerPrefFab();
        m.id = 'emp-fab-menu';
        m.innerHTML =
            '<button type="button" class="emp-fab-menu-item" data-act="empresas"><i class="fas fa-building"></i> Ver empresas</button>' +
            '<button type="button" class="emp-fab-menu-item" data-act="encuesta"><i class="fas fa-clipboard-list"></i> Responder encuesta</button>' +
            '<div class="emp-fab-menu-sep"></div>' +
            '<button type="button" class="emp-fab-menu-item sec" data-act="lado"><i class="fas ' + (pref.izq ? 'fa-arrow-right' : 'fa-arrow-left') + '"></i> ' +
                (pref.izq ? 'Mover a la derecha' : 'Mover a la izquierda') + '</button>' +
            '<button type="button" class="emp-fab-menu-item sec" data-act="mini"><i class="fas ' + (pref.mini ? 'fa-expand-alt' : 'fa-compress-alt') + '"></i> ' +
                (pref.mini ? 'Mostrar completo' : 'Hacer más pequeño') + '</button>';
        document.body.appendChild(m);
        m.querySelector('[data-act="lado"]').addEventListener('click', function (ev) { ev.stopPropagation(); cerrarMenuFab(); cambiarPrefFab('izq'); });
        m.querySelector('[data-act="mini"]').addEventListener('click', function (ev) { ev.stopPropagation(); cerrarMenuFab(); cambiarPrefFab('mini'); });
        m.querySelector('[data-act="empresas"]').addEventListener('click', function (ev) { ev.stopPropagation(); cerrarMenuFab(); abrirModal(); });
        m.querySelector('[data-act="encuesta"]').addEventListener('click', function (ev) { ev.stopPropagation(); cerrarMenuFab(); abrirEncuestaVentana(); });
        setTimeout(function () { document.addEventListener('click', cerrarMenuFab, { once: true }); }, 0);
    }

    function crearBoton() {
        if (document.getElementById('emp-fab')) return;
        inyectarCss();
        aplicarPrefFab(leerPrefFab());
        var fab = document.createElement('div');
        fab.id = 'emp-fab';
        fab.title = 'Empresas del laboratorio y encuesta';
        fab.innerHTML = catVideo('emp-fab-cat') +
            '<span class="emp-fab-text">Opciones<small>Empresas &middot; Encuesta</small></span>';
        fab.addEventListener('click', toggleMenuFab);
        document.body.appendChild(fab);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', crearBoton);
    } else {
        crearBoton();
    }

    window.verEmpresas = abrirModal;
})();

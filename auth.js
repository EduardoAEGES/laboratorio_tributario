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

/**
 * Función central para iniciar sesión verificando contra la tabla 'usuarios'
 * Asume una tabla pública en Supabase llamada 'usuarios' con columnas: ruc, usuario, clave
 */
async function loginConSupabase(ruc, usuario, clave) {
    // Si no hay cliente de Supabase (por falta de credenciales)
    if (!authSupabaseClient) {
        console.warn("Supabase no está configurado.");
        return false;
    }

    try {
        const { data, error } = await authSupabaseClient
            .from('usuarios')
            .select('*')
            .eq('ruc', ruc)
            .eq('usuario', usuario)
            .eq('clave', clave)
            .single();

        if (error || !data) {
            console.error("Credenciales inválidas", error);
            return false;
        }

        // Guardar sesión
        sessionStorage.setItem('sunat_auth', JSON.stringify(data));

        // Si es MASTER, cargar el estado guardado en Supabase antes de continuar
        try { await window.SimStore.hydrate(); } catch (e) {}

        return true;
    } catch (e) {
        console.error("Error en login:", e);
        return false;
    }
}

/**
 * Función para verificar si hay una sesión activa.
 * Debe incluirse en la cabecera de las páginas protegidas.
 */
function checkAuth() {
    const authData = sessionStorage.getItem('sunat_auth');
    if (!authData) {
        // Redirigir a login si no hay sesión
        // Guarda la URL actual para volver después del login
        sessionStorage.setItem('loginReferrer', window.location.pathname);
        window.location.href = 'login.html';
    }
}

/**
 * Cierra la sesión
 */
function logout() {
    // Cierra la sesión pero CONSERVA el estado temporal de la simulación
    // (periodos generados, etc.). Ese estado solo se borra al volver a
    // index.html o con el botón "Reiniciar simulación" de sol.html.
    sessionStorage.removeItem('sunat_auth');
    window.location.href = 'sol.html';
}

/**
 * Registra un nuevo usuario en la base de datos
 */
async function registrarUsuario(ruc, usuario, clave, denominacion) {
    if (!authSupabaseClient) {
        console.error("Supabase no está configurado.");
        return { success: false, error: "Conexión a base de datos no configurada." };
    }

    try {
        const { data, error } = await authSupabaseClient
            .from('usuarios')
            .insert([
                { ruc, usuario, clave, denominacion }
            ]);

        if (error) {
            console.error("Error al registrar", error);
            // Mostrar si es un error por duplicación u otra restricción
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e) {
        console.error("Error catched:", e);
        return { success: false, error: e.message };
    }
}

// Verifica en qué página estamos
const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname.endsWith('login');
const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';

// Solo requerir autenticación para otras páginas (los simuladores)
if (!isLoginPage && !isIndexPage) {
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

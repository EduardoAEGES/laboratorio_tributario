/**
 * auth.js
 * Configuración de Supabase y funciones de autenticación
 */

// NOTA: Reemplazar estas constantes con las reales de Supabase proporcionadas por el usuario.
const AUTH_SUPABASE_URL = 'https://klmjmlhwuzhymrplemgw.supabase.co';
const AUTH_SUPABASE_ANON_KEY = 'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b';

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

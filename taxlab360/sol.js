document.addEventListener('DOMContentLoaded', () => {
    console.log('SUNAT SOL Landing Page Loaded');



    // Animate cards on load
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${index * 0.2}s`;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });

    // Botón "Reiniciar simulación": deja la empresa activa como al inicio
    // (propuestas aceptadas, reemplazos, presentados, constancias y facturas).
    const btnReiniciar = document.getElementById('btn-reiniciar-simulacion');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', async () => {
            let res = { servidor: 'no_aplica' };
            try { if (window.SimStore && SimStore.clearAll) res = (await SimStore.clearAll()) || res; } catch (e) {}

            // Reponer la encuesta de satisfacción: se borran las marcas de la
            // sesión y también las antiguas permanentes de localStorage
            // (versiones previas de survey.js las dejaban para siempre).
            [sessionStorage, localStorage].forEach(function (st) {
                Object.keys(st)
                    .filter((k) => k.indexOf('survey_') === 0)
                    .forEach((k) => { try { st.removeItem(k); } catch (e) {} });
            });

            if (res.servidor === 'sin_permiso') {
                alert('Se reinició la información de esta computadora, pero tu perfil no puede borrar el avance guardado en el laboratorio. ' +
                      'Pide a tu docente que reinicie tu avance desde el Gestor.');
            } else {
                alert('Simulación reiniciada: la empresa quedó como al inicio.');
            }
        });
    }
});

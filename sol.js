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

    // Botón "Reiniciar simulación": borra el estado temporal de la simulación
    // (aceptaciones, periodos presentados y resumen del reporte)
    const btnReiniciar = document.getElementById('btn-reiniciar-simulacion');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', async () => {
            // RUC del usuario actual para limpiar también el estado persistido (MASTER)
            let ruc = 'anon';
            try {
                const a = JSON.parse(sessionStorage.getItem('sunat_auth') || '{}');
                if (a.ruc) ruc = a.ruc;
            } catch (e) {}

            ['sire_aceptado', 'sire_presentado', 'sire_resumen',
             'rce_nav_generacion', 'rce_gen_periodo', 'sire_export_tickets', 'sire_rce_export_tickets'].forEach((k) => {
                sessionStorage.removeItem(k);
            });
            // Borrar TODO el estado y contenido persistido del MASTER en localStorage
            // (sim_<ruc>_sire_*: incluye tickets, aceptado, presentado y contenido editado)
            const prefijoSim = 'sim_' + ruc + '_sire_';
            Object.keys(localStorage)
                .filter((k) => k.indexOf(prefijoSim) === 0)
                .forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });

            // Borrar también el estado guardado en Supabase (usuarios MASTER)
            if (ruc !== 'anon' && typeof window.supabase !== 'undefined') {
                try {
                    const sb = window.supabase.createClient(
                        'https://klmjmlhwuzhymrplemgw.supabase.co',
                        'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b'
                    );
                    await sb.from('sire_estado').delete().eq('ruc', ruc);
                } catch (e) { console.warn('No se pudo borrar el estado en Supabase:', e); }
            }

            alert('Simulación reiniciada: se borró la información de los registros.');
        });
    }
});

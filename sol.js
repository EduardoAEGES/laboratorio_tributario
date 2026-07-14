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
        btnReiniciar.addEventListener('click', () => {
            ['sire_aceptado', 'sire_presentado', 'sire_resumen',
             'rce_nav_generacion', 'rce_gen_periodo', 'sire_export_tickets'].forEach((k) => {
                sessionStorage.removeItem(k);
            });
            alert('Simulación reiniciada: se borró la información temporal de los registros.');
        });
    }
});

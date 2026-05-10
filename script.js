document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs functionality
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Sub-tabs (Personas, Negocios, Aduanas)
    const subTabs = document.querySelectorAll('.sub-tab');
    const servicesContent = document.querySelector('.services-content');

    const contentData = {
        'Personas': `
            <div class="service-item">
                <h3>Solicitar la suspensión de retenciones de cuarta categoría - Formulario N° 1609</h3>
                <p>Puedes presentar tu solicitud de suspensión de retenciones de cuarta categoría si proyectas que tus ingresos en el año no van a superar el monto afecto.</p>
            </div>
            <div class="service-item">
                <h3>Suspensión de retenciones y pagos a cuenta de renta de cuarta categoría</h3>
                <p>Si eres un trabajador independiente que genera rentas de cuarta categoría (emite recibos por honorarios), puedes solicitar la suspensión.</p>
            </div>
            <div class="service-item">
                <h3>Consultar información de mis recibos por honorarios y notas de crédito</h3>
                <p>Si eres un trabajador independiente y necesitas encontrar la información de tus recibos por honorarios electrónicos emitidos.</p>
            </div>
        `,
        'Negocios y empresas': `
            <div class="service-item">
                <h3>Declarar y pagar impuestos mensuales (IGV-Renta)</h3>
                <p>Como empresa, debes cumplir mensualmente con la declaración y pago de tus impuestos de acuerdo al cronograma de vencimientos.</p>
            </div>
            <div class="service-item">
                <h3>Obtener el RUC para negocios</h3>
                <p>Si vas a iniciar una actividad económica como empresa (Persona Jurídica) o como negocio unipersonal.</p>
            </div>
            <div class="service-item">
                <h3>Emitir Factura Electrónica</h3>
                <p>Emite tus comprobantes de pago de manera electrónica a través de los sistemas disponibles de la SUNAT.</p>
            </div>
        `,
        'Aduanas': `
            <div class="service-item">
                <h3>Consultar estado de envío postal (Importa Fácil)</h3>
                <p>Si has realizado una compra en el extranjero y deseas saber el estado de tu paquete enviado a través de servicios postales.</p>
            </div>
            <div class="service-item">
                <h3>Declaración jurada de equipaje</h3>
                <p>Información para pasajeros que ingresan al país sobre lo que deben declarar y los beneficios de la franquicia.</p>
            </div>
            <div class="service-item">
                <h3>Operatividad Aduanera</h3>
                <p>Accede a consultas sobre manifiestos de carga, declaraciones, y otros servicios de operatividad de comercio exterior.</p>
            </div>
        `
    };

    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            subTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content based on tab text
            const key = tab.textContent;
            if (contentData[key]) {
                servicesContent.innerHTML = contentData[key];
                // Add appearance animation
                servicesContent.style.opacity = 0;
                setTimeout(() => {
                    servicesContent.style.opacity = 1;
                }, 50);
            }
        });
    });

    // Add CSS for simple fade transition
    servicesContent.style.transition = 'opacity 0.3s ease';

    // Search Box Interaction
    const searchInput = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.search-btn');

    searchBtn.addEventListener('click', () => {
        if (searchInput.value.trim() !== "") {
            alert(`Buscando: ${searchInput.value}... (Simulación)`);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

});

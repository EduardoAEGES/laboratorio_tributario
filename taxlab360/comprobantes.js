document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // CONFIGURACIÓN DE DESPLIEGUE (DEPLOYMENT)
    // =================================================================================
    // Si subes tu backend a Render/Railway, cambia esta URL.
    // Ejemplo: const BACKEND_URL = 'https://mi-backend.onrender.com';
    const BACKEND_URL = 'https://taxproject-grh5.onrender.com';
    // =================================================================================

    const rucInput = document.getElementById('ruc-input');
    const razonSocialDisplay = document.getElementById('razon-social-display');

    if (rucInput && razonSocialDisplay) {
        rucInput.addEventListener('input', (e) => {
            const ruc = e.target.value;
            e.target.value = ruc.replace(/\D/g, ''); // Solo números

            if (e.target.value.length !== 11) {
                razonSocialDisplay.textContent = '';
                razonSocialDisplay.style.backgroundColor = '#e0e0e0';
                razonSocialDisplay.style.border = 'none';
            } else {
                const currentRuc = e.target.value;

                // Mostrar estado "Cargando"
                razonSocialDisplay.textContent = 'Consultando SUNAT...';
                razonSocialDisplay.style.backgroundColor = '#fff';
                razonSocialDisplay.style.color = '#666';
                razonSocialDisplay.style.border = '1px solid #ccc';
                razonSocialDisplay.style.padding = '0 5px';
                razonSocialDisplay.style.display = 'flex';
                razonSocialDisplay.style.alignItems = 'center';

                // ESTRATEGIA DE CONSULTA (Scraping Puro)
                // 1. Intentar Backend Configurado (Backend Propio)
                // 2. Intentar API Pública (Respaldo)

                fetch(`${BACKEND_URL}/consultar-ruc?ruc=${currentRuc}`)
                    .then(response => {
                        if (!response.ok) throw new Error('Backend no responde');
                        return response.json();
                    })
                    .then(data => {
                        if (data && data.nombre) {
                            displayResult(data.nombre);
                        } else {
                            throw new Error('Backend sin datos');
                        }
                    })
                    .catch(backendError => {
                        console.log('Fallo Backend Propio, intentando API pública...', backendError);

                        // 2. Fallback API Pública (apis.net.pe)
                        fetch(`https://api.apis.net.pe/v1/ruc?numero=${currentRuc}`)
                            .then(response => {
                                if (!response.ok) throw new Error('API Pública no responde');
                                return response.json();
                            })
                            .then(data => {
                                if (data && data.nombre) {
                                    displayResult((data.nombre));
                                } else {
                                    throw new Error('API Pública sin datos');
                                }
                            })
                            .catch(apiError => {
                                console.log('Todo falló.', apiError);
                                displayResult('NO ENCONTRADO (Verifique conexión)');
                            });
                    });
            }
        });
    }

    function displayResult(nombre) {
        const razonSocialDisplay = document.getElementById('razon-social-display');
        razonSocialDisplay.textContent = nombre;
        razonSocialDisplay.style.backgroundColor = '#fff';
        razonSocialDisplay.style.border = '1px solid #7f9db9';
        razonSocialDisplay.style.padding = '0 5px';
        razonSocialDisplay.style.display = 'flex';
        razonSocialDisplay.style.alignItems = 'center';
        razonSocialDisplay.style.color = '#000';
        razonSocialDisplay.style.fontWeight = 'bold';
    }

    // Navegación a Emitir Factura
    const btnContinuar = document.querySelector('.btn-continuar');
    if (btnContinuar) {
        btnContinuar.addEventListener('click', (e) => {
            e.preventDefault();

            const ruc = document.getElementById('ruc-input').value;
            const razon = document.getElementById('razon-social-display').textContent;
            const monedaSelect = document.querySelector('.input-select');
            const moneda = monedaSelect ? monedaSelect.value : 'SOLES';

            if (ruc.length === 11 && razon && !razon.includes('NO ENCONTRADO')) {
                window.location.href = `emitir_factura.html?ruc=${encodeURIComponent(ruc)}&razon=${encodeURIComponent(razon)}&moneda=${encodeURIComponent(moneda)}`;
            } else {
                alert('Por favor ingrese un RUC válido y espere la consulta.');
            }
        });
    }
});

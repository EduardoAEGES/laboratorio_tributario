/* survey.js - Encuesta de Satisfacción interactiva del Laboratorio Tributario */

(function () {
    // Configuración por defecto
    const DEFAULT_MODULE = 'SIRE';
    
    // Inyectar dinámicamente FontAwesome si no está cargado
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }

    // Inicializar o recuperar el cliente de Supabase
    function getSupabaseClient() {
        if (typeof window.authSupabaseClient !== 'undefined' && window.authSupabaseClient) {
            return window.authSupabaseClient;
        }
        if (typeof window.supabase !== 'undefined') {
            try {
                return window.supabase.createClient(
                    'https://klmjmlhwuzhymrplemgw.supabase.co', 
                    'sb_publishable_DSS-WHn-WawxfYe0RWUHRg_odMjrb_b'
                );
            } catch (e) {
                console.error("Error al crear cliente fallback de Supabase:", e);
            }
        }
        return null;
    }

    // Detectar dinámicamente el módulo según el nombre del archivo HTML
    function detectarModuloActual() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('rvie') || path.includes('rce') || path.includes('reemplazo')) {
            return 'SIRE';
        }
        if (path.includes('tramites') || path.includes('comprobantes')) {
            return 'Comprobantes de pago';
        }
        if (path.includes('ajustes')) {
            return 'SIRE';
        }
        if (path.includes('declaraciones')) {
            return 'FV 621';
        }
        if (path.includes('renta')) {
            return 'FV 710';
        }
        return DEFAULT_MODULE;
    }

    // Estructura HTML del modal a inyectar en document.body
    const modalHTML = `
    <div id="survey-modal" class="survey-modal-overlay" style="display: none;">
        <div class="survey-modal-box">
            <!-- Vista 1: Invitación Inicial -->
            <div id="survey-view-welcome" class="survey-modal-body">
                <div class="survey-welcome-box">
                    <div class="survey-welcome-icon-wrap">
                        <div class="survey-welcome-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                    </div>
                    <h2>Laboratorio Tributario</h2>
                    <p>¿Deseas ayudarnos a mejorar el Laboratorio Tributario respondiendo una breve encuesta?</p>
                    <div class="survey-btn-container">
                        <button id="survey-btn-accept" class="survey-btn-success">✅ Responder encuesta</button>
                        <button id="survey-btn-later" class="survey-btn-secondary">⏰ Recordármelo más tarde</button>
                        <button id="survey-btn-never" class="survey-btn-link-danger">❌ Ya respondí esta encuesta para este módulo (no volver a mostrarla)</button>
                    </div>
                </div>
            </div>

            <!-- Vista 2: Formulario de Preguntas -->
            <div id="survey-view-form" style="display: none;">
                <div class="survey-modal-header">
                    <h2>Encuesta de Satisfacción</h2>
                    <p>Tu opinión es importante para seguir mejorando la plataforma de aprendizaje.</p>
                    <button id="survey-btn-close-x" class="survey-btn-secondary" style="position: absolute; top: 20px; right: 24px; width: 32px; height: 32px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 18px; cursor: pointer;">&times;</button>
                </div>
                <form id="survey-actual-form" class="survey-modal-body">
                    <!-- Q1: Nombre y apellidos (opcional) -->
                    <div class="survey-form-group">
                        <label class="survey-label" for="survey-name">Nombre y apellidos <span>(opcional)</span></label>
                        <input type="text" id="survey-name" class="survey-input" placeholder="Ingresa tu nombre y apellidos...">
                    </div>

                    <!-- Q2: Módulo utilizado -->
                    <div class="survey-form-group">
                        <label class="survey-label" for="survey-module">¿Qué módulo utilizaste?</label>
                        <select id="survey-module" class="survey-select" required>
                            <option value="SIRE">SIRE</option>
                            <option value="FV 621">FV 621</option>
                            <option value="FV 710">FV 710</option>
                            <option value="Comprobantes de pago">Comprobantes de pago</option>
                            <option value="Excel (mañana)">Excel (mañana)</option>
                            <option value="Excel (noche)">Excel (noche)</option>
                            <option value="Asientos contables">Asientos contables</option>
                            <option value="Estados financieros">Estados financieros</option>
                        </select>
                    </div>

                    <!-- Q3: ¿Qué tan fácil fue utilizar este módulo? -->
                    <div class="survey-form-group">
                        <label class="survey-label">¿Qué tan fácil fue utilizar este módulo?</label>
                        <div class="survey-stars-container">
                            <span class="survey-star" data-value="1"><i class="far fa-star"></i></span>
                            <span class="survey-star" data-value="2"><i class="far fa-star"></i></span>
                            <span class="survey-star" data-value="3"><i class="far fa-star"></i></span>
                            <span class="survey-star" data-value="4"><i class="far fa-star"></i></span>
                            <span class="survey-star" data-value="5"><i class="far fa-star"></i></span>
                            <span id="survey-star-text" class="survey-star-label">Selecciona una calificación</span>
                        </div>
                    </div>

                    <!-- Q4: ¿El simulador te ayudó a comprender el procedimiento? -->
                    <div class="survey-form-group">
                        <label class="survey-label">¿El simulador te ayudó a comprender mejor el procedimiento tributario?</label>
                        <div class="survey-radios-container">
                            <label class="survey-radio-label">
                                <input type="radio" name="survey-understanding" value="Sí, mucho" required>
                                Sí, mucho
                            </label>
                            <label class="survey-radio-label">
                                <input type="radio" name="survey-understanding" value="Sí, parcialmente">
                                Sí, parcialmente
                            </label>
                            <label class="survey-radio-label">
                                <input type="radio" name="survey-understanding" value="Muy poco">
                                Muy poco
                            </label>
                            <label class="survey-radio-label">
                                <input type="radio" name="survey-understanding" value="No">
                                No
                            </label>
                        </div>
                    </div>

                    <!-- Q5: Escala de recomendación (0-10) -->
                    <div class="survey-form-group">
                        <label class="survey-label">¿Recomendarías este módulo a otro estudiante?</label>
                        <div class="survey-scale-container">
                            <span class="survey-scale-btn" data-value="0">0</span>
                            <span class="survey-scale-btn" data-value="1">1</span>
                            <span class="survey-scale-btn" data-value="2">2</span>
                            <span class="survey-scale-btn" data-value="3">3</span>
                            <span class="survey-scale-btn" data-value="4">4</span>
                            <span class="survey-scale-btn" data-value="5">5</span>
                            <span class="survey-scale-btn" data-value="6">6</span>
                            <span class="survey-scale-btn" data-value="7">7</span>
                            <span class="survey-scale-btn" data-value="8">8</span>
                            <span class="survey-scale-btn" data-value="9">9</span>
                            <span class="survey-scale-btn" data-value="10">10</span>
                        </div>
                        <div class="survey-scale-labels">
                            <span>0 (No lo recomendaría)</span>
                            <span>10 (Totalmente recomendado)</span>
                        </div>
                    </div>

                    <!-- Q6: Comentarios o Sugerencias -->
                    <div class="survey-form-group">
                        <label class="survey-label" for="survey-comments">Sugerencias o comentarios para mejorar el módulo <span>(opcional)</span></label>
                        <textarea id="survey-comments" class="survey-textarea" placeholder="Escribe tus comentarios aquí..."></textarea>
                    </div>

                    <div class="survey-btn-container" style="margin-top: 15px;">
                        <button type="submit" id="survey-btn-submit" class="survey-btn-primary">
                            Enviar respuestas
                        </button>
                    </div>
                </form>
            </div>

            <!-- Vista 3: Mensaje de Agradecimiento -->
            <div id="survey-view-thanks" class="survey-modal-body" style="display: none;">
                <div class="survey-thanks-box">
                    <div class="survey-thanks-icon-wrap">
                        <div class="survey-thanks-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                    </div>
                    <h3>¡Gracias por tu tiempo!</h3>
                    <p>Tus comentarios nos ayudan a mejorar continuamente el Laboratorio Tributario y brindar una mejor experiencia de aprendizaje.</p>
                    <div class="survey-btn-container" style="max-width: 140px; margin: 0 auto;">
                        <button id="survey-btn-close-thanks" class="survey-btn-success">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Inyectar el HTML al cuerpo del documento al cargar el script
    if (document.body) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        });
    }

    // Variables de estado del formulario
    let selectedRating = 0;
    let selectedRecommendation = null;
    let onFinishedCallback = null;
    let moduloActual = DEFAULT_MODULE;

    // Inicializar interacciones del DOM cuando el documento esté listo
    function initSurveyFormEvents() {
        const modal = document.getElementById('survey-modal');
        if (!modal) return;

        // Vistas
        const welcomeView = document.getElementById('survey-view-welcome');
        const formView = document.getElementById('survey-view-form');
        const thanksView = document.getElementById('survey-view-thanks');

        // Botones de la invitación inicial (Vista 1)
        const btnAccept = document.getElementById('survey-btn-accept');
        const btnLater = document.getElementById('survey-btn-later');
        const btnNever = document.getElementById('survey-btn-never');
        const btnCloseX = document.getElementById('survey-btn-close-x');

        // Formulario (Vista 2)
        const actualForm = document.getElementById('survey-actual-form');
        const btnSubmit = document.getElementById('survey-btn-submit');
        const selectModule = document.getElementById('survey-module');
        
        // Estrellas
        const stars = document.querySelectorAll('.survey-star');
        const starText = document.getElementById('survey-star-text');
        
        // Botones 0-10
        const scaleBtns = document.querySelectorAll('.survey-scale-btn');

        // Radios Q4
        const radioLabels = document.querySelectorAll('.survey-radio-label');

        // Botón final (Vista 3)
        const btnCloseThanks = document.getElementById('survey-btn-close-thanks');

        // --- Manejadores de la Vista 1 (Invitación) ---
        btnAccept.addEventListener('click', function () {
            welcomeView.style.display = 'none';
            formView.style.display = 'block';
            
            // Preseleccionar el módulo actual detectado
            if (selectModule) {
                selectModule.value = moduloActual;
            }
        });

        btnLater.addEventListener('click', function () {
            cerrarModal();
        });

        btnNever.addEventListener('click', function () {
            // Guardar preferencia para no volver a preguntar en este módulo.
            // Se usa sessionStorage: el bloqueo dura solo la sesión actual, así
            // el siguiente estudiante del mismo equipo sí verá la encuesta.
            sessionStorage.setItem('survey_' + moduloActual + '_dont_show', 'true');
            cerrarModal();
        });

        if (btnCloseX) {
            btnCloseX.addEventListener('click', function () {
                cerrarModal();
            });
        }

        // --- Calificación con Estrellas (⭐) ---
        const starLabels = {
            1: "⭐ 1 Muy difícil",
            2: "⭐⭐ 2",
            3: "⭐⭐⭐ 3",
            4: "⭐⭐⭐⭐ 4",
            5: "⭐⭐⭐⭐⭐ 5 Muy fácil"
        };

        function updateStars(limit) {
            stars.forEach((star, idx) => {
                const icon = star.querySelector('i');
                if (idx < limit) {
                    star.classList.add('active');
                    icon.className = 'fas fa-star';
                } else {
                    star.classList.remove('active');
                    icon.className = 'far fa-star';
                }
            });
        }

        stars.forEach(star => {
            star.addEventListener('mouseover', function () {
                const val = parseInt(this.getAttribute('data-value'));
                updateStars(val);
                if (starText) {
                    starText.textContent = starLabels[val] || "Selecciona";
                }
            });

            star.addEventListener('mouseout', function () {
                updateStars(selectedRating);
                if (starText) {
                    starText.textContent = selectedRating > 0 ? starLabels[selectedRating] : "Selecciona una calificación";
                }
            });

            star.addEventListener('click', function () {
                selectedRating = parseInt(this.getAttribute('data-value'));
                updateStars(selectedRating);
            });
        });

        // --- Escala de Recomendación (0-10) ---
        scaleBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                scaleBtns.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                selectedRecommendation = parseInt(this.getAttribute('data-value'));
            });
        });

        // --- Radio Buttons de Ayuda ---
        radioLabels.forEach(label => {
            const input = label.querySelector('input[type="radio"]');
            
            // Si el input cambia, actualizar clases visuales
            input.addEventListener('change', function () {
                const name = this.getAttribute('name');
                const brothers = document.querySelectorAll(`input[name="${name}"]`);
                brothers.forEach(b => {
                    b.closest('.survey-radio-label').classList.remove('selected');
                });
                
                if (this.checked) {
                    label.classList.add('selected');
                }
            });
        });

        // --- Envío del Formulario ---
        actualForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validaciones requeridas
            if (selectedRating === 0) {
                alert("Por favor, selecciona qué tan fácil fue utilizar el módulo (pregunta 3).");
                return;
            }

            if (selectedRecommendation === null) {
                alert("Por favor, selecciona si recomendarías este módulo en la escala de 0 al 10 (pregunta 5).");
                return;
            }

            // Cambiar botón a estado de carga
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="survey-spinner"></span> Enviando...`;

            // Capturar datos del formulario
            const surveyData = {
                nombre: document.getElementById('survey-name').value.trim() || null,
                modulo: selectModule.value,
                facilidad: selectedRating,
                ayudo_comprension: document.querySelector('input[name="survey-understanding"]:checked').value,
                recomendar: selectedRecommendation,
                comentarios: document.getElementById('survey-comments').value.trim() || null,
                created_at: new Date().toISOString()
            };

            console.log("Enviando encuesta al Laboratorio Tributario:", surveyData);

            try {
                const client = getSupabaseClient();
                if (client) {
                    const { error } = await client.from('encuestas').insert([surveyData]);
                    if (error) {
                        console.error("Error al insertar encuesta en Supabase:", error);
                        // No bloqueamos al usuario si la base de datos falla
                    } else {
                        console.log("Encuesta guardada con éxito en Supabase.");
                    }
                } else {
                    console.warn("Cliente de Supabase no disponible para registrar la encuesta.");
                }
            } catch (err) {
                console.error("Error de conexión durante el envío de la encuesta:", err);
            }

            // Guardar estado para no volver a preguntar en este módulo durante
            // la sesión actual (sessionStorage: se limpia al cerrar la pestaña)
            sessionStorage.setItem('survey_' + moduloActual + '_dont_show', 'true');

            // Cambiar a pantalla de agradecimiento
            formView.style.display = 'none';
            thanksView.style.display = 'block';

            // Auto-cerrar después de 4 segundos
            const autoCloseTimeout = setTimeout(function () {
                cerrarModal();
            }, 4000);

            // Cerrar manualmente al hacer clic en Aceptar
            btnCloseThanks.onclick = function () {
                clearTimeout(autoCloseTimeout);
                cerrarModal();
            };
        });
    }

    // Abrir el modal de encuesta y guardar el callback de finalización
    window.mostrarEncuestaLaboratorio = function (modulo, callback) {
        moduloActual = modulo || detectarModuloActual();
        onFinishedCallback = callback;

        // Si el usuario ya rechazó la encuesta en esta sesión para este módulo, ejecutar callback directo
        if (sessionStorage.getItem('survey_' + moduloActual + '_dont_show') === 'true') {
            if (typeof onFinishedCallback === 'function') {
                onFinishedCallback();
            }
            return;
        }

        // Mostrar el modal
        const modal = document.getElementById('survey-modal');
        if (modal) {
            // Reiniciar estado interno del formulario
            selectedRating = 0;
            selectedRecommendation = null;
            const welcomeView = document.getElementById('survey-view-welcome');
            const formView = document.getElementById('survey-view-form');
            const thanksView = document.getElementById('survey-view-thanks');
            const actualForm = document.getElementById('survey-actual-form');

            if (welcomeView) welcomeView.style.display = 'block';
            if (formView) formView.style.display = 'none';
            if (thanksView) thanksView.style.display = 'none';
            if (actualForm) {
                actualForm.reset();
                // Limpiar estrellas
                const stars = document.querySelectorAll('.survey-star');
                stars.forEach(s => {
                    s.classList.remove('active');
                    s.querySelector('i').className = 'far fa-star';
                });
                const starText = document.getElementById('survey-star-text');
                if (starText) starText.textContent = "Selecciona una calificación";

                // Limpiar botones de escala
                const scaleBtns = document.querySelectorAll('.survey-scale-btn');
                scaleBtns.forEach(b => b.classList.remove('selected'));

                // Limpiar radios
                const radioLabels = document.querySelectorAll('.survey-radio-label');
                radioLabels.forEach(l => l.classList.remove('selected'));

                // Habilitar botón de envío
                const btnSubmit = document.getElementById('survey-btn-submit');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Enviar respuestas";
                }
            }

            modal.style.display = 'flex';
        } else {
            console.warn("Modal de encuesta no encontrado en el DOM.");
            if (typeof onFinishedCallback === 'function') {
                onFinishedCallback();
            }
        }
    };

    // Función interna para cerrar el modal y ejecutar el callback
    function cerrarModal() {
        const modal = document.getElementById('survey-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        if (typeof onFinishedCallback === 'function') {
            onFinishedCallback();
            onFinishedCallback = null; // Evitar llamadas repetidas
        }
    }

    // Inicializar al cargar
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initSurveyFormEvents();
    } else {
        document.addEventListener('DOMContentLoaded', initSurveyFormEvents);
    }

    // =========================================================================
    // INTERCEPTACIÓN GLOBAL DE CLICS (CAPTURADOR EN FASE DE CAPTURA)
    // =========================================================================
    document.addEventListener('click', function (e) {
        // Encontrar el botón o enlace clicado
        const target = e.target.closest('button, a, input[type="button"], input[type="submit"]');
        if (!target) return;

        // Comprobar si ya pasó la encuesta (para evitar bucles infinitos)
        if (target.dataset.surveyPassed === 'true') {
            return;
        }

        // Obtener texto y normalizarlo
        const text = (target.innerText || target.textContent || target.value || '').trim().toLowerCase();
        const cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos

        // Verificar si coincide con "terminar simulación" o "finalizar simulación"
        const esBotonFin = cleanText.includes('terminar simulacion') || 
                            cleanText.includes('finalizar simulacion') ||
                            target.id === 'btn-terminar-simulacion';

        if (esBotonFin) {
            const modulo = detectarModuloActual();

            // Si el usuario ya marcó "no volver a mostrarla" en esta sesión, dejar continuar.
            // (Las marcas antiguas en localStorage se ignoran a propósito: eran
            // permanentes y bloqueaban la encuesta para siempre en el equipo.)
            if (sessionStorage.getItem('survey_' + modulo + '_dont_show') === 'true') {
                return;
            }

            // Detener por completo la acción original de inmediato
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Mostrar la encuesta
            window.mostrarEncuestaLaboratorio(modulo, function () {
                // Al finalizar la encuesta (o cerrarla/omitirla), re-disparar el click original
                target.dataset.surveyPassed = 'true';
                
                // Si es un enlace o tiene comportamiento específico, pulsar programáticamente
                target.click();

                // Limpiar el estado temporal después de un instante
                setTimeout(() => {
                    delete target.dataset.surveyPassed;
                }, 500);
            });
        }
    }, true); // <- FASE DE CAPTURA (crucial para ejecutarse antes de otros oyentes)

})();

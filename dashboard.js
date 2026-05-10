document.addEventListener('DOMContentLoaded', () => {
    // Current date and time update
    const updateDateTime = () => {
        const now = new Date();
        const dStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const tStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
        const navDate = document.querySelector('.nav-date');
        if (navDate) navDate.textContent = `${dStr} ${tStr}`;
    };
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // --- Persistence (Local Storage) ---
    const saveData = () => {
        const data = {};
        document.querySelectorAll('input[type="text"], input[type="radio"], select').forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) data[input.id || input.name] = input.id;
            } else {
                data[input.id] = input.value;
            }
        });
        localStorage.setItem('sunat_simulator_data', JSON.stringify(data));
    };

    const loadData = () => {
        const raw = localStorage.getItem('sunat_simulator_data');
        if (!raw) return;
        const data = JSON.parse(raw);
        for (const [id, value] of Object.entries(data)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'radio') {
                    el.checked = true;
                } else {
                    el.value = value;
                }
            }
        }
        calculateTotals();
        updateNestedVisibility();
    };

    // Tab Switching Logic
    const tabs = document.querySelectorAll('.form-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnNexts = document.querySelectorAll('.btn-next');
    const btnPrevTabs = document.querySelectorAll('.btn-prev-tab');

    const switchTab = (tabId) => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        const targetTab = document.querySelector(`.form-tab[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(`tab-content-${tabId}`);
        if (targetTab && targetContent) {
            targetTab.classList.add('active');
            targetContent.classList.add('active');
        }
    };

    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    btnNexts.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.next)));
    btnPrevTabs.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.prev)));

    // --- Dynamic Nested IGV ---
    const igvCuentaPropia = document.getElementById('igv-cuenta-propia');
    const nestedIgvOptions = document.getElementById('nested-igv-options');
    const allRégimenRadios = document.querySelectorAll('input[name="igv"]');

    const updateNestedVisibility = () => {
        if (nestedIgvOptions) {
            nestedIgvOptions.style.display = (igvCuentaPropia && igvCuentaPropia.checked) ? 'flex' : 'none';
        }
    };

    allRégimenRadios.forEach(radio => radio.addEventListener('change', () => {
        updateNestedVisibility();
        saveData();
    }));

    // --- Period Picker Logic ---
    const periodoInput = document.getElementById('periodo-input');
    const periodPicker = document.getElementById('period-picker');
    const monthItems = document.querySelectorAll('.month-item');
    const pickerYear = document.getElementById('picker-year');
    const prevYear = document.querySelector('.picker-header .fa-chevron-left');
    const nextYear = document.querySelector('.picker-header .fa-chevron-right');
    const declaraSelect = document.getElementById('declara-select');

    let currentYear = 2025;

    if (periodoInput) {
        periodoInput.addEventListener('click', (e) => {
            e.stopPropagation();
            periodPicker.style.display = 'block';
        });
    }

    document.addEventListener('click', (e) => {
        if (periodPicker && !periodPicker.contains(e.target) && e.target !== periodoInput) {
            periodPicker.style.display = 'none';
        }
    });

    monthItems.forEach(item => {
        item.addEventListener('click', () => {
            const month = item.dataset.month;
            periodoInput.value = `${month}/${currentYear}`;
            if (declaraSelect) declaraSelect.value = 'original';
            monthItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');
            periodPicker.style.display = 'none';
            saveData();
        });
    });

    if (prevYear) prevYear.addEventListener('click', (e) => { e.stopPropagation(); currentYear--; if(pickerYear) pickerYear.textContent = currentYear; });
    if (nextYear) nextYear.addEventListener('click', (e) => { e.stopPropagation(); currentYear++; if(pickerYear) pickerYear.textContent = currentYear; });

    // --- Calculation Logic ---
    const baseVentas = document.getElementById('base-ventas-d');
    const igvVentas = document.getElementById('igv-ventas-d');
    const baseDescuentos = document.getElementById('base-descuentos');
    const igvDescuentos = document.getElementById('igv-descuentos');
    const totalVentasCalc = document.getElementById('total-ventas-calc');
    const baseExportFact = document.getElementById('base-export-fact');
    const baseExportEmb = document.getElementById('base-export-emb');
    const baseOtrasVentas = document.getElementById('base-otras-ventas');

    const restrictedInputs = [baseVentas, baseDescuentos, baseExportFact, baseExportEmb, baseOtrasVentas];

    const calculateTotals = () => {
        // Clean values to positive integers
        restrictedInputs.forEach(input => {
            if (input && input === document.activeElement) {
                let val = input.value.replace(/[^0-9]/g, '');
                input.value = val;
            } else if (input && !input.value) {
                input.value = "0";
            }
        });

        const val100 = parseInt(baseVentas?.value) || 0;
        const val102 = parseInt(baseDescuentos?.value) || 0;

        const calc101 = Math.round(val100 * 0.18);
        const calc103 = Math.round(val102 * 0.18);

        if (igvVentas) igvVentas.value = calc101;
        if (igvDescuentos) igvDescuentos.value = calc103;

        const finalTotal = calc101 - calc103;
        if (totalVentasCalc) totalVentasCalc.value = finalTotal;

        const headerTotal = document.querySelector('.stepper strong');
        if (headerTotal) headerTotal.textContent = `S/. ${finalTotal}`;
        
        saveData();
    };

    restrictedInputs.forEach(input => {
        if (input) input.addEventListener('input', calculateTotals);
    });

    // Initial setup
    loadData();
    if (!periodoInput.value) periodoInput.value = "04/2025";
    updateNestedVisibility();

    // Double click to deselect
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('dblclick', () => { 
            radio.checked = false; 
            if (radio.name === 'igv') updateNestedVisibility(); 
            saveData();
        });
    });

    const btnSalir = document.querySelector('.btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            if (confirm('¿Desea salir?')) {
                localStorage.removeItem('sunat_simulator_data');
                window.location.href = 'index.html';
            }
        });
    }
});

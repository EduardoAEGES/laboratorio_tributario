document.addEventListener('DOMContentLoaded', () => {
    const tabRuc = document.getElementById('tab-ruc');
    const tabDni = document.getElementById('tab-dni');
    const rucField = document.getElementById('ruc-field');
    const userField = document.getElementById('user-field');
    const passField = document.getElementById('pass-field');
    const btnSubmit = document.querySelector('.btn-entrar-simple');

    // Tab Logic
    tabRuc.addEventListener('click', () => {
        tabRuc.classList.add('active');
        tabDni.classList.remove('active');
        rucField.placeholder = "RUC";
        userField.style.display = "block";
    });

    tabDni.addEventListener('click', () => {
        tabDni.classList.add('active');
        tabRuc.classList.remove('active');
        rucField.placeholder = "DNI";
        userField.style.display = "none";
    });

    // Login Logic
    btnSubmit.addEventListener('click', () => {
        const ruc = rucField.value.trim();
        const user = userField.value.trim();
        const pass = passField.value.trim();

        // Validation based on user request
        if (tabRuc.classList.contains('active')) {
            if (ruc === '20123456789' && user === 'SIST' && pass === 'NORTON') {
                window.location.href = 'dashboard.html';
            } else {
                alert('Credenciales incorrectas. Verifique los datos.');
            }
        } else {
            // DNI login (optional but good to have a generic check if they try DNI)
            if (ruc !== '' && pass !== '') {
                window.location.href = 'dashboard.html';
            } else {
                alert('Por favor complete los campos.');
            }
        }
    });
});

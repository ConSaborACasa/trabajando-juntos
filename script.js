// script.js

// Función para verificar si el usuario está logueado
function checkLogin() {
    // Simulamos verificar si el usuario está logueado (puedes ampliar esta lógica)
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    if (!isLoggedIn) {
        // Redirigir a login.html si no está logueado
        window.location.replace('login.html');
    }
}

// Ejecutar checkLogin cuando la página se carga
checkLogin();

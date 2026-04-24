let rutina = [];
let indiceActual = 0;
let tiempoRestante;
let timerInterval = null;
let estaCorriendo = false;
let player;

const PIN_ACCESO = "1234"; // Define tu PIN aquí

// 1. LÓGICA DE LOGIN
document.getElementById('btn-login').addEventListener('click', () => {
    const input = document.getElementById('pin-input').value;
    if (input === PIN_ACCESO) {
        document.getElementById('pin-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
        cargarLibreria();
    } else {
        document.getElementById('pin-error').innerText = "PIN INCORRECTO";
        document.getElementById('pin-input').value = "";
    }
});

// 2. CARGAR RUTINAS DESDE FIREBASE
async function cargarLibreria() {
    const container = document.getElementById('rutinas-container');
    container.innerHTML = "<p style='text-align:center; color:#777'>Conectando al box...</p>";

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "libreria"));
        container.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'rutina-card';
            card.innerHTML = `
                <h3>${data.titulo}</h3>
                <p>${data.ejercicios.length} EJERCICIOS • MOVILIDAD</p>
            `;
            card.onclick = () => iniciarRutina(data.ejercicios);
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = "<p style='color:red; text-align:center'>Error de conexión.</p>";
        console.error(e);
    }
}

// 3. INICIALIZACIÓN Y AUTO-PLAY
function iniciarRutina(ejercicios) {
    rutina = ejercicios;
    indiceActual = 0;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    if (!player) {
        player = new YT.Player('player', {
            videoId: rutina[indiceActual].ytId,
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'modestbranding': 1, 
                'loop': 1, 
                'playlist': rutina[indiceActual].ytId,
                'rel': 0,
                'mute': 1 // Mute necesario para autoplay en móviles
            },
            events: { 'onReady': () => cargarEjercicio(0) }
        });
    } else {
        cargarEjercicio(0);
    }
}

function cargarEjercicio(indice) {
    const ej = rutina[indice];
    document.getElementById('nombre-ejercicio').innerText = ej.nombre;
    document.getElementById('instrucciones').innerText = ej.instrucciones;
    
    if (player && player.loadVideoById) {
        player.loadVideoById({
            videoId: ej.ytId,
            startSeconds: 0,
            suggestedQuality: 'small'
        });
        player.setLoop(true);
    }
    
    tiempoRestante = ej.tiempo;
    actualizarDisplay();
    actualizarProgreso();
}

// 4. TIMER Y NAVEGACIÓN
function toggleTimer() {
    const btn = document.getElementById('btn-play-pause');
    if (estaCorriendo) {
        clearInterval(timerInterval);
        btn.innerText = "CONTINUAR";
    } else {
        timerInterval = setInterval(() => {
            tiempoRestante--;
            actualizarDisplay();
            if (tiempoRestante <= 0) {
                clearInterval(timerInterval);
                siguienteEjercicio();
            }
        }, 1000);
        btn.innerText = "PAUSAR";
    }
    estaCorriendo = !estaCorriendo;
}

function siguienteEjercicio() {
    if (indiceActual < rutina.length - 1) {
        indiceActual++;
        resetAppstate();
    } else {
        alert("¡Sesión completada!");
        salirAlMenu();
    }
}

function anteriorEjercicio() {
    if (indiceActual > 0) {
        indiceActual--;
        resetAppstate();
    }
}

function resetAppstate() {
    clearInterval(timerInterval);
    estaCorriendo = false;
    document.getElementById('btn-play-pause').innerText = "COMENZAR";
    cargarEjercicio(indiceActual);
}

function salirAlMenu() {
    clearInterval(timerInterval);
    estaCorriendo = false;
    if (player) player.stopVideo();
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('selection-screen').classList.remove('hidden');
}

function actualizarDisplay() {
    const min = Math.floor(tiempoRestante / 60);
    const seg = tiempoRestante % 60;
    document.getElementById('countdown').innerText = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

function actualizarProgreso() {
    const porcentaje = (indiceActual / rutina.length) * 100;
    document.getElementById('progress-fill').style.width = `${porcentaje}%`;
}

// LISTENERS
document.getElementById('btn-play-pause').addEventListener('click', toggleTimer);
document.getElementById('btn-next').addEventListener('click', siguienteEjercicio);
document.getElementById('btn-prev').addEventListener('click', anteriorEjercicio);
document.getElementById('btn-back-to-menu').addEventListener('click', salirAlMenu);
document.getElementById('btn-reset').addEventListener('click', resetAppstate);
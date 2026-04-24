let rutina = [];
let indiceActual = 0;
let tiempoRestante;
let timerInterval = null;
let estaCorriendo = false;
let player;

const PIN_ACCESO = "1234";

// Sistema de Audio mejorado para compatibilidad móvil
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBeep(isFinal = false) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// 1. LOGIN
document.getElementById('btn-login').addEventListener('click', () => {
    const input = document.getElementById('pin-input').value;
    if (input === PIN_ACCESO) {
        initAudio(); // Activa el audio al primer toque
        document.getElementById('pin-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
        cargarLibreria();
    } else {
        document.getElementById('pin-error').innerText = "PIN INCORRECTO";
    }
});

// 2. FIREBASE
async function cargarLibreria() {
    const container = document.getElementById('rutinas-container');
    container.innerHTML = "<p style='text-align:center; color:#777'>Cargando...</p>";
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "libreria"));
        container.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'rutina-card';
            card.innerHTML = `<h3>${data.titulo}</h3><p>${data.ejercicios.length} EJERCICIOS</p>`;
            card.onclick = () => iniciarRutina(data.ejercicios);
            container.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

// 3. PLAYER CON LOOP FORZADO
function iniciarRutina(ejercicios) {
    rutina = ejercicios;
    indiceActual = 0;
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    if (!player) {
        player = new YT.Player('player', {
            videoId: rutina[indiceActual].ytId,
            playerVars: { 
                'autoplay': 1, 'controls': 0, 'modestbranding': 1, 
                'rel': 0, 'showinfo': 0, 'iv_load_policy': 3, 'mute': 1
            },
            events: { 
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange 
            }
        });
    } else {
        cargarEjercicio(0);
    }
}

function onPlayerReady(event) {
    cargarEjercicio(0);
}

// ESTO SOLUCIONA EL LOOP: Cuando termina el video, vuelve al inicio
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

function cargarEjercicio(indice) {
    const ej = rutina[indice];
    document.getElementById('nombre-ejercicio').innerText = ej.nombre;
    document.getElementById('instrucciones').innerText = ej.instrucciones;
    
    if (player && player.loadVideoById) {
        player.loadVideoById({
            videoId: ej.ytId,
            suggestedQuality: 'small'
        });
        player.mute();
        player.playVideo();
    }
    
    tiempoRestante = ej.tiempo;
    document.getElementById('countdown').classList.remove('timer-warning');
    actualizarDisplay();
    actualizarProgreso();
}

// 4. TIMER
function toggleTimer() {
    initAudio(); // Re-asegura el contexto de audio
    const btn = document.getElementById('btn-play-pause');
    if (estaCorriendo) {
        clearInterval(timerInterval);
        btn.innerText = "CONTINUAR";
    } else {
        timerInterval = setInterval(() => {
            tiempoRestante--;
            
            const timerEl = document.getElementById('countdown');
            if (tiempoRestante <= 10) timerEl.classList.add('timer-warning');
            if (tiempoRestante <= 5 && tiempoRestante > 0) playBeep(false);
            if (tiempoRestante === 0) playBeep(true);

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
        setTimeout(toggleTimer, 1000); 
    } else {
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
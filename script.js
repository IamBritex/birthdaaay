document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Obtener elementos del DOM ---
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    const player1 = document.getElementById('audioPlayer1');
    const player2 = document.getElementById('audioPlayer2');
    
    const canvas = document.getElementById('canvas');
    const canvasCtx = canvas.getContext('2d');
    
    const body = document.body;
    
    const eventImage = document.getElementById('eventImage');
    const eventImageJumm = document.getElementById('eventImageJumm');
    const eventImageAwiwiiii = document.getElementById('eventImageAwiwiiii');
    const eventImageOhhh = document.getElementById('eventImageOhhh'); 
    const eventImageNam = document.getElementById('eventImageNam'); 

    // --- NUEVO: Lógica de Fecha ---

    // Función que comprueba si es 14 de Nov de 2025
    function isKariBirthday() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // getMonth() es 0-indexado (0 = Ene, 10 = Nov)
        const day = now.getDate();
        return year === 2025 && month === 11 && day === 14;
    }

    // Decide qué pista de voz 1 usar
    const isBirthday = isKariBirthday();
    const voice1Track = isBirthday ? 'audios/voice/Voice1.mp3' : 'audios/voice/Voice1-alt.mp3';
    
    // --- FIN LÓGICA DE FECHA ---


    // --- Tu lista de reproducción actualizada ---
    const audioPlaylist = [
        voice1Track, // 0 (Decidido por la lógica de arriba)
        'audios/songs/song1.mp3',  // 1
        'audios/voice/Voice2.mp3', // 2
        'audios/songs/song2.mp3',  // 3
        'audios/voice/Voice3.mp3', // 4
        'audios/songs/song3.mp3',  // 5
        'audios/voice/Voice4.mp3', // 6 (El del evento)
        'audios/songs/song4.mp3'   // 7 (Última canción)
    ]; 

    let currentTrackIndex = 0;

    // --- Estado del Crossfade ---
    const crossfadeTime = 5; 
    let isFading = false;
    let activePlayer = player1; 
    let inactivePlayer = player2; 

    // --- Estado del Fade de Pausa ---
    const pauseFadeTime = 0.4; 
    let isPauseFading = false; 

    // --- Nodos de Web Audio API ---
    let audioCtx; 
    let gainNode1; 
    let gainNode2; 
    let analyser; 
    let dataArray; 
    let bufferLength;
    
    let isPlaying = false;
    let firstPlay = true; 
    
    let imageEventTriggered = false;
    let jummTriggered = false;
    let awiwiiiiTriggered = false;
    let ohhhTriggered = false; 
    let namTriggered = false; 

    // --- Lógica de Corazones (BPM) ---
    const beatInterval = (60 / 137) * 4 * 1000; 
    let heartBeatTimer = null; 

    // --- Eventos visuales ---
    const songEvents = [
        // Evento 0
        () => { body.style.backgroundColor = '#ffffff'; },
        // Evento 1
        () => { body.style.backgroundColor = '#111827'; },
        // Evento 2
        () => { body.style.backgroundColor = '#fdf2f8'; },
        // Evento 3
        () => { body.style.backgroundColor = '#1f2937'; },
        // Evento 4
        () => { body.style.backgroundColor = '#fef3c7'; },
        // Evento 5
        () => { body.style.backgroundColor = '#166534'; },
         // Evento 6
        () => { body.style.backgroundColor = '#ecfdf5'; },
         // Evento 7
        () => { body.style.backgroundColor = '#000000'; }
    ];

    function triggerSongEvent(index) {
        const eventIndex = index % songEvents.length;
        songEvents[eventIndex]();
    }
    // --- FIN MODIFICACIÓN ---


    // --- Cargar audios iniciales ---
    activePlayer.src = audioPlaylist[currentTrackIndex];
    inactivePlayer.src = audioPlaylist[(currentTrackIndex + 1) % audioPlaylist.length];

    // --- 2. Inicializar la Web Audio API ---
    function initAudioAPI() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode1 = audioCtx.createGain();
        gainNode2 = audioCtx.createGain();
        const source1 = audioCtx.createMediaElementSource(player1);
        const source2 = audioCtx.createMediaElementSource(player2);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; 
        source1.connect(gainNode1);
        source2.connect(gainNode2);
        gainNode1.connect(analyser);
        gainNode2.connect(analyser);
        analyser.connect(audioCtx.destination);
        gainNode1.gain.value = 1; 
        gainNode2.gain.value = 0; 
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }
    
    // --- Funciones de Corazones ---
    
    function createHeart() {
        const heart = document.createElement('img');
        heart.src = 'heart.png';
        heart.classList.add('heart-particle');
        
        heart.style.setProperty('--start-x', Math.random() * 90 + 5 + 'vw'); 
        heart.style.setProperty('--duration', (Math.random() * 2 + 3) + 's'); 
        heart.style.setProperty('--start-rot', (Math.random() - 0.5) * 40 + 'deg'); 
        heart.style.setProperty('--end-rot', (Math.random() - 0.5) * 720 + 'deg'); 
        heart.style.setProperty('--rand-y', Math.random()); 
        
        document.body.appendChild(heart);
        
        heart.addEventListener('animationend', () => {
            heart.remove();
        });
    }

    function scheduleNextHeartbeat() {
        if (heartBeatTimer) return;

        function heartLoop() {
            createHeart();
            heartBeatTimer = setTimeout(heartLoop, beatInterval);
        }
        heartLoop(); 
    }

    function stopHeartbeat() {
        if (heartBeatTimer) {
            clearTimeout(heartBeatTimer);
            heartBeatTimer = null;
        }
        document.querySelectorAll('.heart-particle').forEach(heart => heart.remove());
    }
    // --- FIN Funciones de Corazones ---


    // --- 3. Bucle de Animación (Visualizador) ---
    function draw() {
        requestAnimationFrame(draw); 
        if (!analyser) return; 
        analyser.getByteFrequencyData(dataArray); 
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength);
        const centerY = canvas.height / 2;
        const centerX = canvas.width / 2;

        for (let i = 0; i < bufferLength; i++) {
            const barAmplitude = dataArray[i] / 1.5;
            const bgColor = body.style.backgroundColor;
            canvasCtx.fillStyle = (bgColor === 'rgb(0, 0, 0)' || bgColor === 'rgb(17, 24, 39)' || bgColor === 'rgb(31, 41, 55)' || bgColor === 'rgb(22, 101, 52)') ? '#ffffff' : '#000000';
            
            let x;
            if (i % 2 === 0) {
                 x = centerX + (i / 2) * barWidth;
            } else {
                 x = centerX - ((i + 1) / 2) * barWidth;
            }
            
            const barY = centerY - (barAmplitude / 2);
            canvasCtx.fillRect(x, barY, barWidth * 0.9, barAmplitude);
        }
    }

    // --- 4. Control de Play/Pause ---
    playPauseBtn.addEventListener('click', () => {
        if (isPauseFading) return; 
    
        if (!audioCtx) {
            initAudioAPI();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;

        if (isPlaying) {
            // --- LÓGICA DE PAUSA ---
            isPlaying = false;
            isPauseFading = true;
            isFading = false; 
            playPauseBtn.classList.add('paused-fullscreen');
            gainNode1.gain.cancelScheduledValues(now);
            gainNode2.gain.cancelScheduledValues(now);
            gainNode1.gain.linearRampToValueAtTime(0, now + pauseFadeTime);
            gainNode2.gain.linearRampToValueAtTime(0, now + pauseFadeTime);
            
            stopHeartbeat();
            
            setTimeout(() => {
                player1.pause();
                player2.pause();
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                isPauseFading = false;
            }, pauseFadeTime * 1000);

        } else {
            // --- LÓGICA DE PLAY ---
            isPlaying = true;
            isPauseFading = true;
            playPauseBtn.classList.remove('paused-fullscreen');
            
            if (firstPlay) {
                triggerSongEvent(currentTrackIndex);
                firstPlay = false;
            }
            
            activePlayer.play();
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            
            const activeGain = (activePlayer === player1) ? gainNode1 : gainNode2;
            activeGain.gain.cancelScheduledValues(now);
            activeGain.gain.linearRampToValueAtTime(1, now + pauseFadeTime);
            
            setTimeout(() => {
                isPauseFading = false;
            }, pauseFadeTime * 1000);
        }
    });

    
    // --- 5. Lógica de Crossfade (MODIFICADA) ---
    const handleTimeUpdate = (e) => {
        const player = e.target;
        if (!isPlaying || player !== activePlayer) return;
        const time = player.currentTime;

        // --- LÓGICA DE EVENTOS CRONOMETRADOS (Pista 6) ---
        if (currentTrackIndex === 6) {
            
            if (!imageEventTriggered && time >= 20) {
                imageEventTriggered = true;
                document.body.classList.add('image-active');
            }

            if (time >= 3.0 && time < 5.8 && !jummTriggered) {
                eventImageJumm.classList.add('active');
                jummTriggered = true;
            } else if ((time < 3.0 || time >= 5.8) && jummTriggered) {
                eventImageJumm.classList.remove('active');
                jummTriggered = false;
            }

            if (time >= 6.0 && time < 8.9 && !awiwiiiiTriggered) {
                eventImageAwiwiiii.classList.add('active');
                awiwiiiiTriggered = true;
            } else if ((time < 6.0 || time >= 8.9) && awiwiiiiTriggered) {
                eventImageAwiwiiii.classList.remove('active');
                awiwiiiiTriggered = false;
            }

            if (time >= 25.4 && time < 31 && !ohhhTriggered) {
                eventImageOhhh.classList.add('active');
                ohhhTriggered = true;
            } else if ((time < 25.4 || time >= 31) && ohhhTriggered) {
                eventImageOhhh.classList.remove('active');
                ohhhTriggered = false;
            }

            if (time >= 31.4 && time < 33.0 && !namTriggered) {
                eventImageNam.classList.add('active');
                namTriggered = true;
            } else if ((time < 31.4 || time >= 33.0) && namTriggered) {
                eventImageNam.classList.remove('active');
                namTriggered = false;
            }
        }
        
        // --- LÓGICA DE CORAZONES (Pista 7) ---
        if (currentTrackIndex === 7 && isPlaying) {
            scheduleNextHeartbeat();
        } else if (currentTrackIndex !== 7 && heartBeatTimer) {
            stopHeartbeat();
        }
        // --- FIN LÓGICA CORAZONES ---
        
        
        // Loop de la última canción
        if (currentTrackIndex === audioPlaylist.length - 1) {
            return;
        }

        if (isFading || !player.duration || player.paused) {
            return;
        }

        // Lógica de Fade-in de la siguiente
        if (player.duration - player.currentTime <= crossfadeTime) {
            isFading = true;
            inactivePlayer.play();
            const inactiveGain = (player === player1) ? gainNode2 : gainNode1;
            const now = audioCtx.currentTime;
            
            inactiveGain.gain.cancelScheduledValues(now);
            inactiveGain.gain.setValueAtTime(0, now); 
            inactiveGain.gain.linearRampToValueAtTime(1, now + crossfadeTime);
        }
    };

    player1.ontimeupdate = handleTimeUpdate;
    player2.ontimeupdate = handleTimeUpdate;

    // --- 6. Lógica de fin de pista (CORREGIDA) ---
    const handleTrackEnd = (e) => {
        const player = e.target;
        if (player === inactivePlayer) return;

        player.pause(); 
        player.currentTime = 0; 
        
        // Resetear imágenes cronometradas
        eventImageJumm.classList.remove('active');
        eventImageAwiwiiii.classList.remove('active');
        eventImageOhhh.classList.remove('active'); 
        eventImageNam.classList.remove('active'); 
        jummTriggered = false;
        awiwiiiiTriggered = false;
        ohhhTriggered = false; 
        namTriggered = false; 
        stopHeartbeat(); // Detener corazones si la pista termina
        
        // --- Loop de la última canción (Pista 7) ---
        if (currentTrackIndex === audioPlaylist.length - 1) {
            // NO quitamos image-active (el QR)
            // NO reseteamos imageEventTriggered
            activePlayer.play(); // Simplemente reinicia la canción
            return; // No avances a la siguiente pista
        }

        // --- CORRECCIÓN: Lógica del QR ---
        // Si la Pista 6 (index 6) acaba de terminar, NO queremos quitar el QR
        if (imageEventTriggered && currentTrackIndex !== 6) {
            document.body.classList.remove('image-active');
            imageEventTriggered = false;
        }
        // --- FIN CORRECCIÓN ---

        currentTrackIndex = (currentTrackIndex + 1) % audioPlaylist.length;
        
        let tempPlayer = activePlayer;
        activePlayer = inactivePlayer;
        inactivePlayer = tempPlayer;

        const nextTrackIndex = (currentTrackIndex + 1) % audioPlaylist.length;
        inactivePlayer.src = audioPlaylist[nextTrackIndex];
        inactivePlayer.load(); 
        
        isFading = false;
        
        triggerSongEvent(currentTrackIndex);
    };
    
    player1.onended = handleTrackEnd;
    player2.onended = handleTrackEnd;

    // --- 7. Botones de Debug (Q y E) (MODIFICADO) ---
    function skipTrack(direction) {
        if (!isPlaying || isFading || isPauseFading) return;

        let newIndex = currentTrackIndex + direction;

        if (newIndex >= audioPlaylist.length) {
            newIndex = audioPlaylist.length - 1; 
        }
        if (newIndex < 0) {
            newIndex = 0; 
        }
        
        if (newIndex === currentTrackIndex) return;

        // --- Lógica del QR (code.png) al saltar ---
        if (newIndex !== 7) { 
            // Si saltamos a CUALQUIER pista que NO sea la 7, quita el QR
            if (imageEventTriggered) {
                document.body.classList.remove('image-active');
                imageEventTriggered = false;
            }
        } else { 
            // Si saltamos DIRECTO a la 7, asegúrate de que el QR esté activo
            if (!imageEventTriggered) {
                document.body.classList.add('image-active');
                imageEventTriggered = true;
            }
        }

        // --- Resetear imágenes y corazones ---
        eventImageJumm.classList.remove('active');
        eventImageAwiwiiii.classList.remove('active');
        eventImageOhhh.classList.remove('active'); 
        eventImageNam.classList.remove('active'); 
        jummTriggered = false;
        awiwiiiiTriggered = false;
        ohhhTriggered = false; 
        namTriggered = false; 
        stopHeartbeat(); // Detener corazones al saltar de pista
        // --- FIN RESET ---

        player1.pause();
        player2.pause();
        const now = audioCtx.currentTime;
        gainNode1.gain.cancelScheduledValues(now);
        gainNode2.gain.cancelScheduledValues(now);
        
        currentTrackIndex = newIndex;

        activePlayer.src = audioPlaylist[currentTrackIndex];
        
        let nextInactiveIndex;
        if (currentTrackIndex === audioPlaylist.length - 1) {
            nextInactiveIndex = currentTrackIndex; 
        } else {
            nextInactiveIndex = currentTrackIndex + 1;
        }
        inactivePlayer.src = audioPlaylist[nextInactiveIndex % audioPlaylist.length];
        
        const activeGain = (activePlayer === player1) ? gainNode1 : gainNode2;
        const inactiveGain = (activePlayer === player1) ? gainNode2 : gainNode1;
        activeGain.gain.setValueAtTime(1, now);
        inactiveGain.gain.setValueAtTime(0, now);
        
        activePlayer.play();
        triggerSongEvent(currentTrackIndex);
        isFading = false;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'e') skipTrack(1); 
        if (e.key === 'q') skipTrack(-1); 
    });
    
    // --- 8. Iniciar el bucle de dibujo ---
    draw();
});
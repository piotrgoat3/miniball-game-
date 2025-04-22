(function () {
    "use strict";

    // --- GLOBALNE ZMIENNE I STAŁE ---
    let score = { home: 0, away: 0 };
    let canvas, ctx, ball;
    let fieldPlayers = [];
    let fieldPlayersAway = [];
    let goalkeeper, goalkeeperAway;
    let gameAnimating = false;
    let isDragging = false, draggingPlayerIndex = null;
    let dragStartCanvas = { x: 0, y: 0 };
    let dragCurrentCanvas = { x: 0, y: 0 };
    let selectedHomeTeam = null, selectedAwayTeam = null;
    let selectedStadium = null;

    // Stałe fizyki i gry (dostosowane do mniejszego boiska)
    const PLAYER_RADIUS = 15;
    const GOALKEEPER_RADIUS = 17;
    const BALL_RADIUS = 7;
    const FRICTION = 0.97;
    const PLAYER_FRICTION = 0.95;
    const DRAG_IMPULSE_SCALE = 0.18;
    const MAX_PULL_LENGTH = 160;
    const COLLISION_RESTITUTION = 0.5;
    const PLAYER_COLLISION_RESTITUTION = 0.3;
    const BALL_COLLISION_BOOST = 1.1;
    const AI_REACTION_POWER = 18;
    const AI_GOALKEEPER_SPEED = 2.0;
    const AI_INTERCEPT_RADIUS_SQ = Math.pow(PLAYER_RADIUS + BALL_RADIUS + 60, 2);
    const AI_SHOT_ACCURACY_FACTOR = 0.18;
    const MATCH_DURATION = 180;
    let matchTime = MATCH_DURATION;
    let matchTimerInterval = null;

    // Elementy UI
     const startScreen = document.getElementById("startScreen");
     const teamSelectScreen = document.getElementById("teamSelectScreen");
     const stadiumSelectScreen = document.getElementById("stadiumSelectScreen");
     const gameScreen = document.getElementById("gameScreen");
     const playerDBModal = document.getElementById("playerDBModal");
     const languageModal = document.getElementById("languageModal");
     const settingsModal = document.getElementById("settingsModal");

     // --- FUNKCJE TIMERA, RESETU ---
     function updateTimerDisplay() { let minutes = Math.floor(matchTime / 60); let seconds = matchTime % 60; if (seconds < 10) seconds = "0" + seconds; const timerElement = document.getElementById("matchTimer"); if(timerElement) timerElement.innerText = "Czas: " + minutes + ":" + seconds; }
     function startTimer() { if (matchTimerInterval) stopTimer(); matchTime = MATCH_DURATION; updateTimerDisplay(); matchTimerInterval = setInterval(() => { matchTime--; updateTimerDisplay(); if (matchTime <= 0) { gameOver(); } }, 1000); }
     function stopTimer() { clearInterval(matchTimerInterval); matchTimerInterval = null; }
     function gameOver() { stopTimer(); gameAnimating = false; const homeName = selectedHomeTeam || "Gospodarze"; const awayName = selectedAwayTeam || "Goście"; alert("Koniec meczu! Wynik: " + homeName + " " + score.home + " : " + score.away + " " + awayName); closeModal(gameScreen); openModal(startScreen); resetGameFull(); }
     function resetGameFull() { if(canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0, canvas.width, canvas.height); } selectedHomeTeam = null; selectedAwayTeam = null; selectedStadium = null; score = {home: 0, away: 0}; fieldPlayers = []; fieldPlayersAway = []; goalkeeper = null; goalkeeperAway = null; ball = null; document.body.style.backgroundImage = ''; } // Reset tła
     function updateScoreboard() { const scoreboardElement = document.getElementById("scoreboard"); if(scoreboardElement) { const homeName = selectedHomeTeam || "Dom"; const awayName = selectedAwayTeam || "Gość"; scoreboardElement.innerText = `${homeName} ${score.home} : ${score.away} ${awayName}`; } }

    // --- BAZA DANYCH KLUBÓW ---
    const teamsData = { /* ... (bez zmian) ... */ };
    function getTeamColor(teamName) { /* ... (bez zmian) ... */ }

    // --- Stadium Data ---
    const stadiumsData = [
        {
            name: "Anfield",
            // === PAMIĘTAJ: Wstaw tutaj poprawną nazwę pliku z Twojego repozytorium! ===
            image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png"
        }
    ];

    // --- INICJALIZACJA GRY ---
     function initGame() { /* ... (bez zmian) ... */ canvas = document.getElementById("gameCanvas"); if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; } ctx = canvas.getContext("2d"); canvas.width = 640; canvas.height = 400; resizeCanvas(); ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" }; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; score.home = 0; score.away = 0; updateScoreboard(); console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`); }
     function resetPositionsAfterGoal(homeJustScored) { /* ... (bez zmian) ... */ }


    // --- FUNKCJE RYSOWANIA ---

     // === ZMIANA: Funkcja drawField znów jest pusta ===
     function drawField() {
         if (!ctx) return;
         // Celowo puste - nie rysujemy boiska na canvasie
     }

     function drawGameObjects() {
         if (!ctx || !ball) return;
         const drawPlayer = (player) => {
             if (!player) return;
             ctx.beginPath();
             ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
             ctx.fillStyle = player.color;
             ctx.fill();
             ctx.strokeStyle = "#333";
             ctx.lineWidth = 1.5;
             ctx.stroke();
             ctx.closePath();
         };
         fieldPlayers.forEach(drawPlayer);
         fieldPlayersAway.forEach(drawPlayer);
         drawPlayer(goalkeeper);
         drawPlayer(goalkeeperAway);
         ctx.beginPath();
         ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
         ctx.fillStyle = ball.color;
         ctx.fill();
         ctx.strokeStyle = "black";
         ctx.lineWidth = 1;
         ctx.stroke();
         ctx.closePath();
         if (isDragging && draggingPlayerIndex !== null) {
             drawPullLine();
         }
     }
     function drawPullLine() { /* ... (bez zmian) ... */ }
     function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { /* ... (bez zmian) ... */ }

    // --- FUNKCJE FIZYKI I KOLIZJI ---
    // (Bez zmian)
     function updatePositions() { /* ... */ }
     function confineGoalkeeper(gk, isHomeTeam) { /* ... */ }
     function checkGoal() { /* ... */ }
     function circleCollision(c1, c2) { /* ... */ }
     function resolveCollision(obj1, obj2) { /* ... */ }
     function checkCollisions() { /* ... */ }

    // --- SZTUCZNA INTELIGENCJA (AI) ---
    // (Bez zmian)
    function aiMove() { /* ... */ }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop() {
         if (!gameAnimating || !ctx) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height); // Czyści przezroczysty canvas

         // drawField(); // NIE WYWOŁUJEMY TEJ FUNKCJI

         updatePositions();
         checkCollisions();
         aiMove();
         drawGameObjects(); // Rysuje tylko graczy, piłkę i linię przeciągania
         requestAnimationFrame(gameLoop);
     }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE) ---
    // (Bez zmian)
     function getMousePos(canvas, evt) { /* ... */ }
     function canvasMouseDown(e) { /* ... */ }
     function canvasMouseMove(e) { /* ... */ }
     function canvasMouseUp(e) { /* ... */ }
     function canvasMouseLeave(e) { /* ... */ }
     function addCanvasEvents() { /* ... */ }

    // --- WYBÓR DRUŻYN ---
    // (Bez zmian)
     function populateTeamSelections() { /* ... */ }

    // --- Stadium Selection Population ---
    // (Bez zmian)
    function populateStadiumSelection() { /* ... */ }

    // --- FUNKCJE USTAWIEŃ (Rozmiar czcionki) ---
    // (Bez zmian)
     const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); function applyFontSize(size) { /* ... */ } function loadFontSize() { /* ... */ }

     // --- FUNKCJE POMOCNICZE MODALI ---
     // (Bez zmian)
      function openModal(modalElement) { /* ... */ } function closeModal(modalElement) { /* ... */ }

    // --- SKALOWANIE CANVAS ---
    // (Bez zmian)
     function resizeCanvas() { /* ... */ }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         // Button References (Bez zmian)
         const startMatchBtn = document.getElementById("startMatchBtn"); const goToStadiumSelectBtn = document.getElementById("goToStadiumSelectBtn"); const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn"); const backToStartBtn = document.getElementById("backToStartBtn"); const backToMenuFromSelect = document.getElementById("backToMenuFromSelect"); const backToTeamSelectBtn = document.getElementById("backToTeamSelectBtn"); const btnPlayerDB = document.getElementById("btnPlayerDB"); const btnLanguage = document.getElementById("btnLanguage"); const btnSettings = document.getElementById("btnSettings"); const closePlayerDBBtn = document.getElementById("closePlayerDBBtn"); const closeLanguageModalBtn = document.getElementById("closeLanguageModalBtn"); const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn"); const addPlayerForm = document.getElementById("addPlayerForm"); const langOptions = document.querySelectorAll(".langOption");

         // Navigation Listeners
         if (startMatchBtn) startMatchBtn.addEventListener("click", () => { closeModal(startScreen); openModal(teamSelectScreen); populateTeamSelections(); });
         if (backToMenuFromSelect) backToMenuFromSelect.addEventListener("click", () => { closeModal(teamSelectScreen); openModal(startScreen); });
         if (goToStadiumSelectBtn) goToStadiumSelectBtn.addEventListener("click", () => { if (!selectedHomeTeam || !selectedAwayTeam) { alert("Proszę wybrać obie drużyny!"); return; } if (selectedHomeTeam === selectedAwayTeam) { alert("Drużyny muszą być różne!"); return; } closeModal(teamSelectScreen); openModal(stadiumSelectScreen); populateStadiumSelection(); });
         if (backToTeamSelectBtn) backToTeamSelectBtn.addEventListener("click", () => { closeModal(stadiumSelectScreen); openModal(teamSelectScreen); });

         if (startMatchFromStadiumBtn) startMatchFromStadiumBtn.addEventListener("click", () => {
             if (!selectedStadium) { alert("Proszę wybrać stadion!"); return; }
             if (selectedStadium === "Anfield") {
                 // === PAMIĘTAJ: Wstaw tutaj poprawną nazwę pliku z Twojego repozytorium! ===
                 document.body.style.backgroundImage = "url('46e2051f-681e-49d9-b519-7f2d7d297d72.png')";
                 document.body.style.backgroundSize = "cover";
                 document.body.style.backgroundPosition = "center center";
                 document.body.style.backgroundAttachment = "fixed";
             } else {
                 document.body.style.backgroundImage = ''; // Usuń tło dla innych stadionów
             }
             closeModal(stadiumSelectScreen);
             openModal(gameScreen);
             initGame();
             addCanvasEvents();
             startTimer();
             gameAnimating = true;
             requestAnimationFrame(gameLoop);
         });

         if (backToStartBtn) backToStartBtn.addEventListener("click", () => { gameAnimating = false; stopTimer(); closeModal(gameScreen); openModal(startScreen); document.body.style.backgroundImage = ''; resetGameFull(); });

         // Modal Buttons (Bez zmian)
         if(btnPlayerDB) btnPlayerDB.addEventListener("click", () => openModal(playerDBModal)); if(btnLanguage) btnLanguage.addEventListener("click", () => openModal(languageModal)); if(btnSettings) btnSettings.addEventListener("click", () => { openModal(settingsModal); const currentSize = localStorage.getItem('gameFontSize') || 'medium'; fontSizeOptions.forEach(button => { if(button) button.classList.toggle('active-size', button.dataset.size === currentSize); }); }); if(closePlayerDBBtn) closePlayerDBBtn.addEventListener("click", () => closeModal(playerDBModal)); if(closeLanguageModalBtn) closeLanguageModalBtn.addEventListener("click", () => closeModal(languageModal)); if(closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));

         // Font Size Options (Bez zmian)
         fontSizeOptions.forEach(button => { if(button) button.addEventListener('click', () => applyFontSize(button.dataset.size)); });

         // Add Player Form (Bez zmian)
         if(addPlayerForm) addPlayerForm.addEventListener("submit", (e) => { e.preventDefault(); const name = document.getElementById("playerName")?.value; const team = document.getElementById("playerTeam")?.value; const rating = document.getElementById("playerRating")?.value; if(name && team && rating){ console.log("Dodawanie gracza:", { name, team, rating }); const playerListDiv = document.getElementById("playerList"); if(playerListDiv){ const newPlayerEntry = document.createElement('p'); newPlayerEntry.textContent = `${name} (${team}) - Ocena: ${rating}`; playerListDiv.appendChild(newPlayerEntry); } e.target.reset(); } else { console.warn("Formularz dodawania gracza: brakuje danych"); } });

         // Language Options (Bez zmian)
         langOptions.forEach(button => { if(button) button.addEventListener("click", () => { const lang = button.dataset.lang; console.log("Zmieniono język na:", lang); /* logika */ closeModal(languageModal); }); });

         console.log("MiniSoccer v17 - Przywrócono przezroczysty canvas, tło stadionu na body");
     });

})(); // Koniec IIFE

// ========================================================================
// PEŁNY KOD script.js (WERSJA v4: Tło, Jasność, Muzyka, Rozmiar, AI v4)
// ========================================================================
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

    // Stałe fizyki i gry
    const PLAYER_RADIUS = 15; const GOALKEEPER_RADIUS = 17; const BALL_RADIUS = 7;
    const FRICTION = 0.97; const PLAYER_FRICTION = 0.95; const DRAG_IMPULSE_SCALE = 0.18;
    const MAX_PULL_LENGTH = 160; const COLLISION_RESTITUTION = 0.5; const PLAYER_COLLISION_RESTITUTION = 0.3;
    const BALL_COLLISION_BOOST = 1.1; const AI_REACTION_POWER = 19; const AI_GOALKEEPER_SPEED = 2.1;
    const AI_INTERCEPT_RADIUS_SQ = Math.pow(PLAYER_RADIUS + BALL_RADIUS + 70, 2);
    const AI_PASS_ACCURACY_FACTOR = 0.15; const AI_SHOT_ACCURACY_FACTOR = 0.16;
    const AI_PASS_RANGE_SQ = Math.pow(250, 2); const AI_DEFENSIVE_LINE = 0.6;
    const MATCH_DURATION = 180; let matchTime = MATCH_DURATION; let matchTimerInterval = null;

    // AI "KOLEJKA"
    let aiActionCooldown = 0;
    const AI_ACTION_COOLDOWN_FRAMES = 20; // Zwiększono lekko cooldown
    let activeAiPlayerIndex = -1;
    const AI_INACTIVE_POSITION_POWER_SCALE = 0.005; // BARDZO mała siła dla nieaktywnych

    // Elementy UI i Audio
    const startScreen = document.getElementById("startScreen");
    const teamSelectScreen = document.getElementById("teamSelectScreen");
    const stadiumSelectScreen = document.getElementById("stadiumSelectScreen");
    const gameScreen = document.getElementById("gameScreen");
    const playerDBModal = document.getElementById("playerDBModal");
    const languageModal = document.getElementById("languageModal");
    const settingsModal = document.getElementById("settingsModal");
    const backgroundMusic = document.getElementById("backgroundMusic"); // Referencja do audio

     // --- FUNKCJE MUZYKI ---
     function playBackgroundMusic() {
         if (backgroundMusic) {
             // Próba odtworzenia, obsługa błędu, jeśli przeglądarka blokuje autoplay
             backgroundMusic.play().catch(error => {
                 console.warn("Nie można automatycznie odtworzyć muzyki - wymagana interakcja użytkownika.", error);
                 // Można dodać przycisk "Włącz dźwięk"
             });
         } else { console.error("Nie znaleziono elementu audio 'backgroundMusic'"); }
     }
     function stopBackgroundMusic() {
         if (backgroundMusic) { backgroundMusic.pause(); backgroundMusic.currentTime = 0; } // Zatrzymaj i przewiń na początek
     }

     // --- FUNKCJE TIMERA, RESETU ---
     function updateTimerDisplay() { /* ... (bez zmian) ... */ let minutes = Math.floor(matchTime / 60); let seconds = matchTime % 60; if (seconds < 10) seconds = "0" + seconds; const timerElement = document.getElementById("matchTimer"); if(timerElement) timerElement.innerText = "Czas: " + minutes + ":" + seconds; }
     function startTimer() { if (matchTimerInterval) stopTimer(); matchTime = MATCH_DURATION; updateTimerDisplay(); aiActionCooldown = 0; activeAiPlayerIndex = -1; matchTimerInterval = setInterval(() => { matchTime--; updateTimerDisplay(); if (matchTime <= 0) { gameOver(); } }, 1000); }
     function stopTimer() { clearInterval(matchTimerInterval); matchTimerInterval = null; }
     function gameOver() { stopTimer(); gameAnimating = false; stopBackgroundMusic(); // Zatrzymaj muzykę
         document.body.classList.remove('game-active-background'); const homeName = selectedHomeTeam || "Gospodarze"; const awayName = selectedAwayTeam || "Goście"; alert("Koniec meczu! Wynik: " + homeName + " " + score.home + " : " + score.away + " " + awayName); closeModal(gameScreen); openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); resetGameFull(); }
     function resetGameFull() { if(canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0, canvas.width, canvas.height); } selectedHomeTeam = null; selectedAwayTeam = null; selectedStadium = null; score = {home: 0, away: 0}; fieldPlayers = []; fieldPlayersAway = []; goalkeeper = null; goalkeeperAway = null; ball = null; document.body.style.backgroundImage = ''; document.body.classList.remove('game-active-background'); aiActionCooldown = 0; activeAiPlayerIndex = -1; stopBackgroundMusic(); } // Zatrzymaj muzykę przy pełnym resecie
     function updateScoreboard() { /* ... (bez zmian) ... */ const scoreboardElement = document.getElementById("scoreboard"); if(scoreboardElement) { const homeName = selectedHomeTeam || "Dom"; const awayName = selectedAwayTeam || "Gość"; scoreboardElement.innerText = `${homeName} ${score.home} : ${score.away} ${awayName}`; } }

    // --- BAZA DANYCH KLUBÓW ---
    const teamsData = { /* ... (bez zmian) ... */ }; function getTeamColor(teamName) { /* ... (bez zmian) ... */ }

    // --- Stadium Data ---
    const stadiumsData = [ { name: "Anfield", image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png" } ];

    // --- INICJALIZACJA GRY ---
     function initGame() { /* ... (bez zmian) ... */ canvas = document.getElementById("gameCanvas"); if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; } ctx = canvas.getContext("2d"); canvas.width = 640; canvas.height = 400; resizeCanvas(); ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" }; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; score.home = 0; score.away = 0; updateScoreboard(); console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`); }
     function resetPositionsAfterGoal(homeJustScored) { /* ... (bez zmian, reset AI) ... */ if (!canvas || !ball) return; ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.vx = 0; ball.vy = 0; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; gameAnimating = false; aiActionCooldown = 0; activeAiPlayerIndex = -1; setTimeout(() => { gameAnimating = true; requestAnimationFrame(gameLoop); }, 1200); }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() { /* ... (bez zmian) ... */ } function drawGameObjects() { /* ... (bez zmian) ... */ } function drawPullLine() { /* ... (bez zmian) ... */ } function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { /* ... (bez zmian) ... */ }

    // --- FUNKCJE FIZYKI I KOLIZJI ---
     function updatePositions() { /* ... (bez zmian) ... */ } function confineGoalkeeper(gk, isHomeTeam) { /* ... (bez zmian) ... */ } function checkGoal() { /* ... (bez zmian) ... */ } function circleCollision(c1, c2) { /* ... (bez zmian) ... */ } function resolveCollision(obj1, obj2) { /* ... (bez zmian) ... */ } function checkCollisions() { /* ... (bez zmian) ... */ }

    // =============================================
    // === SZTUCZNA INTELIGENCJA (AI) - KOLEJKA v2 ===
    // =============================================
    function aiMove() {
        if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return;

        const goalX = 10; const goalY = canvas.height / 2; const ownGoalX = canvas.width - 10; const ownGoalY = canvas.height / 2;
        const isDefending = ball.x > canvas.width * AI_DEFENSIVE_LINE;

        // --- AI Bramkarza (działa zawsze) ---
        // (Logika bez zmian od v3)
        goalkeeperAway.vx *= 0.8; goalkeeperAway.vy *= 0.8; if (ball.x > canvas.width * 0.6) { let dyGK = ball.y - goalkeeperAway.y; if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) { goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.12; } let dxGK = ball.x - goalkeeperAway.x; if(ball.x > canvas.width * 0.75 && Math.abs(dxGK) > GOALKEEPER_RADIUS) { goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.08; } } else { let dyToCenter = ownGoalY - goalkeeperAway.y; if (Math.abs(dyToCenter) > 5) { goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.06; } let dxToDefaultPos = (canvas.width - 40) - goalkeeperAway.x; if (Math.abs(dxToDefaultPos) > 5) { goalkeeperAway.vx += Math.sign(dxToDefaultPos) * AI_GOALKEEPER_SPEED * 0.04; } } goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx)); goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy));

        // --- Logika Kolejki AI ---
        let canPerformMajorAction = false;
        if (aiActionCooldown > 0) {
            aiActionCooldown--;
        } else {
            canPerformMajorAction = true; // Można wybrać gracza i wykonać akcję w tej klatce
            activeAiPlayerIndex = -1; // Resetuj przed wyborem
            let playerWithBall = null;
            let closestPlayerIndex = -1;
            let minDistSq = Infinity;

            fieldPlayersAway.forEach((player, index) => {
                if (!player) return;
                let dxB = ball.x - player.x; let dyB = ball.y - player.y; let distSqB = dxB * dxB + dyB * dyB;
                if (distSqB < Math.pow(player.radius + ball.radius + 3, 2)) { playerWithBall = player; activeAiPlayerIndex = index; }
                if (distSqB < minDistSq) { minDistSq = distSqB; closestPlayerIndex = index; }
            });

            if (activeAiPlayerIndex === -1 && closestPlayerIndex !== -1 && minDistSq < AI_INTERCEPT_RADIUS_SQ) {
                activeAiPlayerIndex = closestPlayerIndex; // Najbliższy do przechwytu, jeśli nikt nie ma piłki
            }
            // Nie resetujemy cooldownu tutaj, zrobimy to PO wykonaniu akcji
             if(activeAiPlayerIndex !== -1) console.log(`AI: Player ${activeAiPlayerIndex} chosen for potential action.`);
        }

        // --- AI Graczy z Pola ---
        fieldPlayersAway.forEach((player, index) => {
            if (!player) return;

            const IS_ACTIVE_PLAYER = (index === activeAiPlayerIndex);
            let majorActionTaken = false; // Czy ten gracz wykonał główną akcję w tej klatce?

            let dxToBall = ball.x - player.x; let dyToBall = ball.y - player.y;
            let distToBallSq = dxToBall * dxToBall + dyToBall * dyToBall;
            let playerHasBall = distToBallSq < Math.pow(player.radius + ball.radius + 3, 2);

            // --- GŁÓWNA AKCJA (tylko jeśli można i jest aktywny) ---
            if (IS_ACTIVE_PLAYER && canPerformMajorAction) {
                if (playerHasBall) {
                    let dxToGoal = goalX - player.x; let dyToGoal = goalY - player.y; let angleToGoal = Math.atan2(dyToGoal, dxToGoal);
                    let canShoot = player.x > canvas.width * 0.4 && Math.abs(player.y - goalY) < 100;
                    let passTarget = null; let bestPassTargetDistSq = Infinity;

                    // Szukaj podania (jeśli nie strzela lub losowo)
                    if (!canShoot || Math.random() < 0.5) { /* ... (logika szukania podania bez zmian) ... */ fieldPlayersAway.forEach(teammate => { if (teammate === player) return; let dxTm = teammate.x - player.x; let dyTm = teammate.y - player.y; let distTmSq = dxTm * dxTm + dyTm * dyTm; if (distTmSq < AI_PASS_RANGE_SQ && teammate.x < player.x - PLAYER_RADIUS && distTmSq < bestPassTargetDistSq) { let targetIsClear = true; fieldPlayers.forEach(opponent => { let dxOpp = teammate.x - opponent.x; let dyOpp = teammate.y - opponent.y; if (dxOpp * dxOpp + dyOpp * dyOpp < Math.pow(PLAYER_RADIUS * 3, 2)) { targetIsClear = false; } }); if(targetIsClear) { passTarget = teammate; bestPassTargetDistSq = distTmSq; } } }); }

                    // Wykonaj akcję
                    if (passTarget && Math.random() < 0.7) { // Podanie
                        let dxPass = passTarget.x - player.x; let dyPass = passTarget.y - player.y; let passAngle = Math.atan2(dyPass, dxPass) + (Math.random() - 0.5) * AI_PASS_ACCURACY_FACTOR * 2; let passPower = AI_REACTION_POWER * (0.6 + Math.random() * 0.3) * (1 - Math.sqrt(bestPassTargetDistSq / AI_PASS_RANGE_SQ));
                        ball.vx += Math.cos(passAngle) * passPower; ball.vy += Math.sin(passAngle) * passPower;
                        player.vx += Math.cos(passAngle) * passPower * 0.05; player.vy += Math.sin(passAngle) * passPower * 0.05;
                        console.log(`AI Pass from ${index}!`); majorActionTaken = true; aiActionCooldown = 5; // Ustaw cooldown PO akcji
                    } else if (canShoot && Math.random() < 0.6) { // Strzał
                        let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2; let shootPower = AI_REACTION_POWER * (0.9 + Math.random() * 0.3);
                        ball.vx += Math.cos(shootAngle) * shootPower; ball.vy += Math.sin(shootAngle) * shootPower;
                        player.vx += Math.cos(shootAngle) * shootPower * 0.05; player.vy += Math.sin(shootAngle) * shootPower * 0.05;
                        console.log(`AI Shot from ${index}!`); majorActionTaken = true; aiActionCooldown = 10; // Ustaw cooldown PO akcji
                    } else { // Drybling (nie resetuje cooldownu, jeśli nie ma innej akcji)
                        let dribbleAngle = angleToGoal; let power = AI_REACTION_POWER * 0.35; let closestOpponentDistSq = Infinity; let avoidAngle = 0; fieldPlayers.forEach(opponent => { let dxOpp = opponent.x - player.x; let dyOpp = opponent.y - player.y; let distOppSq = dxOpp * dxOpp + dyOpp * dyOpp; if (distOppSq < Math.pow(PLAYER_RADIUS * 5, 2) && distOppSq < closestOpponentDistSq) { closestOpponentDistSq = distOppSq; avoidAngle = Math.sign(dxOpp * dyToGoal - dyOpp * dxToGoal) * 0.4; } }); dribbleAngle -= avoidAngle;
                        player.vx += Math.cos(dribbleAngle) * power * 0.1; player.vy += Math.sin(dribbleAngle) * power * 0.1;
                        // Drybling nie jest "główną" akcją resetującą kolejkę, gracz może kontynuować
                    }
                } else if (!playerHasBall && distToBallSq < AI_INTERCEPT_RADIUS_SQ) { // Przechwyt
                    let interceptPower = AI_REACTION_POWER * 0.6 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ));
                    if (distToBall > 0) {
                        player.vx += (dxToBall / distToBall) * interceptPower * 0.1;
                        player.vy += (dyToBall / distToBall) * interceptPower * 0.1;
                         console.log(`AI Intercept attempt by ${index}!`);
                         majorActionTaken = true; // Próba przechwytu też resetuje cooldown
                         aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES;
                    }
                }
                // Jeśli aktywny gracz nie mógł wykonać żadnej akcji (np. za daleko od piłki), resetujemy cooldown, by inny mógł spróbować
                 if (IS_ACTIVE_PLAYER && !majorActionTaken && !playerHasBall) {
                    aiActionCooldown = 0; // Pozwól wybrać innego gracza w następnej klatce
                    activeAiPlayerIndex = -1;
                 } else if (majorActionTaken) {
                    activeAiPlayerIndex = -1; // Dezaktywuj gracza po wykonaniu akcji
                 }

            }

            // --- AKCJE POZYCYJNE (zawsze, ale siła zależy od aktywności) ---
            if (!playerHasBall && !majorActionTaken) { // Nie ruszaj się pozycyjnie jeśli właśnie wykonałeś akcję lub masz piłkę
                let targetX, targetY;
                // Użyj bardzo małej siły dla nieaktywnych
                let positionPowerScale = IS_ACTIVE_PLAYER ? 0.08 : AI_INACTIVE_POSITION_POWER_SCALE;
                let positionPower = AI_REACTION_POWER * positionPowerScale;

                if (isDefending) { // Pozycjonowanie defensywne
                    targetX = ball.x + (ownGoalX - ball.x) * (0.3 + index * 0.1); targetY = ball.y + (ownGoalY - ball.y) * (0.3 + index * 0.1);
                    targetY = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, targetY)); targetX = Math.max(canvas.width * 0.5, Math.min(canvas.width - PLAYER_RADIUS, targetX));
                    positionPower *= 0.8;
                } else { // Pozycjonowanie ofensywne
                    targetX = canvas.width * (0.3 + index * 0.1); targetY = canvas.height * (index % 2 === 0 ? (0.3 + Math.random()*0.1) : (0.7 - Math.random()*0.1));
                    if (distToBall > 200) { // Podążaj za piłką z dystansu
                         targetX = ball.x + 70; targetY = ball.y + (index % 2 === 0 ? -40 : 40);
                    }
                }

                let dxToPos = targetX - player.x; let dyToPos = targetY - player.y; let distToPos = Math.hypot(dxToPos, dyToPos);
                if (distToPos > PLAYER_RADIUS * (IS_ACTIVE_PLAYER ? 1.5 : 3.5)) { // Nieaktywni ruszają się tylko gdy są dalej
                     fieldPlayersAway.forEach(teammate => { if(teammate === player) return; let dxTm = teammate.x - player.x; let dyTm = teammate.y - player.y; if(dxTm*dxTm + dyTm*dyTm < Math.pow(PLAYER_RADIUS*2.5, 2)) { dxToPos -= dxTm * 0.05; dyToPos -= dyTm * 0.05;} }); // Słabsze unikanie
                     distToPos = Math.hypot(dxToPos, dyToPos);
                    if(distToPos > 0) { player.vx += (dxToPos / distToPos) * positionPower * 0.1; player.vy += (dyToPos / distToPos) * positionPower * 0.1; }
                }
            }

            // Ogranicz prędkość
            const maxAiSpeed = IS_ACTIVE_PLAYER ? 6.0 : 1.5; // BARDZO wolni nieaktywni gracze
            const currentSpeed = Math.hypot(player.vx, player.vy);
            if (currentSpeed > maxAiSpeed) { player.vx = (player.vx / currentSpeed) * maxAiSpeed; player.vy = (player.vy / currentSpeed) * maxAiSpeed; }
        });
    }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop() { if (!gameAnimating || !ctx) return; ctx.clearRect(0, 0, canvas.width, canvas.height); drawField(); updatePositions(); checkCollisions(); aiMove(); drawGameObjects(); requestAnimationFrame(gameLoop); }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE) ---
    function getMousePos(canvas, evt) { /* ... */ } function canvasMouseDown(e) { /* ... */ } function canvasMouseMove(e) { /* ... */ } function canvasMouseUp(e) { /* ... */ } function canvasMouseLeave(e) { /* ... */ } function addCanvasEvents() { /* ... */ }

    // --- WYBÓR DRUŻYN / STADIONU ---
    function populateTeamSelections() { /* ... */ } function populateStadiumSelection() { /* ... */ }

    // --- FUNKCJE USTAWIEŃ ---
    const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); function applyFontSize(size) { /* ... */ } function loadFontSize() { /* ... */ }

     // --- FUNKCJE POMOCNICZE MODALI ---
      function openModal(modalElement) { /* ... */ } function closeModal(modalElement) { /* ... */ }

    // --- SKALOWANIE CANVAS ---
     function resizeCanvas() {
         if (!canvas) return;
         const gameContainer = canvas.parentElement;
         if (!gameContainer) return;
         const canvasLogicalWidth = 640; const canvasLogicalHeight = 400; const aspectRatio = canvasLogicalWidth / canvasLogicalHeight;

         // === ZMIANA: MNIEJSZE BOISKO (np. 90% szerokości kontenera) ===
         const availableWidth = gameContainer.clientWidth * 0.90; // Użyj 90% szer. kontenera
         const availableHeight = window.innerHeight - 100; // Mniej marginesu na UI

         let newWidth = availableWidth; let newHeight = newWidth / aspectRatio;
         if (newHeight > availableHeight) { newHeight = availableHeight; newWidth = newHeight * aspectRatio; }

         // === DODANO: Ograniczenie maksymalnego rozmiaru wizualnego ===
         const maxVisualWidth = 800; // Maksymalna szerokość w pikselach
         if (newWidth > maxVisualWidth) {
             newWidth = maxVisualWidth;
             newHeight = newWidth / aspectRatio;
         }
         // === KONIEC DODANIA ===

         canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`;
         canvas.width = canvasLogicalWidth; canvas.height = canvasLogicalHeight;
         console.log(`Canvas resized: CSS ${newWidth}x${newHeight}, Logical ${canvas.width}x${canvas.height}`);
     }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         // Ustawienie tła dla startScreen
         if (startScreen) { startScreen.classList.add('start-screen-background'); console.log("Dodano klasę tła do startScreen przy inicjalizacji."); }
         else { console.error("Nie znaleziono elementu startScreen!"); }

         // Referencje
         const startMatchBtn = document.getElementById("startMatchBtn"); const goToStadiumSelectBtn = document.getElementById("goToStadiumSelectBtn"); const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn"); const backToStartBtn = document.getElementById("backToStartBtn"); const backToMenuFromSelect = document.getElementById("backToMenuFromSelect"); const backToTeamSelectBtn = document.getElementById("backToTeamSelectBtn");
         const btnPlayerDB = document.getElementById("btnPlayerDB"); const btnLanguage = document.getElementById("btnLanguage"); const btnSettings = document.getElementById("btnSettings"); const closePlayerDBBtn = document.getElementById("closePlayerDBBtn"); const closeLanguageModalBtn = document.getElementById("closeLanguageModalBtn"); const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn"); const addPlayerForm = document.getElementById("addPlayerForm"); const langOptions = document.querySelectorAll(".langOption");

         // --- Listenery Nawigacji ---
         if (startMatchBtn) startMatchBtn.addEventListener("click", () => { if(startScreen) startScreen.classList.remove('start-screen-background'); closeModal(startScreen); openModal(teamSelectScreen); try { populateTeamSelections(); } catch (error) { console.error("Błąd:", error); } });
         if (backToMenuFromSelect) backToMenuFromSelect.addEventListener("click", () => { closeModal(teamSelectScreen); openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); });
         if (goToStadiumSelectBtn) goToStadiumSelectBtn.addEventListener("click", () => { if (!selectedHomeTeam || !selectedAwayTeam) { alert("Wybierz obie drużyny!"); return; } if (selectedHomeTeam === selectedAwayTeam) { alert("Drużyny muszą być różne!"); return; } closeModal(teamSelectScreen); openModal(stadiumSelectScreen); populateStadiumSelection(); });
         if (backToTeamSelectBtn) backToTeamSelectBtn.addEventListener("click", () => { closeModal(stadiumSelectScreen); openModal(teamSelectScreen); });
         if (startMatchFromStadiumBtn) startMatchFromStadiumBtn.addEventListener("click", () => {
             if (!selectedStadium) { alert("Wybierz stadion!"); return; }
             const stadiumData = stadiumsData.find(s => s.name === selectedStadium);
             if (stadiumData && stadiumData.image) { document.body.style.backgroundImage = `url('${stadiumData.image}')`; document.body.style.backgroundSize = "cover"; document.body.style.backgroundPosition = "center center"; document.body.style.backgroundRepeat = "no-repeat"; document.body.style.backgroundAttachment = "fixed"; document.body.classList.add('game-active-background'); }
             else { document.body.style.backgroundImage = ''; document.body.classList.remove('game-active-background'); }
             closeModal(stadiumSelectScreen); openModal(gameScreen);
             initGame(); addCanvasEvents(); resizeCanvas(); startTimer();
             playBackgroundMusic(); // Zacznij odtwarzać muzykę
             gameAnimating = true; requestAnimationFrame(gameLoop);
         });
         if (backToStartBtn) backToStartBtn.addEventListener("click", () => { gameAnimating = false; stopTimer(); stopBackgroundMusic(); // Zatrzymaj muzykę
             document.body.classList.remove('game-active-background'); closeModal(gameScreen); openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); document.body.style.backgroundImage = ''; resetGameFull(); });

         // --- Listenery Modali ---
         // ... (bez zmian) ...

         // --- Listenery Ustawień ---
         // ... (bez zmian) ...

         console.log("MiniSoccer - Inicjalizacja zakończona (v4).");
         resizeCanvas();
     });

})(); // Koniec IIFE

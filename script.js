// ========================================================================
// PEŁNY KOD script.js (WERSJA v4: Tło, Jasność, Muzyka, Rozmiar, AI v4 + Poprawki)
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
    const MATCH_DURATION = 180; // sekundy
    let matchTime = MATCH_DURATION; let matchTimerInterval = null;

    // AI "KOLEJKA"
    let aiActionCooldown = 0;
    const AI_ACTION_COOLDOWN_FRAMES = 20;
    let activeAiPlayerIndex = -1;
    const AI_INACTIVE_POSITION_POWER_SCALE = 0.005;

    // Elementy UI i Audio - Pobierane w DOMContentLoaded
    let startScreen, teamSelectScreen, stadiumSelectScreen, gameScreen,
        playerDBModal, languageModal, settingsModal, backgroundMusic;
    let homeTeamSelect, awayTeamSelect, stadiumSelectionContainer, scoreboardElement, timerElement;

    // --- BAZA DANYCH KLUBÓW (PRZYKŁAD - ROZBUDUJ WG POTRZEB) ---
    const teamsData = {
        "Liverpool": { color1: "#c8102e", color2: "#ffffff" },
        "Man City": { color1: "#6cabdd", color2: "#ffffff" },
        "Chelsea": { color1: "#034694", color2: "#ffffff" },
        "Arsenal": { color1: "#ef0107", color2: "#ffffff" },
        "Real Madryt": { color1: "#ffffff", color2: "#febe10" },
        "FC Barcelona": { color1: "#a50044", color2: "#004d98" },
        "Bayern": { color1: "#dc052d", color2: "#ffffff" },
        "PSG": { color1: "#004170", color2: "#da291c" },
    };

    function getTeamColor(teamName) {
        return teamsData[teamName] ? teamsData[teamName].color1 : '#808080'; // Zwraca główny kolor lub szary
    }

    // --- Stadium Data (PRZYKŁAD - DODAJ WIĘCEJ) ---
    const stadiumsData = [
        { name: "Anfield", image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png" }, // Upewnij się, że ten plik istnieje
        { name: "Generic Stadium", image: "" } // Stadion bez obrazka
        // Dodaj więcej stadionów: { name: "Nazwa", image: "sciezka/do/obrazka.jpg" }
    ];

    // --- FUNKCJE MUZYKI ---
     function playBackgroundMusic() {
         if (backgroundMusic) {
             backgroundMusic.play().catch(error => {
                 console.warn("Nie można automatycznie odtworzyć muzyki - może być wymagana interakcja użytkownika.", error);
                 // Można dodać np. przycisk "Włącz dźwięk", jeśli autoplay zawiedzie
             });
         } else { console.error("Nie znaleziono elementu audio 'backgroundMusic'"); }
     }
     function stopBackgroundMusic() {
         if (backgroundMusic) {
             backgroundMusic.pause();
             backgroundMusic.currentTime = 0; // Przewiń na początek
         }
     }

     // --- FUNKCJE TIMERA, RESETU ---
     function updateTimerDisplay() {
         let minutes = Math.floor(matchTime / 60);
         let seconds = matchTime % 60;
         if (seconds < 10) seconds = "0" + seconds;
         if(timerElement) timerElement.innerText = "Czas: " + minutes + ":" + seconds;
     }
     function startTimer() {
         if (matchTimerInterval) stopTimer(); // Zatrzymaj poprzedni, jeśli istnieje
         matchTime = MATCH_DURATION;
         updateTimerDisplay();
         aiActionCooldown = 0; // Reset AI cooldown
         activeAiPlayerIndex = -1; // Reset aktywnego gracza AI
         matchTimerInterval = setInterval(() => {
             matchTime--;
             updateTimerDisplay();
             if (matchTime <= 0) {
                 gameOver();
             }
         }, 1000);
     }
     function stopTimer() {
         clearInterval(matchTimerInterval);
         matchTimerInterval = null;
     }
     function gameOver() {
         stopTimer();
         gameAnimating = false;
         stopBackgroundMusic(); // Zatrzymaj muzykę
         document.body.classList.remove('game-active-background');
         const homeName = selectedHomeTeam || "Gospodarze";
         const awayName = selectedAwayTeam || "Goście";
         alert("Koniec meczu! Wynik: " + homeName + " " + score.home + " : " + score.away + " " + awayName);
         // Pokaż ekran startowy zamiast zamykać ekran gry, jeśli tak wolisz
         closeModal(gameScreen); // Ukryj ekran gry
         openModal(startScreen); // Pokaż ekran startowy
         if(startScreen) startScreen.classList.add('start-screen-background'); // Przywróć tło startowe
         resetGameFull(); // Zresetuj stan gry
     }
     function resetGameFull() {
         if(canvas && ctx) {
             ctx.clearRect(0,0, canvas.width, canvas.height);
         }
         selectedHomeTeam = null;
         selectedAwayTeam = null;
         selectedStadium = null;
         score = {home: 0, away: 0};
         fieldPlayers = [];
         fieldPlayersAway = [];
         goalkeeper = null;
         goalkeeperAway = null;
         ball = null;
         document.body.style.backgroundImage = ''; // Usuń tło stadionu
         document.body.classList.remove('game-active-background');
         aiActionCooldown = 0;
         activeAiPlayerIndex = -1;
         stopBackgroundMusic(); // Upewnij się, że muzyka jest zatrzymana
         // Zresetuj wybory w selectach
         if (homeTeamSelect) homeTeamSelect.value = "";
         if (awayTeamSelect) awayTeamSelect.value = "";
         // Wyczyść kontener stadionów
         if (stadiumSelectionContainer) stadiumSelectionContainer.innerHTML = '';
         updateScoreboard(); // Zaktualizuj tablicę wyników (pokaże domyślne nazwy)
     }
     function updateScoreboard() {
         if(scoreboardElement) {
             const homeName = selectedHomeTeam || "Dom";
             const awayName = selectedAwayTeam || "Gość";
             scoreboardElement.innerText = `${homeName} ${score.home} : ${score.away} ${awayName}`;
         }
     }

    // --- INICJALIZACJA GRY ---
     function initGame() {
         canvas = document.getElementById("gameCanvas");
         if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; }
         ctx = canvas.getContext("2d");

         // Ustawienie logicznych wymiarów canvas (niezależne od CSS)
         canvas.width = 640;
         canvas.height = 400;
         resizeCanvas(); // Dostosuj CSS do rozmiaru okna

         // Inicjalizacja obiektów gry
         ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" };
         let homeColor = getTeamColor(selectedHomeTeam);
         let awayColor = getTeamColor(selectedAwayTeam);
         const gkColor = '#CCCCCC'; // Kolor bramkarzy

         // Początkowe pozycje - można je ulepszyć dla różnych formacji
         fieldPlayers = [
             { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, // LO
             { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, // PO
             { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, // LS
             { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }  // PS
         ];
         fieldPlayersAway = [
             { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, // LO
             { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, // PO
             { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, // LS
             { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }  // PS
         ];
         goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };
         goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };

         score.home = 0;
         score.away = 0;
         updateScoreboard(); // Zaktualizuj tablicę wyników na starcie

         console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`);
     }

     function resetPositionsAfterGoal(homeJustScored) {
         if (!canvas || !ball) return;

         // Resetuj piłkę na środek
         ball.x = canvas.width / 2;
         ball.y = canvas.height / 2;
         ball.vx = 0;
         ball.vy = 0;

         // Resetuj pozycje graczy i bramkarzy do stanu początkowego
         let homeColor = getTeamColor(selectedHomeTeam);
         let awayColor = getTeamColor(selectedAwayTeam);
         const gkColor = '#CCCCCC';
         fieldPlayers = [
             { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
             { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
             { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
             { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }
         ];
         fieldPlayersAway = [
             { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
             { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
             { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
             { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }
         ];
         goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };
         goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };

         // Resetuj stan AI
         aiActionCooldown = 0;
         activeAiPlayerIndex = -1;

         // Wstrzymaj grę na chwilę i wznów
         gameAnimating = false;
         // Narysuj stan po resecie od razu
         if (ctx) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             drawField();
             drawGameObjects();
         }
         setTimeout(() => {
             gameAnimating = true;
             requestAnimationFrame(gameLoop); // Wznów pętlę gry
         }, 1500); // Pauza 1.5 sekundy po golu
     }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() {
         if (!ctx || !canvas) return;
         // Tło boiska (już ustawione w CSS lub dynamicznie obrazkiem)
         // ctx.fillStyle = "#5a8a5a"; // Przykładowa zieleń
         // ctx.fillRect(0, 0, canvas.width, canvas.height);

         // Linie boiska
         ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; // Półprzezroczysta biel
         ctx.lineWidth = 2;

         // Linia środkowa
         ctx.beginPath();
         ctx.moveTo(canvas.width / 2, 0);
         ctx.lineTo(canvas.width / 2, canvas.height);
         ctx.stroke();

         // Koło środkowe
         ctx.beginPath();
         ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
         ctx.stroke();

         // Bramki (proste słupki)
         const goalWidth = 8; const goalHeight = 90;
         ctx.fillStyle = "#d0d0d0";
         // Bramka lewa
         ctx.fillRect(0, canvas.height / 2 - goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); // Górny słupek
         ctx.fillRect(0, canvas.height / 2 + goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); // Dolny słupek
         // Bramka prawa
         ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 - goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); // Górny słupek
         ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 + goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); // Dolny słupek

          // Pola karne (proste)
         const penaltyBoxWidth = 80; const penaltyBoxHeight = 180;
         // Lewe pole karne
         ctx.strokeRect(0, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
         // Prawe pole karne
         ctx.strokeRect(canvas.width - penaltyBoxWidth, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
     }

     function drawCircle(obj) {
         if (!ctx || !obj) return;
         ctx.beginPath();
         ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
         ctx.fillStyle = obj.color;
         ctx.fill();
         ctx.strokeStyle = 'black'; // Cienka czarna obwódka dla lepszej widoczności
         ctx.lineWidth = 1;
         ctx.stroke();
     }

     function drawGameObjects() {
         if (!ctx) return;
         if (ball) drawCircle(ball);
         if (goalkeeper) drawCircle(goalkeeper);
         if (goalkeeperAway) drawCircle(goalkeeperAway);
         fieldPlayers.forEach(drawCircle);
         fieldPlayersAway.forEach(drawCircle);

         // Rysuj linię przeciągania, jeśli aktywna
         if (isDragging && draggingPlayerIndex !== null) {
             drawPullLine();
         }
     }

     function drawPullLine() {
         if (!ctx || draggingPlayerIndex === null || !fieldPlayers[draggingPlayerIndex]) return;

         const player = fieldPlayers[draggingPlayerIndex];
         let dx = dragCurrentCanvas.x - dragStartCanvas.x;
         let dy = dragCurrentCanvas.y - dragStartCanvas.y;
         let pullLength = Math.hypot(dx, dy);

         // Ogranicz długość pociągnięcia
         if (pullLength > MAX_PULL_LENGTH) {
             dx = (dx / pullLength) * MAX_PULL_LENGTH;
             dy = (dy / pullLength) * MAX_PULL_LENGTH;
             pullLength = MAX_PULL_LENGTH;
         }

         // Linia wskazuje kierunek *przeciwny* do pociągnięcia
         const startX = player.x;
         const startY = player.y;
         const endX = player.x - dx;
         const endY = player.y - dy;

         // Kolor i grubość linii zależne od siły (długości)
         const strengthRatio = pullLength / MAX_PULL_LENGTH;
         const red = Math.floor(255 * strengthRatio);
         const green = Math.floor(255 * (1 - strengthRatio));
         ctx.strokeStyle = `rgb(${red}, ${green}, 0)`;
         ctx.lineWidth = 2 + 3 * strengthRatio; // Grubsza linia przy większej sile

         ctx.beginPath();
         ctx.moveTo(startX, startY);
         ctx.lineTo(endX, endY);
         ctx.stroke();

         // Rysuj grot strzałki na końcu linii
         drawArrowhead(ctx, startX, startY, endX, endY, 10 + 5 * strengthRatio);
     }

      function drawArrowhead(context, fromx, fromy, tox, toy, headLength) {
         const dx = tox - fromx;
         const dy = toy - fromy;
         const angle = Math.atan2(dy, dx);
         context.beginPath();
         context.moveTo(tox, toy);
         context.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6));
         context.moveTo(tox, toy); // Wróć do punktu końcowego dla drugiej linii
         context.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6));
         context.stroke(); // Użyj bieżącego stylu linii
     }


    // --- FUNKCJE FIZYKI I KOLIZJI ---
     function applyFriction(obj, frictionValue) {
        if (!obj) return;
        obj.vx *= frictionValue;
        obj.vy *= frictionValue;
        // Zatrzymaj bardzo wolne obiekty, aby uniknąć "pełzania"
        if (Math.abs(obj.vx) < 0.05) obj.vx = 0;
        if (Math.abs(obj.vy) < 0.05) obj.vy = 0;
     }

     function updatePositions() {
         if (!canvas) return;
         const allObjects = [ball, goalkeeper, goalkeeperAway, ...fieldPlayers, ...fieldPlayersAway];

         allObjects.forEach(obj => {
             if (!obj) return; // Pomiń jeśli obiekt nie istnieje (np. przed inicjalizacją)

             obj.x += obj.vx;
             obj.y += obj.vy;

             // Tarcie
             if (obj === ball) {
                 applyFriction(obj, FRICTION);
             } else {
                 applyFriction(obj, PLAYER_FRICTION);
             }

             // Kolizje ze ścianami poziomymi (bandami)
             if (obj.y - obj.radius < 0) {
                 obj.y = obj.radius;
                 obj.vy *= -COLLISION_RESTITUTION;
             } else if (obj.y + obj.radius > canvas.height) {
                 obj.y = canvas.height - obj.radius;
                 obj.vy *= -COLLISION_RESTITUTION;
             }

             // Kolizje ze ścianami pionowymi (za bramkami) - bez bramek
             if (obj !== ball) { // Zawodnicy odbijają się od linii końcowych
                 if (obj.x - obj.radius < 0) {
                     obj.x = obj.radius;
                     obj.vx *= -PLAYER_COLLISION_RESTITUTION;
                 } else if (obj.x + obj.radius > canvas.width) {
                     obj.x = canvas.width - obj.radius;
                     obj.vx *= -PLAYER_COLLISION_RESTITUTION;
                 }
             }
         });

         // Specjalne ograniczenia dla bramkarzy
         if (goalkeeper) confineGoalkeeper(goalkeeper, true);
         if (goalkeeperAway) confineGoalkeeper(goalkeeperAway, false);

         // Sprawdź gole
         checkGoal();
     }

     function confineGoalkeeper(gk, isHomeTeam) {
         if (!gk || !canvas) return;
         const goalLineX = isHomeTeam ? 0 : canvas.width;
         const maxDistX = 100; // Jak daleko może wyjść od linii bramkowej
         const goalPostYTop = canvas.height / 2 - 45; // Górny słupek
         const goalPostYBottom = canvas.height / 2 + 45; // Dolny słupek

         // Ograniczenie Y (między słupkami)
         gk.y = Math.max(goalPostYTop + gk.radius, Math.min(goalPostYBottom - gk.radius, gk.y));

         // Ograniczenie X (w polu bramkowym / blisko linii)
         if (isHomeTeam) {
             gk.x = Math.max(gk.radius, Math.min(maxDistX, gk.x));
         } else {
             gk.x = Math.max(canvas.width - maxDistX, Math.min(canvas.width - gk.radius, gk.x));
         }
     }

     function checkGoal() {
         if (!ball || !canvas) return;
         const goalLineLeft = 5; // Margines na grubość słupka
         const goalLineRight = canvas.width - 5;
         const goalPostYTop = canvas.height / 2 - 45; // Współrzędna Y górnego słupka
         const goalPostYBottom = canvas.height / 2 + 45; // Współrzędna Y dolnego słupka

         // Sprawdź, czy piłka jest między słupkami w osi Y
         const isBetweenPosts = ball.y > goalPostYTop && ball.y < goalPostYBottom;

         if (isBetweenPosts) {
             // Gol dla gości (piłka przekroczyła lewą linię)
             if (ball.x - ball.radius < goalLineLeft) {
                 console.log("GOAL for Away Team!");
                 score.away++;
                 updateScoreboard();
                 resetPositionsAfterGoal(false); // false = goście zdobyli
             }
             // Gol dla gospodarzy (piłka przekroczyła prawą linię)
             else if (ball.x + ball.radius > goalLineRight) {
                 console.log("GOAL for Home Team!");
                 score.home++;
                 updateScoreboard();
                 resetPositionsAfterGoal(true); // true = gospodarze zdobyli
             }
         }
     }

     function circleCollision(c1, c2) {
         if (!c1 || !c2) return false;
         const dx = c2.x - c1.x;
         const dy = c2.y - c1.y;
         const distSq = dx * dx + dy * dy;
         const minDist = c1.radius + c2.radius;
         return distSq < minDist * minDist;
     }

     function resolveCollision(obj1, obj2) {
         if (!obj1 || !obj2) return;

         const dx = obj2.x - obj1.x;
         const dy = obj2.y - obj1.y;
         let distance = Math.hypot(dx, dy);
         const minDist = obj1.radius + obj2.radius;

         if (distance === 0) { // Zapobiegaj dzieleniu przez zero, jeśli obiekty są idealnie na sobie
             distance = 0.1;
         }

         // 1. Rozdzielenie nakładających się obiektów
         const overlap = minDist - distance;
         if (overlap > 0) {
             const adjustX = (dx / distance) * overlap * 0.5; // Rozsuń o połowę nakładki
             const adjustY = (dy / distance) * overlap * 0.5;
             obj1.x -= adjustX; obj1.y -= adjustY;
             obj2.x += adjustX; obj2.y += adjustY;
             // Przelicz dx, dy, distance po rozsunięciu dla obliczeń fizyki
             const new_dx = obj2.x - obj1.x;
             const new_dy = obj2.y - obj1.y;
             distance = Math.hypot(new_dx, new_dy); // Użyj nowej odległości
             if (distance === 0) distance = 0.1; // Ponowne zabezpieczenie
         }

         // 2. Fizyka kolizji (wymiana pędu)
         const normalX = dx / distance;
         const normalY = dy / distance;

         // Prędkości wzdłuż normalnej
         const v1n = obj1.vx * normalX + obj1.vy * normalY;
         const v2n = obj2.vx * normalX + obj2.vy * normalY;

         // Wybierz współczynnik restytucji
         let restitution = COLLISION_RESTITUTION; // Domyślna
         if ((obj1 !== ball && obj2 !== ball) || (obj1 === goalkeeper && obj2 === goalkeeperAway)) { // Kolizja Gracz-Gracz lub GK-GK
             restitution = PLAYER_COLLISION_RESTITUTION;
         }

         // Oblicz nowe prędkości wzdłuż normalnej (prostsza formuła bez mas)
         const new_v1n = v2n; // Wymiana prędkości wzdłuż normalnej (uproszczone)
         const new_v2n = v1n; //

         // Zastosuj impuls/zmianę prędkości
         const impulse1 = (new_v1n - v1n) * restitution;
         const impulse2 = (new_v2n - v2n) * restitution;

         obj1.vx += impulse1 * normalX;
         obj1.vy += impulse1 * normalY;
         obj2.vx += impulse2 * normalX;
         obj2.vy += impulse2 * normalY;

         // Dodaj lekkie wzmocnienie piłce przy kolizji z graczem/bramkarzem
         if (obj1 === ball && obj2 !== ball) {
             obj1.vx *= BALL_COLLISION_BOOST;
             obj1.vy *= BALL_COLLISION_BOOST;
         } else if (obj2 === ball && obj1 !== ball) {
             obj2.vx *= BALL_COLLISION_BOOST;
             obj2.vy *= BALL_COLLISION_BOOST;
         }
     }


     function checkCollisions() {
         const allPlayers = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway];
         const dynamicObjects = [ball, ...allPlayers]; // Wszystkie obiekty, które mogą się zderzać

         // Kolizje między wszystkimi dynamicznymi obiektami
         for (let i = 0; i < dynamicObjects.length; i++) {
             for (let j = i + 1; j < dynamicObjects.length; j++) {
                 const obj1 = dynamicObjects[i];
                 const obj2 = dynamicObjects[j];
                 if (!obj1 || !obj2) continue; // Pomiń nieistniejące

                 if (circleCollision(obj1, obj2)) {
                     resolveCollision(obj1, obj2);
                 }
             }
         }
     }

    // =============================================
    // === SZTUCZNA INTELIGENCJA (AI) - KOLEJKA v2 ===
    // =============================================
    function aiMove() {
        if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return;

        const goalX = 10; // Celuj w lewą bramkę
        const goalY = canvas.height / 2;
        const ownGoalX = canvas.width - 10; // Własna bramka (prawa)
        const ownGoalY = canvas.height / 2;
        const isDefending = ball.x > canvas.width * AI_DEFENSIVE_LINE; // Czy piłka jest na połowie AI?

        // --- AI Bramkarza (działa zawsze, prosta logika) ---
        if (goalkeeperAway) {
             goalkeeperAway.vx *= 0.8; goalkeeperAway.vy *= 0.8; // Tarcie dla płynności
             // Jeśli piłka zbliża się do bramki
             if (ball.x > canvas.width * 0.6) {
                 let dyGK = ball.y - goalkeeperAway.y;
                 // Reaguj na pozycję Y piłki, jeśli jest znacząca różnica
                 if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) {
                     goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.12;
                 }
                 // Wyjdź lekko do piłki, jeśli jest bardzo blisko w osi X
                 let dxGK = ball.x - goalkeeperAway.x;
                 if(ball.x > canvas.width * 0.75 && Math.abs(dxGK) > GOALKEEPER_RADIUS) {
                     goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.08;
                 }
             } else { // Jeśli piłka jest daleko, wracaj do pozycji domyślnej
                 let dyToCenter = ownGoalY - goalkeeperAway.y;
                 if (Math.abs(dyToCenter) > 5) { // Wróć na środek bramki (Y)
                     goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.06;
                 }
                 let dxToDefaultPos = (canvas.width - 40) - goalkeeperAway.x; // Wróć do domyślnej pozycji X
                 if (Math.abs(dxToDefaultPos) > 5) {
                     goalkeeperAway.vx += Math.sign(dxToDefaultPos) * AI_GOALKEEPER_SPEED * 0.04;
                 }
             }
             // Ogranicz prędkość bramkarza
             goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx));
             goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy));
        }


        // --- Logika Kolejki AI dla Graczy z Pola ---
        let canPerformMajorAction = false;
        if (aiActionCooldown > 0) {
            aiActionCooldown--;
        } else {
            canPerformMajorAction = true; // Można wybrać gracza i wykonać akcję w tej klatce
            activeAiPlayerIndex = -1; // Resetuj aktywnego gracza przed wyborem

            let playerWithBall = null;
            let closestPlayerIndex = -1;
            let minDistSqToBall = Infinity;

            // Znajdź gracza z piłką lub najbliższego piłce
            fieldPlayersAway.forEach((player, index) => {
                if (!player) return;
                let dxB = ball.x - player.x;
                let dyB = ball.y - player.y;
                let distSqB = dxB * dxB + dyB * dyB;

                // Czy gracz ma piłkę (lub jest tuż przy niej)?
                if (distSqB < Math.pow(player.radius + ball.radius + 5, 2)) { // Zwiększono lekko zasięg "posiadania"
                     playerWithBall = player;
                     activeAiPlayerIndex = index; // Ten gracz jest aktywny
                }

                // Śledź najbliższego gracza, nawet jeśli nie ma piłki
                if (distSqB < minDistSqToBall) {
                    minDistSqToBall = distSqB;
                    closestPlayerIndex = index;
                }
            });

            // Jeśli nikt nie ma piłki, ale ktoś jest blisko i może przechwycić
            if (activeAiPlayerIndex === -1 && closestPlayerIndex !== -1 && minDistSqToBall < AI_INTERCEPT_RADIUS_SQ) {
                activeAiPlayerIndex = closestPlayerIndex; // Wybierz najbliższego do potencjalnego przechwytu
                 // console.log(`AI: Player ${activeAiPlayerIndex} chosen for intercept.`);
            } else if (activeAiPlayerIndex !== -1) {
                 // console.log(`AI: Player ${activeAiPlayerIndex} has the ball.`);
            }
            // Cooldown zostanie ustawiony DOPIERO PO wykonaniu akcji przez aktywnego gracza
        }

        // --- AI Graczy z Pola - Akcje Indywidualne ---
        fieldPlayersAway.forEach((player, index) => {
            if (!player) return;

            const IS_ACTIVE_PLAYER = (index === activeAiPlayerIndex);
            let majorActionTakenThisFrame = false; // Czy ten gracz wykonał główną akcję?

            let dxToBall = ball.x - player.x;
            let dyToBall = ball.y - player.y;
            let distToBall = Math.hypot(dxToBall, dyToBall); // Użyjemy też dystansu
            let distToBallSq = distToBall * distToBall;
            let playerHasBall = distToBallSq < Math.pow(player.radius + ball.radius + 5, 2); // Spójne z wyborem aktywnego

            // --- GŁÓWNA AKCJA (Strzał, Podanie, Przechwyt) - tylko jeśli można i jest aktywny ---
            if (IS_ACTIVE_PLAYER && canPerformMajorAction) {
                if (playerHasBall) {
                    // Opcje: Strzał, Podanie, Drybling
                    let dxToGoal = goalX - player.x;
                    let dyToGoal = goalY - player.y;
                    let angleToGoal = Math.atan2(dyToGoal, dxToGoal);
                    let distToGoalSq = dxToGoal * dxToGoal + dyToGoal * dyToGoal;

                    // Warunki strzału (np. na połowie przeciwnika, w miarę dobra pozycja Y)
                    let canShoot = player.x > canvas.width * 0.4 && Math.abs(player.y - goalY) < 120 && distToGoalSq < Math.pow(canvas.width * 0.7, 2);

                    let passTarget = null;
                    let bestPassTargetDistSq = Infinity;

                    // Szukaj opcji podania (jeśli nie ma dobrego strzału lub losowo)
                     if (!canShoot || Math.random() < 0.5) { // Szukaj podania częściej
                         fieldPlayersAway.forEach(teammate => {
                             if (teammate === player || !teammate) return; // Pomiń siebie i nieistniejących

                             let dxTm = teammate.x - player.x;
                             let dyTm = teammate.y - player.y;
                             let distTmSq = dxTm * dxTm + dyTm * dyTm;

                             // Warunki dobrego podania:
                             // 1. W zasięgu
                             // 2. Teammate jest BARDZIEJ w stronę bramki przeciwnika (teammate.x < player.x)
                             // 3. Jest to najlepszy dotychczas znaleziony cel
                             // 4. Cel nie jest kryty przez przeciwnika (proste sprawdzenie)
                             if (distTmSq < AI_PASS_RANGE_SQ && teammate.x < player.x - PLAYER_RADIUS && distTmSq < bestPassTargetDistSq) {
                                 let targetIsClear = true;
                                 // Sprawdź, czy przeciwnik nie jest zbyt blisko celu podania
                                 fieldPlayers.forEach(opponent => {
                                     if (!opponent) return;
                                     let dxOpp = teammate.x - opponent.x;
                                     let dyOpp = teammate.y - opponent.y;
                                     // Jeśli przeciwnik jest w promieniu ~3 zawodników od celu
                                     if (dxOpp * dxOpp + dyOpp * dyOpp < Math.pow(PLAYER_RADIUS * 3.5, 2)) {
                                         targetIsClear = false;
                                     }
                                 });
                                 // Dodatkowo sprawdź linię podania (bardzo uproszczone)
                                 // TODO: Można dodać bardziej zaawansowane sprawdzanie linii podania

                                 if(targetIsClear) {
                                     passTarget = teammate;
                                     bestPassTargetDistSq = distTmSq;
                                 }
                             }
                         });
                    }


                    // Wykonaj Akcję: Podanie > Strzał > Drybling
                    if (passTarget && Math.random() < 0.75) { // Preferuj podanie, jeśli jest dobra opcja
                        let dxPass = passTarget.x - player.x;
                        let dyPass = passTarget.y - player.y;
                        let passAngle = Math.atan2(dyPass, dxPass) + (Math.random() - 0.5) * AI_PASS_ACCURACY_FACTOR * 2;
                        // Siła podania zależna od dystansu (słabsze na krótszy dystans)
                        let passPower = AI_REACTION_POWER * (0.5 + Math.random() * 0.3) * (1 - Math.sqrt(bestPassTargetDistSq / AI_PASS_RANGE_SQ) * 0.5);
                        ball.vx += Math.cos(passAngle) * passPower;
                        ball.vy += Math.sin(passAngle) * passPower;
                        // Lekki odrzut gracza podającego
                        player.vx -= Math.cos(passAngle) * passPower * 0.03;
                        player.vy -= Math.sin(passAngle) * passPower * 0.03;
                        console.log(`AI Pass from ${index}!`);
                        majorActionTakenThisFrame = true;
                        aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 0.5; // Krótszy cooldown po podaniu
                    }
                    else if (canShoot && Math.random() < 0.65) { // Strzał jako druga opcja
                        let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2;
                        let shootPower = AI_REACTION_POWER * (0.8 + Math.random() * 0.4); // Większa moc strzału
                        ball.vx += Math.cos(shootAngle) * shootPower;
                        ball.vy += Math.sin(shootAngle) * shootPower;
                        // Lekki odrzut strzelca
                        player.vx -= Math.cos(shootAngle) * shootPower * 0.03;
                        player.vy -= Math.sin(shootAngle) * shootPower * 0.03;
                        console.log(`AI Shot from ${index}!`);
                        majorActionTakenThisFrame = true;
                        aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 1.0; // Normalny cooldown po strzale
                    }
                    else { // Drybling jako domyślna akcja z piłką
                        let dribbleAngle = angleToGoal; // Domyślnie w stronę bramki
                        let power = AI_REACTION_POWER * 0.40; // Mniejsza siła dla dryblingu
                        let closestOpponentDistSq = Infinity;
                        let avoidAngle = 0;

                        // Proste unikanie najbliższego przeciwnika
                        fieldPlayers.forEach(opponent => {
                             if (!opponent) return;
                             let dxOpp = opponent.x - player.x;
                             let dyOpp = opponent.y - player.y;
                             let distOppSq = dxOpp * dxOpp + dyOpp * dyOpp;
                             // Jeśli przeciwnik jest blisko (np. promień 5 zawodników)
                             if (distOppSq < Math.pow(PLAYER_RADIUS * 5, 2) && distOppSq < closestOpponentDistSq) {
                                 closestOpponentDistSq = distOppSq;
                                 // Oblicz kąt uniku (prostopadle do linii przeciwnik-gracz)
                                 // Math.sign(...) określa, czy ominąć w lewo czy w prawo względem kierunku na bramkę
                                 avoidAngle = Math.sign(dxOpp * dyToGoal - dyOpp * dxToGoal) * (Math.PI / 4); // Unik o 45 stopni
                             }
                         });
                        dribbleAngle += avoidAngle; // Zmodyfikuj kąt dryblingu

                        // Zastosuj siłę dryblingu (na gracza, bo ma piłkę)
                        player.vx += Math.cos(dribbleAngle) * power * 0.1; // Mniejszy mnożnik, bo siła na gracza
                        player.vy += Math.sin(dribbleAngle) * power * 0.1;
                        // Drybling nie jest "główną" akcją resetującą kolejkę w tej samej klatce
                        // Gracz może kontynuować drybling lub podjąć inną akcję w następnej klatce (jeśli cooldown pozwoli)
                        // console.log(`AI Dribble attempt by ${index}`);
                    }

                } else if (!playerHasBall && distToBallSq < AI_INTERCEPT_RADIUS_SQ) { // Gracz jest aktywny, ale nie ma piłki -> Przechwyt
                    let interceptPower = AI_REACTION_POWER * 0.6 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ));
                    // Poruszaj się w kierunku piłki
                    if (distToBall > 0) { // Unikaj dzielenia przez zero
                        player.vx += (dxToBall / distToBall) * interceptPower * 0.1; // Mniejszy mnożnik siły
                        player.vy += (dyToBall / distToBall) * interceptPower * 0.1;
                         // console.log(`AI Intercept attempt by ${index}!`);
                         majorActionTakenThisFrame = true; // Próba przechwytu to główna akcja
                         aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 0.8; // Ustaw cooldown po próbie przechwytu
                    }
                }

                // Jeśli aktywny gracz wykonał główną akcję, zresetuj go i ustaw cooldown
                 if (majorActionTakenThisFrame) {
                    activeAiPlayerIndex = -1; // Dezaktywuj gracza po akcji
                 } else if (IS_ACTIVE_PLAYER && !playerHasBall) {
                     // Jeśli był aktywny do przechwytu, ale piłka była za daleko / nie udało się
                     // lub jeśli miał dryblować ale nie było jak, pozwól innemu spróbować
                     aiActionCooldown = 0; // Zresetuj cooldown, aby inny gracz mógł być wybrany
                     activeAiPlayerIndex = -1;
                 }
            }

            // --- AKCJE POZYCYJNE (zawsze, ale siła zależy od aktywności i sytuacji) ---
            // Wykonuj tylko jeśli gracz nie wykonał właśnie głównej akcji i nie ma piłki
            if (!playerHasBall && !majorActionTakenThisFrame) {
                let targetX, targetY;
                // Użyj BARDZO małej siły dla nieaktywnych graczy
                let positionPowerScale = IS_ACTIVE_PLAYER ? 0.08 : AI_INACTIVE_POSITION_POWER_SCALE;
                let positionPower = AI_REACTION_POWER * positionPowerScale;

                if (isDefending) { // Pozycjonowanie defensywne - wracaj między piłkę a własną bramkę
                    // Celuj w punkt na linii piłka-bramka, trochę za piłką
                    targetX = ball.x + (ownGoalX - ball.x) * (0.2 + index * 0.08); // Rozmieszczenie graczy
                    targetY = ball.y + (ownGoalY - ball.y) * (0.2 + index * 0.08);
                    // Ogranicz pozycje do własnej połowy i rozsądnych granic Y
                    targetY = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, targetY));
                    targetX = Math.max(canvas.width * 0.5, Math.min(canvas.width - PLAYER_RADIUS, targetX));
                    positionPower *= 0.8; // Wolniej w obronie
                } else { // Pozycjonowanie ofensywne - szukaj wolnego miejsca do przodu
                    // Proste pozycje ofensywne (można ulepszyć)
                    targetX = canvas.width * (0.4 + index * 0.1); // Bliżej środka/połowy przeciwnika
                    targetY = canvas.height * (index % 2 === 0 ? (0.35 + Math.random()*0.1) : (0.65 - Math.random()*0.1)); // Rozrzut na skrzydłach
                    // Jeśli piłka jest daleko, podążaj za nią z dystansu, aby być opcją do podania
                    if (distToBall > 250) {
                         targetX = ball.x + 80; // Lekko za piłką
                         targetY = ball.y + (index % 2 === 0 ? -50 : 50); // Na bokach piłki
                    }
                    // Ogranicz pozycje, by nie wchodzić za bardzo na połowę przeciwnika bez piłki
                    targetX = Math.min(canvas.width * 0.8, targetX);
                }

                let dxToPos = targetX - player.x;
                let dyToPos = targetY - player.y;
                let distToPos = Math.hypot(dxToPos, dyToPos);

                // Ruszaj się tylko jeśli jesteś odpowiednio daleko od celu
                // Nieaktywni ruszają się tylko gdy są dalej od celu
                const minMoveDistance = PLAYER_RADIUS * (IS_ACTIVE_PLAYER ? 1.5 : 4.0);
                if (distToPos > minMoveDistance) {
                     // Proste unikanie kolegów z drużyny
                     fieldPlayersAway.forEach(teammate => {
                         if(teammate === player || !teammate) return;
                         let dxTm = teammate.x - player.x;
                         let dyTm = teammate.y - player.y;
                         // Jeśli kolega jest bardzo blisko, lekko się odsuń
                         if(dxTm*dxTm + dyTm*dyTm < Math.pow(PLAYER_RADIUS*2.5, 2)) {
                             dxToPos -= dxTm * 0.05; // Słabe odpychanie
                             dyToPos -= dyTm * 0.05;
                         }
                     });
                     distToPos = Math.hypot(dxToPos, dyToPos); // Przelicz dystans po unikaniu

                    // Zastosuj siłę pozycjonowania
                    if(distToPos > 0) { // Unikaj dzielenia przez zero
                        player.vx += (dxToPos / distToPos) * positionPower * 0.1; // Mniejszy mnożnik
                        player.vy += (dyToPos / distToPos) * positionPower * 0.1;
                    }
                }
            }

            // Ogranicz maksymalną prędkość graczy AI
            const maxAiSpeed = IS_ACTIVE_PLAYER ? 6.0 : 1.8; // Nieaktywni są BARDZO wolni
            const currentSpeedSq = player.vx * player.vx + player.vy * player.vy;
            if (currentSpeedSq > maxAiSpeed * maxAiSpeed) {
                const currentSpeed = Math.sqrt(currentSpeedSq);
                player.vx = (player.vx / currentSpeed) * maxAiSpeed;
                player.vy = (player.vy / currentSpeed) * maxAiSpeed;
            }
        });
    }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop(timestamp) { // timestamp jest dostarczany przez requestAnimationFrame
        if (!gameAnimating || !ctx || !canvas) return;

        // Czyszczenie canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Rysowanie boiska
        drawField();

        // Aktualizacja pozycji i fizyka
        updatePositions();

        // Sprawdzanie i rozwiązywanie kolizji
        checkCollisions();

        // Ruchy AI
        aiMove();

        // Rysowanie obiektów gry (piłka, gracze)
        drawGameObjects();

        // Poproś o kolejną klatkę
        requestAnimationFrame(gameLoop);
    }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE GRACZY DOMOWYCH) ---
    function getMousePos(canvasElement, evt) {
        const rect = canvasElement.getBoundingClientRect();
        // Przeskaluj współrzędne myszy z rozmiaru CSS do rozmiaru logicznego canvas
        const scaleX = canvasElement.width / rect.width;
        const scaleY = canvasElement.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

     function canvasMouseDown(e) {
         if (!gameAnimating || !canvas) return;
         const mousePos = getMousePos(canvas, e);

         // Sprawdź, czy kliknięto na gracza z pola drużyny domowej
         for (let i = 0; i < fieldPlayers.length; i++) {
             const player = fieldPlayers[i];
             if (!player) continue;
             const dx = mousePos.x - player.x;
             const dy = mousePos.y - player.y;
             if (dx * dx + dy * dy < player.radius * player.radius) {
                 isDragging = true;
                 draggingPlayerIndex = i;
                 dragStartCanvas = { x: mousePos.x, y: mousePos.y }; // Pozycja canvas, nie gracza
                 dragCurrentCanvas = { x: mousePos.x, y: mousePos.y };
                 canvas.style.cursor = 'grabbing'; // Zmień kursor
                 // console.log(`Dragging player ${i} started`);
                 break; // Znaleziono, zakończ pętlę
             }
         }
         // TODO: Można dodać obsługę przeciągania bramkarza, jeśli chcesz
     }

     function canvasMouseMove(e) {
         if (!isDragging || !gameAnimating || !canvas) return;
         dragCurrentCanvas = getMousePos(canvas, e);
         // Rysowanie linii odbywa się w drawPullLine() wywoływanym z gameLoop
     }

     function canvasMouseUp(e) {
         if (!isDragging || draggingPlayerIndex === null || !gameAnimating) return;

         const player = fieldPlayers[draggingPlayerIndex];
         if (!player) {
             isDragging = false;
             draggingPlayerIndex = null;
             canvas.style.cursor = 'default';
             return;
         }

         // Oblicz wektor pociągnięcia (od aktualnej do startowej pozycji myszy)
         let dx = dragCurrentCanvas.x - dragStartCanvas.x;
         let dy = dragCurrentCanvas.y - dragStartCanvas.y;
         let pullLength = Math.hypot(dx, dy);

         // Ogranicz siłę
         if (pullLength > MAX_PULL_LENGTH) {
             dx = (dx / pullLength) * MAX_PULL_LENGTH;
             dy = (dy / pullLength) * MAX_PULL_LENGTH;
             pullLength = MAX_PULL_LENGTH;
         }

         // Zastosuj impuls w kierunku przeciwnym do pociągnięcia
         // Siła impulsu skalowana przez długość pociągnięcia
         const impulseScale = DRAG_IMPULSE_SCALE * (pullLength / MAX_PULL_LENGTH);
         player.vx -= dx * impulseScale;
         player.vy -= dy * impulseScale;

         // console.log(`Applied impulse to player ${draggingPlayerIndex}: vx=${player.vx.toFixed(2)}, vy=${player.vy.toFixed(2)}`);

         // Zresetuj stan przeciągania
         isDragging = false;
         draggingPlayerIndex = null;
         canvas.style.cursor = 'default'; // Przywróć domyślny kursor
     }

     function canvasMouseLeave(e) {
         // Jeśli mysz opuści canvas podczas przeciągania, anuluj (lub zakończ jak przy mouseup)
         if (isDragging) {
             // Można potraktować to jak mouseup w ostatniej znanej pozycji
             canvasMouseUp(e);
             // Alternatywnie: całkowicie anuluj
             // isDragging = false;
             // draggingPlayerIndex = null;
             // canvas.style.cursor = 'default';
             // console.log("Dragging cancelled due to mouse leave");
         }
     }

     function addCanvasEvents() {
         if (!canvas) return;
         // Usuń stare listenery, jeśli istnieją (na wszelki wypadek)
         // canvas.removeEventListener('mousedown', canvasMouseDown);
         // canvas.removeEventListener('mousemove', canvasMouseMove);
         // canvas.removeEventListener('mouseup', canvasMouseUp);
         // canvas.removeEventListener('mouseleave', canvasMouseLeave);

         // Dodaj nowe listenery
         canvas.addEventListener('mousedown', canvasMouseDown);
         canvas.addEventListener('mousemove', canvasMouseMove);
         canvas.addEventListener('mouseup', canvasMouseUp);
         canvas.addEventListener('mouseleave', canvasMouseLeave); // Ważne dla anulowania przeciągania
     }

    // --- WYBÓR DRUŻYN / STADIONU ---
    function populateTeamSelections() {
        if (!homeTeamSelect || !awayTeamSelect) return;
        // Wyczyść poprzednie opcje (oprócz pierwszej "-- Wybierz --")
        homeTeamSelect.length = 1;
        awayTeamSelect.length = 1;

        for (const teamName in teamsData) {
            const optionHome = document.createElement('option');
            optionHome.value = teamName;
            optionHome.textContent = teamName;
            homeTeamSelect.appendChild(optionHome);

            const optionAway = document.createElement('option');
            optionAway.value = teamName;
            optionAway.textContent = teamName;
            awayTeamSelect.appendChild(optionAway);
        }
    }

    function populateStadiumSelection() {
        if (!stadiumSelectionContainer) return;
        stadiumSelectionContainer.innerHTML = ''; // Wyczyść poprzednie stadiony

        stadiumsData.forEach(stadium => {
            const button = document.createElement('button');
            button.textContent = stadium.name;
            button.dataset.stadiumName = stadium.name; // Przechowaj nazwę w data atrybucie
            button.classList.add('stadium-option-btn'); // Dodaj klasę do stylizacji

            // Podświetl wybrany stadion, jeśli już jest
            if (selectedStadium === stadium.name) {
                button.classList.add('selected');
            }

            button.addEventListener('click', () => {
                selectedStadium = stadium.name;
                console.log("Wybrano stadion:", selectedStadium);
                // Zaktualizuj wygląd przycisków (usuń 'selected' z innych, dodaj do tego)
                 const allBtns = stadiumSelectionContainer.querySelectorAll('.stadium-option-btn');
                 allBtns.forEach(btn => btn.classList.remove('selected'));
                 button.classList.add('selected');
                 // Opcjonalnie: Pokaż podgląd stadionu gdzieś
            });
            stadiumSelectionContainer.appendChild(button);
        });
    }

    // --- FUNKCJE USTAWIEŃ ---
    function applyFontSize(size) {
        const root = document.documentElement; // Dostęp do <html>
        switch (size) {
            case 'small': root.style.fontSize = '14px'; break;
            case 'medium': root.style.fontSize = '16px'; break; // Domyślny
            case 'large': root.style.fontSize = '18px'; break;
            default: root.style.fontSize = '16px';
        }
        localStorage.setItem('fontSize', size); // Zapisz wybór
        console.log("Zmieniono rozmiar czcionki na:", size);
    }

    function loadFontSize() {
        const savedSize = localStorage.getItem('fontSize') || 'medium'; // Wczytaj zapisany lub użyj domyślnego
        applyFontSize(savedSize);
    }

     // --- FUNKCJE POMOCNICZE MODALI (DODANE) ---
      function openModal(modalElement) {
          console.log("Otwieram modal:", modalElement ? modalElement.id : 'nieznany');
          if (modalElement) {
              modalElement.classList.add('active'); // Używamy klasy CSS do pokazywania
          } else {
              console.error("Próba otwarcia nieistniejącego modala!");
          }
      }
      function closeModal(modalElement) {
           console.log("Zamykam modal:", modalElement ? modalElement.id : 'nieznany');
           if (modalElement) {
               modalElement.classList.remove('active'); // Używamy klasy CSS do ukrywania
               // Specjalna obsługa dla gameScreen, który nie jest modalem
               if (modalElement.id === 'gameScreen') {
                   modalElement.style.display = 'none';
               }
           } else {
               console.error("Próba zamknięcia nieistniejącego modala!");
           }
      }

    // --- SKALOWANIE CANVAS ---
     function resizeCanvas() {
         if (!canvas) return;
         const gameContainer = document.getElementById('gameContainer'); // Użyj kontenera
         if (!gameContainer) return;

         const canvasLogicalWidth = 640;
         const canvasLogicalHeight = 400;
         const aspectRatio = canvasLogicalWidth / canvasLogicalHeight;

         // Dostępna szerokość to szerokość kontenera
         const availableWidth = gameContainer.clientWidth;

         // Oblicz wysokość na podstawie szerokości i proporcji
         let newHeight = availableWidth / aspectRatio;

         // Ustaw styl CSS canvas (rozmiar wizualny)
         // Szerokość canvas zawsze 100% kontenera
         canvas.style.width = `100%`;
         // Wysokość auto, przeglądarka sama obliczy na podstawie aspect-ratio z CSS
         canvas.style.height = `auto`;

         // Logiczne wymiary pozostają bez zmian
         canvas.width = canvasLogicalWidth;
         canvas.height = canvasLogicalHeight;

         console.log(`Canvas resized: CSS ${availableWidth}x${newHeight.toFixed(0)} (approx), Logical ${canvas.width}x${canvas.height}`);
     }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         console.log("DOM załadowany. Inicjalizacja MiniSoccer v4...");

         // Pobierz referencje do elementów UI
         startScreen = document.getElementById("startScreen");
         teamSelectScreen = document.getElementById("teamSelectScreen");
         stadiumSelectScreen = document.getElementById("stadiumSelectScreen");
         gameScreen = document.getElementById("gameScreen");
         playerDBModal = document.getElementById("playerDBModal");
         languageModal = document.getElementById("languageModal");
         settingsModal = document.getElementById("settingsModal");
         backgroundMusic = document.getElementById("backgroundMusic");
         homeTeamSelect = document.getElementById("homeTeamSelect");
         awayTeamSelect = document.getElementById("awayTeamSelect");
         stadiumSelectionContainer = document.getElementById("stadiumSelectionContainer");
         scoreboardElement = document.getElementById("scoreboard");
         timerElement = document.getElementById("matchTimer");
         canvas = document.getElementById("gameCanvas"); // Pobierz też canvas tutaj

         // Sprawdź czy kluczowe elementy istnieją
         if (!startScreen || !teamSelectScreen || !stadiumSelectScreen || !gameScreen || !canvas) {
             console.error("Krytyczny błąd: Brakuje podstawowych elementów UI lub canvas!");
             alert("Wystąpił błąd podczas ładowania gry. Sprawdź konsolę deweloperską (F12).");
             return; // Przerwij inicjalizację
         }

         loadFontSize(); // Załaduj ustawienia czcionki
         window.addEventListener('resize', resizeCanvas); // Dodaj listener do zmiany rozmiaru okna

         // Ustawienie początkowego tła dla startScreen
         if (startScreen) {
            startScreen.classList.add('start-screen-background');
         }

         // Referencje do przycisków (bezpieczniejsze niż pobieranie globalne)
         const startMatchBtn = document.getElementById("startMatchBtn");
         const goToStadiumSelectBtn = document.getElementById("goToStadiumSelectBtn");
         const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn");
         const backToStartBtn = document.getElementById("backToStartBtn");
         const backToMenuFromSelect = document.getElementById("backToMenuFromSelect");
         const backToTeamSelectBtn = document.getElementById("backToTeamSelectBtn");
         const btnPlayerDB = document.getElementById("btnPlayerDB");
         const btnLanguage = document.getElementById("btnLanguage");
         const btnSettings = document.getElementById("btnSettings");
         const closePlayerDBBtn = document.getElementById("closePlayerDBBtn");
         const closeLanguageModalBtn = document.getElementById("closeLanguageModalBtn");
         const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");
         const addPlayerForm = document.getElementById("addPlayerForm"); // Formularz (placeholder)
         const langOptions = document.querySelectorAll(".langOption"); // Przyciski języka (placeholder)
         const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); // Przyciski rozmiaru czcionki

         // --- Listenery Nawigacji ---
         if (startMatchBtn) {
            startMatchBtn.addEventListener("click", () => {
                console.log("Kliknięto 'Rozpocznij Mecz'");
                if(startScreen) startScreen.classList.remove('start-screen-background');
                closeModal(startScreen);
                openModal(teamSelectScreen);
                try {
                    populateTeamSelections(); // Wypełnij selecty drużyn
                } catch (error) {
                    console.error("Błąd podczas wypełniania wyboru drużyn:", error);
                }
            });
         } else { console.error("Nie znaleziono przycisku #startMatchBtn"); }

         if (backToMenuFromSelect) {
            backToMenuFromSelect.addEventListener("click", () => {
                closeModal(teamSelectScreen);
                openModal(startScreen);
                if(startScreen) startScreen.classList.add('start-screen-background');
            });
         } else { console.error("Nie znaleziono przycisku #backToMenuFromSelect"); }

         if (goToStadiumSelectBtn) {
            goToStadiumSelectBtn.addEventListener("click", () => {
                // Pobierz aktualne wybory z selectów
                selectedHomeTeam = homeTeamSelect ? homeTeamSelect.value : null;
                selectedAwayTeam = awayTeamSelect ? awayTeamSelect.value : null;

                if (!selectedHomeTeam || !selectedAwayTeam) {
                    alert("Wybierz obie drużyny!"); return;
                }
                if (selectedHomeTeam === selectedAwayTeam) {
                    alert("Drużyny muszą być różne!"); return;
                }
                closeModal(teamSelectScreen);
                openModal(stadiumSelectScreen);
                populateStadiumSelection(); // Wypełnij wybór stadionów
            });
         } else { console.error("Nie znaleziono przycisku #goToStadiumSelectBtn"); }

         if (backToTeamSelectBtn) {
             backToTeamSelectBtn.addEventListener("click", () => {
                 closeModal(stadiumSelectScreen);
                 openModal(teamSelectScreen);
             });
         } else { console.error("Nie znaleziono przycisku #backToTeamSelectBtn"); }

         if (startMatchFromStadiumBtn) {
             startMatchFromStadiumBtn.addEventListener("click", () => {
                 if (!selectedStadium) {
                     alert("Wybierz stadion!"); return;
                 }
                 console.log("Rozpoczynanie meczu...");

                 // Ustaw tło stadionu
                 const stadiumData = stadiumsData.find(s => s.name === selectedStadium);
                 if (stadiumData && stadiumData.image) {
                     document.body.style.backgroundImage = `url('${stadiumData.image}')`;
                     document.body.classList.add('game-active-background');
                 } else { // Brak obrazka lub nie znaleziono stadionu
                     document.body.style.backgroundImage = ''; // Usuń tło
                     document.body.classList.remove('game-active-background');
                     // Można ustawić domyślny kolor tła dla gry tutaj, jeśli nie ma obrazka
                 }

                 closeModal(stadiumSelectScreen);
                 // Pokaż ekran gry (nie jako modal, ale ustawiając display)
                 if (gameScreen) gameScreen.style.display = 'block';
                 else { console.error("Nie można pokazać gameScreen!"); return; }

                 initGame(); // Zainicjuj obiekty gry, pozycje itd.
                 addCanvasEvents(); // Dodaj obsługę myszy do canvas
                 resizeCanvas(); // Upewnij się, że rozmiar jest poprawny
                 startTimer(); // Uruchom zegar meczu
                 playBackgroundMusic(); // Zacznij odtwarzać muzykę

                 gameAnimating = true; // Uruchom pętlę gry
                 requestAnimationFrame(gameLoop);
             });
         } else { console.error("Nie znaleziono przycisku #startMatchFromStadiumBtn"); }

         if (backToStartBtn) {
             backToStartBtn.addEventListener("click", () => {
                 console.log("Powrót do menu głównego...");
                 gameAnimating = false; // Zatrzymaj pętlę gry
                 stopTimer(); // Zatrzymaj zegar
                 stopBackgroundMusic(); // Zatrzymaj muzykę

                 document.body.classList.remove('game-active-background'); // Usuń klasę tła gry
                 document.body.style.backgroundImage = ''; // Usuń ew. obrazek tła

                 // Ukryj ekran gry
                 if (gameScreen) gameScreen.style.display = 'none';

                 openModal(startScreen); // Pokaż ekran startowy
                 if(startScreen) startScreen.classList.add('start-screen-background'); // Przywróć tło startowe

                 resetGameFull(); // Zresetuj cały stan gry (wynik, drużyny etc.)
             });
         } else { console.error("Nie znaleziono przycisku #backToStartBtn"); }

         // --- Listenery Modali (Ustawienia, Baza Graczy, Język) ---
         if (btnSettings) btnSettings.addEventListener('click', () => openModal(settingsModal));
         else console.error("Nie znaleziono przycisku #btnSettings");
         if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', () => closeModal(settingsModal));
         else console.error("Nie znaleziono przycisku #closeSettingsModalBtn");

         if (btnPlayerDB) btnPlayerDB.addEventListener('click', () => openModal(playerDBModal));
         else console.error("Nie znaleziono przycisku #btnPlayerDB");
         if (closePlayerDBBtn) closePlayerDBBtn.addEventListener('click', () => closeModal(playerDBModal));
         else console.error("Nie znaleziono przycisku #closePlayerDBBtn");

         if (btnLanguage) btnLanguage.addEventListener('click', () => openModal(languageModal));
         else console.error("Nie znaleziono przycisku #btnLanguage");
         if (closeLanguageModalBtn) closeLanguageModalBtn.addEventListener('click', () => closeModal(languageModal));
         else console.error("Nie znaleziono przycisku #closeLanguageModalBtn");

         // --- Listenery Ustawień ---
         fontSizeOptions.forEach(button => {
             button.addEventListener('click', (e) => {
                 const size = e.target.dataset.size;
                 if (size) applyFontSize(size);
             });
         });

         // Listenery dla placeholderów (np. formularz graczy, wybór języka)
         if (addPlayerForm) {
             addPlayerForm.addEventListener('submit', (e) => {
                 e.preventDefault(); // Zapobiegaj przeładowaniu strony
                 alert("Dodawanie graczy - funkcjonalność do zaimplementowania.");
             });
         }
         langOptions.forEach(button => {
            button.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                alert(`Zmiana języka na ${lang} - funkcjonalność do zaimplementowania.`);
                // Tutaj przyszła logika zmiany języka
                closeModal(languageModal);
            });
         });

         console.log("MiniSoccer - Inicjalizacja zakończona (v4 + poprawki).");
         resizeCanvas(); // Ustaw początkowy rozmiar canvas
     });

})(); // Koniec IIFE

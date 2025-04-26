// ========================================================================
// PEŁNY KOD script.js (WERSJA v5: Ligi, Loga, Tło Murawy, Poprawki)
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
    let stadiumImage = null; // Zmienna do przechowywania załadowanego obrazu stadionu

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

    // --- BAZA DANYCH KLUBÓW v2 (Ligi, Loga, Kolory) ---
    // Użyłem poprawionych linków do logo z Wikipedii Commons/SVG dla lepszej jakości
    const teamsData = {
        "Premier League": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
            teams: [
                { name: "Manchester United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg", color1: "#DA291C", color2: "#FBE122" },
                { name: "Manchester City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg", color1: "#6CABDD", color2: "#FFFFFF" },
                { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", color1: "#C8102E", color2: "#FFFFFF" },
                { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg", color1: "#034694", color2: "#FFFFFF" },
                { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", color1: "#EF0107", color2: "#FFFFFF" },
                { name: "Tottenham Hotspur", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg", color1: "#132257", color2: "#FFFFFF" }
            ]
        },
        "La Liga": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/9/90/LaLiga.svg",
            teams: [
                { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", color1: "#FFFFFF", color2: "#FEBE10" },
                { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg", color1: "#A50044", color2: "#004D98" },
                { name: "Atletico Madrid", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Atletico_Madrid_2017_logo.svg", color1: "#CB3524", color2: "#FFFFFF" },
                { name: "Sevilla", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg", color1: "#D41B2C", color2: "#FFFFFF" },
                { name: "Valencia", logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valencia_CF_logo.svg", color1: "#F77F00", color2: "#000000" },
                { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg", color1: "#FBEC5D", color2: "#0055A4" }
            ]
        },
        "Serie A": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg",
            teams: [
                { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg", color1: "#FFFFFF", color2: "#000000" },
                { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg", color1: "#0068A8", color2: "#000000" },
                { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg", color1: "#FB090B", color2: "#000000" },
                { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg", color1: "#12A0D7", color2: "#FFFFFF" },
                { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg", color1: "#8E1F2F", color2: "#F0BC42" },
                { name: "Lazio", logo: "https://upload.wikimedia.org/wikipedia/en/e/e4/SS_Lazio_badge.svg", color1: "#87D8F7", color2: "#FFFFFF" }
            ]
        },
        "Bundesliga": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg",
            teams: [
                { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg", color1: "#DC052D", color2: "#FFFFFF" },
                { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg", color1: "#FDE100", color2: "#000000" },
                { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg", color1: "#E60026", color2: "#002F65" },
                { name: "Bayer Leverkusen", logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg", color1: "#E32221", color2: "#000000" },
                { name: "Eintracht Frankfurt", logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg", color1: "#E1000F", color2: "#000000" },
                { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg", color1: "#00B55E", color2: "#FFFFFF" }
            ]
        },
        "Ligue 1": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Ligue1_Uber_Eats_logo.svg",
            teams: [
                { name: "Paris Saint-Germain", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg", color1: "#004170", color2: "#DA291C" },
                { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg", color1: "#1794D4", color2: "#FFFFFF" },
                { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/1/1c/Olympique_Lyonnais_logo.svg", color1: "#DA291C", color2: "#004170" },
                { name: "Monaco", logo: "https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg", color1: "#ED1C24", color2: "#FFFFFF" },
                { name: "Lille", logo: "https://upload.wikimedia.org/wikipedia/en/9/9f/Lille_OSC_logo.svg", color1: "#E01E29", color2: "#004170" },
                { name: "Nice", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/OGC_Nice_logo.svg", color1: "#E21E26", color2: "#000000" }
            ]
        }
    };

    // Zaktualizowana funkcja do pobierania koloru - przeszukuje wszystkie ligi
    function getTeamColor(teamName) {
        for (const leagueName in teamsData) {
            const league = teamsData[leagueName];
            const foundTeam = league.teams.find(team => team.name === teamName);
            if (foundTeam && foundTeam.color1) {
                return foundTeam.color1;
            }
        }
        console.warn(`Nie znaleziono koloru dla drużyny: ${teamName}. Używam domyślnego.`);
        return '#808080'; // Domyślny szary, jeśli nie znaleziono
    }

    // --- Stadium Data (PRZYKŁAD - DODAJ WIĘCEJ) ---
    // Upewnij się, że ścieżka do obrazka jest poprawna względem pliku index.html
    const stadiumsData = [
        { name: "Anfield", image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png" },
        { name: "Generic Stadium", image: "" } // Stadion bez obrazka (będą pasy)
        // { name: "Camp Nou", image: "sciezka/do/camp_nou.jpg" }, // Przykład
    ];

    // --- FUNKCJE MUZYKI ---
     function playBackgroundMusic() {
         if (backgroundMusic) {
             // Sprawdź, czy kontekst audio został już zainicjowany (np. przez wcześniejszą interakcję)
             // Czasami wymagane jest wznowienie kontekstu audio po bezczynności
             const audioCtx = window.AudioContext || window.webkitAudioContext;
             if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
             }

             backgroundMusic.play().catch(error => {
                 console.warn("Nie można automatycznie odtworzyć muzyki - może być wymagana interakcja użytkownika.", error);
                 // W konsoli często pojawia się błąd typu NotAllowedError
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
         else console.warn("Nie znaleziono elementu #matchTimer do aktualizacji");
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

         const homeName = selectedHomeTeam || "Gospodarze";
         const awayName = selectedAwayTeam || "Goście";
         // Użyj setTimeout, aby alert nie blokował natychmiastowego przejścia
         setTimeout(() => {
             alert("Koniec meczu! Wynik: " + homeName + " " + score.home + " : " + score.away + " " + awayName);
         }, 100); // Krótkie opóźnienie

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
         stadiumImage = null; // !!! Zresetuj załadowany obraz stadionu
         score = {home: 0, away: 0};
         fieldPlayers = [];
         fieldPlayersAway = [];
         goalkeeper = null;
         goalkeeperAway = null;
         ball = null;
         document.body.style.backgroundImage = ''; // Usuń tło body (na wszelki wypadek)
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
         } else {
             console.warn("Nie znaleziono elementu #scoreboard do aktualizacji");
         }
     }

    // --- INICJALIZACJA GRY ---
     function initGame() {
         canvas = document.getElementById("gameCanvas");
         if (!canvas) { console.error("Nie znaleziono elementu canvas w initGame!"); return; }
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

         // Początkowe pozycje graczy
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

         score.home = 0;
         score.away = 0;
         updateScoreboard(); // Zaktualizuj tablicę wyników na starcie

         console.log(`Match initialized: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`);
     }

     function resetPositionsAfterGoal(homeJustScored) {
         if (!canvas || !ball) return;

         // Resetuj piłkę na środek
         ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.vx = 0; ball.vy = 0;

         // Resetuj pozycje graczy i bramkarzy do stanu początkowego
         let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC';
         fieldPlayers = [
             { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
             { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }
         ];
         fieldPlayersAway = [
             { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
             { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }
         ];
         goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };
         goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor };

         aiActionCooldown = 0; activeAiPlayerIndex = -1; // Resetuj stan AI

         // Wstrzymaj grę na chwilę i wznów
         gameAnimating = false;
         // Narysuj stan po resecie od razu
         if (ctx) {
             ctx.clearRect(0, 0, canvas.width, canvas.height); drawField(); drawGameObjects();
         }
         setTimeout(() => {
             gameAnimating = true; requestAnimationFrame(gameLoop);
         }, 1500); // Pauza 1.5 sekundy
     }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() {
         if (!ctx || !canvas) return;

         // --- Tło boiska ---
         if (stadiumImage && stadiumImage.complete && stadiumImage.naturalHeight !== 0) {
             try {
                 const pattern = ctx.createPattern(stadiumImage, 'repeat');
                 if (pattern) { // Sprawdź czy wzór został utworzony
                     ctx.fillStyle = pattern;
                     ctx.fillRect(0, 0, canvas.width, canvas.height);
                 } else {
                      console.warn("Nie udało się utworzyć wzoru tła, rysuję domyślne.");
                      drawDefaultPitchBackground();
                 }
             } catch (e) {
                 console.error("Błąd podczas tworzenia/używania wzoru tła:", e);
                 drawDefaultPitchBackground();
             }
         } else {
             drawDefaultPitchBackground(); // Rysuj pasy, jeśli nie ma obrazu
         }

         // --- Linie boiska --- (rysowane NA tle)
         ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; ctx.lineWidth = 2;
         // Linia środkowa
         ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
         // Koło środkowe
         ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2); ctx.stroke();
         // Bramki (słupki)
         const goalWidth = 8; const goalHeight = 90; ctx.fillStyle = "#d0d0d0";
         ctx.fillRect(0, canvas.height / 2 - goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); ctx.fillRect(0, canvas.height / 2 + goalHeight / 2 - goalWidth/2, goalWidth, goalWidth);
         ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 - goalHeight / 2 - goalWidth/2, goalWidth, goalWidth); ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 + goalHeight / 2 - goalWidth/2, goalWidth, goalWidth);
         // Pola karne
         const penaltyBoxWidth = 80; const penaltyBoxHeight = 180;
         ctx.strokeRect(0, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
         ctx.strokeRect(canvas.width - penaltyBoxWidth, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
     }

     // Funkcja pomocnicza do rysowania domyślnego tła w pasy
     function drawDefaultPitchBackground() {
          if (!ctx || !canvas) return;
          const stripeWidth = 40; // Szerokość pasa
          const lightGreen = "#6b9f6b";
          const darkGreen = "#5a8a5a";

          for (let x = 0; x < canvas.width; x += stripeWidth) {
              ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? lightGreen : darkGreen;
              ctx.fillRect(x, 0, stripeWidth, canvas.height);
          }
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
         fieldPlayers.forEach(p => { if(p) drawCircle(p); }); // Dodano sprawdzenie if(p)
         fieldPlayersAway.forEach(p => { if(p) drawCircle(p); }); // Dodano sprawdzenie if(p)

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

         if (pullLength > MAX_PULL_LENGTH) {
             dx = (dx / pullLength) * MAX_PULL_LENGTH; dy = (dy / pullLength) * MAX_PULL_LENGTH; pullLength = MAX_PULL_LENGTH;
         }

         const startX = player.x; const startY = player.y;
         const endX = player.x - dx; const endY = player.y - dy; // Kierunek przeciwny

         const strengthRatio = pullLength / MAX_PULL_LENGTH;
         const red = Math.floor(255 * strengthRatio); const green = Math.floor(255 * (1 - strengthRatio));
         ctx.strokeStyle = `rgb(${red}, ${green}, 0)`;
         ctx.lineWidth = 2 + 3 * strengthRatio;

         ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
         drawArrowhead(ctx, startX, startY, endX, endY, 10 + 5 * strengthRatio);
     }

      function drawArrowhead(context, fromx, fromy, tox, toy, headLength) {
         const dx = tox - fromx; const dy = toy - fromy; const angle = Math.atan2(dy, dx);
         context.beginPath(); context.moveTo(tox, toy);
         context.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6));
         context.moveTo(tox, toy);
         context.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6));
         context.stroke();
     }


    // --- FUNKCJE FIZYKI I KOLIZJI ---
     function applyFriction(obj, frictionValue) {
        if (!obj) return;
        obj.vx *= frictionValue; obj.vy *= frictionValue;
        if (Math.abs(obj.vx) < 0.05) obj.vx = 0; if (Math.abs(obj.vy) < 0.05) obj.vy = 0;
     }

     function updatePositions() {
         if (!canvas) return;
         const allObjects = [ball, goalkeeper, goalkeeperAway, ...fieldPlayers, ...fieldPlayersAway];

         allObjects.forEach(obj => {
             if (!obj) return;
             obj.x += obj.vx; obj.y += obj.vy;
             if (obj === ball) applyFriction(obj, FRICTION); else applyFriction(obj, PLAYER_FRICTION);

             // Kolizje ze ścianami poziomymi
             if (obj.y - obj.radius < 0) { obj.y = obj.radius; obj.vy *= -COLLISION_RESTITUTION; }
             else if (obj.y + obj.radius > canvas.height) { obj.y = canvas.height - obj.radius; obj.vy *= -COLLISION_RESTITUTION; }

             // Kolizje ze ścianami pionowymi (tylko gracze/GK)
             if (obj !== ball) {
                 if (obj.x - obj.radius < 0) { obj.x = obj.radius; obj.vx *= -PLAYER_COLLISION_RESTITUTION; }
                 else if (obj.x + obj.radius > canvas.width) { obj.x = canvas.width - obj.radius; obj.vx *= -PLAYER_COLLISION_RESTITUTION; }
             }
         });

         if (goalkeeper) confineGoalkeeper(goalkeeper, true); if (goalkeeperAway) confineGoalkeeper(goalkeeperAway, false);
         checkGoal();
     }

     function confineGoalkeeper(gk, isHomeTeam) {
         if (!gk || !canvas) return;
         const goalLineX = isHomeTeam ? 0 : canvas.width; const maxDistX = 100;
         const goalPostYTop = canvas.height / 2 - 45; const goalPostYBottom = canvas.height / 2 + 45;
         gk.y = Math.max(goalPostYTop + gk.radius, Math.min(goalPostYBottom - gk.radius, gk.y));
         if (isHomeTeam) gk.x = Math.max(gk.radius, Math.min(maxDistX, gk.x));
         else gk.x = Math.max(canvas.width - maxDistX, Math.min(canvas.width - gk.radius, gk.x));
     }

     function checkGoal() {
         if (!ball || !canvas) return;
         const goalLineLeft = 5; const goalLineRight = canvas.width - 5;
         const goalPostYTop = canvas.height / 2 - 45; const goalPostYBottom = canvas.height / 2 + 45;
         const isBetweenPosts = ball.y > goalPostYTop && ball.y < goalPostYBottom;

         if (isBetweenPosts) {
             if (ball.x - ball.radius < goalLineLeft) { score.away++; updateScoreboard(); resetPositionsAfterGoal(false); } // Gol gości
             else if (ball.x + ball.radius > goalLineRight) { score.home++; updateScoreboard(); resetPositionsAfterGoal(true); } // Gol gospodarzy
         }
     }

     function circleCollision(c1, c2) {
         if (!c1 || !c2) return false;
         const dx = c2.x - c1.x; const dy = c2.y - c1.y; const distSq = dx * dx + dy * dy;
         const minDist = c1.radius + c2.radius; return distSq < minDist * minDist;
     }

     function resolveCollision(obj1, obj2) {
         if (!obj1 || !obj2) return;
         let dx = obj2.x - obj1.x; let dy = obj2.y - obj1.y; let distance = Math.hypot(dx, dy);
         const minDist = obj1.radius + obj2.radius; if (distance === 0) { dx=0.1; dy=0; distance = 0.1; } // Unikaj dzielenia przez zero

         const overlap = minDist - distance;
         if (overlap > 0) {
             const adjustX = (dx / distance) * overlap * 0.5; const adjustY = (dy / distance) * overlap * 0.5;
             obj1.x -= adjustX; obj1.y -= adjustY; obj2.x += adjustX; obj2.y += adjustY;
             // Przelicz wektor po rozsunięciu
             dx = obj2.x - obj1.x; dy = obj2.y - obj1.y; distance = Math.hypot(dx, dy); if (distance === 0) distance = 0.1;
         }

         const normalX = dx / distance; const normalY = dy / distance;
         const v1n = obj1.vx * normalX + obj1.vy * normalY; const v2n = obj2.vx * normalX + obj2.vy * normalY;
         let restitution = (obj1 !== ball && obj2 !== ball) ? PLAYER_COLLISION_RESTITUTION : COLLISION_RESTITUTION;
         const new_v1n = v2n; const new_v2n = v1n; // Prosta wymiana pędu (uproszczenie)
         const impulse1 = (new_v1n - v1n) * restitution; const impulse2 = (new_v2n - v2n) * restitution;
         obj1.vx += impulse1 * normalX; obj1.vy += impulse1 * normalY;
         obj2.vx += impulse2 * normalX; obj2.vy += impulse2 * normalY;

         // Wzmocnienie piłki
         if (obj1 === ball && obj2 !== ball) { obj1.vx *= BALL_COLLISION_BOOST; obj1.vy *= BALL_COLLISION_BOOST; }
         else if (obj2 === ball && obj1 !== ball) { obj2.vx *= BALL_COLLISION_BOOST; obj2.vy *= BALL_COLLISION_BOOST; }
     }

     function checkCollisions() {
         const allPlayers = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway];
         const dynamicObjects = [ball, ...allPlayers].filter(obj => obj); // Filtruj null/undefined

         for (let i = 0; i < dynamicObjects.length; i++) {
             for (let j = i + 1; j < dynamicObjects.length; j++) {
                 if (circleCollision(dynamicObjects[i], dynamicObjects[j])) {
                     resolveCollision(dynamicObjects[i], dynamicObjects[j]);
                 }
             }
         }
     }

    // --- SZTUCZNA INTELIGENCJA (AI) - KOLEJKA v2 ---
    // Logika AI pozostaje bez zmian względem poprzedniej wersji
    function aiMove() {
        if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return;
        const goalX = 10; const goalY = canvas.height / 2; const ownGoalX = canvas.width - 10; const ownGoalY = canvas.height / 2;
        const isDefending = ball.x > canvas.width * AI_DEFENSIVE_LINE;

        // --- AI Bramkarza ---
        if (goalkeeperAway) {
             goalkeeperAway.vx *= 0.8; goalkeeperAway.vy *= 0.8; if (ball.x > canvas.width * 0.6) { let dyGK = ball.y - goalkeeperAway.y; if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) { goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.12; } let dxGK = ball.x - goalkeeperAway.x; if(ball.x > canvas.width * 0.75 && Math.abs(dxGK) > GOALKEEPER_RADIUS) { goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.08; } } else { let dyToCenter = ownGoalY - goalkeeperAway.y; if (Math.abs(dyToCenter) > 5) { goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.06; } let dxToDefaultPos = (canvas.width - 40) - goalkeeperAway.x; if (Math.abs(dxToDefaultPos) > 5) { goalkeeperAway.vx += Math.sign(dxToDefaultPos) * AI_GOALKEEPER_SPEED * 0.04; } } goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx)); goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy));
        }

        // --- Logika Kolejki AI ---
        let canPerformMajorAction = false; if (aiActionCooldown > 0) { aiActionCooldown--; } else { canPerformMajorAction = true; activeAiPlayerIndex = -1; let playerWithBall = null; let closestPlayerIndex = -1; let minDistSqToBall = Infinity; fieldPlayersAway.forEach((player, index) => { if (!player) return; let dxB = ball.x - player.x; let dyB = ball.y - player.y; let distSqB = dxB * dxB + dyB * dyB; if (distSqB < Math.pow(player.radius + ball.radius + 5, 2)) { playerWithBall = player; activeAiPlayerIndex = index; } if (distSqB < minDistSqToBall) { minDistSqToBall = distSqB; closestPlayerIndex = index; } }); if (activeAiPlayerIndex === -1 && closestPlayerIndex !== -1 && minDistSqToBall < AI_INTERCEPT_RADIUS_SQ) { activeAiPlayerIndex = closestPlayerIndex; } }

        // --- AI Graczy z Pola - Akcje Indywidualne ---
        fieldPlayersAway.forEach((player, index) => { if (!player) return; const IS_ACTIVE_PLAYER = (index === activeAiPlayerIndex); let majorActionTakenThisFrame = false; let dxToBall = ball.x - player.x; let dyToBall = ball.y - player.y; let distToBall = Math.hypot(dxToBall, dyToBall); let distToBallSq = distToBall * distToBall; let playerHasBall = distToBallSq < Math.pow(player.radius + ball.radius + 5, 2);
            // --- GŁÓWNA AKCJA ---
            if (IS_ACTIVE_PLAYER && canPerformMajorAction) { if (playerHasBall) { let dxToGoal = goalX - player.x; let dyToGoal = goalY - player.y; let angleToGoal = Math.atan2(dyToGoal, dxToGoal); let distToGoalSq = dxToGoal * dxToGoal + dyToGoal * dyToGoal; let canShoot = player.x > canvas.width * 0.4 && Math.abs(player.y - goalY) < 120 && distToGoalSq < Math.pow(canvas.width * 0.7, 2); let passTarget = null; let bestPassTargetDistSq = Infinity; if (!canShoot || Math.random() < 0.5) { fieldPlayersAway.forEach(teammate => { if (teammate === player || !teammate) return; let dxTm = teammate.x - player.x; let dyTm = teammate.y - player.y; let distTmSq = dxTm * dxTm + dyTm * dyTm; if (distTmSq < AI_PASS_RANGE_SQ && teammate.x < player.x - PLAYER_RADIUS && distTmSq < bestPassTargetDistSq) { let targetIsClear = true; fieldPlayers.forEach(opponent => { if (!opponent) return; let dxOpp = teammate.x - opponent.x; let dyOpp = teammate.y - opponent.y; if (dxOpp * dxOpp + dyOpp * dyOpp < Math.pow(PLAYER_RADIUS * 3.5, 2)) { targetIsClear = false; } }); if(targetIsClear) { passTarget = teammate; bestPassTargetDistSq = distTmSq; } } }); } if (passTarget && Math.random() < 0.75) { let dxPass = passTarget.x - player.x; let dyPass = passTarget.y - player.y; let passAngle = Math.atan2(dyPass, dxPass) + (Math.random() - 0.5) * AI_PASS_ACCURACY_FACTOR * 2; let passPower = AI_REACTION_POWER * (0.5 + Math.random() * 0.3) * (1 - Math.sqrt(bestPassTargetDistSq / AI_PASS_RANGE_SQ) * 0.5); ball.vx += Math.cos(passAngle) * passPower; ball.vy += Math.sin(passAngle) * passPower; player.vx -= Math.cos(passAngle) * passPower * 0.03; player.vy -= Math.sin(passAngle) * passPower * 0.03; console.log(`AI Pass from ${index}!`); majorActionTakenThisFrame = true; aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 0.5; } else if (canShoot && Math.random() < 0.65) { let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2; let shootPower = AI_REACTION_POWER * (0.8 + Math.random() * 0.4); ball.vx += Math.cos(shootAngle) * shootPower; ball.vy += Math.sin(shootAngle) * shootPower; player.vx -= Math.cos(shootAngle) * shootPower * 0.03; player.vy -= Math.sin(shootAngle) * shootPower * 0.03; console.log(`AI Shot from ${index}!`); majorActionTakenThisFrame = true; aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 1.0; } else { let dribbleAngle = angleToGoal; let power = AI_REACTION_POWER * 0.40; let closestOpponentDistSq = Infinity; let avoidAngle = 0; fieldPlayers.forEach(opponent => { if (!opponent) return; let dxOpp = opponent.x - player.x; let dyOpp = opponent.y - player.y; let distOppSq = dxOpp * dxOpp + dyOpp * dyOpp; if (distOppSq < Math.pow(PLAYER_RADIUS * 5, 2) && distOppSq < closestOpponentDistSq) { closestOpponentDistSq = distOppSq; avoidAngle = Math.sign(dxOpp * dyToGoal - dyOpp * dxToGoal) * (Math.PI / 4); } }); dribbleAngle += avoidAngle; player.vx += Math.cos(dribbleAngle) * power * 0.1; player.vy += Math.sin(dribbleAngle) * power * 0.1; } } else if (!playerHasBall && distToBallSq < AI_INTERCEPT_RADIUS_SQ) { let interceptPower = AI_REACTION_POWER * 0.6 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ)); if (distToBall > 0) { player.vx += (dxToBall / distToBall) * interceptPower * 0.1; player.vy += (dyToBall / distToBall) * interceptPower * 0.1; majorActionTakenThisFrame = true; aiActionCooldown = AI_ACTION_COOLDOWN_FRAMES * 0.8; } } if (majorActionTakenThisFrame) { activeAiPlayerIndex = -1; } else if (IS_ACTIVE_PLAYER && !playerHasBall) { aiActionCooldown = 0; activeAiPlayerIndex = -1; } }
            // --- AKCJE POZYCYJNE ---
            if (!playerHasBall && !majorActionTakenThisFrame) { let targetX, targetY; let positionPowerScale = IS_ACTIVE_PLAYER ? 0.08 : AI_INACTIVE_POSITION_POWER_SCALE; let positionPower = AI_REACTION_POWER * positionPowerScale; if (isDefending) { targetX = ball.x + (ownGoalX - ball.x) * (0.2 + index * 0.08); targetY = ball.y + (ownGoalY - ball.y) * (0.2 + index * 0.08); targetY = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, targetY)); targetX = Math.max(canvas.width * 0.5, Math.min(canvas.width - PLAYER_RADIUS, targetX)); positionPower *= 0.8; } else { targetX = canvas.width * (0.4 + index * 0.1); targetY = canvas.height * (index % 2 === 0 ? (0.35 + Math.random()*0.1) : (0.65 - Math.random()*0.1)); if (distToBall > 250) { targetX = ball.x + 80; targetY = ball.y + (index % 2 === 0 ? -50 : 50); } targetX = Math.min(canvas.width * 0.8, targetX); } let dxToPos = targetX - player.x; let dyToPos = targetY - player.y; let distToPos = Math.hypot(dxToPos, dyToPos); const minMoveDistance = PLAYER_RADIUS * (IS_ACTIVE_PLAYER ? 1.5 : 4.0); if (distToPos > minMoveDistance) { fieldPlayersAway.forEach(teammate => { if(teammate === player || !teammate) return; let dxTm = teammate.x - player.x; let dyTm = teammate.y - player.y; if(dxTm*dxTm + dyTm*dyTm < Math.pow(PLAYER_RADIUS*2.5, 2)) { dxToPos -= dxTm * 0.05; dyToPos -= dyTm * 0.05;} }); distToPos = Math.hypot(dxToPos, dyToPos); if(distToPos > 0) { player.vx += (dxToPos / distToPos) * positionPower * 0.1; player.vy += (dyToPos / distToPos) * positionPower * 0.1; } } }
            // Ogranicz prędkość
            const maxAiSpeed = IS_ACTIVE_PLAYER ? 6.0 : 1.8; const currentSpeedSq = player.vx * player.vx + player.vy * player.vy; if (currentSpeedSq > maxAiSpeed * maxAiSpeed) { const currentSpeed = Math.sqrt(currentSpeedSq); player.vx = (player.vx / currentSpeed) * maxAiSpeed; player.vy = (player.vy / currentSpeed) * maxAiSpeed; }
        });
    }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop(timestamp) {
        if (!gameAnimating || !ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Czyść przed rysowaniem
        drawField();         // Rysuj tło i linie
        updatePositions();   // Aktualizuj fizykę
        checkCollisions();   // Sprawdź kolizje
        aiMove();            // Ruch AI
        drawGameObjects();   // Rysuj piłkę, graczy
        requestAnimationFrame(gameLoop); // Następna klatka
    }

    // --- OBSŁUGA MYSZY ---
    function getMousePos(canvasElement, evt) {
        const rect = canvasElement.getBoundingClientRect(); const scaleX = canvasElement.width / rect.width; const scaleY = canvasElement.height / rect.height;
        return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
    }
     function canvasMouseDown(e) { if (!gameAnimating || !canvas) return; const mousePos = getMousePos(canvas, e); for (let i = 0; i < fieldPlayers.length; i++) { const player = fieldPlayers[i]; if (!player) continue; const dx = mousePos.x - player.x; const dy = mousePos.y - player.y; if (dx * dx + dy * dy < player.radius * player.radius) { isDragging = true; draggingPlayerIndex = i; dragStartCanvas = { x: mousePos.x, y: mousePos.y }; dragCurrentCanvas = { x: mousePos.x, y: mousePos.y }; canvas.style.cursor = 'grabbing'; break; } } }
     function canvasMouseMove(e) { if (!isDragging || !gameAnimating || !canvas) return; dragCurrentCanvas = getMousePos(canvas, e); }
     function canvasMouseUp(e) { if (!isDragging || draggingPlayerIndex === null || !gameAnimating) return; const player = fieldPlayers[draggingPlayerIndex]; if (!player) { isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'default'; return; } let dx = dragCurrentCanvas.x - dragStartCanvas.x; let dy = dragCurrentCanvas.y - dragStartCanvas.y; let pullLength = Math.hypot(dx, dy); if (pullLength > MAX_PULL_LENGTH) { dx = (dx / pullLength) * MAX_PULL_LENGTH; dy = (dy / pullLength) * MAX_PULL_LENGTH; pullLength = MAX_PULL_LENGTH; } const impulseScale = DRAG_IMPULSE_SCALE * (pullLength / MAX_PULL_LENGTH); player.vx -= dx * impulseScale; player.vy -= dy * impulseScale; isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'default'; }
     function canvasMouseLeave(e) { if (isDragging) { canvasMouseUp(e); } } // Zakończ przeciąganie przy opuszczeniu
     function addCanvasEvents() { if (!canvas) return; canvas.addEventListener('mousedown', canvasMouseDown); canvas.addEventListener('mousemove', canvasMouseMove); canvas.addEventListener('mouseup', canvasMouseUp); canvas.addEventListener('mouseleave', canvasMouseLeave); }

    // --- WYBÓR DRUŻYN / STADIONU ---
    function populateTeamSelections() {
        if (!homeTeamSelect || !awayTeamSelect) { console.error("Selecty drużyn nie znalezione!"); return; }
        homeTeamSelect.innerHTML = '<option value="">-- Wybierz --</option>'; awayTeamSelect.innerHTML = '<option value="">-- Wybierz --</option>';
        for (const leagueName in teamsData) { const league = teamsData[leagueName]; const optGroupHome = document.createElement('optgroup'); optGroupHome.label = leagueName; const optGroupAway = document.createElement('optgroup'); optGroupAway.label = leagueName; league.teams.forEach(team => { const optionHome = document.createElement('option'); optionHome.value = team.name; optionHome.textContent = team.name; optGroupHome.appendChild(optionHome); const optionAway = document.createElement('option'); optionAway.value = team.name; optionAway.textContent = team.name; optGroupAway.appendChild(optionAway); }); homeTeamSelect.appendChild(optGroupHome); awayTeamSelect.appendChild(optGroupAway); }
    }
    function populateStadiumSelection() {
        if (!stadiumSelectionContainer) { console.error("Kontener stadionów nie znaleziony!"); return; }
        stadiumSelectionContainer.innerHTML = '';
        stadiumsData.forEach(stadium => { const button = document.createElement('button'); button.textContent = stadium.name; button.dataset.stadiumName = stadium.name; button.classList.add('stadium-option-btn'); if (selectedStadium === stadium.name) { button.classList.add('selected'); } button.addEventListener('click', () => { selectedStadium = stadium.name; console.log("Wybrano stadion:", selectedStadium); const allBtns = stadiumSelectionContainer.querySelectorAll('.stadium-option-btn'); allBtns.forEach(btn => btn.classList.remove('selected')); button.classList.add('selected'); }); stadiumSelectionContainer.appendChild(button); });
    }

    // --- FUNKCJE USTAWIEŃ ---
    function applyFontSize(size) { const root = document.documentElement; switch (size) { case 'small': root.style.fontSize = '14px'; break; case 'medium': root.style.fontSize = '16px'; break; case 'large': root.style.fontSize = '18px'; break; default: root.style.fontSize = '16px'; } localStorage.setItem('fontSize', size); console.log("Zmieniono rozmiar czcionki na:", size); }
    function loadFontSize() { const savedSize = localStorage.getItem('fontSize') || 'medium'; applyFontSize(savedSize); }

     // --- FUNKCJE POMOCNICZE MODALI ---
      function openModal(modalElement) { /* console.log("Otwieram modal:", modalElement ? modalElement.id : 'nieznany'); */ if (modalElement) { modalElement.classList.add('active'); } else { console.error("Próba otwarcia nieistniejącego modala!"); } }
      function closeModal(modalElement) { /* console.log("Zamykam modal:", modalElement ? modalElement.id : 'nieznany'); */ if (modalElement) { modalElement.classList.remove('active'); if (modalElement.id === 'gameScreen') { modalElement.style.display = 'none'; } } else { console.error("Próba zamknięcia nieistniejącego modala!"); } }

    // --- SKALOWANIE CANVAS ---
     function resizeCanvas() {
         if (!canvas) return; const gameContainer = document.getElementById('gameContainer'); if (!gameContainer) return; const canvasLogicalWidth = 640; const canvasLogicalHeight = 400; const aspectRatio = canvasLogicalWidth / canvasLogicalHeight; const availableWidth = gameContainer.clientWidth; let newHeight = availableWidth / aspectRatio; canvas.style.width = `100%`; canvas.style.height = `auto`; canvas.width = canvasLogicalWidth; canvas.height = canvasLogicalHeight; /* console.log(`Canvas resized: CSS ${availableWidth}x${newHeight.toFixed(0)}, Logical ${canvas.width}x${canvas.height}`); */
     }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         console.log("DOM załadowany. Inicjalizacja MiniSoccer v5...");

         // Pobierz referencje do kluczowych elementów
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
         canvas = document.getElementById("gameCanvas");

         // === KRYTYCZNE SPRAWDZENIE ISTNIENIA ELEMENTÓW ===
         const essentialElements = { startScreen, teamSelectScreen, stadiumSelectScreen, gameScreen, canvas, homeTeamSelect, awayTeamSelect, stadiumSelectionContainer, scoreboardElement, timerElement, backgroundMusic };
         let missingElement = false;
         for (const key in essentialElements) {
             if (!essentialElements[key]) {
                 console.error(`Krytyczny błąd: Nie znaleziono elementu o ID: #${key} (lub powiązanego) w pliku HTML!`);
                 missingElement = true;
             }
         }
         if (missingElement) {
              alert("Wystąpił krytyczny błąd podczas ładowania gry. Niektóre elementy interfejsu nie zostały znalezione. Sprawdź, czy plik HTML jest poprawny i kompletny.");
              return; // Przerwij dalszą inicjalizację
         }
         // === KONIEC SPRAWDZENIA ===


         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         if (startScreen) startScreen.classList.add('start-screen-background');

         // Referencje do przycisków
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
         const addPlayerForm = document.getElementById("addPlayerForm");
         const langOptions = document.querySelectorAll(".langOption");
         const fontSizeOptions = document.querySelectorAll('.fontSizeOption');

         // --- Listenery Nawigacji ---
         if (startMatchBtn) { startMatchBtn.addEventListener("click", () => { if(startScreen) startScreen.classList.remove('start-screen-background'); closeModal(startScreen); openModal(teamSelectScreen); try { populateTeamSelections(); } catch (error) { console.error("Błąd w populateTeamSelections:", error); } }); } else { console.error("Nie znaleziono przycisku #startMatchBtn"); }
         if (backToMenuFromSelect) { backToMenuFromSelect.addEventListener("click", () => { closeModal(teamSelectScreen); openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); }); } else { console.error("Nie znaleziono przycisku #backToMenuFromSelect"); }
         if (goToStadiumSelectBtn) { goToStadiumSelectBtn.addEventListener("click", () => { selectedHomeTeam = homeTeamSelect ? homeTeamSelect.value : null; selectedAwayTeam = awayTeamSelect ? awayTeamSelect.value : null; if (!selectedHomeTeam || !selectedAwayTeam) { alert("Wybierz obie drużyny!"); return; } if (selectedHomeTeam === selectedAwayTeam) { alert("Drużyny muszą być różne!"); return; } closeModal(teamSelectScreen); openModal(stadiumSelectScreen); populateStadiumSelection(); }); } else { console.error("Nie znaleziono przycisku #goToStadiumSelectBtn"); }
         if (backToTeamSelectBtn) { backToTeamSelectBtn.addEventListener("click", () => { closeModal(stadiumSelectScreen); openModal(teamSelectScreen); }); } else { console.error("Nie znaleziono przycisku #backToTeamSelectBtn"); }

         // ZMODYFIKOWANY Listener dla 'startMatchFromStadiumBtn' - Ładowanie Obrazu
         if (startMatchFromStadiumBtn) {
             startMatchFromStadiumBtn.addEventListener("click", () => {
                 if (!selectedStadium) { alert("Wybierz stadion!"); return; } console.log("Rozpoczynanie meczu...");
                 const stadiumData = stadiumsData.find(s => s.name === selectedStadium); const imagePath = stadiumData ? stadiumData.image : null;
                 const startGameLogic = () => { closeModal(stadiumSelectScreen); if (gameScreen) { gameScreen.style.display = 'block'; } else { console.error("Nie można pokazać gameScreen!"); return; } initGame(); addCanvasEvents(); resizeCanvas(); startTimer(); playBackgroundMusic(); gameAnimating = true; requestAnimationFrame(gameLoop); };
                 stadiumImage = null; document.body.style.backgroundImage = ''; document.body.classList.remove('game-active-background');
                 if (imagePath) { console.log("Ładowanie obrazu stadionu:", imagePath); stadiumImage = new Image(); stadiumImage.onload = () => { console.log("Obraz stadionu załadowany."); startGameLogic(); }; stadiumImage.onerror = () => { console.error("Błąd ładowania obrazu stadionu:", imagePath); stadiumImage = null; startGameLogic(); }; stadiumImage.src = imagePath; } else { console.log("Brak obrazu stadionu, używanie domyślnego tła."); startGameLogic(); }
             });
         } else { console.error("Nie znaleziono przycisku #startMatchFromStadiumBtn"); }

         if (backToStartBtn) { backToStartBtn.addEventListener("click", () => { console.log("Powrót do menu głównego..."); gameAnimating = false; stopTimer(); stopBackgroundMusic(); document.body.classList.remove('game-active-background'); document.body.style.backgroundImage = ''; if (gameScreen) gameScreen.style.display = 'none'; openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); resetGameFull(); }); } else { console.error("Nie znaleziono przycisku #backToStartBtn"); }

         // --- Listenery Modali ---
         if (btnSettings && settingsModal) btnSettings.addEventListener('click', () => openModal(settingsModal)); else console.warn("Brak przycisku ustawień lub modala");
         if (closeSettingsModalBtn && settingsModal) closeSettingsModalBtn.addEventListener('click', () => closeModal(settingsModal)); else console.warn("Brak przycisku zamknięcia ustawień lub modala");
         if (btnPlayerDB && playerDBModal) btnPlayerDB.addEventListener('click', () => openModal(playerDBModal)); else console.warn("Brak przycisku bazy graczy lub modala");
         if (closePlayerDBBtn && playerDBModal) closePlayerDBBtn.addEventListener('click', () => closeModal(playerDBModal)); else console.warn("Brak przycisku zamknięcia bazy graczy lub modala");
         if (btnLanguage && languageModal) btnLanguage.addEventListener('click', () => openModal(languageModal)); else console.warn("Brak przycisku języka lub modala");
         if (closeLanguageModalBtn && languageModal) closeLanguageModalBtn.addEventListener('click', () => closeModal(languageModal)); else console.warn("Brak przycisku zamknięcia języka lub modala");

         // --- Listenery Ustawień ---
         fontSizeOptions.forEach(button => { button.addEventListener('click', (e) => { const size = e.target.dataset.size; if (size) applyFontSize(size); }); });

         // Placeholdery
         if (addPlayerForm) { addPlayerForm.addEventListener('submit', (e) => { e.preventDefault(); alert("Dodawanie graczy - funkcjonalność do zaimplementowania."); }); }
         langOptions.forEach(button => { button.addEventListener('click', (e) => { const lang = e.target.dataset.lang; alert(`Zmiana języka na ${lang} - funkcjonalność do zaimplementowania.`); if(languageModal) closeModal(languageModal); }); });

         console.log("MiniSoccer - Inicjalizacja zakończona (v5).");
         resizeCanvas(); // Ustaw początkowy rozmiar canvas
     });

})(); // Koniec IIFE

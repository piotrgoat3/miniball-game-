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

    // Stałe fizyki i gry (bez zmian)
    const PLAYER_RADIUS = 15; const GOALKEEPER_RADIUS = 17; const BALL_RADIUS = 7;
    const FRICTION = 0.97; const PLAYER_FRICTION = 0.95; const DRAG_IMPULSE_SCALE = 0.18;
    const MAX_PULL_LENGTH = 160; const COLLISION_RESTITUTION = 0.5; const PLAYER_COLLISION_RESTITUTION = 0.3;
    const BALL_COLLISION_BOOST = 1.1; const AI_REACTION_POWER = 19; const AI_GOALKEEPER_SPEED = 2.1;
    const AI_INTERCEPT_RADIUS_SQ = Math.pow(PLAYER_RADIUS + BALL_RADIUS + 70, 2);
    const AI_PASS_ACCURACY_FACTOR = 0.15; const AI_SHOT_ACCURACY_FACTOR = 0.16;
    const AI_PASS_RANGE_SQ = Math.pow(250, 2); const AI_DEFENSIVE_LINE = 0.6;
    const MATCH_DURATION = 180; // sekundy
    let matchTime = MATCH_DURATION; let matchTimerInterval = null;

    // AI "KOLEJKA" (bez zmian)
    let aiActionCooldown = 0;
    const AI_ACTION_COOLDOWN_FRAMES = 20;
    let activeAiPlayerIndex = -1;
    const AI_INACTIVE_POSITION_POWER_SCALE = 0.005;

    // Elementy UI i Audio - Pobierane w DOMContentLoaded
    let startScreen, teamSelectScreen, stadiumSelectScreen, gameScreen,
        playerDBModal, languageModal, settingsModal, backgroundMusic;
    let homeTeamSelect, awayTeamSelect, stadiumSelectionContainer, scoreboardElement, timerElement;

    // --- BAZA DANYCH KLUBÓW v2 (Ligi, Loga, Kolory) ---
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
                { name: "Atletico Madrid", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Atletico_Madrid_2017_logo.svg", color1: "#CB3524", color2: "#FFFFFF" }, // Poprawione logo
                { name: "Sevilla", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg", color1: "#D41B2C", color2: "#FFFFFF" }, // Poprawione logo
                { name: "Valencia", logo: "https://upload.wikimedia.org/wikipedia/en/c/ce/Valencia_CF_logo.svg", color1: "#F77F00", color2: "#000000" }, // Poprawione logo + kolor
                { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg", color1: "#FBEC5D", color2: "#0055A4" } // Poprawione logo
            ]
        },
        "Serie A": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg",
            teams: [
                { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg", color1: "#FFFFFF", color2: "#000000" }, // Poprawione logo
                { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg", color1: "#0068A8", color2: "#000000" },
                { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg", color1: "#FB090B", color2: "#000000" },
                { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg", color1: "#12A0D7", color2: "#FFFFFF" },
                { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg", color1: "#8E1F2F", color2: "#F0BC42" }, // Poprawione logo
                { name: "Lazio", logo: "https://upload.wikimedia.org/wikipedia/en/e/e4/SS_Lazio_badge.svg", color1: "#87D8F7", color2: "#FFFFFF" } // Poprawione logo
            ]
        },
        "Bundesliga": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg", // Poprawiony link
            teams: [
                { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg", color1: "#DC052D", color2: "#FFFFFF" },
                { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg", color1: "#FDE100", color2: "#000000" }, // Poprawione logo
                { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg", color1: "#E60026", color2: "#002F65" },
                { name: "Bayer Leverkusen", logo: "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg", color1: "#E32221", color2: "#000000" }, // Poprawione logo
                { name: "Eintracht Frankfurt", logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg", color1: "#E1000F", color2: "#000000" }, // Poprawione logo
                { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/8/81/Borussia_M%C3%B6nchengladbach_logo.svg", color1: "#00B55E", color2: "#FFFFFF" }
            ]
        },
        "Ligue 1": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Ligue1_Uber_Eats_logo.svg", // Poprawiony link
            teams: [
                { name: "Paris Saint-Germain", logo: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg", color1: "#004170", color2: "#DA291C" }, // Poprawione logo
                { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg", color1: "#1794D4", color2: "#FFFFFF" }, // Poprawiony kolor
                { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/1/1c/Olympique_Lyonnais_logo.svg", color1: "#DA291C", color2: "#004170" }, // Poprawiony kolor
                { name: "Monaco", logo: "https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg", color1: "#ED1C24", color2: "#FFFFFF" }, // Poprawione logo
                { name: "Lille", logo: "https://upload.wikimedia.org/wikipedia/en/9/9f/Lille_OSC_logo.svg", color1: "#E01E29", color2: "#004170" }, // Poprawione logo
                { name: "Nice", logo: "https://upload.wikimedia.org/wikipedia/en/f/f1/OGC_Nice_logo.svg", color1: "#E21E26", color2: "#000000" } // Poprawione logo
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
        return '#808080'; // Domyślny szary, jeśli nie znaleziono
    }

    // --- FUNKCJE MUZYKI --- (bez zmian)
     function playBackgroundMusic() { /* ... jak poprzednio ... */ }
     function stopBackgroundMusic() { /* ... jak poprzednio ... */ }

     // --- FUNKCJE TIMERA, RESETU --- (bez zmian w logice, tylko dodanie resetu stadiumImage)
     function updateTimerDisplay() { /* ... jak poprzednio ... */ }
     function startTimer() { /* ... jak poprzednio ... */ }
     function stopTimer() { /* ... jak poprzednio ... */ }
     function gameOver() { /* ... jak poprzednio ... */ }

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
         document.body.style.backgroundImage = ''; // Usuń tło body
         document.body.classList.remove('game-active-background');
         aiActionCooldown = 0;
         activeAiPlayerIndex = -1;
         stopBackgroundMusic();
         if (homeTeamSelect) homeTeamSelect.value = "";
         if (awayTeamSelect) awayTeamSelect.value = "";
         if (stadiumSelectionContainer) stadiumSelectionContainer.innerHTML = '';
         updateScoreboard();
     }
     function updateScoreboard() { /* ... jak poprzednio ... */ }

    // --- INICJALIZACJA GRY --- (bez zmian)
     function initGame() { /* ... jak poprzednio ... */ }
     function resetPositionsAfterGoal(homeJustScored) { /* ... jak poprzednio ... */ }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() {
         if (!ctx || !canvas) return;

         // --- Tło boiska ---
         if (stadiumImage && stadiumImage.complete && stadiumImage.naturalHeight !== 0) {
             // 1. Jeśli mamy załadowany obraz stadionu, użyj go jako wzoru
             try { // Dodaj try-catch na wszelki wypadek
                 const pattern = ctx.createPattern(stadiumImage, 'repeat'); // 'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
                 ctx.fillStyle = pattern;
                 ctx.fillRect(0, 0, canvas.width, canvas.height);
             } catch (e) {
                 console.error("Błąd podczas tworzenia wzoru tła:", e);
                 // W razie błędu narysuj domyślne tło
                 drawDefaultPitchBackground();
             }
         } else {
             // 2. Jeśli nie ma obrazu, narysuj domyślne tło (pasy)
             drawDefaultPitchBackground();
         }

         // --- Linie boiska --- (rysowane NA tle)
         ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
         ctx.lineWidth = 2;
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

     function drawCircle(obj) { /* ... jak poprzednio ... */ }
     function drawGameObjects() { /* ... jak poprzednio ... */ }
     function drawPullLine() { /* ... jak poprzednio ... */ }
     function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { /* ... jak poprzednio ... */ }


    // --- FUNKCJE FIZYKI I KOLIZJI --- (bez zmian)
     function applyFriction(obj, frictionValue) { /* ... jak poprzednio ... */ }
     function updatePositions() { /* ... jak poprzednio ... */ }
     function confineGoalkeeper(gk, isHomeTeam) { /* ... jak poprzednio ... */ }
     function checkGoal() { /* ... jak poprzednio ... */ }
     function circleCollision(c1, c2) { /* ... jak poprzednio ... */ }
     function resolveCollision(obj1, obj2) { /* ... jak poprzednio ... */ }
     function checkCollisions() { /* ... jak poprzednio ... */ }

    // --- SZTUCZNA INTELIGENCJA (AI) --- (bez zmian)
    function aiMove() { /* ... jak poprzednio ... */ }


    // --- PĘTLA GŁÓWNA GRY --- (bez zmian)
    function gameLoop(timestamp) { /* ... jak poprzednio ... */ }

    // --- OBSŁUGA MYSZY --- (bez zmian)
    function getMousePos(canvasElement, evt) { /* ... jak poprzednio ... */ }
     function canvasMouseDown(e) { /* ... jak poprzednio ... */ }
     function canvasMouseMove(e) { /* ... jak poprzednio ... */ }
     function canvasMouseUp(e) { /* ... jak poprzednio ... */ }
     function canvasMouseLeave(e) { /* ... jak poprzednio ... */ }
     function addCanvasEvents() { /* ... jak poprzednio ... */ }

    // --- WYBÓR DRUŻYN / STADIONU ---
    // Zaktualizowana funkcja do wypełniania selectów z podziałem na ligi
    function populateTeamSelections() {
        if (!homeTeamSelect || !awayTeamSelect) return;

        // Wyczyść poprzednie opcje (oprócz pierwszej "-- Wybierz --")
        homeTeamSelect.innerHTML = '<option value="">-- Wybierz --</option>';
        awayTeamSelect.innerHTML = '<option value="">-- Wybierz --</option>';

        // Iteruj przez ligi
        for (const leagueName in teamsData) {
            const league = teamsData[leagueName];

            // Stwórz <optgroup> dla każdej ligi
            const optGroupHome = document.createElement('optgroup');
            optGroupHome.label = leagueName;
            const optGroupAway = document.createElement('optgroup');
            optGroupAway.label = leagueName;

            // Iteruj przez drużyny w lidze
            league.teams.forEach(team => {
                const optionHome = document.createElement('option');
                optionHome.value = team.name;
                optionHome.textContent = team.name;
                // Można dodać logo jako data-* atrybut, jeśli chcesz wyświetlić
                // optionHome.dataset.logo = team.logo;
                optGroupHome.appendChild(optionHome);

                const optionAway = document.createElement('option');
                optionAway.value = team.name;
                optionAway.textContent = team.name;
                // optionAway.dataset.logo = team.logo;
                optGroupAway.appendChild(optionAway);
            });

            // Dodaj grupy do selectów
            homeTeamSelect.appendChild(optGroupHome);
            awayTeamSelect.appendChild(optGroupAway);
        }
    }

    function populateStadiumSelection() { /* ... jak poprzednio ... */ }

    // --- FUNKCJE USTAWIEŃ --- (bez zmian)
    function applyFontSize(size) { /* ... jak poprzednio ... */ }
    function loadFontSize() { /* ... jak poprzednio ... */ }

     // --- FUNKCJE POMOCNICZE MODALI --- (bez zmian)
      function openModal(modalElement) { /* ... jak poprzednio ... */ }
      function closeModal(modalElement) { /* ... jak poprzednio ... */ }

    // --- SKALOWANIE CANVAS --- (bez zmian)
     function resizeCanvas() { /* ... jak poprzednio ... */ }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         console.log("DOM załadowany. Inicjalizacja MiniSoccer v5...");

         // Pobierz referencje do elementów UI (bez zmian)
         startScreen = document.getElementById("startScreen");
         teamSelectScreen = document.getElementById("teamSelectScreen");
         // ... (reszta pobierania elementów jak poprzednio) ...
         homeTeamSelect = document.getElementById("homeTeamSelect");
         awayTeamSelect = document.getElementById("awayTeamSelect");
         // ... itd ...
         canvas = document.getElementById("gameCanvas"); // Pobierz też canvas tutaj

         if (!startScreen || !teamSelectScreen || !stadiumSelectScreen || !gameScreen || !canvas || !homeTeamSelect || !awayTeamSelect) {
             console.error("Krytyczny błąd: Brakuje podstawowych elementów UI, canvas lub selectów drużyn!");
             alert("Wystąpił błąd podczas ładowania gry. Sprawdź konsolę deweloperską (F12).");
             return;
         }

         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         if (startScreen) startScreen.classList.add('start-screen-background');

         // Referencje do przycisków (bez zmian)
         const startMatchBtn = document.getElementById("startMatchBtn");
         // ... (reszta przycisków jak poprzednio) ...
         const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn");
         // ... itd ...

         // --- Listenery Nawigacji ---
         if (startMatchBtn) {
            startMatchBtn.addEventListener("click", () => {
                console.log("Kliknięto 'Rozpocznij Mecz'");
                if(startScreen) startScreen.classList.remove('start-screen-background');
                closeModal(startScreen);
                openModal(teamSelectScreen);
                try {
                    populateTeamSelections(); // Używa nowej funkcji z grupami
                } catch (error) {
                    console.error("Błąd podczas wypełniania wyboru drużyn:", error);
                }
            });
         } else { console.error("Nie znaleziono przycisku #startMatchBtn"); }

         // ... (reszta listenerów jak poprzednio) ...

         // ZMODYFIKOWANY Listener dla 'startMatchFromStadiumBtn' - Ładowanie Obrazu
         if (startMatchFromStadiumBtn) {
             startMatchFromStadiumBtn.addEventListener("click", () => {
                 if (!selectedStadium) {
                     alert("Wybierz stadion!"); return;
                 }
                 console.log("Rozpoczynanie meczu...");

                 const stadiumData = stadiumsData.find(s => s.name === selectedStadium);
                 const imagePath = stadiumData ? stadiumData.image : null;

                 // Funkcja do uruchomienia gry po załadowaniu obrazu lub od razu
                 const startGameLogic = () => {
                     closeModal(stadiumSelectScreen);
                     if (gameScreen) gameScreen.style.display = 'block';
                     else { console.error("Nie można pokazać gameScreen!"); return; }

                     initGame();
                     addCanvasEvents();
                     resizeCanvas();
                     startTimer();
                     playBackgroundMusic();

                     gameAnimating = true;
                     requestAnimationFrame(gameLoop);
                 };

                 // Resetuj poprzedni obraz
                 stadiumImage = null;
                 document.body.style.backgroundImage = ''; // Usuń tło body na start
                 document.body.classList.remove('game-active-background');

                 if (imagePath) {
                     console.log("Ładowanie obrazu stadionu:", imagePath);
                     stadiumImage = new Image();
                     stadiumImage.onload = () => {
                         console.log("Obraz stadionu załadowany.");
                         // Ustaw tło wzorkiem na canvas (zrobione w drawField)
                         // Możesz opcjonalnie ustawić tło body, jeśli chcesz efekt za boiskiem
                         // document.body.style.backgroundImage = `url('${imagePath}')`;
                         // document.body.classList.add('game-active-background');
                         startGameLogic(); // Uruchom grę po załadowaniu obrazu
                     };
                     stadiumImage.onerror = () => {
                         console.error("Błąd ładowania obrazu stadionu:", imagePath);
                         stadiumImage = null; // Resetuj obraz w razie błędu
                         startGameLogic(); // Uruchom grę z domyślnym tłem
                     };
                     stadiumImage.src = imagePath;
                 } else {
                     console.log("Brak obrazu stadionu, używanie domyślnego tła.");
                     startGameLogic(); // Uruchom grę od razu z domyślnym tłem
                 }
             });
         } else { console.error("Nie znaleziono przycisku #startMatchFromStadiumBtn"); }

         // ... (reszta listenerów jak poprzednio) ...

         console.log("MiniSoccer - Inicjalizacja zakończona (v5).");
         resizeCanvas();
     });

})(); // Koniec IIFE

// ========================================================================
// PEŁNY KOD script.js (WERSJA z SZARYM BOISKIEM NA CANVASIE - jak na zrzucie)
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
    const teamsData = { "Premier League": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg", teams: [ { name: "Manchester United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" }, { name: "Manchester City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" }, { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" }, { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" }, { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" }, { name: "Tottenham Hotspur", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" } ] }, "La Liga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/9/90/LaLiga.svg", teams: [ { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" }, { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" }, { name: "Atletico Madrid", logo: "https://brandlogos.net/wp-content/uploads/2021/09/atltico-madrid-logo.png" }, { name: "Sevilla", logo: "https://cdn.freebiesupply.com/logos/large/2x/sevilla-fc-logo-png-transparent.png" }, { name: "Valencia", logo: "https://brandlogos.net/wp-content/uploads/2014/10/valencia_cf-logo_brandlogos.net_iaffl-512x674.png" }, { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/1200px-Villarreal_CF_logo-en.svg.png" } ] }, "Serie A": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg", teams: [ { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Juventus_Logo.png" }, { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" }, { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/653px-Logo_of_AC_Milan.svg.png" }, { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Neapel.svg/1200px-SSC_Neapel.svg.png" }, { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/sco/7/7d/AS_Roma%27s_logo_from_2017.png" }, { name: "Lazio", logo: "https://static.cdnlogo.com/logos/s/89/ss-lazio.png" } ] }, "Bundesliga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo_(2017).svg", teams: [ { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2017).svg/2048px-FC_Bayern_M%C3%BCnchen_logo_(2017).svg.png" }, { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Borussia_Dortmund.png" }, { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/1200px-RB_Leipzig_2014_logo.svg.png" }, { name: "Bayer Leverkusen", logo: "https://cdn.freebiesupply.com/logos/large/2x/bayer-leverkusen-logo-png-transparent.png" }, { name: "Eintracht Frankfurt", logo: "https://logodownload.org/wp-content/uploads/2019/11/eintracht-frankfurt-logo.png" }, { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/1200px-Borussia_M%C3%B6nchengladbach_logo.svg.png" } ] }, "Ligue 1": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Ligue_1.svg", teams: [ { name: "Paris Saint-Germain", logo: "https://logos-world.net/wp-content/uploads/2020/07/PSG-Logo.png" }, { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/1582px-Olympique_Marseille_logo.svg.png" }, { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Olympique_Lyonnais_logo.svg/1200px-Olympique_Lyonnais_logo.svg.png" }, { name: "Monaco", logo: "https://logodownload.org/wp-content/uploads/2019/09/monaco-fc-logo-1.png" }, { name: "Lille", logo: "https://logodownload.org/wp-content/uploads/2019/09/lille-logo-1.png" }, { name: "Nice", logo: "https://1000logos.net/wp-content/uploads/2020/09/Nice-logo.png" } ] } };
    function getTeamColor(teamName) {
        switch(teamName) {
            // Premier League
            case "Manchester United": return "#DA291C"; // Czerwony
            case "Manchester City": return "#6CABDD"; // Błękitny
            case "Liverpool": return "#C8102E"; // Czerwony
            case "Chelsea": return "#034694"; // Niebieski
            case "Arsenal": return "#EF0107"; // Czerwony
            case "Tottenham Hotspur": return "#FFFFFF"; // Biały (Może być trudny do zobaczenia, alternatywa: #132257 - Navy)

            // La Liga
            case "Real Madrid": return "#FFFFFF"; // Biały (Alternatywa: #FEBE10 - Złoty)
            case "Barcelona": return "#A50044"; // Bordowy (Główny) lub #004D98 (Niebieski)
            case "Atletico Madrid": return "#CB3524"; // Czerwony
            case "Sevilla": return "#EC1C24"; // Czerwony
            case "Valencia": return "#FF8200"; // Pomarańczowy
            case "Villarreal": return "#FDB913"; // Żółty

            // Serie A
            case "Juventus": return "#FFFFFF"; // Biały (Alternatywa: #000000 - Czarny)
            case "Inter Milan": return "#004D98"; // Niebieski
            case "AC Milan": return "#DC052D"; // Czerwony
            case "Napoli": return "#12A0D7"; // Błękitny
            case "Roma": return "#8E1F2F"; // Bordowy
            case "Lazio": return "#85B8D0"; // Jasnoniebieski

            // Bundesliga
            case "Bayern Munich": return "#DC052D"; // Czerwony
            case "Borussia Dortmund": return "#FDE100"; // Żółty
            case "RB Leipzig": return "#00AEEF"; // Jasnoniebieski/Czerwony (#E60026)
            case "Bayer Leverkusen": return "#E32221"; // Czerwony
            case "Eintracht Frankfurt": return "#000000"; // Czarny
            case "Borussia Mönchengladbach": return "#000000"; // Czarny (Główny) lub #048D4C (Zielony)

            // Ligue 1
            case "Paris Saint-Germain": return "#004170"; // Granatowy
            case "Marseille": return "#0098D6"; // Błękitny
            case "Lyon": return "#DA291C"; // Czerwony (Główny) lub #004170 (Niebieski)
            case "Monaco": return "#E41E2A"; // Czerwony
            case "Lille": return "#E21C24"; // Czerwony
            case "Nice": return "#ED1C24"; // Czerwony (lub #000000 - Czarny)

            default: return "#777777"; // Domyślny szary
        }
    }


    // --- Stadium Data ---
    const stadiumsData = [
        {
            name: "Anfield",
            // === PAMIĘTAJ: Wstaw tutaj poprawną nazwę pliku z Twojego repozytorium! ===
            image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png"
        }
        // Możesz dodać więcej stadionów tutaj, np.
        // { name: "Camp Nou", image: "camp_nou.jpg" },
        // { name: "Old Trafford", image: "old_trafford.png" }
    ];

    // --- INICJALIZACJA GRY ---
     function initGame() {
         canvas = document.getElementById("gameCanvas");
         if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; }
         ctx = canvas.getContext("2d");
         canvas.width = 640; // Szerokość pola gry (szarego prostokąta)
         canvas.height = 400; // Wysokość pola gry (szarego prostokąta)
         resizeCanvas(); // Dostosuj widoczny rozmiar canvasa

         ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" };

         let homeColor = getTeamColor(selectedHomeTeam);
         let awayColor = getTeamColor(selectedAwayTeam);
         const gkColor = '#CCCCCC'; // Kolor bramkarzy

         // Pozycje graczy (dostosowane do canvas.width i canvas.height)
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
         updateScoreboard();
         console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`);
     }

     function resetPositionsAfterGoal(homeJustScored) {
         if (!canvas || !ball) return;
         ball.x = canvas.width / 2;
         ball.y = canvas.height / 2;
         ball.vx = 0;
         ball.vy = 0;

         let homeColor = getTeamColor(selectedHomeTeam);
         let awayColor = getTeamColor(selectedAwayTeam);
         const gkColor = '#CCCCCC';

         // Reset pozycji - takie same jak w initGame
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

         gameAnimating = false; // Zatrzymaj animację na chwilę
         setTimeout(() => {
             gameAnimating = true; // Wznów animację po chwili
             requestAnimationFrame(gameLoop);
         }, 1200); // Pauza 1.2 sekundy po golu
     }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() {
         if (!ctx || !canvas) return; // Dodano sprawdzenie canvas dla bezpieczeństwa

         // Ustaw kolor wypełnienia na szary (taki jak na zrzucie ekranu)
         // Możesz dostosować odcień, np. '#606060' lub '#585858'
         ctx.fillStyle = "#555555"; // Ciemniejszy szary

         // Narysuj prostokąt wypełniający cały obszar canvas
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         // Opcjonalnie: Rysowanie linii boiska dla lepszego wyglądu
         ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Półprzezroczyste białe linie
         ctx.lineWidth = 2;

         // Linia środkowa
         ctx.beginPath();
         ctx.moveTo(canvas.width / 2, 0);
         ctx.lineTo(canvas.width / 2, canvas.height);
         ctx.stroke();

         // Koło środkowe
         ctx.beginPath();
         ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2); // Dostosuj promień wg potrzeb
         ctx.stroke();

        // Można dodać pola karne, linie bramkowe itp.
        const goalHeight = 80; // Wysokość pola bramkowego/bramki
        const goalTopY = canvas.height / 2 - goalHeight / 2;
        const goalBottomY = canvas.height / 2 + goalHeight / 2;

        // Bramka lewa (słupki i poprzeczka - wizualnie)
        ctx.lineWidth = 4; // Grubsze słupki
        ctx.strokeStyle = "#FFFFFF"; // Białe słupki
        ctx.beginPath();
        ctx.moveTo(5, goalTopY); // Lewy słupek
        ctx.lineTo(5, goalBottomY);
        ctx.moveTo(canvas.width - 5, goalTopY); // Prawy słupek
        ctx.lineTo(canvas.width - 5, goalBottomY);
        // ctx.moveTo(5, goalTopY); // Poprzeczka lewa (opcjonalnie)
        // ctx.lineTo(0, goalTopY);
        // ctx.moveTo(5, goalBottomY); // Poprzeczka lewa (opcjonalnie)
        // ctx.lineTo(0, goalBottomY);
        // ctx.moveTo(canvas.width - 5, goalTopY); // Poprzeczka prawa (opcjonalnie)
        // ctx.lineTo(canvas.width, goalTopY);
        // ctx.moveTo(canvas.width - 5, goalBottomY); // Poprzeczka prawa (opcjonalnie)
        // ctx.lineTo(canvas.width, goalBottomY);
        ctx.stroke();

     }

     function drawGameObjects() {
         if (!ctx || !ball) return;
         const drawPlayer = (player) => {
             if (!player) return;
             ctx.beginPath();
             ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
             ctx.fillStyle = player.color;
             ctx.fill();
             ctx.strokeStyle = "#333"; // Ciemniejszy obrys dla lepszej widoczności
             ctx.lineWidth = 1.5;
             ctx.stroke();
             ctx.closePath();
         };

         fieldPlayers.forEach(drawPlayer);
         fieldPlayersAway.forEach(drawPlayer);
         drawPlayer(goalkeeper);
         drawPlayer(goalkeeperAway);

         // Rysowanie piłki
         ctx.beginPath();
         ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
         ctx.fillStyle = ball.color;
         ctx.fill();
         ctx.strokeStyle = "black";
         ctx.lineWidth = 1;
         ctx.stroke();
         ctx.closePath();

         // Rysowanie linii przeciągania, jeśli aktywna
         if (isDragging && draggingPlayerIndex !== null) {
             drawPullLine();
         }
     }

     function drawPullLine() { if (!ctx) return; ctx.save(); let startPoint; if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { startPoint = fieldPlayers[draggingPlayerIndex]; } else if (draggingPlayerIndex === -1 && goalkeeper) { startPoint = goalkeeper; } else { ctx.restore(); return; } ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(dragCurrentCanvas.x, dragCurrentCanvas.y); ctx.stroke(); let dx = startPoint.x - dragCurrentCanvas.x; let dy = startPoint.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); if (pullLength > 5) { let arrowEndX = startPoint.x + dx * pullScale * 0.5; let arrowEndY = startPoint.y + dy * pullScale * 0.5; ctx.setLineDash([]); let red = Math.floor(255 * pullScale); let green = Math.floor(255 * (1 - pullScale)); ctx.strokeStyle = `rgba(${red}, ${green}, 0, 0.9)`; ctx.lineWidth = 3 + 2 * pullScale; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(arrowEndX, arrowEndY); ctx.stroke(); drawArrowhead(ctx, startPoint.x, startPoint.y, arrowEndX, arrowEndY, 8 + 4 * pullScale); } ctx.restore(); }
     function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { var angle = Math.atan2(toy - fromy, tox - fromx); context.beginPath(); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6)); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6)); context.stroke(); }

    // --- FUNKCJE FIZYKI I KOLIZJI ---
     function updatePositions() {
        if (!canvas || !ball) return;
        const allMovables = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway, ball];
        const borderMargin = 8; // Mały margines od krawędzi canvas

        allMovables.forEach(obj => {
            if (!obj) return;
            obj.x += obj.vx;
            obj.y += obj.vy;

            // Tarcie
            let currentFriction = (obj === ball) ? FRICTION : FRICTION * PLAYER_FRICTION;
            obj.vx *= currentFriction;
            obj.vy *= currentFriction;

            // Zatrzymanie przy małej prędkości
            if (Math.hypot(obj.vx, obj.vy) < 0.1) {
                obj.vx = 0;
                obj.vy = 0;
            }

            // Odbicia od krawędzi boiska (canvasa)
            const restitution = -0.4; // Jak mocno się odbija
            if (obj.x - obj.radius < 0) { // Zmieniono borderMargin na 0
                obj.x = obj.radius;
                obj.vx *= restitution;
            }
            if (obj.x + obj.radius > canvas.width) { // Zmieniono borderMargin na 0
                obj.x = canvas.width - obj.radius;
                obj.vx *= restitution;
            }
            if (obj.y - obj.radius < 0) { // Zmieniono borderMargin na 0
                obj.y = obj.radius;
                obj.vy *= restitution;
            }
            if (obj.y + obj.radius > canvas.height) { // Zmieniono borderMargin na 0
                obj.y = canvas.height - obj.radius;
                obj.vy *= restitution;
            }
        });

        confineGoalkeeper(goalkeeper, true); // Ogranicz ruch bramkarza gospodarzy
        confineGoalkeeper(goalkeeperAway, false); // Ogranicz ruch bramkarza gości
        checkGoal(); // Sprawdź, czy padł gol
     }

     function confineGoalkeeper(gk, isHomeTeam) {
         if (!gk || !canvas) return;
         // const borderMargin = 8; // Usunięto, bramkarz dochodzi do krawędzi
         const goalHeight = 80; // Wysokość "obszaru" bramki (jak w drawField)
         const penaltyBoxWidth = 90; // Szerokość pola karnego
         const goalTop = canvas.height / 2 - goalHeight / 2;
         const goalBottom = canvas.height / 2 + goalHeight / 2;

         // Ograniczenie ruchu góra/dół do wysokości bramki
         gk.y = Math.max(goalTop + gk.radius, Math.min(goalBottom - gk.radius, gk.y));

         // Ograniczenie ruchu lewo/prawo do pola karnego
         if (isHomeTeam) {
             const penaltyAreaFront = penaltyBoxWidth; // Odległość od linii bramkowej
             gk.x = Math.max(0 + gk.radius, Math.min(penaltyAreaFront - gk.radius, gk.x));
         } else { // Goście
             const penaltyAreaFront = canvas.width - penaltyBoxWidth; // Odległość od linii bramkowej
             gk.x = Math.max(penaltyAreaFront + gk.radius, Math.min(canvas.width - gk.radius, gk.x));
         }
     }

     function checkGoal() {
         if (!ball || !canvas) return;
        // const borderMargin = 8; // Usunięto
         const goalHeight = 80; // Używamy tej samej wysokości co w drawField/confineGoalkeeper
         const goalLineYTop = canvas.height/2 - goalHeight/2;
         const goalLineYBottom = canvas.height/2 + goalHeight/2;
         const goalPostRestitution = -0.5 * COLLISION_RESTITUTION; // Odbicie od słupka

         // Gol dla gości (piłka przekracza lewą linię bramkową)
         if (ball.x - ball.radius < 0) { // Sprawdzamy czy środek piłki jest za linią 0
             if (ball.y > goalLineYTop && ball.y < goalLineYBottom) {
                 console.log("GOL DLA GOŚCI!");
                 score.away++;
                 updateScoreboard();
                 resetPositionsAfterGoal(false); // Gospodarze wznawiają
             } else {
                 // Odbicie od słupka (górnego lub dolnego na lewej krawędzi)
                 ball.x = ball.radius;
                 ball.vx *= goalPostRestitution;
             }
         }
         // Gol dla gospodarzy (piłka przekracza prawą linię bramkową)
         if (ball.x + ball.radius > canvas.width) { // Sprawdzamy czy środek piłki jest za linią canvas.width
             if (ball.y > goalLineYTop && ball.y < goalLineYBottom) {
                 console.log("GOL DLA GOSPODARZY!");
                 score.home++;
                 updateScoreboard();
                 resetPositionsAfterGoal(true); // Goście wznawiają
             } else {
                 // Odbicie od słupka (górnego lub dolnego na prawej krawędzi)
                 ball.x = canvas.width - ball.radius;
                 ball.vx *= goalPostRestitution;
             }
         }
     }

     function circleCollision(c1, c2) { if (!c1 || !c2) return false; const dx = c1.x - c2.x; const dy = c1.y - c2.y; const distance = Math.hypot(dx, dy); const radiiSum = c1.radius + c2.radius; return distance < radiiSum; }
     function resolveCollision(obj1, obj2) { if (!obj1 || !obj2) return; const dx = obj2.x - obj1.x; const dy = obj2.y - obj1.y; const distance = Math.hypot(dx, dy); const radiiSum = obj1.radius + obj2.radius; const overlap = radiiSum - distance; if (overlap > 0 && distance > 0.01) { const nx = dx / distance; const ny = dy / distance; const moveCorrection = overlap / 2; obj1.x -= nx * moveCorrection; obj1.y -= ny * moveCorrection; obj2.x += nx * moveCorrection; obj2.y += ny * moveCorrection; const dvx = obj1.vx - obj2.vx; const dvy = obj1.vy - obj2.vy; const dotProduct = dvx * nx + dvy * ny; if (dotProduct < 0) { let restitution = (obj1 !== ball && obj2 !== ball) ? PLAYER_COLLISION_RESTITUTION : COLLISION_RESTITUTION; const mass1 = (obj1 === ball) ? 0.5 : 1.0; const mass2 = (obj2 === ball) ? 0.5 : 1.0; const invMassSum = (1 / mass1) + (1 / mass2); let impulse = (-(1 + restitution) * dotProduct) / invMassSum; obj1.vx += (impulse / mass1) * nx; obj1.vy += (impulse / mass1) * ny; obj2.vx -= (impulse / mass2) * nx; obj2.vy -= (impulse / mass2) * ny; if (obj1 === ball || obj2 === ball) { ball.vx *= BALL_COLLISION_BOOST; ball.vy *= BALL_COLLISION_BOOST; } } } }
     function checkCollisions() { if (!ball) return; const allPlayers = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway].filter(p => p); const allObjects = [...allPlayers, ball]; for (let i = 0; i < allObjects.length; i++) { for (let j = i + 1; j < allObjects.length; j++) { if (circleCollision(allObjects[i], allObjects[j])) { resolveCollision(allObjects[i], allObjects[j]); } } } }

    // --- SZTUCZNA INTELIGENCJA (AI) ---
    function aiMove() {
        if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return;

        const goalX = 10; // Cel AI - bramka gracza (lewa strona)
        const goalY = canvas.height / 2;
        // const borderMargin = 8; // Usunięto

        // --- AI Bramkarza (goalkeeperAway) ---
        goalkeeperAway.vx *= 0.8; // Spowolnienie bramkarza
        goalkeeperAway.vy *= 0.8;

        // Jeśli piłka jest na połowie AI
        if (ball.x > canvas.width * 0.5) {
            let dyGK = ball.y - goalkeeperAway.y;
            // Reaguj na pozycję Y piłki
            if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) {
                goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.1;
            }
            // Reaguj na pozycję X piłki, jeśli jest blisko bramki
            if (ball.x > canvas.width * 0.7) {
                let dxGK = ball.x - goalkeeperAway.x;
                goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.05;
            }
        } else { // Piłka na połowie gracza - bramkarz wraca na środek bramki
            let dyToCenter = (canvas.height / 2) - goalkeeperAway.y;
            if (Math.abs(dyToCenter) > 5) {
                goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.05;
            }
            // Wracaj do domyślnej pozycji X (blisko prawej krawędzi)
            let dxToDefaultPos = (canvas.width - 40) - goalkeeperAway.x; // Domyślna pozycja X
            if (Math.abs(dxToDefaultPos) > 5) {
                goalkeeperAway.vx += Math.sign(dxToDefaultPos) * AI_GOALKEEPER_SPEED * 0.03;
            }
        }
        // Ogranicz prędkość bramkarza
        goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx));
        goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy));

        // --- AI Graczy z Pola (fieldPlayersAway) ---
        let closestPlayerIndex = -1;
        let minDistSq = Infinity;
        let playerWithBall = null;

        // Znajdź najbliższego gracza AI do piłki i sprawdź, kto ma piłkę
        fieldPlayersAway.forEach((player, index) => {
            if (!player) return;
            let dx = ball.x - player.x;
            let dy = ball.y - player.y;
            let distSq = dx * dx + dy * dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestPlayerIndex = index;
            }
            // Sprawdź, czy gracz ma piłkę (jest bardzo blisko)
            if (distSq < Math.pow(player.radius + ball.radius + 2, 2)) {
                playerWithBall = player;
            }
        });

        // Akcje dla każdego gracza AI
        fieldPlayersAway.forEach((player, index) => {
            if (!player) return;
            // Resetuj chwilową prędkość nadaną przez AI (będzie ustawiona poniżej)
            // Zostawiamy vx, vy z fizyki (np. po kolizji), ale AI będzie je modyfikować
            // player.vx = 0;
            // player.vy = 0;

            let dxToBall = ball.x - player.x;
            let dyToBall = ball.y - player.y;
            let distToBallSq = dxToBall * dxToBall + dyToBall * dyToBall;
            let distToBall = Math.sqrt(distToBallSq);

            // Akcja: Jeśli gracz AI ma piłkę
            if (player === playerWithBall) {
                let dxToGoal = goalX - player.x;
                let dyToGoal = goalY - player.y;
                let distToGoal = Math.hypot(dxToGoal, dyToGoal);
                let angleToGoal = Math.atan2(dyToGoal, dxToGoal);
                let canShoot = player.x > canvas.width * 0.4; // Czy jest na dobrej pozycji do strzału

                // Decyzja: Strzał czy drybling?
                if (canShoot && Math.random() < 0.4) { // 40% szans na strzał, jeśli jest w dobrej pozycji
                    let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2; // Dodaj mały błąd celności
                    let power = AI_REACTION_POWER * (0.8 + Math.random() * 0.4); // Zmienna siła strzału
                    // Nadaj impuls strzału
                    player.vx += Math.cos(shootAngle) * power * 0.1; // Mniejszy wpływ na vx, vy - bardziej jak kopnięcie
                    player.vy += Math.sin(shootAngle) * power * 0.1;
                    console.log("AI Shot!");
                } else { // Drybling
                    let dribbleAngle = angleToGoal;
                    let power = AI_REACTION_POWER * 0.3; // Siła dryblingu

                    // Proste unikanie innych graczy AI (omijanie)
                    fieldPlayersAway.forEach(otherPlayer => {
                        if (player === otherPlayer) return;
                        let dxOther = otherPlayer.x - player.x;
                        let dyOther = otherPlayer.y - player.y;
                        let distOtherSq = dxOther*dxOther + dyOther*dyOther;
                        // Jeśli inny gracz AI jest blisko, lekko zmień kąt dryblingu
                        if (distOtherSq < Math.pow(PLAYER_RADIUS * 4, 2)) {
                            // Wykorzystaj iloczyn wektorowy do określenia strony omijania
                            dribbleAngle -= Math.sign(dxOther * dyToGoal - dyOther * dxToGoal) * 0.2; // Lekko skręć
                        }
                    });
                    // Nadaj impuls dryblingu
                    player.vx += Math.cos(dribbleAngle) * power * 0.1;
                    player.vy += Math.sin(dribbleAngle) * power * 0.1;
                }
            }
            // Akcja: Jeśli gracz jest najbliżej piłki (i nie ma jej) i jest w zasięgu przechwytu
            else if (index === closestPlayerIndex && distToBallSq < AI_INTERCEPT_RADIUS_SQ) {
                let interceptPower = AI_REACTION_POWER * 0.4 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ)); // Siła zależy od dystansu
                if (distToBall > 0) {
                    // Poruszaj się w kierunku piłki
                    player.vx += (dxToBall / distToBall) * interceptPower * 0.1;
                    player.vy += (dyToBall / distToBall) * interceptPower * 0.1;
                }
            }
            // Akcja: W innym przypadku (gracz daleko od piłki) - zajmij pozycję
            else {
                // Proste pozycjonowanie (rozstawienie na boisku)
                let targetX, targetY;
                // Bardziej defensywne ustawienie dla graczy AI
                switch(index) {
                    case 0: targetX = canvas.width * 0.80; targetY = canvas.height * 0.25; break; // Prawy górny
                    case 1: targetX = canvas.width * 0.80; targetY = canvas.height * 0.75; break; // Prawy dolny
                    case 2: targetX = canvas.width * 0.65; targetY = canvas.height * 0.40; break; // Środkowy górny
                    case 3: targetX = canvas.width * 0.65; targetY = canvas.height * 0.60; break; // Środkowy dolny
                    default: targetX = canvas.width * 0.7; targetY = canvas.height * 0.5; // Domyślnie środek połowy
                }

                let dxToPos = targetX - player.x;
                let dyToPos = targetY - player.y;
                let distToPos = Math.hypot(dxToPos, dyToPos);
                let positionPower = AI_REACTION_POWER * 0.05; // Mała siła ruchu pozycyjnego

                if (distToPos > PLAYER_RADIUS) { // Ruszaj się, jeśli jesteś daleko od celu
                    player.vx += (dxToPos / distToPos) * positionPower * 0.1;
                    player.vy += (dyToPos / distToPos) * positionPower * 0.1;
                }
            }
            // Ogranicz prędkość graczy AI (zapobiega nadmiernym prędkościom)
            const maxAiSpeed = 5.0;
            const currentSpeed = Math.hypot(player.vx, player.vy);
            if (currentSpeed > maxAiSpeed) {
                 player.vx = (player.vx / currentSpeed) * maxAiSpeed;
                 player.vy = (player.vy / currentSpeed) * maxAiSpeed;
            }
        });
    }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop() {
         if (!gameAnimating || !ctx) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height); // Czyści cały canvas

         drawField(); // <--- Rysowanie szarego tła i linii boiska

         updatePositions(); // Aktualizacja pozycji (fizyka)
         checkCollisions(); // Sprawdzanie i rozwiązywanie kolizji
         aiMove();          // Wykonanie ruchów przez AI
         drawGameObjects(); // Rysowanie graczy, piłki itp. NA szarym tle boiska

         requestAnimationFrame(gameLoop); // Zaplanuj następną klatkę
     }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE) ---
     function getMousePos(canvas, evt) { if (!canvas) return { x: 0, y: 0 }; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY }; }
     function canvasMouseDown(e) { if (!canvas || !gameAnimating) return; const pos = getMousePos(canvas, e); // Sprawdź graczy z pola
         for (let i = 0; i < fieldPlayers.length; i++) { const p = fieldPlayers[i]; if (p && Math.hypot(pos.x - p.x, pos.y - p.y) < PLAYER_RADIUS + 5) { // +5 dla łatwiejszego trafienia
             draggingPlayerIndex = i; isDragging = true; dragStartCanvas = { x: p.x, y: p.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } } // Sprawdź bramkarza
         if (goalkeeper && Math.hypot(pos.x - goalkeeper.x, pos.y - goalkeeper.y) < GOALKEEPER_RADIUS + 5) { draggingPlayerIndex = -1; // Specjalny indeks dla bramkarza
             isDragging = true; dragStartCanvas = { x: goalkeeper.x, y: goalkeeper.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } }
     function canvasMouseMove(e) { if (!isDragging || !canvas || !gameAnimating) return; dragCurrentCanvas = getMousePos(canvas, e); }
     function canvasMouseUp(e) { if (!isDragging || draggingPlayerIndex === null || !canvas || !gameAnimating) return; const dx = dragStartCanvas.x - dragCurrentCanvas.x; const dy = dragStartCanvas.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); if (pullLength < 3) { // Zbyt krótki ruch - anuluj
             isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; return; } let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); // Skala siły zależna od długości pociągnięcia
         const baseImpulse = pullLength * DRAG_IMPULSE_SCALE * pullScale; const impulseX = (dx / (pullLength || 1)) * baseImpulse; const impulseY = (dy / (pullLength || 1)) * baseImpulse; // Zastosuj impuls do odpowiedniego gracza
         if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { fieldPlayers[draggingPlayerIndex].vx = impulseX; fieldPlayers[draggingPlayerIndex].vy = impulseY; } else if (draggingPlayerIndex === -1 && goalkeeper) { // Bramkarz
             goalkeeper.vx = impulseX * 0.6; // Bramkarz ma mniejszy impuls
             goalkeeper.vy = impulseY * 0.6; } // Zakończ przeciąganie
         isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; }
     function canvasMouseLeave(e) { if (isDragging) { // Jeśli mysz opuści canvas podczas przeciągania, anuluj
             isDragging = false; draggingPlayerIndex = null; if (canvas) canvas.style.cursor = 'grab'; } }
     function addCanvasEvents() { if (!canvas) return; canvas.addEventListener("mousedown", canvasMouseDown); canvas.addEventListener("mousemove", canvasMouseMove); canvas.addEventListener("mouseup", canvasMouseUp); canvas.addEventListener("mouseleave", canvasMouseLeave); }

    // --- WYBÓR DRUŻYN ---
     function populateTeamSelections() { const homeContainer = document.getElementById("homeTeamContainer"); const awayContainer = document.getElementById("awayTeamContainer"); if (!homeContainer || !awayContainer) return; homeContainer.innerHTML = ""; awayContainer.innerHTML = ""; selectedHomeTeam = null; selectedAwayTeam = null; Object.keys(teamsData).forEach(league => { const leagueData = teamsData[league]; const createLeagueSection = (targetContainer, isHome) => { let leagueDiv = document.createElement("div"); leagueDiv.className = "league-section"; let leagueHeader = document.createElement("div"); leagueHeader.className = "league-header"; let leagueLogo = document.createElement("img"); leagueLogo.src = leagueData.leagueLogo; leagueLogo.alt = league; leagueLogo.style.width = "24px"; leagueLogo.style.marginRight = "8px"; let leagueName = document.createElement("span"); leagueName.innerText = league; leagueHeader.appendChild(leagueLogo); leagueHeader.appendChild(leagueName); leagueDiv.appendChild(leagueHeader); let teamInnerContainer = document.createElement("div"); teamInnerContainer.style.display = "flex"; teamInnerContainer.style.flexWrap = "wrap"; // Umożliwia zawijanie
            teamInnerContainer.style.gap = "10px"; // Mniejszy odstęp
            teamInnerContainer.style.marginTop = "10px"; leagueData.teams.forEach(team => { let teamDiv = document.createElement("div"); teamDiv.className = "team-option"; teamDiv.dataset.team = team.name; teamDiv.innerHTML = `<img src="${team.logo}" alt="${team.name}" title="${team.name}" style="width: 40px; height: 40px; object-fit: contain;" /><p style="font-size: 0.7em; margin-top: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 50px;">${team.name}</p>`; teamDiv.style.cursor = "pointer"; teamDiv.style.padding = "5px"; teamDiv.style.border = "1px solid transparent"; teamDiv.style.borderRadius = "4px"; teamDiv.style.display = "flex"; // Użyj flexbox dla img i p
            teamDiv.style.flexDirection = "column"; teamDiv.style.alignItems = "center"; teamDiv.style.width = "60px"; // Stała szerokość
            teamDiv.addEventListener("click", function () { // Usuń zaznaczenie z innych w tej samej sekcji
                 Array.from(targetContainer.querySelectorAll('.team-option.selected')).forEach(el => { el.classList.remove("selected"); el.style.borderColor = "transparent"; el.style.backgroundColor = ""; }); // Zaznacz kliknięty
                 this.classList.add("selected"); this.style.borderColor = "#007bff"; this.style.backgroundColor = "rgba(0, 123, 255, 0.1)"; if (isHome) selectedHomeTeam = team.name; else selectedAwayTeam = team.name; console.log(`${isHome ? 'Home' : 'Away'} selected: ${team.name}`); }); teamInnerContainer.appendChild(teamDiv); }); leagueDiv.appendChild(teamInnerContainer); targetContainer.appendChild(leagueDiv); }; createLeagueSection(homeContainer, true); createLeagueSection(awayContainer, false); }); }

    // --- Stadium Selection Population ---
    function populateStadiumSelection() { const stadiumContainer = document.getElementById("stadiumContainer"); const startButton = document.getElementById("startMatchFromStadiumBtn"); if (!stadiumContainer || !startButton) { console.error("Stadium container or start button not found!"); return; } stadiumContainer.innerHTML = ""; selectedStadium = null; startButton.disabled = true; // Przycisk startu domyślnie nieaktywny
         stadiumsData.forEach(stadium => { let stadiumDiv = document.createElement("div"); stadiumDiv.className = "stadium-option team-option"; // Użyjmy podobnych stylów co drużyna
            stadiumDiv.dataset.stadium = stadium.name; stadiumDiv.innerHTML = `<img src="${stadium.image}" alt="${stadium.name}" title="${stadium.name}" style="width: 80px; height: 50px; object-fit: cover; margin-bottom: 5px;" /><p style="font-size: 0.8em; text-align: center;">${stadium.name}</p>`; stadiumDiv.style.cursor = "pointer"; stadiumDiv.style.padding = "10px"; stadiumDiv.style.border = "1px solid transparent"; stadiumDiv.style.borderRadius = "4px"; stadiumDiv.style.display = "flex"; stadiumDiv.style.flexDirection = "column"; stadiumDiv.style.alignItems = "center"; stadiumDiv.style.width = "100px"; stadiumDiv.addEventListener("click", function() { // Usuń zaznaczenie z innych stadionów
                 Array.from(stadiumContainer.querySelectorAll('.stadium-option.selected')).forEach(el => { el.classList.remove("selected"); el.style.borderColor = "transparent"; el.style.backgroundColor = ""; }); // Zaznacz kliknięty
                 this.classList.add("selected"); this.style.borderColor = "#007bff"; this.style.backgroundColor = "rgba(0, 123, 255, 0.1)"; selectedStadium = stadium.name; console.log("Selected stadium:", selectedStadium); startButton.disabled = false; // Aktywuj przycisk startu
             }); stadiumContainer.appendChild(stadiumDiv); }); // Dodajmy kontenerowi styl flex dla ułożenia
         stadiumContainer.style.display = "flex"; stadiumContainer.style.flexWrap = "wrap"; stadiumContainer.style.gap = "15px"; stadiumContainer.style.justifyContent = "center"; }

    // --- FUNKCJE USTAWIEŃ (Rozmiar czcionki) ---
     const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); function applyFontSize(size) { if (!['small', 'medium', 'large'].includes(size)) { size = 'medium'; } document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large'); document.body.classList.add(`font-size-${size}`); localStorage.setItem('gameFontSize', size); fontSizeOptions.forEach(button => { if (button) { button.classList.remove('active-size'); if (button.dataset.size === size) { button.classList.add('active-size'); } } }); console.log("Zastosowano rozmiar czcionki:", size); } function loadFontSize() { const savedSize = localStorage.getItem('gameFontSize') || 'medium'; applyFontSize(savedSize); }

     // --- FUNKCJE POMOCNICZE MODALI ---
      function openModal(modalElement) { if(modalElement) modalElement.classList.remove('hidden'); } function closeModal(modalElement) { if(modalElement) modalElement.classList.add('hidden'); }

    // --- SKALOWANIE CANVAS ---
     function resizeCanvas() {
         if (!canvas) return;
         const gameContainer = canvas.parentElement;
         if (!gameContainer) return;

         // Użyj stałych wymiarów logicznych canvasa (640x400)
         const canvasLogicalWidth = 640;
         const canvasLogicalHeight = 400;
         const aspectRatio = canvasLogicalWidth / canvasLogicalHeight;

         // Dopasuj do dostępnej szerokości kontenera, ale zachowaj proporcje
         const availableWidth = gameContainer.clientWidth * 0.98; // 98% szerokości kontenera
         const availableHeight = window.innerHeight - 150; // Odejmij wysokość np. na UI

         let newWidth = availableWidth;
         let newHeight = newWidth / aspectRatio;

         // Jeśli wysokość przekracza dostępną, skaluj wg wysokości
         if (newHeight > availableHeight) {
             newHeight = availableHeight;
             newWidth = newHeight * aspectRatio;
         }

         // Ustaw styl CSS canvasa (widoczny rozmiar)
         canvas.style.width = `${newWidth}px`;
         canvas.style.height = `${newHeight}px`;

         // Wymiary logiczne canvasa (do rysowania) pozostają stałe
         canvas.width = canvasLogicalWidth;
         canvas.height = canvasLogicalHeight;

         console.log(`Canvas resized: CSS ${newWidth}x${newHeight}, Logical ${canvas.width}x${canvas.height}`);
     }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         loadFontSize(); // Załaduj zapisany rozmiar czcionki
         window.addEventListener('resize', resizeCanvas); // Nasłuchuj zmian rozmiaru okna

         // Referencje do przycisków i elementów UI
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

         // --- Nasłuchiwacze zdarzeń (Nawigacja między ekranami) ---

         // Start -> Wybór Drużyny
         if (startMatchBtn) startMatchBtn.addEventListener("click", () => {
             console.log("Kliknięto Szybki Mecz");
             closeModal(startScreen);
             openModal(teamSelectScreen);
             try {
                populateTeamSelections(); // Wypełnij opcje drużyn
             } catch (error) {
                 console.error("Błąd podczas populateTeamSelections:", error);
             }
         });

         // Wybór Drużyny -> Start
         if (backToMenuFromSelect) backToMenuFromSelect.addEventListener("click", () => {
             closeModal(teamSelectScreen);
             openModal(startScreen);
         });

         // Wybór Drużyny -> Wybór Stadionu
         if (goToStadiumSelectBtn) goToStadiumSelectBtn.addEventListener("click", () => {
             if (!selectedHomeTeam || !selectedAwayTeam) {
                 alert("Proszę wybrać obie drużyny!");
                 return;
             }
             if (selectedHomeTeam === selectedAwayTeam) {
                 alert("Drużyny muszą być różne!");
                 return;
             }
             closeModal(teamSelectScreen);
             openModal(stadiumSelectScreen);
             populateStadiumSelection(); // Wypełnij opcje stadionów
         });

         // Wybór Stadionu -> Wybór Drużyny
         if (backToTeamSelectBtn) backToTeamSelectBtn.addEventListener("click", () => {
             closeModal(stadiumSelectScreen);
             openModal(teamSelectScreen);
         });

         // Wybór Stadionu -> Rozpocznij Mecz (Ekran Gry)
         if (startMatchFromStadiumBtn) startMatchFromStadiumBtn.addEventListener("click", () => {
             if (!selectedStadium) {
                 alert("Proszę wybrać stadion!");
                 return;
             }

             // Znajdź dane wybranego stadionu
             const stadiumData = stadiumsData.find(s => s.name === selectedStadium);
             if (stadiumData && stadiumData.image) {
                 // Ustaw tło elementu body na obraz stadionu
                 document.body.style.backgroundImage = `url('${stadiumData.image}')`;
                 document.body.style.backgroundSize = "cover"; // Dopasuj do rozmiaru okna
                 document.body.style.backgroundPosition = "center center"; // Wyśrodkuj
                 document.body.style.backgroundRepeat = "no-repeat"; // Nie powtarzaj
                 document.body.style.backgroundAttachment = "fixed"; // Tło stałe podczas przewijania
             } else {
                 document.body.style.backgroundImage = ''; // Usuń tło, jeśli nie ma obrazu
             }

             closeModal(stadiumSelectScreen); // Ukryj wybór stadionu
             openModal(gameScreen); // Pokaż ekran gry

             initGame(); // Zainicjuj logikę gry (pozycje, piłka)
             addCanvasEvents(); // Dodaj obsługę myszy do canvasa
             resizeCanvas(); // Upewnij się, że canvas ma poprawny rozmiar
             startTimer(); // Uruchom timer meczu
             gameAnimating = true; // Rozpocznij animację
             requestAnimationFrame(gameLoop); // Uruchom pętlę gry
         });

         // Ekran Gry -> Start (Powrót do menu)
         if (backToStartBtn) backToStartBtn.addEventListener("click", () => {
             gameAnimating = false; // Zatrzymaj animację
             stopTimer(); // Zatrzymaj timer
             closeModal(gameScreen); // Ukryj ekran gry
             openModal(startScreen); // Pokaż ekran startowy
             document.body.style.backgroundImage = ''; // Usuń tło stadionu z body
             resetGameFull(); // Zresetuj stan gry (wynik, drużyny itp.)
         });

         // --- Nasłuchiwacze zdarzeń (Przyciski Modali) ---
         if(btnPlayerDB) btnPlayerDB.addEventListener("click", () => openModal(playerDBModal));
         if(btnLanguage) btnLanguage.addEventListener("click", () => openModal(languageModal));
         if(btnSettings) btnSettings.addEventListener("click", () => {
             openModal(settingsModal);
             // Ustaw aktywny przycisk rozmiaru czcionki
             const currentSize = localStorage.getItem('gameFontSize') || 'medium';
             fontSizeOptions.forEach(button => {
                 if(button) button.classList.toggle('active-size', button.dataset.size === currentSize);
             });
         });
         if(closePlayerDBBtn) closePlayerDBBtn.addEventListener("click", () => closeModal(playerDBModal));
         if(closeLanguageModalBtn) closeLanguageModalBtn.addEventListener("click", () => closeModal(languageModal));
         if(closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));

         // --- Nasłuchiwacze zdarzeń (Opcje Ustawień) ---

         // Zmiana rozmiaru czcionki
         fontSizeOptions.forEach(button => {
             if(button) button.addEventListener('click', () => applyFontSize(button.dataset.size));
         });

         // Dodawanie gracza (formularz w modalu) - przykładowa funkcjonalność
         if(addPlayerForm) addPlayerForm.addEventListener("submit", (e) => {
             e.preventDefault(); // Zapobiegaj przeładowaniu strony
             const nameInput = document.getElementById("playerName");
             const teamInput = document.getElementById("playerTeam");
             const ratingInput = document.getElementById("playerRating");
             const name = nameInput ? nameInput.value : null;
             const team = teamInput ? teamInput.value : null;
             const rating = ratingInput ? ratingInput.value : null;

             if(name && team && rating){
                 console.log("Dodawanie gracza:", { name, team, rating });
                 const playerListDiv = document.getElementById("playerList");
                 if(playerListDiv){
                     const newPlayerEntry = document.createElement('p');
                     newPlayerEntry.textContent = `${name} (${team}) - Ocena: ${rating}`;
                     playerListDiv.appendChild(newPlayerEntry);
                 }
                 e.target.reset(); // Wyczyść formularz
             } else {
                 console.warn("Formularz dodawania gracza: brakuje danych");
                 alert("Proszę wypełnić wszystkie pola!");
             }
         });

         // Zmiana języka (przykładowa funkcjonalność)
         langOptions.forEach(button => {
             if(button) button.addEventListener("click", () => {
                 const lang = button.dataset.lang;
                 console.log("Zmieniono język na:", lang);
                 // Tutaj powinna być logika zmiany języka interfejsu
                 // np. załadowanie odpowiednich tłumaczeń
                 alert(`Język zmieniony na: ${lang} (funkcjonalność do implementacji)`);
                 closeModal(languageModal);
             });
         });

         // Komunikat końcowy inicjalizacji
         console.log("MiniSoccer - Inicjalizacja zakończona. Wersja z szarym boiskiem na canvasie.");
         // Inicjalne wywołanie resizeCanvas, aby ustawić rozmiar przed rozpoczęciem gry
         resizeCanvas();
     });

})(); // Koniec IIFE

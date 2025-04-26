// ========================================================================
// PEŁNY KOD script.js (WERSJA z ZIELONĄ MURAWĄ, LINIAMI i TŁEM MENU)
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
    const MATCH_DURATION = 180; // 3 minuty
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
     function gameOver() { stopTimer(); gameAnimating = false; const homeName = selectedHomeTeam || "Gospodarze"; const awayName = selectedAwayTeam || "Goście"; alert("Koniec meczu! Wynik: " + homeName + " " + score.home + " : " + score.away + " " + awayName); closeModal(gameScreen); openModal(startScreen); if(startScreen) startScreen.classList.add('start-screen-background'); // Przywróć tło menu
         resetGameFull(); }
     function resetGameFull() { if(canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0, canvas.width, canvas.height); } selectedHomeTeam = null; selectedAwayTeam = null; selectedStadium = null; score = {home: 0, away: 0}; fieldPlayers = []; fieldPlayersAway = []; goalkeeper = null; goalkeeperAway = null; ball = null; document.body.style.backgroundImage = ''; } // Reset tła body
     function updateScoreboard() { const scoreboardElement = document.getElementById("scoreboard"); if(scoreboardElement) { const homeName = selectedHomeTeam || "Dom"; const awayName = selectedAwayTeam || "Gość"; scoreboardElement.innerText = `${homeName} ${score.home} : ${score.away} ${awayName}`; } }

    // --- BAZA DANYCH KLUBÓW (bez zmian) ---
    const teamsData = { "Premier League": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg", teams: [ { name: "Manchester United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" }, { name: "Manchester City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" }, { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" }, { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" }, { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" }, { name: "Tottenham Hotspur", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" } ] }, "La Liga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/9/90/LaLiga.svg", teams: [ { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" }, { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" }, { name: "Atletico Madrid", logo: "https://brandlogos.net/wp-content/uploads/2021/09/atltico-madrid-logo.png" }, { name: "Sevilla", logo: "https://cdn.freebiesupply.com/logos/large/2x/sevilla-fc-logo-png-transparent.png" }, { name: "Valencia", logo: "https://brandlogos.net/wp-content/uploads/2014/10/valencia_cf-logo_brandlogos.net_iaffl-512x674.png" }, { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/1200px-Villarreal_CF_logo-en.svg.png" } ] }, "Serie A": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg", teams: [ { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Juventus_Logo.png" }, { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" }, { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/653px-Logo_of_AC_Milan.svg.png" }, { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Neapel.svg/1200px-SSC_Neapel.svg.png" }, { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/sco/7/7d/AS_Roma%27s_logo_from_2017.png" }, { name: "Lazio", logo: "https://static.cdnlogo.com/logos/s/89/ss-lazio.png" } ] }, "Bundesliga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo_(2017).svg", teams: [ { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2017).svg/2048px-FC_Bayern_M%C3%BCnchen_logo_(2017).svg.png" }, { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Borussia_Dortmund.png" }, { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/1200px-RB_Leipzig_2014_logo.svg.png" }, { name: "Bayer Leverkusen", logo: "https://cdn.freebiesupply.com/logos/large/2x/bayer-leverkusen-logo-png-transparent.png" }, { name: "Eintracht Frankfurt", logo: "https://logodownload.org/wp-content/uploads/2019/11/eintracht-frankfurt-logo.png" }, { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/1200px-Borussia_M%C3%B6nchengladbach_logo.svg.png" } ] }, "Ligue 1": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Ligue_1.svg", teams: [ { name: "Paris Saint-Germain", logo: "https://logos-world.net/wp-content/uploads/2020/07/PSG-Logo.png" }, { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/1582px-Olympique_Marseille_logo.svg.png" }, { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Olympique_Lyonnais_logo.svg/1200px-Olympique_Lyonnais_logo.svg.png" }, { name: "Monaco", logo: "https://logodownload.org/wp-content/uploads/2019/09/monaco-fc-logo-1.png" }, { name: "Lille", logo: "https://logodownload.org/wp-content/uploads/2019/09/lille-logo-1.png" }, { name: "Nice", logo: "https://1000logos.net/wp-content/uploads/2020/09/Nice-logo.png" } ] } };
    function getTeamColor(teamName) { /* ... (bez zmian) ... */ switch(teamName) { case "Manchester United": return "#DA291C"; case "Manchester City": return "#6CABDD"; case "Liverpool": return "#C8102E"; case "Chelsea": return "#034694"; case "Arsenal": return "#EF0107"; case "Tottenham Hotspur": return "#FFFFFF"; case "Real Madrid": return "#FFFFFF"; case "Barcelona": return "#A50044"; case "Atletico Madrid": return "#CB3524"; case "Sevilla": return "#EC1C24"; case "Valencia": return "#FF8200"; case "Villarreal": return "#FDB913"; case "Juventus": return "#FFFFFF"; case "Inter Milan": return "#004D98"; case "AC Milan": return "#DC052D"; case "Napoli": return "#12A0D7"; case "Roma": return "#8E1F2F"; case "Lazio": return "#85B8D0"; case "Bayern Munich": return "#DC052D"; case "Borussia Dortmund": return "#FDE100"; case "RB Leipzig": return "#00AEEF"; case "Bayer Leverkusen": return "#E32221"; case "Eintracht Frankfurt": return "#000000"; case "Borussia Mönchengladbach": return "#000000"; case "Paris Saint-Germain": return "#004170"; case "Marseille": return "#0098D6"; case "Lyon": return "#DA291C"; case "Monaco": return "#E41E2A"; case "Lille": return "#E21C24"; case "Nice": return "#ED1C24"; default: return "#777777"; } }

    // --- Stadium Data (bez zmian) ---
    const stadiumsData = [ { name: "Anfield", image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png" } ];

    // --- INICJALIZACJA GRY (bez zmian w logice, tylko wywołanie resize) ---
     function initGame() { /* ... (bez zmian) ... */ canvas = document.getElementById("gameCanvas"); if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; } ctx = canvas.getContext("2d"); canvas.width = 640; canvas.height = 400; resizeCanvas(); ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" }; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; score.home = 0; score.away = 0; updateScoreboard(); console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`); }
     function resetPositionsAfterGoal(homeJustScored) { /* ... (bez zmian) ... */ if (!canvas || !ball) return; ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.vx = 0; ball.vy = 0; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; gameAnimating = false; setTimeout(() => { gameAnimating = true; requestAnimationFrame(gameLoop); }, 1200); }


    // --- FUNKCJE RYSOWANIA ---
     function drawField() {
         if (!ctx || !canvas) return;

         // ZMIANA: Ustaw kolor wypełnienia na zielony
         ctx.fillStyle = "#228B22"; // ForestGreen
         // Alternatywy: "#1E8449", "#5C946E"

         // Narysuj prostokąt murawy wypełniający cały obszar canvas
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         // === DODANO: Rysowanie linii boiska ===
         ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Półprzezroczyste białe linie (nieco jaśniejsze)
         ctx.lineWidth = 2;
         ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Do punktów karnych

         // Linia środkowa
         ctx.beginPath();
         ctx.moveTo(canvas.width / 2, 0);
         ctx.lineTo(canvas.width / 2, canvas.height);
         ctx.stroke();

         // Koło środkowe
         ctx.beginPath();
         ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2); // Promień 50px
         ctx.stroke();

         // Punkt środkowy
         ctx.beginPath();
         ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
         ctx.fill();

         // Wymiary pól (w pikselach, dostosowane do canvas 640x400)
         const penaltyAreaWidth = 105; // Szerokość pola karnego (od linii końcowej)
         const penaltyAreaHeight = 260; // Wysokość pola karnego
         const goalAreaWidth = 35;      // Szerokość pola bramkowego
         const goalAreaHeight = 110;     // Wysokość pola bramkowego
         const penaltySpotDist = 70;     // Odległość punktu karnego od linii końcowej
         const penaltyArcRadius = 55;    // Promień łuku pola karnego

         const penaltyAreaTopY = (canvas.height - penaltyAreaHeight) / 2;
         const goalAreaTopY = (canvas.height - goalAreaHeight) / 2;

         // Pole karne lewe
         ctx.strokeRect(0, penaltyAreaTopY, penaltyAreaWidth, penaltyAreaHeight);
         // Pole karne prawe
         ctx.strokeRect(canvas.width - penaltyAreaWidth, penaltyAreaTopY, penaltyAreaWidth, penaltyAreaHeight);

         // Pole bramkowe lewe
         ctx.strokeRect(0, goalAreaTopY, goalAreaWidth, goalAreaHeight);
         // Pole bramkowe prawe
         ctx.strokeRect(canvas.width - goalAreaWidth, goalAreaTopY, goalAreaWidth, goalAreaHeight);

         // Punkt karny lewy
         ctx.beginPath();
         ctx.arc(penaltySpotDist, canvas.height / 2, 3, 0, Math.PI * 2);
         ctx.fill();
         // Punkt karny prawy
         ctx.beginPath();
         ctx.arc(canvas.width - penaltySpotDist, canvas.height / 2, 3, 0, Math.PI * 2);
         ctx.fill();

        // Łuk pola karnego lewy
         ctx.beginPath();
         ctx.arc(penaltySpotDist, canvas.height / 2, penaltyArcRadius, -Math.PI * 0.34, Math.PI * 0.34); // Kąty dobrane eksperymentalnie
         ctx.stroke();
         // Łuk pola karnego prawy
         ctx.beginPath();
         ctx.arc(canvas.width - penaltySpotDist, canvas.height / 2, penaltyArcRadius, Math.PI - Math.PI * 0.34, Math.PI + Math.PI * 0.34);
         ctx.stroke();

         // Bramki (proste słupki, można usunąć jeśli niepotrzebne)
        const goalPostWidth = 5; // Szerokość słupka
        const goalVisualHeight = 80; // Wysokość wizualna bramki
        const goalVisualTopY = canvas.height / 2 - goalVisualHeight / 2;
        const goalVisualBottomY = canvas.height / 2 + goalVisualHeight / 2;

        ctx.fillStyle = "#FFFFFF"; // Białe słupki
        // Lewy słupek
        ctx.fillRect(0, goalVisualTopY, goalPostWidth, goalVisualHeight);
        // Prawy słupek
        ctx.fillRect(canvas.width - goalPostWidth, goalVisualTopY, goalPostWidth, goalVisualHeight);
     }

     function drawGameObjects() { /* ... (bez zmian) ... */ if (!ctx || !ball) return; const drawPlayer = (player) => { if (!player) return; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2); ctx.fillStyle = player.color; ctx.fill(); ctx.strokeStyle = "#333"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.closePath(); }; fieldPlayers.forEach(drawPlayer); fieldPlayersAway.forEach(drawPlayer); drawPlayer(goalkeeper); drawPlayer(goalkeeperAway); ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fillStyle = ball.color; ctx.fill(); ctx.strokeStyle = "black"; ctx.lineWidth = 1; ctx.stroke(); ctx.closePath(); if (isDragging && draggingPlayerIndex !== null) { drawPullLine(); } }
     function drawPullLine() { /* ... (bez zmian) ... */ if (!ctx) return; ctx.save(); let startPoint; if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { startPoint = fieldPlayers[draggingPlayerIndex]; } else if (draggingPlayerIndex === -1 && goalkeeper) { startPoint = goalkeeper; } else { ctx.restore(); return; } ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(dragCurrentCanvas.x, dragCurrentCanvas.y); ctx.stroke(); let dx = startPoint.x - dragCurrentCanvas.x; let dy = startPoint.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); if (pullLength > 5) { let arrowEndX = startPoint.x + dx * pullScale * 0.5; let arrowEndY = startPoint.y + dy * pullScale * 0.5; ctx.setLineDash([]); let red = Math.floor(255 * pullScale); let green = Math.floor(255 * (1 - pullScale)); ctx.strokeStyle = `rgba(${red}, ${green}, 0, 0.9)`; ctx.lineWidth = 3 + 2 * pullScale; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(arrowEndX, arrowEndY); ctx.stroke(); drawArrowhead(ctx, startPoint.x, startPoint.y, arrowEndX, arrowEndY, 8 + 4 * pullScale); } ctx.restore(); }
     function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { /* ... (bez zmian) ... */ var angle = Math.atan2(toy - fromy, tox - fromx); context.beginPath(); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6)); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6)); context.stroke(); }

    // --- FUNKCJE FIZYKI I KOLIZJI (bez zmian) ---
     function updatePositions() { /* ... (bez zmian) ... */ if (!canvas || !ball) return; const allMovables = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway, ball]; const borderMargin = 0; allMovables.forEach(obj => { if (!obj) return; obj.x += obj.vx; obj.y += obj.vy; let currentFriction = (obj === ball) ? FRICTION : FRICTION * PLAYER_FRICTION; obj.vx *= currentFriction; obj.vy *= currentFriction; if (Math.hypot(obj.vx, obj.vy) < 0.1) { obj.vx = 0; obj.vy = 0; } const restitution = -0.4; if (obj.x - obj.radius < borderMargin) { obj.x = borderMargin + obj.radius; obj.vx *= restitution; } if (obj.x + obj.radius > canvas.width - borderMargin) { obj.x = canvas.width - borderMargin - obj.radius; obj.vx *= restitution; } if (obj.y - obj.radius < borderMargin) { obj.y = borderMargin + obj.radius; obj.vy *= restitution; } if (obj.y + obj.radius > canvas.height - borderMargin) { obj.y = canvas.height - borderMargin - obj.radius; obj.vy *= restitution; } }); confineGoalkeeper(goalkeeper, true); confineGoalkeeper(goalkeeperAway, false); checkGoal(); }
     function confineGoalkeeper(gk, isHomeTeam) { /* ... (bez zmian) ... */ if (!gk || !canvas) return; const goalHeight = 80; const penaltyBoxWidth = 105; const goalTop = canvas.height / 2 - goalHeight / 2; const goalBottom = canvas.height / 2 + goalHeight / 2; gk.y = Math.max(goalTop + gk.radius, Math.min(goalBottom - gk.radius, gk.y)); if (isHomeTeam) { const penaltyAreaFront = penaltyBoxWidth; gk.x = Math.max(0 + gk.radius, Math.min(penaltyAreaFront - gk.radius, gk.x)); } else { const penaltyAreaFront = canvas.width - penaltyBoxWidth; gk.x = Math.max(penaltyAreaFront + gk.radius, Math.min(canvas.width - gk.radius, gk.x)); } }
     function checkGoal() { /* ... (bez zmian, używa wysokości bramki wizualnej) ... */ if (!ball || !canvas) return; const goalHeight = 80; const goalLineYTop = canvas.height/2 - goalHeight/2; const goalLineYBottom = canvas.height/2 + goalHeight/2; const goalPostRestitution = -0.5 * COLLISION_RESTITUTION; if (ball.x - ball.radius < 0) { if (ball.y > goalLineYTop && ball.y < goalLineYBottom) { console.log("GOL DLA GOŚCI!"); score.away++; updateScoreboard(); resetPositionsAfterGoal(false); } else { ball.x = ball.radius; ball.vx *= goalPostRestitution; } } if (ball.x + ball.radius > canvas.width) { if (ball.y > goalLineYTop && ball.y < goalLineYBottom) { console.log("GOL DLA GOSPODARZY!"); score.home++; updateScoreboard(); resetPositionsAfterGoal(true); } else { ball.x = canvas.width - ball.radius; ball.vx *= goalPostRestitution; } } }
     function circleCollision(c1, c2) { /* ... (bez zmian) ... */ if (!c1 || !c2) return false; const dx = c1.x - c2.x; const dy = c1.y - c2.y; const distance = Math.hypot(dx, dy); const radiiSum = c1.radius + c2.radius; return distance < radiiSum; }
     function resolveCollision(obj1, obj2) { /* ... (bez zmian) ... */ if (!obj1 || !obj2) return; const dx = obj2.x - obj1.x; const dy = obj2.y - obj1.y; const distance = Math.hypot(dx, dy); const radiiSum = obj1.radius + obj2.radius; const overlap = radiiSum - distance; if (overlap > 0 && distance > 0.01) { const nx = dx / distance; const ny = dy / distance; const moveCorrection = overlap / 2; obj1.x -= nx * moveCorrection; obj1.y -= ny * moveCorrection; obj2.x += nx * moveCorrection; obj2.y += ny * moveCorrection; const dvx = obj1.vx - obj2.vx; const dvy = obj1.vy - obj2.vy; const dotProduct = dvx * nx + dvy * ny; if (dotProduct < 0) { let restitution = (obj1 !== ball && obj2 !== ball) ? PLAYER_COLLISION_RESTITUTION : COLLISION_RESTITUTION; const mass1 = (obj1 === ball) ? 0.5 : 1.0; const mass2 = (obj2 === ball) ? 0.5 : 1.0; const invMassSum = (1 / mass1) + (1 / mass2); let impulse = (-(1 + restitution) * dotProduct) / invMassSum; obj1.vx += (impulse / mass1) * nx; obj1.vy += (impulse / mass1) * ny; obj2.vx -= (impulse / mass2) * nx; obj2.vy -= (impulse / mass2) * ny; if (obj1 === ball || obj2 === ball) { ball.vx *= BALL_COLLISION_BOOST; ball.vy *= BALL_COLLISION_BOOST; } } } }
     function checkCollisions() { /* ... (bez zmian) ... */ if (!ball) return; const allPlayers = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway].filter(p => p); const allObjects = [...allPlayers, ball]; for (let i = 0; i < allObjects.length; i++) { for (let j = i + 1; j < allObjects.length; j++) { if (circleCollision(allObjects[i], allObjects[j])) { resolveCollision(allObjects[i], allObjects[j]); } } } }

    // --- SZTUCZNA INTELIGENCJA (AI) (bez zmian) ---
    function aiMove() { /* ... (bez zmian) ... */ if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return; const goalX = 10; const goalY = canvas.height / 2; goalkeeperAway.vx *= 0.8; goalkeeperAway.vy *= 0.8; if (ball.x > canvas.width * 0.5) { let dyGK = ball.y - goalkeeperAway.y; if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) { goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.1; } if (ball.x > canvas.width * 0.7) { let dxGK = ball.x - goalkeeperAway.x; goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.05; } } else { let dyToCenter = (canvas.height / 2) - goalkeeperAway.y; if (Math.abs(dyToCenter) > 5) { goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.05; } let dxToDefaultPos = (canvas.width - 40) - goalkeeperAway.x; if (Math.abs(dxToDefaultPos) > 5) { goalkeeperAway.vx += Math.sign(dxToDefaultPos) * AI_GOALKEEPER_SPEED * 0.03; } } goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx)); goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy)); let closestPlayerIndex = -1; let minDistSq = Infinity; let playerWithBall = null; fieldPlayersAway.forEach((player, index) => { if (!player) return; let dx = ball.x - player.x; let dy = ball.y - player.y; let distSq = dx * dx + dy * dy; if (distSq < minDistSq) { minDistSq = distSq; closestPlayerIndex = index; } if (distSq < Math.pow(player.radius + ball.radius + 2, 2)) { playerWithBall = player; } }); fieldPlayersAway.forEach((player, index) => { if (!player) return; let dxToBall = ball.x - player.x; let dyToBall = ball.y - player.y; let distToBallSq = dxToBall * dxToBall + dyToBall * dyToBall; let distToBall = Math.sqrt(distToBallSq); if (player === playerWithBall) { let dxToGoal = goalX - player.x; let dyToGoal = goalY - player.y; let distToGoal = Math.hypot(dxToGoal, dyToGoal); let angleToGoal = Math.atan2(dyToGoal, dxToGoal); let canShoot = player.x > canvas.width * 0.4; if (canShoot && Math.random() < 0.4) { let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2; let power = AI_REACTION_POWER * (0.8 + Math.random() * 0.4); player.vx += Math.cos(shootAngle) * power * 0.1; player.vy += Math.sin(shootAngle) * power * 0.1; console.log("AI Shot!"); } else { let dribbleAngle = angleToGoal; let power = AI_REACTION_POWER * 0.3; fieldPlayersAway.forEach(otherPlayer => { if (player === otherPlayer) return; let dxOther = otherPlayer.x - player.x; let dyOther = otherPlayer.y - player.y; let distOtherSq = dxOther*dxOther + dyOther*dyOther; if (distOtherSq < Math.pow(PLAYER_RADIUS * 4, 2)) { dribbleAngle -= Math.sign(dxOther * dyToGoal - dyOther * dxToGoal) * 0.2; } }); player.vx += Math.cos(dribbleAngle) * power * 0.1; player.vy += Math.sin(dribbleAngle) * power * 0.1; } } else if (index === closestPlayerIndex && distToBallSq < AI_INTERCEPT_RADIUS_SQ) { let interceptPower = AI_REACTION_POWER * 0.4 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ)); if (distToBall > 0) { player.vx += (dxToBall / distToBall) * interceptPower * 0.1; player.vy += (dyToBall / distToBall) * interceptPower * 0.1; } } else { let targetX, targetY; switch(index) { case 0: targetX = canvas.width * 0.80; targetY = canvas.height * 0.25; break; case 1: targetX = canvas.width * 0.80; targetY = canvas.height * 0.75; break; case 2: targetX = canvas.width * 0.65; targetY = canvas.height * 0.40; break; case 3: targetX = canvas.width * 0.65; targetY = canvas.height * 0.60; break; default: targetX = canvas.width * 0.7; targetY = canvas.height * 0.5; } let dxToPos = targetX - player.x; let dyToPos = targetY - player.y; let distToPos = Math.hypot(dxToPos, dyToPos); let positionPower = AI_REACTION_POWER * 0.05; if (distToPos > PLAYER_RADIUS) { player.vx += (dxToPos / distToPos) * positionPower * 0.1; player.vy += (dyToPos / distToPos) * positionPower * 0.1; } } const maxAiSpeed = 5.0; const currentSpeed = Math.hypot(player.vx, player.vy); if (currentSpeed > maxAiSpeed) { player.vx = (player.vx / currentSpeed) * maxAiSpeed; player.vy = (player.vy / currentSpeed) * maxAiSpeed; } }); }


    // --- PĘTLA GŁÓWNA GRY (bez zmian) ---
    function gameLoop() {
         if (!gameAnimating || !ctx) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         drawField(); // Rysowanie zielonej murawy i linii
         updatePositions();
         checkCollisions();
         aiMove();
         drawGameObjects(); // Rysowanie graczy, piłki itp.
         requestAnimationFrame(gameLoop);
     }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE) (bez zmian) ---
     function getMousePos(canvas, evt) { /* ... (bez zmian) ... */ if (!canvas) return { x: 0, y: 0 }; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY }; }
     function canvasMouseDown(e) { /* ... (bez zmian) ... */ if (!canvas || !gameAnimating) return; const pos = getMousePos(canvas, e); for (let i = 0; i < fieldPlayers.length; i++) { const p = fieldPlayers[i]; if (p && Math.hypot(pos.x - p.x, pos.y - p.y) < PLAYER_RADIUS + 5) { draggingPlayerIndex = i; isDragging = true; dragStartCanvas = { x: p.x, y: p.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } } if (goalkeeper && Math.hypot(pos.x - goalkeeper.x, pos.y - goalkeeper.y) < GOALKEEPER_RADIUS + 5) { draggingPlayerIndex = -1; isDragging = true; dragStartCanvas = { x: goalkeeper.x, y: goalkeeper.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } }
     function canvasMouseMove(e) { /* ... (bez zmian) ... */ if (!isDragging || !canvas || !gameAnimating) return; dragCurrentCanvas = getMousePos(canvas, e); }
     function canvasMouseUp(e) { /* ... (bez zmian) ... */ if (!isDragging || draggingPlayerIndex === null || !canvas || !gameAnimating) return; const dx = dragStartCanvas.x - dragCurrentCanvas.x; const dy = dragStartCanvas.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); if (pullLength < 3) { isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; return; } let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); const baseImpulse = pullLength * DRAG_IMPULSE_SCALE * pullScale; const impulseX = (dx / (pullLength || 1)) * baseImpulse; const impulseY = (dy / (pullLength || 1)) * baseImpulse; if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { fieldPlayers[draggingPlayerIndex].vx = impulseX; fieldPlayers[draggingPlayerIndex].vy = impulseY; } else if (draggingPlayerIndex === -1 && goalkeeper) { goalkeeper.vx = impulseX * 0.6; goalkeeper.vy = impulseY * 0.6; } isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; }
     function canvasMouseLeave(e) { /* ... (bez zmian) ... */ if (isDragging) { isDragging = false; draggingPlayerIndex = null; if (canvas) canvas.style.cursor = 'grab'; } }
     function addCanvasEvents() { /* ... (bez zmian) ... */ if (!canvas) return; canvas.addEventListener("mousedown", canvasMouseDown); canvas.addEventListener("mousemove", canvasMouseMove); canvas.addEventListener("mouseup", canvasMouseUp); canvas.addEventListener("mouseleave", canvasMouseLeave); }

    // --- WYBÓR DRUŻYN / STADIONU (bez zmian) ---
     function populateTeamSelections() { /* ... (bez zmian) ... */ const homeContainer = document.getElementById("homeTeamContainer"); const awayContainer = document.getElementById("awayTeamContainer"); if (!homeContainer || !awayContainer) return; homeContainer.innerHTML = ""; awayContainer.innerHTML = ""; selectedHomeTeam = null; selectedAwayTeam = null; Object.keys(teamsData).forEach(league => { const leagueData = teamsData[league]; const createLeagueSection = (targetContainer, isHome) => { let leagueDiv = document.createElement("div"); leagueDiv.className = "league-section"; let leagueHeader = document.createElement("div"); leagueHeader.className = "league-header"; let leagueLogo = document.createElement("img"); leagueLogo.src = leagueData.leagueLogo; leagueLogo.alt = league; leagueLogo.style.width = "24px"; leagueLogo.style.marginRight = "8px"; let leagueName = document.createElement("span"); leagueName.innerText = league; leagueHeader.appendChild(leagueLogo); leagueHeader.appendChild(leagueName); leagueDiv.appendChild(leagueHeader); let teamInnerContainer = document.createElement("div"); teamInnerContainer.style.display = "flex"; teamInnerContainer.style.flexWrap = "wrap"; teamInnerContainer.style.gap = "10px"; teamInnerContainer.style.marginTop = "10px"; leagueData.teams.forEach(team => { let teamDiv = document.createElement("div"); teamDiv.className = "team-option"; teamDiv.dataset.team = team.name; teamDiv.innerHTML = `<img src="${team.logo}" alt="${team.name}" title="${team.name}" style="width: 40px; height: 40px; object-fit: contain;" /><p style="font-size: 0.7em; margin-top: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 50px;">${team.name}</p>`; teamDiv.style.cursor = "pointer"; teamDiv.style.padding = "5px"; teamDiv.style.border = "1px solid transparent"; teamDiv.style.borderRadius = "4px"; teamDiv.style.display = "flex"; teamDiv.style.flexDirection = "column"; teamDiv.style.alignItems = "center"; teamDiv.style.width = "60px"; teamDiv.addEventListener("click", function () { Array.from(targetContainer.querySelectorAll('.team-option.selected')).forEach(el => { el.classList.remove("selected"); el.style.borderColor = "transparent"; el.style.backgroundColor = ""; }); this.classList.add("selected"); this.style.borderColor = "#007bff"; this.style.backgroundColor = "rgba(0, 123, 255, 0.1)"; if (isHome) selectedHomeTeam = team.name; else selectedAwayTeam = team.name; console.log(`${isHome ? 'Home' : 'Away'} selected: ${team.name}`); }); teamInnerContainer.appendChild(teamDiv); }); leagueDiv.appendChild(teamInnerContainer); targetContainer.appendChild(leagueDiv); }; createLeagueSection(homeContainer, true); createLeagueSection(awayContainer, false); }); }
    function populateStadiumSelection() { /* ... (bez zmian) ... */ const stadiumContainer = document.getElementById("stadiumContainer"); const startButton = document.getElementById("startMatchFromStadiumBtn"); if (!stadiumContainer || !startButton) { console.error("Stadium container or start button not found!"); return; } stadiumContainer.innerHTML = ""; selectedStadium = null; startButton.disabled = true; stadiumsData.forEach(stadium => { let stadiumDiv = document.createElement("div"); stadiumDiv.className = "stadium-option team-option"; stadiumDiv.dataset.stadium = stadium.name; stadiumDiv.innerHTML = `<img src="${stadium.image}" alt="${stadium.name}" title="${stadium.name}" style="width: 80px; height: 50px; object-fit: cover; margin-bottom: 5px;" /><p style="font-size: 0.8em; text-align: center;">${stadium.name}</p>`; stadiumDiv.style.cursor = "pointer"; stadiumDiv.style.padding = "10px"; stadiumDiv.style.border = "1px solid transparent"; stadiumDiv.style.borderRadius = "4px"; stadiumDiv.style.display = "flex"; stadiumDiv.style.flexDirection = "column"; stadiumDiv.style.alignItems = "center"; stadiumDiv.style.width = "100px"; stadiumDiv.addEventListener("click", function() { Array.from(stadiumContainer.querySelectorAll('.stadium-option.selected')).forEach(el => { el.classList.remove("selected"); el.style.borderColor = "transparent"; el.style.backgroundColor = ""; }); this.classList.add("selected"); this.style.borderColor = "#007bff"; this.style.backgroundColor = "rgba(0, 123, 255, 0.1)"; selectedStadium = stadium.name; console.log("Selected stadium:", selectedStadium); startButton.disabled = false; }); stadiumContainer.appendChild(stadiumDiv); }); stadiumContainer.style.display = "flex"; stadiumContainer.style.flexWrap = "wrap"; stadiumContainer.style.gap = "15px"; stadiumContainer.style.justifyContent = "center"; }

    // --- FUNKCJE USTAWIEŃ (bez zmian) ---
     const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); function applyFontSize(size) { /* ... (bez zmian) ... */ if (!['small', 'medium', 'large'].includes(size)) { size = 'medium'; } document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large'); document.body.classList.add(`font-size-${size}`); localStorage.setItem('gameFontSize', size); fontSizeOptions.forEach(button => { if (button) { button.classList.remove('active-size'); if (button.dataset.size === size) { button.classList.add('active-size'); } } }); console.log("Zastosowano rozmiar czcionki:", size); } function loadFontSize() { /* ... (bez zmian) ... */ const savedSize = localStorage.getItem('gameFontSize') || 'medium'; applyFontSize(savedSize); }

     // --- FUNKCJE POMOCNICZE MODALI (bez zmian) ---
      function openModal(modalElement) { if(modalElement) modalElement.classList.remove('hidden'); } function closeModal(modalElement) { if(modalElement) modalElement.classList.add('hidden'); }

    // --- SKALOWANIE CANVAS (bez zmian) ---
     function resizeCanvas() { /* ... (bez zmian) ... */ if (!canvas) return; const gameContainer = canvas.parentElement; if (!gameContainer) return; const canvasLogicalWidth = 640; const canvasLogicalHeight = 400; const aspectRatio = canvasLogicalWidth / canvasLogicalHeight; const availableWidth = gameContainer.clientWidth * 0.98; const availableHeight = window.innerHeight - 150; let newWidth = availableWidth; let newHeight = newWidth / aspectRatio; if (newHeight > availableHeight) { newHeight = availableHeight; newWidth = newHeight * aspectRatio; } canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`; canvas.width = canvasLogicalWidth; canvas.height = canvasLogicalHeight; console.log(`Canvas resized: CSS ${newWidth}x${newHeight}, Logical ${canvas.width}x${canvas.height}`); }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         // DODANO: Ustawienie tła dla startScreen przy pierwszym ładowaniu
         if (startScreen) {
             startScreen.classList.add('start-screen-background');
         } else {
             console.error("Nie znaleziono elementu startScreen!");
         }


         // Referencje do przycisków i elementów UI
         const startMatchBtn = document.getElementById("startMatchBtn");
         const goToStadiumSelectBtn = document.getElementById("goToStadiumSelectBtn");
         const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn");
         const backToStartBtn = document.getElementById("backToStartBtn");
         const backToMenuFromSelect = document.getElementById("backToMenuFromSelect");
         const backToTeamSelectBtn = document.getElementById("backToTeamSelectBtn");
         // ... (reszta referencji bez zmian) ...
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
             // ZMIANA: Usuń tło ze startScreen przed jego ukryciem
             if(startScreen) startScreen.classList.remove('start-screen-background');
             closeModal(startScreen);
             openModal(teamSelectScreen);
             try {
                populateTeamSelections();
             } catch (error) {
                 console.error("Błąd podczas populateTeamSelections:", error);
             }
         });

         // Wybór Drużyny -> Start
         if (backToMenuFromSelect) backToMenuFromSelect.addEventListener("click", () => {
             closeModal(teamSelectScreen);
             openModal(startScreen);
             // ZMIANA: Przywróć tło dla startScreen
             if(startScreen) startScreen.classList.add('start-screen-background');
         });

         // Wybór Drużyny -> Wybór Stadionu (bez zmian w logice tła)
         if (goToStadiumSelectBtn) goToStadiumSelectBtn.addEventListener("click", () => { if (!selectedHomeTeam || !selectedAwayTeam) { alert("Proszę wybrać obie drużyny!"); return; } if (selectedHomeTeam === selectedAwayTeam) { alert("Drużyny muszą być różne!"); return; } closeModal(teamSelectScreen); openModal(stadiumSelectScreen); populateStadiumSelection(); });

         // Wybór Stadionu -> Wybór Drużyny (bez zmian w logice tła)
         if (backToTeamSelectBtn) backToTeamSelectBtn.addEventListener("click", () => { closeModal(stadiumSelectScreen); openModal(teamSelectScreen); });

         // Wybór Stadionu -> Rozpocznij Mecz (Ekran Gry)
         if (startMatchFromStadiumBtn) startMatchFromStadiumBtn.addEventListener("click", () => {
             if (!selectedStadium) { alert("Proszę wybrać stadion!"); return; }
             const stadiumData = stadiumsData.find(s => s.name === selectedStadium);
             if (stadiumData && stadiumData.image) {
                 // Ustaw tło stadionu na body
                 document.body.style.backgroundImage = `url('${stadiumData.image}')`;
                 document.body.style.backgroundSize = "cover";
                 document.body.style.backgroundPosition = "center center";
                 document.body.style.backgroundRepeat = "no-repeat";
                 document.body.style.backgroundAttachment = "fixed";
             } else {
                 document.body.style.backgroundImage = '';
             }
             closeModal(stadiumSelectScreen);
             openModal(gameScreen);
             initGame();
             addCanvasEvents();
             resizeCanvas(); // Ważne, aby wywołać po initGame i pokazaniu ekranu
             startTimer();
             gameAnimating = true;
             requestAnimationFrame(gameLoop);
         });

         // Ekran Gry -> Start (Powrót do menu)
         if (backToStartBtn) backToStartBtn.addEventListener("click", () => {
             gameAnimating = false;
             stopTimer();
             closeModal(gameScreen);
             openModal(startScreen);
             // ZMIANA: Przywróć tło dla startScreen
             if(startScreen) startScreen.classList.add('start-screen-background');
             document.body.style.backgroundImage = ''; // Usuń tło stadionu z body
             resetGameFull();
         });

         // --- Nasłuchiwacze zdarzeń (Przyciski Modali) (bez zmian) ---
         if(btnPlayerDB) btnPlayerDB.addEventListener("click", () => openModal(playerDBModal)); if(btnLanguage) btnLanguage.addEventListener("click", () => openModal(languageModal)); if(btnSettings) btnSettings.addEventListener("click", () => { openModal(settingsModal); const currentSize = localStorage.getItem('gameFontSize') || 'medium'; fontSizeOptions.forEach(button => { if(button) button.classList.toggle('active-size', button.dataset.size === currentSize); }); }); if(closePlayerDBBtn) closePlayerDBBtn.addEventListener("click", () => closeModal(playerDBModal)); if(closeLanguageModalBtn) closeLanguageModalBtn.addEventListener("click", () => closeModal(languageModal)); if(closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));

         // --- Nasłuchiwacze zdarzeń (Opcje Ustawień) (bez zmian) ---
         fontSizeOptions.forEach(button => { if(button) button.addEventListener('click', () => applyFontSize(button.dataset.size)); });
         if(addPlayerForm) addPlayerForm.addEventListener("submit", (e) => { e.preventDefault(); const nameInput = document.getElementById("playerName"); const teamInput = document.getElementById("playerTeam"); const ratingInput = document.getElementById("playerRating"); const name = nameInput ? nameInput.value : null; const team = teamInput ? teamInput.value : null; const rating = ratingInput ? ratingInput.value : null; if(name && team && rating){ console.log("Dodawanie gracza:", { name, team, rating }); const playerListDiv = document.getElementById("playerList"); if(playerListDiv){ const newPlayerEntry = document.createElement('p'); newPlayerEntry.textContent = `${name} (${team}) - Ocena: ${rating}`; playerListDiv.appendChild(newPlayerEntry); } e.target.reset(); } else { console.warn("Formularz dodawania gracza: brakuje danych"); alert("Proszę wypełnić wszystkie pola!"); } });
         langOptions.forEach(button => { if(button) button.addEventListener("click", () => { const lang = button.dataset.lang; console.log("Zmieniono język na:", lang); alert(`Język zmieniony na: ${lang} (funkcjonalność do implementacji)`); closeModal(languageModal); }); });


         console.log("MiniSoccer - Inicjalizacja zakończona. Wersja z zieloną murawą, liniami i tłem menu.");
         resizeCanvas(); // Inicjalne wywołanie resize
     });

})(); // Koniec IIFE

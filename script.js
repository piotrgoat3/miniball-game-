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
    const teamsData = { /* ... (bez zmian - cała długa lista klubów) ... */ "Premier League": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg", teams: [ { name: "Manchester United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" }, { name: "Manchester City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" }, { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" }, { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" }, { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" }, { name: "Tottenham Hotspur", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" } ] }, "La Liga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/9/90/LaLiga.svg", teams: [ { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" }, { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" }, { name: "Atletico Madrid", logo: "https://brandlogos.net/wp-content/uploads/2021/09/atltico-madrid-logo.png" }, { name: "Sevilla", logo: "https://cdn.freebiesupply.com/logos/large/2x/sevilla-fc-logo-png-transparent.png" }, { name: "Valencia", logo: "https://brandlogos.net/wp-content/uploads/2014/10/valencia_cf-logo_brandlogos.net_iaffl-512x674.png" }, { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/1200px-Villarreal_CF_logo-en.svg.png" } ] }, "Serie A": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg", teams: [ { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Juventus_Logo.png" }, { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" }, { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/653px-Logo_of_AC_Milan.svg.png" }, { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Neapel.svg/1200px-SSC_Neapel.svg.png" }, { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/sco/7/7d/AS_Roma%27s_logo_from_2017.png" }, { name: "Lazio", logo: "https://static.cdnlogo.com/logos/s/89/ss-lazio.png" } ] }, "Bundesliga": { leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo_(2017).svg", teams: [ { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2017).svg/2048px-FC_Bayern_M%C3%BCnchen_logo_(2017).svg.png" }, { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Borussia_Dortmund.png" }, { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/1200px-RB_Leipzig_2014_logo.svg.png" }, { name: "Bayer Leverkusen", logo: "https://cdn.freebiesupply.com/logos/large/2x/bayer-leverkusen-logo-png-transparent.png" }, { name: "Eintracht Frankfurt", logo: "https://logodownload.org/wp-content/uploads/2019/11/eintracht-frankfurt-logo.png" }, { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/1200px-Borussia_M%C3%B6nchengladbach_logo.svg.png" } ] }, "Ligue 1": { leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Ligue_1.svg", teams: [ { name: "Paris Saint-Germain", logo: "https://logos-world.net/wp-content/uploads/2020/07/PSG-Logo.png" }, { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/1582px-Olympique_Marseille_logo.svg.png" }, { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Olympique_Lyonnais_logo.svg/1200px-Olympique_Lyonnais_logo.svg.png" }, { name: "Monaco", logo: "https://logodownload.org/wp-content/uploads/2019/09/monaco-fc-logo-1.png" }, { name: "Lille", logo: "https://logodownload.org/wp-content/uploads/2019/09/lille-logo-1.png" }, { name: "Nice", logo: "https://1000logos.net/wp-content/uploads/2020/09/Nice-logo.png" } ] } };
    function getTeamColor(teamName) { switch(teamName) { case "Manchester United": return "#DA291C"; case "Manchester City": return "#6CABDD"; case "Liverpool": return "#C8102E"; case "Chelsea": return "#034694"; case "Arsenal": return "#EF0107"; case "Tottenham Hotspur": return "#132257"; case "Real Madrid": return "#FEBE10"; case "Barcelona": return "#A50044"; case "Atletico Madrid": return "#CB3524"; case "Sevilla": return "#EC1C24"; case "Valencia": return "#FF8200"; case "Villarreal": return "#FDB913"; case "Juventus": return "#000000"; case "Inter Milan": return "#004D98"; case "AC Milan": return "#DC052D"; case "Napoli": return "#12A0D7"; case "Roma": return "#8E1F2F"; case "Lazio": return "#85B8D0"; case "Bayern Munich": return "#DC052D"; case "Borussia Dortmund": return "#FDE100"; case "RB Leipzig": return "#00AEEF"; case "Bayer Leverkusen": return "#E32221"; case "Eintracht Frankfurt": return "#000000"; case "Borussia Mönchengladbach": return "#000000"; case "Paris Saint-Germain": return "#004170"; case "Marseille": return "#0098D6"; case "Lyon": return "#DA291C"; case "Monaco": return "#E41E2A"; case "Lille": return "#E21C24"; case "Nice": return "#ED1C24"; default: return "#777777"; } }

    // --- NEW: Stadium Data ---
    const stadiumsData = [
        {
            name: "Anfield",
            image: "46e2051f-681e-49d9-b519-7f2d7d297d72.png"
        }
    ];

    // --- INICJALIZACJA GRY ---
     function initGame() { /* ... (bez zmian od ostatniej wersji) ... */ canvas = document.getElementById("gameCanvas"); if (!canvas) { console.error("Nie znaleziono elementu canvas!"); return; } ctx = canvas.getContext("2d"); canvas.width = 640; canvas.height = 400; resizeCanvas(); ball = { x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS, vx: 0, vy: 0, color: "white" }; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; score.home = 0; score.away = 0; updateScoreboard(); console.log(`Match started: ${selectedHomeTeam} vs ${selectedAwayTeam} at ${selectedStadium || 'Default Stadium'}`); }
     function resetPositionsAfterGoal(homeJustScored) { /* ... (bez zmian od ostatniej wersji) ... */ if (!canvas || !ball) return; ball.x = canvas.width / 2; ball.y = canvas.height / 2; ball.vx = 0; ball.vy = 0; let homeColor = getTeamColor(selectedHomeTeam); let awayColor = getTeamColor(selectedAwayTeam); const gkColor = '#CCCCCC'; fieldPlayers = [ { x: canvas.width * 0.20, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.20, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor }, { x: canvas.width * 0.35, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } ]; fieldPlayersAway = [ { x: canvas.width * 0.80, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.80, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.40, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor }, { x: canvas.width * 0.65, y: canvas.height * 0.60, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } ]; goalkeeper = { x: 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; goalkeeperAway = { x: canvas.width - 40, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: gkColor }; gameAnimating = false; setTimeout(() => { gameAnimating = true; requestAnimationFrame(gameLoop); }, 1200); }


    // --- FUNKCJE RYSOWANIA ---

     // === ZMIANA: Funkcja drawField teraz nic nie rysuje ===
     // Polegamy na obrazku tła dla wyglądu murawy i linii
     function drawField() {
         if (!ctx) return;
         // Celowo puste - nie rysujemy już zielonego tła ani białych linii
         // ctx.fillStyle = "#2A9D8F"; // USUNIĘTE
         // ctx.fillRect(0, 0, canvas.width, canvas.height); // USUNIĘTE
         // Wszystkie linie ctx.strokeRect, ctx.beginPath, ctx.arc, ctx.moveTo, ctx.lineTo, ctx.stroke, ctx.fill - USUNIĘTE
     }

     // Funkcja drawGameObjects rysuje tylko piłkarzy, piłkę i linię przeciągania
     function drawGameObjects() {
         if (!ctx || !ball) return;
         const drawPlayer = (player) => {
             if (!player) return;
             ctx.beginPath();
             ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
             ctx.fillStyle = player.color;
             ctx.fill();
             ctx.strokeStyle = "#333"; // Ciemny kontur dla lepszej widoczności
             ctx.lineWidth = 1.5;      // Nieco grubszy kontur
             ctx.stroke();
             ctx.closePath();
         };

         // Rysowanie graczy
         fieldPlayers.forEach(drawPlayer);
         fieldPlayersAway.forEach(drawPlayer);
         drawPlayer(goalkeeper);
         drawPlayer(goalkeeperAway);

         // Rysowanie piłki
         ctx.beginPath();
         ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
         ctx.fillStyle = ball.color;
         ctx.fill();
         ctx.strokeStyle = "black"; // Czarny kontur piłki
         ctx.lineWidth = 1;
         ctx.stroke();
         ctx.closePath();

         // Rysowanie linii przeciągania, jeśli aktywna
         if (isDragging && draggingPlayerIndex !== null) {
             drawPullLine();
         }
     }
     function drawPullLine() { /* ... (bez zmian od ostatniej wersji) ... */ if (!ctx) return; ctx.save(); let startPoint; if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { startPoint = fieldPlayers[draggingPlayerIndex]; } else if (draggingPlayerIndex === -1 && goalkeeper) { startPoint = goalkeeper; } else { ctx.restore(); return; } ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(dragCurrentCanvas.x, dragCurrentCanvas.y); ctx.stroke(); let dx = startPoint.x - dragCurrentCanvas.x; let dy = startPoint.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); if (pullLength > 5) { let arrowEndX = startPoint.x + dx * pullScale * 0.5; let arrowEndY = startPoint.y + dy * pullScale * 0.5; ctx.setLineDash([]); let red = Math.floor(255 * pullScale); let green = Math.floor(255 * (1 - pullScale)); ctx.strokeStyle = `rgba(${red}, ${green}, 0, 0.9)`; ctx.lineWidth = 3 + 2 * pullScale; ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(arrowEndX, arrowEndY); ctx.stroke(); drawArrowhead(ctx, startPoint.x, startPoint.y, arrowEndX, arrowEndY, 8 + 4 * pullScale); } ctx.restore(); }
     function drawArrowhead(context, fromx, fromy, tox, toy, headLength) { /* ... (bez zmian od ostatniej wersji) ... */ var angle = Math.atan2(toy - fromy, tox - fromx); context.beginPath(); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle - Math.PI / 6), toy - headLength * Math.sin(angle - Math.PI / 6)); context.moveTo(tox, toy); context.lineTo(tox - headLength * Math.cos(angle + Math.PI / 6), toy - headLength * Math.sin(angle + Math.PI / 6)); context.stroke(); }

    // --- FUNKCJE FIZYKI I KOLIZJI ---
    // (Bez zmian od ostatniej wersji)
     function updatePositions() { /* ... */ if (!canvas || !ball) return; const allMovables = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway, ball]; const borderMargin = 8; allMovables.forEach(obj => { if (!obj) return; obj.x += obj.vx; obj.y += obj.vy; let currentFriction = (obj === ball) ? FRICTION : FRICTION * PLAYER_FRICTION; obj.vx *= currentFriction; obj.vy *= currentFriction; if (Math.hypot(obj.vx, obj.vy) < 0.1) { obj.vx = 0; obj.vy = 0; } const restitution = -0.4; if (obj.x - obj.radius < borderMargin) { obj.x = borderMargin + obj.radius; obj.vx *= restitution; } if (obj.x + obj.radius > canvas.width - borderMargin) { obj.x = canvas.width - borderMargin - obj.radius; obj.vx *= restitution; } if (obj.y - obj.radius < borderMargin) { obj.y = borderMargin + obj.radius; obj.vy *= restitution; } if (obj.y + obj.radius > canvas.height - borderMargin) { obj.y = canvas.height - borderMargin - obj.radius; obj.vy *= restitution; } }); confineGoalkeeper(goalkeeper, true); confineGoalkeeper(goalkeeperAway, false); checkGoal(); }
     function confineGoalkeeper(gk, isHomeTeam) { /* ... */ if (!gk) return; const borderMargin = 8; const goalHeight = 40; const penaltyBoxWidth = 90; const goalTop = canvas.height / 2 - goalHeight; const goalBottom = canvas.height / 2 + goalHeight; gk.y = Math.max(goalTop + gk.radius, Math.min(goalBottom - gk.radius, gk.y)); if (isHomeTeam) { const penaltyAreaFront = borderMargin + penaltyBoxWidth; gk.x = Math.max(borderMargin + gk.radius, Math.min(penaltyAreaFront - gk.radius, gk.x)); } else { const penaltyAreaFront = canvas.width - borderMargin - penaltyBoxWidth; gk.x = Math.max(penaltyAreaFront + gk.radius, Math.min(canvas.width - borderMargin - gk.radius, gk.x)); } }
     function checkGoal() { /* ... */ if (!ball) return; const borderMargin = 8; const goalHeight = 40; const goalLineYTop = canvas.height/2 - goalHeight; const goalLineYBottom = canvas.height/2 + goalHeight; const goalPostRestitution = -0.5 * COLLISION_RESTITUTION; if (ball.x - ball.radius < borderMargin) { if (ball.y > goalLineYTop && ball.y < goalLineYBottom) { console.log("GOL DLA GOŚCI!"); score.away++; updateScoreboard(); resetPositionsAfterGoal(false); } else { ball.x = borderMargin + ball.radius; ball.vx *= goalPostRestitution; } } if (ball.x + ball.radius > canvas.width - borderMargin) { if (ball.y > goalLineYTop && ball.y < goalLineYBottom) { console.log("GOL DLA GOSPODARZY!"); score.home++; updateScoreboard(); resetPositionsAfterGoal(true); } else { ball.x = canvas.width - borderMargin - ball.radius; ball.vx *= goalPostRestitution; } } }
     function circleCollision(c1, c2) { /* ... */ if (!c1 || !c2) return false; const dx = c1.x - c2.x; const dy = c1.y - c2.y; const distance = Math.hypot(dx, dy); const radiiSum = c1.radius + c2.radius; return distance < radiiSum; }
     function resolveCollision(obj1, obj2) { /* ... */ if (!obj1 || !obj2) return; const dx = obj2.x - obj1.x; const dy = obj2.y - obj1.y; const distance = Math.hypot(dx, dy); const radiiSum = obj1.radius + obj2.radius; const overlap = radiiSum - distance; if (overlap > 0 && distance > 0.01) { const nx = dx / distance; const ny = dy / distance; const moveCorrection = overlap / 2; obj1.x -= nx * moveCorrection; obj1.y -= ny * moveCorrection; obj2.x += nx * moveCorrection; obj2.y += ny * moveCorrection; const dvx = obj1.vx - obj2.vx; const dvy = obj1.vy - obj2.vy; const dotProduct = dvx * nx + dvy * ny; if (dotProduct < 0) { let restitution = (obj1 !== ball && obj2 !== ball) ? PLAYER_COLLISION_RESTITUTION : COLLISION_RESTITUTION; const mass1 = (obj1 === ball) ? 0.5 : 1.0; const mass2 = (obj2 === ball) ? 0.5 : 1.0; const invMassSum = (1 / mass1) + (1 / mass2); let impulse = (-(1 + restitution) * dotProduct) / invMassSum; obj1.vx += (impulse / mass1) * nx; obj1.vy += (impulse / mass1) * ny; obj2.vx -= (impulse / mass2) * nx; obj2.vy -= (impulse / mass2) * ny; if (obj1 === ball || obj2 === ball) { ball.vx *= BALL_COLLISION_BOOST; ball.vy *= BALL_COLLISION_BOOST; } } } }
     function checkCollisions() { /* ... */ if (!ball) return; const allPlayers = [...fieldPlayers, ...fieldPlayersAway, goalkeeper, goalkeeperAway].filter(p => p); const allObjects = [...allPlayers, ball]; for (let i = 0; i < allObjects.length; i++) { for (let j = i + 1; j < allObjects.length; j++) { if (circleCollision(allObjects[i], allObjects[j])) { resolveCollision(allObjects[i], allObjects[j]); } } } }

    // --- SZTUCZNA INTELIGENCJA (AI) ---
    // (Bez zmian od ostatniej wersji)
    function aiMove() { /* ... */ if (!ball || !goalkeeperAway || fieldPlayersAway.length === 0 || !canvas || !gameAnimating) return; const goalX = 10; const goalY = canvas.height / 2; const borderMargin = 8; goalkeeperAway.vx *= 0.8; goalkeeperAway.vy *= 0.8; if (ball.x > canvas.width * 0.5) { let dyGK = ball.y - goalkeeperAway.y; if(Math.abs(dyGK) > GOALKEEPER_RADIUS * 0.5) { goalkeeperAway.vy += Math.sign(dyGK) * AI_GOALKEEPER_SPEED * 0.1; } if (ball.x > canvas.width * 0.7) { let dxGK = ball.x - goalkeeperAway.x; goalkeeperAway.vx += Math.sign(dxGK) * AI_GOALKEEPER_SPEED * 0.05; } } else { let dyToCenter = (canvas.height / 2) - goalkeeperAway.y; if (Math.abs(dyToCenter) > 5) { goalkeeperAway.vy += Math.sign(dyToCenter) * AI_GOALKEEPER_SPEED * 0.05; } let dxToCenter = (canvas.width - 40) - goalkeeperAway.x; if (Math.abs(dxToCenter) > 5) { goalkeeperAway.vx += Math.sign(dxToCenter) * AI_GOALKEEPER_SPEED * 0.03; } } goalkeeperAway.vx = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vx)); goalkeeperAway.vy = Math.max(-AI_GOALKEEPER_SPEED, Math.min(AI_GOALKEEPER_SPEED, goalkeeperAway.vy)); let closestPlayerIndex = -1; let minDistSq = Infinity; let playerWithBall = null; fieldPlayersAway.forEach((player, index) => { if (!player) return; let dx = ball.x - player.x; let dy = ball.y - player.y; let distSq = dx * dx + dy * dy; if (distSq < minDistSq) { minDistSq = distSq; closestPlayerIndex = index; } if (distSq < Math.pow(player.radius + ball.radius + 2, 2)) { playerWithBall = player; } }); fieldPlayersAway.forEach((player, index) => { if (!player) return; player.vx = 0; player.vy = 0; let dxToBall = ball.x - player.x; let dyToBall = ball.y - player.y; let distToBallSq = dxToBall * dxToBall + dyToBall * dyToBall; let distToBall = Math.sqrt(distToBallSq); if (player === playerWithBall) { let dxToGoal = goalX - player.x; let dyToGoal = goalY - player.y; let distToGoal = Math.hypot(dxToGoal, dyToGoal); let angleToGoal = Math.atan2(dyToGoal, dxToGoal); let canShoot = player.x > canvas.width * 0.4; if (canShoot && Math.random() < 0.4) { let shootAngle = angleToGoal + (Math.random() - 0.5) * AI_SHOT_ACCURACY_FACTOR * 2; let power = AI_REACTION_POWER * (0.8 + Math.random() * 0.4); player.vx = Math.cos(shootAngle) * power; player.vy = Math.sin(shootAngle) * power; console.log("AI Shot!"); } else { let dribbleAngle = angleToGoal; let power = AI_REACTION_POWER * 0.3; fieldPlayersAway.forEach(otherPlayer => { if (player === otherPlayer) return; let dxOther = otherPlayer.x - player.x; let dyOther = otherPlayer.y - player.y; let distOtherSq = dxOther*dxOther + dyOther*dyOther; if (distOtherSq < Math.pow(PLAYER_RADIUS * 4, 2)) { dribbleAngle -= Math.sign(dxOther * dyToGoal - dyOther * dxToGoal) * 0.2; } }); player.vx = Math.cos(dribbleAngle) * power; player.vy = Math.sin(dribbleAngle) * power; } } else if (index === closestPlayerIndex && distToBallSq < AI_INTERCEPT_RADIUS_SQ) { let interceptPower = AI_REACTION_POWER * 0.4 * (1 - distToBall / Math.sqrt(AI_INTERCEPT_RADIUS_SQ)); if (distToBall > 0) { player.vx = (dxToBall / distToBall) * interceptPower; player.vy = (dyToBall / distToBall) * interceptPower; } } else { let targetX = canvas.width * (0.7 + index * 0.05); let targetY = canvas.height * (index % 2 === 0 ? 0.3 : 0.7); let dxToPos = targetX - player.x; let dyToPos = targetY - player.y; let distToPos = Math.hypot(dxToPos, dyToPos); let positionPower = AI_REACTION_POWER * 0.05; if (distToPos > PLAYER_RADIUS) { player.vx = (dxToPos / distToPos) * positionPower; player.vy = (dyToPos / distToPos) * positionPower; } } }); }


    // --- PĘTLA GŁÓWNA GRY ---
    function gameLoop() {
         if (!gameAnimating || !ctx) return;
         // === ZMIANA: Czyszczenie canvas jest teraz ważniejsze ===
         ctx.clearRect(0, 0, canvas.width, canvas.height); // Czyści przezroczysty canvas przed rysowaniem obiektów

         // drawField(); // JUŻ NIE POTRZEBNE, bo nic nie rysuje

         updatePositions(); // Aktualizuj pozycje (fizyka, granice, bramkarze)
         checkCollisions(); // Sprawdzaj i rozwiązuj kolizje
         aiMove();          // Wykonaj ruchy AI

         // Rysujemy TYLKO obiekty gry na przezroczystym tle
         drawGameObjects();

         requestAnimationFrame(gameLoop); // Następna klatka
     }

    // --- OBSŁUGA MYSZY (PRZECIĄGANIE) ---
    // (Bez zmian od ostatniej wersji)
     function getMousePos(canvas, evt) { /* ... */ if (!canvas) return { x: 0, y: 0 }; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY }; }
     function canvasMouseDown(e) { /* ... */ if (!canvas || !gameAnimating) return; const pos = getMousePos(canvas, e); for (let i = 0; i < fieldPlayers.length; i++) { const p = fieldPlayers[i]; if (p && Math.hypot(pos.x - p.x, pos.y - p.y) < PLAYER_RADIUS + 5) { draggingPlayerIndex = i; isDragging = true; dragStartCanvas = { x: p.x, y: p.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } } if (goalkeeper && Math.hypot(pos.x - goalkeeper.x, pos.y - goalkeeper.y) < GOALKEEPER_RADIUS + 5) { draggingPlayerIndex = -1; isDragging = true; dragStartCanvas = { x: goalkeeper.x, y: goalkeeper.y }; dragCurrentCanvas = pos; canvas.style.cursor = 'grabbing'; return; } }
     function canvasMouseMove(e) { /* ... */ if (!isDragging || !canvas || !gameAnimating) return; dragCurrentCanvas = getMousePos(canvas, e); }
     function canvasMouseUp(e) { /* ... */ if (!isDragging || draggingPlayerIndex === null || !canvas || !gameAnimating) return; const dx = dragStartCanvas.x - dragCurrentCanvas.x; const dy = dragStartCanvas.y - dragCurrentCanvas.y; let pullLength = Math.hypot(dx, dy); if (pullLength < 3) { isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; return; } let pullScale = Math.min(1, pullLength / MAX_PULL_LENGTH); const baseImpulse = pullLength * DRAG_IMPULSE_SCALE * pullScale; const impulseX = (dx / (pullLength || 1)) * baseImpulse; const impulseY = (dy / (pullLength || 1)) * baseImpulse; if (draggingPlayerIndex >= 0 && fieldPlayers[draggingPlayerIndex]) { fieldPlayers[draggingPlayerIndex].vx = impulseX; fieldPlayers[draggingPlayerIndex].vy = impulseY; } else if (draggingPlayerIndex === -1 && goalkeeper) { goalkeeper.vx = impulseX * 0.6; goalkeeper.vy = impulseY * 0.6; } isDragging = false; draggingPlayerIndex = null; canvas.style.cursor = 'grab'; }
     function canvasMouseLeave(e) { /* ... */ if (isDragging) { isDragging = false; draggingPlayerIndex = null; if (canvas) canvas.style.cursor = 'grab'; } }
     function addCanvasEvents() { /* ... */ if (!canvas) return; canvas.addEventListener("mousedown", canvasMouseDown); canvas.addEventListener("mousemove", canvasMouseMove); canvas.addEventListener("mouseup", canvasMouseUp); canvas.addEventListener("mouseleave", canvasMouseLeave); }

    // --- WYBÓR DRUŻYN ---
    // (Bez zmian od ostatniej wersji)
     function populateTeamSelections() { /* ... */ const homeContainer = document.getElementById("homeTeamContainer"); const awayContainer = document.getElementById("awayTeamContainer"); if (!homeContainer || !awayContainer) return; homeContainer.innerHTML = ""; awayContainer.innerHTML = ""; selectedHomeTeam = null; selectedAwayTeam = null; Object.keys(teamsData).forEach(league => { const leagueData = teamsData[league]; const createLeagueSection = (targetContainer, isHome) => { let leagueDiv = document.createElement("div"); leagueDiv.className = "league-section"; let leagueHeader = document.createElement("div"); leagueHeader.className = "league-header"; let leagueLogo = document.createElement("img"); leagueLogo.src = leagueData.leagueLogo; leagueLogo.alt = league; let leagueName = document.createElement("span"); leagueName.innerText = league; leagueHeader.appendChild(leagueLogo); leagueHeader.appendChild(leagueName); leagueDiv.appendChild(leagueHeader); let teamInnerContainer = document.createElement("div"); teamInnerContainer.style.display = "flex"; teamInnerContainer.style.gap = "15px"; leagueData.teams.forEach(team => { let teamDiv = document.createElement("div"); teamDiv.className = "team-option"; teamDiv.dataset.team = team.name; teamDiv.innerHTML = `<img src="${team.logo}" alt="${team.name}" /><p>${team.name}</p>`; teamDiv.addEventListener("click", function () { Array.from(targetContainer.querySelectorAll('.team-option.selected')).forEach(el => el.classList.remove("selected")); this.classList.add("selected"); if (isHome) selectedHomeTeam = team.name; else selectedAwayTeam = team.name; }); teamInnerContainer.appendChild(teamDiv); }); leagueDiv.appendChild(teamInnerContainer); targetContainer.appendChild(leagueDiv); }; createLeagueSection(homeContainer, true); createLeagueSection(awayContainer, false); }); }

    // --- NEW: Stadium Selection Population ---
    // (Bez zmian od ostatniej wersji)
    function populateStadiumSelection() { /* ... */ const stadiumContainer = document.getElementById("stadiumContainer"); const startButton = document.getElementById("startMatchFromStadiumBtn"); if (!stadiumContainer || !startButton) { console.error("Stadium container or start button not found!"); return; } stadiumContainer.innerHTML = ""; selectedStadium = null; startButton.disabled = true; stadiumsData.forEach(stadium => { let stadiumDiv = document.createElement("div"); stadiumDiv.className = "stadium-option"; stadiumDiv.dataset.stadium = stadium.name; stadiumDiv.innerHTML = `<img src="${stadium.image}" alt="${stadium.name}" /><p>${stadium.name}</p>`; stadiumDiv.addEventListener("click", function() { Array.from(stadiumContainer.querySelectorAll('.stadium-option.selected')).forEach(el => el.classList.remove("selected")); this.classList.add("selected"); selectedStadium = stadium.name; console.log("Selected stadium:", selectedStadium); startButton.disabled = false; }); stadiumContainer.appendChild(stadiumDiv); }); }

    // --- FUNKCJE USTAWIEŃ (Rozmiar czcionki) ---
    // (Bez zmian od ostatniej wersji)
     const fontSizeOptions = document.querySelectorAll('.fontSizeOption'); function applyFontSize(size) { /* ... */ if (!['small', 'medium', 'large'].includes(size)) { size = 'medium'; } document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large'); document.body.classList.add(`font-size-${size}`); localStorage.setItem('gameFontSize', size); fontSizeOptions.forEach(button => { if (button) { button.classList.remove('active-size'); if (button.dataset.size === size) { button.classList.add('active-size'); } } }); console.log("Zastosowano rozmiar czcionki:", size); } function loadFontSize() { /* ... */ const savedSize = localStorage.getItem('gameFontSize') || 'medium'; applyFontSize(savedSize); }

     // --- FUNKCJE POMOCNICZE MODALI ---
     // (Bez zmian od ostatniej wersji)
      function openModal(modalElement) { if(modalElement) modalElement.classList.remove('hidden'); } function closeModal(modalElement) { if(modalElement) modalElement.classList.add('hidden'); }

    // --- SKALOWANIE CANVAS ---
    // (Bez zmian od ostatniej wersji)
     function resizeCanvas() { /* ... */ if (!canvas) return; const gameContainer = canvas.parentElement; if (!gameContainer) return; const availableWidth = gameContainer.clientWidth * 0.98; const availableHeight = window.innerHeight - 150; const aspectRatio = canvas.width / canvas.height; let newWidth = availableWidth; let newHeight = newWidth / aspectRatio; if (newHeight > availableHeight) { newHeight = availableHeight; newWidth = newHeight * aspectRatio; } canvas.style.width = `${newWidth}px`; canvas.style.height = `${newHeight}px`; }

    // --- GŁÓWNA INICJALIZACJA (DOMContentLoaded) ---
     document.addEventListener("DOMContentLoaded", () => {
         loadFontSize();
         window.addEventListener('resize', resizeCanvas);

         // Button References - (Bez zmian od ostatniej wersji)
         const startMatchBtn = document.getElementById("startMatchBtn"); const goToStadiumSelectBtn = document.getElementById("goToStadiumSelectBtn"); const startMatchFromStadiumBtn = document.getElementById("startMatchFromStadiumBtn"); const backToStartBtn = document.getElementById("backToStartBtn"); const backToMenuFromSelect = document.getElementById("backToMenuFromSelect"); const backToTeamSelectBtn = document.getElementById("backToTeamSelectBtn"); const btnPlayerDB = document.getElementById("btnPlayerDB"); const btnLanguage = document.getElementById("btnLanguage"); const btnSettings = document.getElementById("btnSettings"); const closePlayerDBBtn = document.getElementById("closePlayerDBBtn"); const closeLanguageModalBtn = document.getElementById("closeLanguageModalBtn"); const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn"); const addPlayerForm = document.getElementById("addPlayerForm"); const langOptions = document.querySelectorAll(".langOption");

         // Navigation Listeners - (Logika ustawiania tła body jest już poprawna)
         if (startMatchBtn) startMatchBtn.addEventListener("click", () => { closeModal(startScreen); openModal(teamSelectScreen); populateTeamSelections(); });
         if (backToMenuFromSelect) backToMenuFromSelect.addEventListener("click", () => { closeModal(teamSelectScreen); openModal(startScreen); });
         if (goToStadiumSelectBtn) goToStadiumSelectBtn.addEventListener("click", () => { if (!selectedHomeTeam || !selectedAwayTeam) { alert("Proszę wybrać obie drużyny!"); return; } if (selectedHomeTeam === selectedAwayTeam) { alert("Drużyny muszą być różne!"); return; } closeModal(teamSelectScreen); openModal(stadiumSelectScreen); populateStadiumSelection(); });
         if (backToTeamSelectBtn) backToTeamSelectBtn.addEventListener("click", () => { closeModal(stadiumSelectScreen); openModal(teamSelectScreen); });
         if (startMatchFromStadiumBtn) startMatchFromStadiumBtn.addEventListener("click", () => { if (!selectedStadium) { alert("Proszę wybrać stadion!"); return; } if (selectedStadium === "Anfield") { document.body.style.backgroundImage = "url('anfield_top_down.jpg')"; document.body.style.backgroundSize = "cover"; document.body.style.backgroundPosition = "center center"; document.body.style.backgroundAttachment = "fixed"; } else { document.body.style.backgroundImage = ''; } closeModal(stadiumSelectScreen); openModal(gameScreen); initGame(); addCanvasEvents(); startTimer(); gameAnimating = true; requestAnimationFrame(gameLoop); });
         if (backToStartBtn) backToStartBtn.addEventListener("click", () => { gameAnimating = false; stopTimer(); closeModal(gameScreen); openModal(startScreen); document.body.style.backgroundImage = ''; resetGameFull(); });

         // Modal Buttons - (Bez zmian od ostatniej wersji)
         if(btnPlayerDB) btnPlayerDB.addEventListener("click", () => openModal(playerDBModal)); if(btnLanguage) btnLanguage.addEventListener("click", () => openModal(languageModal)); if(btnSettings) btnSettings.addEventListener("click", () => { openModal(settingsModal); const currentSize = localStorage.getItem('gameFontSize') || 'medium'; fontSizeOptions.forEach(button => { if(button) button.classList.toggle('active-size', button.dataset.size === currentSize); }); }); if(closePlayerDBBtn) closePlayerDBBtn.addEventListener("click", () => closeModal(playerDBModal)); if(closeLanguageModalBtn) closeLanguageModalBtn.addEventListener("click", () => closeModal(languageModal)); if(closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));

         // Font Size Options - (Bez zmian od ostatniej wersji)
         fontSizeOptions.forEach(button => { if(button) button.addEventListener('click', () => applyFontSize(button.dataset.size)); });

         // Add Player Form - (Bez zmian od ostatniej wersji)
         if(addPlayerForm) addPlayerForm.addEventListener("submit", (e) => { e.preventDefault(); const name = document.getElementById("playerName")?.value; const team = document.getElementById("playerTeam")?.value; const rating = document.getElementById("playerRating")?.value; if(name && team && rating){ console.log("Dodawanie gracza:", { name, team, rating }); const playerListDiv = document.getElementById("playerList"); if(playerListDiv){ const newPlayerEntry = document.createElement('p'); newPlayerEntry.textContent = `${name} (${team}) - Ocena: ${rating}`; playerListDiv.appendChild(newPlayerEntry); } e.target.reset(); } else { console.warn("Formularz dodawania gracza: brakuje danych"); } });

         // Language Options - (Bez zmian od ostatniej wersji)
         langOptions.forEach(button => { if(button) button.addEventListener("click", () => { const lang = button.dataset.lang; console.log("Zmieniono język na:", lang); /* logika */ closeModal(languageModal); }); });

         console.log("MiniSoccer v14 - Canvas przezroczysty, tło stadionu na body");
     });

})(); // Koniec IIFE

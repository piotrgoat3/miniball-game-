    <script>
        (function () {
            "use strict";

            // --- Konfiguracja Gry ---
            const PLAYER_RADIUS = 15;
            const GOALKEEPER_RADIUS = 17;
            const BALL_RADIUS = 8;
            const FRICTION = 0.98;
            const PLAYER_DRAG_IMPULSE_SCALE = 0.055;
            // Używamy tej stałej:
            const BALL_COLLISION_IMPULSE_FACTOR = 0.7; // Zwiększono trochę dla lepszego odbicia
            const PLAYER_COLLISION_RESTITUTION = 0.1;
            const BALL_PLAYER_RESTITUTION = 0.6;      // Zwiększono trochę sprężystość piłki
            const AI_SPEED = 1.5;
            const GOALIE_SPEED = 2.0;
            const MATCH_DURATION = 180;
            const MIN_VELOCITY_THRESHOLD = 0.05;

            // --- Zmienne Globalne Gry ---
            let canvas, ctx;
            let ball;
            let homePlayers = [];
            let awayPlayers = [];
            let score = { home: 0, away: 0 };
            let gameAnimating = false;
            let matchTime = MATCH_DURATION;
            let matchTimerInterval = null;
            let isDragging = false;
            let draggingPlayer = null;
            let dragStartCoords = { x: 0, y: 0 };
            let currentMouseCoords = { x: 0, y: 0 };
            let homeTeamName = "Drużyna 1";
            let awayTeamName = "Drużyna 2";

            // --- Inicjalizacja Gry ---
            function initGame() {
                canvas = document.getElementById("gameCanvas");
                ctx = canvas.getContext("2d");
                score = { home: 0, away: 0 };
                updateScoreboard();
                resetPositionsAndBall();
                stopTimer();
                matchTime = MATCH_DURATION;
                updateTimerDisplay();
                startTimer();
                addCanvasEvents();
                gameAnimating = true;
                lastTime = performance.now(); // Zainicjuj lastTime
                requestAnimationFrame(gameLoop);
            }

            function resetPositionsAndBall(kickerTeam = null) {
                 ball = {
                     x: canvas.width / 2, y: canvas.height / 2, radius: BALL_RADIUS,
                     vx: 0, vy: 0, dx:0, dy:0, // Dodano dx/dy dla spójności z updatePositions
                     color: "white"
                 };
                 homePlayers = [
                     { id: 'H_GK', type: 'goalkeeper', x: 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P1', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P2', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P3', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P4', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" }
                 ];
                 awayPlayers = [
                      { id: 'A_GK', type: 'goalkeeper', x: canvas.width - 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P1', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P2', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P3', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P4', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" }
                 ];
            }

            // --- Rysowanie (bez zmian) ---
            function drawField() {
                ctx.fillStyle = "#2E8B57";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2); ctx.stroke();
                const goalWidth = 8, goalHeight = 100;
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.fillRect(0, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);
                ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);
                const penaltyBoxWidth = 100, penaltyBoxHeight = 200;
                ctx.strokeRect(0, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
                ctx.strokeRect(canvas.width - penaltyBoxWidth, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
            }

            function drawGameObjects() {
                ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fillStyle = ball.color; ctx.fill(); ctx.closePath();
                [...homePlayers, ...awayPlayers].forEach(player => {
                    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fillStyle = player.color; ctx.fill();
                    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1; ctx.stroke(); ctx.closePath();
                });
                if (isDragging && draggingPlayer) {
                     ctx.beginPath(); ctx.moveTo(draggingPlayer.x, draggingPlayer.y);
                     let targetX = draggingPlayer.x + (dragStartCoords.x - currentMouseCoords.x);
                     let targetY = draggingPlayer.y + (dragStartCoords.y - currentMouseCoords.y);
                     ctx.lineTo(targetX, targetY);
                     ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
                }
            }

             // --- Fizyka i Aktualizacja Pozycji ---
             function updatePositions() {
                 // Używamy dx/dy dla piłki dla spójności z oryginalnym kodem, vx/vy dla graczy
                 const allPlayers = [...homePlayers, ...awayPlayers];

                 // Aktualizacja piłki
                 if (isNaN(ball.x) || isNaN(ball.y) || isNaN(ball.dx) || isNaN(ball.dy)) { resetBallEmergency(); return; }
                 ball.x += ball.dx; ball.y += ball.dy;
                 ball.dx *= FRICTION; ball.dy *= FRICTION;
                 if (Math.abs(ball.dx) < MIN_VELOCITY_THRESHOLD) ball.dx = 0;
                 if (Math.abs(ball.dy) < MIN_VELOCITY_THRESHOLD) ball.dy = 0;
                 // Kolizje piłki z bandami i bramkami
                 const goalHeight = 100, goalTopY = canvas.height / 2 - goalHeight / 2, goalBottomY = canvas.height / 2 + goalHeight / 2;
                 if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.dy *= -0.9; }
                 else if (ball.y + ball.radius > canvas.height) { ball.y = canvas.height - ball.radius; ball.dy *= -0.9; }
                 if (ball.x - ball.radius < 0) {
                     if (ball.y > goalTopY && ball.y < goalBottomY) { score.away++; updateScoreboard(); resetPositionsAfterGoal('home'); }
                     else { ball.x = ball.radius; ball.dx *= -0.9; }
                 } else if (ball.x + ball.radius > canvas.width) {
                     if (ball.y > goalTopY && ball.y < goalBottomY) { score.home++; updateScoreboard(); resetPositionsAfterGoal('away'); }
                     else { ball.x = canvas.width - ball.radius; ball.dx *= -0.9; }
                 }
                 ball.vx = ball.dx; // Synchronizuj vx/vy na wszelki wypadek
                 ball.vy = ball.dy;

                 // Aktualizacja graczy
                 allPlayers.forEach((player, index) => {
                     if (isNaN(player.x) || isNaN(player.y) || isNaN(player.vx) || isNaN(player.vy)) { resetPlayerEmergency(player); return; }
                     player.x += player.vx; player.y += player.vy;
                     player.vx *= FRICTION; player.vy *= FRICTION;
                     if (Math.abs(player.vx) < MIN_VELOCITY_THRESHOLD) player.vx = 0;
                     if (Math.abs(player.vy) < MIN_VELOCITY_THRESHOLD) player.vy = 0;
                     // Kolizje graczy z bandami
                     if (player.y - player.radius < 0) { player.y = player.radius; player.vy *= -0.7; }
                     else if (player.y + player.radius > canvas.height) { player.y = canvas.height - player.radius; player.vy *= -0.7; }
                     if (player.x - player.radius < 0) { player.x = player.radius; player.vx *= -0.5; }
                     else if (player.x + player.radius > canvas.width) { player.x = canvas.width - player.radius; player.vx *= -0.5; }
                    // Ograniczenie ruchu bramkarzy
                     if (player.type === 'goalkeeper') {
                         const midField = canvas.width / 2;
                         if (player.id.startsWith('H_') && player.x > midField - player.radius) { player.x = midField - player.radius; if (player.vx > 0) player.vx = 0; }
                         else if (player.id.startsWith('A_') && player.x < midField + player.radius) { player.x = midField + player.radius; if (player.vx < 0) player.vx = 0; }
                     }
                 });
             }

            // Funkcje resetujące w razie NaN
            function resetBallEmergency() {
                 console.error("Ball NaN detected! Resetting ball.");
                 ball.x = canvas.width / 2; ball.y = canvas.height / 2;
                 ball.dx = 0; ball.dy = 0; ball.vx = 0; ball.vy = 0;
            }
            function resetPlayerEmergency(player) {
                console.error(`Player ${player.id} NaN detected! Resetting player.`);
                // Prosty reset - można ulepszyć, by wracał na pozycję startową
                player.x = player.id.startsWith('H_') ? canvas.width * 0.3 : canvas.width * 0.7;
                player.y = canvas.height / 2;
                player.vx = 0; player.vy = 0;
            }

            // --- Detekcja Kolizji ---
            function checkCollisions() {
                const allPlayers = [...homePlayers, ...awayPlayers];
                // Kolizje Piłka - Gracz
                allPlayers.forEach(player => {
                    if (circleCollision(player, ball)) {
                        handlePlayerBallCollision(player, ball);
                    }
                });
                // Kolizje Gracz - Gracz
                for (let i = 0; i < allPlayers.length; i++) {
                    for (let j = i + 1; j < allPlayers.length; j++) {
                        if (circleCollision(allPlayers[i], allPlayers[j])) {
                            handlePlayerPlayerCollision(allPlayers[i], allPlayers[j]);
                        }
                    }
                }
            }

            function circleCollision(circle1, circle2) {
                const dx = circle1.x - circle2.x;
                const dy = circle1.y - circle2.y;
                const distanceSq = dx * dx + dy * dy;
                const radiusSum = circle1.radius + circle2.radius;
                return distanceSq > 0 && distanceSq < radiusSum * radiusSum; // Dodano > 0, by uniknąć kolizji sam ze sobą (teoretycznie)
            }

            // --- Obsługa Kolizji ---
            function handlePlayerBallCollision(player, ball) {
                const dx = ball.x - player.x;
                const dy = ball.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const overlap = player.radius + ball.radius - distance;

                if (overlap > 0) {
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    // Rozsuń obiekty
                    const correctionFactor = 0.7;
                    ball.x += normalX * overlap * correctionFactor;
                    ball.y += normalY * overlap * correctionFactor;
                    player.x -= normalX * overlap * (1 - correctionFactor);
                    player.y -= normalY * overlap * (1 - correctionFactor);

                    // Oblicz względną prędkość (używamy vx/vy dla obu dla spójności)
                    const relativeVx = ball.vx - player.vx;
                    const relativeVy = ball.vy - player.vy;
                    let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                    if (speedAlongNormal > 0) return; // Już się oddalają

                    let impulse = -(1 + BALL_PLAYER_RESTITUTION) * speedAlongNormal;

                    // **** TUTAJ JEST POPRAWKA ****
                    // Używamy zdefiniowanej stałej BALL_COLLISION_IMPULSE_FACTOR
                    ball.vx += impulse * normalX * BALL_COLLISION_IMPULSE_FACTOR;
                    ball.vy += impulse * normalY * BALL_COLLISION_IMPULSE_FACTOR;

                    // Synchronizuj dx/dy piłki
                    ball.dx = ball.vx;
                    ball.dy = ball.vy;
                }
            }

            function handlePlayerPlayerCollision(player1, player2) {
                 const dx = player2.x - player1.x;
                 const dy = player2.y - player1.y;
                 const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                 const overlap = player1.radius + player2.radius - distance;

                 if (overlap > 0) {
                     const normalX = dx / distance;
                     const normalY = dy / distance;
                     const moveCorrection = overlap / 2 + 0.1;
                     player1.x -= normalX * moveCorrection; player1.y -= normalY * moveCorrection;
                     player2.x += normalX * moveCorrection; player2.y += normalY * moveCorrection;

                     const relativeVx = player1.vx - player2.vx;
                     const relativeVy = player1.vy - player2.vy;
                     let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                     if (speedAlongNormal > 0) return;

                     let impulse = -(1 + PLAYER_COLLISION_RESTITUTION) * speedAlongNormal / 2;
                     player1.vx += impulse * normalX; player1.vy += impulse * normalY;
                     player2.vx -= impulse * normalX; player2.vy -= impulse * normalY;
                 }
            }

            // --- Sztuczna Inteligencja (bez zmian) ---
             function aiMove() {
                  awayPlayers.forEach(player => {
                     if (player.type === 'player') {
                         let targetX = ball.x + ball.vx * 5; // Celuj trochę przed piłkę
                         let targetY = ball.y + ball.vy * 5;
                         targetX = Math.max(player.radius, Math.min(canvas.width - player.radius, targetX));
                         targetY = Math.max(player.radius, Math.min(canvas.height - player.radius, targetY));
                         const dx = targetX - player.x, dy = targetY - player.y;
                         const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                         const accelerationFactor = 0.05;
                         player.vx += (dx / distance) * AI_SPEED * accelerationFactor;
                         player.vy += (dy / distance) * AI_SPEED * accelerationFactor;
                          const currentSpeedSq = player.vx*player.vx + player.vy*player.vy;
                          if(currentSpeedSq > AI_SPEED * AI_SPEED) {
                               const currentSpeed = Math.sqrt(currentSpeedSq);
                              player.vx = (player.vx / currentSpeed) * AI_SPEED;
                              player.vy = (player.vy / currentSpeed) * AI_SPEED;
                          }
                     } else if (player.type === 'goalkeeper') {
                          let targetY = ball.y;
                          const minY = player.radius + 20, maxY = canvas.height - player.radius - 20;
                          targetY = Math.max(minY, Math.min(maxY, targetY));
                          const dy = targetY - player.y; const distanceY = Math.abs(dy);
                          if (distanceY > player.radius * 0.5) { player.vy = (dy / distanceY) * GOALIE_SPEED; }
                          else { player.vy *= FRICTION * 0.9; }
                          if(Math.abs(ball.x - player.x) > canvas.width * 0.6) { player.vy *= 0.8; }
                     }
                 });
             }

            // --- Sterowanie Graczem (bez zmian) ---
             function getMousePos(canvas, evt) {
                 const rect = canvas.getBoundingClientRect();
                 return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
             }
             function canvasMouseDown(e) {
                 if (e.button !== 0) return;
                 const mousePos = getMousePos(canvas, e);
                 for (const player of homePlayers) {
                     const dx = mousePos.x - player.x; const dy = mousePos.y - player.y;
                     if (Math.sqrt(dx * dx + dy * dy) < player.radius * 1.5) {
                         isDragging = true; draggingPlayer = player;
                         dragStartCoords = { x: player.x, y: player.y };
                         currentMouseCoords = mousePos;
                         canvas.style.cursor = "grabbing"; break;
                     }
                 }
             }
             function canvasMouseMove(e) { if (!isDragging) return; currentMouseCoords = getMousePos(canvas, e); }
             function canvasMouseUp(e) {
                 if (!isDragging || !draggingPlayer || e.button !== 0) return;
                 const mousePos = getMousePos(canvas, e);
                 const dragVectorX = dragStartCoords.x - mousePos.x; const dragVectorY = dragStartCoords.y - mousePos.y;
                 draggingPlayer.vx = dragVectorX * PLAYER_DRAG_IMPULSE_SCALE;
                 draggingPlayer.vy = dragVectorY * PLAYER_DRAG_IMPULSE_SCALE;
                 isDragging = false; draggingPlayer = null; canvas.style.cursor = "grab";
             }
              function canvasMouseLeave(e) { if (isDragging) { canvasMouseUp(e); } } // Traktuj jak mouseUp
             function addCanvasEvents() {
                 canvas.style.cursor = 'grab';
                 canvas.removeEventListener("mousedown", canvasMouseDown); canvas.removeEventListener("mousemove", canvasMouseMove);
                 canvas.removeEventListener("mouseup", canvasMouseUp); canvas.removeEventListener("mouseleave", canvasMouseLeave);
                 canvas.addEventListener("mousedown", canvasMouseDown); canvas.addEventListener("mousemove", canvasMouseMove);
                 canvas.addEventListener("mouseup", canvasMouseUp); canvas.addEventListener("mouseleave", canvasMouseLeave);
                 canvas.addEventListener('selectstart', e => e.preventDefault());
             }

            // --- Zarządzanie Czasem i Wynikiem (bez zmian) ---
            function updateTimerDisplay() {
                let minutes = Math.floor(matchTime / 60); let seconds = matchTime % 60;
                seconds = seconds < 10 ? "0" + seconds : seconds;
                document.getElementById("matchTimer").innerText = `Czas: ${minutes}:${seconds}`;
            }
            function startTimer() {
                if (matchTimerInterval) clearInterval(matchTimerInterval);
                matchTimerInterval = setInterval(() => {
                    matchTime--; updateTimerDisplay();
                    if (matchTime <= 0 && gameAnimating) { gameOver(); }
                }, 1000);
            }
            function stopTimer() { clearInterval(matchTimerInterval); matchTimerInterval = null; }
            function updateScoreboard() {
                document.getElementById("scoreboard").innerText = `${homeTeamName} ${score.home} : ${score.away} ${awayTeamName}`;
            }
            function resetPositionsAfterGoal(startingTeam) {
                ball.vx = 0; ball.vy = 0; ball.dx = 0; ball.dy = 0; // Zatrzymaj piłkę od razu
                [...homePlayers, ...awayPlayers].forEach(p => { p.vx *= 0.1; p.vy *= 0.1; });
                setTimeout(() => { if (gameAnimating) resetPositionsAndBall(startingTeam); }, 500);
            }
            function gameOver() {
                if (!gameAnimating) return;
                stopTimer(); gameAnimating = false; canvas.style.cursor = 'default';
                setTimeout(() => { // Usuń listenery z opóźnieniem
                    canvas.removeEventListener("mousedown", canvasMouseDown); canvas.removeEventListener("mousemove", canvasMouseMove);
                    canvas.removeEventListener("mouseup", canvasMouseUp); canvas.removeEventListener("mouseleave", canvasMouseLeave);
                }, 100);
                alert(`Koniec meczu!\nWynik: ${homeTeamName} ${score.home} : ${score.away} ${awayTeamName}`);
            }

            // --- Główna Pętla Gry ---
            let lastTime = 0; // Przeniesiono inicjalizację do initGame
            function gameLoop(currentTime) {
                if (!gameAnimating) return;

                const deltaTime = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                const dt = Math.min(deltaTime, 0.1); // Użyj dt jeśli będziesz robić fizykę zależną od czasu

                // --- Kolejność operacji ---
                // 1. Ruch AI (oblicza intencje ruchu)
                aiMove();
                // 2. Aktualizacja pozycji (uwzględnia prędkość, tarcie, kolizje ze ścianami/bramkami)
                updatePositions();
                // 3. Sprawdzenie i obsługa kolizji między obiektami (gracz-piłka, gracz-gracz)
                checkCollisions();
                // 4. Rysowanie wszystkiego w nowych pozycjach
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawField();
                drawGameObjects();

                requestAnimationFrame(gameLoop);
            }

            // --- Start Gry ---
            document.addEventListener("DOMContentLoaded", () => {
                initGame();
                document.getElementById("backToStartBtn").addEventListener("click", () => {
                    console.log("Kliknięto Powrót do Menu (atrapa)");
                    if(gameAnimating) gameOver();
                });
            });

        })();
    </script>

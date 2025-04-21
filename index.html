    <script>
        (function () {
            "use strict";

            // --- Konfiguracja Gry ---
            const PLAYER_RADIUS = 15;
            const GOALKEEPER_RADIUS = 17;
            const BALL_RADIUS = 8;
            const FRICTION = 0.98; // Tarcie (nieco większe)
            const PLAYER_DRAG_IMPULSE_SCALE = 0.055; // Siła "strzału" po puszczeniu
            const BALL_COLLISION_IMPULSE_FACTOR = 0.6; // Współczynnik impulsu piłki przy zderzeniu z graczem
            const PLAYER_COLLISION_RESTITUTION = 0.1; // Mała sprężystość przy zderzeniu gracz-gracz
            const BALL_PLAYER_RESTITUTION = 0.5; // Sprężystość piłki odbitej od gracza
            const AI_SPEED = 1.5; // Prędkość zawodników AI
            const GOALIE_SPEED = 2.0; // Prędkość bramkarza AI
            const MATCH_DURATION = 180; // Czas meczu w sekundach (3:00)
            const MIN_VELOCITY_THRESHOLD = 0.05; // Prędkość, poniżej której obiekt się zatrzymuje

            // --- Zmienne Globalne Gry ---
            let canvas, ctx;
            let ball;
            let homePlayers = []; // 4 graczy z pola + 1 bramkarz
            let awayPlayers = []; // 4 graczy z pola + 1 bramkarz
            let score = { home: 0, away: 0 };
            let gameAnimating = false;
            let matchTime = MATCH_DURATION;
            let matchTimerInterval = null;

            // Zmienne do obsługi przeciągania
            let isDragging = false;
            let draggingPlayer = null;
            let dragStartCoords = { x: 0, y: 0 };
            let currentMouseCoords = { x: 0, y: 0 };

            // Nazwy drużyn
            let homeTeamName = "Drużyna 1";
            let awayTeamName = "Drużyna 2";

            // --- Inicjalizacja Gry ---
            function initGame() {
                canvas = document.getElementById("gameCanvas");
                ctx = canvas.getContext("2d");

                score = { home: 0, away: 0 };
                updateScoreboard();

                resetPositionsAndBall(); // Ustawia pozycje początkowe

                stopTimer();
                matchTime = MATCH_DURATION;
                updateTimerDisplay();
                startTimer();

                addCanvasEvents();

                gameAnimating = true;
                requestAnimationFrame(gameLoop); // Używamy requestAnimationFrame zamiast gameLoop() bezpośrednio
            }

            // Funkcja do ustawiania pozycji początkowych
            function resetPositionsAndBall(kickerTeam = null) { // kickerTeam: 'home' or 'away'
                 // Piłka
                 ball = {
                     x: canvas.width / 2,
                     y: canvas.height / 2,
                     radius: BALL_RADIUS,
                     vx: 0,
                     vy: 0,
                     color: "white"
                 };

                 // Drużyna Domowa
                 homePlayers = [
                     { id: 'H_GK', type: 'goalkeeper', x: 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P1', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P2', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P3', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                     { id: 'H_P4', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" }
                 ];

                 // Drużyna Gości
                 awayPlayers = [
                      { id: 'A_GK', type: 'goalkeeper', x: canvas.width - 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P1', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P2', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P3', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                     { id: 'A_P4', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" }
                 ];

                // Opcjonalny mały ruch piłki po golu
                // if (kickerTeam) {
                //      ball.vx = kickerTeam === 'home' ? 0.5 : -0.5;
                // }
            }


            // --- Rysowanie (bez zmian) ---
            function drawField() {
                ctx.fillStyle = "#2E8B57";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
                ctx.stroke();
                const goalWidth = 8;
                const goalHeight = 100;
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.fillRect(0, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);
                ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);
                const penaltyBoxWidth = 100;
                const penaltyBoxHeight = 200;
                ctx.strokeRect(0, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
                ctx.strokeRect(canvas.width - penaltyBoxWidth, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
            }

            function drawGameObjects() {
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fillStyle = ball.color;
                ctx.fill();
                ctx.closePath();

                [...homePlayers, ...awayPlayers].forEach(player => {
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                    ctx.fillStyle = player.color;
                    ctx.fill();
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.closePath();
                });

                if (isDragging && draggingPlayer) {
                     ctx.beginPath();
                     ctx.moveTo(draggingPlayer.x, draggingPlayer.y);
                     let targetX = draggingPlayer.x + (dragStartCoords.x - currentMouseCoords.x);
                     let targetY = draggingPlayer.y + (dragStartCoords.y - currentMouseCoords.y);
                     ctx.lineTo(targetX, targetY);
                     ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
                     ctx.lineWidth = 2;
                     ctx.setLineDash([5, 5]);
                     ctx.stroke();
                     ctx.setLineDash([]);
                }
            }

             // --- Fizyka i Aktualizacja Pozycji ---
             function updatePositions() {
                 const allObjects = [ball, ...homePlayers, ...awayPlayers];

                 allObjects.forEach((obj, index) => {
                     // Sprawdzenie NaN i reset awaryjny
                     if (isNaN(obj.x) || isNaN(obj.y) || isNaN(obj.vx) || isNaN(obj.vy)) {
                         console.warn(`NaN detected for object ${obj.id || 'ball'}! Resetting.`);
                         obj.x = canvas.width / 2;
                         obj.y = canvas.height / 2;
                         obj.vx = 0;
                         obj.vy = 0;
                         if(index > 0) { // Jeśli to gracz, resetuj pozycję startową
                            // Prosty reset na środek, można by zrobić bardziej precyzyjnie
                             if (obj.id.startsWith('H_')) obj.x = canvas.width * 0.3;
                             else obj.x = canvas.width * 0.7;
                         }
                         return; // Pomiń resztę aktualizacji dla tego obiektu w tej klatce
                     }

                     // Zastosuj prędkość
                     obj.x += obj.vx;
                     obj.y += obj.vy;

                     // Zastosuj tarcie
                     obj.vx *= FRICTION;
                     obj.vy *= FRICTION;

                     // Zatrzymaj obiekt, jeśli jest bardzo wolny
                     if (Math.abs(obj.vx) < MIN_VELOCITY_THRESHOLD) obj.vx = 0;
                     if (Math.abs(obj.vy) < MIN_VELOCITY_THRESHOLD) obj.vy = 0;


                    // Kolizje z bandami (ściany)
                    let collidedX = false;
                    let collidedY = false;

                    // Poziome (góra/dół)
                    if (obj.y - obj.radius < 0) {
                        obj.y = obj.radius;
                        obj.vy *= -0.7; // Odbicie
                        collidedY = true;
                    } else if (obj.y + obj.radius > canvas.height) {
                        obj.y = canvas.height - obj.radius;
                        obj.vy *= -0.7;
                        collidedY = true;
                    }

                    // Pionowe (lewo/prawo) - inne dla piłki (bramki)
                    if (obj !== ball) { // Dla graczy
                        if (obj.x - obj.radius < 0) {
                            obj.x = obj.radius;
                            obj.vx *= -0.5; // Mniejsze odbicie od bocznych band
                            collidedX = true;
                        } else if (obj.x + obj.radius > canvas.width) {
                            obj.x = canvas.width - obj.radius;
                            obj.vx *= -0.5;
                            collidedX = true;
                        }
                         // Ograniczenie ruchu bramkarzy
                         if (obj.type === 'goalkeeper') {
                             const midField = canvas.width / 2;
                             if (obj.id.startsWith('H_') && obj.x > midField - obj.radius) {
                                 obj.x = midField - obj.radius;
                                 if (obj.vx > 0) obj.vx = 0; // Zatrzymaj jeśli idzie w złą stronę
                             } else if (obj.id.startsWith('A_') && obj.x < midField + obj.radius) {
                                 obj.x = midField + obj.radius;
                                 if (obj.vx < 0) obj.vx = 0;
                             }
                         }

                    } else { // Dla piłki - sprawdzanie bramek
                        const goalHeight = 100;
                        const goalTopY = canvas.height / 2 - goalHeight / 2;
                        const goalBottomY = canvas.height / 2 + goalHeight / 2;

                        if (obj.x - obj.radius < 0) { // Lewa strona
                            if (obj.y > goalTopY && obj.y < goalBottomY) {
                                score.away++;
                                updateScoreboard();
                                resetPositionsAndBall('home'); // Gospodarze wznawiają
                            } else {
                                obj.x = obj.radius;
                                obj.dx *= -0.9; // Odbicie od słupka/ściany
                                collidedX = true;
                            }
                        } else if (obj.x + obj.radius > canvas.width) { // Prawa strona
                             if (obj.y > goalTopY && obj.y < goalBottomY) {
                                score.home++;
                                updateScoreboard();
                                resetPositionsAndBall('away'); // Goście wznawiają
                            } else {
                                obj.x = canvas.width - obj.radius;
                                obj.dx *= -0.9;
                                collidedX = true;
                            }
                        }
                        // Przypisanie dx/dy do vx/vy dla spójności (jeśli piłka to obj)
                        ball.vx = ball.dx;
                        ball.vy = ball.dy;
                    }
                     // Jeśli obiekt utknął w ścianie (np. przez kolizję blisko niej), lekko go odsuń
                     if (collidedX && Math.abs(obj.vx) < 0.1) obj.vx = (obj.x < canvas.width/2) ? 0.2 : -0.2;
                     if (collidedY && Math.abs(obj.vy) < 0.1) obj.vy = (obj.y < canvas.height/2) ? 0.2 : -0.2;

                 });
                  // Ponowne przypisanie dx/dy dla piłki po pętli
                  ball.dx = ball.vx;
                  ball.dy = ball.vy;
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

                // Kolizje Gracz - Gracz (uproszczone)
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
                const distanceSq = dx * dx + dy * dy; // Używamy kwadratu dystansu - szybsze
                const radiusSum = circle1.radius + circle2.radius;
                return distanceSq < radiusSum * radiusSum;
            }

            // --- Obsługa Kolizji ---
            function handlePlayerBallCollision(player, ball) {
                const dx = ball.x - player.x;
                const dy = ball.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const overlap = player.radius + ball.radius - distance;

                if (overlap > 0) {
                    // Wektor normalny (od gracza do piłki)
                    const normalX = dx / distance;
                    const normalY = dy / distance;

                    // Rozsuń głównie piłkę
                    const correctionFactor = 0.8; // Jak duża część korekty dotyczy piłki
                    ball.x += normalX * overlap * correctionFactor;
                    ball.y += normalY * overlap * correctionFactor;
                    // Lekko odsuń też gracza
                    player.x -= normalX * overlap * (1 - correctionFactor);
                    player.y -= normalY * overlap * (1 - correctionFactor);


                    // Oblicz względną prędkość
                    const relativeVx = ball.vx - player.vx;
                    const relativeVy = ball.vy - player.vy;

                    // Prędkość wzdłuż wektora normalnego
                    let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                    // Nie rób nic, jeśli się oddalają
                    if (speedAlongNormal > 0) return;

                    // Oblicz impuls (prostsza wersja - zakładamy masę gracza >> masa piłki)
                    let impulse = -(1 + BALL_PLAYER_RESTITUTION) * speedAlongNormal;

                    // Zastosuj impuls do piłki
                    ball.vx += impulse * normalX * BALL_COLLISION_IMPULSE_FACTOR;
                    ball.vy += impulse * normalY * BALL_COLLISION_IMPULSE_FACTOR;

                    // Można dodać minimalne odbicie, żeby piłka zawsze odskoczyła
                    const minImpulseSpeed = 1.0;
                    const currentBallSpeed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
                    if(currentBallSpeed < minImpulseSpeed){
                        ball.vx = normalX * minImpulseSpeed;
                        ball.vy = normalY * minImpulseSpeed;
                    }
                }
            }

            function handlePlayerPlayerCollision(player1, player2) {
                 const dx = player2.x - player1.x;
                 const dy = player2.y - player1.y;
                 const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                 const overlap = player1.radius + player2.radius - distance;

                 if (overlap > 0) {
                     // Wektor normalny (od player1 do player2)
                     const normalX = dx / distance;
                     const normalY = dy / distance;

                     // Rozsuń graczy proporcjonalnie
                     const moveCorrection = overlap / 2 + 0.1; // Dodajemy mały margines
                     player1.x -= normalX * moveCorrection;
                     player1.y -= normalY * moveCorrection;
                     player2.x += normalX * moveCorrection;
                     player2.y += normalY * moveCorrection;

                     // --- UPROSZCZONA WYMIANA PĘDU (TYLKO LEKKIE ODBICIE) ---
                     // Oblicz względną prędkość
                    const relativeVx = player1.vx - player2.vx;
                    const relativeVy = player1.vy - player2.vy;
                    let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                    // Nie rób nic, jeśli już się oddalają
                    if (speedAlongNormal > 0) return;

                    // Oblicz impuls (bardzo mały)
                    let impulse = -(1 + PLAYER_COLLISION_RESTITUTION) * speedAlongNormal;
                    impulse /= 2; // Podziel impuls na obu graczy (zakładając równe masy)

                    // Zastosuj mały impuls odbicia
                    player1.vx += impulse * normalX;
                    player1.vy += impulse * normalY;
                    player2.vx -= impulse * normalX;
                    player2.vy -= impulse * normalY;
                 }
            }

            // --- Sztuczna Inteligencja (bez większych zmian) ---
            function aiMove() {
                 awayPlayers.forEach(player => {
                    if (player.type === 'player') {
                        let targetX = ball.x;
                        let targetY = ball.y;

                        // Prosta strategia: idź w stronę piłki, ale z lekkim przewidywaniem
                        targetX += ball.vx * 3; // Celuj trochę przed piłkę
                        targetY += ball.vy * 3;

                        // Ogranicz cel do boiska
                        targetX = Math.max(player.radius, Math.min(canvas.width - player.radius, targetX));
                        targetY = Math.max(player.radius, Math.min(canvas.height - player.radius, targetY));


                        const dx = targetX - player.x;
                        const dy = targetY - player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                        const accelerationFactor = 0.05; // Płynniejsze przyspieszenie
                        player.vx += (dx / distance) * AI_SPEED * accelerationFactor;
                        player.vy += (dy / distance) * AI_SPEED * accelerationFactor;

                         const currentSpeed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
                         if(currentSpeed > AI_SPEED) {
                             player.vx = (player.vx / currentSpeed) * AI_SPEED;
                             player.vy = (player.vy / currentSpeed) * AI_SPEED;
                         }

                    } else if (player.type === 'goalkeeper') {
                         let targetY = ball.y;
                         const minY = player.radius + 20; // Niech nie przykleja się do bandy
                         const maxY = canvas.height - player.radius - 20;
                         targetY = Math.max(minY, Math.min(maxY, targetY));

                         const dy = targetY - player.y;
                         const distanceY = Math.abs(dy);

                         if (distanceY > player.radius * 0.5) {
                             player.vy = (dy / distanceY) * GOALIE_SPEED;
                         } else {
                             player.vy *= FRICTION * 0.9; // Szybciej hamuj blisko celu
                         }
                         // Ogranicz ruch pionowy, jeśli piłka jest daleko
                         if(Math.abs(ball.x - player.x) > canvas.width * 0.6) {
                            player.vy *= 0.8;
                         }
                    }
                });
            }

            // --- Sterowanie Graczem (bez zmian) ---
             function getMousePos(canvas, evt) {
                 const rect = canvas.getBoundingClientRect();
                 return {
                     x: evt.clientX - rect.left,
                     y: evt.clientY - rect.top
                 };
             }

             function canvasMouseDown(e) {
                 if (e.button !== 0) return; // Reaguj tylko na lewy przycisk
                 const mousePos = getMousePos(canvas, e);
                 for (const player of homePlayers) {
                     const dx = mousePos.x - player.x;
                     const dy = mousePos.y - player.y;
                     if (Math.sqrt(dx * dx + dy * dy) < player.radius * 1.5) { // Zwiększony obszar kliknięcia
                         isDragging = true;
                         draggingPlayer = player;
                         dragStartCoords = { x: player.x, y: player.y };
                         currentMouseCoords = mousePos;
                         canvas.style.cursor = "grabbing";
                         break;
                     }
                 }
             }

             function canvasMouseMove(e) {
                 if (!isDragging) return;
                 currentMouseCoords = getMousePos(canvas, e);
             }

             function canvasMouseUp(e) {
                 if (!isDragging || !draggingPlayer || e.button !== 0) return;

                 const mousePos = getMousePos(canvas, e);
                 const dragVectorX = dragStartCoords.x - mousePos.x;
                 const dragVectorY = dragStartCoords.y - mousePos.y;

                 draggingPlayer.vx = dragVectorX * PLAYER_DRAG_IMPULSE_SCALE;
                 draggingPlayer.vy = dragVectorY * PLAYER_DRAG_IMPULSE_SCALE;

                 isDragging = false;
                 draggingPlayer = null;
                 canvas.style.cursor = "grab";
             }

              function canvasMouseLeave(e) {
                  if (isDragging) {
                      // Można potraktować to jak puszczenie myszy w ostatniej znanej pozycji
                      canvasMouseUp(e); // Użyj ostatniej znanej pozycji myszy
                      // Alternatywnie: po prostu anuluj
                      // isDragging = false;
                      // draggingPlayer = null;
                      // canvas.style.cursor = "default";
                  }
              }

             function addCanvasEvents() {
                 canvas.style.cursor = 'grab';
                 canvas.removeEventListener("mousedown", canvasMouseDown);
                 canvas.removeEventListener("mousemove", canvasMouseMove);
                 canvas.removeEventListener("mouseup", canvasMouseUp);
                 canvas.removeEventListener("mouseleave", canvasMouseLeave);
                 canvas.addEventListener("mousedown", canvasMouseDown);
                 canvas.addEventListener("mousemove", canvasMouseMove);
                 canvas.addEventListener("mouseup", canvasMouseUp);
                 canvas.addEventListener("mouseleave", canvasMouseLeave);
                 // Zapobiegaj zaznaczaniu tekstu podczas przeciągania
                 canvas.addEventListener('selectstart', e => e.preventDefault());
             }


            // --- Zarządzanie Czasem i Wynikiem (bez zmian) ---
            function updateTimerDisplay() {
                let minutes = Math.floor(matchTime / 60);
                let seconds = matchTime % 60;
                seconds = seconds < 10 ? "0" + seconds : seconds;
                document.getElementById("matchTimer").innerText = `Czas: ${minutes}:${seconds}`;
            }

            function startTimer() {
                if (matchTimerInterval) clearInterval(matchTimerInterval);
                matchTimerInterval = setInterval(() => {
                    matchTime--;
                    updateTimerDisplay();
                    if (matchTime <= 0 && gameAnimating) { // Sprawdzaj czy gra wciąż aktywna
                        gameOver();
                    }
                }, 1000);
            }

            function stopTimer() {
                clearInterval(matchTimerInterval);
                matchTimerInterval = null;
            }

            function updateScoreboard() {
                document.getElementById("scoreboard").innerText =
                   `${homeTeamName} ${score.home} : ${score.away} ${awayTeamName}`;
            }

            function resetPositionsAfterGoal(startingTeam) {
                // Krótka pauza przed resetem dla efektu
                const oldBallVx = ball.vx; // Zachowaj prędkość piłki w momencie gola
                ball.vx = 0; ball.vy = 0;
                [...homePlayers, ...awayPlayers].forEach(p => { p.vx *= 0.1; p.vy *= 0.1; }); // Zwolnij graczy

                setTimeout(() => {
                   if (!gameAnimating) return; // Nie resetuj jeśli gra już się skończyła
                   resetPositionsAndBall(startingTeam);
                }, 500); // Pauza 0.5 sekundy
            }

            function gameOver() {
                if (!gameAnimating) return; // Zapobiegaj wielokrotnemu wywołaniu

                stopTimer();
                gameAnimating = false;
                canvas.style.cursor = 'default';

                // Usuń listenery, ale z opóźnieniem, by dokończyć ew. MouseUp
                setTimeout(() => {
                    canvas.removeEventListener("mousedown", canvasMouseDown);
                    canvas.removeEventListener("mousemove", canvasMouseMove);
                    canvas.removeEventListener("mouseup", canvasMouseUp);
                    canvas.removeEventListener("mouseleave", canvasMouseLeave);
                }, 100);


                // Wyświetl wynik końcowy
                alert(`Koniec meczu!\nWynik: ${homeTeamName} ${score.home} : ${score.away} ${awayTeamName}`);

                // Dodaj np. przycisk "Restart" lub powrót do menu
                // document.getElementById('restartButton').style.display = 'block';
            }

            // --- Główna Pętla Gry ---
            let lastTime = 0;
            function gameLoop(currentTime) {
                if (!gameAnimating) return;

                const deltaTime = (currentTime - lastTime) / 1000; // Czas w sekundach od ostatniej klatki
                lastTime = currentTime;

                // Ograniczenie deltaTime, aby uniknąć "skoków" przy zacięciu przeglądarki
                const maxDeltaTime = 0.1; // np. 100ms
                const dt = Math.min(deltaTime, maxDeltaTime);


                // --- Aktualizacje (używamy dt do obliczeń zależnych od czasu, ale tu fizyka jest prostsza) ---
                aiMove();
                updatePositions(); // Aktualizacja pozycji i kolizje ze ścianami
                checkCollisions(); // Kolizje między obiektami

                // --- Rysowanie ---
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawField();
                drawGameObjects();

                // --- Kolejna klatka ---
                requestAnimationFrame(gameLoop);
            }

            // --- Start Gry ---
            document.addEventListener("DOMContentLoaded", () => {
                initGame();
                document.getElementById("backToStartBtn").addEventListener("click", () => {
                    console.log("Kliknięto Powrót do Menu (atrapa)");
                    if(gameAnimating) gameOver(); // Zakończ grę jeśli trwa
                    // Tutaj logika powrotu do menu
                });
            });

        })();
    </script>

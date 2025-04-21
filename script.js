<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MiniSoccer - Mecz</title>
    <!-- Łącze do czcionki Nunito -->
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
        /* GLOBALNE STYLE – DESIGN W PIŁKARSKIM KLIMACIE */
        body {
            font-family: "Nunito", sans-serif;
            /* Tło można dostosować lub usunąć jeśli wolisz prostsze */
            background: url("https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80") no-repeat center center fixed;
            background-size: cover;
            margin: 0;
            padding: 0;
            text-align: center;
            color: #fff;
            display: flex; /* Używamy flexbox do centrowania ekranu gry */
            justify-content: center;
            align-items: center;
            min-height: 100vh; /* Minimalna wysokość na całą wysokość ekranu */
        }
        /* Przyciemnienie tła dla lepszej czytelności */
        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4); /* Lekko ciemniejsze */
            z-index: -1;
        }

        /* EKRAN GRY */
        #gameScreen {
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.2); /* Lekkie tło dla kontenera gry */
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        #scoreboardContainer {
            margin-bottom: 15px; /* Mniejszy margines */
        }
        #scoreboard {
            font-size: 32px; /* Trochę większy wynik */
            font-weight: bold;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
        }
        #matchTimer {
            font-size: 22px; /* Trochę większy czas */
            margin-top: 5px;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
        }
        canvas {
            background-color: #2E8B57; /* Ciemniejsza zieleń murawy */
            border: 4px solid #fff;
            border-radius: 10px; /* Mniejsze zaokrąglenie */
            display: block;
            margin: 0 auto;
            box-shadow: 0px 6px 12px rgba(0,0,0,0.4); /* Wyraźniejszy cień */
        }
        #backToStartBtn { /* Przycisk powrotu - na razie tylko atrapa */
            font-size: 16px;
            padding: 10px 20px;
            margin-top: 20px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.85);
            color: #333;
            border: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            box-shadow: 0px 3px 6px rgba(0,0,0,0.2);
        }
        #backToStartBtn:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-2px);
            box-shadow: 0px 5px 10px rgba(0,0,0,0.3);
        }
         /* Styl dla linii naciągu */
         .drag-line {
            stroke: rgba(255, 0, 0, 0.7);
            stroke-width: 3;
            stroke-dasharray: 5, 5;
        }
    </style>
</head>
<body>
    <!-- EKRAN GRY -->
    <div id="gameScreen">
        <div id="scoreboardContainer">
            <h2 id="scoreboard">Drużyna 1 0 : 0 Drużyna 2</h2>
            <h3 id="matchTimer">Czas: 3:00</h3>
        </div>
        <!-- Rozmiar canvas można dostosować -->
        <canvas id="gameCanvas" width="800" height="500"></canvas>
        <!-- Ten przycisk na razie nic nie robi, bo nie ma ekranu startowego w tym kodzie -->
        <button id="backToStartBtn">Powrót do Menu (Atrapa)</button>
    </div>

    <script>
        (function () {
            "use strict";

            // --- Konfiguracja Gry ---
            const PLAYER_RADIUS = 15;
            const GOALKEEPER_RADIUS = 17;
            const BALL_RADIUS = 8;
            const FRICTION = 0.985; // Tarcie (mniejsza wartość = szybsze zwalnianie)
            const PLAYER_DRAG_IMPULSE_SCALE = 0.06; // Siła "strzału" po puszczeniu
            const BALL_COLLISION_IMPULSE = 5; // Siła odbicia piłki od zawodnika
            const AI_SPEED = 1.8; // Prędkość zawodników AI
            const GOALIE_SPEED = 2.5; // Prędkość bramkarza AI
            const MATCH_DURATION = 180; // Czas meczu w sekundach (3:00)

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
            let draggingPlayer = null; // Przechowuje obiekt przeciąganego gracza
            let dragStartCoords = { x: 0, y: 0 }; // Gdzie kliknięto na graczu
            let currentMouseCoords = { x: 0, y: 0 }; // Aktualna pozycja myszy

            // Nazwy drużyn (można je później pobierać z ekranu wyboru)
            let homeTeamName = "Drużyna 1";
            let awayTeamName = "Drużyna 2";

            // --- Inicjalizacja Gry ---
            function initGame() {
                canvas = document.getElementById("gameCanvas");
                ctx = canvas.getContext("2d");

                score = { home: 0, away: 0 };
                updateScoreboard();

                // Piłka na środku
                ball = {
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    radius: BALL_RADIUS,
                    vx: 0, // Startowa prędkość x
                    vy: 0, // Startowa prędkość y
                    color: "white"
                };

                // Drużyna Domowa (Gracz) - 4 w polu + 1 bramkarz
                homePlayers = [
                    // Bramkarz
                    { id: 'H_GK', type: 'goalkeeper', x: 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                    // Zawodnicy z pola
                    { id: 'H_P1', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                    { id: 'H_P2', type: 'player', x: canvas.width * 0.2, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                    { id: 'H_P3', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" },
                    { id: 'H_P4', type: 'player', x: canvas.width * 0.35, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#007bff" }
                ];

                // Drużyna Gości (AI) - 4 w polu + 1 bramkarz
                awayPlayers = [
                     // Bramkarz
                     { id: 'A_GK', type: 'goalkeeper', x: canvas.width - 50, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                    // Zawodnicy z pola
                    { id: 'A_P1', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.25, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                    { id: 'A_P2', type: 'player', x: canvas.width * 0.8, y: canvas.height * 0.75, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                    { id: 'A_P3', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.4, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" },
                    { id: 'A_P4', type: 'player', x: canvas.width * 0.65, y: canvas.height * 0.6, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: "#dc3545" }
                ];

                 // Reset i start timera
                 stopTimer(); // Zatrzymaj, jeśli działał
                 matchTime = MATCH_DURATION;
                 updateTimerDisplay();
                 startTimer();

                 // Dodaj obsługę myszy
                 addCanvasEvents();

                 // Rozpocznij pętlę gry
                 gameAnimating = true;
                 gameLoop();
            }

            // --- Rysowanie ---
            function drawField() {
                // Tło (już jest w CSS, ale można też tu rysować)
                ctx.fillStyle = "#2E8B57";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Linie boiska ("bandy" to krawędzie canvas)
                ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; // Półprzezroczysta biała linia
                ctx.lineWidth = 2;

                // Linia środkowa
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();

                // Koło środkowe
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
                ctx.stroke();

                 // Bramki (proste oznaczenie)
                 const goalWidth = 8; // Grubość słupka bramki
                 const goalHeight = 100; // Wysokość bramki
                 ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                 // Bramka lewa
                 ctx.fillRect(0, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);
                 // Bramka prawa
                 ctx.fillRect(canvas.width - goalWidth, canvas.height / 2 - goalHeight / 2, goalWidth, goalHeight);

                 // Można dodać linie pola karnego dla estetyki
                 const penaltyBoxWidth = 100;
                 const penaltyBoxHeight = 200;
                 // Lewe pole karne
                 ctx.strokeRect(0, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
                  // Prawe pole karne
                 ctx.strokeRect(canvas.width - penaltyBoxWidth, canvas.height/2 - penaltyBoxHeight/2, penaltyBoxWidth, penaltyBoxHeight);
            }

            function drawGameObjects() {
                // Rysuj piłkę
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fillStyle = ball.color;
                ctx.fill();
                ctx.closePath();

                // Rysuj graczy (domowych i gości)
                [...homePlayers, ...awayPlayers].forEach(player => {
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                    ctx.fillStyle = player.color;
                    ctx.fill();
                    // Opcjonalnie: obramowanie dla lepszej widoczności
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.closePath();
                });

                // Rysuj linię naciągu, jeśli gracz jest przeciągany
                if (isDragging && draggingPlayer) {
                     ctx.beginPath();
                     ctx.moveTo(draggingPlayer.x, draggingPlayer.y);
                     // Linia pokazuje przeciwny kierunek do przeciągania
                     let targetX = draggingPlayer.x + (dragStartCoords.x - currentMouseCoords.x);
                     let targetY = draggingPlayer.y + (dragStartCoords.y - currentMouseCoords.y);
                     ctx.lineTo(targetX, targetY);
                     ctx.strokeStyle = "rgba(255, 255, 0, 0.8)"; // Żółta linia naciągu
                     ctx.lineWidth = 2;
                     ctx.setLineDash([5, 5]); // Linia przerywana
                     ctx.stroke();
                     ctx.setLineDash([]); // Reset stylu linii
                }
            }

            // --- Fizyka i Aktualizacja Pozycji ---
            function updatePositions() {
                // Aktualizuj wszystkich graczy
                 [...homePlayers, ...awayPlayers].forEach(player => {
                    player.x += player.vx;
                    player.y += player.vy;
                    player.vx *= FRICTION; // Zastosuj tarcie
                    player.vy *= FRICTION;

                    // Odbicie od band poziomych (góra/dół)
                    if (player.y - player.radius < 0) {
                        player.y = player.radius;
                        player.vy *= -0.7; // Odbicie ze stratą energii
                    } else if (player.y + player.radius > canvas.height) {
                        player.y = canvas.height - player.radius;
                        player.vy *= -0.7;
                    }

                    // Odbicie od band pionowych (lewo/prawo)
                    if (player.x - player.radius < 0) {
                        player.x = player.radius;
                        player.vx *= -0.7;
                    } else if (player.x + player.radius > canvas.width) {
                        player.x = canvas.width - player.radius;
                        player.vx *= -0.7;
                    }

                     // Ograniczenie ruchu bramkarzy do ich połów
                     if (player.type === 'goalkeeper') {
                        if (player.id.startsWith('H_') && player.x > canvas.width / 2 - player.radius) {
                            player.x = canvas.width / 2 - player.radius;
                            player.vx = 0; // Zatrzymaj ruch poziomy
                        } else if (player.id.startsWith('A_') && player.x < canvas.width / 2 + player.radius) {
                            player.x = canvas.width / 2 + player.radius;
                            player.vx = 0; // Zatrzymaj ruch poziomy
                        }
                    }
                });

                // Aktualizuj piłkę
                ball.x += ball.dx;
                ball.y += ball.dy;
                ball.dx *= FRICTION;
                ball.dy *= FRICTION;

                // Odbicie piłki od band poziomych (góra/dół) - "bandy reklamowe"
                if (ball.y - ball.radius < 0) {
                    ball.y = ball.radius;
                    ball.dy *= -0.9; // Odbicie piłki jest bardziej sprężyste
                } else if (ball.y + ball.radius > canvas.height) {
                    ball.y = canvas.height - ball.radius;
                    ball.dy *= -0.9;
                }

                // Odbicie piłki od band pionowych LUB GOL
                const goalHeight = 100;
                const goalTopY = canvas.height / 2 - goalHeight / 2;
                const goalBottomY = canvas.height / 2 + goalHeight / 2;

                if (ball.x - ball.radius < 0) { // Potencjalny gol dla gości
                    if (ball.y > goalTopY && ball.y < goalBottomY) {
                        // GOL DLA GOŚCI!
                        score.away++;
                        updateScoreboard();
                        resetPositionsAfterGoal('home'); // Kto strzelił, ten zaczyna
                    } else {
                        // Odbicie od słupka/ściany obok bramki
                        ball.x = ball.radius;
                        ball.dx *= -0.9;
                    }
                } else if (ball.x + ball.radius > canvas.width) { // Potencjalny gol dla gospodarzy
                    if (ball.y > goalTopY && ball.y < goalBottomY) {
                        // GOL DLA GOSPODARZY!
                        score.home++;
                        updateScoreboard();
                        resetPositionsAfterGoal('away'); // Kto strzelił, ten zaczyna
                    } else {
                        // Odbicie od słupka/ściany obok bramki
                        ball.x = canvas.width - ball.radius;
                        ball.dx *= -0.9;
                    }
                }
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

                // Kolizje Gracz - Gracz (proste rozpychanie)
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
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < circle1.radius + circle2.radius;
            }

            function handlePlayerBallCollision(player, ball) {
                const dx = ball.x - player.x;
                const dy = ball.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Unikaj dzielenia przez zero

                // Wektor normalny kolizji
                const normalX = dx / distance;
                const normalY = dy / distance;

                 // Odsunięcie, aby się nie zakleszczyły
                 const overlap = player.radius + ball.radius - distance;
                 if (overlap > 0) {
                     const moveCorrectionFactor = 0.6; // Jak szybko się rozsuną
                     ball.x += normalX * overlap * moveCorrectionFactor;
                     ball.y += normalY * overlap * moveCorrectionFactor;
                     player.x -= normalX * overlap * (1 - moveCorrectionFactor);
                     player.y -= normalY * overlap * (1 - moveCorrectionFactor);
                 }


                // Oblicz względną prędkość
                const relativeVx = ball.dx - player.vx;
                const relativeVy = ball.dy - player.vy;

                // Oblicz prędkość wzdłuż wektora normalnego
                let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                 // Nie rób nic, jeśli obiekty się oddalają
                 if (speedAlongNormal > 0) return;

                // Współczynnik restytucji (sprężystość odbicia piłki)
                const restitution = 0.7;

                // Oblicz impuls
                let impulse = -(1 + restitution) * speedAlongNormal;
                // Tutaj można by dodać masy, ale dla uproszczenia zakładamy masę gracza >> masa piłki
                // impulse /= (1 / masa_pilki + 1 / masa_gracza); // -> uproszczone

                 // Zastosuj impuls do piłki (gracz jest "ciężki")
                 // Dodajemy też mały stały impuls, aby piłka zawsze odskoczyła
                 const minImpulse = BALL_COLLISION_IMPULSE * 0.5;
                 ball.dx += Math.max(impulse, minImpulse) * normalX;
                 ball.dy += Math.max(impulse, minImpulse) * normalY;

                // Można też dodać mały impuls dla gracza w przeciwnym kierunku
                // player.vx -= impulse * normalX * (masa_pilki / masa_gracza); // -> uproszczone
                // player.vy -= impulse * normalY * (masa_pilki / masa_gracza);
            }


            function handlePlayerPlayerCollision(player1, player2) {
                 const dx = player2.x - player1.x;
                 const dy = player2.y - player1.y;
                 const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                 const overlap = player1.radius + player2.radius - distance;

                 if (overlap > 0) {
                     // Wektor normalny
                     const normalX = dx / distance;
                     const normalY = dy / distance;

                     // Rozsuń graczy proporcjonalnie
                     const moveCorrection = overlap / 2; // Każdy gracz odsuwa się o połowę
                     player1.x -= normalX * moveCorrection;
                     player1.y -= normalY * moveCorrection;
                     player2.x += normalX * moveCorrection;
                     player2.y += normalY * moveCorrection;

                     // Proste odbicie - wymienią się częścią prędkości wzdłuż normalnej
                     // (Bardziej złożona fizyka wymagałaby uwzględnienia mas)
                    const restitution = 0.3; // Mało sprężyste odbicie graczy

                    const relativeVx = player1.vx - player2.vx;
                    const relativeVy = player1.vy - player2.vy;
                    let speedAlongNormal = relativeVx * normalX + relativeVy * normalY;

                     if (speedAlongNormal > 0) return; // Już się oddalają

                    let impulse = -(1 + restitution) * speedAlongNormal;
                    impulse /= 2; // Zakładamy równe masy dla uproszczenia

                    player1.vx += impulse * normalX;
                    player1.vy += impulse * normalY;
                    player2.vx -= impulse * normalX;
                    player2.vy -= impulse * normalY;
                 }
            }


            // --- Sztuczna Inteligencja (Bardzo Prosta) ---
            function aiMove() {
                 awayPlayers.forEach(player => {
                    if (player.type === 'player') { // AI dla graczy z pola
                        let targetX = ball.x;
                        let targetY = ball.y;

                        // Prosta strategia: idź w stronę piłki
                         // Można dodać trochę losowości lub lepsze pozycjonowanie
                         // np. obrońca cofa się, napastnik idzie do przodu

                        const dx = targetX - player.x;
                        const dy = targetY - player.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                        // Nadaj prędkość w kierunku celu
                        player.vx += (dx / distance) * AI_SPEED * 0.1; // 0.1 dla płynniejszego przyspieszenia
                        player.vy += (dy / distance) * AI_SPEED * 0.1;

                         // Ograniczenie maksymalnej prędkości AI
                         const currentSpeed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
                         if(currentSpeed > AI_SPEED) {
                             player.vx = (player.vx / currentSpeed) * AI_SPEED;
                             player.vy = (player.vy / currentSpeed) * AI_SPEED;
                         }

                    } else if (player.type === 'goalkeeper') { // AI dla bramkarza
                        // Bramkarz porusza się tylko w pionie, śledząc piłkę
                         let targetY = ball.y;
                         // Ogranicz ruch pionowy bramkarza do sensownego zakresu
                         const minY = player.radius;
                         const maxY = canvas.height - player.radius;
                         targetY = Math.max(minY, Math.min(maxY, targetY));

                         const dy = targetY - player.y;
                         const distanceY = Math.abs(dy);

                         if (distanceY > 5) { // Ruszaj się, jeśli piłka jest dalej niż 5px
                             player.vy = (dy / distanceY) * GOALIE_SPEED;
                         } else {
                             player.vy *= FRICTION; // Zatrzymaj się blisko celu
                         }
                         // Bramkarz AI nie rusza się w poziomie (chyba że zostanie popchnięty)
                         // player.vx *= FRICTION;
                    }
                });
            }

            // --- Sterowanie Graczem (Przeciąganie) ---
            function getMousePos(canvas, evt) {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            }

            function canvasMouseDown(e) {
                const mousePos = getMousePos(canvas, e);

                // Sprawdź tylko graczy domowych
                for (const player of homePlayers) {
                    const dx = mousePos.x - player.x;
                    const dy = mousePos.y - player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < player.radius) {
                        isDragging = true;
                        draggingPlayer = player; // Zapisz obiekt gracza
                        // Zapisz punkt startowy WZGLĘDEM ŚRODKA GRACZA, żeby było płynniej
                        // dragStartCoords = { x: dx, y: dy }; // Gdzie kliknięto na graczu
                        dragStartCoords = { x: player.x, y: player.y }; // Pozycja gracza w momencie startu
                        currentMouseCoords = mousePos; // Aktualna pozycja myszy
                        canvas.style.cursor = "grabbing";
                        break; // Znaleziono gracza, przerwij pętlę
                    }
                }
            }

            function canvasMouseMove(e) {
                if (!isDragging) return;
                currentMouseCoords = getMousePos(canvas, e);
                // Nie przesuwamy gracza podczas przeciągania, tylko rysujemy linię
            }

            function canvasMouseUp(e) {
                if (!isDragging || !draggingPlayer) return;

                const mousePos = getMousePos(canvas, e);
                // Wektor przeciągnięcia (od startu gracza do puszczenia myszy)
                // Kierunek strzału jest przeciwny
                const dragVectorX = dragStartCoords.x - mousePos.x;
                const dragVectorY = dragStartCoords.y - mousePos.y;

                // Nadaj prędkość graczowi
                draggingPlayer.vx = dragVectorX * PLAYER_DRAG_IMPULSE_SCALE;
                draggingPlayer.vy = dragVectorY * PLAYER_DRAG_IMPULSE_SCALE;

                // Reset stanu przeciągania
                isDragging = false;
                draggingPlayer = null;
                canvas.style.cursor = "grab"; // lub 'default'
            }

             function canvasMouseLeave(e) {
                 // Jeśli mysz opuści canvas podczas przeciągania, anuluj
                 if (isDragging) {
                     isDragging = false;
                     draggingPlayer = null;
                     canvas.style.cursor = "default";
                 }
             }

            function addCanvasEvents() {
                // Ustaw kursor początkowy
                canvas.style.cursor = 'grab';

                // Usuń poprzednie listenery, jeśli istniały (ważne przy restartach)
                canvas.removeEventListener("mousedown", canvasMouseDown);
                canvas.removeEventListener("mousemove", canvasMouseMove);
                canvas.removeEventListener("mouseup", canvasMouseUp);
                canvas.removeEventListener("mouseleave", canvasMouseLeave); // Dodajemy leave

                // Dodaj nowe listenery
                canvas.addEventListener("mousedown", canvasMouseDown);
                canvas.addEventListener("mousemove", canvasMouseMove);
                canvas.addEventListener("mouseup", canvasMouseUp);
                canvas.addEventListener("mouseleave", canvasMouseLeave); // Anuluj przeciąganie przy wyjściu
            }


             // --- Zarządzanie Czasem i Wynikiem ---
             function updateTimerDisplay() {
                 let minutes = Math.floor(matchTime / 60);
                 let seconds = matchTime % 60;
                 seconds = seconds < 10 ? "0" + seconds : seconds; // Dodaj zero wiodące
                 document.getElementById("matchTimer").innerText = `Czas: ${minutes}:${seconds}`;
             }

             function startTimer() {
                 if (matchTimerInterval) clearInterval(matchTimerInterval); // Wyczyść stary interwał
                 matchTimerInterval = setInterval(() => {
                     matchTime--;
                     updateTimerDisplay();
                     if (matchTime <= 0) {
                         gameOver();
                     }
                 }, 1000); // Co sekundę
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
                 // Zatrzymaj wszystko na chwilę
                 ball.vx = 0;
                 ball.vy = 0;
                 homePlayers.forEach(p => { p.vx = 0; p.vy = 0; });
                 awayPlayers.forEach(p => { p.vx = 0; p.vy = 0; });


                 // Piłka na środku
                 ball.x = canvas.width / 2;
                 ball.y = canvas.height / 2;


                // Ustawienie początkowe graczy (tak jak w initGame)
                 // Drużyna Domowa
                 homePlayers[0].x = 50; homePlayers[0].y = canvas.height / 2; // GK
                 homePlayers[1].x = canvas.width * 0.2; homePlayers[1].y = canvas.height * 0.25;
                 homePlayers[2].x = canvas.width * 0.2; homePlayers[2].y = canvas.height * 0.75;
                 homePlayers[3].x = canvas.width * 0.35; homePlayers[3].y = canvas.height * 0.4;
                 homePlayers[4].x = canvas.width * 0.35; homePlayers[4].y = canvas.height * 0.6;

                 // Drużyna Gości
                 awayPlayers[0].x = canvas.width - 50; awayPlayers[0].y = canvas.height / 2; // GK
                 awayPlayers[1].x = canvas.width * 0.8; awayPlayers[1].y = canvas.height * 0.25;
                 awayPlayers[2].x = canvas.width * 0.8; awayPlayers[2].y = canvas.height * 0.75;
                 awayPlayers[3].x = canvas.width * 0.65; awayPlayers[3].y = canvas.height * 0.4;
                 awayPlayers[4].x = canvas.width * 0.65; awayPlayers[4].y = canvas.height * 0.6;

                 // Opcjonalnie: lekki ruch piłki dla drużyny rozpoczynającej
                 // if (startingTeam === 'home') {
                 //     ball.dx = 1;
                 // } else {
                 //     ball.dx = -1;
                 // }

                 // Krótka pauza przed wznowieniem (np. 1 sekunda)
                 // Na razie pomijamy dla uproszczenia, gra rusza od razu
             }


             function gameOver() {
                 stopTimer();
                 gameAnimating = false;
                 canvas.style.cursor = 'default'; // Resetuj kursor
                 // Usuń listenery, aby nie można było grać po zakończeniu
                 canvas.removeEventListener("mousedown", canvasMouseDown);
                 canvas.removeEventListener("mousemove", canvasMouseMove);
                 canvas.removeEventListener("mouseup", canvasMouseUp);
                 canvas.removeEventListener("mouseleave", canvasMouseLeave);

                 // Wyświetl wynik końcowy
                 alert(`Koniec meczu!\nWynik: ${homeTeamName} ${score.home} : ${score.away} ${awayTeamName}`);

                 // Tutaj można by dodać logikę powrotu do menu, np.:
                 // document.getElementById('gameScreen').style.display = 'none';
                 // document.getElementById('startScreen').style.display = 'block';
                 // Ale ponieważ nie ma tu ekranu startowego, nic więcej nie robimy.
             }

            // --- Główna Pętla Gry ---
            function gameLoop() {
                if (!gameAnimating) return; // Zatrzymaj pętlę, jeśli gra nie jest aktywna

                // 1. Wyczyść Canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 2. Narysuj tło/boisko
                drawField();

                // 3. Wykonaj ruch AI (przed aktualizacją pozycji gracza)
                aiMove();

                // 4. Zaktualizuj pozycje (fizyka, odbicia od band, gole)
                updatePositions();

                // 5. Sprawdź i obsłuż kolizje (piłka-gracz, gracz-gracz)
                checkCollisions();

                // 6. Narysuj obiekty (piłka, gracze, linia naciągu)
                drawGameObjects();

                // 7. Poproś o kolejną klatkę animacji
                requestAnimationFrame(gameLoop);
            }

            // --- Start Gry po załadowaniu strony ---
            document.addEventListener("DOMContentLoaded", () => {
                // Uruchom grę od razu po załadowaniu strony
                initGame();

                // Obsługa przycisku "Powrót" (na razie tylko loguje)
                document.getElementById("backToStartBtn").addEventListener("click", () => {
                    console.log("Kliknięto Powrót do Menu (funkcjonalność niezaimplementowana w tym przykładzie)");
                    // Tutaj normalnie byłoby:
                    // gameOver(); // Zakończ bieżącą grę
                    // Pokaż ekran startowy, ukryj ekran gry
                });
            });

        })();
    </script>
</body>
</html>

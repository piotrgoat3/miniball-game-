/* =============================
   CZĘŚĆ I. USTAWIENIA I INICJALIZACJA GRY
   ============================= */

// Globalne zmienne
let canvas, ctx;
let score = { goals: 0 };

// Obiekt piłki
let ball;

// Drużyna: 4 zawodników outfield i 1 bramkarz
let fieldPlayers = []; // Obiekty sterowane przez przeciąganie myszy
let goalkeeper = {};   // Bramkarz – pozostaje statyczny

// Zmienne do obsługi przeciągania
let draggingPlayerIndex = null;
let dragStart = { x: 0, y: 0 };
let dragCurrent = { x: 0, y: 0 };
let isDragging = false;

// Parametry fizyki
const FRICTION = 0.98;
const DRAG_IMPULSE_SCALE = 0.2;       // Skalowanie wektora impulsu dla gracza
const BALL_COLLISION_IMPULSE = 7;     // Impuls nadający piłce przy kolizji
const PLAYER_RADIUS = 16;
const GOALKEEPER_RADIUS = 18;

// Funkcja inicjalizująca rozgrywkę:
function initGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  
  // Inicjalizacja piłki – umieszczamy ją na środku boiska (trochę przesuniętą w prawo, aby była bliżej bramki przeciwnika)
  ball = {
    x: canvas.width * 0.55,
    y: canvas.height / 2,
    radius: 8,
    dx: 0,
    dy: 0
  };

  // Inicjalizacja 4 outfield graczy – ustawieni na lewej połowie boiska
  fieldPlayers = [
    { x: canvas.width * 0.25, y: canvas.height * 0.3, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
    { x: canvas.width * 0.25, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
    { x: canvas.width * 0.25, y: canvas.height * 0.7, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
    { x: canvas.width * 0.35, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0 }
  ];

  // Inicjalizacja bramkarza – umieszczony blisko lewej krawędzi
  goalkeeper = { x: 60, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0 };

  score.goals = 0;
}

/* =============================
   CZĘŚĆ II. RYSOWANIE BOISKA I OBIEKTÓW
   ============================= */

// Funkcja rysująca boisko
function drawField() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  // Rysowanie obrysu boiska z marginesem 10px
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
  // Rysujemy bramkę po prawej stronie – cel zdobycia gola
  ctx.fillStyle = "white";
  ctx.fillRect(canvas.width - 10, canvas.height/2 - 50, 10, 100);
  
  // Bannery reklamowe (żółte paski u góry i dołu)
  ctx.fillStyle = "yellow";
  ctx.fillRect(10, 0, canvas.width - 20, 10);
  ctx.fillRect(10, canvas.height - 10, canvas.width - 20, 10);
}

// Funkcja rysująca piłkę, zawodników i bramkarza
function drawGameObjects() {
  // Istniejące obiekty: piłka
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
  
  // Outfield players (rysowani na niebiesko)
  fieldPlayers.forEach((player) => {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
  });
  
  // Bramkarz (rysowany na czarno)
  ctx.beginPath();
  ctx.arc(goalkeeper.x, goalkeeper.y, goalkeeper.radius, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();
  
  // Jeśli przeciągamy gracza, rysowana jest przerywana linia
  if (isDragging && draggingPlayerIndex !== null) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    const p = fieldPlayers[draggingPlayerIndex];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(dragCurrent.x, dragCurrent.y);
    ctx.stroke();
    ctx.restore();
  }
}

/* =============================
   CZĘŚĆ III. AKTUALIZACJA FIZYKI I KOLIZJI
   ============================= */

// Aktualizacja pozycji: ruch zawodników i piłki
function updatePositions() {
  // Aktualizacja pozycji zawodników outfield: dodajemy prędkość, stosujemy tarcie
  fieldPlayers.forEach((player) => {
    player.x += player.vx;
    player.y += player.vy;
    player.vx *= FRICTION;
    player.vy *= FRICTION;
  });
  
  // Aktualizacja pozycji piłki
  ball.x += ball.dx;
  ball.y += ball.dy;
  ball.dx *= FRICTION;
  ball.dy *= FRICTION;
  
  // Odbicia piłki od górnej i dolnej krawędzi
  if (ball.y - ball.radius < 10) {
    ball.y = 10 + ball.radius;
    ball.dy *= -1;
  }
  if (ball.y + ball.radius > canvas.height - 10) {
    ball.y = canvas.height - 10 - ball.radius;
    ball.dy *= -1;
  }
  
  // Detekcja gola: jeśli piłka przekroczy prawą krawędź
  if (ball.x + ball.radius > canvas.width) {
    score.goals++;
    resetBall();
  }
}

// Resetowanie piłki do centrum po golu
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx = 0;
  ball.dy = 0;
}

// Prosta funkcja wykrywająca kolizję dwóch kół
function circleCollision(c1, c2) {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  return Math.hypot(dx, dy) < (c1.radius + c2.radius);
}

// Obsługa kolizji między zawodnikiem (lub bramkarzem) a piłką – nadaj impuls piłce
function handlePlayerBallCollision(player) {
  if (circleCollision(player, ball)) {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    ball.dx = (dx / dist) * BALL_COLLISION_IMPULSE;
    ball.dy = (dy / dist) * BALL_COLLISION_IMPULSE;
  }
}

// Sprawdzamy kolizje dla wszystkich zawodników oraz bramkarza
function checkCollisions() {
  fieldPlayers.forEach((player) => {
    handlePlayerBallCollision(player);
  });
  handlePlayerBallCollision(goalkeeper);
}

/* =============================
   CZĘŚĆ IV. PĘTLA GRY
   ============================= */
function gameLoop() {
  if (!gameAnimating) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
  updatePositions();
  checkCollisions();
  drawGameObjects();
  document.getElementById("scoreboard").innerText = "Gole: " + score.goals;
  requestAnimationFrame(gameLoop);
}

/* =============================
   CZĘŚĆ V. OBSŁUGA PRZECIĄGANIA GRACZA
   ============================= */
// Funkcje obsługujące przeciąganie (drag) danego zawodnika przez użytkownika na canvasie
function canvasMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // Sprawdzamy dla pierwszych 4 graczy (outfield)
  for (let i = 0; i < fieldPlayers.length; i++) {
    const p = fieldPlayers[i];
    const dist = Math.hypot(mx - p.x, my - p.y);
    if (dist < p.radius) {
      draggingPlayerIndex = i;
      isDragging = true;
      dragStart = { x: p.x, y: p.y };
      dragCurrent = { x: mx, y: my };
      break;
    }
  }
}
function canvasMouseMove(e) {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  dragCurrent.x = e.clientX - rect.left;
  dragCurrent.y = e.clientY - rect.top;
}
function canvasMouseUp(e) {
  if (!isDragging || draggingPlayerIndex === null) return;
  // Obliczamy wektor impulsu – różnica między punktem początkowym a końcowym przeciągania
  const dx = dragStart.x - dragCurrent.x;
  const dy = dragStart.y - dragCurrent.y;
  // Skalujemy impuls i przypisujemy do wybranego gracza (outfield)
  fieldPlayers[draggingPlayerIndex].vx = dx * DRAG_IMPULSE_SCALE;
  fieldPlayers[draggingPlayerIndex].vy = dy * DRAG_IMPULSE_SCALE;
  isDragging = false;
  draggingPlayerIndex = null;
}
// Dodajemy zdarzenia myszy do canvas
function addCanvasEvents() {
  canvas.addEventListener("mousedown", canvasMouseDown);
  canvas.addEventListener("mousemove", canvasMouseMove);
  canvas.addEventListener("mouseup", canvasMouseUp);
}

/* =============================
   CZĘŚĆ VI. MODALE: Baza zawodników i Wybór języka
   ============================= */
// Przełączanie widoczności modali
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}
// Zamknięcie modala przez kliknięcie poza zawartość
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});
// Baza zawodników – obsługa localStorage
function loadPlayersDB() {
  let players = localStorage.getItem("players");
  if (players) return JSON.parse(players);
  else {
    const defaultPlayers = [
      { name: "Lionel Messi", team: "Paris Saint-Germain", rating: 94 },
      { name: "Cristiano Ronaldo", team: "Manchester United", rating: 93 },
      { name: "Kylian Mbappe", team: "Paris Saint-Germain", rating: 92 },
      { name: "Neymar Jr", team: "Paris Saint-Germain", rating: 91 },
      { name: "Robert Lewandowski", team: "Bayern Munich", rating: 91 },
      { name: "Kevin De Bruyne", team: "Manchester City", rating: 91 },
      { name: "Virgil van Dijk", team: "Liverpool", rating: 90 },
      { name: "Mohamed Salah", team: "Liverpool", rating: 90 },
      { name: "Sadio Mane", team: "Liverpool", rating: 89 },
      { name: "Jan Oblak", team: "Atletico Madrid", rating: 90 },
      { name: "Manuel Neuer", team: "Bayern Munich", rating: 89 },
      { name: "Erling Haaland", team: "Borussia Dortmund", rating: 90 },
      { name: "Harry Kane", team: "Tottenham Hotspur", rating: 89 },
      { name: "Karim Benzema", team: "Real Madrid", rating: 90 },
      { name: "Luka Modric", team: "Real Madrid", rating: 89 },
      { name: "N'Golo Kante", team: "Chelsea", rating: 90 },
      { name: "Joshua Kimmich", team: "Bayern Munich", rating: 89 },
      { name: "Bruno Fernandes", team: "Manchester United", rating: 88 },
      { name: "Romelu Lukaku", team: "Chelsea", rating: 88 },
      { name: "Heung-Min Son", team: "Tottenham Hotspur", rating: 89 },
      { name: "David de Gea", team: "Manchester United", rating: 87 },
      { name: "Pedri", team: "Barcelona", rating: 88 },
      { name: "Frenkie de Jong", team: "Barcelona", rating: 88 },
      { name: "Raheem Sterling", team: "Chelsea", rating: 87 },
      { name: "Bernardo Silva", team: "Manchester City", rating: 88 },
      { name: "Rodri", team: "Manchester City", rating: 88 },
      { name: "Vinicius Jr", team: "Real Madrid", rating: 87 },
      { name: "Lautaro Martinez", team: "Inter Milan", rating: 87 },
      { name: "Casemiro", team: "Manchester United", rating: 87 },
      { name: "Jadon Sancho", team: "Manchester United", rating: 86 }
    ];
    localStorage.setItem("players", JSON.stringify(defaultPlayers));
    return defaultPlayers;
  }
}
function savePlayersDB(players) {
  localStorage.setItem("players", JSON.stringify(players));
}
function renderPlayerList() {
  const players = loadPlayersDB();
  const listContainer = document.getElementById("playerList");
  listContainer.innerHTML = "";
  if (players.length === 0) {
    listContainer.innerHTML = "<p>Brak zawodników w bazie.</p>";
    return;
  }
  players.forEach((player) => {
    const p = document.createElement("p");
    p.innerText = `${player.name} (${player.team}) - Ocena: ${player.rating}`;
    listContainer.appendChild(p);
  });
}
// Obsługa formularza dodawania zawodnika
document.getElementById("addPlayerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("playerName").value.trim();
  const team = document.getElementById("playerTeam").value.trim();
  const rating = parseInt(document.getElementById("playerRating").value.trim(), 10);
  if (!name || !team || isNaN(rating)) {
    alert("Proszę uzupełnić wszystkie pola.");
    return;
  }
  let players = loadPlayersDB();
  players.push({ name, team, rating });
  savePlayersDB(players);
  renderPlayerList();
  document.getElementById("addPlayerForm").reset();
});

/* =============================
   CZĘŚĆ VII. INICJALIZACJA ZDARZEŃ PO ŁADOWANIU DOM
   ============================= */
document.addEventListener("DOMContentLoaded", () => {
  // Obsługa przycisku "SZYBKI MECZ" – startuje rozgrywka
  document.getElementById("startMatchBtn").addEventListener("click", () => {
    // Ukrywamy ekran startowy i pokazujemy ekran gry
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    initGame();
    addCanvasEvents();
    gameAnimating = true;
    requestAnimationFrame(gameLoop);
    console.log("Tryb SZYBKI MECZ uruchomiony");
  });

  // Obsługa przycisku "Powrót do Menu"
  document.getElementById("backToStart").addEventListener("click", () => {
    gameAnimating = false;
    document.getElementById("gameScreen").classList.add("hidden");
    document.getElementById("startScreen").classList.remove("hidden");
  });

  // Obsługa modala Bazy zawodników
  document.getElementById("playerDBBtn").addEventListener("click", () => {
    renderPlayerList();
    toggleModal("playerDBModal", true);
  });
  
  // Obsługa modala Wyboru języka
  document.getElementById("languageBtn").addEventListener("click", () => {
    toggleModal("languageModal", true);
  });

  // Obsługa przycisku "Ustawienia"
  document.getElementById("settingsBtn").addEventListener("click", () => {
    alert("Opcja ustawień – do implementacji!");
  });

  // Zamknięcie modala Bazy zawodników
  document.getElementById("closePlayerDB").addEventListener("click", () => {
    toggleModal("playerDBModal", false);
  });

  // Zamknięcie modala Wyboru języka
  document.getElementById("closeLanguageModal").addEventListener("click", () => {
    toggleModal("languageModal", false);
  });

  // Obsługa przycisków wyboru języka w modalu
  const langOptions = document.getElementsByClassName("langOption");
  for (let i = 0; i < langOptions.length; i++) {
    langOptions[i].addEventListener("click", function () {
      const lang = this.getAttribute("data-lang");
      setLanguage(lang);
    });
  }
});

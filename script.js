// Globalne zmienne gry
let canvas, ctx;
let score = { left: 0, right: 0 };

// Przykładowe obiekty do gry (dla uproszczenia)
let player = { x: 300, y: 250, radius: 20 };
let ball = { x: 500, y: 250, radius: 10, dx: 2, dy: 1.5 };
let gameAnimating = false;

// Funkcja do przełączania ekranów
function showScreen(id) {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

// Rysowanie boiska z liniami, bramkami i banerami
function drawField() {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  // Zewnętrzny obrys boiska – zostawiamy mały margines (10px)
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Linia środkowa
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 10);
  ctx.lineTo(canvas.width / 2, canvas.height - 10);
  ctx.stroke();

  // Okrąg środkowy
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  ctx.stroke();

  // Bramki – prostokąty po lewej i prawej stronie
  ctx.fillStyle = "white";
  ctx.fillRect(0, (canvas.height / 2) - 50, 10, 100);                 // lewa bramka
  ctx.fillRect(canvas.width - 10, (canvas.height / 2) - 50, 10, 100);     // prawa bramka

  // Bannery reklamowe – top i bottom (żółte paski)
  ctx.fillStyle = "yellow";
  ctx.fillRect(10, 0, canvas.width - 20, 10);                            // górny banner
  ctx.fillRect(10, canvas.height - 10, canvas.width - 20, 10);            // dolny banner
}

// Rysowanie obiektów – piłki i zawodnika
function drawGameObjects() {
  // Rysujemy piłkę
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  // Rysujemy zawodnika
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.closePath();
}

// Główna pętla gry
function gameLoop() {
  if (!gameAnimating) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawField();
  drawGameObjects();

  // Aktualizacja pozycji piłki z prostą fizyką odbicia
  ball.x += ball.dx;
  ball.y += ball.dy;
  if (ball.x - ball.radius < 10 || ball.x + ball.radius > canvas.width - 10) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 10 || ball.y + ball.radius > canvas.height - 10) {
    ball.dy *= -1;
  }

  document.getElementById("scoreboard").innerText = `${score.left} - ${score.right}`;
  requestAnimationFrame(gameLoop);
}

// Funkcja do pokazywania/ukrywania modala
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

// Umożliwienie zamknięcia modala klikając poza obszarem modal-content
document.getElementById("playerDBModal").addEventListener("click", function(e) {
  if (e.target === this) {
    toggleModal("playerDBModal", false);
  }
});

// ============================
// Baza zawodników – obsługa localStorage
// ============================
function loadPlayers() {
  let players = localStorage.getItem("players");
  if (players) {
    return JSON.parse(players);
  } else {
    const defaultPlayers = [
      { "name": "Lionel Messi", "team": "Paris Saint-Germain", "rating": 94 },
      { "name": "Cristiano Ronaldo", "team": "Manchester United", "rating": 93 },
      { "name": "Kylian Mbappe", "team": "Paris Saint-Germain", "rating": 92 },
      { "name": "Neymar Jr", "team": "Paris Saint-Germain", "rating": 91 },
      { "name": "Robert Lewandowski", "team": "Bayern Munich", "rating": 91 },
      { "name": "Kevin De Bruyne", "team": "Manchester City", "rating": 91 },
      { "name": "Virgil van Dijk", "team": "Liverpool", "rating": 90 },
      { "name": "Mohamed Salah", "team": "Liverpool", "rating": 90 },
      { "name": "Sadio Mane", "team": "Liverpool", "rating": 89 },
      { "name": "Jan Oblak", "team": "Atletico Madrid", "rating": 90 },
      { "name": "Manuel Neuer", "team": "Bayern Munich", "rating": 89 },
      { "name": "Erling Haaland", "team": "Borussia Dortmund", "rating": 90 },
      { "name": "Harry Kane", "team": "Tottenham Hotspur", "rating": 89 },
      { "name": "Karim Benzema", "team": "Real Madrid", "rating": 90 },
      { "name": "Luka Modric", "team": "Real Madrid", "rating": 89 },
      { "name": "N'Golo Kante", "team": "Chelsea", "rating": 90 },
      { "name": "Joshua Kimmich", "team": "Bayern Munich", "rating": 89 },
      { "name": "Bruno Fernandes", "team": "Manchester United", "rating": 88 },
      { "name": "Romelu Lukaku", "team": "Chelsea", "rating": 88 },
      { "name": "Heung-Min Son", "team": "Tottenham Hotspur", "rating": 89 },
      { "name": "David de Gea", "team": "Manchester United", "rating": 87 },
      { "name": "Pedri", "team": "Barcelona", "rating": 88 },
      { "name": "Frenkie de Jong", "team": "Barcelona", "rating": 88 },
      { "name": "Raheem Sterling", "team": "Chelsea", "rating": 87 },
      { "name": "Bernardo Silva", "team": "Manchester City", "rating": 88 },
      { "name": "Rodri", "team": "Manchester City", "rating": 88 },
      { "name": "Vinicius Jr", "team": "Real Madrid", "rating": 87 },
      { "name": "Lautaro Martinez", "team": "Inter Milan", "rating": 87 },
      { "name": "Casemiro", "team": "Manchester United", "rating": 87 },
      { "name": "Jadon Sancho", "team": "Manchester United", "rating": 86 }
    ];
    localStorage.setItem("players", JSON.stringify(defaultPlayers));
    return defaultPlayers;
  }
}

function savePlayers(players) {
  localStorage.setItem("players", JSON.stringify(players));
}

function renderPlayerList() {
  const players = loadPlayers();
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

// ============================
// Inicjalizacja zdarzeń
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Przyciski w ekranie startowym
  document.getElementById("startMatchBtn").addEventListener("click", () => {
    showScreen("gameScreen");
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    gameAnimating = true;
    requestAnimationFrame(gameLoop);
  });

  document.getElementById("btnPlayerDB").addEventListener("click", () => {
    renderPlayerList();
    toggleModal("playerDBModal", true);
  });

  document.getElementById("btnLanguage").addEventListener("click", () => {
    alert("Opcja wyboru języka – do implementacji!");
  });

  document.getElementById("btnSettings").addEventListener("click", () => {
    alert("Opcja ustawień – do implementacji!");
  });

  // Powrót do menu z ekranu meczu
  document.getElementById("backToStart").addEventListener("click", () => {
    gameAnimating = false;
    showScreen("startScreen");
  });

  // Zamykanie modala przy kliknięciu przycisku "Zamknij"
  document.getElementById("closePlayerDB").addEventListener("click", () => {
    toggleModal("playerDBModal", false);
  });

  // Obsługa formularza dodawania zawodnika (uruchamia się dopiero wewnątrz modala)
  document.getElementById("addPlayerForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("playerName").value.trim();
    const team = document.getElementById("playerTeam").value.trim();
    const rating = parseInt(document.getElementById("playerRating").value.trim(), 10);
    if (!name || !team || isNaN(rating)) {
      alert("Proszę uzupełnić wszystkie pola.");
      return;
    }
    let players = loadPlayers();
    players.push({ name, team, rating });
    savePlayers(players);
    renderPlayerList();
    document.getElementById("addPlayerForm").reset();
  });
});

// Globalne zmienne gry
let canvas, ctx;
let score = { left: 0, right: 0 };

// Przykładowe obiekty: zawodnik oraz piłka
let player = { x: 300, y: 250, radius: 20 };
let ball = { x: 500, y: 250, radius: 10, dx: 2, dy: 1.5 };

// Sterowanie animacją
let gameAnimating = false;

// Funkcja do przełączania widoków (ekranów)
function showScreen(id) {
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

// Rysujemy cały pitch – boisko z liniami, bramkami i banerami
function drawField() {
  // Rysujemy zewnętrzny obrys boiska
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Rysujemy linię środkową (dzielącą boisko na dwie połowy)
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 10);
  ctx.lineTo(canvas.width / 2, canvas.height - 10);
  ctx.stroke();

  // Rysujemy okrąg środkowy (center circle)
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  ctx.stroke();

  // Rysujemy bramki po lewej i prawej stronie
  // Załóżmy, że bramka to prostokąt o szerokości 10px i wysokości 100px umieszczony na środku krawędzi
  ctx.fillStyle = "white";
  // Lewa bramka
  ctx.fillRect(0, (canvas.height / 2) - 50, 10, 100);
  // Prawa bramka
  ctx.fillRect(canvas.width - 10, (canvas.height / 2) - 50, 10, 100);

  // Rysujemy bannery reklamowe (na górze i dole boiska)
  ctx.fillStyle = "yellow";
  // Górny banner
  ctx.fillRect(10, 0, canvas.width - 20, 10);
  // Dolny banner
  ctx.fillRect(10, canvas.height - 10, canvas.width - 20, 10);
}

// Funkcja rysująca obiekty gry
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

// Pętla gry – rysowanie boiska, obiektów i aktualizacja pozycji piłki
function gameLoop() {
  if (!gameAnimating) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawField();
  drawGameObjects();

  // Aktualizacja pozycji piłki (prosta fizyka)
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Odbijanie piłki od krawędzi boiska (uwzględniając obrys)
  if (ball.x - ball.radius < 10 || ball.x + ball.radius > canvas.width - 10) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 10 || ball.y + ball.radius > canvas.height - 10) {
    ball.dy *= -1;
  }

  // Aktualizacja wyniku (na razie statyczne "0 - 0")
  document.getElementById("scoreboard").innerText = `${score.left} - ${score.right}`;

  requestAnimationFrame(gameLoop);
}

// Obsługa modal do bazy zawodników
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) {
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

// ============================
// Baza zawodników – localStorage
// ============================
function loadPlayers() {
  let players = localStorage.getItem("players");
  if (players) {
    return JSON.parse(players);
  } else {
    const defaultPlayers = [
      { "name": "Robert Lewandowski", "team": "Polska", "rating": 91 },
      { "name": "Lionel Messi", "team": "Argentyna", "rating": 94 },
      { "name": "Cristiano Ronaldo", "team": "Portugalia", "rating": 92 }
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
// Inicjalizacja zdarzeń po załadowaniu strony
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Przycisk startowy do rozpoczęcia meczu
  document.getElementById("startMatchBtn").addEventListener("click", () => {
    showScreen("gameScreen");
    // Inicjujemy canvas i uruchamiamy pętlę gry
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    gameAnimating = true;
    requestAnimationFrame(gameLoop);
  });

  // Powrót do menu (z ekranu gry)
  document.getElementById("backToStart").addEventListener("click", () => {
    gameAnimating = false;
    showScreen("startScreen");
  });

  // Przycisk do otwierania bazy zawodników
  document.getElementById("btnPlayerDB").addEventListener("click", () => {
    renderPlayerList();
    toggleModal("playerDBModal", true);
  });

  // Przycisk zamykania bazy zawodników
  document.getElementById("closePlayerDB").addEventListener("click", () => {
    toggleModal("playerDBModal", false);
  });

  // Przykładowe przyciski dla Języka i Ustawień
  document.getElementById("btnLanguage").addEventListener("click", () => {
    alert("Opcja wyboru języka – do implementacji!");
  });
  document.getElementById("btnSettings").addEventListener("click", () => {
    alert("Opcja ustawień – do implementacji!");
  });

  // Obsługa formularza dodawania zawodnika
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

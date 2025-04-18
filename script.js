// Globalne zmienne
let canvas, ctx;
let score = { left: 0, right: 0 };

// Przykładowe obiekty w grze – niech "player" to niebieski zawodnik, a "ball" to biała piłka
let player = { x: 300, y: 250, radius: 20 };
let ball = { x: 500, y: 250, radius: 10 };

// Zmienna sterująca animacją
let gameAnimating = true;

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // Uruchom animację – w tym przykładzie stale rysujemy ekran startowy
  requestAnimationFrame(gameLoop);

  // Obsługa przycisków górnego menu
  document.getElementById("btnPlayerDB").addEventListener("click", () => {
    renderPlayerList();
    toggleModal("playerDBModal", true);
  });

  document.getElementById("btnLanguage").addEventListener("click", () => {
    alert("Opcja wyboru języka – do implementacji");
  });

  document.getElementById("btnSettings").addEventListener("click", () => {
    alert("Opcja ustawień – do implementacji");
  });

  // Obsługa zamykania modala
  document.getElementById("closeModal").addEventListener("click", () => {
    toggleModal("playerDBModal", false);
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

// Funkcja rysująca ekran – używana, aby animacja na stałe odświeżała wygląd startowy
function gameLoop() {
  if (!gameAnimating) return; // Na razie nie zatrzymujemy animacji
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Tło pola już mamy ustawione przez CSS, ale można dodać dodatkowe elementy
  // Rysujemy biały obrys (piłkę)
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  // Rysujemy niebieskiego zawodnika
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.closePath();

  // Rysujemy czerwoną strzałkę wewnątrz niebieskiego okręgu (wersja uproszczona)
  drawArrow(ctx, player.x, player.y, player.x + player.radius * 0.8, player.y);

  // Wynik odświeżamy w HTML – choć statycznie "0 - 0"
  document.getElementById("scoreboard").innerText = `${score.left} - ${score.right}`;

  requestAnimationFrame(gameLoop);
}

// Funkcja do rysowania strzałki
function drawArrow(context, fromX, fromY, toX, toY) {
  const headlen = 8; // długość grotka
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.strokeStyle = "red";
  context.lineWidth = 2;
  context.stroke();
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  context.lineTo(toX, toY);
  context.fillStyle = "red";
  context.fill();
}

// -----------------------
// Baza zawodników (localStorage)
// -----------------------
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
  players.forEach((player, index) => {
    const p = document.createElement("p");
    p.innerText = `${player.name} (${player.team}) - Ocena: ${player.rating}`;
    listContainer.appendChild(p);
  });
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

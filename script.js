// Globalne zmienne gry (bez zmian)
let canvas, ctx, ball, score = { left: 0, right: 0 };
let dragging = false, dragStart = null;
let player = { x: 300, y: 250, radius: 20 };

// Funkcja przełączająca widoki
function showScreen(screenId) {
    // Ukryj wszystkie główne kontenery
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("game-container").classList.add("hidden");
    document.getElementById("playerDB").classList.add("hidden");
    // Pokaż wybrany
    document.getElementById(screenId).classList.remove("hidden");
}

function backToMenu() {
    showScreen("startScreen");
}

// Ekran gry - przykładowa implementacja, jak wcześniej
function startGame() {
    showScreen("game-container");

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    ball = { x: 400, y: 250, radius: 10, dx: 0, dy: 0 };

    updateScore();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rysowanie band (obszary)
    ctx.fillStyle = "yellow";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Rysowanie piłki
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

    // Rysowanie zawodnika
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();

    if (dragging && dragStart) {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(dragStart.x, dragStart.y);
        ctx.stroke();
    }

    // Aktualizacja pozycji piłki
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dx *= 0.98;
    ball.dy *= 0.98;

    if (ball.x < 0 || ball.x > canvas.width) ball.dx *= -1;
    if (ball.y < 20 || ball.y > canvas.height - 20) ball.dy *= -1;

    requestAnimationFrame(gameLoop);
}

function updateScore() {
    // Używamy poprawnego identyfikatora "scoreboard"
    document.getElementById("scoreboard").innerText = `${score.left} - ${score.right}`;
}

// Sterowanie myszy (obsługa zdarzeń)
document.addEventListener("DOMContentLoaded", () => {
    // Przypisanie obsługi przycisków startowych
    document.getElementById("quickMatchBtn").addEventListener("click", startGame);
    document.getElementById("playerDBBtn").addEventListener("click", () => {
        showScreen("playerDB");
        renderPlayerList();
    });
    // Przyciski dla "języka" oraz "ustawień" – do rozbudowy
    document.getElementById("langBtn").addEventListener("click", () => {
        alert("Opcja zmiany języka – jeszcze do zaimplementowania!");
    });
    document.getElementById("settingsBtn").addEventListener("click", () => {
        alert("Opcja ustawień – jeszcze do zaimplementowania!");
    });

    // Inicjalizacja canvas do celów rejestracji zdarzeń (choć nie jest używany w menu)
    canvas = document.getElementById("gameCanvas");

    canvas.addEventListener("mousedown", e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const dist = Math.hypot(mx - player.x, my - player.y);
        if (dist <= player.radius) {
            dragging = true;
            dragStart = { x: mx, y: my };
        }
    });

    canvas.addEventListener("mouseup", e => {
        if (dragging && dragStart) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            ball.dx += (dragStart.x - mx) / 10;
            ball.dy += (dragStart.y - my) / 10;
        }
        dragging = false;
        dragStart = null;
    });

    // Obsługa rozwijanego collapse (tak jak wcześniejsze)
    const coll = document.getElementsByClassName("collapse-button");
    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
        });
    }
});

// ==========================
// Baza zawodników - obsługa localStorage
// ==========================
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
    if (!listContainer) return;
    listContainer.innerHTML = "";
    if (players.length === 0) {
        listContainer.innerHTML = "<p>Brak zawodników w bazie.</p>";
        return;
    }
    players.forEach((player, index) => {
        const playerItem = document.createElement("p");
        playerItem.innerText = `${player.name} (${player.team}) - Ocena: ${player.rating}`;
        listContainer.appendChild(playerItem);
    });
}

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
    const players = loadPlayers();
    players.push({ name, team, rating });
    savePlayers(players);
    renderPlayerList();
    // Czyścimy formularz
    document.getElementById("addPlayerForm").reset();
});

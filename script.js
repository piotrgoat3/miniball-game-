// Pobieranie elementów HTML
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("score");
const langSelect = document.getElementById("language-select");

canvas.width = 800;
canvas.height = 400;

// Inicjalizacja wyniku
let userScore = 0, aiScore = 0;

// Inicjalizacja piłki
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 2,
    dy: 2,
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
    },
    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Odbicia od ścian
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.dy *= -1;
        }

        // Sprawdzenie czy piłka wpada do bramki
        if (this.x < 50 && this.y > 150 && this.y < 250) {
            aiScore++;
            resetBall();
        } else if (this.x > 750 && this.y > 150 && this.y < 250) {
            userScore++;
            resetBall();
        }

        updateScore();
    }
};

// Funkcja resetująca piłkę po golu
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 2;
    ball.dy = 2;
}

// Inicjalizacja graczy
const userPlayers = [];
const aiPlayers = [];

function createPlayers(team, isAI) {
    let startX = isAI ? 600 : 200;
    let color = isAI ? "red" : "blue";

    for (let i = 0; i < 6; i++) {
        let x = startX + (i % 3) * 50;
        let y = 100 + Math.floor(i / 3) * 100;

        let player = { x, y, radius: 15, team, color };
        if (isAI) {
            aiPlayers.push(player);
        } else {
            userPlayers.push(player);
        }
    }
}

createPlayers("user", false);
createPlayers("ai", true);

// Rysowanie zawodników
function drawPlayers(players) {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Obsługa myszy - poruszanie zawodnikami
canvas.addEventListener("mousemove", function(event) {
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    userPlayers.forEach(player => {
        if (Math.hypot(mouseX - player.x, mouseY - player.y) < player.radius + 5) {
            player.x = mouseX;
            player.y = mouseY;
        }
    });
});

// AI sterujące drużyną przeciwną
function aiMove() {
    aiPlayers.forEach(player => {
        let directionX = ball.x > player.x ? 1 : -1;
        let directionY = ball.y > player.y ? 1 : -1;

        player.x += directionX;
        player.y += directionY;
    });
}

// Aktualizacja wyniku
function updateScore() {
    scoreBoard.innerText = `${userScore} - ${aiScore}`;
}

// Główna pętla gry
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawField();
    ball.update();
    ball.draw();

    drawPlayers(userPlayers);
    drawPlayers(aiPlayers);

    aiMove();

    requestAnimationFrame(gameLoop);
}

// Rysowanie boiska
function drawField() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 300);

    ctx.strokeRect(0, 150, 50, 100);
    ctx.strokeRect(750, 150, 50, 100);
}

// Tłumaczenia interfejsu
const translations = {
    pl: { start: "Start", settings: "Ustawienia", score: "Wynik" },
    en: { start: "Start", settings: "Settings", score: "Score" },
    es: { start: "Inicio", settings: "Configuración", score: "Puntuación" }
};

// Zmiana języka
function changeLanguage(lang) {
    document.getElementById("quick-match-btn").innerText = translations[lang].start;
    document.getElementById("settings-btn").innerText = translations[lang].settings;
    document.getElementById("scoreboard").innerText = translations[lang].score;
}

// Obsługa zmiany języka
langSelect.addEventListener("change", function() {
    changeLanguage(this.value);
});

// Rozpoczęcie gry
gameLoop();

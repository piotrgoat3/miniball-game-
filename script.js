// Pobieranie elementów
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("score");
const langSelect = document.getElementById("language-select");

canvas.width = 800;
canvas.height = 400;

// Inicjalizacja wyniku
let userScore = 0, aiScore = 0;

// Bandery reklamowe (odbijanie piłki)
const ads = [
    { x: 40, y: 50, width: 10, height: 300 },  // Lewa banda
    { x: 750, y: 50, width: 10, height: 300 } // Prawa banda
];

// Inicjalizacja piłki z lepszą fizyką
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 0,
    dy: 0,
    friction: 0.98, // Spowolnienie
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

        // Tarcie - piłka zwalnia
        this.dx *= this.friction;
        this.dy *= this.friction;

        // Odbicia od band
        ads.forEach(band => {
            if (this.x - this.radius < band.x + band.width && this.x + this.radius > band.x &&
                this.y > band.y && this.y < band.y + band.height) {
                this.dx *= -1;
            }
        });

        // Odbicia od ścian
        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.dy *= -1;
        }

        // Gole
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

// Reset piłki po golu
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 0;
    ball.dy = 0;
}

// **Zawodnicy**
const userPlayers = [];
const aiPlayers = [];

function createPlayers(team, isAI) {
    let startX = isAI ? 600 : 200;
    let color = isAI ? "red" : "blue";

    for (let i = 0; i < 6; i++) {
        let x = startX + (i % 3) * 50;
        let y = 100 + Math.floor(i / 3) * 100;

        let player = { x, y, radius: 15, team, color, dx: 0, dy: 0, isDragging: false };
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

// **System naciągania zawodników**
let selectedPlayer = null;
let startX, startY;

canvas.addEventListener("mousedown", function(event) {
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    userPlayers.forEach(player => {
        if (Math.hypot(mouseX - player.x, mouseY - player.y) < player.radius) {
            selectedPlayer = player;
            startX = mouseX;
            startY = mouseY;
        }
    });
});

canvas.addEventListener("mouseup", function(event) {
    if (selectedPlayer) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        selectedPlayer.dx = (startX - mouseX) / 10;
        selectedPlayer.dy = (startY - mouseY) / 10;

        selectedPlayer = null;
    }
});

// **Ruch AI**
function aiMove() {
    aiPlayers.forEach(player => {
        let directionX = ball.x > player.x ? 1 : -1;
        let directionY = ball.y > player.y ? 1 : -1;

        player.x += directionX;
        player.y += directionY;
    });
}

// **Aktualizacja wyniku**
function updateScore() {
    scoreBoard.innerText = `${userScore} - ${aiScore}`;
}

// **Główna pętla gry**
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawField();
    ball.update();
    ball.draw();

    drawPlayers(userPlayers);
    drawPlayers(aiPlayers);

    // Ruch zawodników
    userPlayers.forEach(player => {
        player.x += player.dx;
        player.y += player.dy;

        player.dx *= 0.9;
        player.dy *= 0.9;
    });

    aiMove();

    requestAnimationFrame(gameLoop);
}

// **Rysowanie boiska**
function drawField() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 300);

    ctx.strokeRect(0, 150, 50, 100);
    ctx.strokeRect(750, 150, 50, 100);

    // Rysowanie band
    ads.forEach(band => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(band.x, band.y, band.width, band.height);
    });
}

// **Tłumaczenia**
const translations = {
    pl: { start: "Start", settings: "Ustawienia", score: "Wynik", database: "Baza Danych" },
    en: { start: "Start", settings: "Settings", score: "Score", database: "Database" },
    es: { start: "Inicio", settings: "Configuración", score: "Puntuación", database: "Base de Datos" }
};

// **Zmiana języka**
function changeLanguage(lang) {
    document.getElementById("quick-match-btn").innerText = translations[lang].start;
    document.getElementById("settings-btn").innerText = translations[lang].settings;
    document.getElementById("scoreboard").innerText = translations[lang].score;
    document.getElementById("database-tab").innerText = translations[lang].database;
}

// **Obsługa zmiany języka**
langSelect.addEventListener("change", function() {
    changeLanguage(this.value);
});

// **Start gry**
gameLoop();

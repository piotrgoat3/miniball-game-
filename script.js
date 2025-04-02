document.getElementById("settings-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "none";
});

// BOISKO I MECZ
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

// Rysowanie boiska
function drawField() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    // Linie boiska
    ctx.strokeRect(50, 50, 700, 300);
    ctx.beginPath();
    ctx.moveTo(400, 50);
    ctx.lineTo(400, 350);
    ctx.stroke(); // Linia środkowa

    // Bramki
    ctx.strokeRect(0, 150, 50, 100);  // Lewa bramka
    ctx.strokeRect(750, 150, 50, 100); // Prawa bramka
}

// TABLICA WYNIKÓW
let scoreA = 0, scoreB = 0;

function updateScore() {
    document.getElementById("score").innerText = `${scoreA} - ${scoreB}`;
}

// PIŁKA
let ball = { x: 400, y: 200, radius: 8, dx: 2, dy: 2 };

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

// DRUŻYNY
const players = [];
const teamAColor = "blue";
const teamBColor = "red";

// Dodawanie zawodników
function createPlayers() {
    // Drużyna A (gracz)
    for (let i = 0; i < 6; i++) {
        players.push({ x: 150, y: 80 + i * 50, team: "A", color: teamAColor, controlled: true });
    }

    // Drużyna B (AI)
    for (let i = 0; i < 6; i++) {
        players.push({ x: 650, y: 80 + i * 50, team: "B", color: teamBColor, controlled: false });
    }
}

function drawPlayers() {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();
    });
}

// RUCH PIŁKI + GOL
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Odbicie od ścian
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
    }

    // Sprawdzenie, czy padł gol
    if (ball.x - ball.radius < 50 && ball.y > 150 && ball.y < 250) {
        scoreB++; // Gol dla przeciwnika
        resetBall();
    } else if (ball.x + ball.radius > 750 && ball.y > 150 && ball.y < 250) {
        scoreA++; // Gol dla naszej drużyny
        resetBall();
    }

    updateScore();
}

function resetBall() {
    ball.x = 400;
    ball.y = 200;
    ball.dx = -ball.dx;
    ball.dy = -ball.dy;
}

// RUCH MYSZKĄ (GRACZ)
canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    players.forEach(player => {
        if (player.controlled) {
            player.x = mouseX;
            player.y = mouseY;
        }
    });
});

// AI PRZECIWNIKA
function moveAI() {
    players.forEach(player => {
        if (!player.controlled) {
            let direction = Math.sign(ball.y - player.y);
            player.y += direction * 1.5; // Przeciwnik lekko podąża za piłką
        }
    });
}

// GŁÓWNA PĘTLA GRY
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawField();
    drawBall();
    drawPlayers();
    moveBall();
    moveAI();
    requestAnimationFrame(gameLoop);
}

// START GRY
document.getElementById("quick-match-btn").addEventListener("click", function() {
    document.getElementById("team-selection").classList.remove("hidden");
});

function startGame() {
    document.getElementById("team-selection").classList.add("hidden");
    createPlayers();
    gameLoop();
}

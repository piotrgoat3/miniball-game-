let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
let gameRunning = false;
let timeLeft = 180;

canvas.width = 800;
canvas.height = 400;

// Piłka
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    dx: 4,
    dy: 4
};

// Gracz 1
let player1 = { x: 100, y: 200, width: 20, height: 60 };
// Gracz 2
let player2 = { x: 680, y: 200, width: 20, height: 60 };

function startGame() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";
    gameRunning = true;
    gameLoop();
    startTimer();
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Rysowanie piłki
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

    // Ruch piłki
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Odbicia od ścian
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    
    requestAnimationFrame(gameLoop);
}

function startTimer() {
    let timerElement = document.getElementById("timer");
    let interval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(interval);
            alert("Koniec meczu!");
            gameRunning = false;
        } else {
            timeLeft--;
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        }
    }, 1000);
}

function backToMenu() {
    document.getElementById("menu").style.display = "block";
    document.getElementById("settings").style.display = "none";
    document.getElementById("game").style.display = "none";
}

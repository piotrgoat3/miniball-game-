// USTAWIENIA UI
document.getElementById("settings-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "block";
});
document.querySelectorAll(".close-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        document.getElementById("settings-modal").style.display = "none";
        document.getElementById("database-modal").style.display = "none";
    });
});

// BAZA DANYCH ZAWODNIKÓW
document.getElementById("database-btn").addEventListener("click", function() {
    document.getElementById("database-modal").style.display = "block";
});
document.getElementById("add-player-btn").addEventListener("click", function() {
    let name = document.getElementById("player-name").value;
    let team = document.getElementById("player-team").value;
    players.push({ name, team, x: 100, y: 100, radius: 15, dx: 0, dy: 0 });
});

// BOISKO I GRACZE
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

const players = [
    { name: "Robert Lewandowski", team: "Polska", x: 100, y: 200, radius: 15, dx: 0, dy: 0 },
    { name: "Lionel Messi", team: "Argentyna", x: 700, y: 200, radius: 15, dx: 0, dy: 0 }
];

const ball = { x: 400, y: 200, radius: 10, dx: 0, dy: 0 };

// RYSOWANIE
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Boisko
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 300);

    // Bandy reklamowe
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Piłka
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

    // Zawodnicy
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.team === "Polska" ? "blue" : "red";
        ctx.fill();
        ctx.closePath();
    });

    requestAnimationFrame(draw);
}

draw();

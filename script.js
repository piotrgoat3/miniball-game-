document.getElementById("settings-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "none";
});

// Boisko i mecz
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

function drawField() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 300); // Linie boiska

    ctx.strokeRect(0, 150, 50, 100);  // Lewa bramka
    ctx.strokeRect(750, 150, 50, 100); // Prawa bramka
}

drawField();

// Tablica wyników
let scoreA = 0, scoreB = 0;

function updateScore() {
    document.getElementById("score").innerText = `${scoreA} - ${scoreB}`;
}

// Wybór drużyny przed meczem
document.getElementById("quick-match-btn").addEventListener("click", function() {
    document.getElementById("team-selection").classList.remove("hidden");
});

function startGame() {
    let selectedTeam = document.getElementById("team-select").value;
    document.getElementById("team-selection").classList.add("hidden");
    console.log("Grasz drużyną:", selectedTeam);
}

// Dodawanie zawodników
let players = [
    { name: "Robert Lewandowski", team: "Polska", position: "Napastnik" },
    { name: "Lionel Messi", team: "Argentyna", position: "Napastnik" }
];

function addPlayer(name, team, position) {
    let player = { name, team, position };
    players.push(player);
    console.log("Dodano zawodnika:", player);
}

addPlayer("Cristiano Ronaldo", "Portugalia", "Napastnik");

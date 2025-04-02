document.getElementById("settings-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("settings-modal").style.display = "none";
});

// Zmiana języka
document.getElementById("language-select").addEventListener("change", function() {
    const lang = this.value;
    console.log("Zmieniono język na:", lang);
});

// BOISKO I MECZ
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

function drawField() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    // Linie boiska
    ctx.strokeRect(50, 50, 700, 300);
    ctx.beginPath();

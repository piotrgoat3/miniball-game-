let canvas, ctx, ball, score = { left: 0, right: 0 };
let dragging = false, dragStart = null;
let player = { x: 300, y: 250, radius: 20 };

function startGame() {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");

    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    ball = { x: 400, y: 250, radius: 10, dx: 0, dy: 0 };

    updateScore();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // bandy
    ctx.fillStyle = "yellow";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // piłka
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();

    // zawodnik
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

    // update fizyki piłki
    ball.x += ball.dx;
    ball.y += ball.dy;
    ball.dx *= 0.98;
    ball.dy *= 0.98;

    if (ball.x < 0 || ball.x > canvas.width) ball.dx *= -1;
    if (ball.y < 20 || ball.y > canvas.height - 20) ball.dy *= -1;

    requestAnimationFrame(gameLoop);
}

function updateScore() {
    document.getElementById("score").innerText = `${score.left} - ${score.right}`;
}

// Sterowanie myszy
document.addEventListener("DOMContentLoaded", () => {
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
});

// Język - menu
function hideLsDropdown(event) {
    if (event.target.id !== 'lsbtn' && event.target.parentNode.id !== 'lsbtn') {
        document.getElementById("lsDropdown").classList.remove("show");
        window.removeEventListener('click', hideLsDropdown);
    }
}

function langSwitcherHandler() {
    let dropdown = document.getElementById("lsDropdown");
    dropdown.classList.toggle("show");
    if (dropdown.classList.contains("show")) {
        window.addEventListener('click', hideLsDropdown);
    }
}

function setLanguage(event) {
    let prefix = 'lang_';
    let langCode = 'pl';
    if (event.target.id.indexOf(prefix) !== -1)
        langCode = event.target.id.replace('lang_', '');
    document.cookie = "site_lang=" + langCode + ';path=/;max-age=31536000';
    alert("Ustawiono język: " + langCode);
}

// Collapse (zwijane menu)
document.addEventListener("DOMContentLoaded", () => {
    let coll = document.getElementsByClassName("collapse-button");
    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
        });
    }
});

const teams = {
    'FC Barcelona': ['Ter Stegen', 'Piqué', 'Busquets', 'Pedri', 'Lewandowski'],
    'Real Madrid': ['Courtois', 'Alaba', 'Modrić', 'Vinícius', 'Benzema']
};

let selectedTeams = { team1: null, team2: null };
let players = [];
let userScore = 0, aiScore = 0;
let canvas, ctx, ball, gameRunning = false;

// 📌 1. Pokaż wybór drużyn
function showTeamSelection() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('team-selection').classList.remove('hidden');
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    team1Select.innerHTML = '';
    team2Select.innerHTML = '';
    for (const team in teams) {
        team1Select.innerHTML += `<option value="${team}">${team}</option>`;
        team2Select.innerHTML += `<option value="${team}">${team}</option>`;
    }
}

// 📌 2. Zatwierdź drużyny
function confirmTeams() {
    selectedTeams.team1 = document.getElementById('team1').value;
    selectedTeams.team2 = document.getElementById('team2').value;
    if (selectedTeams.team1 !== selectedTeams.team2) {
        document.getElementById('team-selection').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
    } else {
        alert('Wybierz różne drużyny!');
    }
}

// 📌 3. Rozpocznij mecz
function startGame() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 2, dy: 2 };
    gameRunning = true;
    gameLoop();
}

// 📌 4. Obsługa piłki i kolizji
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x <= 0 || ball.x >= canvas.width) ball.dx *= -1;
    if (ball.y <= 0 || ball.y >= canvas.height) ball.dy *= -1;
}

// 📌 5. Rysowanie gry
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Rysuj piłkę
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

// 📌 6. Główna pętla gry
function gameLoop() {
    if (gameRunning) {
        updateBall();
        drawGame();
        requestAnimationFrame(gameLoop);
    }
}

// 📌 7. Koniec tury
function endTurn() {
    userScore++;
    document.getElementById('scoreboard').innerText = `${userScore} - ${aiScore}`;
}

// 📌 8. Zarządzanie zawodnikami
function showPlayerEditor() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('player-editor').classList.remove('hidden');
}

function addPlayer() {
    const name = document.getElementById('player-name').value;
    const team = document.getElementById('player-team').value;
    players.push({ name, team });
    updatePlayerList();
}

function updatePlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    players.forEach(player => {
        list.innerHTML += `<li>${player.name} (${player.team})</li>`;
    });
}

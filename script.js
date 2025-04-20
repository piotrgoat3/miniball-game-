<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MiniSoccer - Szybki Mecz</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      body {
        font-family: "Nunito", sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        text-align: center;
      }
      .hidden {
        display: none;
      }
      button {
        font-size: 18px;
        padding: 10px 20px;
        margin: 10px;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        color: #fff;
      }
      button:hover {
        background-color: #0056b3;
      }
      #gameCanvas {
        background-color: #eee;
        border: 2px solid #333;
        display: block;
        margin: auto;
      }
    </style>
  </head>
  <body>
    <div id="startScreen">
      <h1>MiniSoccer - Szybki Mecz</h1>
      <button id="startMatchBtn">Rozpocznij mecz</button>
    </div>

    <div id="gameScreen" class="hidden">
      <h2>Rozgrywka</h2>
      <canvas id="gameCanvas" width="800" height="400"></canvas>
      <p id="scoreboard">Wynik: 0</p>
      <button id="backToStartBtn">Powrót do menu</button>
    </div>

    <script>
      (function () {
        "use strict";

        let canvas, ctx;
        let score = { goals: 0 };
        let ball;
        let fieldPlayers = [];
        let goalkeeper = {};
        let draggingPlayerIndex = null;
        let dragStart = { x: 0, y: 0 };
        let dragCurrent = { x: 0, y: 0 };
        let isDragging = false;
        const FRICTION = 0.98;
        const DRAG_IMPULSE_SCALE = 0.2;
        const BALL_COLLISION_IMPULSE = 7;
        const PLAYER_RADIUS = 16;
        const GOALKEEPER_RADIUS = 18;
        let gameAnimating = false;

        function initGame() {
          canvas = document.getElementById("gameCanvas");
          ctx = canvas.getContext("2d");

          ball = {
            x: canvas.width * 0.55,
            y: canvas.height / 2,
            radius: 8,
            dx: 0,
            dy: 0
          };

          fieldPlayers = [
            { x: canvas.width * 0.25, y: canvas.height * 0.3, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
            { x: canvas.width * 0.25, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
            { x: canvas.width * 0.25, y: canvas.height * 0.7, radius: PLAYER_RADIUS, vx: 0, vy: 0 },
            { x: canvas.width * 0.35, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0 }
          ];

          goalkeeper = { x: 60, y: canvas.height / 2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0 };
          score.goals = 0;
        }

        function drawField() {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 4;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          ctx.fillStyle = "white";
          ctx.fillRect(canvas.width - 10, canvas.height / 2 - 50, 10, 100);
          ctx.fillStyle = "yellow";
          ctx.fillRect(10, 0, canvas.width - 20, 10);
          ctx.fillRect(10, canvas.height - 10, canvas.width - 20, 10);
        }

        function drawGameObjects() {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();
          ctx.closePath();

          fieldPlayers.forEach((player) => {
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = "blue";
            ctx.fill();
            ctx.closePath();
          });

          ctx.beginPath();
          ctx.arc(goalkeeper.x, goalkeeper.y, goalkeeper.radius, 0, Math.PI * 2);
          ctx.fillStyle = "black";
          ctx.fill();
          ctx.closePath();

          if (isDragging && draggingPlayerIndex !== null) {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            const p = fieldPlayers[draggingPlayerIndex];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(dragCurrent.x, dragCurrent.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        function updatePositions() {
          fieldPlayers.forEach((player) => {
            player.x += player.vx;
            player.y += player.vy;
            player.vx *= FRICTION;
            player.vy *= FRICTION;
          });

          ball.x += ball.dx;
          ball.y += ball.dy;
          ball.dx *= FRICTION;
          ball.dy *= FRICTION;

          if (ball.y - ball.radius < 10) {
            ball.y = 10 + ball.radius;
            ball.dy *= -1;
          }
          if (ball.y + ball.radius > canvas.height - 10) {
            ball.y = canvas.height - 10 - ball.radius;
            ball.dy *= -1;
          }
          if (ball.x + ball.radius > canvas.width) {
            score.goals++;
            resetBall();
          }
        }

        function resetBall() {
          ball.x = canvas.width / 2;
          ball.y = canvas.height / 2;
          ball.dx = 0;
          ball.dy = 0;
        }

        function circleCollision(c1, c2) {
          const dx = c1.x - c2.x;
          const dy = c1.y - c2.y;
          return Math.hypot(dx, dy) < (c1.radius + c2.radius);
        }

        function handlePlayerBallCollision(player) {
          if (circleCollision(player, ball)) {
            const dx = ball.x - player.x;
            const dy = ball.y - player.y;
            const dist = Math.hypot(dx, dy) || 1;
            ball.dx = (dx / dist) * BALL_COLLISION_IMPULSE;
            ball.dy = (dy / dist) * BALL_COLLISION_IMPULSE;
          }
        }

        function checkCollisions() {
          fieldPlayers.forEach((player) => {
            handlePlayerBallCollision(player);
          });
          handlePlayerBallCollision(goalkeeper);
        }

        function gameLoop() {
          if (!gameAnimating) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawField();
          updatePositions();
          checkCollisions();
          drawGameObjects();
          document.getElementById("scoreboard").innerText = "Gole: " + score.goals;
          requestAnimationFrame(gameLoop);
        }

        function canvasMouseDown(e) {
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          for (let i = 0; i < fieldPlayers.length; i++) {
            const p = fieldPlayers[i];
            const dist = Math.hypot(mx - p.x, my - p.y);
            if (dist < p.radius) {
              draggingPlayerIndex = i;
              isDragging = true;
              dragStart = { x: p.x, y: p.y };
              dragCurrent = { x: mx, y: my };
              break;
            }
          }
        }

        function canvasMouseMove(e) {
          if (!isDragging) return;
          const rect = canvas.getBoundingClientRect();
          dragCurrent.x = e.clientX - rect.left;
          dragCurrent.y = e.clientY - rect.top;
        }

        function canvasMouseUp(e) {
          if (!isDragging || draggingPlayerIndex === null) return;
          const dx = dragStart.x - dragCurrent.x;
          const dy = dragStart.y - dragCurrent.y;
          fieldPlayers[draggingPlayerIndex].vx = dx *

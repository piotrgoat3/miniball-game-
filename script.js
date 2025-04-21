<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MiniSoccer - Szybki Mecz</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      /* GLOBALNE STYLE – DESIGN W PIŁKARSKIM KLIMACIE */
      /* Tło zmienione na zdjęcie stadionu */
      body {
        font-family: "Nunito", sans-serif; /* [source: 2] */
        background: url("https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")
          no-repeat center center fixed; /* [source: 2] */
        background-size: cover; /* [source: 2] */
        margin: 0; /* [source: 3] */
        padding: 0; /* [source: 3] */
        text-align: center; /* [source: 3] */
        color: #fff; /* [source: 3] */
      }
      body::before {
        content: ""; /* [source: 3] */
        position: fixed; /* [source: 4] */
        top: 0; /* [source: 4] */
        left: 0; /* [source: 4] */
        width: 100%; /* [source: 4] */
        height: 100%; /* [source: 4] */
        background: rgba(0,0,0,0.3); /* [source: 4] */
        z-index: -1; /* [source: 4] */
      }
      .hidden { display: none !important; /* [source: 5] */ }

      /* EKRAN STARTOWY */
      #startScreen {
        padding: 40px 20px; /* [source: 6] */
      }
      #startScreen h1 {
        font-size: 56px; /* [source: 7] */
        margin-bottom: 30px; /* [source: 7] */
        text-shadow: 2px 2px 5px rgba(0,0,0,0.3); /* [source: 8] */
      }
      #startScreen button {
        font-size: 20px; /* [source: 8] */
        padding: 15px 30px; /* [source: 9] */
        margin: 15px; /* [source: 9] */
        border: none; /* [source: 9] */
        border-radius: 10px; /* [source: 9] */
        background-color: rgba(255,255,255,0.8); /* [source: 9] */
        cursor: pointer; /* [source: 9] */
        color: #333; /* [source: 9] */
        box-shadow: 0px 4px 8px rgba(0,0,0,0.2); /* [source: 9] */
        transition: all 0.3s ease; /* [source: 10] */
      }
      #startScreen button:hover {
        background-color: #fff; /* [source: 10] */
        transform: scale(1.05); /* [source: 11] */
        box-shadow: 0px 5px 15px rgba(0,0,0,0.3); /* [source: 11] */
      }

      /* EKRAN WYBORU DRUŻYN */
      #teamSelectScreen { padding: 40px 20px; /* [source: 11] */ }
      #teamSelectScreen h2 {
        font-size: 40px; /* [source: 12] */
        margin-bottom: 20px; /* [source: 12] */
        text-shadow: 1px 1px 4px rgba(0,0,0,0.3); /* [source: 13] */
      }
      .team-section {
        margin: 30px auto; /* [source: 13] */
        max-width: 800px; /* [source: 14] */
        text-align: left; /* [source: 14] */
      }
      .team-section h3 { font-size: 28px; margin-bottom: 15px; padding-left: 10px; /* [source: 14] */ }
      .team-container {
        display: flex; /* [source: 15] */
        gap: 20px; /* [source: 15] */
        overflow-x: auto; /* [source: 16] */
        padding: 10px; /* [source: 16] */
        scrollbar-width: thin; /* [source: 16] */
      }
      .team-container::-webkit-scrollbar { height: 8px; /* [source: 16] */ }
      .team-container::-webkit-scrollbar-thumb {
        background: #ffd700; /* [source: 17] */
        border-radius: 4px; /* [source: 17] */
      }
      .team-option {
        cursor: pointer; /* [source: 18] */
        text-align: center; /* [source: 18] */
        border: 2px solid rgba(255,255,255,0.5); /* [source: 19] */
        border-radius: 12px; /* [source: 19] */
        width: 150px; /* [source: 19] */
        padding: 10px; /* [source: 19] */
        transition: all 0.3s ease; /* [source: 19] */
        flex: 0 0 auto; /* [source: 19] */
      }
      .team-option.selected {
        border-color: #ffd700; /* [source: 20] */
        transform: scale(1.1); /* [source: 20] */
        background-color: rgba(255,255,255,0.2); /* [source: 21] */
      }
      .team-option img {
        width: 80px; /* [source: 21] */
        height: 80px; /* [source: 22] */
        display: block; /* [source: 22] */
        margin: 0 auto 10px; /* [source: 22] */
      }
      .league-header {
        display: flex; /* [source: 22] */
        align-items: center; /* [source: 23] */
        gap: 5px; /* [source: 23] */
        margin-bottom: 10px; /* [source: 23] */
        padding-left: 10px; /* [source: 23] */
      }
      .league-header img { width: 30px; /* [source: 23] */ height: 30px; /* [source: 24] */ }
      #startMatchFromSelectBtn {
        font-size: 20px; /* [source: 24] */
        padding: 15px 30px; /* [source: 25] */
        margin-top: 30px; /* [source: 25] */
        cursor: pointer; /* [source: 25] */
        background-color: rgba(255,255,255,0.9); /* [source: 25] */
        border: none; /* [source: 25] */
        border-radius: 12px; /* [source: 25] */
        transition: all 0.3s ease; /* [source: 25] */
        box-shadow: 0px 4px 8px rgba(0,0,0,0.2); /* [source: 26] */
      }
      #startMatchFromSelectBtn:hover {
        background-color: #fff; /* [source: 26] */
        transform: scale(1.05); /* [source: 27] */
        box-shadow: 0px 5px 15px rgba(0,0,0,0.3); /* [source: 27] */
      }

      /* EKRAN GRY */
      #gameScreen { padding: 20px; /* [source: 27] */ }
      #scoreboardContainer { margin-bottom: 20px; /* [source: 28] */ }
      #scoreboard { font-size: 28px; /* [source: 28] */ font-weight: bold; /* [source: 29] */ }
      #matchTimer { font-size: 20px; margin-top: 5px; /* [source: 29] */ }
      canvas {
        background-color: #228B22; /* [source: 30] */
        border: 4px solid #fff; /* [source: 31] */
        border-radius: 16px; /* [source: 31] */
        display: block; /* [source: 31] */
        margin: 0 auto; /* [source: 31] */
        box-shadow: 0px 8px 16px rgba(0,0,0,0.35); /* [source: 31] */
      }
      #backToStartBtn {
        font-size: 18px; /* [source: 32] */
        padding: 15px 30px; /* [source: 32] */
        margin-top: 20px; /* [source: 33] */
        cursor: pointer; /* [source: 33] */
        background: rgba(255,255,255,0.9); /* [source: 33] */
        border: none; /* [source: 33] */
        border-radius: 10px; /* [source: 33] */
        transition: background 0.3s; /* [source: 33] */
        box-shadow: 0px 4px 8px rgba(0,0,0,0.2); /* [source: 33] */
      }
      #backToStartBtn:hover { background: rgba(255,255,255,1); /* [source: 34] */ }

      /* MODALE */
      .modal {
        position: fixed; /* [source: 35] */
        top: 0; /* [source: 36] */
        left: 0; /* [source: 36] */
        width: 100%; /* [source: 36] */
        height: 100%; /* [source: 36] */
        background: rgba(0,0,0,0.6); /* [source: 36] */
        display: flex; /* [source: 36] */
        align-items: center; /* [source: 36] */
        justify-content: center; /* [source: 36] */
        z-index: 100; /* [source: 36] */
        animation: fadeIn 0.3s; /* [source: 37] */
      }
      @keyframes fadeIn { from { opacity: 0; /* [source: 37] */ } to { opacity: 1; /* [source: 38] */ } }
      .modal-content {
        background: #fff; /* [source: 38] */
        padding: 30px; /* [source: 39] */
        width: 90%; /* [source: 39] */
        max-width: 500px; /* [source: 39] */
        border-radius: 16px; /* [source: 39] */
        box-shadow: 0 8px 16px rgba(0,0,0,0.35); /* [source: 39] */
        color: #333; /* [source: 39] */
      }
      .modal-content h2 { margin-top: 0; font-size: 28px; /* [source: 40] */ }
      .modal-content button {
        background: rgba(255,255,255,0.9); /* [source: 41] */
        border: none; /* [source: 41] */
        border-radius: 6px; /* [source: 42] */
        padding: 10px 20px; /* [source: 42] */
        margin-top: 10px; /* [source: 42] */
        transition: background 0.3s, transform 0.2s; /* [source: 42] */
        box-shadow: 0px 2px 4px rgba(0,0,0,0.25); /* [source: 42] */
        cursor: pointer; /* [source: 42] */
      }
      .modal-content button:hover {
        background: rgba(255,255,255,1); /* [source: 43] */
        transform: translateY(-2px); /* [source: 43] */
      }
      input {
        border: 1px solid #ccc; /* [source: 44] */
        border-radius: 6px; /* [source: 45] */
        padding: 10px; /* [source: 45] */
        margin: 5px 0; /* [source: 45] */
        width: 100%; /* [source: 45] */
        box-sizing: border-box; /* [source: 45] */
      }
      #playerList {
        max-height: 300px; /* [source: 46] */
        overflow-y: auto; /* [source: 46] */
        scrollbar-width: thin; /* [source: 47] */
        scrollbar-color: #185c28 #ffffff; /* [source: 47] */
      }
      #playerList::-webkit-scrollbar { width: 8px; /* [source: 47] */ }
      #playerList::-webkit-scrollbar-thumb { background: #185c28; border-radius: 5px; /* [source: 48] */ }
      #playerList::-webkit-scrollbar-track { background: #ffffff; /* [source: 49] */ }
    </style>
  </head>
  <body>
    <div id="startScreen">
      <h1>MiniSoccer ⚽</h1>
      <button id="startMatchBtn">SZYBKI MECZ</button>
      <div class="start-options">
        <button id="btnPlayerDB">Baza zawodników</button>
        <button id="btnLanguage">Język</button>
        <button id="btnSettings">Ustawienia</button>
      </div>
    </div>

    <div id="teamSelectScreen" class="hidden">
      <h2>Wybierz Drużyny</h2> <div class="team-section" id="homeTeamSection">
        <h3>Drużyna Domowa</h3>
        <div id="homeTeamContainer" class="team-container"></div>
      </div>
      <div class="team-section" id="awayTeamSection">
        <h3>Drużyna Gościa</h3>
        <div id="awayTeamContainer" class="team-container"></div>
      </div>
      <button id="startMatchFromSelectBtn">Rozpocznij Mecz</button>
    </div>

    <div id="gameScreen" class="hidden"> <div id="scoreboardContainer">
        <h2 id="scoreboard">— : —</h2>
        <h3 id="matchTimer">Czas: 3:00</h3>
      </div>
      <canvas id="gameCanvas" width="800" height="500"></canvas>
      <button id="backToStartBtn">Powrót do Menu</button>
    </div>

    <div id="playerDBModal" class="modal hidden">
      <div class="modal-content">
        <h2>Baza zawodników</h2>
        <div id="playerList"></div>
        <h3>Dodaj zawodnika</h3> <form id="addPlayerForm">
          <input type="text" id="playerName" placeholder="Imię i nazwisko" required />
          <input type="text" id="playerTeam" placeholder="Drużyna" required />
          <input type="number" id="playerRating" placeholder="Ocena" required min="0" max="100" />
          <button type="submit">Dodaj</button>
        </form>
        <button id="closePlayerDBBtn">Zamknij</button>
      </div> </div>

    <div id="languageModal" class="modal hidden">
      <div class="modal-content">
        <h2>Wybór języka</h2>
        <p>Wybierz język interfejsu:</p>
        <button class="langOption" data-lang="pl">Polski</button>
        <button class="langOption" data-lang="en">English</button>
        <button id="closeLanguageModalBtn">Zamknij</button>
      </div>
    </div>

    <script>
      (function () {
        "use strict"; /* [source: 55] */

        // GLOBALNE ZMIENNE I KONSTANTY
        let score = { home: 0, away: 0 }; /* [source: 55] */
        let canvas, ctx, ball; /* [source: 56] */
        let fieldPlayers = [];      // 4 zawodników drużyny domowej /* [source: 56] */
        let fieldPlayersAway = []; /* [source: 56] */
        // 4 zawodników drużyny przeciwnej /* [source: 57] */
        let goalkeeper, goalkeeperAway; /* [source: 57] */
        // Bramkarze (1+1) /* [source: 58] */
        let gameAnimating = false; /* [source: 58] */
        let isDragging = false, draggingPlayerIndex = null; /* [source: 59] */
        let dragStart = { x: 0, y: 0 },
            dragCurrent = { x: 0, y: 0 }; /* [source: 59] */
        let selectedHomeTeam = null, selectedAwayTeam = null; /* [source: 60] */
        const PLAYER_RADIUS = 16,
              GOALKEEPER_RADIUS = 18,
              FRICTION = 0.98,
              DRAG_IMPULSE_SCALE = 0.05, /* [source: 60] */
              BALL_COLLISION_IMPULSE = 5; // <-- POPRAWKA: Dodano brakującą stałą

        // CZAS MECZU – MATCH_DURATION = 180 sekund (3:00)
        const MATCH_DURATION = 180; /* [source: 61] */
        let matchTime = MATCH_DURATION; /* [source: 62] */
        let matchTimerInterval = null; /* [source: 62] */
        function updateTimerDisplay() {
          let minutes = Math.floor(matchTime / 60); /* [source: 62] */
          let seconds = matchTime % 60; /* [source: 63] */
          if (seconds < 10) seconds = "0" + seconds; /* [source: 63] */
          document.getElementById("matchTimer").innerText = "Czas: " + minutes + ":" + seconds; /* [source: 64] */
        }
        function startTimer() {
          matchTime = MATCH_DURATION; /* [source: 65] */
          updateTimerDisplay(); /* [source: 66] */
          matchTimerInterval = setInterval(() => {
            matchTime--;
            updateTimerDisplay();
            if (matchTime <= 0) {
              gameOver();
            }
          }, 1000); /* [source: 66] */
        }
        function stopTimer() {
          clearInterval(matchTimerInterval); /* [source: 67] */
          matchTimerInterval = null; /* [source: 68] */
        }
        function gameOver() {
          stopTimer(); /* [source: 68] */
          gameAnimating = false; /* [source: 69] */
          alert("Koniec meczu! Wynik: " + selectedHomeTeam + " " + score.home + " : " + score.away + " " + selectedAwayTeam); /* [source: 69] */
          document.getElementById("gameScreen").classList.add("hidden"); /* [source: 70] */
          document.getElementById("startScreen").classList.remove("hidden");
        }

        // BAZA DANYCH KLUBÓW – oryginalna
        const teamsData = {
          "Premier League": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
            teams: [
              { name: "Manchester United", logo: "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg" },
              { name: "Manchester City", logo: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" }, /* [source: 71] */
              { name: "Liverpool", logo: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg" },
              { name: "Chelsea", logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" },
              { name: "Arsenal", logo: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
              { name: "Tottenham Hotspur", logo: "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg" }
            ] /* [source: 71] */
          },
          "La Liga": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/9/90/LaLiga.svg",
            teams: [
              { name: "Real Madrid", logo: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg" },
              { name: "Barcelona", logo: "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg" },
              { name: "Atletico Madrid", logo: "https://brandlogos.net/wp-content/uploads/2021/09/atltico-madrid-logo.png" }, /* [source: 73] */
              { name: "Sevilla", logo: "https://cdn.freebiesupply.com/logos/large/2x/sevilla-fc-logo-png-transparent.png" },
              { name: "Valencia", logo: "https://brandlogos.net/wp-content/uploads/2014/10/valencia_cf-logo_brandlogos.net_iaffl-512x674.png" },
              { name: "Villarreal", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/1200px-Villarreal_CF_logo-en.svg.png" }
            ]
          },
          "Serie A": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Serie_A_logo_(2019).svg", /* [source: 74] */
            teams: [
              { name: "Juventus", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Juventus_Logo.png" },
              { name: "Inter Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" },
              { name: "AC Milan", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/653px-Logo_of_AC_Milan.svg.png" },
              { name: "Napoli", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Neapel.svg/1200px-SSC_Neapel.svg.png" }, /* [source: 75] */
              { name: "Roma", logo: "https://upload.wikimedia.org/wikipedia/sco/7/7d/AS_Roma%27s_logo_from_2017.png" },
              { name: "Lazio", logo: "https://static.cdnlogo.com/logos/s/89/ss-lazio.png" }
            ]
          },
          "Bundesliga": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Bundesliga_logo_(2017).svg",
            teams: [ /* [source: 75] */
              { name: "Bayern Munich", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2017).svg/2048px-FC_Bayern_M%C3%BCnchen_logo_(2017).svg.png" },
              { name: "Borussia Dortmund", logo: "https://upload.wikimedia.org/wikipedia/commons/7/74/Borussia_Dortmund.png" },
              { name: "RB Leipzig", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/1200px-RB_Leipzig_2014_logo.svg.png" },
              { name: "Bayer Leverkusen", logo: "https://cdn.freebiesupply.com/logos/large/2x/bayer-leverkusen-logo-png-transparent.png" },
              { name: "Eintracht Frankfurt", logo: "https://logodownload.org/wp-content/uploads/2019/11/eintracht-frankfurt-logo.png" }, /* [source: 76] */
              { name: "Borussia Mönchengladbach", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/1200px-Borussia_M%C3%B6nchengladbach_logo.svg.png" }
            ]
          },
          "Ligue 1": {
            leagueLogo: "https://upload.wikimedia.org/wikipedia/en/f/fd/Ligue_1.svg",
            teams: [
              { name: "Paris Saint-Germain", logo: "https://logos-world.net/wp-content/uploads/2020/07/PSG-Logo.png" }, /* [source: 77] */
              { name: "Marseille", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/1582px-Olympique_Marseille_logo.svg.png" }, /* [source: 78] */
              { name: "Lyon", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Olympique_Lyonnais_logo.svg/1200px-Olympique_Lyonnais_logo.svg.png" },
              { name: "Monaco", logo: "https://logodownload.org/wp-content/uploads/2019/09/monaco-fc-logo-1.png" },
              { name: "Lille", logo: "https://logodownload.org/wp-content/uploads/2019/09/lille-logo-1.png" },
              { name: "Nice", logo: "https://1000logos.net/wp-content/uploads/2020/09/Nice-logo.png" }
            ] /* [source: 78] */
          }
        };
        /* Funkcja pomocnicza – zwraca kolor klubowy dla danego klubu */ /* [source: 80] */
        function getTeamColor(teamName) {
          switch(teamName) {
            case "Manchester United": return "#DA291C"; /* [source: 80] */
            case "Manchester City": return "#6CABDD"; /* [source: 81] */
            case "Liverpool": return "#C8102E";
            case "Chelsea": return "#034694";
            case "Arsenal": return "#EF0107"; /* [source: 81] */
            case "Tottenham Hotspur": return "#132257"; /* [source: 82] */
            case "Real Madrid": return "#2E6F95";
            case "Barcelona": return "#A50044";
            case "Atletico Madrid": return "#F53636"; /* [source: 82] */
            case "Sevilla": return "#EC1C24"; /* [source: 83] */
            case "Valencia": return "#FF8200";
            case "Villarreal": return "#FDB913";
            case "Juventus": return "#000000"; /* [source: 83] */
            case "Inter Milan": return "#004D98"; /* [source: 84] */
            case "AC Milan": return "#DC052D";
            case "Napoli": return "#4E9D1E";
            case "Roma": return "#9B0000"; /* [source: 84] */
            case "Lazio": return "#85B8D0"; /* [source: 85] */
            case "Bayern Munich": return "#DC052D";
            case "Borussia Dortmund": return "#FFCC00";
            case "RB Leipzig": return "#00AEEF"; /* [source: 85] */
            case "Bayer Leverkusen": return "#E5007E"; /* [source: 86] */
            case "Eintracht Frankfurt": return "#000000";
            case "Borussia Mönchengladbach": return "#000000";
            case "Paris Saint-Germain": return "#004170"; /* [source: 86] */
            case "Marseille": return "#003087"; /* [source: 87] */
            case "Lyon": return "#00529B";
            case "Monaco": return "#C8102E";
            case "Lille": return "#003A70";
            case "Nice": return "#ED1C24"; /* [source: 87] */
            default: return "#777777"; /* [source: 88] */
          }
        }

        /* FUNKCJE GRY */
        function initGame() {
          canvas = document.getElementById("gameCanvas"); /* [source: 88] */
          ctx = canvas.getContext("2d"); /* [source: 89] */
          ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 8,
            dx: 2,
            dy: 1.5,
            color: "white"
          }; /* [source: 89] */
          let homeColor = getTeamColor(selectedHomeTeam); /* [source: 90] */
          let awayColor = getTeamColor(selectedAwayTeam);

          fieldPlayers = [
            { x: canvas.width * 0.25, y: canvas.height * 0.3, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
            { x: canvas.width * 0.25, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
            { x: canvas.width * 0.25, y: canvas.height * 0.7, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor },
            { x: canvas.width * 0.35, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: homeColor } /* [source: 91] */
          ];
          fieldPlayersAway = [ /* [source: 92] */
            { x: canvas.width * 0.75, y: canvas.height * 0.3, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
            { x: canvas.width * 0.75, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
            { x: canvas.width * 0.75, y: canvas.height * 0.7, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor },
            { x: canvas.width * 0.65, y: canvas.height * 0.5, radius: PLAYER_RADIUS, vx: 0, vy: 0, color: awayColor } /* [source: 93] */
          ];
          goalkeeper = { x: 60, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: homeColor }; /* [source: 94] */
          goalkeeperAway = { x: canvas.width - 60, y: canvas.height/2, radius: GOALKEEPER_RADIUS, vx: 0, vy: 0, color: awayColor }; /* [source: 95] */
          score.home = 0; /* [source: 96] */
          score.away = 0;
        }

        function drawField() {
          ctx.strokeStyle = "#fff"; /* [source: 96] */
          ctx.lineWidth = 4; /* [source: 97] */
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

          ctx.beginPath();
          ctx.moveTo(canvas.width/2, 10);
          ctx.lineTo(canvas.width/2, canvas.height - 10);
          ctx.stroke();
          ctx.fillStyle = "white"; /* [source: 98] */
          ctx.fillRect(0, canvas.height/2 - 50, 10, 100);
          ctx.fillRect(canvas.width - 10, canvas.height/2 - 50, 10, 100);

          ctx.lineWidth = 2; /* [source: 98] */
          ctx.beginPath(); /* [source: 99] */
          ctx.moveTo(10, canvas.height/2 - 50);
          ctx.lineTo(10, canvas.height/2 + 50);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(canvas.width - 10, canvas.height/2 - 50); /* [source: 99] */
          ctx.lineTo(canvas.width - 10, canvas.height/2 + 50); /* [source: 100] */
          ctx.stroke();

          // Linie pola karnego
          ctx.strokeRect(10, canvas.height/2 - 80, 60, 160); /* [source: 100] */
          ctx.strokeRect(canvas.width - 70, canvas.height/2 - 80, 60, 160); /* [source: 101] */
        }

        function drawGameObjects() {
          ctx.beginPath(); /* [source: 101] */
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); /* [source: 102] */
          ctx.fillStyle = ball.color;
          ctx.fill();
          ctx.closePath();
          fieldPlayers.forEach(player => { /* [source: 103] */
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
            ctx.fillStyle = player.color;
            ctx.fill();
            ctx.closePath();
          });
          fieldPlayersAway.forEach(player => { /* [source: 104] */
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
            ctx.fillStyle = player.color;
            ctx.fill();
            ctx.closePath();
          });
          ctx.beginPath(); /* [source: 105] */
          ctx.arc(goalkeeper.x, goalkeeper.y, goalkeeper.radius, 0, Math.PI*2);
          ctx.fillStyle = goalkeeper.color;
          ctx.fill();
          ctx.closePath();

          ctx.beginPath();
          ctx.arc(goalkeeperAway.x, goalkeeperAway.y, goalkeeperAway.radius, 0, Math.PI*2);
          ctx.fillStyle = goalkeeperAway.color;
          ctx.fill(); /* [source: 106] */
          ctx.closePath();

          // Rysowanie strzałki: rysujemy linię od pozycji zawodnika
          // do punktu obliczonego jako p + (dragStart - dragCurrent)
          if (isDragging && draggingPlayerIndex !== null && dragStart && dragCurrent) {
            ctx.save(); /* [source: 106] */
            ctx.setLineDash([5, 5]); /* [source: 107] */
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            let p = fieldPlayers[draggingPlayerIndex];
            let arrowEndX = p.x + (dragStart.x - dragCurrent.x); /* [source: 107] */
            let arrowEndY = p.y + (dragStart.y - dragCurrent.y); /* [source: 108] */
            if (!isNaN(arrowEndX) && !isNaN(arrowEndY)) {
              ctx.beginPath(); /* [source: 108] */
              ctx.moveTo(p.x, p.y); /* [source: 109] */
              ctx.lineTo(arrowEndX, arrowEndY);
              ctx.stroke();
            }
            ctx.restore(); /* [source: 109] */
          }
        }

        function updatePositions() {
          fieldPlayers.forEach(player => {
            player.x += player.vx;
            player.y += player.vy;
            player.vx *= FRICTION;
            player.vy *= FRICTION;

            if (player.x - player.radius < 10) { /* [source: 111] */
              player.x = 10 + player.radius;
              player.vx *= -1;
            }
            if (player.x + player.radius > canvas.width - 10) {
              player.x = canvas.width - 10 - player.radius;
              player.vx *= -1; /* [source: 112] */
            }
            if (player.y - player.radius < 10) {
              player.y = 10 + player.radius;
              player.vy *= -1;
            }
            if (player.y + player.radius > canvas.height - 10) { /* [source: 113] */
              player.y = canvas.height - 10 - player.radius;
              player.vy *= -1;
            }
          });
          fieldPlayersAway.forEach(player => { /* [source: 114] */
            player.x += player.vx;
            player.y += player.vy;
            player.vx *= FRICTION;
            player.vy *= FRICTION;
            if (player.x - player.radius < 10) {
              player.x = 10 + player.radius;
              player.vx *= -1; /* [source: 115] */
            }
            if (player.x + player.radius > canvas.width - 10) {
              player.x = canvas.width - 10 - player.radius;
              player.vx *= -1;
            }
            if (player.y - player.radius < 10) { /* [source: 116] */
              player.y = 10 + player.radius;
              player.vy *= -1;
            }
            if (player.y + player.radius > canvas.height - 10) {
              player.y = canvas.height - 10 - player.radius;
              player.vy *= -1; /* [source: 117] */
            }
          });
          [goalkeeper, goalkeeperAway].forEach(gk => { /* [source: 118] */
            gk.x += gk.vx;
            gk.y += gk.vy;
            gk.vx *= FRICTION;
            gk.vy *= FRICTION;
          });
          ball.x += ball.dx; /* [source: 119] */
          ball.y += ball.dy;
          ball.dx *= FRICTION;
          ball.dy *= FRICTION;
          if (ball.y - ball.radius < 10) { /* [source: 120] */
            ball.y = 10 + ball.radius;
            ball.dy *= -1; /* [source: 121] */
          }
          if (ball.y + ball.radius > canvas.height - 10) {
            ball.y = canvas.height - 10 - ball.radius;
            ball.dy *= -1; /* [source: 122] */
          }

          if (ball.x - ball.radius < 0) {
            if (ball.y >= canvas.height/2 - 50 && ball.y <= canvas.height/2 + 50) {
              score.away++; /* [source: 122] */
              resetBall(); /* [source: 123] */
            } else {
              ball.x = 10 + ball.radius; /* [source: 123] */
              ball.dx *= -1; /* [source: 124] */
            }
          }
          if (ball.x + ball.radius > canvas.width) {
            if (ball.y >= canvas.height/2 - 50 && ball.y <= canvas.height/2 + 50) {
              score.home++; /* [source: 124] */
              resetBall(); /* [source: 125] */
            } else {
              ball.x = canvas.width - 10 - ball.radius; /* [source: 125] */
              ball.dx *= -1; /* [source: 126] */
            }
          }
        }

        function resetBall() {
          ball.x = canvas.width / 2; /* [source: 126] */
          ball.y = canvas.height / 2; /* [source: 127] */
          ball.dx = 0;
          ball.dy = 0;
          ball.color = "white"; /* [source: 127] */
        }

        function circleCollision(c1, c2) {
          const dx = c1.x - c2.x; /* [source: 128] */
          const dy = c1.y - c2.y; /* [source: 129] */
          return Math.hypot(dx, dy) < (c1.radius + c2.radius); /* [source: 129] */
        }

        function handlePlayerBallCollision(player) {
          if (circleCollision(player, ball)) {
            const dx = ball.x - player.x; /* [source: 130] */
            const dy = ball.y - player.y; /* [source: 131] */
            const dist = Math.hypot(dx, dy) || 1;
            ball.dx = (dx / dist) * BALL_COLLISION_IMPULSE; /* [source: 131] */ // Używa poprawionej stałej
            ball.dy = (dy / dist) * BALL_COLLISION_IMPULSE; /* [source: 132] */ // Używa poprawionej stałej
          }
        }

        function checkCollisions() {
          fieldPlayers.forEach(player => { handlePlayerBallCollision(player); }); /* [source: 132] */
          fieldPlayersAway.forEach(player => { handlePlayerBallCollision(player); }); /* [source: 133] */
          handlePlayerBallCollision(goalkeeper);
          handlePlayerBallCollision(goalkeeperAway);
        }

        function aiMove() {
          fieldPlayersAway.forEach(player => {
            let dx = ball.x - player.x;
            let dy = ball.y - player.y;
            let dist = Math.hypot(dx, dy) || 1;

            const aiSpeed = 2; /* [source: 134] */
            player.vx = (dx / dist) * aiSpeed;
            player.vy = (dy / dist) * aiSpeed;
          });
          let dyGK = ball.y - goalkeeperAway.y; /* [source: 135] */
          let speedGK = 2;
          goalkeeperAway.vy = (dyGK / (Math.abs(dyGK) || 1)) * speedGK; /* [source: 135] */
        }

        function gameLoop() {
          if (!gameAnimating) return; /* [source: 136] */
          ctx.clearRect(0, 0, canvas.width, canvas.height); /* [source: 137] */
          drawField();
          updatePositions();
          checkCollisions();
          drawGameObjects();
          document.getElementById("scoreboard").innerText =
            selectedHomeTeam + " " + score.home + " : " + score.away + " " + selectedAwayTeam; /* [source: 137] */
          requestAnimationFrame(gameLoop); /* [source: 138] */
        }

        /* OBSŁUGA PRZECIĄGANIA – dla zawodników drużyny domowej */
        function canvasMouseDown(e) {
          const rect = canvas.getBoundingClientRect(); /* [source: 138] */
          const mx = e.clientX - rect.left; /* [source: 139] */
          const my = e.clientY - rect.top; /* [source: 139] */
          for (let i = 0; i < fieldPlayers.length; i++) { /* [source: 140] */
            const p = fieldPlayers[i]; /* [source: 140] */
            if (Math.hypot(mx - p.x, my - p.y) < p.radius) { /* [source: 141] */
              draggingPlayerIndex = i; /* [source: 141] */
              isDragging = true; /* [source: 142] */
              dragStart = { x: p.x, y: p.y };
              dragCurrent = { x: mx, y: my };
              break; /* [source: 142] */
            }
          }
        }

        function canvasMouseMove(e) {
          if (!isDragging) return; /* [source: 143] */
          const rect = canvas.getBoundingClientRect(); /* [source: 144] */
          dragCurrent.x = e.clientX - rect.left;
          dragCurrent.y = e.clientY - rect.top; /* [source: 144] */
        }

        function canvasMouseUp(e) {
          if (!isDragging || draggingPlayerIndex === null) return; /* [source: 145] */
          const dx = dragStart.x - dragCurrent.x; /* [source: 146] */
          const dy = dragStart.y - dragCurrent.y;
          fieldPlayers[draggingPlayerIndex].vx = dx * DRAG_IMPULSE_SCALE; /* [source: 146] */
          fieldPlayers[draggingPlayerIndex].vy = dy * DRAG_IMPULSE_SCALE; /* [source: 147] */
          isDragging = false;
          draggingPlayerIndex = null;
          aiMove(); /* [source: 147] */
        }

        function addCanvasEvents() {
          canvas.addEventListener("mousedown", canvasMouseDown); /* [source: 148] */
          canvas.addEventListener("mousemove", canvasMouseMove); /* [source: 149] */
          canvas.addEventListener("mouseup", canvasMouseUp);
          canvas.addEventListener("mouseleave", canvasMouseUp);
        }

        function populateTeamSelections() {
          const homeContainer = document.getElementById("homeTeamContainer"); /* [source: 149] */
          const awayContainer = document.getElementById("awayTeamContainer"); /* [source: 150] */
          homeContainer.innerHTML = "";
          awayContainer.innerHTML = "";
          selectedHomeTeam = null;
          selectedAwayTeam = null; /* [source: 150] */
          for (let league in teamsData) { /* [source: 151] */
            let leagueDivHome = document.createElement("div"); /* [source: 151] */
            leagueDivHome.className = "league-section"; /* [source: 152] */
            let leagueHeaderHome = document.createElement("div");
            leagueHeaderHome.className = "league-header";
            let leagueLogoHome = document.createElement("img");
            leagueLogoHome.src = teamsData[league].leagueLogo; /* [source: 152] */
            let leagueNameHome = document.createElement("span"); /* [source: 153] */
            leagueNameHome.innerText = league;
            leagueHeaderHome.appendChild(leagueLogoHome);
            leagueHeaderHome.appendChild(leagueNameHome);
            leagueDivHome.appendChild(leagueHeaderHome);

            let teamContainerHome = document.createElement("div");
            teamContainerHome.className = "team-container"; /* [source: 153] */
            teamsData[league].teams.forEach(team => { /* [source: 154] */
              let teamDiv = document.createElement("div");
              teamDiv.className = "team-option";
              teamDiv.dataset.team = team.name;
              teamDiv.innerHTML = `<img src="${team.logo}" alt="${team.name}" /><p>${team.name}</p>`;
              teamDiv.addEventListener("click", function () {

                Array.from(homeContainer.querySelectorAll('.team-option')).forEach(el => el.classList.remove("selected")); // Poprawka selektora
                this.classList.add("selected");
                selectedHomeTeam = team.name; /* [source: 155] */
              });
              teamContainerHome.appendChild(teamDiv);
            });
            leagueDivHome.appendChild(teamContainerHome); /* [source: 156] */
            homeContainer.appendChild(leagueDivHome);

            let leagueDivAway = document.createElement("div");
            leagueDivAway.className = "league-section";
            let leagueHeaderAway = document.createElement("div");
            leagueHeaderAway.className = "league-header";
            let leagueLogoAway = document.createElement("img"); /* [source: 156] */
            leagueLogoAway.src = teamsData[league].leagueLogo; /* [source: 157] */
            let leagueNameAway = document.createElement("span");
            leagueNameAway.innerText = league;
            leagueHeaderAway.appendChild(leagueLogoAway);
            leagueHeaderAway.appendChild(leagueNameAway);
            leagueDivAway.appendChild(leagueHeaderAway);

            let teamContainerAway = document.createElement("div");
            teamContainerAway.className = "team-container"; /* [source: 157] */
            teamsData[league].teams.forEach(team => { /* [source: 158] */
              let teamDiv = document.createElement("div");
              teamDiv.className = "team-option";
              teamDiv.dataset.team = team.name;
              teamDiv.innerHTML = `<img src="${team.logo}" alt="${team.name}" /><p>${team.name}</p>`;
              teamDiv.addEventListener("click", function () {

                Array.from(awayContainer.querySelectorAll('.team-option')).forEach(el => el.classList.remove("selected")); // Poprawka selektora
                this.classList.add("selected");
                selectedAwayTeam = team.name; /* [source: 159] */
              });
              teamContainerAway.appendChild(teamDiv);
            });
            leagueDivAway.appendChild(teamContainerAway); /* [source: 160] */
            awayContainer.appendChild(leagueDivAway);
          }
        }

        document.addEventListener("DOMContentLoaded", () => {
          document.getElementById("startMatchBtn").addEventListener("click", () => {
            document.getElementById("startScreen").classList.add("hidden");
            document.getElementById("teamSelectScreen").classList.remove("hidden");
            populateTeamSelections();
          });


          document.getElementById("startMatchFromSelectBtn").addEventListener("click", () => { /* [source: 161] */
            if (!selectedHomeTeam || !selectedAwayTeam) {
              alert("Wybierz obie drużyny!");
              return;
            }
            if (selectedHomeTeam === selectedAwayTeam) {
              alert("Wybierz dwie różne drużyny!"); /* [source: 161] */
              return;
            }
            console.log("Wybrane drużyny:", selectedHomeTeam, "-", selectedAwayTeam); /* [source: 162] */
            document.getElementById("teamSelectScreen").classList.add("hidden");
            document.getElementById("gameScreen").classList.remove("hidden"); /* [source: 162] */
            initGame(); /* [source: 163] */
            addCanvasEvents();
            startTimer();
            gameAnimating = true;
            requestAnimationFrame(gameLoop);
          });

          document.getElementById("backToStartBtn").addEventListener("click", () => {
            gameAnimating = false;
            stopTimer();
            document.getElementById("gameScreen").classList.add("hidden");
            document.getElementById("startScreen").classList.remove("hidden");
          });
        }); /* [source: 164] */

      })();
    </script>
  </body>
</html>

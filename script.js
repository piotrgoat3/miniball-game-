const teams = {
    'FC Barcelona': [
        'Marc-André ter Stegen',
        'Sergi Roberto',
        'Gerard Piqué',
        'Jordi Alba',
        'Sergio Busquets',
        'Frenkie de Jong',
        'Pedri',
        'Ousmane Dembélé',
        'Ansu Fati',
        'Memphis Depay',
        'Pierre-Emerick Aubameyang'
    ],
    'Real Madrid': [
        'Thibaut Courtois',
        'Dani Carvajal',
        'Éder Militão',
        'David Alaba',
        'Ferland Mendy',
        'Casemiro',
        'Luka Modrić',
        'Toni Kroos',
        'Vinícius Júnior',
        'Karim Benzema',
        'Rodrygo'
    ]
};

let selectedTeams = { team1: null, team2: null };
let players = [];

function showTeamSelection() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('team-selection').classList.remove('hidden');
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    team1Select.innerHTML = '';
    team2Select.innerHTML = '';
    for (const team in teams) {
        const option1 = document.createElement('option');
        option1.value = team;
        option1.textContent = team;
        team1Select.appendChild(option1);
        const option2 = document.createElement('option');
        option2.value = team;
        option2.textContent = team;
        team2Select.appendChild(option2);
    }
}

function confirmTeams() {
    selectedTeams.team1 = document.getElementById('team1').value;
    selectedTeams.team2 = document.getElementById('team2').value;
    if (selectedTeams.team1 && selectedTeams.team2 && selectedTeams.team1 !== selectedTeams.team2) {
        document.getElementById('team-selection').classList.add('hidden');
        document.getElementById('menu').classList.remove('hidden');
    } else {
        alert('Proszę wybrać dwie różne drużyny.');
    }
}

function showPlayerManagement() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('player-management').classList.remove('hidden');
    updatePlayerList();
}

function
::contentReference[oaicite:18]{index=18}
 

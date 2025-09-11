// --- Menu burger ---
function toggleMenu() {
  const menu = document.getElementById("menu");
  const logo = document.querySelector(".navbar .logo");
  menu.classList.toggle("show");
  logo.classList.toggle("hide");
}

// Variables globales
let joueurs = [];
let equipes = [];
let mancheActuelle = 1;
let nbManches = 0;
let kaboomUtilisé = false;

// ---------------- Configuration ----------------
function startGame(){
  const nb = parseInt(document.getElementById("nbJoueurs").value);
  if(!nb || nb<2 || nb>6){ alert("Entrez 2 à 6 joueurs"); return; }

  const div = document.getElementById("joueursConfig");
  div.innerHTML = "";
  for(let i=1; i<=nb; i++){
    div.innerHTML += `<label>Joueur ${i}: </label><input type="text" id="joueur${i}" placeholder="Nom joueur ${i}" required><br>`;
  }
  if(nb === 4){
    div.innerHTML += `<label><input type="checkbox" id="jeuEquipe"> Jouer en équipes (2v2)</label><br>`;
  }

  div.innerHTML += `<button onclick="validerJoueurs()">Commencer la partie</button>`;
  document.querySelector("#config-section button[onclick='startGame()']").style.display = "none";
}

function validerJoueurs(){
  joueurs = [];
  let champsVides = false;

  document.querySelectorAll("#joueursConfig input[type=text]").forEach(input => {
    if(input.value.trim() === ""){
      champsVides = true;
    } else {
      joueurs.push({nom: input.value.trim(), scores: [], manchesGagnees: 0});
    }
  });

  if(champsVides){
    alert("⚠️ Chaque joueur doit avoir un nom avant de commencer !");
    return;
  }

  equipes = [];
  const chk = document.getElementById("jeuEquipe");
  if(chk && chk.checked){
    equipes = [[joueurs[0].nom, joueurs[1].nom], [joueurs[2].nom, joueurs[3].nom]];
  }

  if(equipes.length > 0){
    nbManches = 4;
  } else {
    const nb = joueurs.length;
    if(nb === 2) nbManches = 4;
    else if(nb === 3) nbManches = 3;
    else if(nb === 4) nbManches = 4;
    else if(nb === 5) nbManches = 5;
    else if(nb === 6) nbManches = 6;
  }

  mancheActuelle = 1;

  localStorage.setItem("partieEnCours", JSON.stringify({joueurs, equipes, nbManches, statut:"en cours"}));

  document.getElementById("config-section").style.display = "none";
  document.getElementById("game-section").classList.remove("hidden");
  initJeu();
}

// ---------------- Jeu ----------------
function initJeu(){
  const roundTitle = document.getElementById("round-title");

  if(mancheActuelle > nbManches){
    roundTitle.textContent = "🎉 Fin de partie";
    roundTitle.classList.add("fin-de-partie");
    document.getElementById("mancheContainer").innerHTML = "";
    afficherTableauFinal();

    // Sauvegarder partie finie
    let parties = JSON.parse(localStorage.getItem("parties")) || [];
    parties.push({joueurs});
    localStorage.setItem("parties", JSON.stringify(parties));

    // Marquer la partie comme finie
    localStorage.setItem("partieEnCours", JSON.stringify({joueurs, equipes, nbManches, statut:"finie"}));
    return;
  }

  roundTitle.classList.remove("fin-de-partie");
  roundTitle.textContent = `🎮 Manche ${mancheActuelle}`;

  const mancheDiv = document.getElementById("mancheContainer");
  mancheDiv.innerHTML = `<table class="score-table">
    <thead><tr><th>Joueur</th><th>Score</th></tr></thead>
    <tbody>
      ${joueurs.map((j,i) => `
        <tr>
          <td>${j.nom}</td>
          <td><input type="number" id="score-${i}" disabled onchange="verifierScores()"></td>
          <td><button id="kaboom-${i}" class="btn-kaboom" onclick="activerKaboom(${i})"></button></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="btn">
  <button id="nextMancheBtn" disabled onclick="terminerManche()">Manche suivante</button>
  </div>`;

  kaboomUtilisé = false;
  afficherTableauScores();
}

// ----------------- Kaboom + manches -----------------
function activerKaboom(i){
  if(kaboomUtilisé) return;
  kaboomUtilisé = true;
  document.querySelectorAll("button[id^='kaboom-']").forEach(btn => {
    if(btn.id !== `kaboom-${i}`) btn.disabled = true;
  });
  joueurs.forEach((_, idx) => {
    document.getElementById(`score-${idx}`).disabled = false;
  });
}

function verifierScores(){
  let rempli = true;
  joueurs.forEach((_,i)=>{
    if(document.getElementById(`score-${i}`).value === "") rempli = false;
  });
  document.getElementById("nextMancheBtn").disabled = !rempli;
}

function terminerManche(){
  let scores = [];
  joueurs.forEach((j,i)=>{
    const val = parseInt(document.getElementById(`score-${i}`).value) || 0;
    j.scores.push(val);
    scores.push({nom: j.nom, score: val});
  });

  const min = Math.min(...scores.map(s=>s.score));
  const gagnants = scores.filter(s=>s.score === min);
  gagnants.forEach(g=>{
    const j = joueurs.find(jj => jj.nom === g.nom);
    j.manchesGagnees++;
  });

  localStorage.setItem("partieEnCours", JSON.stringify({joueurs, equipes, nbManches, statut:"en cours"}));

  mancheActuelle++;
  initJeu();
}

// ---------------- Tableaux ----------------
function afficherTableauScores(){
  const div = document.getElementById("tableauScores");
  const afficherTotal = mancheActuelle > 1;

  let header = "<th>Joueur</th>";
  for(let i=1; i<=mancheActuelle; i++) header += `<th>Manche ${i}</th>`;
  if(afficherTotal) header += "<th>TOTAL</th>";

  let body = joueurs.map(j=>{
    let row = `<tr><td>${j.nom}</td>`;
    for(let i=0;i<mancheActuelle;i++){
      row += `<td>${j.scores[i] !== undefined ? j.scores[i] : ""}</td>`;
    }
    if(afficherTotal){
      const total = j.scores.reduce((a,b)=>a+b,0);
      row += `<td class="total-score">${total}</td>`;
    }
    row += "</tr>";
    return row;
  }).join("");

  div.innerHTML = `<table class="score-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function afficherTableauFinal(){
  const div = document.getElementById("tableauScores");
  joueurs.forEach(j => j.total = j.scores.reduce((a,b)=>a+b,0));
  const joueursTries = [...joueurs].sort((a,b) => a.total - b.total);

  let header = "<th>Joueur</th>";
  for(let i=1; i<=nbManches; i++) header += `<th>Manche ${i}</th>`;
  header += "<th>TOTAL</th>";

  let body = joueursTries.map(j=>{
    let row = `<tr><td>${j.nom}</td>`;
    for(let i=0;i<nbManches;i++){
      row += `<td>${j.scores[i] !== undefined ? j.scores[i] : ""}</td>`;
    }
    let color = "white";
    if(j === joueursTries[0]) color = "#469F8B";
    else if(j === joueursTries[joueursTries.length-1]) color = "#D52E2E";
    row += `<td style="color:${color}; font-weight:bold">${j.total}</td>`;
    row += "</tr>";
    return row;
  }).join("");

  div.innerHTML = `<table class="score-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

// ---------------- Réinitialiser ----------------
function reinitialiserPartie(){
  localStorage.removeItem("partieEnCours");
  location.reload();
}

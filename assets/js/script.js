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

// Démarrer la configuration des joueurs
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

  // Ajouter le bouton Commencer la partie
  div.innerHTML += `<button onclick="validerJoueurs()">Commencer la partie</button>`;

  // Cacher le bouton Valider original
  document.querySelector("#config-section button[onclick='startGame()']").style.display = "none";
}


// Valider les joueurs et configurer la partie
function validerJoueurs(){
  joueurs = [];
  let champsVides = false;

  // Vérification que chaque joueur a bien un nom
  document.querySelectorAll("#joueursConfig input[type=text]").forEach(input => {
    if(input.value.trim() === ""){
      champsVides = true;
    } else {
      joueurs.push({nom: input.value.trim(), scores: [], manchesGagnees: 0});
    }
  });

  if(champsVides){
    alert("⚠️ Chaque joueur doit avoir un nom avant de commencer !");
    return; // On arrête la fonction ici si un champ est vide
  }

  equipes = [];
  const chk = document.getElementById("jeuEquipe");
  if(chk && chk.checked){
    equipes = [[joueurs[0].nom, joueurs[1].nom], [joueurs[2].nom, joueurs[3].nom]];
  }

  // Déterminer le nombre de manches
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

  // Stocker dans localStorage pour reprise
  localStorage.setItem("joueurs", JSON.stringify(joueurs));
  localStorage.setItem("equipes", JSON.stringify(equipes));
  localStorage.setItem("nbManches", nbManches);

  mancheActuelle = 1;
  document.getElementById("config-section").style.display = "none";
  document.getElementById("game-section").classList.remove("hidden");
  initJeu();
}

// Initialiser le tableau de la manche actuelle
function initJeu(){
  const roundTitle = document.getElementById("round-title");

  if(mancheActuelle > nbManches){
  roundTitle.textContent = "🎉 Fin de partie";
  roundTitle.classList.add("fin-de-partie");
  document.getElementById("mancheContainer").innerHTML = "";
  afficherTableauFinal();
  return;
}

// Affichage normal de la manche
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

// Activer le KABOOM d’un joueur
function activerKaboom(i){
  if(kaboomUtilisé) return;
  kaboomUtilisé = true;

  // Désactiver tous les autres boutons KABOOM
  document.querySelectorAll("button[id^='kaboom-']").forEach(btn => {
    if(btn.id !== `kaboom-${i}`) btn.disabled = true;
  });

  // Activer tous les inputs pour entrer les scores
  joueurs.forEach((_, idx) => {
    document.getElementById(`score-${idx}`).disabled = false;
  });
}

// Vérifier si tous les scores sont saisis
function verifierScores(){
  let rempli = true;
  joueurs.forEach((_,i)=>{
    if(document.getElementById(`score-${i}`).value === "") rempli = false;
  });
  document.getElementById("nextMancheBtn").disabled = !rempli;
}

// Terminer la manche actuelle
function terminerManche(){
  let scores = [];
  joueurs.forEach((j,i)=>{
    const val = parseInt(document.getElementById(`score-${i}`).value) || 0;
    j.scores.push(val);
    scores.push({nom: j.nom, score: val});
  });

  // Trouver le score le plus petit
  const min = Math.min(...scores.map(s=>s.score));
  const gagnants = scores.filter(s=>s.score === min);

  // Mettre à jour les manches gagnées
  gagnants.forEach(g=>{
    const j = joueurs.find(jj => jj.nom === g.nom);
    j.manchesGagnees++;
  });

  localStorage.setItem("joueurs", JSON.stringify(joueurs));

  mancheActuelle++;
  initJeu();
}



// Afficher le tableau cumulatif avec toutes les manches et TOTAL
function afficherTableauScores(){
  const div = document.getElementById("tableauScores");

  // Ajouter colonne TOTAL si au moins une manche est terminée
  const afficherTotal = mancheActuelle > 1;

  // Header
  let header = "<th>Joueur</th>";
  for(let i=1; i<=mancheActuelle; i++) header += `<th>Manche ${i}</th>`;
  if(afficherTotal) header += "<th>TOTAL</th>";

  // Corps
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

  // Mettre en vert le score le plus petit pour la manche actuelle
  const table = div.querySelector("table");
  if(table){
    const colIndex = mancheActuelle; // dernière manche
    let min = Infinity;
    joueurs.forEach((j,i)=>{
      if(j.scores[mancheActuelle-1] < min) min = j.scores[mancheActuelle-1];
    });
    for(let i=0;i<joueurs.length;i++){
      const cell = table.rows[i+1].cells[colIndex];
      if(joueurs[i].scores[mancheActuelle-1] === min){
        cell.style.backgroundColor = "#469F8B";
      }
    }

    // Colorer la colonne TOTAL si elle est affichée
    if(afficherTotal){
      const totalColIndex = table.rows[0].cells.length - 1; // dernière colonne
      let totaux = joueurs.map(j => j.scores.reduce((a,b)=>a+b,0));
      const minTotal = Math.min(...totaux);
      const maxTotal = Math.max(...totaux);

      joueurs.forEach((j,i)=>{
        const cell = table.rows[i+1].cells[totalColIndex];
        if(totaux[i] === minTotal){
          cell.style.color = "#469F8B"; // meilleur total
          cell.style.fontWeight = "bold";
        } else if(totaux[i] === maxTotal){
          cell.style.color = "#D52E2E"; // pire total
          cell.style.fontWeight = "bold";
        } else {
          cell.style.color = "white"; // autres
          cell.style.fontWeight = "normal";
        }
      });
    }
  }
}

// Afficher le tableau final avec la colonne TOTAL
function afficherTableauFinal(){
  const div = document.getElementById("tableauScores");

  // Calculer le total de chaque joueur
  joueurs.forEach(j => {
    j.total = j.scores.reduce((a,b)=>a+b,0);
  });

  // Trier les joueurs par total croissant (meilleur en premier)
  const joueursTries = [...joueurs].sort((a,b) => a.total - b.total);

  // Header
  let header = "<th>Joueur</th>";
  for(let i=1; i<=nbManches; i++) header += `<th>Manche ${i}</th>`;
  header += "<th>TOTAL</th>";

  // Corps
  let body = joueursTries.map(j=>{
    let row = `<tr><td>${j.nom}</td>`;
    for(let i=0;i<nbManches;i++){
      row += `<td>${j.scores[i] !== undefined ? j.scores[i] : ""}</td>`;
    }
    // Coloration du total
    let color = "white";
    if(j === joueursTries[0]) color = "#469F8B"; // gagnant
    else if(j === joueursTries[joueursTries.length-1]) color = "#D52E2E"; // dernier
    row += `<td style="color:${color}; font-weight:bold">${j.total}</td>`;
    row += "</tr>";
    return row;
  }).join("");

  div.innerHTML = `<table class="score-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}


// Réinitialiser la partie
function reinitialiserPartie(){
  localStorage.removeItem("joueurs");
  localStorage.removeItem("equipes");
  localStorage.removeItem("nbManches");
  location.reload();
}

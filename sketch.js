let myTable;
let citta = [];            // una voce per ogni città

let maxPop = 0;
let numCitta = 100;        // uso solo le prime 100 righe del CSV

// spazio per titolo (sopra) e legenda (sotto)
let margineTop = 100;
let margineBottom = 130;
let margineLato = 40;

let raggioMax = 30;        // verrà ricalcolato in draw

// colore (r, g, b) per ogni continente
let colori = {
  "Africa":        [255, 176, 0],
  "Asia":          [255, 70, 110],
  "Europa":        [70, 210, 255],
  "Nord America":  [120, 255, 100],
  "Sud America":   [190, 120, 255],
  "Oceania":       [255, 255, 255]
};

// il dataset non ha la colonna "continente": la ricavo io dal paese
let continenti = {
  "Africa": ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros", "Congo", "Congo, The Democratic Republic of the", "Cote D'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libyan Arab Jamahiriya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Swaziland", "Tanzania, United Republic of", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"],
  "Asia": ["Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei Darussalam", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran, Islamic Republic Of", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Korea, Democratic People'S Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan", "Lao People'S Democratic Republic", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "Oman", "Pakistan", "Palestinian Territory, Occupied", "Philippines", "Qatar", "Saudi Arabia", "Singapore", "Sri Lanka", "Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Thailand", "Timor-Leste", "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Viet Nam", "Yemen"],
  "Europa": ["Albania", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Gibraltar", "Greece", "Hungary", "Iceland", "Ireland", "Isle of Man", "Italy", "Kosovo", "Latvia", "Lithuania", "Luxembourg", "Macedonia, The Former Yugoslav Republic of", "Malta", "Moldova, Republic of", "Monaco", "Montenegro", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Russian Federation", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom"],
  "Nord America": ["Bahamas", "Barbados", "Belize", "Bermuda", "Canada", "Cayman Islands", "Costa Rica", "Cuba", "Dominican Republic", "El Salvador", "Greenland", "Guatemala", "Haiti", "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Saint Kitts and Nevis", "Trinidad and Tobago", "United States"],
  "Sud America": ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Falkland Islands (Malvinas)", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"],
  "Oceania": ["Australia", "Fiji", "Marshall Islands", "New Zealand", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", "Vanuatu"]
};

let paeseContinente = {};  // es. "Italy" -> "Europa"

async function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Courier New");

  // costruisco la ricerca paese -> continente
  for (let nomeCont in continenti) {
    for (let paese of continenti[nomeCont]) {
      paeseContinente[paese] = nomeCont;
    }
  }

  myTable = await loadTable("assets/cities.csv", ",", "header");

  // leggo solo le prime 100 righe (il file è già ordinato dalla più popolosa)
  let righe = min(numCitta, myTable.getRowCount());

  for (let i = 0; i < righe; i++) {
    let pop = myTable.getNum(i, "population");
    let nome = myTable.getString(i, "name");
    let nomeLocale = myTable.getString(i, "local_name");
    let paese = myTable.getString(i, "country");

    // salto righe con dati mancanti
    if (isNaN(pop)) continue;
    if (nome === "") nome = nomeLocale;
    if (nome === "") nome = "?";

    let continente = paeseContinente[paese];

    // la Russia è a cavallo: a est degli Urali è Asia
    if (paese === "Russian Federation" && myTable.getNum(i, "lon") > 60) {
      continente = "Asia";
    }

    if (!continente) continue;

    citta.push({
      nome: nome,
      nomeLocale: nomeLocale,
      paese: paese,
      continente: continente,
      pop: pop
    });

    maxPop = max(maxPop, pop);
  }

  // dalla più grande alla più piccola
  citta.sort((a, b) => b.pop - a.pop);

  console.log("città caricate:", citta.length);
}

function draw() {
  background(0);
  if (citta.length === 0) return; // dati non ancora caricati

  disegnaTitolo();

  // --- calcolo la griglia ---
  let areaW = width - margineLato * 2;
  let areaH = height - margineTop - margineBottom;
  let colonne = ceil(sqrt(citta.length * areaW / areaH));
  let righe = ceil(citta.length / colonne);
  let cella = min(areaW / colonne, areaH / righe);
  raggioMax = cella * 0.45;

  let startX = (width - cella * colonne) / 2;
  let startY = margineTop;

  let hover = null;

  noStroke();
  for (let i = 0; i < citta.length; i++) {
    let c = citta[i];

    let col = i % colonne;
    let riga = floor(i / colonne);
    let x = startX + col * cella + cella / 2;
    let y = startY + riga * cella + cella / 2;

    let raggio = raggioPopolazione(c.pop);
    let colore = colori[c.continente];

    // disegno il glifo
    fill(colore[0], colore[1], colore[2]);
    circle(x, y, raggio * 2);

    // controllo il rollover
    if (dist(mouseX, mouseY, x, y) < raggio) {
      hover = { dato: c, x: x, y: y, raggio: raggio };
    }
  }

  // evidenzio il glifo sotto il mouse
  if (hover) {
    noFill();
    stroke(255);
    strokeWeight(2);
    circle(hover.x, hover.y, hover.raggio * 2 + 10);
  }

  disegnaLegenda();

  // il tooltip va per ultimo, sopra a tutto
  if (hover) {
    disegnaTooltip(hover.dato);
  }
}

// ---------- codifica dei dati ----------

function raggioPopolazione(pop) {
  // il raggio cresce con la radice quadrata, così è l'AREA ad essere proporzionale
  return raggioMax * sqrt(pop / maxPop);
}

// ---------- titolo, legenda, tooltip ----------

function disegnaTitolo() {
  noStroke();
  textStyle(NORMAL);
  textAlign(LEFT, TOP);

  fill(255);
  textSize(24);
  text("LE 100 CITTÀ PIÙ POPOLOSE", 40, 30);

  fill(150);
  textSize(12);
  text("ogni cerchio è una città, in ordine dalla più grande alla più piccola", 40, 64);
}

function disegnaLegenda() {
  let y = height - margineBottom + 15;
  noStroke();
  textStyle(NORMAL);
  textSize(12);

  // --- colore = continente ---
  fill(150);
  textAlign(LEFT, CENTER);
  text("COLORE = CONTINENTE", 40, y);

  let x = 40;
  for (let nomeCont in colori) {
    let col = colori[nomeCont];
    fill(col[0], col[1], col[2]);
    circle(x + 6, y + 28, 12);
    fill(255);
    textAlign(LEFT, CENTER);
    text(nomeCont, x + 20, y + 28);
    x += textWidth(nomeCont) + 50;
  }

  // --- dimensione = popolazione ---
  fill(150);
  textAlign(LEFT, CENTER);
  text("DIMENSIONE = POPOLAZIONE", 40, y + 62);

  let esempi = [5000000, 10000000, 25000000];
  let etichette = ["5 mln", "10 mln", "25 mln"];
  let xs = 40;
  for (let i = 0; i < esempi.length; i++) {
    // nella legenda uso cerchi più piccoli (max 22 px) ma sempre in proporzione
    let r = 22 * sqrt(esempi[i] / 25000000);
    noFill();
    stroke(200);
    strokeWeight(1);
    circle(xs + r, y + 90, r * 2);
    noStroke();
    fill(255);
    textAlign(LEFT, CENTER);
    text(etichette[i], xs + r * 2 + 8, y + 90);
    xs += r * 2 + textWidth(etichette[i]) + 40;
  }
}

function disegnaTooltip(c) {
  let righe = [c.nome];
  if (c.nomeLocale !== "" && c.nomeLocale !== c.nome) {
    righe.push(c.nomeLocale);
  }
  righe.push(c.paese);
  righe.push("Popolazione: " + c.pop.toLocaleString("it-IT"));
  righe.push("Continente: " + c.continente);

  textSize(13);
  textStyle(NORMAL);
  textAlign(LEFT, TOP);

  // larghezza = riga più lunga
  let w = 0;
  for (let i = 0; i < righe.length; i++) {
    w = max(w, textWidth(righe[i]));
  }
  w += 24;
  let h = righe.length * 20 + 14;

  // evito che il riquadro esca dallo schermo
  let x = min(mouseX + 15, width - w - 10);
  let y = min(mouseY + 15, height - h - 10);

  let col = colori[c.continente];
  fill(0, 240);
  stroke(col[0], col[1], col[2]);
  strokeWeight(1);
  rect(x, y, w, h);

  noStroke();
  for (let i = 0; i < righe.length; i++) {
    if (i === 0) fill(col[0], col[1], col[2]);
    else fill(255);
    text(righe[i], x + 12, y + 8 + i * 20);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
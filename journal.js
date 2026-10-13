// Alcool Barialimites — journal.js
// Module 4 : Journal de bord + wizard "Collecter" + import/export CSV + historique (build 664, extrait de index.html)
// Note : parseDate/fmtDate/entryDate/entryAlcool sont aussi utilisées par dashboard.js (tendances) — dépendance de scope global, sans contrainte d'ordre de chargement.
// Note : updateRisquesChir (aide chirurgie) et sauverBrouillon (persistance session en cours) NE SONT PAS déplacées — ce sont des fonctions du cœur (session/config), pas du journal, malgré leur position voisine dans le fichier d'origine.
// Chargé avant le script principal (voir index.html).

function _journalFilename() {
  var d = new Date();
  var yy = String(d.getFullYear()).slice(-2);
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  var jj = String(d.getDate()).padStart(2, "0");
  return "barialimites-journal[" + yy + mm + jj + "].csv";
}

function exportCsvAlerte() {
  var journal = getJournal();
  if (!journal.length) return;
  var csv = buildCsv(journal);
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = _journalFilename();
  a.click();
  URL.revokeObjectURL(url);
}


function parseDate(s) {
  if(!s) return null;
  // Format DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY
  var m=s.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if(m) return new Date(parseInt(m[3]),parseInt(m[2])-1,parseInt(m[1]));
  var d=new Date(s); return isNaN(d)?null:d;
}
function fmtDate(d) { return d.getDate()+'\/'+(d.getMonth()+1)+'\/'+d.getFullYear(); }
// Lire une entrée journal quel que soit le format (natif ou CSV importé)
function entryDate(e) { return e.date || e['Date'] || ''; }
function entryAlcool(e) { return parseFloat(e.alcool_pur_g || e['Alcool pur (g)'] || 0); }

function ouvrirImportCSV() {
  var ex = document.getElementById('importCSVModal'); if (ex) ex.remove();
  var modal = document.createElement('div');
  modal.id = 'importCSVModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = '<div style="background:var(--card-bg);border-radius:18px;padding:22px 18px;max-width:360px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.4);">'
    + '<div style="font-size:1rem;font-weight:800;color:var(--wine);margin-bottom:10px;">📥 Importer un journal CSV</div>'
    + '<div style="font-size:.82rem;color:var(--muted);margin-bottom:14px;">Sélectionnez un fichier au format CSV conforme au journal Barialimites.</div>'
    + '<div id="importCSVMsg" style="display:none;font-size:.82rem;padding:8px 12px;border-radius:8px;margin-bottom:10px;"></div>'
    + '<input type="file" id="importCSVInput" accept=".csv" style="font-size:.82rem;width:100%;margin-bottom:14px;" onchange="lireCSVImport(this)">'
    + '<div style="display:flex;gap:8px;">'
    + '<button onclick="fermerImportCSV()" style="flex:1;padding:10px;background:none;border:1.5px solid var(--border);border-radius:10px;font-family:Nunito,sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;color:var(--muted);">Annuler</button>'
    + '<button id="btnImportConfirm" onclick="confirmerImportCSV()" style="flex:2;padding:10px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.82rem;font-weight:800;cursor:pointer;display:none;">✅ Importer</button>'
    + '</div></div>';
  document.body.appendChild(modal);
}
var _csvImportData = null;
function fermerImportCSV() { var m=document.getElementById('importCSVModal'); if(m) m.remove(); _csvImportData=null; }
function lireCSVImport(input) {
  var msg=document.getElementById('importCSVMsg'), btn=document.getElementById('btnImportConfirm');
  _csvImportData=null; if(btn) btn.style.display='none';
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    var text=e.target.result, lines=text.trim().split('\n');
    if(lines.length<2){afficherMsgImport(msg,'Désolé, fichier non conforme.','error');return;}
    var header=lines[0].replace(/"/g,'');
    if(header.indexOf('Date')===-1||header.indexOf('Genre')===-1){
      afficherMsgImport(msg,'Désolé, fichier non conforme.','error');return;}
    // Parser CSV correct gérant les guillemets
    function parseCSVLine(line) {
      var result=[], cur='', inQ=false;
      for(var ci=0;ci<line.length;ci++) {
        var ch=line[ci];
        if(ch==='"') { if(inQ&&line[ci+1]==='"'){cur+='"';ci++;} else inQ=!inQ; }
        else if(ch===','&&!inQ){result.push(cur);cur='';}
        else cur+=ch;
      }
      result.push(cur);
      return result;
    }
    var cols=parseCSVLine(lines[0]);
    var idxGenre=cols.indexOf('Genre');
    var rows=[], genreRef=null, incoherence=false;
    for(var i=1;i<lines.length;i++){
      if(!lines[i].trim()) continue;
      var cells=parseCSVLine(lines[i]);
      var g=cells[idxGenre]||'';
      if(g&&!genreRef) genreRef=g;
      if(g&&g!==genreRef){incoherence=true;break;}
      rows.push(cells);
    }
    if(incoherence){afficherMsgImport(msg,'Désolé, il y a des incohérences dans l\'import (genre différent).','error');return;}
    if(rows.length===0){afficherMsgImport(msg,'Désolé, fichier non conforme.','error');return;}
    _csvImportData={rows:rows,cols:cols};
    afficherMsgImport(msg,'✅ Fichier valide — '+rows.length+' entrée(s). Cliquez Importer pour ajouter au journal.','ok');
    if(btn) btn.style.display='block';
  };
  reader.readAsText(file,'UTF-8');
}
function afficherMsgImport(el,txt,type){
  if(!el) return;
  el.style.display='block';
  el.style.background=type==='error'?'#ffe5e5':'#e6f9ee';
  el.style.color=type==='error'?'#7a0000':'#155724';
  el.textContent=txt;
}
var CSV_KEY_MAP = {
  'Date':'date','Note':'note','Contexte':'contexte','Boisson':'boisson',
  'Catégorie':'categorie','Degré (°)':'degre','Volume (mL)':'volume_mL','Nb verres':'nb_verres',
  'Alimentaire':'alimentaire','Facteur alim.':'facteur_alim','Poids (kg)':'poids_kg',
  'Genre':'genre','Masse musc. (kg)':'masse_musc_kg','Chirurgie':'chirurgie',
  'Temps post-op':'temps_postop','Temps écoulé (h)':'temps_ecoule_h',
  'Alcool pur (g)':'alcool_pur_g','Coeff. Widmark':'coeff_widmark','Coeff. ajusté':'coeff_ajuste',
  'Élimination (g/L/h)':'elimination','Taux pic (g/L)':'taux_pic_gL','Taux actuel (g/L)':'taux_actuel_gL',
  'Taux (mg/L expiré)':'taux_mgL','Seuil bari. (g/L)':'seuil_bari_gL','Retour 0 (h)':'temps_retour_h',
  'Dépassement seuil':'depasse_seuil'
};
function confirmerImportCSV(){
  if(!_csvImportData) return;
  var existant=[];
  try{existant=JSON.parse(localStorage.getItem('bari_journal')||'[]');}catch(e){}
  var cols=_csvImportData.cols, rows=_csvImportData.rows;
  for(var i=0;i<rows.length;i++){
    var r=rows[i], entry={};
    for(var j=0;j<cols.length;j++){
      var key = CSV_KEY_MAP[cols[j]] || cols[j];
      entry[key]=r[j]||'';
    }
    if(entry.boisson && !entry.consommations) entry.consommations = entry.boisson;
    if(!entry.nb_consommations) entry.nb_consommations = 1;
    existant.push(entry);
  }
  try{localStorage.setItem('bari_journal',JSON.stringify(existant));}catch(e){}
  fermerImportCSV();
  if(typeof afficherJournal==='function') afficherJournal();
  ouvrirTableauBord();
  alert('✅ '+rows.length+' entrée(s) importée(s) dans le journal.');
}

// ── Journal de bord ──────────────────────────
const LS_JOURNAL = 'bari_journal';

function getJournal() {
  try { return JSON.parse(localStorage.getItem(LS_JOURNAL) || '[]'); } catch(e) { return []; }
}

// RC4 build 555 : Fonction "Mes sentiments"
var _sentimentsData = { pourquoi: [], pendant: [], apres: [] };

var _SENTIMENTS_OPTS = {
  pourquoi: [
    { id: 'festif',    label: '\ud83c\udf89 Occasion festive' },
    { id: 'pression',  label: '\ud83d\udc65 Pression sociale' },
    { id: 'stress',    label: '\ud83d\ude30 Stress / Anxi\u00e9t\u00e9' },
    { id: 'plaisir',   label: '\ud83d\ude0b Plaisir / Envie' },
    { id: 'habitude',  label: '\ud83d\udd04 Habitude' },
    { id: 'repas',     label: '\ud83c\udf7d\ufe0f Contexte repas' },
  ],
  pendant: [
    { id: 'bien',      label: '\ud83d\ude0a Bien / D\u00e9tendu\u00b7e' },
    { id: 'soulage',   label: '\ud83d\ude0c Soulag\u00e9\u00b7e' },
    { id: 'neutre',    label: '\ud83d\ude10 Neutre' },
    { id: 'malaise',   label: '\ud83d\ude2c Mal \u00e0 l\u2019aise' },
    { id: 'anxieux',   label: '\ud83d\ude30 Anxieux\u00b7se' },
    { id: 'partage',   label: '\ud83e\udd14 Partag\u00e9\u00b7e' },
  ],
  apres: [
    { id: 'satisfait', label: '\ud83d\ude0a Satisfait\u00b7e / Fier\u00b7e' },
    { id: 'neutre',    label: '\ud83d\ude10 Neutre' },
    { id: 'regret',    label: '\ud83d\ude14 Regret' },
    { id: 'honte',     label: '\ud83d\ude33 Honte' },
    { id: 'coupable',  label: '\ud83d\ude1e Coupable' },
    { id: 'necessaire',label: '\ud83d\udcaa C\u2019\u00e9tait n\u00e9cessaire' },
  ]
};

function ouvrirSentiments(_apres) {
  // Désactivé si consommations futures
  var now = nowDecimal();
  var hasFutur = session.some(function(c){ return c.heureDecimal > now; });
  if (hasFutur) {
    alert('Cette fonction n\u2019est pas disponible tant qu\u2019il y a des consommations futures.'); return;
  }
  if (session.length === 0) {
    alert('Aucune consommation \u00e0 analyser.'); return;
  }

  var ex = document.getElementById('sentimentsModal'); if (ex) ex.remove();
  _sentimentsData = { pourquoi: [], pendant: [], apres: [] };
  var _bs = document.getElementById('btnSentiments');
  if (_bs) { _bs.textContent = '\ud83d\udcad Mes sentiments'; _bs.style.background = 'var(--cream)'; _bs.style.color = 'var(--wine)'; _bs.style.border = '1.5px solid var(--wine)'; }

  var modal = document.createElement('div');
  modal.id = 'sentimentsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9300;'
    + 'display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';

  var box = document.createElement('div');
  box.style.cssText = 'background:var(--card-bg);border-radius:18px;padding:20px 16px;'
    + 'max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:Nunito,sans-serif;';

  function mkQuestion(key, titre, step, total) {
    var opts = _SENTIMENTS_OPTS[key];
    var html = '<div style="font-size:.72rem;color:var(--muted);margin-bottom:2px;">\u00c9tape ' + step + '/' + total + '</div>'
      + '<div style="font-size:.95rem;font-weight:800;color:var(--wine);margin-bottom:14px;">' + titre + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">';
    opts.forEach(function(o) {
      html += '<button data-key="' + key + '" data-id="' + o.id + '" '
        + 'style="padding:8px 12px;border:1.5px solid var(--border);border-radius:10px;'
        + 'font-family:Nunito,sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;'
        + 'background:var(--cream);color:var(--text);">' + o.label + '</button>';
    });
    html += '</div>';
    return html;
  }

  var step = 0;
  var questions = [
    { key: 'pourquoi', titre: 'Pourquoi avez-vous consomm\u00e9\u00a0?' },
    { key: 'pendant',  titre: 'Comment vous sentiez-vous pendant\u00a0?' },
    { key: 'apres',    titre: 'Comment vous sentez-vous apr\u00e8s\u00a0?' },
  ];

  function renderStep() {
    var q = questions[step];
    box.innerHTML = '<div style="font-size:1rem;font-weight:800;color:var(--wine);margin-bottom:16px;">\ud83d\udcad Mes sentiments</div>'
      + mkQuestion(q.key, q.titre, step + 1, 3);

    // Boutons nav
    var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:4px;';
    var bNext = document.createElement('button');
    bNext.style.cssText = 'flex:2;padding:11px;background:var(--wine);color:#fff;border:none;'
      + 'border-radius:10px;font-family:Nunito,sans-serif;font-size:.9rem;font-weight:800;cursor:pointer;';
    bNext.textContent = step < 2 ? 'Suivant \u2192' : '\u2705 Enregistrer';
    bNext.addEventListener('click', function() {
      if (_sentimentsData[q.key].length === 0) {
        alert('Veuillez s\u00e9lectionner au moins une option.'); return;
      }
      if (step < 2) { step++; renderStep(); }
      else { enregistrerSentiments(); modal.remove(); if (_apres) _apres(); }
    });
    var bAnn = document.createElement('button');
    bAnn.style.cssText = 'flex:1;padding:11px;background:none;border:1.5px solid var(--border);'
      + 'border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:700;'
      + 'cursor:pointer;color:var(--muted);';
    bAnn.textContent = step > 0 ? '\u2190 Retour' : 'Annuler';
    bAnn.addEventListener('click', function() {
      if (step > 0) { step--; renderStep(); } else { modal.remove(); if (_apres) _apres(); }
    });
    row.appendChild(bNext); row.appendChild(bAnn);
    box.appendChild(row);

    // Gestion sélection des options
    box.querySelectorAll('button[data-key]').forEach(function(btn) {
      var k = btn.getAttribute('data-key');
      var id = btn.getAttribute('data-id');
      if (_sentimentsData[k].indexOf(id) >= 0) {
        btn.style.background = 'var(--wine)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--wine)';
      }
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var arr = _sentimentsData[k];
        var idx = arr.indexOf(id);
        if (idx >= 0) {
          arr.splice(idx, 1);
          btn.style.background = 'var(--cream)'; btn.style.color = 'var(--text)'; btn.style.borderColor = 'var(--border)';
        } else {
          arr.push(id);
          btn.style.background = 'var(--wine)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--wine)';
        }
      });
    });
  }

  renderStep();
  modal.appendChild(box); document.body.appendChild(modal);
}

function enregistrerSentiments() {
  // build 556 : stocker dans _sentimentsData uniquement — 3 colonnes CSV séparées
  // Feedback bouton
  var btn = document.getElementById('btnSentiments');
  if (btn) {
    // build 582 : bordeaux fixe jusqu'au Collecter
    btn.textContent = '\u2705 Sentiments enregistr\u00e9s';
    btn.style.background = 'var(--wine)'; btn.style.color = '#fff'; btn.style.border = '1.5px solid var(--wine)';
  }
}

// ── build 602 : Wizard "Collecter dans le journal de bord" ────────────────
var _collecteExtras = [];
function _wizOverlay() {
  var ex = document.getElementById("wizModal"); if (ex) ex.remove();
  var m = document.createElement("div"); m.id = "wizModal";
  m.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9400;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;";
  var box = document.createElement("div");
  box.style.cssText = "background:var(--card-bg);border-radius:18px;padding:22px 18px;max-width:380px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:Nunito,sans-serif;max-height:92vh;overflow:auto;";
  m.appendChild(box); document.body.appendChild(m);
  return { m: m, box: box };
}
function _wizConfirm(question, onOui, onNon) {
  var o = _wizOverlay();
  var q = document.createElement("div");
  q.style.cssText = "font-size:.95rem;font-weight:800;color:var(--wine);line-height:1.5;margin-bottom:18px;";
  q.textContent = question;
  var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;";
  var bNon = document.createElement("button"); bNon.textContent = "Non";
  bNon.style.cssText = "flex:1;padding:11px;background:none;border:1.5px solid var(--border);border-radius:10px;font-family:Nunito,sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;color:var(--muted);";
  bNon.addEventListener("click", function(){ o.m.remove(); if (onNon) onNon(); });
  var bOui = document.createElement("button"); bOui.textContent = "Oui";
  bOui.style.cssText = "flex:1;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.88rem;font-weight:800;cursor:pointer;";
  bOui.addEventListener("click", function(){ o.m.remove(); if (onOui) onOui(); });
  row.appendChild(bNon); row.appendChild(bOui);
  o.box.appendChild(q); o.box.appendChild(row);
}
function _wizInfo(message, btnLabel, onNext) {
  var o = _wizOverlay();
  var q = document.createElement("div");
  q.style.cssText = "font-size:.9rem;font-weight:700;color:var(--text);line-height:1.5;margin-bottom:18px;";
  q.textContent = message;
  var b = document.createElement("button"); b.textContent = btnLabel;
  b.style.cssText = "width:100%;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.88rem;font-weight:800;cursor:pointer;";
  b.addEventListener("click", function(){ o.m.remove(); if (onNext) onNext(); });
  o.box.appendChild(q); o.box.appendChild(b);
}
var _collecteSentimentsFaits = false; // build 603
function collecterWizard() {
  var hasRepasAlcool = _repasEnSessions && _repasEnSessions.some(function(r){ return r.alcoolG > 0; });
  if (session.length === 0 && !hasRepasAlcool) { alert("Ajoutez au moins une consommation avant d'enregistrer."); return; }
  var now = nowDecimal();
  if (session.some(function(c){ return c.heureDecimal > now; })) {
    alert("Impossible d'enregistrer tant qu'il y a des consommations futures.\nAttendez que toutes les heures soient passées.");
    return;
  }
  _collecteExtras = [];
  if (_collecteSentimentsFaits) { _wizApresSentiments(); return; } // build 603 : sentiments déjà saisis
  _wizConfirm("Voulez-vous enregistrer vos sentiments ?",
    function(){ ouvrirSentiments(function(){ _collecteSentimentsFaits = true; _wizApresSentiments(); }); },
    function(){ _collecteSentimentsFaits = true; _wizApresSentiments(); });
}
function _wizApresSentiments() {
  _wizConfirm("Avez-vous respecté le programme ?",
    function(){ saveToJournal(_collecteExtras, true); },
    _wizAjuster);
}
function _wizAjuster() {
  // build 603 : "Modifier" ferme le wizard pour laisser éditer (sentiments conservés)
  var o = _wizOverlay();
  var q = document.createElement("div");
  q.style.cssText = "font-size:.9rem;font-weight:700;color:var(--text);line-height:1.5;margin-bottom:8px;";
  q.textContent = "Souhaitez-vous modifier vos consommations ?";
  var sub = document.createElement("div");
  sub.style.cssText = "font-size:.74rem;color:var(--muted);line-height:1.5;margin-bottom:16px;";
  sub.textContent = "Modifier ferme cette fenêtre pour vous laisser ajuster vos consommations avec le crayon. Vos sentiments sont conservés : relancez Collecter quand vous avez terminé.";
  var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;";
  var bMod = document.createElement("button"); bMod.textContent = "Modifier";
  bMod.style.cssText = "flex:1;padding:11px;background:var(--cream);color:var(--wine);border:1.5px solid var(--wine);border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;";
  bMod.addEventListener("click", function(){ o.m.remove(); });
  var bCont = document.createElement("button"); bCont.textContent = "Continuer";
  bCont.style.cssText = "flex:1;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;";
  bCont.addEventListener("click", function(){ o.m.remove(); _wizAutreChose(); });
  row.appendChild(bMod); row.appendChild(bCont);
  o.box.appendChild(q); o.box.appendChild(sub); o.box.appendChild(row);
}
function _wizAutreChose() {
  _wizConfirm("Avez-vous consommé autre chose ?", _wizFormExtra, _wizResume);
}
function _wizFormExtra() {
  var o = _wizOverlay();
  var sel = { idx: null };
  var html = '<div style="font-size:1rem;font-weight:800;color:var(--wine);margin-bottom:4px;">Autre consommation</div>'
    + '<div style="font-size:.72rem;color:var(--muted);margin-bottom:12px;">Choisissez la boisson, la durée réelle et la quantité.</div>'
    + '<div id="wizDrinks" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;max-height:170px;overflow:auto;">';
  boissons.forEach(function(b, i){
    if (b.autre || b.degre <= 0) return;
    html += '<button data-i="' + i + '" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:9px;background:var(--cream);color:var(--text);font-size:.75rem;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;">' + b.nom + '</button>';
  });
  html += '</div>'
    + '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:4px;">Durée réelle</div>'
    + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">'
    + '<input type="number" id="wizH" min="0" value="0" style="width:64px;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:Nunito,sans-serif;"><span style="font-size:.78rem;color:var(--muted);">h</span>'
    + '<input type="number" id="wizM" min="0" value="0" style="width:64px;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:Nunito,sans-serif;"><span style="font-size:.78rem;color:var(--muted);">min</span>'
    + '</div>'
    + '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:4px;">Quantité</div>'
    + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">'
    + '<input type="number" id="wizML" min="0" value="0" style="width:90px;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:Nunito,sans-serif;"><span style="font-size:.78rem;color:var(--muted);">mL</span>'
    + '</div>';
  o.box.innerHTML = html;
  var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;";
  var bAnn = document.createElement("button"); bAnn.textContent = "Annuler";
  bAnn.style.cssText = "flex:1;padding:11px;background:none;border:1.5px solid var(--border);border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;color:var(--muted);";
  bAnn.addEventListener("click", function(){ o.m.remove(); _wizResume(); });
  var bAdd = document.createElement("button"); bAdd.textContent = "\u2713 Ajouter";
  bAdd.style.cssText = "flex:2;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;";
  bAdd.addEventListener("click", function(){
    if (sel.idx === null) { alert("Choisissez une boisson."); return; }
    var ml = parseFloat(document.getElementById("wizML").value) || 0;
    if (ml <= 0) { alert("Indiquez la quantité en mL."); return; }
    var hh = parseInt(document.getElementById("wizH").value) || 0;
    var mm = parseInt(document.getElementById("wizM").value) || 0;
    var b = boissons[sel.idx];
    _collecteExtras.push({ boissonIdx: sel.idx, nom: b.nom, degre: b.degre, ml: ml, dureeMin: hh * 60 + mm });
    o.m.remove();
    _wizConfirm("Est-ce tout ?", _wizResume, _wizFormExtra);
  });
  row.appendChild(bAnn); row.appendChild(bAdd);
  o.box.appendChild(row);
  o.box.querySelectorAll("#wizDrinks button").forEach(function(btn){
    btn.addEventListener("click", function(){
      sel.idx = parseInt(btn.getAttribute("data-i"));
      o.box.querySelectorAll("#wizDrinks button").forEach(function(x){ x.style.background = "var(--cream)"; x.style.color = "var(--text)"; x.style.borderColor = "var(--border)"; });
      btn.style.background = "var(--wine)"; btn.style.color = "#fff"; btn.style.borderColor = "var(--wine)";
    });
  });
}
function _wizResume() {
  var o = _wizOverlay();
  var html = '<div style="font-size:1rem;font-weight:800;color:var(--wine);margin-bottom:12px;">Résumé</div>'
    + '<div style="font-size:.78rem;color:var(--text);line-height:1.7;margin-bottom:14px;">';
  var seen = {};
  var lignes = 0;
  session.forEach(function(c){
    if (c.gorgeeId) {
      if (seen[c.gorgeeId]) return; seen[c.gorgeeId] = true;
      var seq = session.filter(function(x){ return x.gorgeeId === c.gorgeeId; });
      var vt = seq.reduce(function(s2, x){ return s2 + (x.vol||0); }, 0);
      html += "\u2022 " + boissons[c.boissonIdx].nom + " \u2014 " + vt + " mL<br>"; lignes++;
    } else { html += "\u2022 " + boissons[c.boissonIdx].nom + " \u2014 " + c.vol + " mL<br>"; lignes++; }
  });
  if (lignes) html = html.replace("<div style=\"font-size:.78rem;color:var(--text);line-height:1.7;margin-bottom:14px;\">",
    "<div style=\"font-size:.78rem;color:var(--text);line-height:1.7;margin-bottom:14px;\"><div style=\"font-weight:700;margin-bottom:4px;\">Consommations planifiées :</div>");
  if (_collecteExtras.length) {
    html += '<div style="font-weight:700;margin:8px 0 4px;">Autres consommations réelles :</div>';
    _collecteExtras.forEach(function(e){
      var alc = (e.ml * e.degre / 100 * 0.789).toFixed(1);
      html += "\u2022 " + e.nom + " \u2014 " + e.ml + " mL, " + e.dureeMin + " min (~" + alc + " g alcool)<br>";
    });
  }
  html += "</div>";
  o.box.innerHTML = html;
  var row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;";
  var bMod = document.createElement("button"); bMod.textContent = "\u2190 Modifier";
  bMod.style.cssText = "flex:1;padding:11px;background:var(--cream);color:var(--wine);border:1.5px solid var(--wine);border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;";
  bMod.addEventListener("click", function(){ o.m.remove(); _wizAutreChose(); });
  var bSave = document.createElement("button"); bSave.textContent = "\u2713 Enregistrer";
  bSave.style.cssText = "flex:2;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;";
  bSave.addEventListener("click", function(){ o.m.remove(); saveToJournal(_collecteExtras, true); });
  row.appendChild(bMod); row.appendChild(bSave);
  o.box.appendChild(row);
}

// build 610 : synthèse d'une liste de consommations — les gorgées d'une même séquence
// (gorgeeId) sont regroupées en une ligne unique de type carte, au lieu d'être listées
// une par une. Les consommations isolées gardent le format "Nom (heure, volmL)".
function _synthConsosStr(list) {
  var order = [], grps = {};
  (list || []).forEach(function(c){
    var key = c.gorgeeId || ('solo_' + c.id);
    if (!grps[key]) { grps[key] = []; order.push(key); }
    grps[key].push(c);
  });
  return order.map(function(key){
    var g = grps[key], c0 = g[0], bd = boissons[c0.boissonIdx];
    var nom = bd ? bd.nom : "Boisson";
    var deg = bd ? (bd.autre ? (c0.degreCustom||0) : bd.degre) : 0;
    var nomDeg = nom + (deg > 0 ? " " + deg + "\u00b0" : "");
    if (g.length > 1) {
      var volT = g.reduce(function(s,o){ return s + (o.vol||0); }, 0);
      var esp  = Math.round((g[1].heureDecimal - g[0].heureDecimal) * 60);
      return nomDeg + " \u00b7 " + g[0].heure + " \u2192 " + g[g.length-1].heure
           + " \u00b7 " + g.length + " gorg\u00e9es de " + c0.vol + " mL \u00b7 toutes les "
           + esp + " min \u00b7 " + volT + " mL";
    }
    return nomDeg + " (" + c0.heure + ", " + c0.vol + "mL)";
  }).join(' | ');
}
function saveToJournal(extras, sansConfirm) {
  var hasRepasAlcoolSave = _repasEnSessions && _repasEnSessions.some(function(r){ return r.alcoolG > 0; });
  if (session.length === 0 && !hasRepasAlcoolSave) { alert('Ajoutez au moins une consommation avant d\'enregistrer.'); return; }
  const now2 = nowDecimal();
  if (session.some(c => c.heureDecimal > now2)) {
    alert('Impossible d\'inscrire dans le journal tant qu\'il y a des consommations futures.\nAttendez que toutes les heures soient passées.');
    return;
  }
  if (!sansConfirm && !confirm('Je vais inscrire ces consommations dans votre journal de bord.\nElles vont être supprimées du panneau Mes consommations.\n\nCliquez sur Annuler si vous souhaitez encore les modifier.\n\nConfirmer ?')) return;
  const poids  = getPoidsKg() || 0;
  const muscle = parseFloat(document.getElementById('muscle').value) || 10;
  const taux   = parseFloat(document.getElementById('resultVal').textContent) || 0;
  const seuilBari = getSeuilBari();
  const {cf, ef} = getChirFactors();
  const coeff = genre === 'homme' ? 0.68 : 0.55;
  const elim  = genre === 'homme' ? 0.12 : 0.10;
  const coeffAjuste = coeff * (1 + 0.3 * (muscle / poids)) * cf;
  const elimAjuste  = elim * ef;
  const mgL = taux * 0.5;

  const totalAlcool = session.reduce((sum, c) => {
    const bd = boissons[c.boissonIdx];
    const deg = bd.autre ? (c.degreCustom||0) : bd.degre;
    const af = c.alimentaire==='jeun' ? 1.15 : 1.0;
    return sum + c.vol * c.nbVerres * (deg/100) * 0.789 * af;
  }, 0) + _repasEnSessions.reduce((sum, r) => sum + (r.alcoolG||0), 0)
    + (extras||[]).reduce((s2,e) => s2 + e.ml * (e.degre/100) * 0.789, 0); // build 602 : extras réels
  const repasStr = _repasEnSessions.filter(r => r.alcoolG > 0)
    .map(r => '🍽️ ' + (r.nom || 'Prise alimentaire') + ' (' + r.heureStr + ', ~' + r.alcoolG + 'g alcool)').join(' | ');
  const extrasStr = (extras||[]).map(function(e){ return e.nom + ' (réel, ' + e.dureeMin + 'min, ' + e.ml + 'mL, ~' + (e.ml*e.degre/100*0.789).toFixed(1) + 'g)'; }).join(' | ');
  // build 610 : synthèse par séquence de dégustation (au lieu de lister chaque gorgée).
  const consosStr = [_synthConsosStr(session), repasStr, extrasStr]
    .filter(s => s).join(' | ');

  const _jours = {};
  session.forEach(function(c){ if (c.jour) _jours[c.jour] = 1; });
  (_repasEnSessions||[]).forEach(function(r){ if (r.jour) _jours[r.jour] = 1; });
  const _joursStr = Object.keys(_jours).sort().map(_jourLabel).join(' | ');
  const entry = {
    date:            new Date().toLocaleString('fr-FR'),
    jour_consommation: _joursStr, // build 604 : jour(s) réel(s) des consommations
    nb_consommations: session.length + ((extras&&extras.length)||0),
    consommations:   consosStr,
    poids_kg:        poids,
    genre:           genre,
    masse_musc_kg:   muscle,
    chirurgie:       chir || '—',
    temps_postop:    postOp || '—',
    alcool_pur_g:    totalAlcool.toFixed(2),
    coeff_ajuste:    coeffAjuste.toFixed(4),
    elimination:     elimAjuste.toFixed(3),
    taux_actuel_gL:  taux.toFixed(3),
    taux_mgL:        mgL.toFixed(3),
    seuil_bari_gL:   seuilBari,
    depasse_seuil:   taux >= seuilBari ? 'OUI' : 'NON',
    contexte:        document.getElementById('contexteSession').value || '',
    note:            (document.getElementById('noteJournal').value || '').trim(),
    sentiments_pourquoi: _sentimentsData && _sentimentsData.pourquoi.length
      ? _sentimentsData.pourquoi.map(function(id){ var o=_SENTIMENTS_OPTS.pourquoi.find(function(x){return x.id===id;}); return o?o.label:id; }).join(' | ')
      : '',
    sentiments_pendant: _sentimentsData && _sentimentsData.pendant.length
      ? _sentimentsData.pendant.map(function(id){ var o=_SENTIMENTS_OPTS.pendant.find(function(x){return x.id===id;}); return o?o.label:id; }).join(' | ')
      : '',
    sentiments_apres: _sentimentsData && _sentimentsData.apres.length
      ? _sentimentsData.apres.map(function(id){ var o=_SENTIMENTS_OPTS.apres.find(function(x){return x.id===id;}); return o?o.label:id; }).join(' | ')
      : ''
  };
  document.getElementById('noteJournal').value = '';
  // Réinitialiser les sentiments après collecte
  _sentimentsData = { pourquoi: [], pendant: [], apres: [] };
  var _bs = document.getElementById('btnSentiments');
  if (_bs) { _bs.textContent = '\ud83d\udcad Mes sentiments'; _bs.style.background = 'var(--cream)'; _bs.style.color = 'var(--wine)'; _bs.style.border = '1.5px solid var(--wine)'; }
  document.getElementById('contexteSession').value = '';
  var _nl = document.getElementById('noteJournal'); if (_nl) { _nl.style.display = 'none'; _nl.value = ''; }

  const journal = getJournal();
  journal.push(entry);
  try { localStorage.setItem(LS_JOURNAL, JSON.stringify(journal)); } catch(e) {}
  updateJournalCount();

  if (navigator.vibrate) navigator.vibrate(50);
  // Vider la session et le brouillon après journalisation
  session = [];
  _repasEnSessions = [];
  _collecteExtras = []; // build 602
  _collecteSentimentsFaits = false; // build 603
  try { localStorage.removeItem(LS_SESSION_TEMP); } catch(e) {}
  // Reset mode alcool fort après journalisation
  resetAlcoolFortMode();
  var cpwR = document.getElementById('cardPaysWarn'); if (cpwR) cpwR.remove();
  updatePaysDisplay(0); // cardPays visibility gérée dans updatePaysDisplay
  var awR = document.getElementById('alcoolFortWarn'); if (awR) awR.remove();
  renderSession();
  updateLegendeRepas();
  mettreAJourBandeau();
  document.getElementById('resultBox').style.display = 'none';
  // build 570 : consoCard toujours visible — on ne le cache plus
  const cw2 = document.getElementById('chartWrap');
  if (cw2) cw2.style.display = 'none';
  updateProgress();
  // build 568 : message de confirmation discret (style Poids/Genre)
  var _toastId = 'journalToast';
  var _existToast = document.getElementById(_toastId); if (_existToast) _existToast.remove();
  var _toast = document.createElement('div');
  _toast.id = _toastId;
  _toast.style.cssText = 'text-align:center;font-size:.78rem;font-weight:700;color:#155724;'
    + 'background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;'
    + 'padding:8px 12px;margin-top:6px;animation:fadeIn .3s ease;';
  _toast.textContent = '✅ Données sauvées — consommations effacées.';
  var _btnJournal = document.getElementById('btnCollecter');
  if (_btnJournal && _btnJournal.parentNode) _btnJournal.parentNode.insertBefore(_toast, _btnJournal.nextSibling);
  setTimeout(function() { var t = document.getElementById(_toastId); if (t) t.remove(); }, 4000);
  // build 581 : refresh historique si dashCard visible
  var _dash = document.getElementById('dashCard');
  if (_dash && _dash.style.display !== 'none') { if (typeof renderDash === 'function') renderDash(); }
}

function buildCsv(journal) {
  const headers = [
    'Date','Note','Contexte','Sentiments Pourquoi','Sentiments Pendant','Sentiments Après',
    'Boisson','Catégorie','Degré (°)','Volume (mL)','Nb verres',
    'Alimentaire','Facteur alim.','Poids (kg)','Genre','Masse musc. (kg)',
    'Chirurgie','Temps post-op','Temps écoulé (h)',
    'Alcool pur (g)','Coeff. Widmark','Coeff. ajusté','Élimination (g/L/h)',
    'Taux pic (g/L)','Taux actuel (g/L)','Taux (mg/L expiré)',
    'Seuil bari. (g/L)','Retour 0 (h)','Dépassement seuil'
  ];
  const rows = journal.map(e => [
    e.date, e.note||'', e.contexte||'',
    e.sentiments_pourquoi||'', e.sentiments_pendant||'', e.sentiments_apres||'',
    e.boisson, e.categorie, e.degre, e.volume_mL, e.nb_verres,
    e.alimentaire, e.facteur_alim, e.poids_kg, e.genre, e.masse_musc_kg,
    e.chirurgie, e.temps_postop, e.temps_ecoule_h,
    e.alcool_pur_g, e.coeff_widmark, e.coeff_ajuste, e.elimination,
    e.taux_pic_gL, e.taux_actuel_gL, e.taux_mgL,
    e.seuil_bari_gL, e.temps_retour_h, e.depasse_seuil
  ]);
  return [headers, ...rows]
    .map(r => r.map(v => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"').join(','))
    .join('\n');
}

function exporterJournal() {
  var journal = getJournal();
  if (journal.length === 0) { alert('Le journal est vide.'); return; }
  var csv = buildCsv(journal);
  var filename = _journalFilename();
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  var n = journal.length;
  var msg = 'Votre journal a \u00e9t\u00e9 t\u00e9l\u00e9charg\u00e9 !\n\n'
    + 'Fichier\u00a0: ' + filename + '\n'
    + 'Dossier\u00a0: T\u00e9l\u00e9chargements de votre appareil\n'
    + 'Contenu\u00a0: ' + n + ' entr\u00e9e' + (n > 1 ? 's' : '') + '\n\n'
    + 'Vous pouvez maintenant l\u2019envoyer par courriel \u00e0 votre \u00e9quipe de soins.';
  alert(msg);
}
function exportByMail() {
  const journal = getJournal();
  if (!journal.length) {
    alert('Le journal est vide. Enregistrez au moins une consommation avant d\'envoyer.');
    return;
  }
  if (journal.length > 20) {
    if (!confirm('Votre journal contient ' + journal.length + ' entrées.\n\nLes journaux longs peuvent être tronqués par votre client mail.\n\nPrivilégiez le téléchargement CSV pour les envoyer en pièce jointe.\n\nContinuer quand même par mail ?')) return;
  }
  const csv = buildCsv(journal);
  const subject = encodeURIComponent('Alcool Barialimites — Journal de bord');
  const body = encodeURIComponent(
    'Bonjour,\n\nVeuillez trouver ci-dessous mon journal de bord Alcool Barialimites (' + journal.length + ' entrée' + (journal.length > 1 ? 's' : '') + ').\n\n' +
    '=== DONNÉES CSV ===\n' + csv + '\n\n' +
    'Exporté le ' + new Date().toLocaleString('fr-FR') + '\n' +
    'Application : Alcool Barialimites v1.1'
  );
  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
}

function exportCsv() {
  const journal = getJournal();
  if (!journal.length) {
    alert('Le journal est vide. Enregistrez au moins une consommation avant de télécharger.');
    return;
  }
  const csv = buildCsv(journal);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = _journalFilename();
  a.click();
  URL.revokeObjectURL(url);
}

function clearJournal() {
  if (!confirm('Souhaitez-vous vider votre journal de bord ?\n\nCette action est irréversible.')) return;
  localStorage.removeItem(LS_JOURNAL);
  updateJournalCount();
  // Rafraîchir tout affichage déjà construit à partir de l'ancien journal (sinon il faut F5 pour le voir vidé)
  var dashCard = document.getElementById('dashCard');
  if (dashCard && dashCard.style.display !== 'none' && typeof renderDash === 'function') renderDash();
  var histModal = document.getElementById('historiqueModal');
  if (histModal) histModal.remove();
}

function updateJournalCount() {
  const j = getJournal();
  const el = document.getElementById('journalCount');
  if (el) el.textContent = j.length === 0 ? 'Journal vide' : j.length + ' entrée' + (j.length > 1 ? 's' : '') + ' enregistrée' + (j.length > 1 ? 's' : '');
  // build 584 : btnHistorique et btnExporterJournal restent actifs en permanence.
  // Le journal vide est gere par un message dans la fonction appelee, pas par un grisage.
  ['btnHistorique','btnExporterJournal'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.style.opacity = '1'; btn.style.pointerEvents = '';
  });
  // build 570 : seul Vider reste grise quand le journal est vide (action destructive sans objet)
  var _bv = document.getElementById('btnViderJournal');
  if (_bv) {
    if (j.length === 0) { _bv.style.opacity = '.4'; _bv.style.pointerEvents = 'none'; }
    else                { _bv.style.opacity = '1';  _bv.style.pointerEvents = ''; }
  }
}

function _updateBtnSentiments() {
  var btn = document.getElementById('btnSentiments');
  if (!btn) return;
  var now = nowDecimal();
  var hasFutur = session.some(function(c){ return c.heureDecimal > now; });
  if (hasFutur || session.length === 0) {
    btn.style.opacity = '.4'; btn.style.pointerEvents = 'none';
    btn.title = hasFutur ? 'Non disponible avec des consommations futures' : 'Aucune consommation';
  } else {
    btn.style.opacity = '1'; btn.style.pointerEvents = ''; btn.title = '';
  }
}

function mettreAJourBandeau() {}

// Fonctions conservées pour compatibilité (boutons supprimés)
function sauverPrevisionnel() {}
function effacerPrevisionnel() {}

function chargerPrevisionnel() {
  resetAlcoolFortMode(); // Toujours reset au chargement
  _repasEnSessions = []; // reset avant restauration
  // S'assurer que le panneau d'ajout est fermé
  var _ap = document.getElementById('ajoutPanel');
  if (_ap) _ap.style.display = 'none';
  var _btn = document.getElementById('btnAjouterBoisson');
  if (_btn) _btn.style.display = _cardOpen.cardConso ? 'flex' : 'none';

  try {
    const raw = localStorage.getItem(LS_SESSION_TEMP);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;
    if (Array.isArray(data)) {
      if (data.length === 0) return;
      session = data;
    } else {
      session = data.session || [];
      _repasEnSessions = data.repas || [];
      if (session.length === 0 && _repasEnSessions.length === 0) return;
    }
    sessionNextId = Math.max(...session.map(c => c.id)) + 1;

    const now = nowDecimal();
    const passees = session.filter(c => c.heureDecimal <= now);
    const futures = session.filter(c => c.heureDecimal > now);

    // Rendre les cartes AVANT le message
    var passeesAlcool = passees.filter(function(c){ return (boissons[c.boissonIdx]||{}).degre > 0; });
    if (passeesAlcool.length > 0 && futures.length === 0) _brouillonMode = true;
    renderSession();
    mettreAJourBandeau();
    if (session.length > 0) calcul(); // Afficher le résumé même si tout est futur
    updateProgress();

    // Message après renderSession (sessionList existe)
    if (passees.length > 0 && futures.length === 0) {
      showBrouillonMessage(
        'Vous avez ' + session.length + ' consommation' + (session.length > 1 ? 's' : '') +
        ' non journalisée' + (session.length > 1 ? 's' : '') + '. Que voulez-vous faire ?',
        'journal'
      );
    } else {
      showBrouillonMessage('Je recharge vos consommations (' + session.length + ' entrée' + (session.length > 1 ? 's' : '') + ').', 'info');
    }
  } catch(e) {}
  updateLegendeRepas();
}
function showBrouillonMessage(texte, type) {
  const existing = document.getElementById('brouillonMsg');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'brouillonMsg';
  div.style.cssText = 'margin:8px 0;padding:10px 14px;border-radius:12px;font-size:.78rem;font-weight:700;line-height:1.6;' +
    (type === 'journal' ? 'background:#fff3cd;border-left:3px solid #e67e22;color:#7a4000;' : 'background:var(--info-bg);border-left:3px solid var(--info-border);color:var(--info-text);');
  div.innerHTML = texte;
  if (type === 'journal') {
    div.innerHTML += '<div style="display:flex;gap:8px;margin-top:8px;">' +
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' +
      '<button onclick="_brouillonMode=false; renderSession(); document.getElementById(\'brouillonMsg\').remove()" style="flex:1;min-width:80px;padding:6px;background:none;border:1px solid #e67e22;color:#7a4000;border-radius:8px;font-family:Nunito,sans-serif;font-size:.70rem;font-weight:700;cursor:pointer;">↩ Garder en cours</button>' +
      '<button onclick="journaliserEtEffacer()" style="flex:1;min-width:80px;padding:6px;background:#e67e22;color:#fff;border:none;border-radius:8px;font-family:Nunito,sans-serif;font-size:.70rem;font-weight:700;cursor:pointer;">📓 Collecter et effacer</button>' +
      '<button onclick="effacerSansJournaliser()" style="flex:1;min-width:80px;padding:6px;background:none;border:1px solid #c0392b;color:#c0392b;border-radius:8px;font-family:Nunito,sans-serif;font-size:.70rem;font-weight:700;cursor:pointer;">🗑 Effacer</button>' +
      '</div>';
  } else {
    setTimeout(() => { if (div.parentNode) div.remove(); }, 4000);
  }
  // Insérer avant sessionList
  const sl = document.getElementById('sessionList');
  if (sl && sl.parentNode) sl.parentNode.insertBefore(div, sl);
}

function effacerSansJournaliser() {
  if (!confirm('Effacer toutes les consommations sans les journaliser ?')) return;
  session = [];
  _repasEnSessions = [];
  updateLegendeRepas();
  try { localStorage.removeItem(LS_SESSION_TEMP); } catch(e) {}
  const msg = document.getElementById('brouillonMsg');
  if (msg) msg.remove();
  renderSession();
  mettreAJourBandeau();
  document.getElementById('resultBox').style.display = 'none';
  // build 570 : consoCard toujours visible
  const cw = document.getElementById('chartWrap');
  if (cw) cw.style.display = 'none';
  updateProgress();
  // Afficher le tableau de bord si le journal contient des entrées
  ouvrirTableauBord();
}
function journaliserEtEffacer() {
  // Journaliser automatiquement puis vider le panneau
  const now = nowDecimal();
  const passees = session.filter(c => c.heureDecimal <= now);
  if (passees.length > 0) {
    const journal = getJournal();
    const seuilBari = getSeuilBari();
    const poids = getPoidsKg() || 0;
    const muscle = parseFloat(document.getElementById('muscle').value) || 10;
    const coeff = genre === 'homme' ? 0.68 : 0.55;
    const {cf, ef} = getChirFactors();
    const coeffAjuste = coeff * (1 + 0.3 * (muscle / poids)) * cf;
    const elimAjuste = (genre === 'homme' ? 0.12 : 0.10) * ef;
    const totalAlcool = passees.reduce((sum, c) => {
      const b = boissons[c.boissonIdx], deg = b.autre ? (c.degreCustom||0) : b.degre;
      return sum + c.vol * c.nbVerres * (deg/100) * 0.789 * (c.alimentaire==='jeun'?1.15:1.0);
    }, 0);
    const taux0 = totalAlcool / (poids * coeffAjuste * 1000) * 1000;
    const mgL = taux0 * 0.5;
    const entry = {
      date: new Date().toLocaleString('fr-FR'),
      nb_consommations: passees.length,
      consommations: _synthConsosStr(passees),
      poids_kg: poids, genre, masse_musc_kg: muscle,
      chirurgie: chir || '—', temps_postop: postOp || '—',
      alcool_pur_g: totalAlcool.toFixed(2),
      coeff_ajuste: coeffAjuste.toFixed(4), elimination: elimAjuste.toFixed(3),
      taux_actuel_gL: taux0.toFixed(3), taux_mgL: mgL.toFixed(3),
      seuil_bari_gL: seuilBari, depasse_seuil: taux0 >= seuilBari ? 'OUI' : 'NON', note: ''
    };
    journal.push(entry);
    try { localStorage.setItem(LS_JOURNAL, JSON.stringify(journal)); } catch(e) {}
    updateJournalCount();
  }
  session = [];
  _repasEnSessions = [];
  updateLegendeRepas();
  try { localStorage.removeItem(LS_SESSION_TEMP); } catch(e) {}
  const msg = document.getElementById('brouillonMsg');
  if (msg) msg.remove();
  renderSession();
  mettreAJourBandeau();
  document.getElementById('resultBox').style.display = 'none';
  // build 570 : consoCard toujours visible
  const cw = document.getElementById('chartWrap');
  if (cw) cw.style.display = 'none';
  updateProgress();
  // Afficher le tableau de bord si le journal contient des entrées
  ouvrirTableauBord();
}

// ── Historique journal ────────────────────────────────────────────────────────
function contexteIcone(c) {
  const icones = {
    'Repas de famille': '🍽️',
    'Invitation / Soirée chez des amis': '🎉',
    'Restaurant': '🍷',
    'Pot au travail / Networking': '💼',
    'Voyage / Vacances': '✈️',
    'Fête / événement particulier': '🥳',
    'Apéritif détente': '🌿',
    'Pour accompagner une activité (TV, jeu, etc.)': '📺',
    'Pour m\'aider à m\'endormir': '😴',
    'Je suis seul et j\'en ai envie': '🛋️',
    'Je suis seul, j\'en ai besoin': '😔',
    'Sans motif spécifique': '😐',
    'Autre': '📝'
  };
  return icones[c] || '';
}

function afficherHistorique() {
  const journal = getJournal();
  const modal = document.createElement('div');
  modal.id = 'historiqueModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:6000;display:flex;align-items:flex-end;justify-content:center;padding:0 8px 16px;';
  let content2 = '';
  if (journal.length === 0) {
    content2 = '<p style="text-align:center;color:var(--muted);padding:20px;">Aucune entrée dans le journal.</p>';
  } else {
    content2 = journal.slice().reverse().map(e => {
      const depasse = e.depasse_seuil === 'OUI';
      return '<div style="padding:8px 10px;border-radius:10px;margin-bottom:6px;background:var(--cream);border-left:3px solid '+(depasse?'#c0392b':'#28a745')+';font-size:.75rem;">' +
        '<div style="font-weight:800;color:var(--text);">' + e.date + '</div>' +
        '<div style="color:var(--muted);margin-top:2px;">' + (e.consommations||e.boisson||'—') + '</div>' +
        (e.contexte ? '<div style="display:inline-block;margin-top:3px;padding:2px 8px;border-radius:6px;background:var(--info-bg);color:var(--info-text);font-size:.68rem;font-weight:700;">' + contexteIcone(e.contexte) + ' ' + e.contexte + '</div>' : '') +
        '<div style="font-weight:700;color:'+(depasse?'#c0392b':'#28a745')+';">' +
          (depasse ? '⚠️ ' : '✅ ') + (e.alcool_pur_g||'0') + ' g d\'alcool pur' +
          (e.note ? ' — ' + e.note : '') +
        '</div></div>';
    }).join('');
  }
  modal.innerHTML = '<div style="background:var(--card-bg);border-radius:18px 18px 0 0;padding:20px 16px 16px;width:100%;max-width:480px;max-height:75vh;overflow:auto;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div class="section-title" style="margin-bottom:0;">📋 Historique (' + journal.length + ' entrée' + (journal.length>1?'s':'') + ')</div>' +
      '<button onclick="document.getElementById(\'historiqueModal\').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted);" aria-label="Fermer">✕</button>' +
    '</div>' + content2 + '</div>';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

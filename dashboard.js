// Alcool Barialimites — dashboard.js
// Module 3 : Tableau de bord + stats + tendances (build 663, extrait de index.html)
// Note : _chartWindowOffset reste dans index.html (état de la courbe principale, sans rapport avec le tableau de bord malgré sa déclaration voisine dans le code d'origine).

// ── Tableau de bord ─────────────────────────────────────────────────────────
var _dashPeriode = 'semaine';
var _dashOffset = 0; // décalage en nombre de périodes

function ouvrirTableauBord() {
  // Afficher le bloc inline
  var card = document.getElementById('dashCard');
  if (card) { card.style.display='block'; renderDash(); }
}
function _ouvrirTableauBordModal_unused() {
  var journal = [];
  try { journal = JSON.parse(localStorage.getItem('bari_journal') || '[]'); } catch(e) {}
  if (journal.length === 0) { alert('Le journal est vide. Enregistrez d\'abord des consommations.'); return; }
  _dashOffset = 0;
  var ex = document.getElementById('dashModal'); if (ex) ex.remove();
  var modal = document.createElement('div');
  modal.id = 'dashModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9000;display:flex;align-items:center;justify-content:center;padding:12px;';
  modal.innerHTML = '<div style="background:var(--card-bg);border-radius:18px;padding:16px;max-width:500px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.4);">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
    + '<span style="font-size:1rem;font-weight:800;color:var(--wine);">📊 Tableau de bord</span>'
    + '<button onclick="fermerDash()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted);">✕</button>'
    + '</div>'
    + '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">'
    + ['jour','semaine','mois','trimestre','an'].map(function(p){
        return '<button onclick="setDashPeriode(\''+ p +'\')" id="dashBtn_'+ p +'"'
          + ' style="padding:5px 10px;border-radius:8px;border:1.5px solid var(--wine);'
          + (p==='semaine'?'background:var(--wine);color:#fff;':'background:none;color:var(--wine);')
          + 'font-family:Nunito,sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;">'+ p.charAt(0).toUpperCase()+p.slice(1) +'</button>';
      }).join('')
    + '</div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
    + '<button onclick="dashNav(-1)" style="padding:4px 12px;border-radius:8px;border:1px solid var(--border);background:none;cursor:pointer;font-size:1rem;">&#8592;</button>'
    + '<span id="dashPeriodeLabel" style="font-size:.85rem;font-weight:700;color:var(--text);"></span>'
    + '<button onclick="dashNav(1)" style="padding:4px 12px;border-radius:8px;border:1px solid var(--border);background:none;cursor:pointer;font-size:1rem;">&#8594;</button>'
    + '</div>'
    + '<canvas id="dashCanvas" style="width:100%;max-height:260px;"></canvas>'
    + '<div id="dashStats" style="margin-top:12px;font-size:.78rem;color:var(--muted);"></div>'
    + '</div>';
  document.body.appendChild(modal);
  renderDash();
}

function fermerDash() { var m=document.getElementById('dashModal'); if(m) m.remove(); }

function setDashPeriode(p) {
  _dashPeriode = p; _dashOffset = 0;
  ['jour','semaine','mois','trimestre','an'].forEach(function(x){
    var b=document.getElementById('dashBtn_'+x);
    if(!b) return;
    b.style.background = x===p ? 'var(--wine)' : 'none';
    b.style.color = x===p ? '#fff' : 'var(--wine)';
  });
  renderDash();
}

function dashNav(dir) { _dashOffset += dir; renderDash(); }

function renderDash() {
  var journal = [];
  try { journal = JSON.parse(localStorage.getItem('bari_journal') || '[]'); } catch(e) {}
  var now = new Date();
  var debut, fin;
  var buckets = [], bucketLabels = [];

  if (_dashPeriode === 'jour') {
    var d = new Date(now); d.setDate(d.getDate() + _dashOffset); d.setHours(0,0,0,0);
    debut=new Date(d); fin=new Date(d); fin.setDate(fin.getDate()+1);
    for(var h=0;h<24;h++){buckets.push(0);bucketLabels.push(h+'h');}
    journal.forEach(function(e){
      var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
      buckets[dt.getHours()]+=entryAlcool(e);
    });
    document.getElementById('dashPeriodeLabel').textContent = fmtDate(d);
  } else if (_dashPeriode === 'semaine') {
    var mon = new Date(now);
    mon.setDate(mon.getDate() - ((mon.getDay()+6)%7) + _dashOffset*7);
    mon.setHours(0,0,0,0);
    var jours=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    for(var j=0;j<7;j++){buckets.push(0);var dj=new Date(mon);dj.setDate(dj.getDate()+j);bucketLabels.push(jours[j]+' '+dj.getDate()+'/'+(dj.getMonth()+1));}
    debut=new Date(mon); fin=new Date(mon); fin.setDate(fin.getDate()+7);
    journal.forEach(function(e){
      var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
      var j2=((dt.getDay()+6)%7); buckets[j2]+=entryAlcool(e);
    });
    document.getElementById('dashPeriodeLabel').textContent = 'Sem. du '+fmtDate(mon);
  } else if (_dashPeriode === 'mois') {
    var mois=new Date(now.getFullYear(),now.getMonth()+_dashOffset,1);
    var nbj=new Date(mois.getFullYear(),mois.getMonth()+1,0).getDate();
    debut=mois; fin=new Date(mois.getFullYear(),mois.getMonth()+1,1);
    for(var jj=1;jj<=nbj;jj++){buckets.push(0);bucketLabels.push(String(jj));}
    journal.forEach(function(e){
      var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
      buckets[dt.getDate()-1]+=entryAlcool(e);
    });
    var moisNoms=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    document.getElementById('dashPeriodeLabel').textContent = moisNoms[mois.getMonth()]+' '+mois.getFullYear();
  } else if (_dashPeriode === 'trimestre') {
    var q=Math.floor(now.getMonth()/3)+_dashOffset;
    var yr=now.getFullYear()+Math.floor(q/4); q=((q%4)+4)%4;
    debut=new Date(yr,q*3,1); fin=new Date(yr,q*3+3,1);
    for(var m=0;m<3;m++){buckets.push(0);var moisNoms2=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];bucketLabels.push(moisNoms2[q*3+m]);}
    journal.forEach(function(e){
      var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
      var m2=dt.getMonth()-q*3; if(m2>=0&&m2<3) buckets[m2]+=entryAlcool(e);
    });
    document.getElementById('dashPeriodeLabel').textContent = 'T'+(q+1)+' '+yr;
  } else {
    var an=now.getFullYear()+_dashOffset;
    debut=new Date(an,0,1); fin=new Date(an+1,0,1);
    var moisNoms3=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    for(var m3=0;m3<12;m3++){buckets.push(0);bucketLabels.push(moisNoms3[m3]);}
    journal.forEach(function(e){
      var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
      buckets[dt.getMonth()]+=entryAlcool(e);
    });
    document.getElementById('dashPeriodeLabel').textContent = String(an);
  }

  // ── Dessin graphique ─────────────────────────────────────────────
  var canvas=document.getElementById('dashCanvas');
  if(!canvas) return;
  if(window._dashChart) { window._dashChart.destroy(); }
  window._dashChart = new Chart(canvas, {
    type:'bar',
    data:{
      labels:bucketLabels,
      datasets:[{label:'Alcool pur (g)',data:buckets,
        backgroundColor:'rgba(139,26,26,0.6)',borderColor:'#8B1A1A',borderWidth:1,borderRadius:4}]
    },
    options:{responsive:true,animation:{duration:200},
      plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){
        var g=Math.round(c.raw*10)/10;
        var verres=Math.round(g/12*10)/10;
        return g+' g \u2248 '+verres+' verre'+(verres!==1?'s':'')+' standard';
      }}}} ,
      scales:{x:{ticks:{font:{family:'Nunito',size:9},maxRotation:45}},
        y:{min:0,ticks:{font:{family:'Nunito',size:9},callback:function(v){return v+'g';}}}}
    }
  });

  // ── Stats enrichies ──────────────────────────────────────────────
  var total=buckets.reduce(function(a,b){return a+b;},0);
  var nonZero=buckets.filter(function(v){return v>0;}).length;
  var verresTotal=Math.round(total/12*10)/10;
  var stats=document.getElementById('dashStats');

  // Comptage des dépassements sur la période
  var nbDepasse=0, nbPeriode=0;
  journal.forEach(function(e){
    var dt=parseDate(entryDate(e)); if(!dt||dt<debut||dt>=fin) return;
    nbPeriode++;
    if((e['Dépassement seuil']||e.depasse_seuil)==='OUI') nbDepasse++;
  });

  var statsHtml = 'Total : <strong>'+Math.round(total*10)/10+' g</strong>'
    + ' \u2248 <strong>'+verresTotal+' verre'+(verresTotal!==1?'s':'')+' standard</strong>'
    + ' (1 verre = 12 g d\'alcool pur)'
    + ' &bull; '+nonZero+' période'+(nonZero>1?'s':'')+' avec consommation';

  if(nbDepasse>0) {
    statsHtml += '<br><span style="color:#c0392b;font-weight:700;">'
      +'\u26a0\ufe0f '+nbDepasse+' dépassement'+(nbDepasse>1?'s':'')+' du seuil bariatrique sur '+nbPeriode+' session'+(nbPeriode>1?'s':'')
      +'</span>';
  }
  if(stats) stats.innerHTML = statsHtml;

  // ── Analyse de tendance ──────────────────────────────────────────
  renderTendance(journal, now);
}

// ── Calcul et affichage des tendances ───────────────────────────────────────
function renderTendance(journal, now) {
  var el = document.getElementById('dashTendance');
  if (!el) return;

  // Minimum 6 entrées pour analyser
  if (journal.length < 6) { el.style.display='none'; return; }

  // Deux périodes de 8 semaines : récente vs précédente
  var ms8sem = 8 * 7 * 24 * 3600 * 1000;
  var debutRecent = new Date(now.getTime() - ms8sem);
  var debutPrev   = new Date(now.getTime() - 2*ms8sem);

  var recent = [], prev = [];
  journal.forEach(function(e) {
    var dt = parseDate(entryDate(e)); if (!dt) return;
    if (dt >= debutRecent && dt <= now)   recent.push(e);
    else if (dt >= debutPrev && dt < debutRecent) prev.push(e);
  });

  if (recent.length < 2 || prev.length < 2) { el.style.display='none'; return; }

  // Métriques : alcool pur total, fréquence, dépassements
  function metrics(entries, nbSemaines) {
    var totalG = 0, nbDep = 0;
    // Poids moyen pondéré si disponible
    var poidsVals = [];
    entries.forEach(function(e) {
      totalG += entryAlcool(e);
      if ((e['Dépassement seuil']||e.depasse_seuil)==='OUI') nbDep++;
      var p = parseFloat(e['Poids (kg)'] || e.poids_kg || 0);
      if (p > 0) poidsVals.push(p);
    });
    // Alcool normalisé par semaine (tenir compte du poids si variable)
    var poidsMoyen = poidsVals.length ? poidsVals.reduce(function(a,b){return a+b;},0)/poidsVals.length : 0;
    var gParSem = totalG / nbSemaines;
    return { total:totalG, gParSem:gParSem, freq:entries.length/nbSemaines,
             pctDep:nbDep/entries.length, poidsMoyen:poidsMoyen, nb:entries.length };
  }

  var mR = metrics(recent, 8);
  var mP = metrics(prev, 8);

  // Delta quantité normalisé par poids si les deux ont un poids
  var deltaG;
  if (mR.poidsMoyen > 0 && mP.poidsMoyen > 0 && Math.abs(mR.poidsMoyen - mP.poidsMoyen) > 1) {
    // Normaliser : g/semaine / poids → concentration relative
    var normR = mR.gParSem / mR.poidsMoyen;
    var normP = mP.gParSem / mP.poidsMoyen;
    deltaG = normP > 0 ? (normR - normP) / normP : 0;
  } else {
    deltaG = mP.gParSem > 0 ? (mR.gParSem - mP.gParSem) / mP.gParSem : 0;
  }
  var deltaFreq = mP.freq > 0 ? (mR.freq - mP.freq) / mP.freq : 0;

  // Flèche de tendance
  function fleche(delta) {
    if (delta >= 0.15) return { sym:'\u2197', label:'En hausse', color:'#c0392b' };
    if (delta <= -0.15) return { sym:'\u2198', label:'En baisse', color:'#27ae60' };
    return { sym:'\u2192', label:'Stable', color:'#e67e22' };
  }
  var tQ = fleche(deltaG);
  var tF = fleche(deltaFreq);

  // Poids : note si le poids a changé
  var poidsNote = '';
  if (mR.poidsMoyen > 0 && mP.poidsMoyen > 0 && Math.abs(mR.poidsMoyen - mP.poidsMoyen) > 0.5) {
    var diff = Math.round((mR.poidsMoyen - mP.poidsMoyen)*10)/10;
    poidsNote = '<div style="font-size:.72rem;color:var(--muted);margin-top:4px;">'
      +(diff<0?'\u2193':'\u2191')+' Poids moyen : '+diff+' kg entre les deux périodes — calcul normalisé</div>';
  } else if (mR.poidsMoyen === 0) {
    poidsNote = '<div style="font-size:.72rem;color:var(--muted);margin-top:4px;">Les calculs utilisent le poids actuel.</div>';
  }

  var html = '<div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--cream);border:1px solid var(--border);">'
    + '<div style="font-size:.72rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">Tendance — 8 sem. récentes vs 8 sem. précédentes</div>'
    + '<div style="display:flex;gap:12px;flex-wrap:wrap;">'
    + '<div style="flex:1;min-width:100px;padding:8px 10px;border-radius:10px;background:var(--card-bg);border:1px solid var(--border);text-align:center;">'
    + '<div style="font-size:1.4rem;color:'+tQ.color+';">'+tQ.sym+'</div>'
    + '<div style="font-size:.72rem;font-weight:800;color:'+tQ.color+';">'+tQ.label+'</div>'
    + '<div style="font-size:.68rem;color:var(--muted);margin-top:2px;">Quantité</div>'
    + '<div style="font-size:.7rem;color:var(--text);font-weight:700;margin-top:2px;">'
    + Math.round(mR.gParSem*10)/10+' g/sem. vs '+Math.round(mP.gParSem*10)/10+' g/sem.'
    + '</div></div>'
    + '<div style="flex:1;min-width:100px;padding:8px 10px;border-radius:10px;background:var(--card-bg);border:1px solid var(--border);text-align:center;">'
    + '<div style="font-size:1.4rem;color:'+tF.color+';">'+tF.sym+'</div>'
    + '<div style="font-size:.72rem;font-weight:800;color:'+tF.color+';">'+tF.label+'</div>'
    + '<div style="font-size:.68rem;color:var(--muted);margin-top:2px;">Fréquence</div>'
    + '<div style="font-size:.7rem;color:var(--text);font-weight:700;margin-top:2px;">'
    + Math.round(mR.freq*10)/10+' sess/sem. vs '+Math.round(mP.freq*10)/10+' sess/sem.'
    + '</div></div>'
    + '<div style="flex:1;min-width:100px;padding:8px 10px;border-radius:10px;background:var(--card-bg);border:1px solid var(--border);text-align:center;">'
    + '<div style="font-size:1.4rem;color:'+(mR.pctDep>0.5?'#c0392b':'#27ae60')+';">'+(mR.pctDep>0.5?'\u26a0\ufe0f':'\u2713')+'</div>'
    + '<div style="font-size:.72rem;font-weight:800;color:'+(mR.pctDep>0.5?'#c0392b':'#27ae60')+';">'
    + Math.round(mR.pctDep*100)+'% dépassements</div>'
    + '<div style="font-size:.68rem;color:var(--muted);margin-top:2px;">Seuil bari.</div>'
    + '</div>'
    + '</div>'
    + poidsNote;

  // ── Alerte préoccupante ──────────────────────────────────────────
  var alerte = (deltaG >= 0.25 && mR.nb >= 3) || mR.pctDep > 0.5;
  if (alerte) {
    html += '<div id="dashAlerte" style="margin-top:10px;padding:12px 14px;border-radius:10px;'
      + 'background:#ffe5e5;border-left:4px solid #c0392b;color:#7a0000;">'
      + '<div style="font-size:.85rem;font-weight:800;margin-bottom:6px;">'
      + '\u26a0\ufe0f La hausse de votre consommation est pr\u00e9occupante. Consultez votre \u00e9quipe de soins.</div>'
      + '<div style="font-size:.80rem;line-height:1.6;margin-top:4px;">Utilisez le bouton <strong>💾 Télécharger le fichier CSV</strong> (journaux longs) ci-dessous pour envoyer votre consommation à votre équipe de soins et trouver des solutions avec eux.</div>'
      + '</div>';
  }

  html += '</div>';
  el.innerHTML = html;
  el.style.display = 'block';
}

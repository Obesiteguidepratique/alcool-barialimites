// Alcool Barialimites — alarmes ⏰ (module extrait d'index.html au build 684)
// Chargé par <script src="./alarmes.js"> AVANT le script principal ; dépend au moment de l'appel
// des globaux du script principal : session, boissons, _repasEnSessions, nowDecimal, updateLegende,
// showMiniPopupWithRisques. Les échanges SET_ALARMS / CLEAR_ALARMS restent gérés dans sw.js.
// Build 684 : testerAlarmeImmediately supprimée (aucun appelant, #diagResult inexistant).

// ── Alarmes ⏰ (β10, build 430) ──────────────────────────────────────────
// Demande la permission une seule fois, puis programme les alarmes dans le service worker.
// Sur iOS : nécessite app installée (PWA) + iOS 16.4+ + permission accordée.
var _alarmeTimers = [];

function demanderPermissionAlarme(callback) {
  if (!('Notification' in window)) { if (callback) callback(false); return; }
  if (Notification.permission === 'granted') { if (callback) callback(true); return; }
  if (Notification.permission === 'denied') { if (callback) callback(false); return; }
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    var m = document.createElement('div');
    m.id = 'iosNotifModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    m.innerHTML = '<div style="background:var(--card-bg);border-radius:18px;padding:22px 18px;max-width:340px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.5);">'
      + '<div style="font-size:1.1rem;font-weight:800;color:var(--wine);margin-bottom:12px;">📲 Alertes sur iPhone / iPad</div>'
      + '<div style="font-size:.83rem;color:var(--text);line-height:1.6;margin-bottom:14px;">Pour être alerté(e) lorsque votre heure est arrivée, deux conditions sont nécessaires :<br><br>'
      + '① <strong>L\'application doit être installée</strong> sur votre écran d\'accueil (via Safari → « Sur l\'écran d\'accueil »).<br><br>'
      + '② <strong>Accordez la permission</strong> qui va être demandée dans l\'instant.</div>'
      + '<div style="display:flex;gap:10px;">'
      + '<button onclick="document.getElementById(\'iosNotifModal\').remove();Notification.requestPermission().then(function(r){if(r===\'granted\'){'+
        'if(typeof _callback_notif===\'function\')_callback_notif(true);}else{if(typeof _callback_notif===\'function\')_callback_notif(false);}});" '
      + 'style="flex:1;padding:11px;background:var(--wine);color:#fff;border:none;border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;">Autoriser les alertes</button>'
      + '<button onclick="document.getElementById(\'iosNotifModal\').remove();if(typeof _callback_notif===\'function\')_callback_notif(false);" '
      + 'style="flex:0 0 auto;padding:11px 14px;background:none;border:1.5px solid var(--border);border-radius:10px;font-family:Nunito,sans-serif;font-size:.85rem;font-weight:700;cursor:pointer;color:var(--muted);">Plus tard</button>'
      + '</div></div>';
    window._callback_notif = callback;
    document.body.appendChild(m);
  } else {
    Notification.requestPermission().then(function(result) {
      if (callback) callback(result === 'granted');
    });
  }
}

function _envoyerAlarme(titre, corps) {
  if ('vibrate' in navigator) navigator.vibrate([400, 150, 400]);
  // build 449 : registration.showNotification plus fiable que new Notification
  if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.showNotification(titre, { body: corps, icon: './icons/icon-192.png', badge: './icons/icon-192.png', requireInteraction: true, vibrate: [400,150,400] });
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(titre, { body: corps, icon: './icons/icon-192.png', requireInteraction: true }); } catch(e) {}
  }
}

function _annulerAlarmes() {
  _alarmeTimers.forEach(clearTimeout);
  _alarmeTimers = [];
  if (window._alarmeInterval) { clearInterval(window._alarmeInterval); window._alarmeInterval = null; }
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALARMS' });
  }
}

function _programmerAlarmes() {
  _annulerAlarmes();
  // build 612 : alerte 🔔 désactivée totalement (jugée anxiogène). On purge toute
  // alarme éventuelle puis on sort. Le code historique ci-dessous est conservé mais
  // volontairement inatteignable.
  return;
  if (localStorage.getItem('bari_perso_sans_alarme') !== '0') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  var now = nowDecimal();

  // Construire la liste des alarmes futures
  var alarmes = [];
  session.forEach(function(c) {
    if (c.heureDecimal <= now) return;
    var b = boissons[c.boissonIdx];
    alarmes.push({
      delaiMs: Math.round((c.heureDecimal - now) * 3600000),
      titre: '\u{1F550} Vous pouvez boire',
      corps: b.nom + ' (' + c.vol + ' mL)'
    });
  });
  (_repasEnSessions || []).forEach(function(r) {
    if (r.hDec <= now) return;
    alarmes.push({
      delaiMs: Math.round((r.hDec - now) * 3600000),
      titre: '\u{1F550} Vous pouvez manger',
      corps: (r.nom || 'Repas') + ' \u00e0 ' + r.heureStr
    });
  });

  if (!alarmes.length) return;

  // ── Mécanisme 1 : SW setTimeout (résiste à l'arrière-plan et au verrouillage) ──
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SET_ALARMS', alarmes: alarmes });
  }

  // ── Mécanisme 2 : setInterval 30s (avant-plan, filet de sécurité) ──
  var alarmesDeclenchees = {};
  function _verifierAlarmes() {
    var n = nowDecimal();
    var TOL = 0.5 / 60;
    session.forEach(function(c) {
      var key = 'c' + c.id;
      if (c.heureDecimal >= n - TOL && c.heureDecimal <= n + TOL && !alarmesDeclenchees[key]) {
        alarmesDeclenchees[key] = true;
        var b = boissons[c.boissonIdx];
        _envoyerAlarme('\u{1F550} Vous pouvez boire', b.nom + ' (' + c.vol + ' mL)');
      }
    });
    (_repasEnSessions || []).forEach(function(r) {
      var key = 'r' + r.hDec;
      if (r.hDec >= n - TOL && r.hDec <= n + TOL && !alarmesDeclenchees[key]) {
        alarmesDeclenchees[key] = true;
        _envoyerAlarme('\u{1F550} Vous pouvez manger', (r.nom || 'Repas') + ' \u00e0 ' + r.heureStr);
      }
    });
  }
  window._alarmeInterval = setInterval(_verifierAlarmes, 30000);
}


// build 446 : bannière d'invitation aux alarmes (visible dès qu'il y a des éléments futurs,
// et que les alarmes ne sont pas encore activées)
function _afficherBanniereAlarme() {
  var ex = document.getElementById('banniereAlarme'); if (ex) ex.remove();
  // build 613 : alerte 🔔 désactivée totalement (jugée anxiogène). On retire toute
  // bannière éventuelle puis on sort — l'invitation ne s'affiche plus jamais.
  // Code historique conservé ci-dessous, volontairement inatteignable.
  return;
  // Montrer uniquement si jamais configuré (null) — pas si explicitement désactivé ('1') ou activé ('0')
  var alarmeVal = localStorage.getItem('bari_perso_sans_alarme');
  if (alarmeVal !== null) return; // déjà configuré, ne pas afficher
  var hasFutur = session.some(function(c){ return c.heureDecimal > nowDecimal(); })
    || (_repasEnSessions||[]).some(function(r){ return r.hDec > nowDecimal(); });
  if (!hasFutur) return;
  var b = document.createElement('div');
  b.id = 'banniereAlarme';
  b.style.cssText = 'background:#fff8e1;border:1.5px solid #f9a825;border-radius:12px;padding:10px 14px;margin:8px 0;display:flex;align-items:center;gap:10px;';
  b.innerHTML = '<span style="font-size:1.2rem;flex-shrink:0;">🔔</span>'
    + '<div style="flex:1;">'
    + '<div style="font-size:.78rem;color:#5c3d00;font-weight:600;margin-bottom:6px;">Vous avez des éléments programmés. Souhaitez-vous être alerté(e) à l\'heure ?</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:4px;">'
    + '<button onclick="activerAlarmes(true); document.getElementById(\'banniereAlarme\').remove();" '
    + 'style="flex:1;padding:6px;background:#f9a825;color:#fff;border:none;border-radius:8px;font-family:Nunito,sans-serif;font-size:.8rem;font-weight:800;cursor:pointer;">✅ Oui</button>'
    + '<button onclick="window._banniereAlarmeFermee=true; document.getElementById(\'banniereAlarme\').remove();" '
    + 'style="flex:1;padding:6px;background:none;border:1.5px solid #f9a825;color:#5c3d00;border-radius:8px;font-family:Nunito,sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;">Non</button>'
    + '</div>'
    + '<div style="font-size:.7rem;color:#8a6500;">Modifiable dans → Aide ⚙️ Configuration → 🎛️ Personnalisation</div>'
    + '</div>';
  var list = document.getElementById('sessionList');
  if (list && list.parentNode) list.parentNode.insertBefore(b, list);
}

function activerAlarmes(checked) {
  localStorage.setItem('bari_perso_sans_alarme', checked ? '0' : '1');
  var cb = document.getElementById('persoAlarmes');
  var thumb = cb && cb.parentElement.querySelector('.bari-toggle-thumb');
  if (thumb) thumb.textContent = checked ? 'ON' : 'OFF';
  updateLegende(); // build 460 : mise à jour immédiate du 🔔 dans la légende
  if (checked) {
    demanderPermissionAlarme(function(ok) {
      if (!ok) {
        showMiniPopupWithRisques('🔔 Notifications bloquées',
          'Votre navigateur n\u2019a pas accordé la permission.\n\nSur Android : vérifiez les paramètres notifications de Chrome.\nEn navigation privée, les notifications sont souvent bloquées automatiquement.');
        return;
      }
      _programmerAlarmes();
    });
  } else {
    _annulerAlarmes();
  }
}

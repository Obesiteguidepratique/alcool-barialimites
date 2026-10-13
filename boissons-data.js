// Alcool Barialimites — boissons-data.js
// Module 2 : données pures (boissons[], catColors/Titres/SousTitres, pays{}, MATRICE, _ALCOOL_CATS, _CATS_MASQUEES) — build 662, extrait de index.html
// Aucune logique, uniquement des données. Chargé avant le script principal (voir index.html).

// build 675 : ci-dessous, les entrées marquées `legacy:true` utilisent une ancienne
// taxonomie de catégories ('Vins'/'Vins pétillants'/'Bières & Cidres', avec un 's' — à ne
// pas confondre avec 'Vin'/'Vin pétillant'/'Bière'/'Cidre', les vraies catégories de l'app
// depuis Build 667, listées dans _ALCOOL_CATS ci-dessous) plus quelques entrées `autre:true`
// devenues inatteignables. Confirmé par recherche exhaustive dans tout index.html : AUCUN
// code n'affiche plus jamais ces entrées (le système MATRICE/écran unifié les a remplacées)
// — mais elles ne sont PAS supprimées, volontairement : `boissons[]` est un tableau, et les
// consommations du jour (`LS_SESSION_TEMP`) comme le journal y réfèrent par INDEX numérique
// brut (`boissonIdx`). Supprimer une entrée ici décalerait l'index de toutes celles qui la
// suivent — y compris les boissons perso/générées/cocktails ajoutées en cours de session —
// et pourrait faire pointer une consommation déjà enregistrée sur la mauvaise boisson.
// Seul leur DERNIER effet de bord réel (fausser silencieusement le calcul « Que puis-je finir
// à temps ? », qui parcourt tout `boissons[]`) a donc été neutralisé via le flag `legacy`,
// sans toucher à la position d'aucune entrée. Voir `_calcFinissables()` dans index.html.
const boissons = [
  // Sans alcool
  { nom:'Eau',                  degre:0, vol:250, cat:'Sans alcool', type:'sansal' },
  { nom:'Cocktail sans alcool', degre:0, vol:200, cat:'Sans alcool', type:'sansal' },
  // type: 'leger' | 'petillant' | 'fort' | 'cocktail'
  // Vins, vins doux et liquoreux (build 615 : complétés) — remplacés par MATRICE['Vin'] (build 667+)
  { nom:'Vin 10°',             degre:10,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 11°',             degre:11,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 12°',             degre:12,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 13°',             degre:13,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 14°',             degre:14,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 15°',             degre:15,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 16°',             degre:16,  vol:150, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 17°',             degre:17,  vol:100, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 18°',             degre:18,  vol:100, cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 19°',             degre:19,  vol:80,  cat:'Vins',             type:'leger', legacy:true },
  { nom:'Vin 20°',             degre:20,  vol:80,  cat:'Vins',             type:'leger', legacy:true },
  // Vins pétillants (build 625) — remplacés par MATRICE['Vin pétillant'] (build 667+)
  { nom:'Pétillant 6°',        degre:6,   vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 7°',        degre:7,   vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 8°',        degre:8,   vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 9°',        degre:9,   vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 10°',       degre:10,  vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 11°',       degre:11,  vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 12°',       degre:12,  vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  { nom:'Pétillant 13°',       degre:13,  vol:125, cat:'Vins pétillants',  type:'petillant', legacy:true },
  // Bières & Cidres (build 615) — remplacées par MATRICE['Bière']/MATRICE['Cidre'] (build 667+)
  { nom:'Bière sans alcool',   degre:0.3, vol:330, cat:'Sans alcool',  type:'petillant' },
  { nom:'Bière ou cidre 3°',   degre:3,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière ou cidre 4°',   degre:4,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière ou cidre 5°',   degre:5,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière ou cidre 6°',   degre:6,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 7°',      degre:7,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 8°',      degre:8,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 9°',      degre:9,   vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 10°',     degre:10,  vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 11°',     degre:11,  vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  { nom:'Bière forte 12°',     degre:12,  vol:330, cat:'Bières & Cidres',  type:'petillant', legacy:true },
  // Alcools forts — remplacés par MATRICE['Spiritueux'] (build 667+)
  { nom:'Alcool fort 38°',     degre:38,  vol:40,  cat:'Spiritueux',       type:'fort', legacy:true },
  { nom:'Alcool fort 40°',     degre:40,  vol:40,  cat:'Spiritueux',       type:'fort', legacy:true },
  { nom:'Alcool fort 42°',     degre:42,  vol:40,  cat:'Spiritueux',       type:'fort', legacy:true },
  { nom:'Alcool fort 45°',     degre:45,  vol:25,  cat:'Spiritueux',       type:'fort', legacy:true },
  { nom:'Alcool fort 50°',     degre:50,  vol:40,  cat:'Spiritueux',       type:'fort', legacy:true },
  // Cocktails — accessibles via le « 🍸 Sélecteur de cocktail » (build 616)
  // Les 4 entrées `autre:true` ci-dessous étaient déjà exclues du calcul « finir à temps »
  // (filtre b.autre existant dans _calcFinissables) — inatteignables via l'UI depuis build 667.
  { nom:'Autre type de vins',        degre:null, vol:150, cat:'Vins',            type:'leger',    autre:true },
  { nom:'Autre vin pétillant',       degre:null, vol:125, cat:'Vins pétillants', type:'petillant',autre:true },
  { nom:'Eau pétillante',            degre:0,    vol:200, cat:'Sans alcool',      type:'sansal', petillant:true },
  { nom:'Limonade / Soda pétillant', degre:0,    vol:200, cat:'Sans alcool',      type:'sansal', petillant:true },
  { nom:'Boisson pétillante sans alcool', degre:0, vol:150, cat:'Sans alcool',   type:'sansal', petillant:true },
  { nom:'Autre Bière ou Cidre',      degre:null, vol:330, cat:'Bières & Cidres', type:'petillant',autre:true },
  { nom:'Autre Spiritueux',          degre:null, vol:40,  cat:'Spiritueux',      type:'fort',     autre:true },
  { nom:'Autre type de Cocktail',    degre:null, vol:200, cat:'Cocktails',       type:'cocktail', autre:true },
  { nom:'Boisson énergisante',         degre:0, vol:250, cat:'Sans alcool', type:'sansal', energisante:true },
  { nom:'Boisson énergisante gazeuse', degre:0, vol:250, cat:'Sans alcool', type:'sansal', petillant:true, energisante:true },
];

// build 675 : catColors / catTitres / catSousTitres supprimés — confirmés 100% morts (zéro
// lecture nulle part dans index.html), contrairement aux entrées `legacy` ci-dessus qui
// restent lues passivement par _calcFinissables(). Ces trois objets, eux, ne sont indexés
// par rien (simples lookups par nom de catégorie) : leur suppression est sans risque.

;

// peinesParPays intégré directement dans pays{}

const pays = {
  "be-std":   { nom:"🇧🇪 Belgique — conducteur standard",      seuil:0.5, peine:"Retrait permis / amende jusqu’à 16 000 €" },
  "be-rec":   { nom:"🇧🇪 Belgique — récidive",                 seuil:0.2, peine:"Retrait permis / amende renforcée" },
  "ca-gen":   { nom:"🇨🇦 Canada — règle générale",             seuil:0.8, peine:"Amende min. 1 000 $ / emprisonnement" },
  "ca-warn":  { nom:"🇨🇦 Canada — Infraction",              seuil:0.5, peine:"Suspension du permis 3 jours" },
  "ca-qc":    { nom:"🇨🇦 Québec — jeunes < 22 ans",            seuil:0.0, peine:"Suspension immédiate du permis" },
  "fr-exp":   { nom:"🇫🇷 France — conducteur expérimenté",     seuil:0.5, peine:"Jusqu'à 2 ans prison / 4 500 €" },
  "fr-young": { nom:"🇫🇷 France — jeune permis (< 2 ans)",     seuil:0.2, peine:"Invalidation du permis probatoire" },
  "ch-std":   { nom:"🇨🇭 Suisse — conducteur standard",        seuil:0.5, peine:"Amende / retrait de permis" },
  "ch-pro":   { nom:"🇨🇭 Suisse — récidive / pro",             seuil:0.1, peine:"Retrait de permis" },
};

// ── Build B : sélection boissons par sous-catégorie (matrice sucre) ──
var MATRICE = {
  'Bière': [
    {s:'Classique',aMin:3,aMax:12,slm:1,slM:10,r:"Le degré prédit mal le sucre."},
    {s:'Forte / spéciale',aMin:3,aMax:12,slm:2,slM:18,r:"Une bière forte n'est pas forcément plus sucrée."},
    {s:'Aromatisée / fruitée',aMin:3,aMax:12,slm:3,slM:35,r:"Très variable selon la recette."}
  ],
  'Cidre': [
    {s:'Brut',aMin:3,aMax:6,slm:5,slM:25,r:"Fourchette indicative."},
    {s:'Fermier',aMin:3,aMax:6,slm:5,slM:60,r:"« Fermier » désigne le mode de production, pas la sucrosité."},
    {s:'Demi-sec',aMin:3,aMax:6,slm:20,slM:50,r:"Fourchette indicative."},
    {s:'Doux',aMin:3,aMax:6,slm:40,slM:100,r:"Peut dépasser 100 g/L."}
  ],
  'Vin': [
    {s:'Sec',aMin:10,aMax:20,slm:0,slM:9,r:"Fourchette indicative."},
    {s:'Fortifié / muté sec',aMin:15,aMax:20,slm:0,slM:25,r:"À distinguer des vins doux naturels."},
    {s:'Demi-sec',aMin:10,aMax:20,slm:4,slM:18,r:"Fourchette indicative."},
    {s:'Aromatisé',aMin:10,aMax:20,slm:4,slM:80,r:"Très variable selon la recette."},
    {s:'Moelleux',aMin:10,aMax:20,slm:12,slM:45,r:"Fourchette indicative."},
    {s:'Doux naturel / muté',aMin:15,aMax:20,slm:45,slM:150,r:"Sucre résiduel élevé malgré l'alcool."},
    {s:'Liquoreux / très doux',aMin:10,aMax:20,slm:45,slM:250,r:"Peut dépasser 100 g/L."}
  ],
  'Vin pétillant': [
    {s:'Brut nature / non dosé',aMin:6,aMax:13,slm:0,slM:3,r:"Dosage très faible."},
    {s:'Extra-brut',aMin:6,aMax:13,slm:0,slM:6,r:"Dosage faible."},
    {s:'Brut',aMin:6,aMax:13,slm:3,slM:12,r:"Catégorie la plus courante."},
    {s:'Extra-sec',aMin:6,aMax:13,slm:12,slM:17,r:"Plus sucré que le brut, malgré son nom."},
    {s:'Sec',aMin:6,aMax:13,slm:17,slM:32,r:"Classification usuelle."},
    {s:'Demi-sec',aMin:6,aMax:13,slm:32,slM:50,r:"Classification usuelle."},
    {s:'Doux',aMin:6,aMax:13,slm:50,slM:120,r:"Peut dépasser cette valeur."}
  ],
  'Spiritueux': [
    {s:'Sec',aMin:38,aMax:50,slm:0,slM:2,r:"Hors liqueurs."},
    {s:'Aromatisé / sucré',aMin:38,aMax:50,slm:2,slM:80,r:"Liqueurs, crèmes, etc."}
  ]
};
var _ALCOOL_CATS = ['Bière','Cidre','Vin','Vin pétillant','Spiritueux'];
// build 675 : _CATS_MASQUEES retiré — variable déclarée mais jamais lue nulle part (zéro
// appelant confirmé), donc sans aucun effet réel. Le vrai bug de masquage des boissons perso
// (documenté à tort comme causé par cette variable dans les Builds 673/674) venait en réalité
// de _ucCatRowHtml() dans index.html, qui n'affichait que les sous-catégories MATRICE et
// ignorait les boissons perso de la même catégorie — corrigé séparément (voir index.html).

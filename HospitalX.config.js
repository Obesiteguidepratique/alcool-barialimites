/**
 * Barialimites — Configuration spécifique HospitalX
 * ─────────────────────────────────────────────────
 * Ce fichier est le SEUL à modifier pour personnaliser
 * l'application pour cet établissement.
 * Aucune connaissance technique requise.
 */
window.BARIALIMITES_CONFIG = {

  // ── Identité de l'établissement ───────────────────────────────────────
  organisation:   "Hôpital Exemple",
  service:        "Service de chirurgie de l'obésité",
  ville:          "Paris",

  // ── Logo (URL absolue ou relative au dossier de déploiement) ─────────
  // Laisser null pour utiliser le logo OMEAVE par défaut
  logoUrl:        null,
  // logoUrl:     "./logos/hospital-x.png",
  logoAlt:        "Logo Hôpital Exemple",

  // ── Contact de l'équipe soignante ─────────────────────────────────────
  contactNom:     "Dr. Martin — Secrétariat chirurgie bariatrique",
  contactTel:     "01 23 45 67 89",
  contactEmail:   "obesite@hospital-exemple.fr",
  contactLien:    "https://hospital-exemple.fr/chirurgie-obesite",

  // ── Texte affiché dans le disclaimer ──────────────────────────────────
  // null = texte standard. Remplacer pour un message personnalisé.
  disclaimerExtra: "Cette application vous a été remise par votre équipe soignante. "
    + "En cas de doute, contactez directement le secrétariat.",

  // ── Bandeau d'identification (affiché en haut de l'app) ───────────────
  bannerTexte:    "Application fournie par l'Hôpital Exemple",
  bannerCouleur:  "#003366",   // fond du bandeau (hex)
  bannerTexteCouleur: "#FFFFFF",

  // ── Fonctions à masquer pour cet établissement ────────────────────────
  // Laisser vide [] pour garder toutes les fonctions
  masquerFonctions: [],
  // Exemples : ["exportCsv", "tableauBord"]

  // ── Isolation des données (préfixe localStorage) ─────────────────────
  // Changer pour éviter les conflits avec la version publique.
  // ATTENTION : changer ce préfixe efface les données existantes.
  storagePrefix:  "bari_hospitalx_",

};

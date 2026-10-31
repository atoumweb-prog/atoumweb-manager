# Fiches Prospection — travail et référence

## Réalisé

- Identité compacte en haut et deux onglets existants. Suppression de la disposition permanente à trois colonnes dans ce bureau uniquement ; le composant partagé Client reste inchangé. Les anciennes préférences de largeur sont conservées dans le stockage, sans régir le nouveau bureau.
- Associations accessibles à la demande, sans duplication des informations détaillées. Liens organisation/contact/devis et états vide/erreur existants conservés. Logo et accès à la fenêtre Référence séparée restent disponibles dans Identité et logo.
- Fiche de travail : température, situation et prochaine action ; résumé besoin/contact/dernière activité ; groupes repliables Entreprise et contacts, Besoins et qualification, Devis et activités. Formulaires, qualification, devis, relances, clôture, archivage et journal existants conservés. Le raccourci décisionnaire ouvre le groupe identité avant de cibler le champ.
- Référence intégrée : lecture par défaut des mêmes données, six rubriques, bouton Modifier et enregistrement explicite d’une nouvelle version par le service existant. Historique/comparaison conservés. L’éditeur garde son brouillon lors de la réduction et utilise UX01 lors de la sortie ; aucune sauvegarde automatique. Le paramètre est opt-in pour le bureau, les autres usages du panneau restent inchangés.
- Une seule zone centrale défilante, en-tête et onglets fixes. Associations défilantes si nécessaire. Palette bleu nuit/jaune existante, correction locale des anciennes cartes blanches.

## Vérification

`npm run typecheck` et `node scripts/check-shell-home-simplification.cjs --desk`. Configuration unique1920×1080,Noir/Confort/100%, vraie application Electron/preload/services sur SQLite TEMP. Lecture et modification de la référence, Rester conserve le brouillon, création exacte d’une version, historique, molette native jusqu’à l’enregistrement, défilement du travail, repli Associations, fermeture normale et instance chrono conservée. Contrôles habituels du harnais : intégrité, FK et registre71. Captures réelles dans `outputs/prospection-desk-standard`.

Pas de nouvelle campagne tous écrans/thèmes ni des autres modules. Pas de nouvelle fonction métier ; pas de service, IPC ou migration modifié. Aucun workspace réel, aucune activation B1/EC04, fusion, publication, installateur ou CI hébergée. Recette visuelle utilisateur restant à faire.

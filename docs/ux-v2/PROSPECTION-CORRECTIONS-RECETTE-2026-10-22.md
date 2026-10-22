# Prospection — corrections après recette du portable1d6e7131

## Périmètre réalisé

- [x] Historique en tableau compact, texte lisible, détail limité à400px avec corps défilant et état vide ; mêmes dossiers/issues et ouverture Client.
- [x] Bloc Conversion remplacé par accès compact Clients acquis, même filtre réel ; annotation technique retirée.
- [x] Référence du panneau rapide ouvre le nouvel onglet. Ouverture séparée conservée explicitement dans Identité et logo ; même panneau de connaissance en lecture par défaut, identité repliable, même palette sombre et défilement.
- [x] Formulaires : suppression des fonds blancs hérités, libellés lisibles ; commandes Enregistrer/Annuler visibles pendant le défilement. Annuler restaure le brouillon de référence sans version supplémentaire. Historique et comparaison préservés.
- [x] Informations manquantes regroupées à la demande avec leurs intitulés ; champs de modification conservés. Les dates/sources du brouillon initial ne sont jamais présentées comme une vérification enregistrée.
- [x] Relances sur une ligne compacte ; Effectuée ouvre le compte rendu existant, Annuler l’action garde la fonction d’annulation. Échéance avec mention En retard. Formulaires de résultat et programmation conservés.
- [x] Un seul journal détaillé dans la fiche de travail ; suppression du journal doublonné des relances pour ce bureau. Regroupement Relances interne retiré, actions directement disponibles dans Devis et activités.
- [x] État réel du devis : Aucun devis lié si absent, suppression de l’affirmation de besoin validé sans preuve ; étape commerciale inchangée.
- [x] Niveau d’intérêt, choix Faible/À évaluer/Marqué/Fort ; mêmes valeurs stockées, aucun recalcul.
- [x] Boutons explicites entreprise/contact/coordonnées, archivage avec confirmation avant mutation, classement Perdu avec confirmation existante. Ouverture de rubrique/onglet rend le contenu visible.
- [x] Liens site/email et copie téléphone sur clic explicite. HTTP(S) sans identifiants et mailto simple seulement ; protocoles fichier/commande et paramètres email refusés. Aucune navigation automatique ni envoi. Copie via canal presse-papiers existant. Aucune donnée dupliquée.
- [x] Confirmation routinière fiche chargée supprimée dans le contexte Prospection ; erreurs et confirmations de modifications conservées.

## Vérification ciblée

`npm run typecheck`, `npx vitest run src/shared/prospectExternalUrl.test.ts` (2 tests), `node scripts/check-shell-home-simplification.cjs --corrections` (38 contrôles natifs incluant le parcours de fiche existant). Une configuration1920×1080,Noir/Confort/100%, services et SQLite TEMP. Saisies conservées par Rester, version exacte, Annuler sans version, dates, contrastes du mode édition dans les deux accès, bouton Annuler horizontal, absence de devis, journal unique, destinations IPC et copie téléphone interceptées pour ne pas toucher le navigateur/presse-papiers, archivage annulé puis confirmé, ligne historique compacte, panneau borné et intégrité/FK/registre71. Captures réelles dans `outputs/prospection-corrections-standard`.

Aucune suite générale ni matrice écrans/thèmes. Aucune donnée réelle ou Validation-MSI, aucune fusion/push/CI/installateur, aucune sauvegarde complète. Migrations et services métier inchangés. Le canal app:open-external-url ne lance que la destination validée après clic ; aucune capacité de fichier ou exécution de commande ajoutée. La recette utilisateur et les nouveaux contenus de saisie restent à apprécier visuellement.

## Ajustement pendant la recette

L’utilisateur juge encore le parcours comprimé par sa fiche latérale et signale la carte archivée restée sélectionnée. Le parcours utilise maintenant toute la largeur, six étapes visibles à la taille standard et listes défilantes par colonne. Un clic sur le titre d’une carte ouvre la fiche de travail du dossier actif cliqué ; le résumé et ses actions existants restent accessibles via Voir le résumé. Aucune fiche latérale persistante dans ce parcours ; annuaire et historique gardent leurs présentations propres. Trois assertions ciblées supplémentaires, même configuration (41 contrôles natifs au total).

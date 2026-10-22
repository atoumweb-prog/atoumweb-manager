# Manager — consignes et reprise courte

Mise à jour :22/10/2026. Synthèse des décisions de cette conversation ; pas une transcription. Les demandes récentes de l’utilisateur priment. Le suivi général reste PROJECT_STATUS.md ; ne pas créer de feuille de route concurrente pour Manager/Bridge.

## Travailler avec un budget maîtrisé

- Réponses courtes, concrètes ; éviter les longs audits répétés, propositions et explications déjà données.
- Traiter uniquement la page et le problème demandés. Conserver les fonctionnalités ; ne pas généraliser la refonte aux autres vues avant validation.
- Pendant la collecte de captures : relever les défauts sans coder si l’utilisateur demande de les garder pour après. Après « corrige tout », regrouper les points connus en une passe cohérente.
- Ne pas refaire les travaux et contrôles déjà validés. Lire ce mémo une fois ; rechercher seulement les fichiers pertinents. Respecter les autres lectures obligatoires du dépôt.
- Référence de recette visuelle :1920×1080, thème Noir avec palette bleu nuit/jaune approuvée, densité Confort, zoom100%. Le code doit rester adaptable ; aucune matrice de tailles/thèmes sans demande ou anomalie précise à reproduire.
- Tests proportionnés : inspection visuelle ciblée et parcours touchés ; typecheck si TypeScript modifié. Ne pas relancer la suite complète ni visiter les17 modules pour une correction visuelle. Tests supplémentaires seulement après modification pertinente, échec ou risque concret non résolu. Une modification documentaire ne nécessite pas de tests applicatifs.
- Ne pas fabriquer un portable/ZIP à chaque échange. Regrouper les corrections ; préparer une livraison quand l’utilisateur la demande ou quand une livraison est déjà explicitement en cours. Ne pas reconstruire si les sources n’ont pas changé.
- Pas de délégation/sous-agents sans demande. Pas de recherche Internet pour les simples corrections locales. Sorties d’outils courtes, recherches ciblées ; pas de lectures/captures massives inutiles.
- En fin de lot : mettre à jour ce mémo en remplaçant l’état précédent, puis PROJECT_STATUS pour une étape significative. Rapporter résultat, contrôles et limite réelle sans répéter tout l’historique.

## Décisions produit durables

- Manager beau et pratique : informations utiles, textes compréhensibles, pas de doublons ni annotations techniques inutiles ; sections repliables et commandes explicites.
- Conserver logo AtoumWeb approuvé, palette et Accueil/en-tête validés. Barre supérieure : recherche unique, date, chrono unique, cloche et réglages ; pas de compactage/burger dans le vrai shell.
- Prospection : annuaire, parcours commercial, historique ; fiche de travail distincte de la référence. Lecture puis modification explicite ; préserver les brouillons et gardes UX01.
- Défilements accessibles et contenus bornés ; ne pas écraser les colonnes, couper les mots ou masquer les commandes.
- Ne pas inventer compteurs, dates de vérification, états de devis ou fonctions métier à partir d’une maquette.
- Aucune donnée réelle modifiée. Tests sur bases TEMP déterministes, portables sur nouveau jeu fictif. Anciennes recettes intactes.
- Aucun main/fusion/push/CI sans autorisation correspondante. Aucun installateur. EC04 reste expérimental, non exposé ; aucune activation de sauvegarde complète B1.

## État utile pour reprendre

- Dépôt local : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation.
- Branche :codex/ux-v2-prospection-visual-pilot.
- Dernier code livré :42b12a93125796f60aeec1cef1dd9ea4b2a52c3f. Des commits documentaires peuvent suivre sans modifier ce portable.
- Livré : corrections Historique compact, référence interne/fenêtre séparée, contraste, Enregistrer/Annuler, dates et informations manquantes, relances, journal unique, confirmations et liens. Dernier parcours : six étapes pleine largeur, titre de carte ouvre la fiche, résumé à la demande, pas de panneau latéral comprimant le parcours.
- Contrôles réalisés au code livré :typecheck,2 tests de destinations,41 contrôles natifs sur une configuration et17 contrôles du portable ; intégrité/FK/migrations71. Ne pas les répéter sans raison nouvelle.
- Réserve : premier démarrage instrumenté du portable avec erreur Electron startupData ; non reproduite au suivant sur le même binaire. Cause non établie, consignée dans VALIDATION.json.
- Portable :C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Pilote-20261022-42b12a93/LANCER-LE-MANAGER.cmd. ZIP :C:/Users/AtoumWeb/Downloads/AtoumWeb-Pilote-42b12a93.zip.
- Captures réelles :outputs/prospection-corrections-standard/index.html. Bilan :docs/ux-v2/PROSPECTION-CORRECTIONS-RECETTE-2026-10-22.md.
- Validation visuelle utilisateur encore attendue ; ne pas déclarer l’ergonomie approuvée parce que les tests passent. Refonte Client mise de côté ; aucune généralisation autorisée par défaut.

## Phrase pour un nouveau chat

« Lis AGENTS.md et docs/ux-v2/CONSIGNES-ET-REPRISE.md. Reprends l’état actuel sans refaire les validations. Voici la page ou le défaut à traiter :… »

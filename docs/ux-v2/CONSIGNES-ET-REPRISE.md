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

- Depot local : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation.
- Branche courante : codex/prospection-ux-six-lots ; baseline50b749b0, code finalc51aaebec315ce7ed8c8d0c3784de167d7f66cad. Commits documentaires possibles apres sans changement de code.
- Autorisation du22/10 : appliquer les six lots UX sequentiellement sans validation intermediaire. Disposition confirmee : logo/nom et synthese commerciale en haut, Identite/logo et Associations a la demande, deux onglets pleine largeur. Remplace la mention de trois colonnes permanentes du cahier.
- Realise : annuaire5 colonnes par defaut, vues existantes preservees et volet adaptatif ; creation en dialogue et contacts reutilisables ; groupe metier pertinent ouvert, besoins/catalogue restructures ; actions/compte rendu/suite en dialogue ; confirmations lisibles et historique filtre ; reference avec controles repliables et conflit observe protege ; pipeline compact avec rappels et alternative clavier.
- Bilan : docs/ux-v2/PROSPECTION-SIX-LOTS-2026-10-22.md ; cahier utilisateur copie dans PROSPECTION-CAHIER-UX-2026-10-22.md. Tous les points sont evalues avec adaptations/limites explicites.
- Controles deja passes : typecheck/build Vite renderer ;1666/1666 tests complets(195 fichiers), puis85/85 cibles ;118 controles natifs cumules TEMP,9 combinaisons taille/zoom pour Annuaire, clavier natif Tab/Maj+Tab/Escape et contrastes >=4,5 des confirmations sur3 themes ; etats devis avec lignes/preparation/envoi/accord/refus/conversion controles. Ne pas repeter sans modification pertinente.
- Limites metier conservees : Contact mono-entreprise ; QuoteService.accept convertit/rattache deja le Client apres confirmation ; snapshots de reference append-only sans CAS atomique public pour deux saves exactement simultanes. Pas de service, migration ou contrat public modifie.
- Galerie apres : outputs/prospection-ux-lots (49 PNG). Comparatif : C:/Users/AtoumWeb/Downloads/Prospection-refonte-six-lots-20261022/index.html et ZIP du meme nom (49 apres/11 avant). Avant : outputs/prospection-galerie-20261022 (69 captures).
- PR preparee localement dans docs/ux-v2/PROSPECTION-PR-PREPAREE.md ; aucun push/CI/PR distant. Le pilote parent n'est pas dans origin/main, choisir la base avant publication. Refonte Client hors perimetre ; main et activations EC04/B1 inchanges.
- Dernier portable livre reste42b12a93125796f60aeec1cef1dd9ea4b2a52c3f, non reconstruit : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Pilote-20261022-42b12a93/LANCER-LE-MANAGER.cmd ; ZIP Downloads/AtoumWeb-Pilote-42b12a93.zip. Ancienne reserve Electron startupData au premier lancement non reproduite ensuite, cause inconnue.
- Validation visuelle utilisateur encore attendue. Prochaine action : retours sur galerie, puis livraison/publication seulement si demandee ; ne pas declarer l'ergonomie approuvee parce que les tests passent.

## Phrase pour un nouveau chat

« Lis AGENTS.md et docs/ux-v2/CONSIGNES-ET-REPRISE.md. Reprends l’état actuel sans refaire les validations. Voici la page ou le défaut à traiter :… »

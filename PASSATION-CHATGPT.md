# Passation à ChatGPT — AtoumWeb Manager Prospection

Mis à jour le 23 octobre 2026. Ce fichier est le point d’entrée pour reprendre cette version sans relire toute la conversation. Les nouvelles demandes de Carlos priment ; les anciens comptes rendus datés ne constituent pas une liste de travaux à recommencer.

## 1. Dépôt et état à reprendre

- Dépôt privé de travail : https://github.com/atoumweb-prog/atoumweb-manager-prospection
- Branche par défaut : `codex/crm-saisie-coherente`.
- Commit applicatif de référence : `3c11810127d6b956a0c6dd8e064b37170460da1e` ; les commits suivants peuvent compléter cette documentation. Vérifier le HEAD avant d’agir.
- L’historique du Manager est conservé. L’ancien dépôt `atoumweb-prog/atoumweb-manager` n’est pas la destination des corrections de ce chantier.
- Sur la machine de Carlos : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation`. Remote `prospection` = nouveau dépôt ; `origin` = ancien dépôt. Dans un clone neuf, `origin` désignera normalement le nouveau dépôt : vérifier `git remote -v`, ne pas se fier au nom seul.
- GitHub Actions désactivé dans le nouveau dépôt. Aucun exécutable, profil, base utilisateur ou galerie locale n’est publié dans Git.
- État technique : Electron + React/TypeScript + SQLite, migrations **1 à 74**. Dernière passe UX sans migration supplémentaire.

## 2. Lectures et méthode de reprise

Lire `AGENTS.md`, puis dans l’ordre demandé `PROJECT_STATUS.md`, `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md`, `README.md`, puis `docs/ux-v2/CONSIGNES-ET-REPRISE.md`. Pour le détail de la dernière livraison : `docs/ux-v2/PROSPECTION-PARCOURS-RECETTE-2026-10-23.md`.

Les sections historiques du README mentionnent main, d’anciens schémas et lanceurs : elles ne remplacent pas le présent état. Le cahier des charges reste la référence métier ; documenter et faire arbitrer une contradiction réelle plutôt que la contourner.

Commencer par vérifier branche, statut et dernière consigne utilisateur. Ne pas réinitialiser un travail local. Ne pas relancer les tests ni reconstruire l’application simplement pour reprendre le dossier. Cette passation n’autorise aucun nouveau lot de code : la prochaine étape est le retour de recette de Carlos.

Si ChatGPT n’a qu’un accès lecture au dépôt, expliquer les modifications à partir des sources et demander le retour nécessaire ; ne pas prétendre avoir édité, testé ou reconstruit. Les chemins Windows ci-dessous sont propres au poste de Carlos, pas des ressources accessibles depuis GitHub.

## 3. Logique UX acceptée par Carlos

La fiche est un **parcours commercial**, avec six étapes visibles en en-tête et des onglets de travail indépendants. Consulter un onglet ne change jamais automatiquement le statut. Les actions de progression, démarrage, perte et archivage doivent rester accessibles en haut.

| Onglet | Responsabilité |
| --- | --- |
| Entreprise | Identité, activité, adresse complète, site ou absence de site, téléphone/email généraux, informations légales. |
| Contacts | Personnes liées, fonction dans l’entreprise, coordonnées visibles, interlocuteur principal et décisionnaire choisissables ou ajoutables sur place. |
| Préparer l’échange | Analyse de l’entreprise et préparation du prochain échange ; deux vues Analyse / Objectif et questions. Remplace les anciens onglets Recherche / Préparation. |
| Besoins | Qualification ; Demande et besoin ; Budget et délais ; Prestations et points à confirmer. |
| Actions et échanges | Appels, rendez-vous, comptes rendus et relances, avec continuité après conversion en Client. |
| Devis | Contexte du dossier et contrôle avant devis à côté du véritable éditeur : offres, lignes, prix, conditions et cycle de vie. |
| Historique | Événements pertinents filtrables ; journal complet conservé. |

Demandes importantes à ne pas annuler :

- Onglet actif clairement jaune avec texte sombre, même après focus dans un champ ; bouton jaune Entreprise en texte noir.
- Éviter les piles de blocs, les longs espaces vides et les champs courts occupant toute une ligne. Téléphone/email/fonction se regroupent ; les textes longs gardent une place adaptée.
- Distinguer libellés fixes, valeurs saisies et informations manquantes ; les champs à compléter sont signalés visuellement avec accès direct.
- Avant de consulter une phase dont les prérequis sont incomplets : lister les manques, proposer de compléter ou continuer sans changer l’étape. Garder distincts consultation et passage métier.
- Dans Besoins, les prestations sont des **intentions par cases à cocher, sans prix ni offre imposée**, avec ajout libre. Aucun devis ni ligne tarifée créé en cochant.
- Dans Devis, préparer et éditer sans quitter la prospection. Le menu latéral Devis reste la liste globale des **mêmes devis et du même éditeur**. Pas de second gestionnaire.
- Demande initiale et besoin confirmé sont deux notions distinctes ; conserver l’information d’origine.
- Les anciens boutons Ouvrir redondants du tableau ont été retirés ; cliquer une ligne ouvre la fiche.
- Enregistrements avec résultat visible, montants français acceptés, historique utile sans répétitions inutiles ; ne pas supprimer une sauvegarde nécessaire sous prétexte que son retour visuel est insuffisant.

## 4. Garde-fous métier et données

Une information peut être rappelée à plusieurs endroits, mais sa source reste unique : organisations, personnes, méthodes de contact, relations et prospect. Ne pas créer un second stockage pour faciliter l’écran.

- Personne réutilisable entre entreprises ; fonction portée par le lien avec l’entreprise, nom partagé, coordonnées canoniques. Principal et décisionnaire peuvent être différents.
- URL du site canonique dans l’entreprise ; présence/observations dans l’analyse partagée ; préparation du dossier privée. Sauvegarde du site atomique, contrôle des versions et conflits.
- Préparation du devis atomique : relire le dossier et les intentions, refuser les informations périmées ou bloquantes, réutiliser le brouillon existant ; nouveau brouillon vide de lignes, sans tarifs copiés automatiquement.
- Préserver protections de saisie non enregistrée, CAS/conflits, transactions et idempotence. Les raccourcis vers un champ doivent aussi respecter les brouillons de l’éditeur de devis.
- Préserver règles des transitions, conversions, contrats et snapshots de devis acceptés. Ne jamais modifier rétroactivement un devis accepté ou un projet fondé sur une ancienne version.
- Garder l’historique et l’archivage réversible ; ne pas inventer de détails absents des événements anciens.
- Abby reste manuel en V1 ; pas de facturation réglementaire ou d’envoi automatique ajouté par cette passation.
- Ne pas toucher aux Workspace, profils et saisies existants pour une recette technique. Fixtures déterministes / bases TEMP uniquement. Pas de copie ou migration de données sans demande correspondante.
- Aucun chantier Bridge, EC04/B1, installateur, fusion dans l’ancien main ou activation CI implicitement autorisé. Pas de délégation sans demande. Pas de recherche web nécessaire pour les corrections locales ordinaires.

## 5. Carte des sources utiles

| Sujet | Fichiers principaux |
| --- | --- |
| Navigation, étapes, avertissements | `src/renderer/crm/ProspectsPageV2.tsx`, `src/shared/prospectProgress.ts` |
| Apparence, densité, sélection | `src/renderer/crm/prospect-workspace-tabs.css` |
| Entreprise / site | `ProspectIdentityPanel.tsx`, `ProspectWebsitePanel.tsx` dans `src/renderer/crm/` ; `src/main/crm/CrmService.ts` |
| Contacts et décisionnaire | `ContactSummaryCard.tsx`, `ContactNameEditor.tsx`, `ProspectLinkedContactsPanel.tsx`, `ProspectDecisionEditor.tsx` dans `src/renderer/crm/` |
| Analyse / préparation | `src/renderer/crm/ProspectResearchPanel.tsx` |
| Besoin et intentions | `ProspectNeedsPanel.tsx`, `ProspectIntentChecklist.tsx`, `ProspectQualificationPanelV2.tsx`, `ProspectInitialRequest.tsx`, `ProspectCommercialEstimate.tsx` dans `src/renderer/crm/` |
| Devis intégré et partagé | `src/renderer/crm/ProspectQuoteWorkspace.tsx`, `src/renderer/commercial/QuotesPage.tsx`, `src/main/commercial/QuoteService.ts` |
| Historique et saisies | `src/renderer/crm/ProspectTimeline.tsx`, `src/renderer/unsaved/` |
| Contrats API | `src/main/ipc.ts`, `src/preload/preload.ts`, `src/shared/crm.ts`, `src/shared/commercial.ts` |
| Migrations récentes | `src/main/database/crmReconciliationMigration.ts` (72), `crmCommercialFieldsMigration.ts` (73), `crmOrganizationContactsMigration.ts` (74) |

## 6. Validation déjà réalisée et commandes

Dernière passe : typecheck et package réussis ; 94 tests ciblés distincts plus 5 du plan avant devis ; recette native TEMP 29 assertions et 16 captures sans erreur renderer ; véritable package 31 assertions / 12 visites / trois thèmes, intégrité SQLite et clés étrangères conformes. Détails et limites dans le bilan. Ces résultats concernent la version livrée, pas des modifications futures.

Référence visuelle : Noir, Confort, 100 %, 1920×1080 CSS ; vérifier les autres thèmes de façon ciblée après un changement pertinent.

Après modification, choisir les contrôles concernés. Commandes depuis la racine :

```powershell
npm ci                     # seulement pour installer les dépendances d’un clone neuf
npm run typecheck
npm test -- src/main/crm/CrmSingleSource.test.ts src/main/commercial/ProspectDraftPreparation.test.ts
node scripts/check-prospection-flow-native.cjs
npm run package            # seulement si une nouvelle livraison est demandée/nécessaire
```

Le runner `npm test` utilise le runtime Electron adapté à SQLite ; ne pas le remplacer au hasard par un autre runtime. Le banc natif est Windows et utilise des données TEMP. Le contrôle du package : `node scripts/check-packaged-manager-smoke.cjs --exe "CHEMIN_ABSOLU/out/AtoumWeb Manager-win32-x64/atoumweb-manager.exe" --crm-only`. La temporisation de frames a été bornée dans le banc pour les fenêtres en arrière-plan.

Attention : les scripts `prepare-*-portable.cjs` contiennent des chemins locaux et des références de livraison datées ; ce ne sont pas des outils portables universels. Les lire et adapter les chemins/identifiants avant une nouvelle livraison. Ne pas écraser un ancien portable. Pas de `npm run make` sans demande d’installateur. Ne pas relancer une suite complète ou une matrice de thèmes sans raison.

## 7. Livraison locale de référence

Lanceur : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-166160dc/LANCER-LE-MANAGER.cmd`.

Profil et Workspace TEST indépendants. Application, Profil et Workspace doivent rester ensemble. Ancienne recette `Manager-Prospection-20261023-16cfd49e`, avec saisies Le Bon Pain, intacte ; aucun transfert automatique vers la nouvelle version.

- app.asar SHA256 : `166160dc9a16deba27999b392a2fe5fc78fe532e8043b1369703e271f2de6984`
- exe SHA256 : `33952e3fb435581bdaa08ad24e51c22cf80b17b34a95f27558a28952449f1802`
- Galerie locale : `C:/Users/AtoumWeb/Downloads/Prospection-parcours-20261023-166160dc/index.html` ; aussi dans Captures du portable.

Le binaire a été construit avant le commit de consolidation : le numéro Git de base éventuellement inscrit dans son manifeste n’identifie pas à lui seul toutes les modifications locales incluses. Utiliser les empreintes ci-dessus et le bilan de livraison. Les captures/binaires ne sont pas dans ce dépôt ; si nécessaires à distance, demander leur mise à disposition à Carlos.

## 8. Suite et communication

Aucun correctif bloquant restant n’a été établi après la dernière livraison ; la recette humaine de Carlos reste à faire. Ne pas présenter les demandes historiques comme encore non réalisées. Examiner son prochain retour, reproduire le problème, corriger dans le périmètre, vérifier les chemins concernés puis mettre à jour PROJECT_STATUS et le mémo court. Une nouvelle publication Git ou livraison doit correspondre à la demande en cours ; conserver Actions désactivé tant qu’une activation n’est pas demandée.

Répondre en français, simplement, avec des résultats concrets. Carlos souhaite avancer sans confirmations répétées pour les actions déjà autorisées. S’il demande d’attendre pendant le relevé, ne pas modifier. Décrire franchement ce qui a été vérifié et ce qui reste à valider.

### Message prêt à coller dans un nouveau chat

> Nous continuons AtoumWeb Manager Prospection depuis le dépôt privé https://github.com/atoumweb-prog/atoumweb-manager-prospection, branche codex/crm-saisie-coherente. Lis PASSATION-CHATGPT.md puis les consignes qu’il indique. Reprends l’état courant sans rejouer les anciennes demandes ni relancer les validations sans changement. Je vais te donner mon prochain retour de recette ; n’entreprends pas un nouveau chantier avant ce retour. Si tu n’as pas accès aux sources, dis-le clairement.

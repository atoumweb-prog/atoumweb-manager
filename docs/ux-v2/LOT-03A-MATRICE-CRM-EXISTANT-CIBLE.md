# Lot 03A — CRM : matrice technique existant → parcours cible

**Statut : inventaire statique, conception uniquement ; aucune application modifiée, aucun test exécuté.**
**Code relu : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, le 09/10/2026.** Vérifier HEAD réel et les PR #81/#83/#84 avant de programmer.
**Références :** [Lot 03](LOT-03-CRM.md), [03B — Pipeline](LOT-03B-PROSPECTION-PIPELINE.md), [projet prévisionnel](LOT-07-PROJET-PRE-SIGNATURE.md), [recherche](LOT-02C-RECHERCHE-ROUTAGE.md), [formulaires](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Parcours commercial cible confirmé

`Annuaire / Nouveau contact` → `Prospect actif` → `Besoins` → `Devis (édition / envoi / relances)` → `Négociation` → `Finalisation (accord de principe, signature en attente)` → `Conversion (historique réel du Prospect devenu Client)`.

**Chemin parallèle volontaire, dès qu'un devis exploitable existe :** `Devis non signé` → **Préparer Projet prévisionnel** → `Comparer/Synchroniser` ou `Repartir de zéro en sécurité` si le devis change → `acceptation Abby` → **figer le Projet courant**. **Préparer un Projet ne change jamais automatiquement l'étape du Prospect**, ne le convertit pas et ne déclenche pas facturation/maintenance/production officielle.

**La distinction doit rester visible partout** :
- **Besoins Prospect / sélection catalogue** = intention ou recommandation, pas achat ;
- **lignes réellement présentes au devis courant** = base du Projet prévisionnel, **non signées/non achetées** ;
- **devis accepté dans Abby** = prestations achetées, preuves et snapshots, conversion Client, Projet accepté et figé.

## 2. Inventaire de code réel et risques

| Périmètre | Code et comportement vérifiés | Écart V2 / garde |
|---|---|---|
| Statuts | `src/shared/crm.ts` : `PROSPECT_STAGES` = `new`, `qualifying`, `need_identified`, `quote_to_prepare`, `quote_to_send`, `quote_sent`, `follow_up`, `negotiation`, `waiting`, `won`, `lost`. | **Aucun `finalization` backend** ; ne pas l'ajouter sans analyse métier. |
| Température | `PROSPECT_TEMPERATURES` = `cold/neutral/warm/hot`, champs distincts de `stage`. | Badge/couleur discret, lisible sans couleur seule ; ne pas confondre avec qualité de relation Client. |
| Service CRM | `src/main/crm/CrmService.ts`, `MANUAL_PROSPECT_STAGE_TRANSITIONS` : transitions encadrées ; `quote_to_prepare/quote_to_send` ne sont **pas** des destinations manuelles librement sélectionnables ; `won` n'est pas transition manuelle ordinaire. | Drag & drop = **demande soumise au service**, jamais mise à jour front directe ni contournement de validation. |
| Listes/étapes | `src/renderer/crm/ProspectsPageV2.tsx` : `View=directory/pipeline/history`, `PIPELINE_GROUPS` à **5** groupes visibles ; `pipelineActive` exclut `new`, archivés, convertis et perdus. | Sept étapes **visuelles décidées** mais 6 actives + Conversion historique ; `new` est **exclu par décision E72** tant que la prospection n’a pas démarré. |
| Nouveau contact | `submitProspect` crée `stage='new'` ; `startProspecting` tente `new → qualifying`. | Garder « Nouveau contact » sans prospection active tant que l'utilisateur ne la démarre pas ; **décision E72 : `new` reste hors « À qualifier »** ; entrée uniquement après transition volontaire `new → qualifying`. |
| Qualification | `prospectReadiness` et service de qualification : avertissements/contrôles ; `changeStage` propose une dérogation explicite quand qualification incomplète pour certains cas. | Respecter validation, consentement à avancer malgré manque, historique et champs source ; ne pas rendre la carte drag & drop permissive par CSS. |
| Prospect fiche | `ProspectDetailV2` inclus dans `ProspectsPageV2.tsx` ; panneau/desk, accordéons identité/recherche/qualification/besoins/devis/activités, température. | Fiche rapide + agrandie, conserver sélection/onglet/brouillons ; étendre UX-01 #83 et empêcher remounts quand accordéon ferme. |
| Devis Prospect | `src/renderer/crm/ProspectQuotePanel.tsx` : `quotes.finalize` = **prêt à envoyer**, `markSent`, relances, négociation, révision `duplicate`, `quotes.accept` = acceptation convertissant/rattachant Client. | **Finalisation commerciale ≠ `quotes.finalize`** ; besoin d'un **marqueur explicite** de l'accord de principe, traçable, sans signature fictive. |
| Conversion service | `CrmService.convertProspectToClient` transactionnel ; lien `prospect.clientAccountId`, `stage='won'`, `won_at`, événement `converted_to_client`. Cherche Client existant organisation/contact avant création. | Vue « Conversion » **historique**, exclue des actifs ; ouvrir Client exact, jamais compter `lost` ou `won` sans Client lié ; idempotence. |
| Clients | `src/renderer/crm/ClientsPage.tsx` : `ClientsPageContent`, liste, fiche rapide/`largeView`, `relationshipStatus`, requête, filtre statuts, contacts, devis/projets/opérations/historique. | V2 : **8 onglets** validés ; interface existante n'en expose directement que 6 (`summary/contacts/contracts/documents/operations/history`). Commercial, Projets et Interventions doivent avoir des vues dédiées sans dupliquer les données. |
| Relations Client | `ClientRelationshipStatus = excellent/good/neutral/watch/difficult` ; indépendamment de `ProspectTemperature`. | Étiquette relationnelle explicite, note datée si saisie, pas un statut Prospect recyclé. |
| Annuaire central | `src/shared/crm.ts` : `DirectoryRelation = client/prospect/client_prospect/external`. Organisations et contacts restent liés aux deux entités. | Une organisation `client_prospect` **n'est pas** un deuxième Client ; centraliser coordonnées, éviter copies. |
| Projet commercial | `src/shared/projects.ts` : `prepareQuote/previewQuote/syncCommercial`, `commercialState=provisional/frozen` ; `ProjectCommercialService` révisions et conflits. | Réutiliser ce moteur ; **formulaire classique Projets liste uniquement devis acceptés**, préparer le pré-projet depuis Devis/Prospect et ouvrir le Projet existant, pas créer un doublon. |
| Repartir de zéro | Pas de méthode publique `deleteProject` établie dans `ProjectsApi` ; archivage de Projet existant et conflits par entité possibles. | **Capacité de remplacement du Projet entier non attestée** : un protocole sûr et atomique de détachement/réaffectation des liens est à développer/auditer, sans supprimer temps/fichiers. |
| Routage | `App.tsx` et `atoumweb:navigate` ; recherche ouverte par `entityType/entityId`. | Relier fiche Prospect → Devis courant → pré-projet → Client exact ; vérifier garde UX-01 avant changement destructif et retour dossier. |

## 3. Contrat de navigation métier entre modules (proposition de surface UI)
| Déclencheur | Destination | Invariants |
|---|---|---|
| Annuaire → Démarrer prospection | Prospect actif identifié | `new → qualifying` validée côté service ; pas de Client créé |
| Besoins → ouvrir catalogue | Catalogue consultatif | Sélection ≠ vente ; version/service visibles |
| Devis → Préparer Projet (non signé) | Aperçu du devis courant, puis Projet provisoire exact | Création volontaire, preuve de révision/empreinte, aucun statut accepté |
| Prospect → consulter Projet préparé | **Même Projet provisoire** lié au dossier commercial | Pas de doublon, code/ID, statut « non signé », lien retour Devis |
| Devis révisé → Synchroniser | Comparatif, conflits, Projet existant | Garde travaux faits et provenance ; n'efface pas les pages travaillées |
| Devis révisé → Repartir de zéro | Aperçu des pertes puis remplacement contrôlé | Ancien Projet retiré/archivé selon dépendances, un seul courant, transaction/rollback |
| Accord de principe déclaré | Finalisation visuelle | Trace volontaire avec identité/date/révision ; ne change pas `quote.status` en accepté |
| Devis réellement accepté | Client + projet figé | Abby et preuve, `quotes.accept`, Client ID et Projet courant préservé |
| Historique Conversion → Ouvrir Client | Client exact et historique Prospect | Aucun double compte, pas de fiche vide arbitraire |

## 4. Matrice des éditeurs à auditer avant code UX-01
- Prospect : identité, connaissance, qualification, besoins, devis, action, motif perdu, température/étape ; distinguer les sauvegardes immédiates des formulaires à valider. Vérifier les trois corrections #83 (archivage, suppression ligne Devis, accordéon).
- Client : coordonnées, relation, contact, action, besoins, documents, contrats. **Ne pas affirmer protection universelle** tant que raccordement individuel non testé.
- Projet prévisionnel : plan, Site/Page, ressources, affectations, conflit, chrono, notes ; ne pas confondre « dirty » UI et « révision du devis ». Sorties protégées avant navigation.
- Fenêtre Référence Prospect détachée : lecture/édition et événements coordonnés avec registre multi-fenêtres #83 ; ne pas recréer un second registre.

## 5. Ordre de développement futur après arbitrages, sans modifier main maintenant
| Étape | Travaux | Condition de sortie |
|---|---|---|
| 03A.1 | Relever HEAD, PR #81/#83/#84, routes réelles, transitions et services | Matrice `contrôle→handler→IPC→service→état→test` exhaustive **pour les pilotes seulement** |
| 03A.2 | Finaliser projection E59 des colonnes actives, accord de principe et Conversion historique | Règles explicites, aucune étape SQL ajoutée par raccourci |
| 03A.3 | Valider navigation devis non signé → pré-projet ; comparer/synchroniser/recommencer | Couverture des APIs existantes, manques de l'UI documentés |
| 03A.4 | Spécifier les 8 onglets Client sans duplications ni écriture du devis/contrat | Sources de chaque onglet, routes et erreurs |
| 03A.5 | Compléter Annuaire et protections des formulaires/fenêtres | Cas consultatif/personnel, séparation contacts/organisations |
| 03A.6 | Recette isolée, neuf combinaisons d'affichage, statut de CI sur code intégré | SHA, tests réellement effectués, validation humaine avant merge |

## 6. Recette proposée, non exécutée
| Test | Parcours | Résultat |
|---|---|---|
| R03A-01 | Création Prospect organisation/personne | Prospect `new` dans Annuaire, pas de Client |
| R03A-02 | Démarrer puis quitter qualification | États et dérogations respectés, brouillon préservé |
| R03A-03 | Passer via cinq groupes existants | Chaque transition réelle valide ; demande interdite refusée |
| R03A-04 | Température de Prospect | Ne change pas le stade ni qualité Client |
| R03A-05 | Lignes de devis non signées → projet prévisionnel | Projet lié à la bonne révision, 0 acceptation/Client |
| R03A-06 | Préparation sur un Prospect en attente de retour | Prospect **reste** dans cette étape, aucun passage automatique en Finalisation |
| R03A-07 | Devis révisé → Adapter | Le même Projet conserve travail, conflits ouverts visibles |
| R03A-08 | Devis révisé → Repartir de zéro | Ancien Projet géré sans perte cachée, nouveau Projet courant sans doublon |
| R03A-09 | Finalisation commerciale sans signature | Accord de principe tracé, pas de Client/facture |
| R03A-10 | Acceptation Abby du devis courant | Client créé ou rattaché une fois, Projet figé et prestations exactes |
| R03A-11 | Historique Conversion | Seulement Prospects avec `clientAccountId` réel, navigation exacte Client |
| R03A-12 | Client ayant un historique Prospect déjà lié | Ne crée pas un deuxième Client ni une copie d'organisation |
| R03A-13 | Brouillons/fermeture rapide/agrandie | UX-01 empêche sorties silencieuses, focus et onglet stables |
| R03A-14 | Historique perdu/archivé | Pas de confusion avec conversions, raisons et dates accessibles |
| R03A-15 | Recherche et filtres | Affiche population comptée, résultat homonyme ouvre le bon ID |
| R03A-16 | 3 thèmes × 3 densités, écran étroit, clavier | Compact principal 14 px cible, accès 17 modules conservé |
| R03A-17 | Tests services CRM/devis/projets et SQLite sur fixture | Intégrité FK, transaction/refus/rollback, Validation-MSI intacte |
| R03A-18 | Suite complète/CI sur futur code intégré | Résultats vrais, pas d'assertion de validation par ce document |

## 7. Points ouverts à ne pas inventer
- **E72 — CLOS :** `new` dans Annuaire seulement ; « Démarrer la prospection » déclenche `new → qualifying` et l’affichage en « À qualifier », après confirmation du service. Création d’un Devis ou d’un Projet prévisionnel = **aucune transition automatique**.
- **E73 — Finalisation** : marqueur d'accord de principe avec date/revision/possibilité de retour en négociation, sans faux `ProspectStage`.
- **E74 — Clients huit onglets** : emplacement exact du Commercial, Projets et Interventions compte tenu des six onglets actuels et des services accessibles.
- **E75 — Retour depuis Projet** : fonctionnement précis du lien vers Devis courant et son état « révision en attente », sans rendre un devis ancien modifiable.
- **E76 — Unicité conversion** : tester lien organisation/contact, révision devis et action `quotes.accept` dans sa vraie transaction.
- **E77 — Sécurité** : audit de chaque éditeur Client/Prospect/Projet sous UX-01 réellement intégré.

**Aucune demande de développement Codex n'est autorisée ici ; la PR #84 de CI demeure un chantier séparé.**

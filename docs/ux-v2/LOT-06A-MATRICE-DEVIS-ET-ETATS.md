# Lot 06A — Audit Devis et matrice des états, services, écrans et impacts

**Statut : comparaison statique + cible UX/UI V2 ; aucun code d'application changé, aucun test exécuté.**  
**Code examiné : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).** Les PR #81/#83 n'étaient pas encore intégrées lors de cet audit ; vérifier le HEAD à la reprise du développement.

Sources : [Lot 06](LOT-06-DEVIS-ABBY.md), [Lot 03 CRM](LOT-03-CRM.md), [04D associations](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md), [Lot 05 CGV](LOT-05-CONTRATS-CGV.md), [07P projets avant signature](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Le flux métier et ses frontières
`Prospect/Client → besoins → devis brouillon → lignes proposées → contrôles commerciaux et CGV → finalisé pour envoi → envoyé/vu → accepté OU négociation/refus/expiration → PDF Abby & Client/Projet`.

**Chemin de préparation parallèle :** dès un **devis non signé éligible** : `Aperçu du plan → Préparer un Projet prévisionnel → travailler / comparer et adapter / repartir de zéro en sécurité`. Ce chemin **ne signe pas** le Devis et ne crée pas automatiquement de Client.

**Deux notions à ne jamais rapprocher :** `quotes.finalize` = **figer et préparer le Devis pour envoi**, **pas** `ProspectStage Finalisation` (accord de principe) ; `quotes.accept` = **acceptation attestée dans Abby**, conversion Client et effets opérationnels.

## 2. Inventaire vérifié
| Fichier / API | Comportement réellement observé | Risque / cible |
|---|---|---|
| `src/shared/commercial.ts` | Statuts `draft/sent/viewed/accepted/refused/expired/cancelled`; `finalizedAt` distinct de `status`. `QuoteApi` possède createWithLines, transitions, duplication, révision commerciale, options, Abby et PDF. | Ne pas inventer `finalized` comme statut SQL ; conserver les 7 statuts et les jalons. |
| `src/renderer/commercial/QuotesPage.tsx` | Liste, recherche, filtre, fiche latérale agrandissable, assistant **six étapes**, lignes, options, contrat, projet, aperçu et transitions. | Garder actions et contrôles métier, protéger la perte de brouillons et améliorer libellés / accès. |
| `QuotesPage` étape 1 | Choix Prospect/Client, public du contrat présélectionné selon identité, mais modifiable. | Vérifier réel public B2B/B2C du dossier ; ne pas supposer qu'organisation implique à elle seule une qualification juridique définitive. |
| `QuotesPage` étape 2–3 | Objet, besoin, offre ou service facultatif comme ligne de départ. | La présence d'une **ligne Service** avant l'offre ne doit pas faire croire que c'est l'offre principale ; choix libre toujours possible. |
| `QuotesPage` étape 4–6 | Lignes complémentaires, conditions, prévisualisation, puis `quotes.createWithLines`. | Aperçu **avant** création ne reflète pas toujours le **prix proposé** de l'offre, affichant le prix Catalogue courant : écart E151 à tester/corriger. |
| `QuoteService.create` | Crée `draft`, paramètres contractuels de départ, puis **change automatiquement le stade Prospect à `quote_to_prepare`**, y compris depuis `new` si Prospect non `won/lost`. | **ÉCART BLOQUANT UX2 E72 :** la création du Devis fait sortir un contact `new` de l'Annuaire seul **sans action « Démarrer la prospection »** ; besoin d'arbitrage du comportement et de correction du service, pas seulement d'un filtre visuel. |
| `QuoteService.finalize` | Contrôles commerciaux/opérationnels, gel CGV via `freezeQuote`, `finalized_at`, passage Prospect à `quote_to_send`. | Action à libeller « Finaliser pour envoi », avec avertissements, sans annoncer signature ou Finalisation du pipeline. |
| `markSent/markViewed` | Suivi d'envoi et de lecture **déclaratif** dans le Manager ; `markSent` impose `finalizedAt`. | Ne pas prétendre avoir réellement envoyé un mail depuis Manager ; distinguer événement enregistré de preuve d'envoi réelle. |
| `QuoteService.accept` | Accepte uniquement `sent/viewed`, exige lignes, contrôles de préparation et dossier projet, convertit/rattache Client, fige le même Projet prévisionnel, provisionne les ventes opérationnelles sous transaction. | **Action irréversible/à forte portée** : preuve d'acceptation Abby, bon devis/révision, destinations et contrôles nécessaires. |
| `QuotesPage.validateQuoteFromList` | Bouton **« Valider »** pour devis envoyé/vu appelle **directement `quotes.accept`** après `window.confirm`. | **E152 : libellé ambigu** ; « Confirmer accepté dans Abby » et résumé des conséquences obligatoires. Ne pas utiliser « Valider » comme simple validation de forme. |
| `QuoteService.duplicate` | Duplique identité, lignes/versions/snapshots et personnalisation des clauses ; `createCommercialRevision` est un chemin distinct reliant révision au dossier commercial. | Distinguer **copie indépendante** et **nouvelle révision du même dossier**, sans les fusionner et sans retoucher le devis source. |
| `QuoteOfferOptionsPanel` / `QuoteService.selectOfferOption` | Option ajoutée volontairement avec provenance `sourceOfferLineId + sourceComponentId` et protection contre duplicata. | Séparer Inclus / Option disponible / Recommandé ; ne pas acheter à l'affichage et ne pas dupliquer un service inclus. |
| `QuoteFinalizationPanel` / `QuoteContractPreparationPanel` | Blocages `blocking` et contrôles enregistrés, lien vers vrai champ. | Prévenir l'utilisateur que la vérification porte sur **les données enregistrées**, sans dire conforme juridiquement. |
| `QuoteAbbyPanel` | `commercialAbbyBlock` + copie via `contractTerms.copyText` ; **aucun envoi automatique**. | « Préparer Abby » est un **copier/coller guidé**, pas une API Abby en temps réel. |
| `QuoteClientPreview` / `quotes.generatePdf` | Prévisualisation client et PDF **de travail** réel, présentation contractuelle liée au Devis/snapshot. | Ne pas confondre ce PDF avec le PDF officiellement accepté dans Abby. |
| `QuoteContractDocumentPanel` | Import/référence PDF Abby **après acceptation**, historique des pièces conservé. | Bonne preuve et bon statut, ne pas affirmer PDF déjà reçu avant l'import. |
| `QuoteProjectPanel` | Bouton **Préparer le Projet** sur `draft/sent/viewed` avec `previewQuote/prepareQuote` ; projets acceptés par `transformQuote`. | Capacité UI existe déjà **dans le détail d'un devis avec lignes**. Remplacement total de Projet (07P) reste à concevoir sans suppression dangereuse. |

## 3. Matrice état → action → effet, à recetter
| État du Devis | Action | Effet permis / interdit |
|---|---|---|
| `draft` non finalisé | Ajouter ligne, modifier, supprimer, options, CGV/conditions, aperçu, préparer Projet | Devis éditable ; pas de Client automatiquement ; **ne pas déplacer Prospect new sans démarrage volontaire (E72)** |
| `draft + finalizedAt` | Marquer « Envoyé » | Contrat figé et prêt à envoyer ; envoi externe toujours une action distincte |
| `sent` | Marquer vu, entrer en négociation, accepter après preuve, refuser/expirer, créer révision | Rien n'est accepté sans confirmation documentée |
| `viewed` | Accepter après preuve, négocier, refuser/expirer, révision | Même règle ; lecture « vu » ne prouve pas une signature |
| `accepted` | Consulter version/CGV/projet figé, pièces Abby, opérations vendues | Modifier ligne/clauses refusé, Client exact et projet unique |
| `refused/expired/cancelled` | Historique et copie indépendante selon services ; relance nouvelle révision si permis | Aucun achat ni activation rétroactifs |

## 4. Deux incohérences réellement observées
**E151 — Prévisualisation de l'assistant** : à l'étape 6, l'offre de départ affiche `item.currentVersion.priceCents` même lorsqu'un `catalogPrice` proposé a été saisi à l'étape 3. L'enregistrement utilise le prix proposé via `createWithLines`. Risque de **montant aperçu différent du montant enregistré**. Vérifier et imposer une seule fonction de calcul/périmètre.

**E152 — Validation contractuelle ambiguë** : dans la liste et le détail, **« Valider » appelle `quotes.accept`** après confirmation ; le statut devient `accepted` et des opérations métier peuvent être provisionnées. Remplacer par **« Confirmer l'acceptation Abby »** avec garde/provenance et conséquences lisibles ; garder « Finaliser pour envoi » distinct.

**E153 — E72 contournée** : `QuoteService.create` fait progresser un Prospect `new` à `quote_to_prepare` même si personne n'a déclenché `startProspecting`. La décision AtoumWeb est explicite : `new` doit **rester Annuaire jusqu'au clic Démarrer**. Ce conflit doit être résolu **dans la logique métier et testé**, non effacé par les intitulés de l'interface. Si un utilisateur veut préparer un Devis avant la prospection active, cela doit être permis **sans entrée forcée dans le pipeline**, sinon demander arbitrage explicite.

## 5. Ordre recommandé avant développement
1. Relever HEAD `main` après la stabilisation CI/UX-01, auditer les handlers et leurs messages d'erreur.
2. Résoudre d'abord les **invariants E151–E153**, l'identité du Devis/révision et les droits d'acceptation.
3. Raccorder les parcours d'édition et les protections UX-01 existantes sur les sous-formulaires et la fiche.
4. Prototyper l'éditeur avec ses six étapes et ses transitions, réutiliser `QuoteService` et les panneaux spécialisés.
5. Rejouer les scénarios des sous-lots 06B–06F et les tests de non-rétroactivité sous SQLite fictif, sans Validation-MSI.

## 6. Recette initiale (16 scénarios prévus, non exécutés)
| ID | Cas | Attendu |
|---|---|---|
| R06A-01 | Créer Devis pour `new` non prospecté | Reste `new` si décision E72 inchangée ; pas d'entrée pipeline |
| R06A-02 | Démarrer prospection volontairement | Passe à `qualifying` et entre au pipeline |
| R06A-03 | Assistant complet six étapes | Identité et prix confirmés, même total aperçu/enregistré |
| R06A-04 | Prix sur Devis différent Catalogue | Aperçu affiche prix proposé réellement retenu |
| R06A-05 | Devis brouillon | Lignes/CGV éditables et Projet provisoire préparé volontairement |
| R06A-06 | Finaliser pour envoi | Snapshot CGV figé, état Devis toujours distinct d'accepté |
| R06A-07 | Marquer envoyé | Statut `sent`, pas d'e-mail prétendument envoyé |
| R06A-08 | Marquer vu | `viewed`, aucune acceptation automatique |
| R06A-09 | Valider depuis liste | Doit devenir commande « Confirmer accepté Abby » avec garde |
| R06A-10 | Refuser/expirer | Ne devient ni Client ni Projet opérationnel |
| R06A-11 | Copier Devis | Nouveau numéro/dossier indépendant sans révision forcée |
| R06A-12 | Réviser commercialement | Deux devis liés au même dossier, version courante identifiable |
| R06A-13 | Option ajoutée volontairement | Une ligne, origine exacte, pas d'option implicite |
| R06A-14 | Accepter réellement le Devis | Client lié et Projet pertinent figé une seule fois |
| R06A-15 | Relire Devis ancien sans snapshot | Aucun CGV actuel injecté |
| R06A-16 | Typecheck/tests et sqlite isolé | Assertions et traces réelles, aucun accès Validation-MSI |

**Aucune correction SQL, UI, contrat ou validation métier n'est effectuée par cette spécification.**

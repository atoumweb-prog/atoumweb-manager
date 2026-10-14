# Lot 09F — Recette transverse et livraison Facturation / Dépenses / Documents / Word

**Statut : plan documentaire ; aucun test, fichier, facture ni développement exécuté dans ce lot.** Source code Manager main vérifiée le 09/10/2026.
Références : [09A audit](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md), [09B Facturation](LOT-09B-FACTURATION-ABBY.md), [09C Dépenses](LOT-09C-DEPENSES-ECHEANCES.md), [09D Archives](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md), [09E Word/PDF](LOT-09E-WORD-PDF-ALLER-RETOUR.md).

## 1. Invariants de sortie
1. **Abby émet officiellement la facture**, Manager suit l'origine réelle et archive/import PDF; aucun paiement/encaissement fictif.
2. **UX-14** : les 7 types de sources de Billing et les 5 statuts existants ont une signification précise; aucun statut payé/paiement bancaire sans service.
3. **Document probant protégé** : les pièces liées Devis et Facturation (en incluant les versions historiques) ne sont pas supprimables physiquement; la disparition d'un fichier ou sa corruption ne doit pas maintenir une fausse attestation.
4. **Dépense déclarative** : états, échéances et justificatifs liés à bonne identité, récurrence stockée sans occurrence inventée, remplacement de justificatif traçable.
5. **Word aller-retour** : seulement texte réellement éditable et versionnable; diff avant sauvegarde, validation humaine, aucune modification d'un Devis gelé/contrat publié en place.
6. **PDF de travail vs PDF Abby** : jamais confondus; aucune pièce Abby ne se crée à partir du seul export Manager.
7. **UX-01** sur tous les éditeurs et confirmations, fichiers ouverts et sélecteurs ; pas de perte de saisie ou changement d'ID en cas d'erreur.
8. **Validation-MSI** reste hors des tests, migrations, bootstrap et fichiers; utiliser SQLite fictif et arborescences temporaires strictement isolées.
9. Pas de validation juridique/comptable par la seule CI : obligations de conservation, facturation et clauses à contrôler séparément auprès des sources officielles françaises.

## 2. Séquence future d'implémentation
| Phase | Objectif | Garde |
|---|---|---|
| 09.0 | Relever HEAD réel après toute fusion de #81/#83, handlers, IPC, migrations, droits et provenance | Matrice UI → API → service → DB/fichier → test |
| 09.1 | **E259 PRIORITAIRE** : empêcher suppression physique de PDF facture lié, audit autres références | Tests preuve Devis/factures + FK ON DELETE SET NULL |
| 09.2 | **E258** : versions des justificatifs dépense et reprise en cas d'échec | Aucune ancienne pièce perdue |
| 09.3 | Recomposer BillingPage 09B et ExpensesPage 09C, onglets/filtres/contextes | Ne pas inventer règlement ou récurrence automatique |
| 09.4 | Navigation Documents 09D vers Bibliothèque/Éditeur existants | Réutiliser services contractuels, ne pas doubler les pièces |
| 09.5 | Étudier puis implémenter **Word aller-retour** 09E en une évolution séparée | Fidelity/diff/conflits éprouvés, pas d'édition historique figée |
| 09.6 | Tests services+IPC+SQL+fichiers, UX 3 thèmes × 3 densités et CI réelle au SHA testé | Autorisation humaine avant run payant et fusion |

**#81 reste le chantier Codex MSI de restauration ; aucune consigne ou changement sur #81/#83 n'est autorisé par ce dossier.** Les commits de PR #82 doivent utiliser **[skip ci]** pour les changements documentaires.

## 3. Matrice de recette transverse (25 cas futurs, aucun exécuté)
| ID | Test | Attendu |
|---|---|---|
| R09F-01 | Préparer facture intervention complète | Bonne origine, une entrée |
| R09F-02 | Devis accepté : acompte / solde | Source traçable et bonne révision |
| R09F-03 | Pack, dépassement ou abonnement | Sources réellement existantes seulement |
| R09F-04 | Import PDF Abby correct | Lien, référence et date |
| R09F-05 | Pièce facture autre Client | Refus |
| R09F-06 | Tentative état facturé sans PDF | Refus |
| R09F-07 | Facture PDF importée, paiement inconnu | Statut « Facturé », pas encaissé |
| R09F-08 | Supprimer PDF facture liée | Refus physique obligatoire (après E259) |
| R09F-09 | Supprimer PDF Devis signé | Refus actuel conservé |
| R09F-10 | Ouvrir pièce SHA invalide | Refus, alerte |
| R09F-11 | Document historique sans SHA | Absence conservée |
| R09F-12 | Dépense interne ponctuelle | Sans Client |
| R09F-13 | Dépense Projet Client incompatible | Refus |
| R09F-14 | Déclarer dépense payée | Simple statut déclaratif |
| R09F-15 | Dépense mensuelle avec échéance | Pas d'occurrence automatique supposée |
| R09F-16 | Remplacer justificatif | Ancienne pièce conservée/versionnée |
| R09F-17 | Naviguer Docs→Client→Facturation | Bon ID et sélection |
| R09F-18 | Archive/restauration document | Fichier, SHA et lien constants |
| R09F-19 | Export Word modèle brouillon | Texte/format/provenance |
| R09F-20 | Import Word et diff | Validation explicite et version |
| R09F-21 | Import Word sur clause publiée | Nouvelle version, pas mutation en place |
| R09F-22 | Import Word sur Devis gelé | Refus, snapshot inchangé |
| R09F-23 | PDF Manager préparatoire | N'est pas accepté/facturé Abby |
| R09F-24 | Formulaire dirty + erreur fichier | Pas de perte, UX-01 |
| R09F-25 | Suite de tests SQLite, fichiers temporaires, UI 3×3/CI | SHA et résultats réels, aucune Validation-MSI |

## 4. Preuves attendues lors de chaque PR de développement
- Liste des **sources réellement disponibles** de facturation, absence de statut encaissement non fondé et lien Abby explicite.
- SQL/FK et tests d'archives de facture liée/devis, journal des empreintes et version/doc existantes, chemins Windows sur fixtures.
- Essais de remplacement de justificatif y compris échec après copie, traitement des orphelins sans perte de preuve.
- Matrice DOCX de formes supportées (titres, paragraphes, listes, tableaux et styles), tests sur formats complexes, diff/conflits et refus d'import sur gel.
- Résultats ciblés, complets et CI hébergée après accord, trois thèmes × trois densités (Compact >= 14px), clavier et fenêtre réduite.
- Revue juridique/fiscale distincte des tests, conservation écrite des décisions et aucun merge sans accord.

## 5. Questions restant à résoudre
**E284** matrice complète des références probantes hors Devis/Billing; **E285** contrôle de disparition entre copie et insertion SQL; **E286** contrats de fichiers temps/métadonnées/versions; **E287** rôle d'Abby et rapprochements multiples; **E288** champs d'échéance/rappel réellement reliés; **E289** opérationnalisation du pipeline Word en sous-PR isolée.

**Bilan : six dossiers 09A–09F définis, 108 scénarios FUTURS (14 + 17 + 17 + 18 + 17 + 25), zéro recette exécutée.**

# Lot 06E — Préparer pour Abby, décisions contractuelles, révisions et Projet prévisionnel

**Statut : spécification métier/UX documentée, aucune acceptation ni modification de Devis effectuée.** Source `main@eb252d5c`, 09/10/2026.
Références : [06A](LOT-06A-MATRICE-DEVIS-ET-ETATS.md), [05E documents/proofs](LOT-05E-LECTURE-EXPORTS-PREUVES.md), [07P projet non signé](LOT-07-PROJET-PRE-SIGNATURE.md), [03B pipeline](LOT-03B-PROSPECTION-PIPELINE.md).

## 1. Ce que signifie vraiment « Préparer pour Abby »
Le Manager **prépare** les lignes, montants, références Abby, clauses et informations commerciales. L'émission et la gestion officielle du devis/facture restent chez **Abby**. Pas d'API payante supposée, pas de clic qui annonce à tort un envoi automatique.

- `QuoteAbbyPanel` utilise `commercialAbbyBlock(quote)` et `contractTerms.copyText` pour préparer un **bloc commercial copiable**.
- `ContractReadPanel` sait **Copier pour Abby** le texte du Builder provenant des valeurs enregistrées.
- `QuoteContractDocumentPanel` sait importer une référence/PDF accepté Abby sur un **Devis accepté**, conserver les historiques de pièces et ouvrir le PDF.
- `QuoteClientPreview` et `quotes.generatePdf` produisent un **PDF de présentation** dans Manager : **ce n'est pas la preuve officielle d'acceptation**.
- `QuoteService.accept` déclenche réellement **conversion/rattachement Client, gel commercial/contractuel et provisionnement de prestations opérationnelles** après contrôles. Ce n'est pas un simple bouton d'interface.

## 2. Séparation des décisions — libellés cibles
| Action UI | Service réel | Sens et effets |
|---|---|---|
| **Enregistrer le brouillon** | Création/édition de Devis et lignes | Met à jour la proposition, sans envoi ni acceptation |
| **Finaliser pour envoi** | `quotes.finalize` | Contrôle + gel de préparation CGV, prêt pour transmission externe, sans Client créé |
| **Marquer envoyé** | `quotes.markSent` | Trace humaine d'envoi externe, pas envoi d'email depuis Manager |
| **Marquer vu** | `quotes.markViewed` | Trace de lecture/retour, pas preuve de signature |
| **À négocier** | `crm.prospects.changeStage(...,'negotiation')` | Suit l'étape commerciale, laisse Devis source intact |
| **Créer une révision du même dossier** | `quotes.createCommercialRevision` | Nouveau Devis lié au dossier commercial/projet provisoire, ancienne proposition conservée |
| **Dupliquer comme nouveau devis** | `quotes.duplicate` | Copie **indépendante**, pas une révision du même dossier |
| **Confirmer accepté dans Abby** | `quotes.accept` | **Acte contractuel distinct**, Client, Projet, éventuelles ventes opérationnelles ; confirmation explicite et preuves |
| **Refuser / Expirer** | `quotes.refuse/expire` | Historique commercial, pas de conversion |
| **Ouvrir le PDF Abby** | `quotes.openContractDocument` | Consultation d'une preuve liée, aucun changement de statut |

**E152** : le bouton existant **« Valider »** de la liste/fiche appelle directement `accept` ; son libellé est trompeur. Le remplacer par **« Confirmer accepté dans Abby »** et rappeler les conséquences/numéro/révision. La validation de structure n'est **pas** l'acceptation.

## 3. Préparer pour Abby — interface cible
| Section | Informations utiles |
|---|---|
| Destinataire/Devis | Numéro, sujet, Prospect/Client identifié, statut et **révision courante** |
| Lignes | Code technique/Abby copiable mais non prioritaire à l'écran, libellés, quantités, unités, prix proposés, remises justifiées, total |
| Conditions | Montant/acompte ou arrhes selon paramètres, validité, délais, prestations réellement retenues |
| Contrat | Copie texte CGV propre du Builder, sans code Abby dans la lecture client, types/modules versionnés |
| Suivi | Date **déclarée** d'envoi/lecture, motifs négociation/refus, prochaine action |
| Acceptation | Confirmation distincte, pièce officielle Abby, référence et date/provenance, prérequis de preuve |
| Projet | **Préparer / ouvrir / comparer** Projet provisoire en parallèle sans signature |

Actions : **Copier les lignes**, **Copier les CGV**, **Prévisualiser le PDF de travail**, **Marquer envoyé**, **Confirmer accepté dans Abby** sous contrôle ; ne pas afficher « Envoyer à Abby » sans connecteur API installé. Les boutons copies ne doivent pas modifier le Devis.

## 4. Révisions commerciales et Projet avant signature
- Dès un Devis `draft/sent/viewed` avec des lignes, `QuoteProjectPanel` affiche déjà **Préparer le Projet** et un aperçu `projects.previewQuote` ; création volontaire via `projects.prepareQuote`. **Ce parcours existe en UI** et doit être rendu plus visible, pas réinventé.
- Lien de dossier commercial et **même Projet** tant que l'on choisit **Adapter** après changement de Devis. La commande **Repartir de zéro** (nouveau Projet en sécurité) reste un objectif 07P non attesté dans l'API.
- **Préparer le Projet ≠ accord de principe ≠ signature ≠ Client acquis**. Un Prospect peut être en attente du retour et préparer de son côté.
- La **révision du même dossier** préserve le lien logique avec Projet provisoire ; **dupliquer comme nouveau devis** ne doit pas réutiliser le dossier sans intention.
- L'acceptation Abby nécessite le **bon Devis/révision courant**, les CGV, preuve et affectations, puis fige le **même Projet préparé** (ou le nouveau Projet choisi après régénération), sans double création.
- Un Devis refusé ou expiré n'active aucune prestation. Le Projet prévisionnel existant doit afficher une décision humaine de suspension/archivage, sans effacer ses fichiers ni heures de préparation.

## 5. Preuves et nuances
- `quotes.accept` contrôle actuellement l'état `sent/viewed`, la présence des lignes, la préparation et le périmètre Projet avant conversion ; **c'est une commande à risque**. L'UI confirme un fait extérieur : les preuves Abby et l'attestation doivent être interrogées **selon les règles existantes** ; ne pas inventer un certificat juridique si la preuve n'a pas été reçue.
- L'import PDF accepté actuel se fait **après acceptation** ; la recette doit contrôler les situations où l'acceptation est marquée mais la pièce Abby reste **à rattacher**. Ne pas prétendre qu'un PDF est déjà lié si ce n'est pas le cas.
- Révisions Devis/fichiers Abby : une nouvelle proposition n'écrase pas le PDF d'un Devis accepté ; anciennes versions et empreintes restent consultables.
- En cas de conflit ou de saisie non sauvée, **aucun effet opérationnel ne doit être déclenché avant confirmation**.

## 6. Recette prévue (18 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R06E-01 | Copier bloc commercial Abby | Texte versionné et copié, zéro envoi |
| R06E-02 | Copier contrat pour Abby | Texte propre, aucun statut changé |
| R06E-03 | Générer PDF de travail | Distinct du PDF officiel Abby |
| R06E-04 | Finaliser puis marquer envoyé | Deux actes distincts avec historique |
| R06E-05 | Marquer vu | Pas d'acceptation automatique |
| R06E-06 | Clic « À négocier » | Prospect en négociation, devis envoyé préservé |
| R06E-07 | Révision commerciale d'un Devis lié à Projet | Nouveau numéro/révision, même dossier logique |
| R06E-08 | Duplication indépendante | Sans liaison involontaire au dossier/projet précédent |
| R06E-09 | Devis brouillon → aperçu projet | Aucun Projet créé avant confirmation |
| R06E-10 | Devis non signé → préparer Projet | Projet provisoire identifié, pas de Client/abonnement |
| R06E-11 | Réviser devis, choisir Adapter | Même Projet et travail existant conservés |
| R06E-12 | Réviser devis, choisir Repartir de zéro | Nouveau Projet courant, archive sécurisée de l'ancien, liens atomiques |
| R06E-13 | Accepter sans résolution des conflits Projet | Refus et message précis |
| R06E-14 | Confirmer l'acceptation Abby du bon Devis | Client créé/rattaché et Projet figé exactement une fois |
| R06E-15 | Devis confirmé accepté sans PDF encore importé | Statut de pièce manquante explicite, pas PDF imaginé |
| R06E-16 | Importer nouvelle version PDF Abby | Anciennes preuves et empreintes conservées |
| R06E-17 | Devis refusé avec pré-projet déjà travaillé | Aucune suppression silencieuse, suivi possible |
| R06E-18 | Tests services/SQLite/CI et UI multifenêtre | Aucun rollback partiel ni usage Validation-MSI |

## 7. Questions à confirmer avant développement
**E169** preuve minimale/documentation opérateur lors de `accept` sachant que le PDF s'importe après ; **E170** visualisation du dossier/révision actuel et de ses origines ; **E171** périmètre des actions disponibles selon statut et rôle ; **E172** remplacement sûr complet du Projet (dépendance 07P) ; **E173** reprise des pièces et statuts Abby en cas d'erreur.

**Les étapes sont des cibles UX liées à des fonctions déjà existantes ; aucune opération Abby réelle n'est effectuée par ce document.**

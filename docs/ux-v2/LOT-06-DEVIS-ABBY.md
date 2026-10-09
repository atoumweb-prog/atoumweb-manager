# Lot 06 — Devis, composition et préparation Abby
**Statut : spécification cible.**
## Objectif
Assistant de préparation commerciale, conservation de l'assistant Devis existant (6 étapes dans l'audit), édition confortable liste+composition+aperçu, sans concurrencer l'émission officielle de devis/factures par Abby.
## Parcours
Prospect/Client → besoin identifié → offre principale sélectionnée → compléments recommandés contextuellement → lignes **explicitement achetées** → contrôles → contrat client ordonné → `Préparer pour Abby` → référence/PDF officiel importé → preuve d'acceptation → projet lié.
## Fiche Devis
- Liste et recherche ; fiche rapide puis éditeur complet.
- Lignes : version catalogue, quantités, montants, ajustements/justifications existantes ; codes Abby disponibles uniquement dans les sections techniques/préparation.
- Offre principale priorise suggestions depuis relations administrables ; afficher raisons et aide `?`. Compléments inclus jamais facturés une deuxième fois ; tous les services accessibles.
- Révisions, duplication indépendante, finaliser, envoyer, accepter : **actions et conséquences différentes** et noms explicites.
- Panneau `Préparer pour Abby` : lignes/références/prix/copier, CGV propre, contrôles, référence Abby et PDF accepté ; pas d'envoi automatique prétendu.
- Prévisualisation client avec logo/identité, texte naturel. Export PDF/DOCX de travail ne se substitue pas au document officiel Abby.
## Règles
Snapshots prix et CGV à finalisation ; modifications ultérieures en révision ou nouvelle version autorisée ; preuve d'acceptation explicite ; projet prévisionnel même identifiant réconcilié sans production automatique.
Garde UX-01 : paramètres du Devis et administration contractuelle ne s'écrasent pas ; rafraîchissements ne détruisent pas les brouillons.
## Ordre proposé
[06A audit réel et matrice d'états](LOT-06A-MATRICE-DEVIS-ET-ETATS.md) ; [06B liste, assistant et édition](LOT-06B-ASSISTANT-LISTE-EDITION.md) ; [06C catalogue, options et prix](LOT-06C-COMPOSITION-CATALOGUE.md) ; [06D CGV et prévisualisation](LOT-06D-CONTRAT-PREVISUALISATION.md) ; [06E Abby, révisions et projet prévisionnel](LOT-06E-ABBY-REVISIONS-PROJET.md) ; [06F recette transversale](LOT-06F-RECETTE-ET-INTEGRATION.md). Les six dossiers sont **documentés uniquement**, aucune modification de l'application.
## Recette
Besoins non achetés restent hors devis/CGV/blueprint ; code Abby copiable ; finalisation avec contrôles ; PDF Abby lié ; retrait d'option déclenche recomposition contrôlée ; deux brouillons distincts ne s'écrasent pas.

## 09/10/2026 — Passage volontaire Devis non signé → Projet prévisionnel
AtoumWeb valide **« Préparer le Projet » depuis le devis courant non accepté**, sur les lignes proposées du devis (pas simplement des besoins prospect). La préparation est **interne et provisoire**, sans acceptation Abby, création Client, blocage contractuel ou facturation. Une révision majeure du devis propose de **synchroniser le Projet existant** ou **repartir de zéro depuis la révision actuelle**, avec confirmation et conservation des éléments ayant déjà reçu un travail/historique. L'acceptation/signature effective du devis demeure une transition contractuelle **distincte** et fige le Projet retenu. Ne pas confondre `quotes.finalize` (prêt à envoyer) avec `quotes.accept` (signature/acceptation).

Contrat et risques/recette : [Projet prévisionnel et régénération — Lot 07P](LOT-07-PROJET-PRE-SIGNATURE.md).

## Dépendance Lot 05 — Bibliothèque, Builder et preuve contractuelle
Les dossiers [05A audit](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05C rubriques](LOT-05C-RUBRIQUES-CONDITIONS.md), [05D Builder](LOT-05D-BUILDER-RESOLUTION.md) et [05E lecture/preuves](LOT-05E-LECTURE-EXPORTS-PREUVES.md) définissent la cible sans reconstruire le moteur existant. **Clause commune une fois**, seules prestations et options réellement ajoutées au Devis déclenchent leurs modules, présentation ordonnée par **sens juridique** après revue humaine. Avant signature, le Projet prévisionnel peut être préparé mais **n'accepte ni devis ni contrat**. Finalisation du Devis pour envoi ≠ signature Abby. Un snapshot `frozen` (même vide) ou `historical_missing` ne reçoit jamais de clause actuelle par rétroactivité. Word/DOCX aller-retour = travail futur à vérifier, aucun PDF préparatoire n'est une preuve d'acceptation.

## Audit du code et écarts concrets du 09/10/2026
- **Existant réel** : `QuotesPage` possède un assistant **six étapes**, une liste/fiche agrandissable, édition prix/remises/justifications, lignes et options avec source, preview et PDF de travail, CGV, Abby copier/coller et `QuoteProjectPanel` permettant **déjà** `previewQuote/prepareQuote` depuis un Devis non signé avec lignes. Ne pas reconstruire ces services.
- **E151 : aperçus de prix incohérents** : le wizard étape 6 affiche le **prix du catalogue courant**, pas nécessairement le **prix proposé** saisi étape 3. Le Devis réellement créé peut donc présenter un autre montant. Cible = preview fiable du prix et des quantités réellement enregistrés.
- **E152 : bouton trompeur** : « Valider » dans la liste et le détail appelle `quotes.accept`, **pas** un simple contrôle de forme. Cible = « Confirmer accepté dans Abby » avec conséquences Client/CGV/Projet/ventes opérationnelles clairement affichées.
- **E153 — priorité métier liée à E72** : `QuoteService.create` **déplace automatiquement** le Prospect `new` vers `quote_to_prepare`. Or AtoumWeb a **validé** que `new` reste dans l'Annuaire jusqu'à **« Démarrer la prospection »**. Il s'agit d'un **conflit du backend existant avec la cible**, à résoudre **dans le service et les tests**, pas seulement dans l'interface.
- **E169/E174** : `quotes.accept` traite l'acceptation à effets réels ; le PDF officiel Abby peut être **importé après acceptation**. Clarifier le parcours de preuve sans inventer signature/PDF déjà présent. Le PDF généré dans Manager est une **prévisualisation de travail**.
- **Révisions** : `createCommercialRevision` est distinct de `duplicate`. Projet prévisionnel du même dossier ≠ projet supplémentaire ; **Adapter** via service existant, **Repartir de zéro sécurisé** demeure à développer/valider (07P).
- **Frontière contrat** : `quotes.finalize` fige pour envoi, sans signifier accord de principe du Prospect ni acceptation du devis. Snapshot gelé vide et historique sans snapshot restent intacts.
- **Bilan documentaire** : 6 sous-lots, **109 cas de recette projetés** (16+17+18+15+18+25) ; aucun test V2 exécuté ni preuve juridique créée par ces documents.

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
06A analyse 6 étapes, actions et UX-04/05/06 ; 06B liste/éditeur ; 06C picker catalogue/suggestions ; 06D builder et prévisualisation ; 06E préparation Abby/snapshot/projet ; 06F recette.
## Recette
Besoins non achetés restent hors devis/CGV/blueprint ; code Abby copiable ; finalisation avec contrôles ; PDF Abby lié ; retrait d'option déclenche recomposition contrôlée ; deux brouillons distincts ne s'écrasent pas.

## 09/10/2026 — Passage volontaire Devis non signé → Projet prévisionnel
AtoumWeb valide **« Préparer le Projet » depuis le devis courant non accepté**, sur les lignes proposées du devis (pas simplement des besoins prospect). La préparation est **interne et provisoire**, sans acceptation Abby, création Client, blocage contractuel ou facturation. Une révision majeure du devis propose de **synchroniser le Projet existant** ou **repartir de zéro depuis la révision actuelle**, avec confirmation et conservation des éléments ayant déjà reçu un travail/historique. L'acceptation/signature effective du devis demeure une transition contractuelle **distincte** et fige le Projet retenu. Ne pas confondre `quotes.finalize` (prêt à envoyer) avec `quotes.accept` (signature/acceptation).

Contrat et risques/recette : [Projet prévisionnel et régénération — Lot 07P](LOT-07-PROJET-PRE-SIGNATURE.md).

## Dépendance Lot 05 — Bibliothèque, Builder et preuve contractuelle
Les dossiers [05A audit](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05C rubriques](LOT-05C-RUBRIQUES-CONDITIONS.md), [05D Builder](LOT-05D-BUILDER-RESOLUTION.md) et [05E lecture/preuves](LOT-05E-LECTURE-EXPORTS-PREUVES.md) définissent la cible sans reconstruire le moteur existant. **Clause commune une fois**, seules prestations et options réellement ajoutées au Devis déclenchent leurs modules, présentation ordonnée par **sens juridique** après revue humaine. Avant signature, le Projet prévisionnel peut être préparé mais **n'accepte ni devis ni contrat**. Finalisation du Devis pour envoi ≠ signature Abby. Un snapshot `frozen` (même vide) ou `historical_missing` ne reçoit jamais de clause actuelle par rétroactivité. Word/DOCX aller-retour = travail futur à vérifier, aucun PDF préparatoire n'est une preuve d'acceptation.

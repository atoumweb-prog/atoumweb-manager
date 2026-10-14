# Lot 05 — Bibliothèque contractuelle, contrats types et builder CGV
**Statut : spécification cible. Source normative détaillée : [CATALOGUE-CGV.md](CATALOGUE-CGV.md).**
## Objectif
Bibliothèque centrale de CGV générales, types de contrat, modules, clauses et versions ; accessible depuis Documents & Contrats, fiche catalogue onglet « Contrat & CGV » et Devis.
## Administration
Consulter, créer, éditer en brouillon, rattacher à offre/formule/service, visualiser les usages partagés, versions, publication contrôlée et historique. Référence centrale : **pas de clones divergents de clause**.
Chaque nouvelle prestation définit objet, inclusions, exclusions, obligations client, modalités, délais/dépendances et limites contractuelles applicables.
## Assemblage
- CGV communes une seule fois, clauses spécifiques **pour services achetés** uniquement.
- **Classement par rubrique logique** et rang configurables, pas empilement brut par produit : objet → périmètre → exécution/obligations → délais/livraison → finances → droits/responsabilités → récurrence applicable → fin de relation.
- Une clause sur la facturation de maintenance se place dans la rubrique finances.
- Déduplication de même clause/version ; collisions, contradictions ou clauses proches signalées, **jamais fusion juridique automatique**.
- Titres, numérotation, renvois propres ; texte final client naturel sans codes Abby, IDs internes, placeholders ni répétitions.
## Interface
Sommaire gauche, lecture client centrale, avertissements/provenance panneau facultatif ; prévisualiser le contrat complet avant publication d'une offre, ajuster rang depuis la bibliothèque ; `Copier pour Abby` en texte propre.
## Documents
PDF de présentation, Word éditable, import Word comparé, historique ; aucune importation ne réécrit un contrat/devis finalisé. Le contrat fait partie du devis, preuve d'acceptation Abby distincte et protégée.
## Ordre proposé
[05A audit des clauses/types/versions et preuves](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md) ; [05B bibliothèque et éditeur](LOT-05B-BIBLIOTHEQUE-EDITOR.md) ; [05C rubriques et conditions](LOT-05C-RUBRIQUES-CONDITIONS.md) ; [05D Builder et conflits](LOT-05D-BUILDER-RESOLUTION.md) ; [05E lecture, Word/PDF et pièces Abby](LOT-05E-LECTURE-EXPORTS-PREUVES.md) ; [05F recette transversale](LOT-05F-RECETTE-CONTRACTUELLE.md). **Les six dossiers sont rédigés, uniquement en documentation.**
## Recette
Site vitrine + rédaction + maintenance : CGV communes uniques ; clauses pertinentes dans ordre intelligible, contrat lisible ; version plus récente ne change pas devis finalisés ; prépublication refusée si périmètre obligatoire manque.
## À arbitrer/vérifier
Ordre final juridique sur textes officiels validés, exigences de publication, contrôle Word de fidélité ; aucune prétention de conformité juridique par test logiciel.

## Bilan de conception — 09/10/2026
- **État réel :** services `ContractTermsService`, `ContractTypeService`, `QuoteContractPreparationService`, bibliothèque et Builder UI, présentations et preuves PDF Abby **déjà présents en code**, avec snapshots `draft/frozen/historical_missing` et contrôles de paramètres/pièces. **Ne pas recréer un second système**.
- **Écart principal V2 :** `compile` ordonne aujourd'hui les clauses par `sortOrder` ; la lecture est principalement structurée par source. **Les rubriques juridiques sémantiques ne sont pas encore un modèle canonique** ; classement humain avant éventuelle migration, sans changement des anciens devis figés.
- **Exports Word/DOCX et réimport comparé** = objectifs à concevoir/vérifier, non certifiés comme existants. PDF accepté Abby et archives de preuves restent distincts d'un export préparatoire Manager.
- **6 sous-lots 05A–05F, 98 scénarios de recette FUTURS** (12 + 15 + 14 + 16 + 16 + 25) et questions E123–E150 restant techniques/juridiques. Aucun test de ces spécifications n'a été exécuté.

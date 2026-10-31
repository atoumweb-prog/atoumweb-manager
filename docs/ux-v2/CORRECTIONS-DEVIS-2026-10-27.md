# Corrections et campagne des devis — 27 octobre2026

## Périmètre et état

Demande intégrale a6dcf0e5 : corrections A01–A13, reprise des14scénarios et10modifications, textes humanisés réellement rendus et parcours UI. Branche `codex/devis-corrections-validation-20261026`. Correctifs locaux et livrables de recette, pas de déploiement ni nouveau portable. Aucune publication de clauses, fusion, push ou modification de la base utilisateur47db9101.

## Réalisations

- Contrôles des champs contractuels nommés et résolution depuis les informations communes ; règles B2B/B2C/professionnel protégé conservées. Copie du contrat brouillon alignée sur les champs résolus. Versions publiées et sources des clauses préservées.
- Quantité et productCount supplémentaires synchronisés ; édition atomique, conflit de description personnalisée explicite. Contrôle de tranche avant préparation, aucun repricing non autorisé.
- Destinataire CRM structuré (société contractante ou personne), adresse/identification/contact/coordonnées dans le PDF, snapshot à la préparation et reprise exigée si l’identité ou les coordonnées changent avant envoi. Migration75 additive pour l’adresse des personnes, champ éditable dans Modifier le contact, protection des conflits Annuaire conservée.
- Échéanciers optionnels par ligne, choix explicite avec les modèles existants ; conservation des anciens échéanciers. Recalcul, arrondis, couverture des lignes, copie et retrait contrôlés. Synthèse initiale/récurrence49€/mois distinctes.
- Descriptions commerciales distinctes du besoin et références contractuelles par leur titre ; codes conservés en traçabilité.
- Deux versions annuelles complètes préparées dans la copie isolée depuis les références publiées Reference-V2 (WP2joursouvrés, WC1jourouvré). Pas de fréquence inventée ni prix changé. Adoption/publication toujours à décider.
- Prévisualisations documentaires : remplacement des articles structurés effectivement consommés par le PDF,25articles sur10 et35sur07 ; absence de mutation des118propositions ou de la bibliothèque.
- Pagination : petits périmètres intégrés à l’annexe, rappels redondants supprimés, titres conservés avec leur contenu, synthèse et dernière ligne liées. Aucun texte de clause supprimé.14 reste un document long avec tableau sur2pages commerciales, limite explicitement signalée.

## Preuves

[Ouvrir l’index](../../output/corrections-devis-20261027/Dossier-corrections/INDEX.html), [rapport intégral](../../output/corrections-devis-20261027/Dossier-corrections/RAPPORT.md), [A01 àA13](../../output/corrections-devis-20261027/Dossier-corrections/ANOMALIES-AVANT-APRES.md).

14PDF courants /129pages contre135,10PDF de modification,2PDF réellement humanisés, fiches JSON avant/après,14anciens PDF copiés sans régénération pour comparaison.103contrôles réussis ;10montants indépendants ; corps complets, aucun champ nommé non résolu ni caractère hors page dans les14devis.14exports via IPC contrôlés.8étapes UI réelles et affichage des3thèmes, zéro erreur console. Tests complets1729/1729 (204fichiers), puis75ciblés de présentation,13rendu/aperçus et71copie/transmission ; typecheck réussi. Les nombres ciblés ne s’ajoutent pas aux1729comme des tests distincts.

Source47db9101 en lecture seule, empreinte logique toutes tables conservée :5076902ef1e2da89b00e14739e5aa2ceee617f1e9b335cb09ba188af0c9ef6a7. Intégrité et FK des copies conformes. Aucune base SQLite incluse dans l’archive. Aucun faux médiateur ou condition TEST ne doit être repris en production.

Archive : `C:/Users/AtoumWeb/Downloads/AtoumWeb-Corrections-Devis-20261027.zip`.

## Décisions restantes

- A10 : définition du tarif global/progressif, seuils et remplacement de tranche. MOD08 affiche11supplémentaires/21au total et bloque la préparation de la tranche incohérente ; montant1699€ conservé, sans changement silencieux de19€ en17€.
- A09 etA11 : inclusions/exclusions manquantes et période initiale mariage à compléter dans des versions futures ou par un accord explicite au dossier. Hypothèses TEST identiques à la campagne initiale.
- A04 : relire puis décider de publier/adopter les propositions commerciales annuelles ; ce chantier ne l’a pas fait.
- Informations contractuelles réelles et validation éditoriale des118propositions avant adoption ; pas de certification juridique.

## Reprise

Examen de l’index et arbitrages ci-dessus. Ne pas relancer la campagne ni l’audit118sans changement pertinent. Sources/scripts : `scripts/campaign-corrected-quotes-20261027.cjs`, `scripts/ui-corrected-quotes-20261027.cjs`, runners/analyses dans `output/corrections-devis-20261027`. Les copies TEMP ne sont pas la base de recette utilisateur ; ne pas les déployer comme nouvelle base. Ancienne campagne conservée.

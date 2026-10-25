# Corrections du devis PDF — 25 octobre 2026

## Demande et réalisation

Carlos valide le design Atoum et l’architecture devis, périmètre, annexe et signature. Corriger le moteur et la préparation, sans refaire la présentation.

- Articles numérotés 1 à 35 dans leur ordre de lecture par rubrique. Corps, identifiants et versions inchangés. Présentations figées historiques conservées.
- Métadonnées d’articles explicites : titre de groupe avec premier article ; protection des titres et paragraphes ; unité « 1 an » sur une ligne. Paramètres compacts au début de l’annexe, références discrètes avec leur titre, acceptation commune explicite (prix, prestations, conditions particulières, clauses et CGV).
- Exemple complet ramené de 12 à 10 pages ; détail puis engagements en page 2, annexe à partir de la page 3, références et signature en page 10. Pas de suppression de clauses pour gagner des pages.
- Périmètre et engagements éditables par ligne : ponctuel/continu, date ou événement, durée, renouvellement/fin, exclusions, référence Catalogue publiée explicitement choisie. Sauvegarde atomique, protections de saisie conservées, aucune modification des prix ou de la version vendue.
- Calendrier distinct de la création et de la maintenance dans le document. Le résumé ne qualifie plus tout le dossier de fourniture continue. Les engagements non renseignés sont explicitement signalés.
- Paramètres par ligne contrôlés avant finalisation ; référence elliptique « mêmes exclusions/périmètre » insuffisante. Les données administratives, qualification, droits et autres gardes existantes restent applicables. Une prestation mixte n’exige plus une périodicité unique artificielle ; les jalons propres à chaque ligne peuvent satisfaire le calendrier d’exécution.
- Annotation explicite des produits : 10 inclus + 51 supplémentaires = 61 ; quantité 51 et PU 15 € restent inchangés. Aucun calcul de produits inventé à partir du seul nom d’une offre.

## Référence de maintenance retrouvée

Lecture seule de `C:/DEV/02_DONNEES/AtoumWeb/Reference-V2-20261015/data/atoumweb-manager.sqlite`, version publiée AW-MAINT-WC-M v2, identifiant `be472551-4393-43bd-b0d8-0b801b9d74fc`.
Périmètre : MAJ/sauvegardes/surveillance adaptées WooCommerce, 4 interventions mineures <=30 min, prise en charge sous 1 jour ouvré, contrôles boutique/tests/demandes. Exclusions : gestion quotidienne des commandes, refonte, urgence HNO, gros incident. Seuls ces descriptifs sont repris localement ; pas le prix mensuel. Durée annuelle de 12 mois issue de la version annuelle vendue. Début et renouvellement non inventés.

Cette reprise ne publie aucune version Catalogue et ne réécrit pas les snapshots annuels ou les anciens devis. Le JSON de périmètre adapté constitue l’engagement local du nouveau brouillon ; provenance et SHA du référentiel conservés dans son rapport de sauvegarde. La version mensuelle complète n’existe pas comme publiée dans le Catalogue courant : ne pas confondre ce rattrapage ciblé avec une migration globale du Catalogue.

## Contrôles réalisés

- Typecheck réussi ; 106 tests ciblés distincts réussis : CommercialRules11, quoteDocumentHtml8, ContractTerms20, QuoteContractPreparation39, QuoteTransmission28. Rejeu pertinent de19 après derniers ajustements d’affichage/validation, sans ajout au total distinct.
- Recette Electron native TEMP : 39 assertions, aucune erreur renderer ; édition et enregistrement réels d’un événement par ligne, prix conservé, même parcours Prospection/Devis, saisies protégées, copie réelle, Word et PDF réels, aperçu rendu/logo, thèmes. Première assertion ajoutée corrigée : mauvais nom de propriété de prix dans la fixture, pas une modification du prix applicatif. Contrôle visuel a révélé des champs trop étroits ; CSS corrigé, recette39 rejouée et capture relue.
- PDF final : 10 pages rendues et inspectées, 35 corps de clauses intégralement retrouvés après normalisation des espaces, numéros1–35, pagination continue, total3 344 €, 61 produits, unité annuelle inline, aucune référence elliptique restante. Stress14 pages, 30 paragraphes longs conservés. Résultats dans `output/pdf/20261025/VERIFICATION.json` ; captures dans `outputs/pdf-corrections-20261025`.
- Package reconstruit après correction CSS ; véritable exécutable : 31 assertions /12 visites /3 thèmes, aucune erreur console. Pas d’installateur.

## Livraison et conservation

Lanceur : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-91dedc1c/LANCER-LE-MANAGER.cmd`.
Source sauvegardée SQLite, lue seule : portable b0a192ca du23/10. Chaque ancienne ligne de chaque table vérifiée identique avant rebasing des chemins Projet dans la copie ; 118 modèles/118 versions, 3 devis/7 lignes et tous les prospects conservés. Intégrité/FK/registre74 conformes. `DONNEES-CONSERVEES.json` atteste cette étape.
Après cette copie, rattrapage ciblé sur trois paramètres de lignes du brouillon DEV-2026-003 seulement : natures d’exécution, comptes produits explicites, périmètre/exclusions/durée de maintenance. Toutes les lignes vendues, prix et snapshots strictement inchangés ; ni dates ni renouvellement fictifs. Sauvegarde avant rattrapage et rapport avant/après dans `Workspace/backups/perimetre-maintenance-20261025.json`.
Anciennes recettes et Manager natif inchangés. Le répertoire5b35da89 est une construction intermédiaire non livrée, marquée comme telle.

SHA app.asar : `91dedc1c81bcf6a25de19a2faaf06f6990238015c6b82aa29fd53d9e796fe407`.
SHA exe : `063b373afa0a8abb332c39ad0b877af4fc5ab367f1697a93bbf831087cb2f314`.
PDF exemple : `C:/Users/AtoumWeb/Downloads/DEV-2026-003-corrige-Atoum-20261025.pdf`, également dans `Apercu-PDF` de la livraison.

## Limites et prochaine action

L’exemple applique20 clauses spécifiques sur copie TEMP uniquement (35 au total). Le devis utilisateur conserve son assemblage existant : comparaison visible et application explicite dans Conditions et CGV. Aucune approbation juridique05C ni publication Catalogue automatique.
Identité/SIRET/adresse/TVA réels demandés à Carlos, réponse non reçue au moment de cette livraison. Dates/événements et conditions de renouvellement restent à convenir. PDF exemple marqué BROUILLON ; les gardes bloquent la finalisation incomplète. Le texte d’acceptation n’est pas une certification juridique ; communication préalable et acceptation des conditions, principe de l’article1119 du Code civil : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032040866/2026-07-16 .
L’acceptation indépendante d’Abby, décidée précédemment, reste à implémenter : ne pas la déclarer réalisée par ce lot de corrections PDF. Abby reste destiné à la facturation.
Prochaine action : recette Carlos sur cette livraison, compléter les données réelles puis vérifier le PDF définitif avec ces valeurs. Pas de push/fusion/CI/installateur/Bridge.

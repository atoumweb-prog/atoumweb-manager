# Lot 06 — Matrice conservatrice des 109 scénarios R06A à R06F

**Date :** 14 octobre 2026. Sources : référentiel UX/UI V2 [PR #82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), HEAD `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`. Candidat : [PR #124](https://github.com/atoumweb-prog/atoumweb-manager/pull/124).

**Règles de notation :** `PARTIEL` signifie qu'un test existant ou une inspection de code couvre une partie du scénario, **pas** que le scénario complet a réussi. `NON CERTIFIÉ` signifie qu'aucune preuve individuelle suffisante n'est reliée ici ; cela ne prouve pas que la fonctionnalité manque. Aucun PASS exhaustif attribué sans test de bout en bout associé explicitement au scénario.

**Dernière campagne certifiée avant ajout du contrôle Electron PDF :** [CI #1287](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38598224879), SHA `4671f38c6866453790833267b0e4c7295b36350a` : 1 054/1 054 tests Vitest sur 111 fichiers, TypeScript, UX-01 Electron, recette Windows TEMP. Le nouveau scénario de double clic Abby doit être certifié par une CI ultérieure sur son propre commit.

| ID | Exigence du référentiel #82 | Couverture individuelle | Preuve identifiée ou action restante |
|---|---|---|---|
| R06A-01 | Créer Devis pour 'new' non prospecté : Reste 'new' si décision E72 inchangée ; pas d'entrée pipeline | PARTIEL | QuoteService.test.ts — E72 nouveau contact |
| R06A-02 | Démarrer prospection volontairement : Passe à 'qualifying' et entre au pipeline | PARTIEL | QuoteService.test.ts — E72 démarrage explicite |
| R06A-03 | Assistant complet six étapes : Identité et prix confirmés, même total aperçu/enregistré | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06A-04 | Prix sur Devis différent Catalogue : Aperçu affiche prix proposé réellement retenu | PARTIEL | quoteWizardPrice.test.ts — prix proposé, calcul |
| R06A-05 | Devis brouillon : Lignes/CGV éditables et Projet provisoire préparé volontairement | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06A-06 | Finaliser pour envoi : Snapshot CGV figé, état Devis toujours distinct d'accepté | PARTIEL | QuoteService.test.ts — finalisation avant envoi |
| R06A-07 | Marquer envoyé : Statut 'sent', pas d'e-mail prétendument envoyé | PARTIEL | QuoteService.test.ts — envoi distinct de finalisation |
| R06A-08 | Marquer vu : 'viewed', aucune acceptation automatique | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06A-09 | Valider depuis liste : Doit devenir commande « Confirmer accepté Abby » avec garde | PARTIEL | QuotesPage.tsx — action renommée et confirmation, sans UI individuelle |
| R06A-10 | Refuser/expirer : Ne devient ni Client ni Projet opérationnel | PARTIEL | QuoteService.test.ts — 06D refus sans conversion |
| R06A-11 | Copier Devis : Nouveau numéro/dossier indépendant sans révision forcée | PARTIEL | QuoteService.test.ts — duplication nouveau numéro |
| R06A-12 | Réviser commercialement : Deux devis liés au même dossier, version courante identifiable | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06A-13 | Option ajoutée volontairement : Une ligne, origine exacte, pas d'option implicite | PARTIEL | QuoteService.test.ts — option achetée explicitement |
| R06A-14 | Accepter réellement le Devis : Client lié et Projet pertinent figé une seule fois | PARTIEL | QuoteService.test.ts — acceptation sans double Client |
| R06A-15 | Relire Devis ancien sans snapshot : Aucun CGV actuel injecté | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06A-16 | Typecheck/tests et sqlite isolé : Assertions et traces réelles, aucun accès Validation-MSI | PARTIEL | CI #1287 — typecheck, Vitest, SQLite TEMP |
| R06B-01 | Rechercher numéro exact dans une liste filtrée : Bon Devis, contexte liste préservé | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-02 | Sélectionner Prospect homonyme : Bon 'prospectId', coordonnées non dupliquées | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-03 | Ouvrir détail puis Agrandir/Réduire : Même ID/brouillons/onglet | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-04 | Créer Devis libre sans Offre initiale : Devis autorisé selon règles de lignes et prix | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-05 | Parcourir 6 étapes puis revenir étape 2 : Toutes les saisies intactes | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-06 | Modifier conditions/validité : Messages précis en cas de champ invalide | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-07 | Aperçu après prix sur devis personnalisé : Affiche exactement le prix qui sera créé | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-08 | Fermer l'assistant sale : Garde UX-01, choix continuer par défaut | PARTIEL | check-unsaved-inputs-ui.cjs — brouillon et sortie gardée |
| R06B-09 | Fermer la fiche sale par Escape : Pas de perte de saisie | PARTIEL | check-unsaved-inputs-ui.cjs — Escape et brouillon |
| R06B-10 | Fermer par clic hors du panneau : Même garde, aucune suppression silencieuse | PARTIEL | check-unsaved-inputs-ui.cjs — fermeture backdrop |
| R06B-11 | Basculer entre deux devis avec éditeurs ouverts : Brouillons conservés ou confirmation de sortie | PARTIEL | check-unsaved-inputs-ui.cjs — A→B→A, brouillons |
| R06B-12 | Échec réseau en édition ligne : Saisie et édition persistent, erreur | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-13 | Liste « Valider » : Action renommée, confirmation de preuve et conséquences | PARTIEL | QuotesPage.tsx — confirmation Abby (lecture code) |
| R06B-14 | Fiche Devis avec Projet prévisionnel : Badge « non signé », pas de création Client | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-15 | Dossier Client et ancien devis accepté : Historique conservé en lecture seule | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06B-16 | Neuf thèmes/densités, clavier, fenêtre étroite : Compact texte principal >=14px et contrôles accessibles | PARTIEL | Recettes Windows — thèmes et ergonomie transversale |
| R06B-17 | Tests vitest/ciblés/IPC sur fixtures : Compte rendu SHA réel, Validation-MSI intacte | PARTIEL | CI #1287 — tests et SQLite TEMP |
| R06C-01 | Choisir offre principale publiée : Version + périmètre exacts | PARTIEL | QuoteService.test.ts — snapshot version |
| R06C-02 | Prix proposé différent du catalogue : Aperçu avant création et devis identiques | PARTIEL | QuoteService.test.ts + quoteWizardPrice.test.ts — prix proposé |
| R06C-03 | Prestation 'quote_only' sans prix : Alerte, non assimilée à gratuite | PARTIEL | quoteWizardPrice.test.ts — sans tarif |
| R06C-04 | Ajouter Service inclus dans Offre : Pas de ligne payante en doublon automatique | PARTIEL | QuoteService.test.ts — composants figés |
| R06C-05 | Consulter option non achetée : Total/CGV inchangés | PARTIEL | QuoteService.test.ts — non-achat |
| R06C-06 | Acheter option puis rejouer : Une ligne, origine snapshot | PARTIEL | QuoteService.test.ts — achat idempotent |
| R06C-07 | Retirer option avant finalisation : Ligne retirée selon service, CGV resynchronisées | PARTIEL | QuoteService.test.ts — retrait d'option |
| R06C-08 | Option historique sans ID composant : Pas de fausse provenance créée | PARTIEL | QuoteOfferOptionsPanel.tsx — origine manquante (lecture code) |
| R06C-09 | Conseil « SEO local » ignoré : Pas de Need/ligne/Projet nouveau | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-10 | Conseil ajouté volontairement : Ligne créée avec la bonne version publiée | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-11 | Modifier quantité d'une ligne : Recalcul serveur et justification conservée | PARTIEL | QuoteService.test.ts — quantité fractionnaire |
| R06C-12 | Remise en pourcentage avec motif : Valeur en centimes, raison stockée | PARTIEL | QuoteService.test.ts — remise 10 % |
| R06C-13 | Prix personnalisé et coût tiers réel : Pas de montant inventé | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-14 | Deux lignes même prestation, usages différents : Conserver si volontaire, alerter si duplicata non souhaité | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-15 | Retirer prestation déclenchant une clause : Signalement sync CGV sans perte de personnalisation | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-16 | Devis avec Projet prévisionnel déjà créé : Alerte de changement, pas d'effacement automatique du Projet | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06C-17 | Modifier Devis finalisé : Refus de modification en place, révision prévue | PARTIEL | Tests métier existants — options verrouillées après finalisation |
| R06C-18 | Filtres, thèmes/densités et SQLite fictif : Aucun doublon involontaire ni perte, tests à réaliser | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-01 | Préparer contrat pour Devis multi-services : Socle commun unique, clauses réellement applicables | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-02 | Option affichée non achetée : Pas de clause dédiée à l'option | PARTIEL | QuoteService.test.ts — option non achetée (CGV non tracée) |
| R06D-03 | Modifier une instance clause personnalisée : Bibliothèque source inchangée | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-04 | Changer public 'professional/consumer' : Bon périmètre et contrôles adaptés | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-05 | Informations administratives incomplètes : Avertissements et liens vers vrais champs | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-06 | Paramètres de paiement/garantie incomplets : Refus seulement sur contrôle métier réellement bloquant | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-07 | Clause vide/orpheline/placeholder : Garde de finalisation préservée | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-08 | Confirmer finalisation pour envoi : Snapshot et CGV figés, pas d'acceptation | PARTIEL | QuoteService.test.ts — finalisation unique |
| R06D-09 | Copier CGV avant signature : Contenu de la bonne version, aucun statut modifié | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-10 | Générer PDF de travail : N'est pas marqué accepté Abby | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-11 | Relire gel explicitement vide : Snapshot reste vide | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-12 | Relire historique sans snapshot : 'historical_missing', aucun rechargement depuis CGV courantes | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-13 | Réviser Devis finalisé : Nouveau Devis, ancien contrat/provenance inchangés | PARTIEL | QuoteService.test.ts — révision indépendante (CGV non tracée) |
| R06D-14 | Avertissements sur panneau alors qu'autre éditeur sale : Garde UX-01 et saisie préservée | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06D-15 | Trois thèmes × trois densités, clavier, SQLite isolé : Contrôles atteignables et rapport réel | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-01 | Copier bloc commercial Abby : Texte versionné et copié, zéro envoi | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-02 | Copier contrat pour Abby : Texte propre, aucun statut changé | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-03 | Générer PDF de travail : Distinct du PDF officiel Abby | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-04 | Finaliser puis marquer envoyé : Deux actes distincts avec historique | PARTIEL | QuoteService.test.ts — finalisation avant envoi |
| R06E-05 | Marquer vu : Pas d'acceptation automatique | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-06 | Clic « À négocier » : Prospect en négociation, devis envoyé préservé | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-07 | Révision commerciale d'un Devis lié à Projet : Nouveau numéro/révision, même dossier logique | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-08 | Duplication indépendante : Sans liaison involontaire au dossier/projet précédent | PARTIEL | QuoteService.test.ts — duplication historique |
| R06E-09 | Devis brouillon → aperçu projet : Aucun Projet créé avant confirmation | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-10 | Devis non signé → préparer Projet : Projet provisoire identifié, pas de Client/abonnement | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-11 | Réviser devis, choisir Adapter : Même Projet et travail existant conservés | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-12 | Réviser devis, choisir Repartir de zéro : Nouveau Projet courant, archive sécurisée de l'ancien, liens atomiques | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-13 | Accepter sans résolution des conflits Projet : Refus et message précis | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-14 | Confirmer l'acceptation Abby du bon Devis : Client créé/rattaché et Projet figé exactement une fois | PARTIEL | QuoteService.test.ts — acceptation idempotente |
| R06E-15 | Devis confirmé accepté sans PDF encore importé : Statut de pièce manquante explicite, pas PDF imaginé | PARTIEL | QuoteService.test.ts — PDF après acceptation |
| R06E-16 | Importer nouvelle version PDF Abby : Anciennes preuves et empreintes conservées | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-17 | Devis refusé avec pré-projet déjà travaillé : Aucune suppression silencieuse, suivi possible | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06E-18 | Tests services/SQLite/CI et UI multifenêtre : Aucun rollback partiel ni usage Validation-MSI | PARTIEL | CI #1287 — Vitest, Electron, SQLite TEMP |
| R06F-01 | Créer nouveau contact Annuaire : 'new', absent pipeline | PARTIEL | QuoteService.test.ts — E72 (partiel) |
| R06F-02 | Lui préparer un Devis sans démarrer prospection : 'new' conservé, aucune conversion | PARTIEL | QuoteService.test.ts — E72 création |
| R06F-03 | Démarrer volontairement sa prospection : 'qualifying', entrée pipeline | PARTIEL | QuoteService.test.ts — E72, intégration C05 |
| R06F-04 | Création 6 étapes avec prix proposé différent : Même aperçu, total et devis créé | PARTIEL | quoteWizardPrice.test.ts — prix calculé, wizard incomplet |
| R06F-05 | Ajout ligne Service libre ou Catalogue : Version exacte / prix sur devis pertinent | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-06 | Choisir Offre contenant des composants inclus : Aucun supplément non demandé | PARTIEL | QuoteService.test.ts — offre incluse |
| R06F-07 | Voir option sans l'acheter : Ni montant ni clause ni tâche | PARTIEL | QuoteService.test.ts — non-achat |
| R06F-08 | Acheter option puis rejouer : Une ligne, origine conservée | PARTIEL | QuoteService.test.ts — option idempotente |
| R06F-09 | Remise avec motif : Prix et justification enregistrés ; valeur exacte | PARTIEL | QuoteService.test.ts — remise en pourcentage |
| R06F-10 | Révision Devis avec CGV personnalisées : Ancien Devis inchangé, clauses adaptées avec contrôle | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-11 | Consulter suggestion 04D : Aucun ajout automatique | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-12 | Préparer CGV par public et lignes : Socle unique, clauses pertinentes et ordre intelligible | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-13 | Finaliser avec élément contractuel manquant : Refus/alerte selon vraie règle métier, aucune signature | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-14 | Finaliser correctement : Snapshot figé, prêt pour envoi seulement | PARTIEL | QuoteService.test.ts — finalisation |
| R06F-15 | Marquer envoyé/vu : Statuts déclarés, zéro appel Abby prétendu | PARTIEL | QuoteService.test.ts — envoi sans conversion |
| R06F-16 | Cliquer acceptation Abby sans preuve vérifiée : Confirmation et contrôles requis, pas de clic « valider » ambigu | PARTIEL | QuotesPage.tsx — confirmation Abby (lecture code) |
| R06F-17 | Préparer Projet depuis brouillon non signé : Même dossier commercial, Projet prévisionnel seulement | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-18 | Changer Devis puis choisir Adapter : Conserver travail et résoudre conflits, pas de double Projet | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-19 | Changer Devis puis repartir de zéro : Archive/retrait sécurisé et nouvelle liaison de dossier | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-20 | Accepter le bon devis et Client déjà existant : Pas de duplicata Client ni Projet | PARTIEL | QuoteService.test.ts — Client unique |
| R06F-21 | Accepter avec conflit Projet/affectation : Refus sans partiellement convertir ou provisionner | PARTIEL | Tests métier de Projet — rollback à tracer |
| R06F-22 | Importer PDF Abby après acceptation : Pièce/empreinte/provenance, historique | PARTIEL | QuoteService.test.ts — PDF après acceptation |
| R06F-23 | Relire devis historique gelé vide ou sans snapshot : Aucun recalcul CGV rétrospectif | NON CERTIFIÉ | Ajouter une assertion ciblée et tracer son résultat |
| R06F-24 | Sorties de sous-éditeur dirty, Escape, clic extérieur, changement d'onglet : Garde UX-01, aucune saisie perdue | PARTIEL | check-unsaved-inputs-ui.cjs — dirty/Escape |
| R06F-25 | 3 thèmes × 3 densités, clavier, SQLite FK/rejeu, suite CI : Résultats et SHA réels, aucune donnée Validation-MSI | PARTIEL | CI #1287 — TS, Vitest, Electron UX-01 |

## Synthèse de traçabilité

- **109/109** scénarios historiques recensés : 06A=16, 06B=17, 06C=18, 06D=15, 06E=18, 06F=25.
- **53** scénarios avec une **preuve partielle identifiée** ; **56** sans preuve individuelle reliée. Cela ne constitue ni 53 scénarios intégralement passés ni une estimation de développement.
- **GPT — Lot 06** : compléter les tests encore accessibles, prioritairement garde Abby, brouillons, navigation et réponses asynchrones ; reporter le SHA et le résultat de chaque recette.
- **Lot 04** : suggestions Catalogue, recherches et synchronisation des options ; **lot 05** : CGV, textes et export contractuel ; **lot 07** : Projet, révisions et conflits ; **humain** : validation visuelle des neuf modes, sens de l'acceptation Abby et adéquation juridique.
- Ne pas fusionner dans `main` sans autorisation explicite. Ne pas transformer cette matrice en 109 assertions automatisées fictives.

# Lot 06F — Recette Devis, contrats, Abby, CRM et Projet prévisionnel

**Statut : plan de recette, aucun test fonctionnel V2 exécuté ni nouveau code livré.** Audit de référence `main@eb252d5c` (09/10/2026).
Références : [06A audit](LOT-06A-MATRICE-DEVIS-ET-ETATS.md), [06B liste/assistant](LOT-06B-ASSISTANT-LISTE-EDITION.md), [06C composition](LOT-06C-COMPOSITION-CATALOGUE.md), [06D contrats](LOT-06D-CONTRAT-PREVISUALISATION.md), [06E Abby/Projet](LOT-06E-ABBY-REVISIONS-PROJET.md).

## 1. Règles générales d'acceptation de ce lot
- **Aucune création, aucun Prospect déplacé, aucun Projet, aucune acceptation de Devis** au simple affichage/choix d'un besoin ou suggestion. Déclenchement uniquement par action métier reconnue.
- La décision AtoumWeb **E72** exige que `stage=new` reste dans l'Annuaire jusqu'à **Démarrer la prospection**. **Conflit réel E153** : `QuoteService.create` déplace aujourd'hui le Prospect vers `quote_to_prepare`. Le corriger au **service** avec couverture de tests, tout en permettant de préparer un Devis pour un nouveau contact sans l'activer.
- E151 : un prix proposé différent du tarif du Catalogue doit être **identique** dans la prévisualisation puis le Devis créé, en centimes/quantité/mode de remise.
- **« Valider » ≠ « Confirmer accepté dans Abby »** : E152 renommer clairement et confirmer les conséquences réelles (Client, Contrat, Projet, prestation opérationnelle).
- Besoins, options disponibles et suggestions sont **non achetés**. Seulement lignes réellement sélectionnées, leur contenu inclus applicable et options achetées déclenchent clauses/blueprints.
- Contrat intégré et **snapshot `frozen`**, y compris vide ; historique `historical_missing` sans reconstruction. Pas de publication juridique automatique.
- Devis non signé → **Projet préparatoire volontaire** ; Devis révisé → Adapter / Repartir de zéro sécurisé ; acceptation réelle Abby → figer Projet courant après résolution. Aucun second Projet.
- Aucun faux envoi Abby ou email par l'application, PDF Manager de travail distinct de la pièce officielle Abby, historiques conservés.
- **Garde UX-01** de #83 à réutiliser après intégration, sans un second registre, sur assistant, sous-formulaires et navigations.
- **Validation-MSI ne sert jamais de fixture**. Les suites et migrations se font en base temporaire, avec restore/rollback.

## 2. Ordre de développement futur, sous autorisation distincte
| Phase | Travail | Critère de sortie |
|---|---|---|
| 06.0 | Relire `main` et #81/#83 effectivement intégrées, droits, IPC, migrations, tests et décisions E151–E173 | Matrice vue → handler → IPC → service → état/effets → preuve |
| 06.1 | Traiter **E153 E72 au service**, le prix de prévisualisation E151 et la commande d'acceptation E152 | Tests ciblés de non-régression et libellés non trompeurs |
| 06.2 | Réorganiser fiche/assistant 06B et catalogue de lignes 06C | Sauvegardes dirty protégées, états cohérents |
| 06.3 | Intégrer conditions, CGV et aperçu 06D | Revoir versions/contrats figés, fonctions de PDF existantes |
| 06.4 | Consolider Abby, révisions, pièces et Préparer Projet 06E | Preuves, liens ID exacts, aucune vente fictive |
| 06.5 | Tests unités/intégration/SQLite, **suite complète**, UI **3 thèmes × 3 densités**, CI au SHA exact et revue humaine | Aucun merge sans autorisation, bilan vérifié |

## 3. Recette transversale (25 scénarios prévus, aucun exécuté)
| ID | Parcours | Résultat |
|---|---|---|
| R06F-01 | Créer nouveau contact Annuaire | `new`, absent pipeline |
| R06F-02 | Lui préparer un Devis sans démarrer prospection | `new` conservé, aucune conversion |
| R06F-03 | Démarrer volontairement sa prospection | `qualifying`, entrée pipeline |
| R06F-04 | Création 6 étapes avec prix proposé différent | Même aperçu, total et devis créé |
| R06F-05 | Ajout ligne Service libre ou Catalogue | Version exacte / prix sur devis pertinent |
| R06F-06 | Choisir Offre contenant des composants inclus | Aucun supplément non demandé |
| R06F-07 | Voir option sans l'acheter | Ni montant ni clause ni tâche |
| R06F-08 | Acheter option puis rejouer | Une ligne, origine conservée |
| R06F-09 | Remise avec motif | Prix et justification enregistrés ; valeur exacte |
| R06F-10 | Révision Devis avec CGV personnalisées | Ancien Devis inchangé, clauses adaptées avec contrôle |
| R06F-11 | Consulter suggestion 04D | Aucun ajout automatique |
| R06F-12 | Préparer CGV par public et lignes | Socle unique, clauses pertinentes et ordre intelligible |
| R06F-13 | Finaliser avec élément contractuel manquant | Refus/alerte selon vraie règle métier, aucune signature |
| R06F-14 | Finaliser correctement | Snapshot figé, prêt pour envoi seulement |
| R06F-15 | Marquer envoyé/vu | Statuts déclarés, zéro appel Abby prétendu |
| R06F-16 | Cliquer acceptation Abby sans preuve vérifiée | Confirmation et contrôles requis, pas de clic « valider » ambigu |
| R06F-17 | Préparer Projet depuis brouillon non signé | Même dossier commercial, Projet prévisionnel seulement |
| R06F-18 | Changer Devis puis choisir Adapter | Conserver travail et résoudre conflits, pas de double Projet |
| R06F-19 | Changer Devis puis repartir de zéro | Archive/retrait sécurisé et nouvelle liaison de dossier |
| R06F-20 | Accepter le bon devis et Client déjà existant | Pas de duplicata Client ni Projet |
| R06F-21 | Accepter avec conflit Projet/affectation | Refus sans partiellement convertir ou provisionner |
| R06F-22 | Importer PDF Abby après acceptation | Pièce/empreinte/provenance, historique |
| R06F-23 | Relire devis historique gelé vide ou sans snapshot | Aucun recalcul CGV rétrospectif |
| R06F-24 | Sorties de sous-éditeur dirty, Escape, clic extérieur, changement d'onglet | Garde UX-01, aucune saisie perdue |
| R06F-25 | 3 thèmes × 3 densités, clavier, SQLite FK/rejeu, suite CI | Résultats et SHA réels, aucune donnée Validation-MSI |

## 4. Rapport exigé à chaque future PR de code
- SHA `main`, SHA de PR, fichiers de code/migrations, état des PR de sécurité, cas couverts/non couverts.
- Audit des commandes `quotes.createWithLines/finalize/accept/createCommercialRevision`, de la transaction d'acceptation et des snapshots.
- Matrice des effets déclenchés **Prospect/Client/Devis/Options/Contrat/Projet/Ventes opérationnelles**, y compris reprises/rejets.
- Test E153 `new` + création de Devis, E151 prix aperçu, E152 confirmation d'acceptation, quatre gestes de navigation dirty.
- Captures/contrôles UI **9 combinaisons**, 1280×720 et fenêtre étroite, clavier/focus, modes de lecture et retour à la fiche Client/Prospect.
- Preuves SQLite isolation, FK et rollback, tests ciblés, suite complète et CI exacte ; aucune mutation de Validation-MSI.
- Approbation humaine distincte avant toute fusion, surtout sur actions de vente/acceptation et contrats.

## 5. Points non résolus
**E174** matrice exhaustive des droits et vérifications de consentement pour `quotes.accept`, PDF Abby parfois importé après acceptation.  
**E175** stratégie de sauvegarde croisée avec les sous-éditeurs/événements en temps réel.  
**E176** source unique et identité de révision commerciale/Projet, sans confusion duplication indépendante.  
**E177** métier tarifaire de l'aperçu et moteur de centimes au service, incluant formules `quote_only/actual_cost`.  
**E178** actions/états dans le routeur CRM↔Devis↔Projet↔Client et prises de décision dangereuses.

**Six sous-lots 06A–06F documentés, aucune recette exécutée ni application modifiée.**

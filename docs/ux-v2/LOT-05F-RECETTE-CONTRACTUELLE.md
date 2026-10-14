# Lot 05F — Recette transversale et stratégie de livraison des contrats

**Statut : conception et matrice de recette futures, aucune exécution ni modification du Manager.**
**Audit : main@eb252d5c (09/10/2026).**
Références : [05A](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05B](LOT-05B-BIBLIOTHEQUE-EDITOR.md), [05C](LOT-05C-RUBRIQUES-CONDITIONS.md), [05D](LOT-05D-BUILDER-RESOLUTION.md), [05E](LOT-05E-LECTURE-EXPORTS-PREUVES.md).

## 1. Invariants
- **Contrat intégré au Devis** : l'acceptation se vérifie selon la procédure Abby et ses pièces, sans signature fictive lors d'un aperçu, d'une copie, d'un export ou d'une préparation de Projet.
- **Socle CGV une fois**, clauses des prestations **effectivement retenues** et options achetées uniquement, versions exactes et sources traçables.
- **Versions publiées et snapshots figés immuables** : l'édition ne concerne que brouillons et instances avant gel. Un gel vide reste vide ; les devis historiques sans snapshot restent sans snapshot.
- Une clause peut être partagée sans duplication, les personnalisations d'instance ne changent pas le modèle commun.
- Le **classement sémantique** est une nouvelle cible et exige examen du texte de chaque clause, pas un tri automatisé par service.
- **Publication technique et revue juridique ne sont pas équivalentes**. Aucun test n'atteste de la conformité des clauses.
- PDFs officiels, empreintes et historiques des pièces ne sont ni écrasés ni supprimés en silence.
- **Validation-MSI n'est jamais utilisée comme fixture** : bases/fichiers de recette fictifs, isolés et restaurables.

## 2. Ordre de réalisation recommandé, après approbation
| Phase | Travaux | Condition de sortie |
|---|---|---|
| 05.0 | Relever HEAD après éventuelles fusions autorisées #84, #81, #83 ; auditer les migrations et handlers | Matrice vue → handler → IPC → service → table → test |
| 05.1 | Bibliothèque et éditeurs 05B, droits et protections UX-01 | Éditeur conservé sans brouillon perdu |
| 05.2 | Classer **humainement** les clauses en rubriques 05C, décider section/rang, migration additive éventuelle | Aucun reclassement fictif, anciens Devis inchangés |
| 05.3 | Builder 05D, comparateur et alertes, ordre/numérotation/renvois | Instances correctes, snapshots historiques inchangés |
| 05.4 | Lecture/Abby/pièces et DOCX futur 05E | Provenance/empreintes vérifiables, pas de second contrat |
| 05.5 | Recette ciblée/complète et UI 3 thèmes × 3 densités, CI au SHA réel et revue humaine | Bilan tests avec cas non couverts, accord humain avant merge |

## 3. Matrice de recette (25 scénarios à exécuter ; aucun exécuté ici)
| ID | Parcours | Attendu |
|---|---|---|
| R05F-01 | Créer clause commune brouillon | Une seule référence canonique, pas publiée |
| R05F-02 | Créer type avec plusieurs modules | Ordre du type visible sans applicabilité fictive |
| R05F-03 | Clause liée à deux services | Un seul ID, deux liens et historique |
| R05F-04 | Publier nouvelle version après revue | Ancienne conservée, Devis figés intacts |
| R05F-05 | Audience consommateur | Clauses et contrôles du public effectivement concernés |
| R05F-06 | Audience professionnel | Clauses et contrôles du public effectivement concernés |
| R05F-07 | Prévisualiser un contrat type | Aucun Devis/Client/Projet créé |
| R05F-08 | Besoin Prospect sans Devis | Aucune clause commercialement acceptée |
| R05F-09 | Devis vitrine + contenu | Socle unique et modules achetés seulement |
| R05F-10 | Vitrine + contenu + maintenance | Paiement maintenance en finances, quota/récurrence séparés |
| R05F-11 | Option non achetée | Pas de clause de l'option |
| R05F-12 | Acheter option depuis snapshot | Clause applicable et origine vérifiable |
| R05F-13 | Même clause requise par deux lignes | Une occurrence, origines multiples |
| R05F-14 | Textes potentiellement contradictoires | Alerte, aucune fusion juridique automatique |
| R05F-15 | Instance personnalisée devenue orpheline | Avertissement, contenu non effacé silencieusement |
| R05F-16 | Paramètre, pièce ou information manquante | Contrôle bloquant/alerte selon règle validée et champ identifié |
| R05F-17 | Prévisualiser contrat client | Rubriques/numéros/renvois, pas de codes internes |
| R05F-18 | Copier texte pour Abby | Copie du contenu enregistré, aucune acceptation |
| R05F-19 | Finaliser le Devis pour envoi | Snapshot figé, pas de signature implicite |
| R05F-20 | Modifier bibliothèque après gel | Ancien texte/snapshot inchangé |
| R05F-21 | Relire gel explicitement vide | Vide conservé, aucune compilation du jour |
| R05F-22 | Relire historique sans snapshot | Absence historique conservée |
| R05F-23 | Importer/remplacer PDF accepté Abby | SHA, version active, ancien document et provenance conservés |
| R05F-24 | Export/import DOCX lorsque livré | Fidélité titres/listes/tableaux ou avertissement, diff, validation humaine |
| R05F-25 | Garde UX-01, 3 thèmes/3 densités, clavier, tests FK/CI | Zéro perte, aucune Validation-MSI et preuves SHA |

## 4. Preuves attendues de chaque PR de code future
- SHA de base/HEAD, périmètre de fichiers, migrations, données synthétiques isolées, captures et résultats exacts.
- Matrice complète de conservation des contrôles, instances, versions et pièces Abby ; vérification contre les anciens Devis acceptés.
- Compte rendu de revue **juridique humaine** (séparé de la CI) sur les textes et rubriques concernés ; références officielles et niveau de risque.
- Tests métier ciblés, tests complets, CI hébergée au SHA de la PR, 3 thèmes × 3 densités, petit écran et clavier.
- Conflits/sauvegardes/backups testés, aucun second registre UX-01, aucune suppression de preuve liée ; accords de fusion distincts.

## 5. Décisions techniques ouvertes
- **E146** : validation humaine des textes et rubriques avec sources officielles, public, date et risques.
- **E147** : matrice des handlers/IPC et vue Client Contrats, Documents & Contrats, Devis.
- **E148** : schéma section/rang et migration sans reconstitution de texte légal ancien.
- **E149** : périmètre exact de l'aller-retour DOCX et traitement des formats complexes.
- **E150** : politique documentaire des preuves Abby, intégrité et conservation juridique.

**Clôture documentaire 05A–05F ≠ recette exécutée ni certification juridique.**

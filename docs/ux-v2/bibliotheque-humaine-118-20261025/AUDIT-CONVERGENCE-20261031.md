# Audit de convergence des 118 propositions — 31 octobre 2026

Statut : **audit reproductible terminé ; aucune clause publiée, adoptée ou injectée en base**. Source machine : [`AUDIT-CONVERGENCE-20261031.json`](AUDIT-CONVERGENCE-20261031.json). Commande : `node scripts/audit-contract-convergence.cjs`.

## Relation Git vérifiée

- PR #158 : `codex/internal-reference-handoff-20261027` vers `main`, brouillon ouvert.
- PR #159 : `chatgpt/humanisation-maintenance-socle-20261028` vers la branche de la PR #158, brouillon ouvert.
- La PR #159 est donc empilée sur la PR #158. Son commit de tête audité est `c7f73f2c48457528ac5e73e09122b0fc331694ef`.
- Branche d’audit isolée : `codex/contract-convergence-audit-20261031`, créée depuis ce commit.

## Intégrité du registre

| Contrôle | Résultat |
| --- | --- |
| Propositions | 118 |
| Codes uniques | 118 |
| Clauses publiées exportées | 118 |
| Correspondance code / ID modèle / ID version | 118 / 118 |
| Corps source et SHA-256 identiques à l’export | 118 / 118 |
| Scope | 19 `base`, 99 `catalog` |
| Audience | 105 `all`, 10 `consumer`, 3 `professional` |
| Dépendances déclarées | 28, toutes résolues, aucune boucle sur soi |
| Approbation / publication / adoption documentaire | 0 / 0 / 0 |

Le registre peut donc être rapproché sans ambiguïté des versions publiées du 27 octobre. Les textes publiés et leurs associations n’ont pas été modifiés par la PR #159.

## Catalogue maintenance vérifié

Les quatre références ont été introduites ensemble le 3 octobre 2026 dans le commit `1ed1152c` depuis `AtoumWeb_Catalogue_V1_Contractuel_consolide.xlsx` :

- `AW-MAINT-WP-M` : 49 €/mois ;
- `AW-MAINT-WC-M` : 99 €/mois ;
- `AW-MAINT-WP-A` : 539 €/an ;
- `AW-MAINT-WC-A` : 1 089 €/an.

Les offres annuelles n’ont donc pas remplacé les mensuelles. Elles correspondent à onze mensualités pour douze mois et doivent rester des variantes facultatives choisies expressément, sans renouvellement annuel implicite. Les anciennes lignes `Gestion WordPress` et `Gestion WooCommerce` de l’export opérationnel sont rapprochées explicitement des codes mensuels par le manifeste de reprise ; elles ne constituent pas les identités canoniques.

## Écarts commerciaux bloquants

1. **Hébergement isolé.** `AW-TECH-HEBERG-WP` reste publié à 99 €/an, sans les 50 € de Lune dédiée. Les propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-PERIMETRE` et `MAINT-RENOUVELLEMENT` décrivent 149 €/an.
2. **Migration.** `AW-TECH-MIGRATION-AW` facture 99 € une « Migration vers hébergement AtoumWeb ». La décision récente distingue le transfert interne AtoumWeb gratuit et la migration depuis un hébergeur externe sur devis.

Ces deux écarts doivent être résolus par de **nouvelles versions Catalogue en brouillon**. Les prix et versions actuellement publiés ne doivent pas être écrasés.

## Limite de versionnement découverte

Deux propositions changent aussi le titre :

- `APP-GARANTIE` : « Garantie corrective 90 jours » → « Garantie corrective de l’application » ;
- `WEB-AR` : « Corrections et allers-retours » → « Étapes de relecture et de correction ».

Le schéma actuel versionne le corps d’une clause, mais le titre reste porté par le modèle commun. Modifier ce titre immédiatement altérerait l’affichage de toutes les versions, y compris historiques. Il faut donc versionner le titre ou conserver temporairement le titre publié avant d’importer ces deux propositions.

## Préparation technique réalisée

Un import éditorial distinct a été préparé et testé sans être raccordé à la base utilisateur. Il vérifie les 118 origines, simule sans écriture, puis crée atomiquement 118 nouvelles versions `draft`. Il ne modifie ni les modèles publiés, ni les devis, ni les snapshots. Son rejeu est neutre et toute dérive de provenance provoque un rollback complet.

La migration 76 rend aussi le titre propre à chaque version. Les deux nouveaux titres peuvent ainsi rester dans leurs brouillons sans modifier les versions historiques. Sur base mémoire : **118 brouillons créés, 118 versions publiées conservées, 0 publication indirecte**.

Les contradictions commerciales ne bloquent donc plus la préparation purement technique des textes. Elles bloquent toujours leur convergence métier, leur adoption et toute publication.

Un plan Catalogue séparé prépare désormais, uniquement sur base de test, six versions brouillon : les quatre maintenances avec leur détail opérationnel et leurs prix inchangés, `AW-TECH-HEBERG-WP` à 149 €/an et `AW-TECH-MIGRATION-AW` en mode « sur devis ». Le plan exige les six identifiants publiés contrôlés, refuse une dérive, est idempotent et ne publie aucune version. Il n’a pas été appliqué à la base utilisateur.

Le prochain lot sûr est :

1. relire humainement les six brouillons Catalogue préparés ;
2. raccorder l’import des 118 textes et le plan Catalogue à des commandes explicites de l’interface ;
3. vérifier les assemblages après application dans une copie de recette ;
4. valider les 14 scénarios avant toute proposition de publication.

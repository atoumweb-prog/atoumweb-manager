# Lot 05C — Rubriques contractuelles, rangs, conditions d'applicabilité et conflits

**Statut : conception UX/UI V2 et évolution possible du modèle — aucune migration exécutée.**
**Lecture : `main@eb252d5c` au 09/10/2026.** Références : [05A audit](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05B bibliothèque](LOT-05B-BIBLIOTHEQUE-EDITOR.md), [05D assemblage](LOT-05D-BUILDER-RESOLUTION.md), [CATALOGUE-CGV](CATALOGUE-CGV.md).

## 1. Problème fonctionnel à résoudre
Aujourd'hui `ContractClauseTemplate.sortOrder` et `ContractTypeVersion.moduleIds` ordonnent des clauses/types, et `ContractTermsService.compile` assemble un texte numéroté selon l'ordre des **instances du devis**. Le composant de présentation `formatContractPresentation` regroupe essentiellement par **origine** (`base/catalog/custom`), non par **sujet juridique**. Les conflits d'ordre entre certains types sont signalés, pas arbitrés sémantiquement.

**Cible décidée :** organiser **une seule fois** les clauses applicables selon leur sujet réel, puis assembler dans un **ordre de lecture cohérent**, même si plusieurs offres et options sont présentes dans un devis.

### Exemple déterminant
La clause sur **le règlement de la maintenance** doit se ranger sous **Conditions financières**. Une clause sur **les cycles d'intervention/quotas/renouvellement** peut figurer dans **Prestations récurrentes**. La famille « Maintenance » ne décide **pas à elle seule** où toute clause de cette famille se place.

## 2. Rubriques logiques proposées (ordre de référence, à valider sur textes)
| Clé de conception | Rubrique visible | Contenu attendu |
|---|---|---|
| `object` | 1. Objet et parties | Objet, champs d'application, prestations contractées |
| `scope` | 2. Périmètre et exclusions | Inclus, exclusions, limites, prérequis, personnalisations |
| `execution` | 3. Exécution et collaboration | Obligations des parties, matériels, accès, validations, dépendances |
| `delivery` | 4. Délais, livraison et réception | Jalons, corrections, recette, acceptation des livrables |
| `finance` | 5. Conditions financières | Paiement, acompte/arrhes selon dossier, facturation, retards, devis |
| `rights` | 6. Droits, données et responsabilités | Propriété intellectuelle, contenus/fichiers, confidentialité, données personnelles, responsabilité |
| `recurring` | 7. Prestations récurrentes | Cycles, quota et fenêtres opérationnelles, renouvellement/résiliation si concernés |
| `end` | 8. Fin de relation et dispositions finales | Restitution, clôture, règlement des différends et dispositions générales |

**Ces rubriques sont une grille éditoriale cible, PAS un classement juridique définitivement validé.** La position de chaque clause doit être examinée au regard du texte réel et, si nécessaire, d'une revue juridique officielle (Lot 05). Une rubrique peut rester absente d'un Devis lorsque non applicable.

## 3. Métadonnées candidates, sans inventer des champs SQL déjà existants
| Information | Utilité / effet | Réalité du code |
|---|---|---|
| `sectionKey` | Rubrique sémantique stable d'une **version de clause**, distinguée du libellé traduisible | **NON constatée** dans `ContractClauseTemplate/Version` courant |
| `rankInSection` | Rang dans la rubrique, indépendamment du produit qui a déclenché la clause | Existence de `sortOrder` global, **pas** du couple section/rang |
| `audience` | `all/professional/consumer` | **Existe** sur la clause |
| `scope` | `base/catalog` | **Existe** ; détermine l'origine, pas le sujet |
| `requiredWhen` | Condition de présence (type de ligne réellement retenue, option achetée, public, abonnement, événement pertinent) | Applicabilité catalogue/public existe ; **expression conditionnelle fine non attestée** |
| `excludes/requires` | Incompatibilités ou dépendances entre clauses | **Non attestées** comme modèle canonique d'incompatibilité juridique |
| `reviewEvidence` | Statut/revue/source/date, avertissement de dépendance | Métadonnées `review` disponibles, **sans validation juridique automatique** |
| `sourceClauseVersionId` | Version exacte et provenance de l'instance du Devis | **Existe** dans les instances |
| `isCustomized/isOrphaned` | Personnalisation du texte local et dépendance retirée | **Existe** dans les instances |

**Décision technique à prendre après audit** : stocker les rubriques/rangs sur **version de clause**, **template de clause** ou **référentiel de sections versionné** ; si migration, être additive, rejouable, préserver les devis historiques et refuser le classement implicite non vérifié. Une valeur `scope='catalog'` ne permet **pas** de prédire `sectionKey='scope'`.

## 4. Règles d'application et de dédoublonnage
1. Déterminer le **public contractuel du Devis** selon informations du dossier, sans inférer automatiquement B2B/B2C depuis un libellé.
2. Ajouter le **socle actif et publié** approprié au public, puis les modules **actifs/publiés** liés aux **lignes réellement présentes** et aux composants inclus applicables ; options **non achetées** exclues.
3. Si une même clause est demandée par deux produits, **une seule instance** de la référence canonique/version ; sa provenance peut citer les deux produits.
4. Si deux versions de la **même clause** sont candidates, **ne pas résoudre automatiquement** en prenant « la plus récente » : avertir, montrer l'écart et le contexte de version de Devis, demander un arbitrage explicite.
5. Si deux clauses proches, contradictoires, ou dont les conditions sont incompatibles sont simultanément éligibles, produire des **avertissements non destructeurs** ; pas de fusion de paragraphes ni réécriture juridique automatique.
6. Les dépendances et exclusions ne désactivent pas silencieusement une clause contractuelle personnalisée : afficher sa provenance et demander décision humaine justifiée ; conserver l'historique.
7. Trier par **rubrique sémantique → rang dans rubrique → clé stable** (une fois les métadonnées validées), pas par ordre des lignes/produits dans le devis.
8. La modification d'une association/type/rubrique **n'affecte que les futurs brouillons éligibles**, jamais le texte ou la numérotation des **Devis gelés**.

## 5. Cas concrets de composition
| Devis | Ce qui doit se produire |
|---|---|
| Site vitrine seul | Socle commun + modules réellement applicables au site, ordonnés dans les rubriques pertinentes |
| Site vitrine + rédaction | Socle unique, obligations client sur textes/images regroupées dans exécution/périmètre ; droits sur contenu dans droits si applicables |
| Site vitrine + rédaction + maintenance | **Paiement** maintenance dans finances, **cycles/quotas** dans récurrence, et uniquement si maintenance réellement achetée |
| Site mariage + retouche photos | Contrôles droits d'image/vie privée pertinents, clauses spécifiques déclenchées seulement si prestation réellement incluse/achetée |
| Devis incluant une option non sélectionnée | Aucune clause qui ne concerne que cette option |
| Projet provisoire non signé depuis ce Devis | L'aperçu contractuel reste préparatoire ; aucune clause « signée » par l'effet du projet |

## 6. Recette prévue (14 scénarios, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R05C-01 | Clause maintenance « paiement » | Rangée en finances, pas automatiquement récurrence |
| R05C-02 | Clause maintenance « quota » | Rubrique récurrence si applicable |
| R05C-03 | Clause catalogue sans rubrique confirmée | « À classer », jamais catégorisée arbitrairement |
| R05C-04 | Socle + deux services invoquant même clause/version | Une seule instance avec deux références de provenance |
| R05C-05 | Plusieurs modules type contrat | Le type ne déclenche pas une clause hors prestations achetées |
| R05C-06 | Clause `professional` et devis `consumer` | Clause pro exclue, écart signalé le cas échéant |
| R05C-07 | Deux versions concurrentes de même clause | Alerte, aucun choix muet de la plus récente |
| R05C-08 | Clause personnalisée devenue orpheline | Avertissement et intervention humaine avant retrait |
| R05C-09 | Déplacer rang d'une clause future | Ancien Devis figé strictement inchangé |
| R05C-10 | Incompatibilité non résolue | Prépublication/gel refusé **si** contrôle bloquant validé métier |
| R05C-11 | Option disponible mais non achetée | Aucune clause de l'option |
| R05C-12 | Contenu CGV source incomplet | Avertissement « revue requise », jamais « conforme » |
| R05C-13 | Groupe logique avec deux prestations | Numérotation/renvois cohérents, texte lisible |
| R05C-14 | Recette des ordres et migrations sur SQLite fictif | Pas d'altération des contrats/snapshots historiques |

## 7. Points à trancher avant le code
- **E128** : modèle exact `sectionKey` / `rankInSection`, endroit versionné et stratégie de migration sans données réelles.
- **E129** : classement humain des textes existants, **aucune analyse NLP ou migration aveugle** du sujet juridique.
- **E130** : degré de conditionnement par audience, option, quantité, plan/récurrence, et compatibilité avec le résolveur actuel.
- **E131** : ordre imposé par le type contractuel versus rang canonique de la clause ; règles de conflit/retour au Devis.
- **E132** : traitement de plusieurs versions de la même clause et collision réelle entre deux textes sémantiquement proches.
- **E133** : gestion des références croisées/numérotation après regroupement.

**Pas de création de rubriques SQL dans ce document, pas de nouvelle rédaction juridique, aucun devis ou contrat modifié.**

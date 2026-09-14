# Phase 5 — Catalogue métier configurable & règles commerciales AtoumWeb

## 1. Objectif

La future évolution de la Phase 5 ne doit pas créer une simple grille de prix séparée.

Elle doit **faire évoluer le Catalogue commercial déjà construit en Phase 2** pour en faire la source métier réutilisable des :

- devis ;
- projets ;
- contrats ;
- avenants ;
- éléments à facturer ;
- statistiques futures.

Règle structurante : **aucun second catalogue parallèle**.

Les tables et services existants `catalog_items`, `catalog_versions`, `offer_components`, `quote_lines` et leurs snapshots restent la fondation. Les migrations Phase 5 devront enrichir ce modèle sans casser les devis/projets historiques.

## 2. Principes de versionnement

- une prestation possède une identité stable ;
- ses tarifs et règles sont portés par une version ;
- une version publiée/utilisée devient historique ;
- changer un tarif crée une nouvelle version sans modifier les anciens devis, projets ou contrats ;
- les devis conservent un snapshot commercial ;
- les projets conservent le snapshot issu du devis accepté ;
- le contrat brouillon peut être prérempli depuis ce snapshot ;
- le contrat finalisé/signé devient immuable ;
- toute évolution après signature passe par un avenant ou un nouveau document selon le cas.

## 3. Données minimales d’une prestation

Chaque prestation/version doit pouvoir gérer au minimum :

### Identité et présentation

- nom de la prestation ;
- catégorie ;
- sous-catégorie ;
- description courte ;
- description détaillée ;
- actif / inactif / archivé ;
- ordre d’affichage ;
- visibilité éventuelle côté client/public.

### Tarification catalogue

- prix catalogue ;
- prix fixe ou `à partir de` ;
- prestation `sur devis` ;
- prestation gratuite/offerte si le catalogue le prévoit ;
- unité de facturation ;
- quantité par défaut ;
- paliers de volume ;
- prix selon palier ;
- récurrence éventuelle ;
- périodicité mensuelle ou annuelle ;
- durée de validité ;
- délai de prise en charge éventuel ;
- conditions particulières.

### Composition et options

- prestation incluse ou supplémentaire ;
- option obligatoire ou facultative ;
- options incompatibles entre elles ;
- dépendances/prérequis entre prestations ;
- inclusions/exclusions héritées du catalogue Phase 2 ;
- composition d’une offre à partir de versions de prestations.

### Tarification appliquée dans un devis

Le devis doit distinguer :

- prix catalogue ;
- prix appliqué ;
- remise en euros ;
- remise en pourcentage ;
- prestation offerte ;
- motif du geste commercial ;
- prix final ;
- quantité ;
- palier réellement appliqué ;
- valeur commerciale ;
- valeur contractuelle.

Les règles Phase 2 `adjustmentMode`, `adjustmentValue`, `discountReasonCode` et snapshots restent la base et devront être complétées plutôt que remplacées.

## 4. Rattachements métier

Une prestation issue du catalogue doit pouvoir être retrouvée/référencée depuis :

- Client ;
- Projet ;
- Devis ;
- Contrat ;
- Avenant ;
- `billing_item` si facturable ;
- Intervention/Maintenance lorsque pertinent.

Les rattachements ne recopient pas les données maîtres. Ils référencent les entités existantes et utilisent des snapshots lorsqu’un historique contractuel doit être figé.

## 5. Reprise automatique dans les contrats

La reprise contractuelle doit fonctionner ainsi :

`Catalogue versionné → Devis snapshoté → Projet snapshoté → Contrat brouillon prérempli → Contrat final figé`

Le contrat doit pouvoir reprendre automatiquement :

- prestations incluses ;
- options retenues ;
- quantités ;
- prix catalogue ;
- prix appliqué ;
- remises ;
- éléments offerts et motifs ;
- récurrence ;
- délais ;
- conditions particulières ;
- échéancier de paiement ;
- clauses conditionnelles liées au type d’offre/projet.

La modification ultérieure du Catalogue ne doit jamais modifier un contrat existant.

## 6. Modèle recommandé pour les extensions Phase 5

Sans figer les noms SQL définitifs, le modèle devra prévoir des extensions autour du socle Phase 2 :

- enrichissement `catalog_items` : catégorie/sous-catégorie/ordre ;
- enrichissement `catalog_versions` : description courte/détaillée, unité, récurrence, durée, SLA, conditions ;
- table de paliers tarifaires versionnés ;
- table de relations entre options : obligatoire, facultative, incompatible, dépendante ;
- enrichissement `offer_components` pour règles d’inclusion et dépendances ;
- snapshot du palier/règle appliqué dans `quote_lines` ;
- échéancier de paiement versionné/snapshoté pour les offres qui ne se résument pas à un simple acompte/solde ;
- champs Projet nécessaires aux règles métier E-commerce ;
- clauses contractuelles conditionnelles pilotées par les données snapshotées.

Tous les montants restent stockés en centimes.

## 7. Offre E-commerce — socle validé

### Tarif et paiement AtoumWeb

- offre E-commerce : **à partir de 1 490 €** ;
- échéancier AtoumWeb par défaut : **30 % à la commande / 40 % après validation structure-design / 30 % avant mise en ligne** ;
- l’échéancier doit être configurable/versionné pour permettre d’autres offres plus tard.

### Inclus dans le socle

- hébergement offert 1 an ;
- nom de domaine offert 1 an ;
- 3 pages commerciales incluses ;
- la page **Accueil est obligatoire** parmi ces 3 pages ;
- pages techniques WooCommerce hors quota ;
- pages légales hors quota ;
- page CGV fournie par le commerçant et intégrée par AtoumWeb ;
- jusqu’à 10 produits simples inclus ;
- jusqu’à 2 moyens de paiement standards inclus ;
- livraison standard incluse lorsqu’il s’agit uniquement d’un paramétrage simple WooCommerce.

## 8. Définition du produit simple

Un produit simple correspond à :

- une seule référence ;
- un prix principal ;
- aucune déclinaison obligatoire ;
- aucune configuration complexe.

L’intégration standard peut inclure les informations fournies par le commerçant :

- nom ;
- description ;
- prix ;
- image principale ;
- petite galerie ;
- catégorie ;
- SKU ;
- stock simple ;
- poids ;
- dimensions ;
- informations essentielles.

## 9. Produits simples supplémentaires — paliers validés

Au-delà des 10 produits simples inclus :

- produits **11 à 20** : **19 € / produit** ;
- produits **21 à 50** : **17 € / produit** ;
- produits **51 à 100** : **15 € / produit** ;
- **plus de 100 produits** : **sur devis**.

Le moteur de catalogue doit pouvoir représenter ces paliers sans code spécifique à WooCommerce afin que le même mécanisme soit réutilisable pour d’autres prestations à volume.

## 10. Automatisation / import de gros catalogue

Créer une prestation catalogue : **Automatisation / import de gros catalogue**.

Périmètre possible :

- CSV ;
- XLSX ;
- nettoyage de données ;
- mapping des colonnes ;
- import des produits ;
- import des images si possible ;
- catégories ;
- stocks ;
- synchronisation éventuelle.

Tarification : **sur devis**.

Cette prestation doit être indépendante des paliers manuels de produits simples et peut remplacer/compléter l’intégration manuelle selon le projet.

## 11. Produits variables

Prestations configurables :

- produit variable simple : **29 €** ;
- produit variable intermédiaire : **49 €** ;
- produit variable complexe : **sur devis**.

La définition précise des niveaux pourra être enrichie plus tard sans modifier les devis historiques grâce au versionnement du catalogue.

## 12. Pages supplémentaires

Prestations/règles validées :

- page supplémentaire : **79 €** ;
- contenus texte et images fournis par le client : **+39 €** ;
- rédaction AtoumWeb : **+99 €** ;
- recherche d’images : **+29 €**.

Règle d’incompatibilité : **+39 € et +99 € sont normalement alternatives pour une même page**.

Le modèle d’options doit donc supporter explicitement l’incompatibilité entre options et empêcher une combinaison incohérente, sauf éventuelle dérogation manuelle tracée.

## 13. Paiement E-commerce côté boutique

Jusqu’à **2 moyens de paiement standards** inclus parmi les solutions pertinentes, par exemple :

- Stripe ;
- PayPal ;
- virement ;
- chèque ;
- paiement à la livraison si pertinent.

Tout paiement nécessitant une intégration avancée est **sur devis**.

La notion de paiement boutique ne doit pas être confondue avec l’échéancier de règlement du client AtoumWeb.

## 14. Livraison E-commerce

### Livraison standard incluse

Incluse lorsqu’il s’agit uniquement d’un paramétrage simple à partir des règles communiquées par le commerçant :

- tarif fixe ;
- gratuité à partir d’un seuil ;
- retrait sur place ;
- zones simples.

### Livraison avancée

**Sur devis** dès qu’une intégration avancée est nécessaire :

- transporteur connecté ;
- point relais ;
- API ;
- génération d’étiquettes ;
- calcul dynamique ;
- logique/règles complexes.

## 15. Type de commerce obligatoire

Tout projet E-commerce doit avoir un champ obligatoire :

- `B2C` ;
- `B2B` ;
- `MIXTE`.

Ce champ est une donnée métier du Projet, issue du devis ou demandée avant transformation si elle manque.

Il doit pouvoir influencer les réglages, contrôles, prérequis et documents concernant :

- TTC / HT ;
- société ;
- SIRET ;
- TVA intracommunautaire ;
- comptes clients ;
- CGV ;
- tunnel de commande ;
- paiement ;
- livraison ;
- devis ;
- tarifs ou accès professionnels.

Le type de commerce ne doit pas coder en dur des textes juridiques : il active des règles/prérequis/clauses versionnés et contrôlables.

## 16. Maintenance WooCommerce

Prestation récurrente validée :

- **99 € / mois** ;
- hébergement inclus ;
- jusqu’à 4 interventions mineures ;
- prise en charge sous **48 h ouvrées**.

Le Catalogue doit stocker la récurrence, l’unité mensuelle, le nombre d’interventions incluses et le délai de prise en charge afin que ces valeurs puissent être reprises dans devis, contrat, abonnement de maintenance et suivi opérationnel.

## 17. Logique commerciale globale à conserver

Ne jamais perdre la distinction entre :

- prix catalogue ;
- prix appliqué ;
- remise ;
- prestation offerte ;
- motif ;
- prix final ;
- valeur commerciale ;
- valeur contractuelle ;
- facturé ;
- encaissé.

L’historique est obligatoire.

Une prestation offerte reste visible avec sa valeur catalogue et son motif ; elle n’est pas simplement supprimée du devis/contrat.

## 18. Contrats et clauses conditionnelles

Le moteur de contrats Phase 5 devra pouvoir sélectionner ou proposer des clauses selon :

- type de prestation/offre ;
- type de commerce B2C/B2B/Mixte ;
- échéancier de paiement ;
- hébergement/domaine inclus ;
- maintenance ;
- éléments offerts ;
- import catalogue ;
- paiement avancé ;
- livraison avancée ;
- options spécifiques.

Les clauses sont versionnées. Leur contenu est snapshoté dans le document final.

## 19. Abby

La Phase 5 conserve la règle validée :

- AtoumWeb Manager prépare et suit les éléments à facturer ;
- Abby reste la source des factures réglementaires en V1 ;
- les références/montants Abby peuvent être rapprochés des `billing_items` ;
- AtoumWeb Manager ne remplace ni Abby ni la comptabilité officielle.

## 20. Compatibilité avec les phases précédentes

La Phase 5 doit s’intégrer à l’architecture existante :

- Phase 1 : identité Client/Organisation/Contact inchangée ;
- Phase 2 : **Catalogue/Devis enrichis, jamais doublés** ;
- Phase 3 : Projet consomme les snapshots du devis accepté ;
- Phase 4 : Maintenance/Interventions/Packs restent leurs propres sources opérationnelles et alimentent la facturation ;
- Phase 5 : contrats, facturation, paiements, dépenses et échéances utilisent les références/snapshots existants.

Aucune migration Phase 5 ne doit réécrire rétroactivement les données commerciales historiques.

## 21. Critères d’acceptation spécifiques

Le chantier Catalogue métier est considéré valide si :

- un tarif peut être modifié sans recoder l’application ;
- une ancienne version de tarif reste utilisable pour comprendre un ancien devis ;
- les paliers produits simples calculent correctement le prix ;
- le seuil >100 peut basculer en `sur devis` ;
- les options incompatibles +39 / +99 ne peuvent pas être sélectionnées ensemble sans dérogation explicite ;
- un élément `sur devis` n’invente jamais de montant automatique ;
- prix catalogue, prix appliqué, remises, offert et prix final restent distincts ;
- un élément offert conserve son motif ;
- l’échéancier 30/40/30 E-commerce peut être repris dans le contrat et la facturation attendue ;
- le type B2C/B2B/Mixte est obligatoire pour un projet E-commerce ;
- la maintenance WooCommerce 99 €/mois est représentée comme prestation récurrente et non comme prix libre codé dans l’UI ;
- un contrat finalisé reste figé après changement du catalogue ;
- un avenant peut porter une évolution après signature ;
- Abby reste externe et les montants réellement facturés sont rapprochés sans écraser l’historique attendu.

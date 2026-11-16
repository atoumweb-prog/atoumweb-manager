# Fiche : suivi après vente (configurations opérationnelles)

Statut : **validée par Carlos le 16/11/2026** (réponses en section 7). Code et simulation faits ; écriture dans la préproduction seulement sur son accord explicite.

## 1. De quoi parle-t-on

Une configuration opérationnelle dit au Manager comment suivre un service **une fois le devis accepté** : abonnement par périodes, petites interventions incluses par mois, crédit d'heures, intervention au temps passé. Sans elle, la vente se fait mais aucun suivi ne se met en place dans Interventions et Maintenance.

Dans la préproduction actuelle : **aucune**. Retrouvées : les règles de 18 services, validées par AtoumWeb les 6 et 7 octobre 2026 (fichier `data/operations/atoumweb-operational-sales-v1.json`, et la base de recette du 19/10).

## 2. Les décisions des 6 et 7 octobre, en clair

Ces jours-là, AtoumWeb a validé la recette des 112 références de l'époque (94 en production « 8A », 18 en suivi « 8B ») sur une base de test. Pour le suivi, il a décidé :

- abonnements **de date à date** à partir du démarrage réel (pas au mois calendaire), facturation indépendante ;
- **quota par période** : les interventions non utilisées sont perdues à la fin de la période, sans report ;
- mensuel : continue jusqu'à résiliation ; annuel : 12 périodes, renouvellement sur accord exprès ;
- établissement Google supplémentaire : ajouté **au même abonnement**, pas un nouveau ;
- hébergement : mise en service comprise, avec une estimation spécifique au dossier ;
- Abby reste manuel, aucun paiement réel.

Le catalogue et le référentiel ont évolué depuis (pack V3.9.4 du 08/11, référentiel du 12/11, décisions du 11-12/11). D'où la comparaison ci-dessous.

## 3. Compatibilité des 17 configurations avec le catalogue et le référentiel actuels

| Service | Règle d'octobre | Catalogue et référentiel actuels | Verdict |
|---|---|---|---|
| Maintenance WordPress mensuelle / annuelle | 2 interventions de 30 min par mois, non reportables ; périodes de date à date | Identique (2 × 30 min, non cumulables) | **Compatible** |
| Maintenance WooCommerce mensuelle / annuelle | 4 interventions de 30 min par mois | Identique (4 × 30 min) | **Compatible** |
| Google Business Profile Premium mensuel / annuel | abonnement mensuel, rattaché à l'établissement | Identique ; la date de départ fixe les échéances | **Compatible** |
| Établissement GBP supplémentaire | ajouté au même abonnement Premium | Identique | **Compatible** |
| Suivi statistiques Premium mensuel | abonnement mensuel rattaché au site | Identique | **Compatible** |
| Dépannage WordPress, Ajustement technique WordPress, Petite évolution application | intervention au temps passé, minimum 1 h | 69 €/h, minimum 1 h, temps tracé | **Compatible** (ce seront des interventions, décision de Carlos du 16/11) |
| Packs d'heures 3, 5 et 10 h | crédit de 3/5/10 h, **validité 12 mois** | **validité 24 mois + 3 mois de prolongation gratuite**, décompte par quarts d'heure | **À corriger** : validité |
| Suivi statistiques Premium annuel | annuel : 12 périodes puis renouvellement exprès | décision du 11-12/11 : reconduction automatique permise pour le suivi statistique | **À vérifier** : reconduction |
| Renouvellement site mariage | annuel | reconduction automatique seulement si convenue | **À vérifier** : reconduction |
| Maintenance applicative | abonnement **mensuel** | référentiel : **échéance annuelle**, renouvellement sur accord exprès ; catalogue : sur devis, par mois | **À trancher** |

Le décompte par quarts d'heure des packs n'apparaît pas dans ces règles : je ne l'ai pas vérifié dans le module des packs.

## 4. Abonnements sans règle (à écrire ici) : proposition

Calquée sur les règles validées des services AW équivalents. Ce sont des **propositions** ; les durées des routines seront reprises du service équivalent puis à ajuster.

| Abonnement | Proposition | Calquée sur |
|---|---|---|
| GBP Essentiel mensuel (49 €) | abonnement mensuel, date à date, rattaché à l'établissement ; 2 publications et 5 réponses par mois | GBP Premium mensuel |
| GBP Essentiel annuel (539 €) | 12 périodes mensuelles, facturé à l'année, reconduction automatique selon contrat | GBP Premium annuel |
| Statistiques Essentiel mensuel (29 €) | abonnement mensuel, rattaché au site | Statistiques Premium mensuel |
| Statistiques Essentiel annuel (319 €) | 12 périodes, facturé à l'année, reconduction automatique selon contrat | Statistiques Premium annuel |
| Newsletter récurrente 1 envoi et 2 envois, mensuel (229 € / 429 €) | abonnement mensuel, 1 ou 2 envois par mois après BAT écrit, rattaché au client (compte Brevo au nom du client) | (nouveau) |
| Newsletter récurrente 1 et 2 envois, annuel (2 519 € / 4 719 €) | 12 périodes, facturé à l'année, reconduction automatique selon contrat | (nouveau) |
| Hébergement isolé Lune (149 €/an) | hébergement facturé à l'année, rattaché au site, mise en service avec estimation du dossier, reconduction automatique selon contrat | Hébergement WordPress d'octobre |
| Gestion de domaine (29 €/an) | suivi annuel de l'échéance, rattaché au site, **renouvellement sur accord exprès** | (nouveau) |

Préalable : ces 10 offres n'ont pas de code canonique dans la préproduction ; il faut leur attribuer leur code V39 (déjà connu dans le pack) pour que le Manager les relie.

## 5. Ce qui changera pour l'utilisateur

- Sur un devis contenant un de ces services : **date de début** et choix des périodes à renseigner sur la ligne avant l'envoi.
- À l'acceptation : l'abonnement, le crédit d'heures ou l'intervention se crée tout seul dans Interventions et Maintenance.
- Une maintenance démarre après les 30 jours de garantie : c'est la date de début saisie qui le porte (le Manager ne l'ajoute pas tout seul).

## 6. Décisions demandées à Carlos

1. Packs d'heures : validité **27 mois** (24 + 3 de prolongation gratuite) ou **24 mois** ?
2. Statistiques Premium annuel et renouvellement mariage : reconduction automatique selon contrat (décision du 11-12/11) ?
3. Maintenance applicative : abonnement mensuel, ou échéance annuelle avec renouvellement exprès ?
4. Abonnements V39 : les propositions de la section 4 conviennent-elles ?

## 7. Réponses de Carlos (16/11/2026)

1. Packs d'heures : validité **27 mois** (24 + 3 de prolongation gratuite).
2. Statistiques Premium annuel et renouvellement mariage : **reconduction automatique selon contrat** (déjà portée par les règles commerciales du pack du 08/11).
3. Maintenance applicative : **échéance annuelle, renouvellement sur accord exprès** (suivi facturé à l'année). Écart restant : sa règle commerciale du pack indique « pas de renouvellement » ; non modifiée (offre publiée), à revoir avec Carlos.
4. Abonnements V39 : propositions de la section 4 acceptées telles quelles.
5. Codes AW attribués aux 18 offres V39 : AW-SEO-GBP-ESS-M / -A, AW-DATA-SUIVI-ESS-M / -A, AW-NL-REC1-M / -A, AW-NL-REC2-M / -A, AW-HOST-LUNE, AW-HOST-DOMAINE, AW-WEB-BUSINESS, AW-WEB-VISIBILITE, AW-ECOM-BUSINESS, AW-ECOM-VISIBILITE, AW-BRAND-CHARTE, AW-BRAND-DUO, AW-NL-PONCT-SIMPLE, AW-NL-PONCT-COMPLETE.
6. Dépannage WordPress, Ajustement technique WordPress, Petite évolution application : **interventions** ; seul leur lien vers un modèle de projet est retiré, les modèles de projet réutilisables sont conservés. Une évolution applicative importante reste vendue comme projet (offre « Application / logiciel métier sur mesure »).

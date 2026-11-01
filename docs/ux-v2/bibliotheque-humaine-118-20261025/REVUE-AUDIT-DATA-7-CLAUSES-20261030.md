# Revue contractuelle — audit et mesure d'audience (30 octobre 2026)

**État :** réécriture documentaire uniquement dans la PR #159. Aucune approbation, publication, adoption, migration, modification des tarifs, ou mise à jour de devis et contrats déjà conclus.

| Code | Modification principale | Vérification avant toute adoption |
| --- | --- | --- |
| `AUDIT-PERIMETRE` | Audit limité aux points, données et accès prévus au devis ; recommandations et travaux correctifs distingués. | Livrables réellement vendus, accès demandés, absence de promesse de diagnostic exhaustif. |
| `DATA-ACCES` | Comptes client sous son contrôle autant que possible, droits minimaux, révocation selon l'acteur qui peut effectivement agir. | Inventaire des comptes et modalités d'accès et de révocation sur chaque outil. |
| `DATA-ANALYSE` | Analyse sur période et données convenues ; limites explicitées ; autres audits non compris par défaut. | Périmètre, livrables, date ou période de référence et qualité des données. |
| `DATA-CONSENTEMENT` | Gestion de consentement, refus, retrait et preuve selon solution ; exemption de traceurs seulement lorsque toutes les conditions sont réunies et documentées. | Outils exacts, finalités, catégories de traceurs, configuration avant consentement, rôles RGPD, accord article 28 le cas échéant. |
| `DATA-MESURE` | Événements mesurés selon devis, vérifications convenues ; limites liées aux navigateurs, bloqueurs et plateformes. | Tests de déclenchement, consentement, qualité du paramétrage ; pas d'exonération pour erreur d'AtoumWeb. |
| `DATA-SUIVI` | Fréquence de revue explicite ; pas de surveillance 24 h/24 incluse. | Cadence, canaux de restitution, éventuels engagements d'alerte distincts. |
| `DATA-TABLEAU` | Sources et indicateurs selon devis, limites des tiers distinguées de la responsabilité de paramétrage d'AtoumWeb. | Sources, droits, calculs internes, rafraîchissement, obligations de correction. |

## Points RGPD à ne pas perdre

- L'exemption de consentement n'est **pas automatique** parce qu'un traceur sert aux statistiques. Une exemption dépend notamment des finalités limitées à la mesure d'audience pour l'éditeur, de statistiques anonymes et de l'absence de suivi intersites ou de recoupement de données.
- L'utilisation d'un outil de gestion des cookies n'est **pas en soi** la preuve d'une configuration conforme ou d'un consentement valable.
- Le statut de responsable de traitement, de sous-traitant ou de responsables conjoints dépend du rôle réel de chaque partie. Un accord de sous-traitance conforme à l'article 28 du RGPD est nécessaire quand AtoumWeb intervient comme sous-traitant.
- Les limitations techniques de mesure ne suppriment pas l'obligation de réaliser correctement les prestations vendues.

## Références vérifiées

- CNIL, *Cookies : solutions pour les outils de mesure d'audience*, 4 juillet 2025 : https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience
- CNIL, *Questions-réponses sur les lignes directrices et la recommandation « cookies et autres traceurs »*, 29 avril 2026 : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ
- CNIL, *Responsable du traitement, sous-traitants : comment bien identifier son rôle ?*, 6 juin 2025 : https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role
- DGCCRF, *Devis* : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/devis

## Contrôles documentaires

- Total **118 clauses** ; **7 propositions** modifiées dans ce lot, **111** conservées à l'identique.
- Anciennes propositions conservées dans `previousEditorialProposal` et justification de la nouvelle passe inscrite dans `editorialRevision`.
- Textes sources, références, approbations, statuts et indicateurs de publication/adoption inchangés.
- Avancement **104/118 clauses revues**, **14 restantes**.
- Contrôles documentaires seulement : aucun test de PDF, aucune validation juridique globale et aucune mise en production.

**Contrôle commercial obligatoire :** ne pas appliquer automatiquement les clauses DATA à toutes les prestations web : leur présence dans un contrat doit dépendre des outils et actions effectivement prévus au devis.

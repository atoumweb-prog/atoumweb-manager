# AtoumWeb Manager — Revue finale des 14 clauses et clôture éditoriale (30 octobre 2026)

**Statut : finalisation des propositions documentaires, uniquement dans la PR #159 en brouillon.** Aucun changement des clauses publiées, des contrats signés, des devis existants, des prix, ni des approbations. **Ne pas fusionner ni publier automatiquement.**

## Synthèse — 14 propositions révisées

| Code | Objectif de la réécriture | Validation préalable requise |
| --- | --- | --- |
| `DEVWP-GARANTIE` | Corriger les défauts imputables, y compris intermittents, avec une durée fixée au devis ; distinguer les changements de besoin. | Durée/point de départ réels ; garantie légale des services numériques et éventuelles mises à jour obligatoires ; exclusions seulement causales. |
| `DEVWP-INTEGRATION` | Expliquer les connexions CRM/API/automatisations, dépendances et tests réellement convenus ; préserver la responsabilité de paramétrage. | Comptes, quotas, abonnements, tests, sous-traitants éventuels et flux de données. |
| `DEVWP-PERIMETRE` | Clarifier ce qui est inclus et le choix de l'architecture technique, sauf exigence expresse. | Fonctions, parcours, intégrations et limites contractuelles ; ne pas facturer une correction due. |
| `DEVWP-PI-REUTILISATION` | Séparer droits du client, licences, propriété des composants, savoir-faire générique et secret client. | Annexe des droits, composants réellement utilisés, GPL WordPress et licences tierces. |
| `DEVWP-PLUGIN` | Extension autonome installable et documentée, versions de référence connues avant acceptation, limites de compatibilité futures. | Versions WP/PHP, installations testées, documentation, licences et mises à jour légalement dues. |
| `DEVWP-RECETTE` | Contrôle au regard de critères validés, défaut constaté **ou** reproductible, aucun silence valant acceptation automatique. | Concordance avec `BASE-VALIDATION`, garantie et calendrier de vérification. |
| `LANDING-FORM` | Champs et traitement de formulaire au devis ; rôles RGPD réels ; connexions tierces non incluses par défaut. | Collecte, mentions d'information, destinataires, accord de sous-traitance au besoin. |
| `LANDING-GESTION` | Gestion mensuelle seulement si expressément souscrite ; extras soumis à devis accepté. | Offre réellement vendue, périodicité, prix et conditions d'arrêt ; aucune reconduction inventée. |
| `LANDING-PERIMETRE` | Une page par défaut sauf devis plus large ; étapes ou fonctions nouvelles distinctes. | Quantité de pages, formulaire, intégration et livrables convenus. |
| `REPRISE-EXISTANT` | Expliquer les limites d'un site tiers et le traitement transparent des contraintes découvertes. | Diagnostic de départ, traçabilité des défauts, accord écrit aux adaptations payantes. |
| `SERVICE-PACK-HEURES` | Solde, unité et période explicités ; dépassement sur accord ; prolongation si intervention demandée empêchée par AtoumWeb. | Conditions B2C, unité de décompte et date de validité ; différencier le pack de la maintenance mensuelle non reportable. |
| `SERVICE-PONCTUEL-PERIMETRE` | Intervention limitée au devis, pas de maintenance récurrente implicite, extras soumis à accord. | Prestation catalogue existante et absence de nouvelle ligne en doublon. |
| `SERVICE-TIERS` | Service externe distinct, frais inclus seulement si prévus, blocage signalé et responsabilité propre maintenue. | Conditions fournisseurs, coûts, dépendances et règles liées aux données. |
| `TECH-MIGRATION` | Transfert des éléments prévus, limites techniques et adaptation uniquement après accord ; migration interne AtoumWeb gratuite. | Croiser `TECH-HEBERGEMENT` et offres 149 €/an / Lune, migrations externes sur devis, restitution et contrats historiques. |

## Points transversaux protégés

1. **Pas de garanties légales neutralisées.** La garantie corrective commerciale ne réduit pas les garanties de conformité applicables, ni les mises à jour dues dans les cas prévus par la loi.
2. **Droits d'auteur et GPL.** Une cession / exclusivité est expresse et précise les usages autorisés ; les droits existants des logiciels libres ne sont pas effacés par les CGV. L'annexe de licence du livrable doit être vérifiée avant publication.
3. **RGPD.** Pour les formulaires, les obligations et les rôles découlent des traitements réels. La validation par le client ne dispense pas AtoumWeb de son rôle ; prévoir l'encadrement de sous-traitance lorsqu'il s'applique.
4. **Frais supplémentaires.** Pas d'intervention payante, de migration externe, de refonte ou d'extension de périmètre sans accord préalable ; pas de nouvelle prestation catalogue générique en doublon.
5. **Packs et maintenance.** Packs d'heures prépayées avec date de validité définie et droits préservés en cas d'inexécution. Les 2/4 interventions mineures de maintenance à 30 minutes sont un autre dispositif, sans report mensuel.
6. **Hébergement isolé.** Transfert interne AtoumWeb vers une Lune dédiée à 0 €, y compris en changement de formule ; arrivées depuis un autre hébergeur sur devis. Pas de double facturation, pas de bascule rétroactive de contrats signés, domaine distinct.

## Sources contrôlées — lecture préalable à toute adoption

- Code de la propriété intellectuelle, article L131-3 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/
- WordPress.org — Licence GNU GPL v2 ou ultérieure : https://fr.wordpress.org/about/license/
- Code de la consommation, article L224-25-25 (mises à jour des contenus et services numériques) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044133273/
- DGCCRF — Clauses abusives : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/clauses-abusives-12-clauses-interdites-et-10-clauses-dont-il-faut-demontrer-la-legitimite
- CNIL — Comment identifier son rôle RGPD : https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role
- CNIL — Information des personnes lors de la collecte : https://www.cnil.fr/fr/passer-laction/rgpd-les-premieres-etapes

## Vérifications techniques du registre

- **118 / 118 propositions éditoriales révisées** au 30/10/2026.
- Cette passe : **14 propositions modifiées**, **104 clauses hors lot inchangées**.
- Les textes précédents des 14 sont dans `previousEditorialProposal` ; leurs révisions dans `editorialRevision`.
- Nombre de codes uniques : **118** ; **aucune** entrée manquante ou dupliquée.
- Textes sources (`origin.body`), références, statuts, indicateurs de publication et approbations **inchangés**.
- Sur l'ensemble du registre : **0 approbations techniques**, **0 publications**, **0 adoptions** dans les indicateurs du fichier.
- Les contrôles portent sur le fichier JSON, pas sur la génération PDF ni sur l'intégration en base SQLite.

## Étapes à venir (distinctes de la revue terminée)

- Relecture commerciale et juridique finale B2B/B2C, des dépendances entre clauses et des conditions réelles des offres.
- Décider individuellement des approbations à partir des propositions, sans modifier rétroactivement les contrats acceptés.
- Préparer ensuite un import/versionnement en brouillon, tester les assemblages devis/CGV, le moteur PDF et les 14 scénarios PDF, puis publier uniquement après accord humain exprès.

**Résultat : campagne de rédaction terminée ; campagne de validation, de recette et de publication non lancée.**

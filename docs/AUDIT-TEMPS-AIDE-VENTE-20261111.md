# Temps et aide à la vente — 11 novembre 2026

## Réalisation et limites

128 propositions d'aide à la vente dans scripts/preproduction/aide-a-la-vente-v1.json : besoins, bénéfices issus des inclusions, argumentaires, deux questions par famille, situations, exclusions et vigilances, objections, mots-clés, cas de devis et conseil interne. Les dix arbitrages de fiches du 11/11 sont pris en compte. Ce sont des propositions éditoriales internes, non contractuelles, à relire ; les questions restent communes par famille et peuvent être affinées par référence. Aucune promesse de résultat SEO ou d'assurance souscrite. Aucune modification de prix ou de clause pour cette mission.

validate-v1.cjs fusionne ces champs avant saveDraftVersion/publication des brouillons. Les sourceStatus/sourceStatusOrigine/sourceVersion sont préservés, sous réserve de l'arbitrage des statuts déjà prévu par le script de Claude. Le script ne modifie plus les temps des versions publiées. L'aperçu distingue les 128 fiches complètes et les dix versions figées non enrichies ; aucune aide manquante ni champ minimum insuffisant. Il reste donc à décider comment enrichir ces dix versions : aucune modification sur place autorisée par cette mission.

L'ensemble du script de validation comporte par ailleurs des suppressions, corrections de clauses et publications héritées du travail de Claude : il n'a PAS été appliqué. La mission ne certifie pas ces opérations. L'aperçu est exécuté sur sauvegarde SQLite jetable, source ouverte read-only. La vérification UI utilise une base synthétique TEMP distincte, pas une validation complète du script sur la copie réelle. Les codes provisoires V39 y sont sans code canonique, car le service de création interactive refuse ce préfixe ; cette recette ne prouve pas leur import/activation.

## Cohérence des temps proposés

109 temps, sur 128 références ; 19 sans temps (prestations à cadrer). Temps de travail indicatifs et non engagements de livraison. Ne pas confondre marge et chiffre d'affaires par heure : les charges, licences, hébergement et frais ne sont pas déduits du taux implicite.

| Cas | Comparaison | Conclusion |
|---|---|---|
| Vitrine Business | 900 + 3 × 120 + 90 + 120 = 1 470 min | Somme cohérente avec rédaction, avis et mesures |
| Vitrine Visibilité | 1 470 + 180 blog + 180 article SEO = 1 830 | Cohérent par composition |
| Maintenance WP | 75 min/mois ; 2 × 30 = 60 min si quota consommé | 15 min pour routine : hypothèse fragile, à mesurer |
| Maintenance WooCommerce | 120 min/mois ; 4 × 30 = 120 min | Aucun temps résiduel pour routine si quota consommé |
| Annuel WP | 900 = 12 × 75 | Cohérent temporellement ; remise annuelle réduit le taux implicite |
| Annuel WooCommerce | 1 440 = 12 × 120 | Même risque de routine non budgétée |
| Intégration WP | Référence 45 min, intervention incluse limitée à 30 min | Prestation éligible au quota seulement si périmètre réel tient dans la limite ; ne pas transformer 45 min en droit de consommation de 30 |
| Trois images | Référence 35 min, quota limité à 30 min | Même distinction, ne pas déduire automatiquement un quota |
| Shooting Essentiel/Activité | 270/420 min totales vs 1h/2h de prise de vue | Comprendre comme production totale ; ne pas afficher comme durée de séance |
| Priorité/urgence | Temps de référence distinct | Vérifier que ce supplément représente réellement du travail additionnel, éviter de compter deux fois le travail principal |

Ces constats ne justifient aucun changement automatique des temps ou tarifs. Les autres offres composées nécessitent une revue détaillée du travail mutualisé (ex. newsletter/mesures et préparation) avant de déclarer toutes les sommes additives.

## Chaîne prévu/réel constatée dans le code

- catalog_versions.estimated_minutes est un champ de version commerciale.
- ProjectOperationalService prépare des actions à partir des modèles opérationnels : référence par action et estimation sur project_nodes. Les tests ProjectOperationalService et ProjectContributionTargets montrent par exemple une vitrine à 1 470 min opérationnelles, contre 900 dans la nouvelle proposition commerciale. Ne pas écraser ces modèles pour aligner artificiellement les totaux.
- TimeService rattache les sessions à projet/noeud/intervention, calcule le temps net de pauses en secondes et les cumuls. Les interventions relient les abonnements et périodes ; les tests OperationalSalesService couvrent douze cycles mensuels pour un annuel et l'absence de report de quota.
- Renseigner le Catalogue ne suffit pas à alimenter automatiquement une référence par prestation vendue et un tableau de comparaison. Il faut définir quelle référence est affichée : commerciale, somme des actions initiales, ou estimation révisée humaine. Ces trois valeurs doivent rester distinguées.

## Écran minimal proposé — non implémenté

Une ligne par prestation vendue : code/version et ligne de devis source, montant vendu, quantité, référence commerciale au moment de la vente, prévu opérationnel initial, prévu révisé, temps net réel, écart en minutes et pourcentage, chiffre d'affaires par heure réelle. L'agrégation doit suivre les origines des actions et les interventions, sans doubler les parents et enfants ; sessions non affectées visibles à part. Pourcentage indisponible si prévu nul/absent ; taux indisponible si réel nul. Les corrections, garanties et travail hors périmètre doivent rester visibles séparément.

Abonnements : une période sélectionnée (mois de service, même si facturation annuelle). Référence annuelle ramenée à 12 cycles pour ces formules mensuelles, sans compter le montant annuel entier chaque mois. Afficher séparément routine et interventions consommées. Le quota contractuel ne devient jamais un budget de production et n'est pas augmenté par le temps indicatif. Ne pas compter la mise en service dans toutes les périodes.

## Vérifications réellement exécutées

- npx tsc --noEmit : réussi.
- node scripts/run-tests.cjs : 1 941 réussis, 1 ignoré, 245 fichiers réussis et un ignoré.
- node scripts/check-sales-v1-preview.cjs : aperçu sur copie SQLite TEMP, 128 fiches complètes, 109 temps connus, aucun code de temps inconnu, dix versions publiées signalées. Aucun --apply.
- node scripts/check-sales-v1-ui.cjs : 265 contrôles, zéro échec/erreur renderer. 128 aides enregistrées et relues par les services dans la fixture synthétique ; fiche vitrine ouverte dans le vrai Manager Electron, onglet aide à la vente vérifié sans message vide. Les 127 autres fiches n'ont pas été parcourues visuellement.
- Bases TEMP nettoyées ; aucune écriture préproduction, aucun commit/push.

Prochaine action : relecture éditoriale des fiches, décision sur les dix versions figées et sur la référence de temps à comparer. Aucun écran nouveau n'a été implémenté. Vérifier séparément le script global de validation avant toute application autorisée.

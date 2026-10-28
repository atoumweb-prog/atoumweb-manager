# Revue transversale — 118 propositions contractuelles

25 octobre 2026. **Propositions documentaires, décisions humaines en attente.** Aucun texte publié, devis, historique, prix, base ou exécutable modifié. Les clauses ne sont pas certifiées juridiquement par cet audit. Le périmètre couvre toute la bibliothèque, pas le devis de démonstration.

## Bilan de couverture et limites

L’inventaire relu en lecture seule confirme 118 modèles et 118 versions publiées : 19 clauses de socle et 99 clauses du Catalogue. Les 13 types contractuels restent distincts et en brouillon ; 409 liens Catalogue/clauses et 112 liens Catalogue/types. Les textes, identifiants, audiences et statuts correspondent à l’inventaire précédent. Les 35 propositions initiales sont conservées et relues transversalement ; 83 nouvelles réécritures sont spécifiques à leur clause.

Les 118 fiches comportent texte source intégral, version et identifiant, audience, défaut, proposition intégrale, éléments à conserver, risques et points de revue. Le classement retenu compte 26 risques faibles, 49 modérés et 43 élevés : il mesure la sensibilité d’un changement, pas un nombre de contrats juridiquement faux. Aucun numéro de nouvelle version n’a été réservé.

Le contrôle documentaire vérifie la couverture et la traçabilité ; il ne peut pas prouver automatiquement l’équivalence de portée juridique. Les nuances signalées exigent la lecture conjointe du texte source, de la proposition et des conditions particulières réelles.

## Règles éditoriales communes appliquées

- « Nous » désigne AtoumWeb ; « vous » le client identifié au devis. BASE-ACCEPTATION contient cette définition. Un module réutilisé isolément doit recevoir une définition équivalente, sans changement du cocontractant.
- Le devis décrit ce qui est vendu. La clause ne remplace pas un prix, une durée, une licence, une date ou un prestataire manquant par une valeur supposée.
- Les phrases séparent ce que nous réalisons, ce que vous fournissez, les dépendances et les suites d’un changement. Aucune substitution automatique de noms n’a servi de proposition finale.
- Les notions utiles sont expliquées : vérification de livraison pour « recette », connexion pour une API lorsque possible, première version utilisable pour MVP, référencement naturel pour SEO.
- Les renvois visibles emploient le titre humain du module. Les codes et identifiants de version restent dans les métadonnées de traçabilité.
- Les exceptions sont gardées au voisinage de la règle concernée. Les réserves sur les garanties, fautes et recours ne sont pas supprimées pour raccourcir le contrat.

La réutilisation future par une autre entreprise devra remplacer la définition d’AtoumWeb par l’entreprise contractante configurée, de manière contrôlée. Cet audit ne rend pas la bibliothèque automatiquement adaptable à toutes les activités.

## Matrice de cohérence et décisions à prendre

| Groupe de clauses | Point examiné | Conclusion / action avant intégration |
|---|---|---|
| BASE-PAIEMENT, PRO-PAIEMENT, PRO-RETARD, CONS-RETRACTATION | Acompte, arrhes, échéances et retrait | Les pénalités professionnelles restent dans les seuls modules PRO. Vérifier que le choix exprès de l’avance correspond à la clause et au devis ; pas de somme automatiquement acquise. Les plafonds B2B ne sont pas des délais automatiquement accordés. |
| CONS-DEBUT-ANTICIPE, CONS-RETRACTATION | Démarrage et perte de rétractation | Le commencement ne vaut pas renonciation. Prévoir demande distincte, preuve et reconnaissances adaptées à la qualification réelle. Ne pas confondre service pleinement exécuté et contenu numérique. |
| Socle PRO/CONS et audience du dossier | Protection de certains professionnels | Le statut « professionnel » ne suffit pas pour exclure toute protection. Examiner le cas hors établissement, hors activité principale, avec cinq salariés au plus. Ne pas appliquer indistinctement tout le régime consommateur. |
| BASE-DELAIS, APP-CADRAGE, APP-PROTOTYPE, APP-MVP | Nature de la livraison | Cadrage autonome, simulation et première application utilisable sont distingués. Une maquette ne prouve pas qu’un produit de production a été livré. Délais de développement non validés par le seul cadrage. |
| APP-GARANTIE, DEVWP-GARANTIE, APP-RECETTE, DEVWP-RECETTE | Défaut intermittent et validation | Aucune reproduction systématique imposée. Conserver « constatable ou reproductible ». Paiement, mise en ligne, silence ou fin de recette ne suppriment pas les recours selon le socle. |
| APP-GARANTIE | Titre « Garantie corrective 90 jours » | Le corps renvoie à la durée du devis. Titre proposé : « Garantie corrective de l’application ». Ne pas choisir arbitrairement 90 jours ni modifier une durée déjà promise par le contrat entier. |
| BASE-VALIDATION, WEB-VALIDATION, corrections graphiques et éditoriales | Cycles et non-conformité | Un ajustement demandé par le client peut consommer un cycle ; une reprise légalement ou contractuellement due ne devient pas une nouvelle prestation payante. Conserver le socle avec les modules courts. |
| BASE-PI, APP-PI-REUTILISATION, DEVWP-PI-REUTILISATION | Licence, cession et réutilisation | Licence large et durable ne signifie pas cession universelle. Paramétrer précisément usages, durée, territoire et conditions. Aucun réemploi de données, secrets ou logique propre du client. |
| BRAND-DROITS, BRAND-TIERS, DESIGN-LIVRAISON | Création finale, sources et ressources externes | Création retenue, propositions non retenues, idées, fichiers et droits distincts. Une réserve sur les propositions ne crée pas un monopole sur les idées. Identifier les licences tierces. |
| PHOTO-DROITS, PHOTO-LIVRABLES, MARIAGE-CONTENUS | Auteur et personnes représentées | Une commande ou une autorisation de prise de vue n’autorise pas automatiquement toute diffusion ou promotion. Vérifier les autorisations adaptées, notamment les titulaires pour un mineur. |
| MAINT-INTERVENTIONS et SERVICE-PACK-HEURES | Quota mensuel ou crédit de temps | Ne pas fusionner : interventions mensuelles non reportables dans un abonnement d’un côté ; volume consommable pendant une validité de l’autre. Conserver les recours lorsque l’agence n’exécute pas une demande recevable. |
| MAINT-MAJ, MAINT-WOOCOMMERCE, garanties | Report technique et obligations légales | Un report doit rester évalué et informé. La présence d’un composant tiers ne transforme pas automatiquement une correction due en supplément. Les mises à jour légalement dues restent distinctes de la maintenance vendue. |
| APP-MAINTENANCE, MAINT-RENOUVELLEMENT, WEB-HEBERGEMENT, TECH-HEBERGEMENT, MARIAGE-DUREE | Annuel, mensuel et sortie | Accord exprès annuel conservé. Ne pas introduire une reconduction tacite annuelle. La période d’export/transfert, les données et la fin de service doivent être réellement renseignées. |
| TECH-HEBERGEMENT et WEB-HEBERGEMENT | Hébergement seul ou inclus | Ne pas appliquer l’exclusion des sauvegardes ou du domaine d’un hébergement seul à une création qui les comprend. Un même devis peut contenir plusieurs services, avec périmètres et périodes distincts. |
| ECOM-STOCK, ECOM-CATALOGUE, ECOM-IMPORT, MAINT-WOOCOMMERCE | Configuration et gestion du commerce | Configuration/import et gestion quotidienne ne sont pas équivalents. La maintenance ne comprend pas automatiquement les produits, commandes, stocks et remboursements. |
| ECOM-LEGAL, ECOM-MULTILINGUE, WEB-MULTILINGUE | Textes du marchand et fiscalité | Intégration des textes n’est pas validation juridique ; paramétrage fiscal n’est pas détermination du régime. Ne pas confondre les CGV du commerçant avec le contrat AtoumWeb. |
| DATA-CONSENTEMENT, DATA-MESURE, WEB-NEWSLETTER-PERIMETRE | Consentement, mesure et listes | Vérifier finalités, exemptions éventuelles et mécanismes réels. Un compte fourni ou une liste remise ne prouve pas un consentement licite. L’agence conserve ses propres obligations de configuration. |
| BASE-DONNEES, APP-ENVIRONNEMENTS-ACCES, DATA-ACCES, SEO-ACCES | Accès, rôles et conservation | Minimisation et retrait des accès nécessaires ; conservation justifiée distincte d’une conservation illimitée. Lorsque la révocation dépend d’un autre acteur, information et coopération plutôt qu’une promesse impossible. |
| MARIAGE-RSVP, MARIAGE-DUREE, MARIAGE-PRIVE | Données invités et confidentialité | Pas de donnée sensible par défaut ; option désactivée tant que les conditions ne sont pas remplies ; rôle du couple non automatique. Un lien privé n’est pas une garantie absolue. La durée du site ne suffit pas à justifier toute conservation RSVP. |
| MARIAGE-POST-EVENEMENT | Délai de trois mois | Replanification et éventuel complément accepté conservés ; aucun ajout de déchéance automatique des droits ou de pénalité. |
| PHOTO-REPORT, PHOTO-SHOOTING-PERIMETRE, BASE-FORCE-MAJEURE | Retard, météo et annulation | Seuil de quarante-huit heures conservé. Aucune pénalité forfaitaire inventée. La météo n’est pas systématiquement une force majeure ; pas de report indéfini lorsque la date est essentielle. |
| SEO-MOYENS, SEO-DELAIS, SEO-LOCAL-PERIMETRE, SEO-DISCOVER, SEO-PERFORMANCE | Moyens et résultats | Aucune promesse de classement, de trafic ou de chiffre d’affaires ajoutée. L’absence de résultat immédiat ne dispense pas de réaliser les actions ou livrables précisément convenus. |
| SEO-NETLINKING | Conseil ou achat d’espace | Achat et paiement directs par le client conservés ; publicité et annonceur identifiables. Si l’agence devient acheteur ou mandataire, examiner le régime spécifique au lieu d’étendre ce texte par style. |
| WEB-PAIEMENT-TIERS, ECOM-PAIEMENT, MARIAGE-TIERS | Intégration et fonds | Pas d’encaissement, de détention ou de reversement de fonds pour autrui introduit. Les flux et permissions réels doivent correspondre à ce rôle technique. |
| SERVICE-TIERS et modules spécialisés | Limites et responsabilité | Le service externe peut limiter une action ; son intervention ne suffit pas à exonérer l’agence. Conserver les réserves propres et les recours. |
| WEB-OFFRE-5P-PERIMETRE | Titre et nombre de pages | Le titre source mentionne cinq pages ; la clause renvoie aux pages réellement listées. Vérifier cohérence de la vente avant toute adoption, sans ajouter ou retrancher des pages. |

## Répétitions : celles à conserver et celles à réduire

La répétition d’une garantie légale dans un module spécifique n’est pas purement décorative si ce module est réutilisable seul. Les doubles formulations de APP-PI-REUTILISATION et DEVWP-PI-REUTILISATION ont été réorganisées tout en conservant les distinctions entre droits spécifiques, éléments génériques, réutilisation et tiers. Aucune clause n’a été fusionnée ou supprimée.

Les renvois de WEB-VALIDATION, MARIAGE-RSVP, TECH-HEBERGEMENT, APP-MAINTENANCE et WEB-PAIEMENT-TIERS ont un libellé humain. L’assemblage doit garantir la présence du module auquel ils renvoient, ou présenter clairement son alternative. TECH-HEBERGEMENT renvoie à WEB-HEBERGEMENT comme régime alternatif de l’hébergement inclus : ce n’est pas une raison d’appliquer simultanément les deux périmètres.

Pour une future interface, afficher les réserves et le détail dans la clause utile ; ne pas remplacer la lecture par un avertissement générique « les droits légaux restent applicables ». Un tel avertissement ne corrige pas nécessairement une contradiction précise.

## Vérifications juridiques complémentaires du lot élargi

Le commencement anticipé d’une prestation payante exige une demande expresse ; un montant pour le travail déjà effectué après rétractation dépend des conditions légales. La perte du droit n’est pas acquise au seul démarrage. [Code de la consommation, L221-25](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563179/2026-07-10).

Le régime de rétractation distingue délai, prolongation pour défaut d’information et remboursement ; la clause doit être accompagnée des coordonnées, informations et du formulaire effectivement nécessaires. [Code de la consommation, chapitre L221](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221319/2026-07-01).

Refuser et retirer le consentement aux traceurs doit être possible selon les règles applicables ; les traceurs de mesure d’audience ne sont pas tous exemptés. Une exemption dépend du fonctionnement et du paramétrage concrets, pas du seul nom de l’outil. [CNIL — règles des traceurs](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi), [CNIL — mesure d’audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience).

Le droit d’auteur et le droit à l’image sont distincts ; l’autorisation de photographier ne vaut pas nécessairement autorisation de diffuser à toute fin. Les usages et autorisations pour les mineurs sont à vérifier dans chaque situation. [Direction des affaires juridiques — droit à l’image](https://www.economie.gouv.fr/apie/droit-limage-des-personnes-et-des-biens).

Des informations de santé ou de religion relèvent des données sensibles. Notre point de vigilance est qu’un formulaire d’invités demandant allergies ou habitudes alimentaires peut en révéler : ne pas ajouter ces champs sans analyse réelle. [CNIL — données sensibles](https://www.cnil.fr/fr/definition/donnee-sensible).

Les publications publicitaires et l’annonceur doivent être identifiables ; le modèle de conseil en liens sponsorisés nécessite cette distinction, indépendamment de toute promesse SEO. [LCEN — article 20 en vigueur](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006117688).

Ces contrôles complètent les références du premier lot relatives aux droits d’exploitation, garanties numériques, paiement, responsabilité, RGPD et professionnels protégés. Voir [les références officielles](REFERENCES.md). Ils ne constituent pas un audit de conformité technique des services ou de tous les modèles commerciaux réels.

## Les quatre assemblages de démonstration

| Assemblage documentaire | Clauses | Relecture et limites |
|---|---:|---|
| Site vitrine professionnel | 24 | Socle commun et PRO, site et hébergement inclus ; pas de maintenance présumée. |
| E-commerce professionnel + maintenance | 35 | Reprise des35 propositions du premier lot ; création ponctuelle et suivi récurrent distincts. |
| Site de mariage consommateur | 24 | Socle commun et CONS, site temporaire, formulaire minimal sans données sensibles ; aucune clause PRO de pénalités. |
| Contenu SEO ponctuel professionnel | 23 | Rédaction, recherche et référencement sans abonnement ni résultat garanti. |

Chaque exemple utilise les propositions intégrales, sans citation tronquée. Le lecteur permet de lire le contrat d’une traite et de développer les références techniques séparément. Les données sont explicitement fictives ; prix, dates, médiateur, coordonnées particulières et autres conditions non décidées restent signalés comme manquants. Aucune signature ni acceptation n’est simulée.

Ce sont des assemblages éditoriaux pour la relecture, pas des contrats finalisés ni des exports du moteur de production. Les associations d’audience sont contrôlées ; leur sélection n’est pas une validation des13 types actuellement en brouillon. Les essais du moteur et les comparaisons PDF appartiendront au lot d’intégration autorisé ultérieurement.

## Réserves avant utilisation réelle

1. Faire examiner en priorité les43 propositions sensibles et leurs conditions particulières : avances/retrait, garanties, droits, responsabilités, données, renouvellement et fin de service. La revue d’ensemble doit aussi couvrir les textes courts et leurs combinaisons.
2. Compléter les données réellement nécessaires : dates/événements, prestations récurrentes, licences et droits, fournisseurs, réclamations et médiateur si applicable. Ne jamais masquer les champs manquants pour améliorer l’apparence.
3. Contrôler les flux de données, paiements et permissions effectivement déployés ; les clauses ne remplacent pas ces vérifications.
4. Lors d’une intégration ultérieure, créer de nouvelles versions brouillon. Publication, adoption à un devis et validation du contrat final sont des actions distinctes, avec décision humaine explicite. Aucune mise à jour à la simple ouverture.
5. Garder les versions, documents et preuves transmis ou acceptés intacts ; tester les assemblages et rendus sur copies isolées, sans modifier la base utilisateur réelle.

## Fichiers remis

- [Lecteur local avant/après et contrats assemblés](LECTURE.html).
- [Inventaire exhaustif](INVENTAIRE.md).
- [Rapport intégral des118 propositions](RAPPORT-118.md).
- [Tableau des118 décisions en attente](TABLEAU-VALIDATION.md).
- [Propositions structurées avec versions sources](PROPOSITIONS.json).
- [Exemples intégraux en texte](EXEMPLES.md) et [leurs assemblages structurés](ASSEMBLAGES.json).
- [Références primaires](REFERENCES.md) et [contrôles documentaires](verification.json).

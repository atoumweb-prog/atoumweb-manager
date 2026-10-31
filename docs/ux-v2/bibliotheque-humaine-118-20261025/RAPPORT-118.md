# Bibliothèque contractuelle — 118 réécritures proposées

**Travail documentaire intégral, non publié et non appliqué.** Les118propositions sont reliées à leurs versions sources lues seules.35analyses réutilisées et relues ;83nouvelles réécritures spécifiques. Le PDF DEV-2026-003 ne définit pas ce périmètre.

Lire le [bilan de cohérence](COHERENCE.md), le [tableau de validation](TABLEAU-VALIDATION.md) et les [exemples assemblés](EXEMPLES.md). Les informations juridiques ne valent pas certification. Les champs manquants ne sont pas complétés fictivement dans la bibliothèque.

La définition de «nous» (AtoumWeb) et «vous» (client au devis) est portée par BASE-ACCEPTATION. Elle doit accompagner les modules assemblés ; un module isolé doit disposer de la même définition. Les 118 clauses ne doivent pas être réunies indistinctement dans un contrat.

Le risque indiqué porte sur la sensibilité de la reformulation, pas sur une prétendue validité ou invalidité de la source. Toutes les décisions humaines restent en attente.


## 001. APP-CADRAGE — Cadrage fonctionnel et livrable de cadrage

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `24ae5c69-8ee7-4db8-a660-67d8b8c98b50` ; modèle `2cfc944d-dc44-406a-85b8-5ad5c2b61690`, statut `published`.
- **Défauts rédactionnels** : Formaliser, exploitable et réalisation ultérieure peu concrets.
- **Éléments préservés** : Mission autonome, document fonctionnel et décisions préparatoires ; absence d’engagement automatique de développement, de budget ou de calendrier.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas présenter le cadrage comme une promesse de réalisation au prix étudié.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas présenter le cadrage comme une promesse de réalisation au prix étudié.
- **Changement important / vigilance** : Formaliser, exploitable et réalisation ultérieure peu concrets.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le cadrage est une prestation autonome destinée à formaliser le besoin, les utilisateurs, les processus, les fonctions, les données, les droits, les contraintes et les intégrations envisagés dans un document fonctionnel exploitable. Il permet de préciser le périmètre et les choix nécessaires à une réalisation ultérieure. Sauf mention expresse au devis, sa livraison ne constitue pas un engagement d’AtoumWeb à développer l’application ni une validation automatique d’un budget ou d’un calendrier de développement.

### Proposition humaine — intégrale, à valider

Le cadrage est une prestation à part entière. Nous décrivons dans un document fonctionnel vos besoins, les utilisateurs, les processus de travail, les fonctions, les données, les droits d’accès, les contraintes et les connexions envisagées avec d’autres outils.

Ce document permet de préciser le périmètre et les choix nécessaires à un futur développement. Sauf engagement exprès dans le devis, sa remise ne nous engage pas à développer l’application et ne valide pas automatiquement un budget ou un calendrier de développement.


## 002. APP-COMPATIBILITE — Compatibilité future et dépendances externes

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `58ba16a5-55e2-489c-b6d2-ced82bdcddec` ; modèle `7afda76f-4b14-480a-8973-2be7459b667b`, statut `published`.
- **Défauts rédactionnels** : Matrice, runtimes et dépendances à expliquer.
- **Éléments préservés** : Environnements convenus avant acceptation, documentation et vérification correspondantes ; limites de compatibilité future ; corrections et mises à jour légalement dues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La liste technique ne peut supprimer les qualités attendues ni les obligations légales applicables.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La liste technique ne peut supprimer les qualités attendues ni les obligations légales applicables.
- **Changement important / vigilance** : Matrice, runtimes et dépendances à expliquer.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

Les environnements logiciels, systèmes, navigateurs, runtimes, bases de données, API et versions pris en charge sont définis dans le devis ou une annexe communiquée avant l’acceptation. La documentation de livraison décrit le périmètre ainsi convenu. AtoumWeb vérifie la livraison sur cette matrice. Aucune compatibilité illimitée n’est garantie avec les versions futures, les configurations non prévues, les services abandonnés ou les évolutions ultérieures de dépendances externes. Une adaptation qui dépasse les obligations déjà convenues peut relever de la maintenance ou d’une évolution acceptée ; les corrections et mises à jour légalement dues restent réservées.

### Proposition humaine — intégrale, à valider

Le devis ou une annexe remise avant votre acceptation précise les environnements et versions pris en charge : logiciels, systèmes, navigateurs, outils d’exécution, bases de données et connexions à des services externes. La documentation de livraison reprend ce cadre, dans lequel nous vérifions l’application.

Nous ne garantissons pas une compatibilité illimitée avec toutes les versions futures, les configurations non prévues, les services abandonnés ou les changements ultérieurs des outils externes.

Une adaptation qui dépasse nos engagements peut relever d’une maintenance ou d’une évolution acceptée. Les corrections et mises à jour légalement dues restent applicables.


## 003. APP-ENVIRONNEMENTS-ACCES — Données, secrets et environnement client

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `0b203c36-d888-494b-bd35-4ad06107abc7` ; modèle `ae024117-9180-4c55-b11a-6d973c9c7252`, statut `published`.
- **Défauts rédactionnels** : Secrets, environnements et fin d’accès réunis en bloc technique.
- **Éléments préservés** : Accès suffisants mais limités au besoin autorisé ; données de test minimisées ; usage réel justifié et sécurisé ; protection des secrets ; fin des accès et conservations légalement justifiées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier les rôles RGPD et moyens de transfert/révocation ; ne pas ajouter une conservation ou destruction absolue.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier les rôles RGPD et moyens de transfert/révocation ; ne pas ajouter une conservation ou destruction absolue.
- **Changement important / vigilance** : Secrets, environnements et fin d’accès réunis en bloc technique.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Le Client fournit les comptes, rôles, clés API, secrets et accès nécessaires aux environnements de développement, de test et de production, avec des droits suffisants pour la prestation. AtoumWeb utilise et conserve ces accès uniquement aussi longtemps qu’ils sont nécessaires au périmètre autorisé. Les données de test sont limitées à ce qui est nécessaire. Des données fictives ou anonymisées sont utilisées lorsqu’elles permettent les tests requis ; l’usage de données personnelles réelles est justifié, autorisé et sécurisé selon les règles applicables. Les secrets sont transmis et conservés par des moyens adaptés et ne sont pas inscrits en clair dans le devis ou son snapshot. À la fin du besoin autorisé, AtoumWeb cesse l’utilisation de ses accès et organise leur suppression ou leur révocation, sous réserve des conservations légalement justifiées. Les responsabilités propres à chaque environnement, aux sauvegardes, aux déploiements et aux accès sont celles définies au devis ou au dossier technique.

### Proposition humaine — intégrale, à valider

Vous nous fournissez les comptes, droits d’accès, clés de connexion et autres éléments confidentiels nécessaires aux environnements de développement, de test et de production. Les droits accordés doivent permettre la prestation prévue.

Nous utilisons et conservons uniquement les accès nécessaires, pendant la durée utile à l’intervention autorisée. Les tests utilisent le minimum de données requis. Nous privilégions des données fictives ou anonymisées lorsqu’elles permettent les vérifications nécessaires ; l’utilisation de données personnelles réelles doit être justifiée, autorisée et sécurisée selon les règles applicables.

Les mots de passe et autres éléments secrets sont transmis et conservés par des moyens adaptés. Ils ne figurent pas en clair dans le devis ni dans sa copie contractuelle enregistrée.

Lorsque les accès ne sont plus nécessaires, nous cessons de les utiliser et organisons leur suppression ou leur révocation, sous réserve des conservations légalement justifiées. Le devis ou le dossier technique précise les responsabilités relatives à chaque environnement, aux sauvegardes, aux mises en service et aux accès.


## 004. APP-EVOLUTIONS — Évolutions après livraison

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `213c1588-16b7-48c6-a775-5d810cacaea8` ; modèle `d13b97b4-480f-4a94-8b97-aba326fbee75`, statut `published`.
- **Défauts rédactionnels** : Workflow et structurantes abstraits.
- **Éléments préservés** : Définition des extensions hors périmètre ; modalités de petites évolutions prévues au devis ; estimation et accord préalable des évolutions importantes.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas assimiler une anomalie ou une correction due à une évolution payante.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas assimiler une anomalie ou une correction due à une évolution payante.
- **Changement important / vigilance** : Workflow et structurantes abstraits.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Toute nouvelle fonction, modification de workflow ou de règle métier, extension à de nouveaux utilisateurs, usages, données, plateformes ou intégrations constitue une évolution lorsqu’elle dépasse le périmètre validé. Les petites évolutions peuvent être réalisées au temps passé ou dans le cadre d’un pack prévu au devis. Les évolutions structurantes font l’objet d’une estimation et d’un accord distincts avant réalisation.

### Proposition humaine — intégrale, à valider

Une nouvelle fonction, un changement de processus ou de règle métier, ou une extension à d’autres utilisateurs, usages, données, plateformes ou outils est une évolution lorsqu’elle dépasse le périmètre validé.

Les petites évolutions peuvent être réalisées au temps passé ou avec un pack prévu au devis. Les évolutions plus importantes font l’objet d’une estimation et d’un accord distincts avant leur réalisation.


## 005. APP-GARANTIE — Garantie corrective 90 jours

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `53bf7446-9c2a-4a1c-b5b8-9c4608bd2ae6` ; modèle `1581bfa3-b075-421a-84da-7cff4047c391`, statut `published`.
- **Défauts rédactionnels** : Titre 90jours non porté par le corps qui renvoie au devis ; garantie contractuelle et légale à séparer.
- **Éléments préservés** : Anomalies imputables à la livraison, durée et départ au devis, analyse des défauts intermittents ; exclusions causales seulement ; garanties légales et responsabilités maintenues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Le titre 90jours doit être aligné avec la durée effectivement convenue, sans imposer90jours par reformulation.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Le titre 90jours doit être aligné avec la durée effectivement convenue, sans imposer90jours par reformulation.
- **Changement important / vigilance** : Titre source «90 jours» alors que le corps renvoie au devis : proposer le titre «Garantie corrective de l’application», sans choisir ni changer la durée.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

La garantie corrective contractuelle couvre les anomalies imputables à la livraison et relevant des engagements convenus. Le devis précise sa durée applicable et son point de départ. Les informations disponibles sont utilisées pour analyser les anomalies, y compris intermittentes. Les demandes de fonctions ou de règles nouvelles hors périmètre sont des évolutions. Une modification du Client ou d’un tiers, ou une évolution d’une dépendance extérieure, n’est exclue que dans la mesure où elle est à l’origine de l’anomalie concernée. Cette garantie commerciale ne supprime ni ne réduit les garanties légales, les mises à jour légalement dues ou la responsabilité applicable à AtoumWeb.

### Proposition humaine — intégrale, à valider

Notre garantie corrective contractuelle couvre les anomalies de la livraison qui nous sont imputables et relèvent des engagements convenus. Le devis en précise la durée et le point de départ.

Nous utilisons les informations disponibles pour analyser les anomalies, y compris lorsqu’elles se produisent par intermittence. Les fonctions nouvelles ou les nouvelles règles hors périmètre relèvent d’une évolution.

Une modification faite par vous ou par un tiers, ou le changement d’un outil externe, n’est exclu de cette garantie que s’il est à l’origine de l’anomalie concernée.

Cette garantie commerciale ne supprime ni ne réduit les garanties légales, les mises à jour légalement dues ou notre responsabilité applicable.


## 006. APP-MAINTENANCE — Maintenance et support applicatif

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `505fadae-b099-4268-81f4-8c82f898a24c` ; modèle `c54c344c-fd54-4823-a45a-344373e22d73`, statut `published`.
- **Défauts rédactionnels** : Maintenance, reconduction, sortie, astreinte et tiers imbriqués.
- **Éléments préservés** : Opérations expressément vendues, distinction corrections/entretien/évolutions ; aucune récurrence présumée ; renouvellement annuel exprès ; sortie et données ; absence d’astreinte non convenue.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier conditions de sortie et absence de transfert des garanties vers un abonnement optionnel.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier conditions de sortie et absence de transfert des garanties vers un abonnement optionnel.
- **Changement important / vigilance** : Maintenance, reconduction, sortie, astreinte et tiers imbriqués.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20) ; [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).

### Texte publié actuel — intégral

La maintenance applicative est une prestation sur devis couvrant uniquement les opérations expressément convenues. Elle distingue la correction d’anomalies, la maintenance technique et les évolutions fonctionnelles. Ces dernières ne sont incluses que si le devis le prévoit. Aucune formule récurrente ni reconduction n’est présumée. Si une prestation récurrente est expressément prévue, sa durée et ses conditions de résiliation sont définies au devis ; un engagement annuel est renouvelé par accord exprès, sans tacite annuelle par défaut. La fin de service organise la récupération ou le transfert selon la période et les modalités convenues, puis le traitement des données selon leurs règles de conservation. Elle ne comprend pas une astreinte, une supervision continue ou un engagement de niveau de service non prévu. Les obligations légales ou correctives déjà applicables restent distinctes. Les dépendances tierces suivent SERVICE-TIERS sans dispenser AtoumWeb de ses propres obligations.

### Proposition humaine — intégrale, à valider

La maintenance de votre application est une prestation sur devis, limitée aux opérations expressément convenues. Nous distinguons la correction des anomalies, l’entretien technique et les évolutions fonctionnelles. Ces dernières sont comprises uniquement si le devis le prévoit.

Aucun abonnement ni renouvellement n’est présumé. Si un service récurrent est prévu, le devis en précise la durée et les conditions de résiliation. Un engagement annuel est renouvelé par accord exprès, sans reconduction tacite annuelle par défaut.

La fin du service permet de récupérer ou de transférer les éléments selon la période et les modalités convenues. Les données sont ensuite traitées selon leurs règles de conservation.

Une astreinte, une surveillance continue ou un niveau de service particulier n’est pas compris s’il n’est pas prévu. Les obligations légales et corrections déjà dues restent distinctes. Les services externes suivent la clause « Dépendances et coûts de services tiers », sans nous dispenser de nos propres obligations.


## 007. APP-MVP — Périmètre MVP et évolutions ultérieures

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `842a010a-68a0-451a-af6f-58800906ec0a` ; modèle `c38ba800-e0c7-4cf9-abe7-aadcf8490913`, statut `published`.
- **Défauts rédactionnels** : MVP et version réellement utilisable peuvent sembler contradictoires avec prototype.
- **Éléments préservés** : Première version utilisable, fonctions indispensables, périmètre d’évaluation défini ; fonctions secondaires et intégrations non convenues exclues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas vendre une simulation comme un MVP exploitable ni supprimer les qualités promises.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas vendre une simulation comme un MVP exploitable ni supprimer les qualités promises.
- **Changement important / vigilance** : MVP et version réellement utilisable peuvent sembler contradictoires avec prototype.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le MVP constitue la première version réellement utilisable de l’application comprenant les fonctions indispensables convenues au devis. Les fonctions secondaires, optimisations, automatisations, plateformes ou intégrations qui ne figurent pas dans ce périmètre ne sont pas incluses et relèvent d’une évolution ou d’une version ultérieure. Le MVP est livré et évalué selon les utilisateurs, rôles, données, règles et environnements définis pour cette version.

### Proposition humaine — intégrale, à valider

Le MVP est la première version utilisable de votre application. Il comprend les fonctions indispensables convenues au devis.

Les fonctions secondaires, optimisations, automatisations, plateformes ou connexions qui ne figurent pas dans ce périmètre ne sont pas comprises : elles relèvent d’une évolution ou d’une version ultérieure.

Nous livrons cette version et la vérifions pour les utilisateurs, droits d’accès, données, règles et environnements définis pour elle.


## 008. APP-PI-REUTILISATION — Spécifique client vs composants génériques AtoumWeb

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `f0d35bc7-2ee2-40dc-8e63-116850fb0e57` ; modèle `ea8ff6f3-ce46-4efd-ae1f-22e9d61cd75a`, statut `published`.
- **Défauts rédactionnels** : Deux paragraphes répètent licence/cession ; spécifique/générique insuffisamment illustré.
- **Éléments préservés** : Licence client durable et précisément définie ; accord exprès pour exclusivité ou cession ; réutilisation des seuls éléments autorisés, sans données ni logique propre au client ; identification des livrables et composants tiers.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Conserver la séparation licence/cession et la délimitation effective ; revue des licences tierces et droits logiciels.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Conserver la séparation licence/cession et la délimitation effective ; revue des licences tierces et droits logiciels.
- **Changement important / vigilance** : Licence suffisamment large ne suffit pas sans annexe de droits précise ; ne pas céder les composants tiers.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les développements spécifiquement réalisés pour le Client sont distingués des composants, frameworks, bibliothèques, méthodes, outils et savoir-faire génériques d’AtoumWeb. Le modèle retenu accorde au Client une licence suffisamment large et pérenne pour utiliser, exploiter, maintenir et faire modifier le livrable spécifique. Ses droits, usages, durée, territoire et conditions d’effet sont définis précisément au devis ou dans son annexe ; une exclusivité ou cession particulière nécessite un accord exprès. AtoumWeb peut réutiliser ses éléments génériques sans réutiliser les données, secrets, identifiants, contenus confidentiels ni la logique propre au Client. Toute exclusivité doit être expressément prévue. L’application livrée, le dépôt de développement, la documentation et les autres fichiers ou outils sont identifiés séparément au devis.

AtoumWeb ne réutilise que les éléments dont elle détient les droits nécessaires ou dont la licence l’y autorise. Les éléments génériques et tiers incorporés à la livraison sont identifiés, avec les droits nécessaires à son exploitation convenue par le Client. Le devis ou l’annexe de droits définit la cession ou la licence des éléments spécifiques, les usages, la durée, le territoire, les conditions d’effet et les éventuelles restrictions ; les dispositions impératives et les licences tierces restent applicables.

### Proposition humaine — intégrale, à valider

Nous distinguons les développements réalisés spécialement pour vous de nos composants, bibliothèques, outils, méthodes et savoir-faire réutilisables.

Le modèle retenu vous accorde une licence suffisamment large et durable pour utiliser, exploiter, maintenir et faire modifier le livrable spécifique. Le devis ou son annexe de droits définit précisément les droits accordés, les usages, la durée, le territoire, les conditions de prise d’effet et les éventuelles restrictions. Une exclusivité ou une cession particulière nécessite un accord exprès.

Nous pouvons réutiliser nos éléments génériques, mais pas vos données, secrets, identifiants, contenus confidentiels ni la logique propre à votre activité. Nous ne réutilisons que les éléments dont nous détenons les droits nécessaires ou dont la licence l’autorise.

Les composants génériques et tiers intégrés à la livraison sont identifiés et accompagnés des autorisations nécessaires à l’exploitation convenue. Les règles impératives et les licences tierces restent applicables.

Le devis identifie séparément l’application livrée, le dépôt de développement, la documentation et les autres fichiers ou outils.


## 009. APP-PROTOTYPE — Prototype / maquette non assimilé au produit final

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `5bbc71ef-8959-4af7-a5a9-4fefc0e00c4b` ; modèle `5f85ef04-dab3-474a-bdea-ca4ed9f9799c`, statut `published`.
- **Défauts rédactionnels** : Énumération technique des absences possibles.
- **Éléments préservés** : Représentation ou simulation pour valider une orientation ; absence possible de moyens complets de production, selon le périmètre vendu.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Les limites doivent être expliquées avant vente, pas déduites après livraison d’un intitulé prototype.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Les limites doivent être expliquées avant vente, pas déduites après livraison d’un intitulé prototype.
- **Changement important / vigilance** : Énumération technique des absences possibles.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le prototype ou la maquette fonctionnelle représente ou simule les écrans, parcours et comportements prévus au devis afin de valider une orientation. Il ne constitue pas nécessairement une application exploitable en production. Selon le périmètre, il peut ne pas comporter de véritable base de données, de sécurité complète, de performances finales, d’intégrations réelles, de traitements exhaustifs ni de mécanismes de sauvegarde ou d’exploitation.

### Proposition humaine — intégrale, à valider

Le prototype ou la maquette fonctionnelle présente ou simule les écrans, les parcours et les comportements prévus au devis. Il sert à valider une orientation.

Il ne s’agit pas nécessairement d’une application utilisable en production. Selon le périmètre convenu, il peut ne pas comprendre de véritable base de données, de sécurité complète, de performances définitives, de connexions réelles à d’autres outils, de traitements complets, de sauvegardes ou de moyens d’exploitation.


## 010. APP-RECETTE — Recette fonctionnelle et critères d’acceptation

- **Famille** : Applications métier. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `c1a45e81-f701-4161-947d-0d2ff5af8c1c` ; modèle `4b0f025b-fba8-4bac-af55-57efe430fd67`, statut `published`.
- **Défauts rédactionnels** : Recette et non-conformité confondues pour un lecteur non technique.
- **Éléments préservés** : Critères convenus, distinction anomalie/évolution, validation explicite et prouvée ; ni silence, ni paiement, ni mise en ligne ne valent automatiquement acceptation ; recours et défauts non apparents préservés.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas laisser une validation technique purger les garanties ou rendre irrecevable un défaut intermittent.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas laisser une validation technique purger les garanties ou rendre irrecevable un défaut intermittent.
- **Changement important / vigilance** : Recette et non-conformité confondues pour un lecteur non technique.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

La recette vérifie la conformité de la livraison au périmètre et aux critères d’acceptation convenus. Le Client transmet ses constats selon les modalités et pendant la période prévues au devis. Un défaut relevant des engagements ou des exigences légales est examiné comme une anomalie ou une non-conformité ; une fonction ou un changement de besoin réellement nouveau hors périmètre constitue une évolution à convenir séparément. La validation est explicite et sa preuve écrite est conservée, par exemple par email, bouton de validation ou document. Le silence, l’expiration d’un délai de recette, le paiement ou la mise en ligne ne valent pas automatiquement acceptation ni renonciation aux recours. La fin de la période de recette ne supprime pas les recours légaux ni la prise en compte d’un défaut non apparent.

### Proposition humaine — intégrale, à valider

La vérification de livraison, appelée recette, consiste à comparer l’application au périmètre et aux critères d’acceptation convenus. Vous nous transmettez vos constats selon les modalités et pendant la période prévues au devis.

Un défaut par rapport à nos engagements ou aux exigences légales est examiné comme une anomalie ou une non-conformité. Une fonction ou un besoin réellement nouveau, hors périmètre, est une évolution à convenir séparément.

Votre validation doit être explicite. Nous en conservons une preuve écrite, par exemple un email, une validation par bouton ou un document. Votre silence, la fin du délai de vérification, le paiement ou la mise en ligne ne valent pas automatiquement acceptation ni renonciation à vos recours.

La fin de cette période ne supprime pas les recours légaux ni la prise en compte d’un défaut qui n’était pas apparent.


## 011. AUDIT-PERIMETRE — Audit

- **Famille** : Audit. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d358022d-1729-476d-a86b-2971c7989879` ; modèle `cff65a55-6539-4441-8276-209536cceced`, statut `published`.
- **Défauts rédactionnels** : Situation observable et mention contraire abstraites.
- **Éléments préservés** : Observation à une date et selon les accès disponibles ; corrections ou mise en conformité non automatiquement incluses.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas promettre un diagnostic exhaustif ou une certification de conformité non vendue.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas promettre un diagnostic exhaustif ou une certification de conformité non vendue.
- **Changement important / vigilance** : Situation observable et mention contraire abstraites.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Un audit constitue une analyse de la situation observable au moment de sa réalisation.

Les conclusions reposent sur les accès, informations et éléments disponibles au moment de l’audit.

Sauf mention contraire, l’audit n’inclut pas automatiquement les travaux de correction ou de mise en conformité qui peuvent être proposés séparément.

### Proposition humaine — intégrale, à valider

Notre audit analyse la situation que nous pouvons observer au moment de sa réalisation. Nos conclusions reposent sur les accès, les informations et les éléments alors disponibles.

Sauf mention contraire, il ne comprend pas les travaux de correction ou de mise en conformité. Ceux-ci peuvent être proposés séparément.


## 012. BASE-ACCEPTATION — Formation du contrat

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `ba6a38d9-2e9e-40e2-b335-0df1899316fb` ; modèle `247df8e0-e440-434c-9d11-51a0e95fa434`, statut `published`.
- **Défauts rédactionnels** : Style impersonnel ; formulation des versions peu concrète.
- **Éléments préservés** : Validité de l’offre ; conditions communiquées et acceptées ; preuve ; accord pour modification ; version acceptée de référence.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La signature commune ne remplace pas la preuve de communication des conditions avant acceptation.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La signature commune ne remplace pas la preuve de communication des conditions avant acceptation.
- **Changement important / vigilance** : Style impersonnel ; formulation des versions peu concrète.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le contrat est formé lorsque le Client accepte, pendant sa période de validité, le devis et les conditions qui lui ont été communiquées. L’acceptation est recueillie par le moyen indiqué au devis et sa preuve est conservée. Toute modification des prestations ou des conditions après acceptation nécessite un accord des parties, formalisé dans un avenant ou un devis complémentaire. La version acceptée reste la référence pour les engagements déjà conclus.

### Proposition humaine — intégrale, à valider

Dans ces conditions, « nous » désigne AtoumWeb et « vous » le client identifié au devis.

Le contrat est conclu lorsque vous acceptez le devis pendant sa période de validité, ainsi que les conditions que nous vous avons communiquées. Le devis précise comment recueillir votre acceptation ; nous en conservons la preuve.

Après acceptation, toute modification des prestations ou des conditions nécessite notre accord commun, formalisé dans un avenant ou un devis complémentaire. La version acceptée reste la référence pour les engagements déjà conclus.


## 013. BASE-CONFIDENTIALITE — Confidentialité

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `57a12cb5-879f-4d74-bbc2-9a1c0a626954` ; modèle `aad2378e-eec7-4539-adc4-bf1f7523b240`, statut `published`.
- **Défauts rédactionnels** : Termes abstraits : obligation appropriée, modalités nécessaires.
- **Éléments préservés** : Obligation réciproque ; usage limité ; accès restreint ; trois exceptions ; restitution/suppression/conservation à préciser.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Les durées et obligations RGPD réelles restent à définir séparément.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Les durées et obligations RGPD réelles restent à définir séparément.
- **Changement important / vigilance** : Termes abstraits : obligation appropriée, modalités nécessaires.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Chaque partie préserve les informations non publiques reçues pour la mission et ne les utilise que pour son exécution. Leur accès est limité aux personnes qui en ont besoin et soumises à une obligation appropriée de confidentialité. Ne sont pas couvertes les informations déjà publiques sans faute, obtenues légitimement d’un tiers ou dont la divulgation est légalement requise. Les modalités de restitution, de suppression ou de conservation nécessaires sont précisées selon la nature du dossier.

### Proposition humaine — intégrale, à valider

Chacun de nous protège les informations non publiques reçues pour la mission et les utilise uniquement pour la réaliser. Seules les personnes qui en ont besoin peuvent y accéder, avec une obligation de confidentialité adaptée.

Cette protection ne couvre pas les informations devenues publiques sans faute, obtenues légalement auprès d’un tiers ou dont la communication est imposée par la loi.

Selon le dossier, nous précisons les modalités nécessaires pour restituer, supprimer ou conserver ces informations.


## 014. BASE-COOPERATION — Obligations et coopération du client

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `cb723072-f2a4-4e98-99f7-6b52a907a4d9` ; modèle `ae8a55e7-7d34-454f-ae07-fc8455edb211`, statut `published`.
- **Défauts rédactionnels** : Interlocuteur habilité et procédure d’accord complémentaire peu accessibles ; recoupement avec WEB-CONTENUS.
- **Éléments préservés** : Éléments et validations nécessaires ; personne autorisée ; exactitude ; contraintes ; information du retard et planning ; accord hors périmètre.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer un retard du client en report automatique de tous les délais.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas transformer un retard du client en report automatique de tous les délais.
- **Changement important / vigilance** : Interlocuteur habilité et procédure d’accord complémentaire peu accessibles ; recoupement avec WEB-CONTENUS.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le Client fournit les informations, contenus, accès et validations nécessaires aux prestations convenues et désigne un interlocuteur habilité à décider. Il vérifie l’exactitude des éléments transmis et signale les contraintes connues. Lorsqu’un élément nécessaire manque ou arrive tardivement, AtoumWeb informe le Client de l’incidence sur la réalisation et propose un planning adapté. Une demande qui modifie le périmètre convenu suit la procédure d’accord complémentaire.

### Proposition humaine — intégrale, à valider

Vous nous fournissez les informations, contenus, accès et validations nécessaires aux prestations convenues. Vous désignez une personne autorisée à prendre les décisions pour votre projet, vérifiez les éléments transmis et nous signalez les contraintes connues.

Si un élément nécessaire manque ou arrive en retard, nous vous expliquons ses conséquences sur la réalisation et proposons un calendrier adapté.

Une demande qui change le périmètre du devis doit faire l’objet d’un accord complémentaire.


## 015. BASE-DELAIS — Délais et planning

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `03879272-62d6-4c3a-8206-4d1323369f0b` ; modèle `180a2c80-789c-4e3b-a18c-ac15c99b124f`, statut `published`.
- **Défauts rédactionnels** : Phrases longues ; dépendance extérieure et règles impératives ; calendrier du dossier incomplet.
- **Éléments préservés** : Départ et délais convenus ; date/délai B2C avant acceptation ; pas de départ indéterminé ; information/discussion ; recours maintenus.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Un événement imprécis peut ne pas suffire à l’information précontractuelle du consommateur. Vérifier les délais réellement convenus.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Un événement imprécis peut ne pas suffire à l’information précontractuelle du consommateur. Vérifier les délais réellement convenus.
- **Changement important / vigilance** : Phrases longues ; dépendance extérieure et règles impératives ; calendrier du dossier incomplet.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le devis précise le calendrier, les conditions de départ et les dates ou délais d’exécution convenus. Pour un Client consommateur, une date ou un délai d’exécution est communiqué avant l’acceptation ; une simple estimation indicative ne remplace pas cette information obligatoire. Les conditions de départ ne peuvent rendre l’exécution indéterminée ni écarter les recours légaux. AtoumWeb informe le Client lorsqu’une information manquante, une validation attendue ou une dépendance extérieure affecte ce calendrier. Les conséquences et le nouveau planning sont discutés avec le Client. Ces circonstances n’écartent pas automatiquement les engagements pris ni les droits légaux applicables.

### Proposition humaine — intégrale, à valider

Le devis précise le calendrier, les conditions de démarrage et les dates ou délais d’exécution convenus.

Si vous êtes un consommateur, nous vous communiquons une date ou un délai d’exécution avant votre acceptation. Une estimation simplement indicative ne remplace pas cette information. Les conditions de démarrage ne peuvent laisser l’exécution sans échéance déterminable ni écarter vos recours légaux.

Lorsqu’une information manquante, une validation attendue ou un service extérieur affecte le calendrier, nous vous en informons. Nous discutons avec vous des conséquences et du nouveau planning. Ces difficultés ne suppriment pas automatiquement nos engagements ni les droits prévus par la loi.


## 016. BASE-DONNEES — Données et accès

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `23243967-02d3-4d3a-8a0b-fb9e5adeff62` ; modèle `bd1b434b-50ca-4f6d-b0fc-82f7bef4c0ea`, statut `published`.
- **Défauts rédactionnels** : Accumulation technique ; simple renvoi au RGPD insuffisant pour un dossier réel.
- **Éléments préservés** : Usage autorisé ; accès nécessaires ; rôles ; instructions/sécurité/conservation/restitution/suppression ; encadrement préalable ; information des personnes distincte.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Un encadrement concret de sous-traitance peut être nécessaire ; cette clause générale ne suffit pas.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Un encadrement concret de sous-traitance peut être nécessaire ; cette clause générale ne suffit pas.
- **Changement important / vigilance** : Accumulation technique ; simple renvoi au RGPD insuffisant pour un dossier réel.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Les accès et données confiés pour la mission sont utilisés dans le périmètre autorisé et limités aux besoins de la prestation. Les parties identifient leurs rôles réels dans les traitements et précisent les instructions, mesures de sécurité, accès, durées de conservation et modalités de restitution ou de suppression nécessaires. Lorsqu’AtoumWeb traite des données personnelles pour le compte du Client, un encadrement conforme au RGPD doit être établi avant ce traitement. Le présent socle ne remplace pas cet encadrement spécifique ni les informations destinées aux personnes concernées.

### Proposition humaine — intégrale, à valider

Nous utilisons les accès et les données confiés uniquement dans le cadre autorisé et pour les besoins de la prestation.

Nous précisons ensemble le rôle de chacun, les instructions à suivre, les mesures de sécurité, les personnes autorisées à accéder aux données, leur durée de conservation et les modalités nécessaires de restitution ou de suppression.

Si nous traitons des données personnelles pour votre compte, les conditions de ce traitement doivent être établies conformément au RGPD avant son commencement. Cette clause générale ne remplace ni cet accord spécifique ni les informations à fournir aux personnes concernées.


## 017. BASE-FORCE-MAJEURE — Force majeure

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `0696beba-8bf9-4200-bb60-6d745a7fa569` ; modèle `25871a2c-7bf1-4f08-a6f5-19586a52f67c`, statut `published`.
- **Défauts rédactionnels** : Durable ou définitif ne décrit pas précisément un empêchement temporaire prolongé.
- **Éléments préservés** : Qualification légale ; information ; suspension selon loi ; fin selon loi ; panne de tiers non automatiquement force majeure.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier suspension/résolution, notamment si un retard justifie la résolution ; aucune panne automatiquement exonératoire.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier suspension/résolution, notamment si un retard justifie la résolution ; aucune panne automatiquement exonératoire.
- **Changement important / vigilance** : Durable ou définitif ne décrit pas précisément un empêchement temporaire prolongé.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S4 — Force majeure — 1218](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431/2026-09-27).

### Texte publié actuel — intégral

La partie empêchée d’exécuter une obligation par un événement répondant aux conditions légales de la force majeure en informe l’autre partie et précise les conséquences connues. Un empêchement temporaire suspend l’obligation affectée dans les conditions légales ; un empêchement durable ou définitif est traité selon les règles applicables à la fin du contrat. Une panne ou une défaillance de tiers ne constitue pas automatiquement un cas de force majeure.

### Proposition humaine — intégrale, à valider

Si un événement répondant aux conditions légales de la force majeure empêche l’un de nous de remplir une obligation, la partie concernée en informe l’autre et précise les conséquences connues.

Si l’empêchement est temporaire, l’obligation concernée est suspendue dans les conditions prévues par la loi. Si l’empêchement se prolonge ou devient définitif, ses conséquences sur la fin du contrat sont traitées selon les règles applicables.

Une panne ou la défaillance d’un prestataire extérieur ne constitue pas, à elle seule, un cas de force majeure.


## 018. BASE-OBJET — Objet et champ d'application

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `be9149ea-f185-4a70-b1e3-1e989f6bb16f` ; modèle `5e542d5f-0739-439f-b6af-7bf6432cf59a`, statut `published`.
- **Défauts rédactionnels** : Bonne substance ; place tardive ; hiérarchie abstraite.
- **Éléments préservés** : Documents et annexes citées ; périmètre décrit ; priorité particulières/spécifiques/socle ; loi impérative.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier la communication effective des annexes, pas seulement leur citation.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Vérifier la communication effective des annexes, pas seulement leur citation.
- **Changement important / vigilance** : Bonne substance ; place tardive ; hiérarchie abstraite.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le devis accepté, ses conditions particulières, les clauses applicables qui l’accompagnent et les annexes expressément citées constituent le contrat. Il couvre uniquement les prestations et livrables qui y sont décrits. En cas de contradiction, les conditions particulières prévalent sur les clauses spécifiques de prestation, puis sur le socle commun, sous réserve des règles légales impératives.

### Proposition humaine — intégrale, à valider

Votre devis accepté, ses conditions particulières, les clauses qui l’accompagnent et les annexes expressément citées forment le contrat. Celui-ci porte sur les prestations et livrables qui y sont décrits.

Si deux dispositions se contredisent, les conditions particulières priment sur les clauses propres aux prestations, qui priment elles-mêmes sur les conditions générales communes. Les règles légales auxquelles il n’est pas possible de déroger restent applicables.


## 019. BASE-PAIEMENT — Modalités générales de paiement

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `cae5b902-e682-4f81-9dd1-b741a7a90630` ; modèle `086d23bb-8072-4b18-8f86-fa623ca3c4b6`, statut `published`.
- **Défauts rédactionnels** : Paragraphe dense ; acompte par défaut alors que l’éditeur autorise des arrhes ; modèle commercial interne.
- **Éléments préservés** : Qualification explicite ; échéances/moyens ; choix acompte et autre choix exprès ; arrhes B2C et double restitution ; restrictions encaissement ; accord échéancier ; rétractation/remboursements.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Assurer la cohérence clause/choix enregistré. Certains contrats hors établissement interdisent un paiement pendant sept jours, sous exceptions.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Assurer la cohérence clause/choix enregistré. Certains contrats hors établissement interdisent un paiement pendant sept jours, sous exceptions.
- **Changement important / vigilance** : Rendre cohérents acompte par défaut, choix exprès et régime des arrhes applicable ; aucune règle d’encaissement ne doit neutraliser une interdiction légale.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S5 — Arrhes et avance — L214-1](https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006069565&idArticle=LEGIARTI000032221227) ; [S6 — Paiement hors établissement — L221-10](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226864/2022-05-30).

### Texte publié actuel — intégral

Le devis indique la nature de toute somme versée d’avance, son montant, les échéances et les moyens de paiement. Le premier règlement du prix est expressément qualifié d’acompte au devis, conformément au modèle commercial AtoumWeb. Les arrhes ne sont pas le régime commercial retenu par défaut ; tout autre régime doit être expressément convenu. Pour un Client consommateur, en l’absence de stipulation contraire, les sommes versées d’avance constituent des arrhes : le Client peut se dédire en les perdant et le professionnel en restituant le double, sans préjudice des règles impératives applicables. Une condition de démarrage après encaissement doit être expressément prévue et ne permet pas de percevoir une somme pendant une période où la loi l’interdit, notamment pour certains contrats hors établissement. Les paiements intermédiaires et le solde sont dus aux échéances convenues. Une modification de l’échéancier nécessite l’accord des parties. Les droits de rétractation, les remboursements et les autres droits légaux restent applicables.

### Proposition humaine — intégrale, à valider

Le devis précise le montant, la nature et les échéances des paiements, ainsi que les moyens de règlement.

Nous prévoyons par défaut un acompte, expressément indiqué au devis. Un autre régime doit être convenu explicitement. Si vous êtes un consommateur et qu’aucune disposition contraire n’est prévue, les sommes versées d’avance sont des arrhes : vous pouvez renoncer à la commande en les perdant ; si nous renonçons, nous vous en restituons le double, sous réserve des règles légales applicables.

Si le démarrage dépend de l’encaissement d’un paiement, cette condition doit être précisée. Elle ne nous autorise pas à percevoir une somme lorsque la loi l’interdit, notamment pour certains contrats conclus hors établissement.

Les paiements intermédiaires et le solde sont dus aux échéances convenues. Toute modification de l’échéancier nécessite notre accord commun. Les droits de rétractation, de remboursement et les autres droits légaux restent applicables.


## 020. BASE-PI — Propriété intellectuelle et droits d'utilisation

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `cdb80eb7-e065-4a80-a3be-717874cb3b42` ; modèle `4885fa1f-e0cb-49d9-a027-3896865cb47c`, statut `published`.
- **Défauts rédactionnels** : Large et pérenne imprécis sans paramètres ; logiciels, graphisme et tiers mélangés.
- **Éléments préservés** : Créations/outils génériques/tiers distincts ; licence spécifique utilisable/maintenable/modifiable ; exclusivité/cession expresse ; usages/supports/territoire/durée/effet ; graphisme/photo ; livraison pas cession ; licences et autorisations.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer une licence en cession. Les droits concédés restent à décrire ; une cession nécessite une délimitation précise.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas transformer une licence en cession. Les droits concédés restent à décrire ; une cession nécessite une délimitation précise.
- **Changement important / vigilance** : Large et pérenne imprécis sans paramètres ; logiciels, graphisme et tiers mélangés.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les éléments créés spécifiquement pour le Client sont distingués des outils, méthodes, composants génériques d’AtoumWeb et des ressources tierces. Pour les développements spécifiques, le modèle AtoumWeb prévoit une licence suffisamment large et pérenne permettant au Client d’utiliser, exploiter, maintenir et faire modifier le livrable. Une exclusivité ou cession particulière nécessite un accord exprès. Les droits convenus sont précisément décrits au devis ou dans son annexe, avec leurs usages, supports, territoire, durée et conditions d’effet. Les créations graphiques et photographies suivent les droits adaptés au livrable, définis par leurs clauses spécifiques. La livraison d’un fichier ne vaut pas, à elle seule, cession de tous les droits. Les éléments tiers restent soumis à leurs licences et le Client fournit les autorisations nécessaires sur ses propres contenus.

### Proposition humaine — intégrale, à valider

Les créations réalisées pour vous sont distinguées de nos outils, méthodes et composants réutilisables, ainsi que des ressources appartenant à des tiers.

Pour les développements spécifiques, nous prévoyons une licence suffisamment large et durable pour vous permettre d’utiliser, d’exploiter, de maintenir et de faire modifier le livrable. Une exclusivité ou une cession particulière nécessite un accord exprès.

Le devis ou son annexe précise les droits convenus : usages autorisés, supports, territoire, durée et conditions de prise d’effet. Les créations graphiques et les photographies suivent les droits prévus dans leurs clauses spécifiques.

Recevoir un fichier ne signifie pas acquérir tous les droits sur celui-ci. Les ressources tierces restent soumises à leurs licences. Vous devez disposer des autorisations nécessaires pour les contenus que vous fournissez.


## 021. BASE-PRIX — Prix et périmètre

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `8c0f03b2-d39d-433a-8c08-ce14f38d2158` ; modèle `f7243815-ad98-436f-b519-5c1a2e1bb6d6`, statut `published`.
- **Défauts rédactionnels** : Texte déjà clair ; formulations encore impersonnelles.
- **Éléments préservés** : Prix/périmètre acceptés ; taxes ; information et accord avant coût hors périmètre ; nouvelle demande sans prix modifié automatiquement.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucun changement de prix ou de fiscalité proposé.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Aucun changement de prix ou de fiscalité proposé.
- **Changement important / vigilance** : Texte déjà clair ; formulations encore impersonnelles.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Les prix et le périmètre des prestations sont ceux du devis accepté. Les taxes sont présentées selon le régime fiscal applicable. Un travail ou un coût externe non compris dans ce périmètre nécessite une information et un accord du Client avant engagement. Une nouvelle demande ne modifie pas, à elle seule, le prix de la prestation déjà convenue.

### Proposition humaine — intégrale, à valider

Les prix et les prestations sont ceux du devis accepté. Les taxes sont présentées selon le régime fiscal applicable.

Avant d’engager un travail ou un coût extérieur non compris dans le devis, nous vous en informons et demandons votre accord.

Une nouvelle demande ne modifie pas, à elle seule, le prix de la prestation déjà convenue.


## 022. BASE-RESPONSABILITE — Responsabilités générales

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `848922a2-3391-495a-a45b-4e2ec0cb6f60` ; modèle `8a68cdc1-c2e3-49eb-bdef-e3f733ae6c66`, statut `published`.
- **Défauts rédactionnels** : Réserves répétées dans plusieurs modules ; suppression globale risquée.
- **Éléments préservés** : Obligations propres ; risques connus ; tiers pas exonération ; responsabilités précisées ; garanties et responsabilités imposées préservées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucun plafond ni transfert automatique à ajouter. Relire l’effet combiné des modules, particulièrement en B2C.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Aucun plafond ni transfert automatique à ajouter. Relire l’effet combiné des modules, particulièrement en B2C.
- **Changement important / vigilance** : Réserves répétées dans plusieurs modules ; suppression globale risquée.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Chaque partie répond des obligations qui lui incombent dans le périmètre convenu. AtoumWeb informe le Client d’un risque ou blocage connu affectant la prestation. La présence d’une dépendance extérieure ne l’exonère pas de ses propres obligations d’intégration ou d’intervention. Les responsabilités sur les contenus, accès, sauvegardes et environnements sont précisées par les clauses applicables. Aucun mécanisme contractuel ne peut écarter une responsabilité ou une garantie que la loi impose.

### Proposition humaine — intégrale, à valider

Chacun de nous répond des obligations qui lui reviennent pour les prestations convenues. Nous vous signalons les risques ou blocages dont nous avons connaissance.

Le recours à un prestataire extérieur ne nous dispense pas de nos propres obligations d’intégration ou d’intervention. Les clauses concernées précisent les responsabilités relatives aux contenus, aux accès, aux sauvegardes et à l’environnement technique.

Aucune disposition du contrat ne supprime une responsabilité ou une garantie que la loi impose.


## 023. BASE-VALIDATION — Validation des livrables

- **Famille** : Socle commun. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d3ec4722-6c86-4f35-b827-74b84c682ea9` ; modèle `6db92e0b-6a53-4f89-a3b1-0e49202e944f`, statut `published`.
- **Défauts rédactionnels** : Recette et cycles commerciaux peu accessibles ; texte long mais protecteur.
- **Éléments préservés** : Vérification du périmètre ; anomalie/évolution ; écrit ; silence non automatique ; non-conformité hors quota ; garanties et recours conservés ; recette sans raccourcir recours.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La validation ne doit pas faire renoncer aux garanties ni consommer les cycles payants pour corriger une erreur de l’agence.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; La validation ne doit pas faire renoncer aux garanties ni consommer les cycles payants pour corriger une erreur de l’agence.
- **Changement important / vigilance** : Recette et cycles commerciaux peu accessibles ; texte long mais protecteur.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Le Client vérifie les livrables au regard du périmètre convenu et transmet ses demandes de correction selon les modalités de recette indiquées au devis. Un écart à ce périmètre est examiné comme une anomalie ; une nouvelle fonction, un nouveau livrable ou un changement de règle constitue une évolution à convenir séparément. La validation est conservée par écrit. Le silence du Client ne vaut pas automatiquement acceptation.

Les cycles commerciaux de correction sont distincts des reprises nécessaires pour remédier à une non-conformité imputable à AtoumWeb ; ces reprises ne sont pas décomptées comme des demandes nouvelles ou des cycles commerciaux supplémentaires. La validation d’un livrable ne prive pas le Client des recours, responsabilités ou garanties applicables, notamment lorsque la non-conformité porte sur une exigence légale ou une qualité normalement attendue. Un délai de recette ne réduit pas la durée d’un recours légal.

### Proposition humaine — intégrale, à valider

Vous vérifiez les livrables par rapport au devis et nous transmettez vos demandes de correction selon les modalités de vérification prévues.

Un écart au périmètre convenu est examiné comme une anomalie. Une nouvelle fonction, un livrable supplémentaire ou un changement de règle est une évolution à convenir séparément. Votre validation est conservée par écrit ; votre silence ne vaut pas automatiquement acceptation.

Les cycles de correction prévus commercialement sont distincts des reprises nécessaires pour corriger une non-conformité qui nous est imputable. Ces reprises ne sont pas comptées comme des demandes nouvelles ou des cycles supplémentaires.

Votre validation ne supprime pas vos recours ni les responsabilités et garanties applicables, notamment lorsqu’une non-conformité concerne une exigence légale ou une qualité normalement attendue. Le délai prévu pour vérifier le livrable ne raccourcit pas un délai de recours légal.


## 024. BLOG-DONNEES — Responsabilité sur contenus et rôles éditoriaux du blog

- **Famille** : Blog. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `fa229d9f-ee08-44bc-908c-cfd0b273a9d9` ; modèle `c5bbaf12-e0f6-4e97-ba5d-0d3ba86abb12`, statut `published`.
- **Défauts rédactionnels** : Rôles éditoriaux, comptes et traitements mêlés.
- **Éléments préservés** : Désignation et validation des rôles par le client, configuration convenue par l’agence ; gestion et modération limitées aux tâches commandées ; cadrage des fonctions traitant des données.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Les fonctions éditoriales ne déterminent pas seules la qualification RGPD ni la responsabilité de chaque acteur.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Les fonctions éditoriales ne déterminent pas seules la qualification RGPD ni la responsabilité de chaque acteur.
- **Changement important / vigilance** : Rôles éditoriaux, comptes et traitements mêlés.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Le Client désigne les auteurs, contributeurs et responsables de publication du blog et valide leurs droits d’accès, ainsi que les règles de préparation, de validation et de publication des articles. AtoumWeb configure les comptes et rôles prévus au devis. Sauf prestation éditoriale expressément commandée, le Client assure la gestion courante de ces comptes et la validation des contenus publiés, y compris ceux déposés par ses contributeurs. Les commentaires, profils d’auteurs ou autres fonctionnalités traitant des données sont activés et paramétrés uniquement dans le périmètre convenu. Le Client précise les informations nécessaires à leur fonctionnement et les consignes de modération. Une intervention éditoriale, une modération ou une gestion des comptes par AtoumWeb est limitée aux opérations expressément prévues au devis.

### Proposition humaine — intégrale, à valider

Vous désignez les auteurs, contributeurs et responsables de publication de votre blog. Vous validez leurs accès et les règles de préparation, de validation et de publication des articles. Nous configurons les comptes et les rôles prévus au devis.

Sauf prestation éditoriale expressément commandée, vous gérez ces comptes au quotidien et validez les contenus publiés, y compris ceux de vos contributeurs.

Les commentaires, profils d’auteurs et autres fonctions utilisant des données sont activés et configurés dans le seul périmètre convenu. Vous précisez les informations nécessaires à leur fonctionnement et les consignes de modération.

Nos interventions éditoriales, de modération ou de gestion des comptes sont limitées aux opérations expressément prévues au devis.


## 025. BLOG-PERIMETRE — Périmètre du blog technique

- **Famille** : Blog. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `c2932356-b9df-44d3-a88a-9c2f87b8f15f` ; modèle `5c757819-f30c-41aa-b8f9-4563032fba45`, statut `published`.
- **Défauts rédactionnels** : Structure technique et animation éditoriale à expliquer.
- **Éléments préservés** : Structure de publication vendue ; rédaction, import, migration et animation seulement comme prestations distinctes ; responsabilité des contenus publiés par le client.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer structure du blog et prestations éditoriales réellement commandées.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Distinguer structure du blog et prestations éditoriales réellement commandées.
- **Changement important / vigilance** : Structure technique et animation éditoriale à expliquer.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre la mise en place de la structure de blog décrite au devis, ainsi que les éléments nécessaires à la publication et à l’affichage des articles. La rédaction, l’import ou la migration d’articles et l’animation éditoriale ne sont inclus que lorsqu’ils apparaissent comme prestations distinctes. Le Client reste responsable des contenus qu’il publie ou fait publier.

### Proposition humaine — intégrale, à valider

Nous mettons en place la structure de blog décrite au devis et les éléments nécessaires pour publier et afficher vos articles.

La rédaction, l’import ou la migration d’articles et l’animation du blog sont compris uniquement s’ils figurent comme prestations distinctes. Vous restez responsable des contenus que vous publiez ou faites publier.


## 026. BRAND-ANIMATION — Animation logo / motion design

- **Famille** : Identité visuelle et animation. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `06e7e63d-bd9a-4165-86c5-d4693c5fd5d2` ; modèle `42498990-6127-467f-99c9-9ba73fdd9384`, statut `published`.
- **Défauts rédactionnels** : Motion design, brief et variantes peu accessibles.
- **Éléments préservés** : Séquences, variantes et formats convenus ; modifications et ressources non prévues susceptibles de complément ; droits et livraison traités séparément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Coordonner avec droits et fichiers ; pas de transfert implicite des sources animées.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Coordonner avec droits et fichiers ; pas de transfert implicite des sources animées.
- **Changement important / vigilance** : Motion design, brief et variantes peu accessibles.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

La prestation couvre la conception et la réalisation de l’animation ou du motion design décrit au devis, à partir du brief et des éléments validés. Le périmètre est limité aux séquences, variantes et formats convenus. Les adaptations à de nouveaux supports, les versions supplémentaires, les modifications importantes après validation, ainsi que les éléments sonores, voix, images ou ressources non prévus peuvent faire l’objet d’une prestation complémentaire. Les règles de livraison et de droits sont traitées par les modules associés.

### Proposition humaine — intégrale, à valider

Nous concevons et réalisons l’animation ou les éléments graphiques animés décrits au devis, à partir des indications et des éléments validés avec vous.

La prestation couvre les séquences, variantes et formats convenus. Des adaptations à d’autres supports, des versions supplémentaires, des modifications importantes après validation ou l’ajout de sons, de voix, d’images ou de ressources non prévus peuvent nécessiter une prestation complémentaire.

Les clauses associées précisent les fichiers remis et les droits accordés.


## 027. BRAND-CORRECTIONS — Séries d’ajustements

- **Famille** : Identité visuelle et animation. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `ebb13ced-59ea-4163-a390-ff256f48adae` ; modèle `d1c21959-1d78-4d78-a606-50d7b1188ac8`, statut `published`.
- **Défauts rédactionnels** : Correction, nouvelle proposition et validation à distinguer.
- **Éléments préservés** : Cycles du devis, ajustement de la direction retenue, distinction nouvelle proposition ; retours regroupés et validation des étapes.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Lire avec BASE-VALIDATION : les corrections dues pour non-conformité ne deviennent pas des cycles payants.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Lire avec BASE-VALIDATION : les corrections dues pour non-conformité ne deviennent pas des cycles payants.
- **Changement important / vigilance** : Correction, nouvelle proposition et validation à distinguer.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La prestation comprend les cycles de corrections prévus au devis. Une correction ajuste la direction graphique retenue sans modifier le brief ni créer une nouvelle proposition. Une demande qui change substantiellement le brief, la direction validée, le périmètre ou les livrables peut constituer une nouvelle proposition ou une prestation complémentaire. Le Client transmet ses demandes de correction de manière regroupée pour chaque cycle prévu au devis et valide chaque étape selon les modalités convenues.

### Proposition humaine — intégrale, à valider

Le devis précise les cycles de corrections compris. Une correction ajuste la direction graphique retenue, sans changer les indications de départ ni créer une nouvelle proposition.

Si votre demande change sensiblement ces indications, la direction validée, le périmètre ou les livrables, elle peut constituer une nouvelle proposition ou une prestation complémentaire.

Vous regroupez vos retours pour chaque cycle et validez les étapes selon les modalités convenues.


## 028. BRAND-DROITS — Droits sur création finale et propositions non retenues

- **Famille** : Identité visuelle et animation. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `74e94bf7-4a38-47c7-bf0c-a691249b208f` ; modèle `8af85d4b-4621-4da8-ae52-3fdec890f61c`, statut `published`.
- **Défauts rédactionnels** : Droits patrimoniaux, expressions originales et concepts denses.
- **Éléments préservés** : Droits définis sur la création finale ; condition de paiement si expressément prévue ; ressources tierces autorisées ; propositions non retenues distinctes des idées ; droits moraux préservés.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas substituer une licence à la cession vendue ni attribuer des droits illimités non détenus.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas substituer une licence à la cession vendue ni attribuer des droits illimités non détenus.
- **Changement important / vigilance** : La création finale, les propositions non retenues et les idées ont des régimes distincts ; ne pas tout réserver ou tout céder.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les droits patrimoniaux sur la création finale retenue et spécifiquement réalisée pour le Client sont cédés ou concédés selon les droits, usages, supports, territoire, durée et conditions d’effet définis dans le devis ou son annexe de droits. Pour le logo final, le devis ou son annexe prévoit des droits d’exploitation très larges, précisément délimités pour les usages convenus. Si leur prise d’effet est liée au paiement intégral, cette condition y figure expressément. Les éléments génériques, antérieurs et tiers sont identifiés séparément ; leur incorporation s’accompagne des autorisations nécessaires à l’exploitation convenue de la création finale. Les expressions originales des propositions non retenues ne sont pas transférées automatiquement. Cette réserve ne constitue pas un monopole sur les idées ou concepts en tant que tels. AtoumWeb ne réserve ou ne transmet que les droits dont elle dispose et respecte les licences tierces et les droits moraux.

### Proposition humaine — intégrale, à valider

Les droits d’exploitation sur la création finale que vous retenez et que nous avons réalisée pour vous sont cédés ou accordés par licence selon le devis ou son annexe de droits. Ces documents précisent les droits, usages, supports, territoire, durée et conditions de prise d’effet.

Pour le logo final, ils prévoient des droits d’exploitation très larges, précisément définis pour les usages convenus. Si ces droits prennent effet après paiement intégral, cette condition doit y être indiquée expressément.

Les éléments génériques, préexistants et tiers sont identifiés séparément et accompagnés des autorisations nécessaires à l’usage convenu de la création finale.

Les formes originales des propositions non retenues ne vous sont pas transférées automatiquement. Cela ne nous donne aucun monopole sur les idées ou les concepts eux-mêmes. Nous ne réservons ou transmettons que les droits dont nous disposons, dans le respect des licences tierces, des droits moraux et des règles impératives.


## 029. BRAND-PERIMETRE — Périmètre de création graphique

- **Famille** : Identité visuelle et animation. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `558c779e-9ef3-40f7-ac90-9e8d359d50ce` ; modèle `056497b4-d073-4be4-9058-f225c1c4b6d7`, statut `published`.
- **Défauts rédactionnels** : Création/déclinaison/refonte vocabulaire métier.
- **Éléments préservés** : Création, déclinaison et refonte distinctes ; seules prestations mentionnées ; impression, dépôt de marque, recherche d’antériorité et autres prestations non incluses par défaut.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La création d’un logo ne comprend pas implicitement la disponibilité juridique de la marque.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La création d’un logo ne comprend pas implicitement la disponibilité juridique de la marque.
- **Changement important / vigilance** : Création/déclinaison/refonte vocabulaire métier.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

La prestation couvre les travaux de création graphique, de déclinaison ou de refonte expressément identifiés au devis. Une création conçoit un élément nouveau à partir du brief validé. Une déclinaison adapte une création existante aux supports prévus. Une refonte modifie de manière substantielle un élément existant. Le périmètre n’inclut pas l’impression physique, le dépôt de marque, une recherche d’antériorité, un shooting, la création de contenus ou toute autre prestation non mentionnée au devis.

### Proposition humaine — intégrale, à valider

Nous réalisons les travaux graphiques expressément indiqués au devis : création, déclinaison ou refonte.

La création conçoit un nouvel élément à partir des indications validées. La déclinaison adapte une création existante aux supports prévus. La refonte modifie sensiblement un élément existant.

L’impression, le dépôt de marque, la recherche d’antériorité, une séance photo, la création de contenus et les autres prestations non mentionnées au devis ne sont pas compris.


## 030. BRAND-TIERS — Polices, images et ressources tierces

- **Famille** : Identité visuelle et animation. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `c6ef5f1f-bc13-45a5-9cc7-f6ee1cf8a724` ; modèle `97cb2cbb-58d1-4a29-9956-e44ed3532700`, statut `published`.
- **Défauts rédactionnels** : Mockups, premium et ayants droit à alléger.
- **Éléments préservés** : Licences des ressources externes, restrictions connues signalées, coûts et renouvellements seulement si vendus ; dépendance aux conditions des fournisseurs.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Identifier chaque licence utile à l’exploitation ; pas de cession de droits appartenant aux tiers.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Identifier chaque licence utile à l’exploitation ; pas de cession de droits appartenant aux tiers.
- **Changement important / vigilance** : Mockups, premium et ayants droit à alléger.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les polices, photographies, icônes, modèles, mockups, musiques, vidéos et autres ressources provenant de tiers restent soumis aux licences de leurs éditeurs ou ayants droit. AtoumWeb utilise ces ressources dans le cadre autorisé par la licence applicable et informe le Client des restrictions connues ayant une incidence sur l’usage prévu. Les achats, abonnements, licences premium, droits étendus et renouvellements ne sont inclus que lorsqu’ils figurent au devis. Leur maintien après livraison dépend des conditions du fournisseur concerné.

### Proposition humaine — intégrale, à valider

Les polices, photos, icônes, modèles de présentation, musiques, vidéos et autres ressources externes restent soumis aux licences de leurs éditeurs ou titulaires de droits.

Nous les utilisons dans le cadre autorisé et vous signalons les restrictions connues qui peuvent affecter l’usage prévu.

Les achats, abonnements, licences payantes, droits étendus et renouvellements sont compris uniquement s’ils figurent au devis. Leur maintien après la livraison dépend des conditions du fournisseur concerné.


## 031. CONS-DEBUT-ANTICIPE — Demande d'exécution avant la fin du délai de rétractation

- **Famille** : Socle consommateurs. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `5fca3f55-e976-49c5-91b1-038789890566` ; modèle `38cb6822-71b8-4010-b4d8-77da6e67af84`, statut `published`.
- **Défauts rédactionnels** : Démarrage et perte du droit mêlés dans un paragraphe dense.
- **Éléments préservés** : Demande expresse distincte et sa preuve ; maintien du droit au démarrage ; part due selon la loi ; conditions requises pour la perte du droit après exécution complète.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier service ou contenu numérique, support de la demande et reconnaissances effectivement recueillies.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier service ou contenu numérique, support de la demande et reconnaissances effectivement recueillies.
- **Changement important / vigilance** : Prévoir une demande distincte et sa preuve ; le simple démarrage ne supprime pas le droit.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S17 — Exceptions à la rétractation — L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/2026-06-26) ; [S20 — Exécution anticipée des services — L221-25](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563179/2026-07-10).

### Texte publié actuel — intégral

Lorsque le Client consommateur souhaite que la prestation payante commence avant la fin de son délai de rétractation, AtoumWeb recueille sa demande expresse distincte et en conserve la preuve. Ce démarrage n’emporte pas, à lui seul, perte du droit de rétractation. Si le Client se rétracte après un début d’exécution valablement demandé, la part due est déterminée dans les conditions légales. La perte du droit de rétractation après exécution complète de la prestation ne peut intervenir que dans les conditions prévues par la loi, après recueil de la demande et des reconnaissances requises du Client.

### Proposition humaine — intégrale, à valider

Si vous êtes consommateur et souhaitez commencer la prestation payante avant la fin du délai de rétractation, nous recueillons votre demande expresse, séparément, et en conservons la preuve.

Le démarrage ne vous fait pas perdre, à lui seul, votre droit de rétractation. Si vous l’exercez après avoir valablement demandé le commencement de la prestation, la part éventuellement due est calculée selon les conditions légales.

Vous ne pouvez perdre ce droit après l’exécution complète de la prestation que si les conditions légales sont réunies et si nous avons recueilli votre demande et les reconnaissances requises.


## 032. CONS-INFO — Informations précontractuelles

- **Famille** : Socle consommateurs. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `61e38a70-caeb-40a6-bd49-af48e5915b93` ; modèle `cb42ae97-99b4-40c6-b727-1d7737299b04`, statut `published`.
- **Défauts rédactionnels** : Énumération impersonnelle ; support durable à expliquer.
- **Éléments préservés** : Informations avant acceptation, caractéristiques, prix et frais, paiement et exécution, coordonnées, garanties et recours ; remise du devis et des conditions sur support durable.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Le texte ne remplace pas la remise des informations réelles et des annexes requises.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Le texte ne remplace pas la remise des informations réelles et des annexes requises.
- **Changement important / vigilance** : Énumération impersonnelle ; support durable à expliquer.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Avant l’acceptation, le Client consommateur reçoit les caractéristiques essentielles des prestations, leur prix total et leurs frais éventuels, les modalités de paiement et d’exécution ainsi que les informations de contact d’AtoumWeb. Les informations concernant les garanties applicables, les réclamations, la médiation et la rétractation lui sont également communiquées selon la nature du contrat. Le devis et les conditions acceptées lui sont remis sur un support durable.

### Proposition humaine — intégrale, à valider

Avant que vous acceptiez le devis, nous vous communiquons les caractéristiques essentielles de nos prestations, leur prix total, les frais éventuels, les modalités de paiement et d’exécution, ainsi que nos coordonnées.

Si vous êtes consommateur, nous vous indiquons aussi les garanties, les modalités de réclamation, la médiation et les règles de rétractation applicables à votre contrat.

Vous recevez le devis et les conditions acceptées sur un support durable, que vous pouvez conserver.


## 033. CONS-MEDIATION — Médiation de la consommation

- **Famille** : Socle consommateurs. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `d55e4ea7-eb04-4493-805a-e91be454be32` ; modèle `a2afb9fc-6220-4bcf-901c-499f380a97b6`, statut `published`.
- **Défauts rédactionnels** : Champs non renseignés et procédure abstraite.
- **Éléments préservés** : Réclamation écrite, tentative directe préalable, gratuité du médiateur compétent sous conditions de recevabilité ; possibilité de saisir le tribunal.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Compléter le contact et le médiateur réellement compétent auquel AtoumWeb adhère ; pas d’organisme fictif.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Compléter le contact et le médiateur réellement compétent auquel AtoumWeb adhère ; pas d’organisme fictif.
- **Changement important / vigilance** : Compléter le contact et le médiateur réellement compétent avant utilisation ; la proposition ne peut pas devenir un contrat final avec ces blancs.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S18 — Médiation de la consommation — administration](https://www.plus.transformation.gouv.fr/j-ai-droit-a-l-erreur/je-suis-un-professionnel-en-relation-avec-des-consommateurs-quelles-sont-mes).

### Texte publié actuel — intégral

Le Client consommateur peut adresser une réclamation écrite à [CONTACT RÉCLAMATION ATOUMWEB À RENSEIGNER]. Après une tentative de résolution directe restée sans issue, il peut recourir gratuitement au médiateur de la consommation compétent dont relève AtoumWeb, selon les conditions légales de recevabilité : [NOM DU MÉDIATEUR], [ADRESSE], [SITE INTERNET]. Cette démarche ne prive pas le Client de la possibilité de saisir une juridiction compétente.

### Proposition humaine — intégrale, à valider

Si vous êtes consommateur, vous pouvez nous adresser une réclamation écrite à : [CONTACT RÉCLAMATION ATOUMWEB À RENSEIGNER].

Si notre tentative de résolution directe n’aboutit pas, vous pouvez saisir gratuitement le médiateur de la consommation dont nous relevons, sous réserve des conditions légales de recevabilité : [NOM DU MÉDIATEUR], [ADRESSE], [SITE INTERNET].

Cette démarche ne vous empêche pas de saisir le tribunal compétent.


## 034. CONS-RETRACTATION — Droit de rétractation

- **Famille** : Socle consommateurs. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `8b386eaf-2711-4f94-9803-5db7de093390` ; modèle `11317574-7cd2-4117-9399-8b3a50ef4180`, statut `published`.
- **Défauts rédactionnels** : Nombreuses garanties accumulées ; coordonnées manquantes.
- **Éléments préservés** : Délai légal de quatorze jours, formulaire ou déclaration claire, fonctionnalité en ligne si requise, remboursement légal, exécution anticipée encadrée, prolongation et absence d’exclusion automatique du sur-mesure.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier qualification, computation du délai, formulaire, destinataire, remboursement et parcours en ligne ; pas d’exemption mariage présumée.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier qualification, computation du délai, formulaire, destinataire, remboursement et parcours en ligne ; pas d’exemption mariage présumée.
- **Changement important / vigilance** : Vérifier formulaire, coordonnées et parcours effectif ; ne pas présumer une exception pour service sur mesure ou mariage.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S17 — Exceptions à la rétractation — L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/2026-06-26) ; [S19 — Fonction de rétractation en ligne — L221-21](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310520/2026-09-15) ; [S20 — Exécution anticipée des services — L221-25](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563179/2026-07-10) ; [S21 — Rétractation : délais, prolongation et remboursement — L221-18 à L221-25](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221319/2026-07-01).

### Texte publié actuel — intégral

Lorsque le droit de rétractation s’applique à une prestation de services conclue à distance ou hors établissement, le Client consommateur dispose de quatorze jours à compter de la conclusion du contrat pour communiquer sa décision sans justification. Il peut utiliser le formulaire fourni ou adresser une déclaration dénuée d’ambiguïté à [COORDONNÉES DU DESTINATAIRE À RENSEIGNER]. Lorsque la fonctionnalité de rétractation en ligne est légalement requise, elle est également mise à disposition. AtoumWeb rembourse les sommes dues sans retard injustifié et dans le délai légal de quatorze jours après avoir été informée de la rétractation, selon les modalités légales. La part éventuellement due pour une exécution anticipée n’est retenue que si les conditions légales ont été respectées. Une information obligatoire manquante peut prolonger le délai de rétractation dans les conditions légales. Aucune exclusion n’est appliquée au seul motif qu’un service est réalisé sur mesure ; les exceptions éventuelles sont déterminées selon la qualification réelle de la fourniture.

### Proposition humaine — intégrale, à valider

Si vous êtes consommateur et que le droit de rétractation s’applique à votre prestation de services conclue à distance ou hors établissement, vous disposez de quatorze jours à compter de la conclusion du contrat pour nous informer de votre décision, sans avoir à la justifier.

Vous pouvez utiliser le formulaire remis avec le contrat ou envoyer une déclaration exprimant clairement votre décision à : [COORDONNÉES DU DESTINATAIRE À RENSEIGNER]. Lorsque la loi l’exige, une fonctionnalité de rétractation en ligne est également disponible.

Nous remboursons les sommes dues sans retard injustifié, dans le délai légal de quatorze jours après avoir été informés de votre décision et selon les modalités légales. Une part correspondant à une exécution anticipée ne peut être retenue que si les conditions légales ont été respectées.

L’absence d’une information obligatoire peut prolonger votre délai de rétractation dans les conditions prévues par la loi. Un service réalisé sur mesure n’est pas automatiquement exclu de ce droit : les exceptions dépendent de la nature réelle de la prestation.


## 035. CONTENT-BRIEF — Brief éditorial

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `49861b15-546a-4155-8ed9-17f6390cd9ea` ; modèle `3ba8065d-0f04-4215-a7bc-8f7c65e817ea`, statut `published`.
- **Défauts rédactionnels** : Brief et cible à traduire en termes directs.
- **Éléments préservés** : Informations nécessaires à la rédaction ; structuration et reformulation possibles ; validation finale des faits propres à l’activité par le client.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas faire de la validation factuelle une exonération générale de responsabilité éditoriale.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas faire de la validation factuelle une exonération générale de responsabilité éditoriale.
- **Changement important / vigilance** : Brief et cible à traduire en termes directs.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le Client fournit les informations nécessaires à la rédaction : sujet, objectifs, cible, éléments métier, sources internes et contraintes éditoriales.

AtoumWeb peut reformuler et structurer les informations transmises mais le Client reste responsable de la validation finale des éléments factuels propres à son activité.

### Proposition humaine — intégrale, à valider

Pour nous permettre de rédiger, vous nous indiquez le sujet, les objectifs, le public visé, les informations propres à votre activité, vos sources internes et vos contraintes éditoriales.

Nous pouvons reformuler et organiser ces informations. Vous restez responsable de la validation finale des faits qui concernent votre activité.


## 036. CONTENT-CORRECTIONS — Corrections éditoriales

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `59cd5380-fb1b-448c-84a8-4535c3fb4923` ; modèle `1a82297b-452d-4b8a-b616-ddc3ca7521a4`, statut `published`.
- **Défauts rédactionnels** : Correction et changement de brief peu distincts.
- **Éléments préservés** : Nombre de cycles convenu, corrections du texte issu des indications initiales ; changement important de sujet ou d’indications pouvant nécessiter un complément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Conserver BASE-VALIDATION pour les erreurs imputables à l’agence ; ne pas facturer automatiquement une correction due.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Conserver BASE-VALIDATION pour les erreurs imputables à l’agence ; ne pas facturer automatiquement une correction due.
- **Changement important / vigilance** : Correction et changement de brief peu distincts.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le nombre de cycles de corrections compris dans la prestation est celui prévu au devis ou dans l’offre.

Les corrections concernent le texte produit à partir du brief initial. Une modification substantielle du brief ou du sujet après rédaction peut entraîner une prestation complémentaire.

### Proposition humaine — intégrale, à valider

Le devis ou l’offre précise le nombre de cycles de corrections compris dans la rédaction.

Ces corrections portent sur le texte réalisé à partir des indications initiales. Un changement important du sujet ou de ces indications après la rédaction peut nécessiter une prestation complémentaire.


## 037. CONTENT-DROITS — Sources et éléments fournis

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `22a09fda-ca03-466c-99db-96f1026f4159` ; modèle `7e2e0456-8b45-46e8-9fc3-d55c63b2c848`, statut `published`.
- **Défauts rédactionnels** : Garantie client pouvant masquer les obligations propres de l’agence.
- **Éléments préservés** : Droits nécessaires garantis par le client ; responsabilités propres de chaque partie ; signalement des risques connus et refus d’usage apparemment illicite ; droits des tiers maintenus.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La garantie du client ne transfère pas toute la responsabilité et ne lie pas les tiers titulaires de droits.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; La garantie du client ne transfère pas toute la responsabilité et ne lie pas les tiers titulaires de droits.
- **Changement important / vigilance** : Garantie client pouvant masquer les obligations propres de l’agence.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Le Client garantit disposer des droits nécessaires sur les documents, données, photographies, marques ou autres éléments qu’il demande d’intégrer au contenu.

Chaque partie répond de ses propres actes et obligations dans l’utilisation de ces éléments. AtoumWeb informe le Client d’un risque d’atteinte aux droits dont il a connaissance et n’utilise pas un élément dont l’exploitation prévue apparaît illicite. L’origine d’un contenu fourni ou demandé par le Client n’exonère pas automatiquement AtoumWeb de sa responsabilité et ne prive pas un tiers de ses droits.

### Proposition humaine — intégrale, à valider

Vous garantissez disposer des droits nécessaires sur les documents, données, photos, marques et autres éléments que vous nous demandez d’intégrer au contenu.

Chacun de nous reste responsable de ses actes et de ses obligations dans leur utilisation. Si nous avons connaissance d’un risque d’atteinte aux droits, nous vous le signalons. Nous n’utilisons pas un élément lorsque l’exploitation prévue apparaît illicite.

Le fait que vous fournissiez ou demandiez un contenu ne nous exonère pas automatiquement de notre responsabilité et ne prive aucun tiers de ses droits.


## 038. CONTENT-MISE-EN-PAGE — Mise en page graphique de contenus

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `2d8bd9ce-b3a4-4354-adaf-385e423533e9` ; modèle `02975153-cdd4-4fe7-9923-d7886e59dd1c`, statut `published`.
- **Défauts rédactionnels** : Livrables et déclinaisons à préciser.
- **Éléments préservés** : Supports et éléments validés ; identité visuelle seulement si commandée ; validation des contenus avant finalisation ; formats et sources prévus ; nouvelles déclinaisons pouvant nécessiter un complément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer sources de travail et formats livrés sans changer la vente.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Distinguer sources de travail et formats livrés sans changer la vente.
- **Changement important / vigilance** : Livrables et déclinaisons à préciser.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

La prestation couvre la mise en page graphique des contenus et supports définis au devis, à partir des textes, visuels, formats et règles graphiques validés. Elle n’inclut pas une création ou une refonte d’identité visuelle sauf mention expresse. Le Client valide les contenus, leur ordre et les éléments de marque avant finalisation. Les formats livrés et la remise éventuelle de fichiers sources sont ceux prévus au devis. Toute déclinaison, nouveau format ou modification importante après validation peut faire l’objet d’une prestation complémentaire.

### Proposition humaine — intégrale, à valider

Nous mettons en page les contenus et supports prévus au devis, à partir des textes, visuels, formats et règles graphiques validés.

La prestation ne comprend pas la création ou la refonte d’une identité visuelle, sauf mention expresse. Avant la finalisation, vous validez les contenus, leur ordre et les éléments de marque.

Le devis précise les formats remis et la livraison éventuelle des fichiers sources. Une déclinaison, un nouveau format ou une modification importante après validation peut nécessiter une prestation complémentaire.


## 039. CONTENT-RECHERCHE — Recherche documentaire / sujet technique

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `45ccb899-c81f-465d-b6d5-8f8ec76d14a5` ; modèle `5f409048-104b-4b1e-aa90-2d71143d8bfb`, statut `published`.
- **Défauts rédactionnels** : Exploitation documentaire et conseil réglementé impersonnels.
- **Éléments préservés** : Recherche et livrable convenus, contribution et validation factuelle du client ; absence d’exhaustivité garantie ou de substitution à un professionnel réglementé.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas présenter la recherche comme un avis professionnel réglementé ou une vérification exhaustive.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas présenter la recherche comme un avis professionnel réglementé ou une vérification exhaustive.
- **Changement important / vigilance** : Exploitation documentaire et conseil réglementé impersonnels.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre les recherches documentaires ou techniques expressément prévues au devis et leur exploitation pour produire le livrable convenu. Le Client fournit les sources internes, informations métier et contraintes dont il dispose, puis valide les éléments factuels propres à son activité. AtoumWeb sélectionne et synthétise les sources accessibles dans le périmètre convenu, sans garantir leur exhaustivité ni se substituer à un conseil juridique, médical, financier ou à tout autre professionnel réglementé. Une modification substantielle du sujet ou du niveau de recherche peut nécessiter un complément de prestation.

### Proposition humaine — intégrale, à valider

Nous réalisons les recherches documentaires ou techniques prévues au devis pour produire le livrable convenu.

Vous nous transmettez vos sources internes, informations métier et contraintes, puis validez les faits propres à votre activité. Nous sélectionnons et synthétisons les sources accessibles dans le périmètre convenu, sans garantir de les couvrir toutes.

Cette recherche ne remplace pas l’avis d’un professionnel du droit, de la santé, de la finance ou d’une autre profession réglementée. Un changement important du sujet ou du niveau de recherche peut nécessiter une prestation complémentaire.


## 040. CONTENT-SEO — Contenu optimisé SEO

- **Famille** : Contenus. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a2470db4-c0be-4460-bed7-709dd0ff7ce3` ; modèle `e698556e-c87d-4426-8064-e69358380f79`, statut `published`.
- **Défauts rédactionnels** : SEO non développé ; phrase courte mais impersonnelle.
- **Éléments préservés** : Optimisation selon les objectifs à la date de la prestation ; absence de garantie de classement.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucune garantie de visibilité ajoutée ; aligner les objectifs réels du devis.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Aucune garantie de visibilité ajoutée ; aligner les objectifs réels du devis.
- **Changement important / vigilance** : SEO non développé ; phrase courte mais impersonnelle.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Lorsqu’un contenu SEO est commandé, AtoumWeb optimise le contenu selon les objectifs définis au moment de la prestation.

Cette optimisation ne constitue pas une garantie de positionnement dans les résultats de recherche.

### Proposition humaine — intégrale, à valider

Si vous commandez un contenu optimisé pour le référencement naturel (SEO), nous l’optimisons selon les objectifs définis au moment de la prestation.

Ce travail ne garantit pas une position dans les résultats des moteurs de recherche.


## 041. DATA-ACCES — Comptes, accès et propriété des outils de mesure

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d0ff868c-1470-4e7a-b019-84c903fb0e01` ; modèle `04c533f3-0440-4452-ba12-89b69a0dfbb0`, statut `published`.
- **Défauts rédactionnels** : Propriétés de mesure et révocation à expliquer sans absolu.
- **Éléments préservés** : Contrôle des comptes par le client autant que possible ; accès utiles seulement ; protection et fin des accès ; retrait par l’acteur compétent avec information et coopération.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier accès réellement contrôlables et obligations RGPD ; ne pas promettre une révocation que seul le client peut effectuer.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier accès réellement contrôlables et obligations RGPD ; ne pas promettre une révocation que seul le client peut effectuer.
- **Changement important / vigilance** : Propriétés de mesure et révocation à expliquer sans absolu.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Les comptes, propriétés et espaces de mesure doivent, autant que possible, appartenir au Client ou être créés sous son contrôle. Le Client fournit à AtoumWeb les accès et autorisations nécessaires à la prestation. AtoumWeb utilise et conserve uniquement les accès nécessaires au périmètre autorisé et pendant la durée utile à son intervention. Le Client gère les utilisateurs et les droits sur ses comptes. AtoumWeb cesse l’utilisation de ses accès devenus inutiles, supprime les secrets qu’elle n’a plus de raison légitime de conserver et révoque les droits qu’elle peut retirer. Lorsque la révocation dépend du Client ou du fournisseur, AtoumWeb lui signale les accès à supprimer et coopère à leur clôture.

### Proposition humaine — intégrale, à valider

Dans la mesure du possible, les comptes et espaces de mesure vous appartiennent ou sont créés sous votre contrôle. Vous nous donnez les accès et autorisations nécessaires à la prestation et gérez les utilisateurs ainsi que leurs droits sur vos comptes.

Nous utilisons et conservons seulement les accès utiles à l’intervention autorisée, pendant la durée nécessaire. Lorsqu’ils ne sont plus utiles, nous cessons de les utiliser, supprimons les éléments secrets que nous n’avons plus de raison légitime de garder et retirons les droits que nous pouvons révoquer.

Si ce retrait dépend de vous ou du fournisseur, nous vous signalons les accès à supprimer et coopérons à leur clôture.


## 042. DATA-ANALYSE — Périmètre d’une analyse ponctuelle

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d2ce79bd-0c30-4090-b699-44a500a5c550` ; modèle `5f7f1d75-6e17-4256-a5a0-aefee79479c1`, statut `published`.
- **Défauts rédactionnels** : Constats, complétude et périmètre à alléger.
- **Éléments préservés** : Données, période, constats et recommandations convenus ; missions spécialisées distinctes ; conclusions dépendantes des données, sans résultat commercial garanti.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas modifier la mission réelle en la renommant analyse ponctuelle.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas modifier la mission réelle en la renommant analyse ponctuelle.
- **Changement important / vigilance** : Constats, complétude et périmètre à alléger.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation consiste à analyser et interpréter les données disponibles à la date ou sur la période prévue au devis afin de produire les constats et recommandations convenus. Elle ne constitue pas automatiquement un audit SEO, un audit juridique, comptable ou financier, ni une mission de conseil stratégique globale, sauf prestation distincte expressément prévue. Les conclusions dépendent de la qualité, de la complétude et du contexte des données accessibles et ne garantissent pas un résultat commercial déterminé.

### Proposition humaine — intégrale, à valider

Nous analysons les données disponibles à la date ou sur la période prévue au devis pour vous remettre les constats et recommandations convenus.

Sauf prestation distincte expressément prévue, cette analyse ne comprend pas un audit SEO, juridique, comptable ou financier, ni une mission globale de conseil stratégique.

Les conclusions dépendent de la qualité des données accessibles, de leur caractère complet et de leur contexte. Elles ne garantissent pas un résultat commercial déterminé.


## 043. DATA-CONSENTEMENT — Consentement cookies et déclenchement des balises

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `50ddd88a-0207-491c-858a-1decafc084f5` ; modèle `2af2ab0e-5a99-4431-a6d5-1e6d5f5966a0`, statut `published`.
- **Défauts rédactionnels** : Balises, catégories et bases légales dans un seul bloc.
- **Éléments préservés** : Configuration vendue ; décisions du client selon son rôle ; obligations propres de l’agence ; consentement, refus, retrait et preuve contrôlés ; aucune validation juridique globale.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer consentement traceurs, exemptions et base RGPD ; une clause ne constitue pas la preuve du consentement.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Distinguer consentement traceurs, exemptions et base RGPD ; une clause ne constitue pas la preuve du consentement.
- **Changement important / vigilance** : Les choix du client ne libèrent pas l’agence de sa configuration et de son rôle réel ; pas de conformité garantie par la seule clause.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S22 — Traceurs : consentement, refus et retrait — CNIL](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi) ; [S23 — Mesure d’audience : exemption conditionnelle — CNIL](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience).

### Texte publié actuel — intégral

AtoumWeb peut installer et configurer techniquement l’outil de gestion du consentement et les catégories de traceurs prévus au devis, selon le dispositif retenu et les informations fournies ou validées par le Client. Le Client détermine, avec son conseil lorsque nécessaire, les finalités, bases légales, durées, catégories et règles de consentement applicables à son activité. Cette distinction ne dispense pas AtoumWeb d’exécuter correctement la configuration convenue, de respecter les obligations qui lui incombent dans son rôle réel ni de signaler une instruction qu’elle estime contraire aux règles de protection des données. Les mécanismes de consentement, de refus, de retrait et de preuve requis sont configurés et contrôlés dans le périmètre convenu. L’intervention technique ne vaut pas validation juridique de l’ensemble du site ou des traitements.

### Proposition humaine — intégrale, à valider

Nous pouvons installer et configurer l’outil de gestion du consentement et les catégories de traceurs prévus au devis, selon la solution retenue et les informations que vous fournissez ou validez.

Vous définissez, avec votre conseil si nécessaire, les objectifs des traitements, leurs bases légales, leurs durées, leurs catégories et les règles de consentement applicables à votre activité.

Cette répartition ne nous dispense pas de configurer correctement la solution convenue, de respecter les obligations liées à notre rôle réel ni de vous signaler une instruction que nous estimons contraire aux règles de protection des données.

Nous configurons et contrôlons les mécanismes requis pour accepter, refuser ou retirer le consentement et en conserver la preuve, dans le périmètre convenu. Notre intervention technique ne vaut pas validation juridique de l’ensemble de votre site ou de ses traitements.


## 044. DATA-MESURE — Mesure d’audience et événements suivis

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e0d0c575-1069-415d-bac0-67212db9f1c7` ; modèle `6b4830c4-5bda-476a-8a2e-646d58cdb2b7`, statut `published`.
- **Défauts rédactionnels** : Balises, conversions et exhaustivité peu accessibles.
- **Éléments préservés** : Outils et événements vendus, vérification du paramétrage ; limites liées aux plateformes, consentements et dispositifs des utilisateurs ; pas de collecte ou concordance absolue.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucune donnée manquante ne doit couvrir une erreur de configuration imputable à l’agence.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Aucune donnée manquante ne doit couvrir une erreur de configuration imputable à l’agence.
- **Changement important / vigilance** : Balises, conversions et exhaustivité peu accessibles.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S22 — Traceurs : consentement, refus et retrait — CNIL](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi).

### Texte publié actuel — intégral

La prestation couvre la mise en place ou la configuration des outils, balises, événements et conversions prévus au devis. Les mesures dépendent notamment du fonctionnement des plateformes, du consentement des utilisateurs, des bloqueurs, des navigateurs, des réglages du site et de la qualité des données transmises. AtoumWeb vérifie la configuration dans le périmètre convenu sans garantir une collecte absolument exhaustive ni une correspondance parfaite entre des plateformes utilisant des méthodes de calcul différentes.

### Proposition humaine — intégrale, à valider

Nous installons ou configurons les outils de mesure, les balises, les actions suivies et les conversions prévus au devis.

Les résultats dépendent notamment des plateformes, du consentement des visiteurs, des bloqueurs, des navigateurs, des réglages du site et de la qualité des données transmises.

Nous vérifions la configuration convenue, sans garantir de mesurer toutes les visites ni d’obtenir des chiffres parfaitement identiques entre des outils qui calculent différemment.


## 045. DATA-SUIVI — Suivi statistique récurrent

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `bf0c595c-ddca-4ad7-a577-9f9b083ee485` ; modèle `de9ca735-27d5-43f9-81ec-86a9b2378cd9`, statut `published`.
- **Défauts rédactionnels** : Cadence, anomalies observables et astreinte à rendre concrets.
- **Éléments préservés** : Fréquence et revues convenues ; écarts observés signalés selon les accès disponibles ; pas d’astreinte ni de surveillance permanente sans engagement distinct.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Une revue périodique ne doit pas être présentée comme une alerte permanente.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Une revue périodique ne doit pas être présentée comme une alerte permanente.
- **Changement important / vigilance** : Cadence, anomalies observables et astreinte à rendre concrets.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre l’examen périodique des indicateurs, des anomalies observables et des recommandations prévues au devis. Elle est réalisée selon la cadence convenue et ne constitue pas une surveillance continue, une astreinte ni un service d’alerte disponible vingt-quatre heures sur vingt-quatre, sauf engagement exprès distinct. AtoumWeb signale les écarts identifiés lors des revues prévues, sous réserve de la disponibilité des données et des accès nécessaires.

### Proposition humaine — intégrale, à valider

Nous examinons les indicateurs, les anomalies visibles et les recommandations prévus au devis, selon la fréquence convenue.

Ce suivi n’est pas une surveillance continue, une astreinte ou un service d’alerte disponible vingt-quatre heures sur vingt-quatre, sauf engagement distinct et exprès.

Nous vous signalons les écarts repérés pendant ces revues, sous réserve de disposer des données et des accès nécessaires.


## 046. DATA-TABLEAU — Périmètre du tableau de bord

- **Famille** : Mesure et analytics. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `3c69ed5b-d863-41a5-8186-f341a2a07dae` ; modèle `c6ab564e-3f39-49e7-857d-1ea43331e5d2`, statut `published`.
- **Défauts rédactionnels** : Restitution et concordance abstraites.
- **Éléments préservés** : Sources et indicateurs convenus, configuration de restitution ; limites de disponibilité, actualisation et calcul des données externes.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer exactitude du paramétrage et limites des sources externes.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Distinguer exactitude du paramétrage et limites des sources externes.
- **Changement important / vigilance** : Restitution et concordance abstraites.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le tableau de bord restitue les données disponibles dans les sources et selon les indicateurs définis au devis. Les valeurs affichées dépendent de la disponibilité, de l’actualisation, des définitions et des méthodes de calcul des plateformes connectées. AtoumWeb configure la restitution convenue mais ne garantit ni la disponibilité permanente des sources, ni l’exactitude absolue de données produites par un tiers, ni une concordance parfaite entre plusieurs outils.

### Proposition humaine — intégrale, à valider

Votre tableau de bord présente les données des sources et les indicateurs définis au devis.

Les chiffres affichés dépendent de la disponibilité des plateformes connectées, de leur actualisation, de leurs définitions et de leurs méthodes de calcul.

Nous configurons la présentation convenue. Nous ne garantissons pas la disponibilité permanente des sources, l’exactitude absolue des données produites par un tiers ni une correspondance parfaite entre plusieurs outils.


## 047. DESIGN-BRIEF — Brief graphique

- **Famille** : Conception graphique. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `567da43c-6ab2-4aab-be30-9181a9adec07` ; modèle `b516ccc9-fffb-4ca4-8668-5da742afb47f`, statut `published`.
- **Défauts rédactionnels** : Orientation et piste graphique à expliciter.
- **Éléments préservés** : Indications initiales validées ; changement important d’orientation après validation pouvant constituer une nouvelle demande.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Lire avec règle d’accord préalable du prix ; pas complément automatique.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Lire avec règle d’accord préalable du prix ; pas complément automatique.
- **Changement important / vigilance** : Orientation et piste graphique à expliciter.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La prestation est réalisée à partir du brief validé avec le Client.

Toute modification importante de l’orientation graphique après validation d’une piste peut être considérée comme une nouvelle demande et faire l’objet d’un complément.

### Proposition humaine — intégrale, à valider

Nous réalisons la prestation à partir des indications graphiques validées avec vous.

Si vous changez sensiblement l’orientation après avoir validé une piste, cette demande peut être traitée comme une nouvelle demande et faire l’objet d’un complément.


## 048. DESIGN-LIVRAISON — Fichiers livrés

- **Famille** : Conception graphique. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `08be4a13-bc3e-468f-9aeb-b23250fd9ee0` ; modèle `92e2f6da-cf8e-4f62-aece-c3ca805bded3`, statut `published`.
- **Défauts rédactionnels** : Distinction formats/sources et licences peu expliquée.
- **Éléments préservés** : Formats convenus, sources uniquement si expressément incluses ; licences tierces maintenues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas confondre remise des fichiers et droits d’exploitation.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas confondre remise des fichiers et droits d’exploitation.
- **Changement important / vigilance** : Distinction formats/sources et licences peu expliquée.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les formats livrés sont ceux prévus au devis.

Les fichiers sources de travail ne sont transmis que s’ils sont expressément inclus dans la prestation.

Les éléments tiers utilisés sous licence restent soumis aux conditions de leur licence respective.

### Proposition humaine — intégrale, à valider

Nous vous remettons les formats prévus au devis. Les fichiers sources de travail sont transmis uniquement s’ils sont expressément compris dans la prestation.

Les éléments externes utilisés sous licence restent soumis aux conditions de cette licence.


## 049. DESIGN-PROPOSITIONS — Propositions

- **Famille** : Conception graphique. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `83c1f24f-041a-4b1d-b8f0-8a3917a15ee7` ; modèle `17b56a41-af58-43f1-9061-4d37799ec67a`, statut `published`.
- **Défauts rédactionnels** : Cycles et déclinaisons jargon graphique.
- **Éléments préservés** : Nombre initial et cycles convenus ; nouvelles pistes ou adaptations supplémentaires après validation pouvant être facturées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas facturer une correction de non-conformité comme une nouvelle piste ; articulation BASE-VALIDATION.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas facturer une correction de non-conformité comme une nouvelle piste ; articulation BASE-VALIDATION.
- **Changement important / vigilance** : Cycles et déclinaisons jargon graphique.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Le nombre de propositions initiales et de cycles de corrections compris est celui indiqué au devis.

Les demandes de déclinaisons supplémentaires ou de nouvelles pistes après validation d’une direction graphique peuvent faire l’objet d’une facturation complémentaire.

### Proposition humaine — intégrale, à valider

Le devis indique le nombre de propositions initiales et de cycles de corrections compris.

Des adaptations supplémentaires ou de nouvelles pistes demandées après la validation d’une direction graphique peuvent faire l’objet d’une facturation complémentaire.


## 050. DEVWP-GARANTIE — Garantie corrective

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `bd596c2e-5722-401b-9e4c-34a13652d7d7` ; modèle `1e43e80e-1443-4093-b9c3-868dc1962b8d`, statut `published`.
- **Défauts rédactionnels** : Définition dense ; reproduction systématique peut être mal comprise.
- **Éléments préservés** : Durée et départ au devis, défauts imputables y compris intermittents ; pas de reproduction systématique exigée ; exclusions causales ; droits et garanties légales maintenus.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas imposer une reproduction permanente pour prendre un défaut en compte ; vérifier durée réelle.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas imposer une reproduction permanente pour prendre un défaut en compte ; vérifier durée réelle.
- **Changement important / vigilance** : Définition dense ; reproduction systématique peut être mal comprise.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

La garantie corrective contractuelle couvre les anomalies imputables à la livraison et relevant des engagements convenus. Sa durée et son point de départ sont indiqués au devis selon la catégorie de prestation. Une anomalie peut être intermittente ; le Client communique les informations dont il dispose pour permettre son analyse, sans qu’une reproduction systématique soit une condition de prise en compte. Les nouvelles fonctions ou changements de besoin hors périmètre ne sont pas inclus. Une modification du Client ou d’un tiers, ou une évolution d’une dépendance extérieure, n’est exclue que dans la mesure où elle est à l’origine de l’anomalie concernée. Cette garantie ne remplace ni ne réduit les garanties légales, les mises à jour légalement dues ou la responsabilité applicable à AtoumWeb.

### Proposition humaine — intégrale, à valider

Notre garantie corrective contractuelle couvre les anomalies de la livraison qui nous sont imputables et relèvent des engagements convenus. Le devis indique sa durée et son point de départ selon la prestation.

Une anomalie peut être intermittente. Vous nous transmettez les informations disponibles pour l’analyser ; il n’est pas nécessaire qu’elle se reproduise systématiquement pour que nous la prenions en compte.

Les fonctions nouvelles ou les changements de besoin hors périmètre ne sont pas compris. Une modification faite par vous ou un tiers, ou le changement d’un outil externe, n’est exclu de la garantie que dans la mesure où il cause l’anomalie concernée.

Cette garantie ne remplace ni ne réduit les garanties légales, les mises à jour légalement dues ou notre responsabilité applicable.


## 051. DEVWP-INTEGRATION — Automatisation et intégration avec service externe

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `38837a86-f3d6-46db-ab1c-d994b72fbcc1` ; modèle `970ad02f-def0-403d-b945-2e8fc16b6fc8`, statut `published`.
- **Défauts rédactionnels** : API/webhooks et flux à traduire en connexions.
- **Éléments préservés** : Services et échanges convenus, configuration et tests ; dépendances aux accès, quotas et conditions externes ; absence de garantie du service tiers et des traitements hors intégration.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Les dépendances ne libèrent pas d’une erreur d’intégration propre ; lire SERVICE-TIERS.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Les dépendances ne libèrent pas d’une erreur d’intégration propre ; lire SERVICE-TIERS.
- **Changement important / vigilance** : API/webhooks et flux à traduire en connexions.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre l’intégration ou l’automatisation avec les API, webhooks, CRM, Make, Zapier, Google Sheets ou autres services externes identifiés au devis. Son fonctionnement dépend également de la disponibilité des API, quotas, identifiants, abonnements, formats de données, règles et évolutions des fournisseurs concernés. AtoumWeb configure et teste les flux convenus sans garantir le fonctionnement permanent d’un service tiers ni les traitements réalisés hors du périmètre de l’intégration.

### Proposition humaine — intégrale, à valider

Nous réalisons l’intégration ou l’automatisation prévue au devis avec les services identifiés : interfaces de connexion (API), notifications automatiques entre outils, CRM, Make, Zapier, Google Sheets ou autres solutions.

Le fonctionnement dépend aussi de leurs disponibilités, quotas, accès, abonnements, formats de données, règles et évolutions.

Nous configurons et testons les échanges convenus, sans garantir le fonctionnement permanent d’un service externe ni les traitements qui dépassent notre intégration.


## 052. DEVWP-PERIMETRE — Périmètre d’un développement WordPress sur mesure

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `ae43a9ae-e490-44ac-aae8-ef22a75d525b` ; modèle `14bc1154-f64f-40c7-82a1-4ccbb534ff3e`, statut `published`.
- **Défauts rédactionnels** : Hook, snippet et workflow surchargent la clause.
- **Éléments préservés** : Fonctions et règles validées ; choix technique de l’agence sauf exigence expresse ; extensions hors périmètre à convenir séparément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas retirer une exigence technique expressément vendue ni confondre évolution et défaut.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas retirer une exigence technique expressément vendue ni confondre évolution et défaut.
- **Changement important / vigilance** : Hook, snippet et workflow surchargent la clause.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La prestation couvre le développement de la fonctionnalité WordPress décrite au devis selon les besoins, règles et limites validés. AtoumWeb choisit l’architecture technique adaptée, notamment plugin, thème enfant, hook, snippet ou autre mécanisme, sauf exigence explicite du devis. Les fonctionnalités, écrans, rôles, workflows et intégrations inclus sont ceux convenus. Toute nouvelle fonction, règle ou extension du périmètre après validation constitue une évolution susceptible de faire l’objet d’un accord complémentaire.

### Proposition humaine — intégrale, à valider

Nous développons la fonction WordPress décrite au devis, selon les besoins, règles et limites validés.

Sauf exigence expresse du devis, nous choisissons la solution technique adaptée : extension, thème enfant, point d’extension WordPress, portion de code ou autre mécanisme.

Les fonctions, écrans, droits d’accès, processus et connexions compris sont ceux convenus. Une nouvelle fonction, une nouvelle règle ou une extension du périmètre après validation est une évolution pouvant faire l’objet d’un accord complémentaire.


## 053. DEVWP-PI-REUTILISATION — Code spécifique client et composants génériques AtoumWeb

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `277cd1bf-7cd7-4d2b-8e72-7bd150a37b68` ; modèle `8621d0d2-e9ae-4dae-babc-5f2636a75066`, statut `published`.
- **Défauts rédactionnels** : Licence et cession répétées ; logique propre non définie concrètement.
- **Éléments préservés** : Licence spécifique durable et définie, exclusivité ou cession expresse ; réutilisation générique autorisée sans données, secrets ni logique client ; droits impératifs et licences tiers maintenus.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier droits réellement détenus, licences WordPress et composants ; pas de cession implicite.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier droits réellement détenus, licences WordPress et composants ; pas de cession implicite.
- **Changement important / vigilance** : Même logique de licence que APP et socle, avec contrôle des composants et licences applicables.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Les éléments spécifiquement créés pour le Client sont distingués des composants génériques, bibliothèques, méthodes, outils et savoir-faire réutilisables d’AtoumWeb. Le modèle retenu accorde au Client une licence suffisamment large et pérenne pour utiliser, exploiter, maintenir et faire modifier le livrable spécifique. Ses droits, usages, durée, territoire et conditions d’effet sont définis précisément au devis ou dans son annexe ; une exclusivité ou cession particulière nécessite un accord exprès. AtoumWeb peut réutiliser ses composants et connaissances génériques sans réutiliser les données, secrets, identifiants, contenus confidentiels ni la logique propre au Client. Toute exclusivité particulière doit être expressément prévue au devis.

AtoumWeb ne réutilise que les éléments dont elle détient les droits nécessaires ou dont la licence l’y autorise. Les éléments génériques et tiers incorporés à la livraison sont identifiés, avec les droits nécessaires à son exploitation convenue par le Client. Le devis ou l’annexe de droits définit la cession ou la licence des éléments spécifiques, les usages, la durée, le territoire, les conditions d’effet et les éventuelles restrictions ; les dispositions impératives et les licences tierces restent applicables.

### Proposition humaine — intégrale, à valider

Nous distinguons les éléments créés spécialement pour vous de nos composants, bibliothèques, méthodes, outils et savoir-faire réutilisables.

Le modèle retenu vous accorde une licence suffisamment large et durable pour utiliser, exploiter, maintenir et faire modifier le livrable spécifique. Le devis ou son annexe de droits définit précisément les droits accordés, les usages, la durée, le territoire, les conditions de prise d’effet et les éventuelles restrictions. Une exclusivité ou une cession particulière nécessite un accord exprès.

Nous pouvons réutiliser nos composants et connaissances génériques, mais pas vos données, secrets, identifiants, contenus confidentiels ni la logique propre à votre activité. Nous ne réutilisons que les éléments dont nous détenons les droits nécessaires ou dont la licence l’autorise.

Les éléments génériques et tiers incorporés à la livraison sont identifiés et accompagnés des droits nécessaires à l’exploitation convenue. Les règles impératives et les licences tierces restent applicables.


## 054. DEVWP-PLUGIN — Livraison d’un plugin autonome

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `56303f9c-eab5-4e2e-9f42-5adb755090b7` ; modèle `5455945c-3db1-4879-95ac-3fd509907db9`, statut `published`.
- **Défauts rédactionnels** : Plugin autonome et environnement non accessibles.
- **Éléments préservés** : Extension installable et activable, administration et documentation convenues ; versions identifiées avant acceptation ; vérification et limites futures ; garanties et licences applicables.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Le plugin livré utilisable reste distinct d’un prototype ; vérifier compatibilité et licences à la vente.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Le plugin livré utilisable reste distinct d’un prototype ; vérifier compatibilité et licences à la vente.
- **Changement important / vigilance** : Plugin autonome et environnement non accessibles.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

Lorsque la livraison porte sur un plugin autonome, celui-ci est fourni sous une forme installable et activable dans l’environnement prévu au devis, avec les fonctions d’administration et la documentation convenues. Les versions de WordPress, de PHP et des composants pris en charge sont identifiées dans le devis ou une annexe communiquée avant l’acceptation ; la livraison est vérifiée sur cette base. La prestation ne garantit pas une compatibilité illimitée avec toutes les versions futures ni avec des extensions, thèmes ou configurations non prévus. Une adaptation extérieure aux obligations déjà dues peut relever de la maintenance ou d’une évolution acceptée. Les garanties, mises à jour et droits impératifs de l’utilisateur, ainsi que les exigences des licences applicables, restent réservés.

### Proposition humaine — intégrale, à valider

Si nous livrons une extension WordPress autonome, elle est fournie sous une forme installable et activable dans l’environnement prévu au devis, avec les fonctions d’administration et la documentation convenues.

Le devis ou une annexe remise avant votre acceptation identifie les versions de WordPress, de PHP et des composants pris en charge. Nous vérifions la livraison sur cette base.

Nous ne garantissons pas une compatibilité illimitée avec toutes les versions futures ou avec des extensions, thèmes ou configurations non prévus. Une adaptation qui dépasse nos obligations déjà dues peut relever d’une maintenance ou d’une évolution acceptée.

Les garanties, mises à jour et droits impératifs de l’utilisateur, ainsi que les exigences des licences applicables, restent préservés.


## 055. DEVWP-RECETTE — Recette et critères d’acceptation

- **Famille** : Développement WordPress. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `40e3b499-6550-4688-b2b7-cd6211b96c93` ; modèle `5be562e5-fb4e-48b7-b674-6af14e6087cb`, statut `published`.
- **Défauts rédactionnels** : Recette et reproductibilité à lire avec garantie intermittente.
- **Éléments préservés** : Contrôle des critères convenus, anomalie constatable ou reproductible ; distinction des nouvelles fonctions et extensions ; vérifications et retours selon le devis.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La conjonction ou doit rester ; pas de condition de reproduction systématique ; renvoi BASE-VALIDATION pour recours.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; La conjonction ou doit rester ; pas de condition de reproduction systématique ; renvoi BASE-VALIDATION pour recours.
- **Changement important / vigilance** : «Constatable ou reproductible» ne doit pas devenir «reproductible à chaque fois» ; cohérence avec garantie des défauts intermittents.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

La recette vérifie la conformité de la livraison au périmètre et aux critères d’acceptation convenus. Une anomalie est un comportement constatable ou reproductible qui ne respecte pas une fonction, une règle ou un comportement attendu validé dans le périmètre convenu. Une nouvelle fonction, un changement de règle, une extension d’usage ou une adaptation non prévue constitue une évolution et non la correction d’une anomalie. Le Client réalise les vérifications et transmet ses retours selon les modalités prévues au devis.

### Proposition humaine — intégrale, à valider

La vérification de livraison, appelée recette, compare le développement au périmètre et aux critères d’acceptation convenus.

Une anomalie est un comportement que l’on peut constater ou reproduire et qui ne respecte pas une fonction, une règle ou un comportement attendu validé dans ce périmètre.

Une nouvelle fonction, un changement de règle, une extension d’usage ou une adaptation non prévue est une évolution, et non la correction d’une anomalie. Vous effectuez les vérifications et nous transmettez vos retours selon les modalités du devis.


## 056. ECOM-CATALOGUE — Données produits

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `10d96807-2d11-4846-99d2-e5240223d9a7` ; modèle `ad40da25-0ba4-4a2e-ab7e-fa1a2e6cb7e6`, statut `published`.
- **Défauts rédactionnels** : Liste technique et responsabilité peu incarnée.
- **Éléments préservés** : Données complètes et exactes fournies par le client ; actualisation hors prestation ; import massif expressément vendu.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer fourniture des données et qualité de leur intégration, qui reste notre obligation.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Distinguer fourniture des données et qualité de leur intégration, qui reste notre obligation.
- **Changement important / vigilance** : Liste technique et responsabilité peu incarnée.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le Client fournit les informations nécessaires à la création ou à l’intégration de son catalogue : noms, descriptions, prix, taux de TVA, références, variantes, stocks, poids, dimensions, photos et toute autre donnée nécessaire.

Le Client reste responsable de l’exactitude de ces informations et de leur mise à jour lorsque celle-ci n’est pas incluse dans la prestation.

L’intégration massive ou la reprise d’un catalogue existant n’est comprise que si elle est expressément prévue au devis.

### Proposition humaine — intégrale, à valider

Vous nous fournissez les données nécessaires à votre catalogue : noms, descriptions, prix, taux de TVA, références, variantes, quantités disponibles, poids, dimensions, photos et autres informations utiles.

Vous êtes responsable de leur exactitude. Leur mise à jour vous revient lorsqu’elle ne fait pas partie de notre prestation.

L’import de produits en nombre ou la reprise d’un catalogue existant est compris uniquement si le devis le prévoit expressément.


## 057. ECOM-IMPORT — Import / migration de catalogue

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `9d356311-e753-4112-943b-9d5b24b1aeaf` ; modèle `adb9cf38-ee25-4501-8618-6b5dc7d49ee9`, statut `published`.
- **Défauts rédactionnels** : Correspondance et résultat de contrôle techniques.
- **Éléments préservés** : Données exploitables et structurées, correspondances et résultat de contrôle validés avant import définitif ; travaux supplémentaires soumis à accord.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer correction des données source et erreurs d’importation de l’agence.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Distinguer correction des données source et erreurs d’importation de l’agence.
- **Changement important / vigilance** : Correspondance et résultat de contrôle techniques.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation couvre l’import ou la migration des données de catalogue expressément identifiées au devis. Le Client fournit des données exploitables, exactes et suffisamment structurées, puis valide les règles de correspondance et un résultat de contrôle avant l’import définitif. Les corrections de données, enrichissements, reprises manuelles ou traitements non prévus sont soumis à un accord complémentaire.

### Proposition humaine — intégrale, à valider

Nous importons ou transférons les données de catalogue expressément identifiées au devis.

Vous fournissez des données utilisables, exactes et suffisamment organisées. Avant l’import définitif, vous validez la manière dont les informations correspondent aux champs de la boutique et un résultat de contrôle.

Les corrections de données, enrichissements, reprises manuelles et autres traitements non prévus nécessitent un accord complémentaire.


## 058. ECOM-LEGAL — Contenus juridiques du marchand

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d174ac10-c5c4-462e-bce8-e6f0badf7fc5` ; modèle `51893d2d-7837-433b-ac91-552d489f63bb`, statut `published`.
- **Défauts rédactionnels** : Risque de confondre les CGV du marchand et celles d’AtoumWeb.
- **Éléments préservés** : Responsabilité des textes marchands ; livraison/retours/remboursements/informations produits ; intégration technique ; absence de validation juridique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La clause ne supprime pas les obligations propres de conseil et de bonne intégration ; elle ne certifie aucun texte.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; La clause ne supprime pas les obligations propres de conseil et de bonne intégration ; elle ne certifie aucun texte.
- **Changement important / vigilance** : Risque de confondre les CGV du marchand et celles d’AtoumWeb.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02).

### Texte publié actuel — intégral

Le Client reste responsable des contenus juridiques propres à son activité marchande, notamment ses conditions générales de vente aux consommateurs, ses modalités de livraison, de retour, de remboursement et les informations obligatoires liées aux produits qu’il commercialise.

AtoumWeb peut intégrer techniquement les textes fournis par le Client ou son conseil, mais cette intégration ne vaut pas validation juridique du contenu transmis.

### Proposition humaine — intégrale, à valider

Vous êtes responsable des textes juridiques liés à votre activité de commerçant : notamment vos conditions générales de vente aux consommateurs, vos règles de livraison, de retour et de remboursement, ainsi que les informations obligatoires sur vos produits.

Nous pouvons intégrer les textes que vous ou votre conseil nous fournissez. Cette intervention technique ne constitue pas une validation juridique de leur contenu.


## 059. ECOM-LIVRAISON — Livraison et transporteurs

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `696d220e-89e5-4f14-aa79-1e40d47f1bc2` ; modèle `46ca5374-4a0e-48cd-8600-cb99040e3195`, statut `published`.
- **Défauts rédactionnels** : Schéma de livraison et règles complexes peu concrets.
- **Éléments préservés** : Informations du client ; dépendance transporteurs/modules ; évolution ou complexité peut nécessiter complément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Lire les compléments avec les règles d’accord préalable du prix ; aucune facturation automatique.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Lire les compléments avec les règles d’accord préalable du prix ; aucune facturation automatique.
- **Changement important / vigilance** : Schéma de livraison et règles complexes peu concrets.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Les règles de livraison, tarifs, zones desservies, seuils de gratuité, délais annoncés et modalités de retrait sont définis à partir des informations fournies par le Client.

Le fonctionnement des services de transporteurs et de leurs modules dépend de prestataires tiers.

Toute règle complexe ou évolution ultérieure du schéma de livraison peut nécessiter une prestation complémentaire.

### Proposition humaine — intégrale, à valider

Nous configurons les tarifs de livraison, zones desservies, seuils de gratuité, délais annoncés et modalités de retrait à partir des informations que vous nous fournissez.

Les services des transporteurs et leurs modules dépendent de prestataires externes.

Des règles de livraison complexes ou une modification ultérieure de l’organisation prévue peuvent nécessiter une prestation complémentaire.


## 060. ECOM-MULTILINGUE — WooCommerce multilingue

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e61c8078-7267-4b8e-a2cc-cb61cf022978` ; modèle `27ce7182-5cc7-40e2-b5a6-e99a6c8fd8ae`, statut `published`.
- **Défauts rédactionnels** : Marchés, fiscalité et traduction mêlés.
- **Éléments préservés** : Langues, contenus et paramètres vendus ; traductions et textes du client sauf commande ; intégration technique des paramètres sans détermination du régime fiscal ou juridique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas assimiler intégration multilingue à une consultation fiscale ou à la conformité de tous les marchés.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas assimiler intégration multilingue à une consultation fiscale ou à la conformité de tous les marchés.
- **Changement important / vigilance** : Marchés, fiscalité et traduction mêlés.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre la configuration multilingue de la boutique et l’intégration des contenus et paramètres prévus au devis. Sauf prestation expressément commandée, le Client fournit et valide les traductions, informations produits et textes juridiques applicables à chaque marché. Les règles fiscales, moyens de paiement, livraisons et obligations commerciales propres aux pays ou langues concernés ne sont inclus que lorsqu’ils figurent au devis. AtoumWeb applique techniquement les paramètres fiscaux, commerciaux, de paiement et de livraison communiqués ou validés par le Client. AtoumWeb ne détermine pas le régime fiscal du Client ni les obligations juridiques applicables aux marchés visés.

### Proposition humaine — intégrale, à valider

Nous configurons les langues de la boutique et intégrons les contenus et paramètres prévus au devis.

Sauf prestation expressément commandée, vous fournissez et validez les traductions, les informations produits et les textes juridiques pour chaque marché.

Les règles fiscales, moyens de paiement, livraisons et obligations commerciales propres aux pays ou aux langues concernés sont compris uniquement s’ils figurent au devis.

Nous appliquons techniquement les paramètres fiscaux, commerciaux, de paiement et de livraison que vous communiquez ou validez. Nous ne déterminons pas votre régime fiscal ni les obligations juridiques des marchés visés.


## 061. ECOM-PAIEMENT — Solution de paiement

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `ff9d3988-ae6a-4a5a-8949-964093fe563d` ; modèle `0ef2cf48-a635-4bb6-97a9-d350720e0b2b`, statut `published`.
- **Défauts rédactionnels** : Explications abstraites sur les dépendances et l’exonération.
- **Éléments préservés** : Compte compatible, vérification, commissions et décisions du tiers ; bonne intégration et responsabilité propre ; pas d’exonération automatique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer la dépendance technique en transfert général de responsabilité.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas transformer la dépendance technique en transfert général de responsabilité.
- **Changement important / vigilance** : Explications abstraites sur les dépendances et l’exonération.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Lorsque le site intègre une solution de paiement tierce, le Client doit disposer d’un compte compatible et satisfaire aux exigences de vérification du prestataire concerné.

Le prestataire de paiement détermine ses commissions, ses vérifications et ses décisions relatives au compte selon ses propres conditions. Cette répartition ne dispense pas AtoumWeb de la bonne exécution de l’intégration convenue ni de sa responsabilité pour une erreur qui lui est imputable. Un incident externe n’entraîne pas automatiquement une exonération de responsabilité.

AtoumWeb intervient sur l’intégration technique dans le périmètre défini au devis.

### Proposition humaine — intégrale, à valider

Pour utiliser une solution de paiement externe, vous devez disposer d’un compte compatible et satisfaire aux vérifications demandées par son opérateur.

Cet opérateur fixe ses commissions et prend les décisions concernant votre compte selon ses propres conditions.

Nous réalisons l’intégration technique prévue au devis et restons responsables de sa bonne exécution et des erreurs qui nous sont imputables. Un incident chez l’opérateur ne nous dégage pas automatiquement de nos responsabilités.


## 062. ECOM-STOCK — Stock et données catalogue

- **Famille** : E-commerce. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `898546ab-fe95-488a-a4fa-03304b53438c` ; modèle `0bebc656-c84b-40b4-9150-b8dfa25a970a`, statut `published`.
- **Défauts rédactionnels** : Automatisation et flux peu accessibles.
- **Éléments préservés** : Configuration vendue ; données validées par client ; limites des sources externes ; accord complémentaire ; absence de gestion quotidienne sauf vente explicite.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas exonérer une erreur de configuration propre ni confondre maintenance et gestion du commerce.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas exonérer une erreur de configuration propre ni confondre maintenance et gestion du commerce.
- **Changement important / vigilance** : Automatisation et flux peu accessibles.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

La prestation couvre la configuration du suivi de stock décrite au devis. Le Client fournit et valide les quantités, règles de disponibilité et informations nécessaires à leur exploitation. Lorsqu’une synchronisation dépend d’un outil, d’un flux ou d’un service externe, son fonctionnement reste soumis aux limites de cette source. Toute règle de stock ou automatisation non prévue au devis nécessite un accord complémentaire. Sauf prestation de gestion ou de synchronisation expressément prévue au devis, AtoumWeb n’assure pas la mise à jour courante des quantités de stock après la livraison de la boutique.

### Proposition humaine — intégrale, à valider

Nous configurons le suivi des stocks prévu au devis. Vous fournissez et validez les quantités, les règles de disponibilité et les informations nécessaires à son utilisation.

Si les stocks sont synchronisés avec un autre outil ou service, cette synchronisation dépend aussi des possibilités et limites de cette source.

Une règle de stock ou une automatisation non prévue au devis nécessite un accord complémentaire. Après la livraison de la boutique, nous ne mettons pas à jour les quantités au quotidien, sauf si une prestation de gestion ou de synchronisation est expressément prévue au devis.


## 063. LANDING-FORM — Formulaires et collecte

- **Famille** : Landing pages. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `2a1d3892-0461-4795-ad9d-aa39f4aaf37a` ; modèle `4266f125-853b-4f0c-b3f1-8faa1f312a66`, statut `published`.
- **Défauts rédactionnels** : Traitements et CRM à expliquer ; rôle client non universel.
- **Éléments préservés** : Champs et traitements prévus, validation des données et informations par le client ; connexions externes seulement si vendues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La validation par le client ne suffit pas à déterminer les rôles RGPD ; conserver BASE-DONNEES.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La validation par le client ne suffit pas à déterminer les rôles RGPD ; conserver BASE-DONNEES.
- **Changement important / vigilance** : Traitements et CRM à expliquer ; rôle client non universel.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Les formulaires sont réalisés selon les champs et traitements prévus au devis.

Le Client valide les informations collectées, leur finalité et les mentions nécessaires relatives à la protection des données.

Les connexions à un CRM, un outil d’emailing, un agenda, un paiement ou toute autre solution externe sont incluses uniquement si elles figurent au devis.

### Proposition humaine — intégrale, à valider

Nous réalisons les formulaires avec les champs et les traitements prévus au devis.

Vous validez les informations demandées aux utilisateurs, leur finalité et les mentions nécessaires à la protection des données.

Une connexion à un outil de relation client (CRM), d’envoi d’emails, à un agenda, à un paiement ou à un autre service externe est comprise uniquement si elle figure au devis.


## 064. LANDING-GESTION — Gestion mensuelle

- **Famille** : Landing pages. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `59004464-af17-43f4-bd37-f54744634ad7` ; modèle `0243c7fc-0ecc-4836-9bda-98963897187a`, statut `published`.
- **Défauts rédactionnels** : Gestion mensuelle sans contenu détaillé ; facturation séparée vague.
- **Éléments préservés** : Souscription mensuelle expresse et opérations convenues ; refontes ou extensions hors périmètre pouvant être facturées séparément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas ajouter une reconduction ou un délai de résiliation ; accord de prix via socle.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas ajouter une reconduction ou un délai de résiliation ; accord de prix via socle.
- **Changement important / vigilance** : Gestion mensuelle sans contenu détaillé ; facturation séparée vague.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S1 — Formation, conditions générales et recours contractuels](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).

### Texte publié actuel — intégral

Lorsqu’une gestion mensuelle est souscrite, son périmètre correspond aux opérations définies dans l’offre ou le devis.

Les refontes, ajouts de fonctionnalités, nouvelles sections importantes ou modifications dépassant ce périmètre peuvent être facturés séparément.

### Proposition humaine — intégrale, à valider

Si vous souscrivez une gestion mensuelle de votre page, nous réalisons les opérations décrites dans l’offre ou le devis.

Les refontes, nouvelles fonctions, nouvelles sections importantes et autres modifications qui dépassent ce périmètre peuvent être facturées séparément.


## 065. LANDING-PERIMETRE — Périmètre d’une landing page

- **Famille** : Landing pages. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `9ff943e7-dd58-46e4-bf7f-19c147b3ed13` ; modèle `9eec6883-5c2a-4bb9-b2f7-d129b53683cb`, statut `published`.
- **Défauts rédactionnels** : Landing et tunnel multi-étapes jargon.
- **Éléments préservés** : Page unique ou autre périmètre exprès ; fonctions, parcours ou intégrations non prévus susceptibles de complément.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas imposer page unique si le devis prévoit expressément davantage.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas imposer page unique si le devis prévoit expressément davantage.
- **Changement important / vigilance** : Landing et tunnel multi-étapes jargon.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation de landing page couvre une page unique ou le périmètre expressément prévu au devis.

Toute page supplémentaire, fonctionnalité non prévue, tunnel multi-étapes, espace membre, logique métier particulière ou intégration complexe peut faire l’objet d’un complément de prix.

### Proposition humaine — intégrale, à valider

La prestation de landing page porte sur une page de présentation unique, ou sur le périmètre expressément prévu au devis.

Une page supplémentaire, une fonction non prévue, un parcours en plusieurs étapes, un espace membre, des règles métier particulières ou une connexion complexe à un autre outil peuvent nécessiter un complément de prix.


## 066. MAINT-INTERVENTIONS — Nombre d’interventions ou temps inclus

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `bdec7b68-1023-4c6e-a539-4a0ca2f26539` ; modèle `9d7f360c-c4cf-43ff-93bc-c03d4f2beab6`, statut `published`.
- **Défauts rédactionnels** : Stock d’heures et demandes commerciales ; mensuel dans une offre facturée annuellement.
- **Éléments préservés** : Quota précisé ; abonnement global ; pas banque d’heures ; non-report mensuel ; supplément accepté ; garanties hors quota ; recours inexécution conservés.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer quatre interventions mensuelles de30minutes maximum en réserve libre de deux heures ou en crédit annuel.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas transformer quatre interventions mensuelles de30minutes maximum en réserve libre de deux heures ou en crédit annuel.
- **Changement important / vigilance** : Quota mensuel non reportable, même si facturation annuelle ; différent d’un pack de temps consommable.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

La formule mensuelle peut inclure le nombre de petites interventions précisé au devis. Ces interventions font partie d’un abonnement global comprenant les opérations de maintenance, mises à jour, sauvegardes et suivi prévues ; elles ne constituent pas un stock d’heures. Les interventions non utilisées au cours d’un mois ne sont pas reportables au mois suivant. Une demande dépassant le nombre ou le périmètre convenu est chiffrée et acceptée avant réalisation. Les travaux déjà dus au titre d’une garantie ou d’une obligation distincte ne sont pas décomptés comme des demandes commerciales supplémentaires. L’absence de report ne prive pas le Client de ses droits en cas d’inexécution imputable à AtoumWeb ni des droits impératifs applicables.

### Proposition humaine — intégrale, à valider

Le devis précise le nombre de petites interventions comprises par mois dans la formule. Elles font partie de l’abonnement global, avec les opérations de maintenance, de mise à jour, de sauvegarde et de suivi prévues ; elles ne constituent pas une réserve d’heures.

Les interventions non utilisées pendant un mois ne sont pas reportées au mois suivant. Une demande qui dépasse le nombre d’interventions ou le périmètre convenu est chiffrée et acceptée avant sa réalisation.

Les travaux que nous devons déjà au titre d’une garantie ou d’une obligation distincte ne sont pas déduits de ces interventions. L’absence de report ne supprime ni vos droits en cas de manquement qui nous est imputable ni les droits que la loi vous accorde.


## 067. MAINT-MAJ — Mises à jour

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a30a9329-64ce-4569-b98f-ed011d9b7668` ; modèle `e1a4ba2f-ab73-4855-9d9e-f455a23de594`, statut `published`.
- **Défauts rédactionnels** : Jargon et réserves imbriquées ; report technique potentiellement pris pour une dispense.
- **Éléments préservés** : Mises à jour incluses ; risque identifié/évaluation ; information risque/mesures/suites ; sécurité et mises à jour dues ; supplément hors obligation avec accord ; tiers sans facturation automatique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Distinguer maintenance commerciale et mises à jour nécessaires à la conformité.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Distinguer maintenance commerciale et mises à jour nécessaires à la conformité.
- **Changement important / vigilance** : Jargon et réserves imbriquées ; report technique potentiellement pris pour une dispense.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

AtoumWeb réalise les mises à jour comprises dans la prestation. Une mise à jour présentant un risque identifié de régression, d’incompatibilité ou d’indisponibilité peut être différée le temps d’évaluer une solution adaptée. Le Client est informé du report, du risque connu et des mesures temporaires ou suites proposées. Ce report ne neutralise pas les obligations de sécurité ou de mise à jour applicables. Une adaptation dépassant les travaux déjà dus peut faire l’objet d’un accord complémentaire avant réalisation ; une non-conformité imputable à AtoumWeb ou un correctif légalement dû n’est pas facturé comme un supplément du seul fait de l’intervention d’un composant tiers.

### Proposition humaine — intégrale, à valider

Nous réalisons les mises à jour comprises dans votre prestation.

Lorsqu’une mise à jour présente un risque identifié de perturber le fonctionnement du site, de rendre certains éléments incompatibles ou de provoquer une indisponibilité, nous pouvons la reporter le temps d’évaluer une solution adaptée. Nous vous informons du report, du risque connu et des mesures temporaires ou suites proposées.

Ce report ne supprime pas les obligations de sécurité ou de mise à jour qui restent applicables. Une adaptation qui dépasse les travaux déjà dus peut faire l’objet d’un accord complémentaire avant sa réalisation. En revanche, une non-conformité qui nous est imputable ou un correctif légalement dû ne devient pas un supplément facturable du seul fait qu’un composant tiers intervient.


## 068. MAINT-PERIMETRE — Périmètre de maintenance

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `31a0e348-abed-4d60-a58e-25f15c774c8b` ; modèle `d2074275-b9e4-4f78-b59e-567a4cf88fb3`, statut `published`.
- **Défauts rédactionnels** : Périmètre actif et intervention commerciale peu parlants.
- **Éléments préservés** : Formule vendue seulement ; préventif/interventions/hors-forfait/évolutions ; garanties/corrections/mises à jour dues préservées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La formule ne remplace pas les obligations liées à la création du site. Quotas réels au devis, sans invention.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La formule ne remplace pas les obligations liées à la création du site. Quotas réels au devis, sans invention.
- **Changement important / vigilance** : Périmètre actif et intervention commerciale peu parlants.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

La maintenance couvre uniquement les opérations incluses dans la formule souscrite et précisées au devis.

Sont notamment distingués :
- les opérations de maintenance préventive ;
- les demandes d’intervention incluses ;
- les travaux hors forfait ;
- les évolutions ou refontes qui relèvent d’un devis distinct.

Une intervention commerciale entre dans la formule si elle relève de son périmètre actif. Cette délimitation ne supprime pas les corrections, garanties ou mises à jour qu’AtoumWeb doit déjà fournir en application du contrat ou de la loi.

### Proposition humaine — intégrale, à valider

La maintenance comprend les opérations prévues dans la formule que vous avez choisie et décrites au devis.

Nous distinguons les opérations préventives, les interventions comprises dans la formule, les travaux hors forfait et les évolutions ou refontes qui nécessitent un devis distinct.

Une demande entre dans la formule lorsqu’elle correspond au périmètre souscrit. Cette limite ne supprime pas les corrections, garanties ou mises à jour que nous devons déjà fournir au titre du contrat ou de la loi.


## 069. MAINT-RENOUVELLEMENT — Durée et renouvellement

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `4fc51007-43bc-4146-ac45-354324a0af54` ; modèle `644f39e7-1afc-4b86-b13a-0464fa3b4c31`, statut `published`.
- **Défauts rédactionnels** : Durée et facturation mélangées ; doublon avec hébergement.
- **Éléments préservés** : Durée/facturation/résiliation ; mensuel mois par mois ; annuel accord exprès ; information préalable ; résiliation électronique si requise ; pas modification unilatérale par simple avis ; restitution/fin.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas ajouter de reconduction tacite annuelle. Vérifier le droit de résiliation électronique selon le contrat réel.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas ajouter de reconduction tacite annuelle. Vérifier le droit de résiliation électronique selon le contrat réel.
- **Changement important / vigilance** : Ne pas remplacer l’accord exprès annuel par une reconduction tacite ; distinguer mensuel et annuel.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).

### Texte publié actuel — intégral

Le devis précise la durée, la périodicité de facturation et les conditions de résiliation de la formule. Un abonnement mensuel se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les offres annuelles, notamment maintenance annuelle, hébergement et domaine, sont renouvelées par accord exprès ; aucune reconduction annuelle tacite ne s’applique par défaut. Les conditions de poursuite et de fin de service sont communiquées avant acceptation. Les obligations légales d’information et de résiliation, notamment par voie électronique lorsqu’elle est requise, restent applicables selon le contrat réel et l’audience concernée. Un changement de formule, de périmètre ou de prix ne s’applique que selon les conditions valablement convenues et les dispositions impératives ; sa simple notification ne vaut pas autorisation de toute modification. La restitution et la fin du service suivent les dispositions contractuelles et légales applicables.

### Proposition humaine — intégrale, à valider

Le devis précise la durée de votre formule, sa périodicité de facturation et ses conditions de résiliation.

Un abonnement mensuel se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les offres annuelles, notamment la maintenance annuelle, l’hébergement et le domaine, sont renouvelées par accord exprès : elles ne sont pas reconduites tacitement par défaut.

Nous vous communiquons les conditions de poursuite et de fin du service avant votre acceptation. Les obligations légales d’information et de résiliation, notamment par voie électronique lorsqu’elle est requise, restent applicables selon le contrat et la catégorie de client.

Un changement de formule, de périmètre ou de prix ne s’applique que dans les conditions valablement convenues et dans le respect de la loi. Le simple envoi d’une information ne suffit pas à autoriser toute modification. La restitution et la fin du service suivent les conditions contractuelles et légales applicables.


## 070. MAINT-SAUVEGARDE — Sauvegardes

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `b591b87f-5b31-48d7-b006-7ff068d83efa` ; modèle `8a2b1171-d5ad-4933-8f00-694a12de4290`, statut `published`.
- **Défauts rédactionnels** : Support technique ; fréquence/durée absentes du devis ; conditions de l’hébergeur non précisées.
- **Éléments préservés** : Sauvegarde si incluse ; dispositif prévu ; fréquence/rétention/support de l’offre ou solution ; conditions du fournisseur tiers.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La clause ne prouve pas la restauration réelle. Ne pas inventer rétention, redondance ou délai de reprise ; vérifier les conditions de tiers remises au client.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; La clause ne prouve pas la restauration réelle. Ne pas inventer rétention, redondance ou délai de reprise ; vérifier les conditions de tiers remises au client.
- **Changement important / vigilance** : Support technique ; fréquence/durée absentes du devis ; conditions de l’hébergeur non précisées.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Lorsque la sauvegarde est incluse, AtoumWeb met en œuvre le dispositif prévu dans la formule souscrite.

La fréquence, la durée de conservation et le support de stockage sont ceux prévus au devis ou par la solution technique utilisée.

Les sauvegardes fournies par l’hébergeur ou un service tiers restent soumises aux conditions de ce prestataire.

### Proposition humaine — intégrale, à valider

Si les sauvegardes sont incluses dans votre formule, nous mettons en place le dispositif prévu.

Le devis ou la solution technique utilisée précise leur fréquence, leur durée de conservation et leur emplacement de stockage.

Lorsque les sauvegardes sont fournies par l’hébergeur ou un autre prestataire, les conditions de ce service s’appliquent.


## 071. MAINT-URGENCE — Incident urgent

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e3e0e595-e1a7-42ae-bd95-e3e07885026f` ; modèle `f2b47143-1edc-4ce6-9f07-a09eb6c70c6a`, statut `published`.
- **Défauts rédactionnels** : Plages commerciales et origine extérieure ; prise en charge et résolution à distinguer.
- **Éléments préservés** : Modalités/plages convenues ; pas de temps inférieur promis ; diagnostic selon informations ; hors-travaux dus seulement avec accord ; piratage sans exonération ; obligations violations de données distinctes.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas promettre une résolution en un jour. Vérifier horaires et gestion réelle des violations de données.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas promettre une résolution en un jour. Vérifier horaires et gestion réelle des violations de données.
- **Changement important / vigilance** : Plages commerciales et origine extérieure ; prise en charge et résolution à distinguer.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Une demande urgente est traitée selon les modalités et plages de prise en charge prévues dans l’offre souscrite.

AtoumWeb ne garantit pas un délai d’intervention inférieur à celui expressément convenu.

Le diagnostic précise, dans la mesure des informations disponibles, la cause de l’incident et les obligations de prise en charge. Seuls les travaux qui dépassent les interventions déjà dues peuvent faire l’objet d’un complément soumis à l’accord du Client. Un piratage ou une origine extérieure n’exonère pas automatiquement AtoumWeb d’une faute qui lui est imputable. Les obligations légales de traitement et de notification d’une violation de données demeurent distinctes des plages commerciales d’intervention.

### Proposition humaine — intégrale, à valider

Nous traitons les demandes urgentes selon les modalités et les horaires de prise en charge prévus dans votre offre. Nous ne garantissons pas un délai d’intervention plus court que celui convenu.

Avec les informations disponibles, le diagnostic précise la cause de l’incident et ce qui relève de notre prise en charge. Seuls les travaux qui dépassent les interventions déjà dues peuvent faire l’objet d’un complément soumis à votre accord.

Un piratage ou un incident venant d’un service extérieur ne nous dégage pas automatiquement d’une faute qui nous est imputable. Les obligations légales de traitement et de notification d’une violation de données restent distinctes des horaires d’intervention prévus commercialement.


## 072. MAINT-WOOCOMMERCE — Périmètre spécifique WooCommerce

- **Famille** : Maintenance. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a74f140b-a1f4-44b6-b2a8-44259c9875f8` ; modèle `5b27ae5b-5f46-49f9-937a-46a9354c9156`, statut `published`.
- **Défauts rédactionnels** : WooCommerce à expliquer ; réserves répétées sur les mises à jour.
- **Éléments préservés** : Boutique/outils identifiés ; pas gestion produits/stocks/commandes/remboursements/SAV sauf vente ; report évalué/informé ; complément accepté ; garanties/sécurité/corrections/mises à jour dues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas retirer les réserves comme de simples doublons ; pas d’exonération générale pour extensions tierces.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas retirer les réserves comme de simples doublons ; pas d’exonération générale pour extensions tierces.
- **Changement important / vigilance** : WooCommerce à expliquer ; réserves répétées sur les mises à jour.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10) ; [S14 — Mises à jour nécessaires — L224-25-25](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).

### Texte publié actuel — intégral

La maintenance WooCommerce couvre uniquement les opérations prévues au devis sur la boutique, WooCommerce et les extensions expressément identifiées. Elle n’inclut pas la gestion quotidienne du catalogue, des stocks, des commandes, des remboursements ou du service client, sauf prestation distincte. Une mise à jour présentant un risque identifié pour la boutique ou une intégration critique peut être différée le temps d’évaluer une solution adaptée. Lorsque ce report est nécessaire, le Client en est informé. Les travaux qui dépassent les obligations déjà dues peuvent faire l’objet d’un complément accepté avant réalisation. L’origine extérieure d’une difficulté ne neutralise pas les garanties, obligations de sécurité, corrections ou mises à jour applicables à AtoumWeb.

### Proposition humaine — intégrale, à valider

La maintenance de votre boutique WooCommerce porte sur les opérations décrites au devis, pour la boutique, son outil de vente en ligne et les extensions expressément identifiées.

Elle ne comprend pas la gestion quotidienne des produits, des stocks, des commandes, des remboursements ou du service client, sauf prestation distincte.

Si une mise à jour présente un risque identifié pour la boutique ou pour une connexion technique importante, nous pouvons la reporter le temps d’évaluer une solution adaptée. Nous vous en informons lorsque ce report est nécessaire.

Les travaux qui dépassent nos obligations déjà dues peuvent faire l’objet d’un complément accepté avant leur réalisation. Une difficulté venant d’un tiers ne supprime pas les garanties, obligations de sécurité, corrections ou mises à jour qui nous incombent.


## 073. MARIAGE-CONTENUS — Contenus et photographies

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `62a3c2b4-825b-4ce7-815b-57df4d42b4b5` ; modèle `43dbbf34-243f-42d3-86b3-10a860fc2f59`, statut `published`.
- **Défauts rédactionnels** : Futurs mariés à remplacer sans perdre les autorisations des tiers.
- **Éléments préservés** : Contenus fournis par les futurs mariés ; garantie des autorisations d’utilisation, notamment pour les personnes tierces représentées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La présence d’une personne sur une photo ne suffit pas à autoriser sa diffusion, notamment mineurs ; articuler droits image/auteur.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La présence d’une personne sur une photo ne suffit pas à autoriser sa diffusion, notamment mineurs ; articuler droits image/auteur.
- **Changement important / vigilance** : Futurs mariés à remplacer sans perdre les autorisations des tiers.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27) ; [S24 — Droit à l’image des personnes — Direction des affaires juridiques](https://www.economie.gouv.fr/apie/droit-limage-des-personnes-et-des-biens).

### Texte publié actuel — intégral

Les futurs mariés fournissent les textes, photographies, informations pratiques et autres éléments nécessaires au site.

Ils garantissent disposer des autorisations nécessaires pour utiliser les contenus et photographies transmis, notamment lorsqu’ils représentent des tiers.

### Proposition humaine — intégrale, à valider

Vous nous fournissez les textes, photos, informations pratiques et autres éléments nécessaires à votre site de mariage.

Vous garantissez avoir les autorisations nécessaires pour utiliser les contenus et les photos transmis, notamment lorsque d’autres personnes y apparaissent.


## 074. MARIAGE-DUREE — Durée de mise en ligne

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `0f56ea1c-7f30-4c1a-b2bb-0b2fd00b17bd` ; modèle `4d285816-1370-45d1-907a-265152df1900`, statut `published`.
- **Défauts rédactionnels** : Durée du site, sortie et conservation RSVP confondues.
- **Éléments préservés** : Durée, début et poursuite convenus ; renouvellement exprès ; information de fin, récupération, export et données ; durée RSVP non automatiquement alignée sur celle du site.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Confirmer chaque durée ; pas de renouvellement tacite ni conservation de toutes données jusqu’à fermeture.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Confirmer chaque durée ; pas de renouvellement tacite ni conservation de toutes données jusqu’à fermeture.
- **Changement important / vigilance** : Durée du site, sortie et conservation RSVP confondues.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).

### Texte publié actuel — intégral

Le site de mariage reste accessible pendant la durée prévue au devis, qui indique le début, la période incluse et les conditions de poursuite. Le renouvellement de la période d’hébergement nécessite un accord exprès et n’est pas tacite par défaut. À son terme, la fin de service est organisée après information du Client, avec une période de récupération, d’export ou de transfert définie au devis. Une migration ou reconstruction complexe hors périmètre nécessite un accord complémentaire. Les données devenues inutiles sont supprimées selon leurs règles de conservation, en distinguant sauvegardes et archives nécessaires. La durée d’accès au site ne justifie pas à elle seule de conserver toutes les données RSVP pendant la même période.

### Proposition humaine — intégrale, à valider

Votre site de mariage reste accessible pendant la durée indiquée au devis. Celui-ci précise le début de la mise en ligne, la période comprise et les conditions de poursuite.

Le renouvellement de l’hébergement nécessite un accord exprès ; il n’est pas tacite par défaut.

À la fin de la période, nous vous informons de la fin du service et organisons la récupération, l’export ou le transfert selon la période définie au devis. Une migration ou une reconstruction complexe hors périmètre nécessite un accord complémentaire.

Les données devenues inutiles sont supprimées selon leurs règles de conservation, en distinguant les sauvegardes et les archives nécessaires. La durée d’accès au site ne justifie pas, à elle seule, de conserver pendant toute cette période l’ensemble des réponses des invités.


## 075. MARIAGE-PERIMETRE — Périmètre de l’offre mariage

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `d0949a1d-576c-46a6-9685-0d4fd06f83df` ; modèle `61cbdd2b-f16a-4f0f-91a1-694221e1dc66`, statut `published`.
- **Défauts rédactionnels** : Mise à disposition et répétitions de périmètre administratives.
- **Éléments préservés** : Site temporaire et fonctions prévues ; conception et intégration techniques ; contenus validés par le client sauf prestation vendue ; données invités strictement nécessaires.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer un site événementiel en accès permanent ni collecter des données invités superflues.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas transformer un site événementiel en accès permanent ni collecter des données invités superflues.
- **Changement important / vigilance** : Mise à disposition et répétitions de périmètre administratives.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation porte sur la création et la mise à disposition temporaire d’un site événementiel de mariage comprenant uniquement les pages, sections, intégrations et fonctionnalités prévues au devis. AtoumWeb assure leur conception et leur intégration technique dans le périmètre convenu. Les futurs mariés fournissent et valident les textes, photographies, informations pratiques, les informations relatives aux invités strictement nécessaires aux fonctionnalités prévues et les autres contenus nécessaires, sauf prestation de création de contenu expressément prévue. Toute fonctionnalité, page, intégration ou modification qui dépasse ce périmètre peut faire l’objet d’un accord complémentaire.

### Proposition humaine — intégrale, à valider

Nous créons et mettons temporairement à votre disposition le site de mariage décrit au devis, avec les pages, sections, connexions et fonctions qui y sont prévues. Nous en réalisons la conception et l’intégration technique.

Sauf prestation de création de contenu expressément prévue, vous fournissez et validez les textes, photos, informations pratiques et autres contenus nécessaires. Les informations sur vos invités sont limitées à ce qui est strictement nécessaire aux fonctions prévues.

Une fonction, une page, une connexion ou une modification qui dépasse ce cadre peut faire l’objet d’un accord complémentaire.


## 076. MARIAGE-POST-EVENEMENT — Éléments fournis après le mariage et délai de 3 mois

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `a5bfbdbd-26e3-444d-8206-b60f8b0fd6ff` ; modèle `86591185-f1d1-4a85-bca0-9f8259aaa8e4`, statut `published`.
- **Défauts rédactionnels** : Délai et complément après retard peuvent être lus comme sanction automatique.
- **Éléments préservés** : Éléments postérieurs seulement si vendus ; remise dans les trois mois ; replanification au-delà et complément après information et accord ; aucun ajout automatique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Conserver3mois sans pénalité nouvelle ni extinction automatique de la prestation.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Conserver3mois sans pénalité nouvelle ni extinction automatique de la prestation.
- **Changement important / vigilance** : Le délai3mois organise la remise et replanification, sans introduire de déchéance ou de pénalité automatique.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02).

### Texte publié actuel — intégral

Lorsque l’offre prévoit des éléments après le mariage, la prestation couvre uniquement la galerie, les photographies, la vidéo ou le diaporama, le livre d’or et les contenus associés décrits au devis. Les éléments nécessaires doivent être transmis à AtoumWeb dans les trois mois suivant la date du mariage. Lorsqu’ils sont fournis après ce délai, leur traitement est replanifié selon les disponibilités d’AtoumWeb et peut nécessiter un complément de prestation après information et accord du Client. Aucun contenu ou fonctionnalité non prévu au devis n’est ajouté automatiquement.

### Proposition humaine — intégrale, à valider

Si votre offre comprend des éléments après le mariage, nous réalisons uniquement la galerie, les photos, la vidéo ou le diaporama, le livre d’or et les contenus associés décrits au devis.

Vous nous transmettez les éléments nécessaires dans les trois mois suivant la date du mariage. Au-delà, leur traitement est replanifié selon nos disponibilités et peut nécessiter une prestation complémentaire, après vous en avoir informés et avoir obtenu votre accord.

Aucun contenu ni aucune fonction non prévu au devis n’est ajouté automatiquement.


## 077. MARIAGE-PRIVE — Accès privé

- **Famille** : Sites de mariage. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `15bc63ba-5303-4826-b1b9-593a7d78c0e1` ; modèle `c5f2dc7d-9988-497c-ad0b-d6892a9199b7`, statut `published`.
- **Défauts rédactionnels** : Accès grand public peut donner fausse assurance ou exonération.
- **Éléments préservés** : Mécanisme d’accès protégé convenu ; absence de confidentialité absolue si les utilisateurs partagent leurs accès.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas en déduire une dispense de sécurité technique ou de protection des données par l’agence.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas en déduire une dispense de sécurité technique ou de protection des données par l’agence.
- **Changement important / vigilance** : Accès grand public peut donner fausse assurance ou exonération.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Lorsqu’un accès protégé est prévu, AtoumWeb met en place le mécanisme technique défini dans la formule.

Aucun dispositif d’accès grand public ne peut garantir une confidentialité absolue si les identifiants ou liens d’accès sont transmis à des tiers par les utilisateurs.

### Proposition humaine — intégrale, à valider

Si un accès protégé est prévu dans votre formule, nous mettons en place le mécanisme technique convenu.

Ce type d’accès ne peut garantir une confidentialité absolue si les utilisateurs transmettent leurs identifiants ou leurs liens d’accès à d’autres personnes.


## 078. MARIAGE-RSVP — Réponses des invités

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `62748db0-7e66-4ac3-9752-6f38592f52c9` ; modèle `298d0f75-e6c8-4218-b662-0e43ffe8fd0b`, statut `published`.
- **Défauts rédactionnels** : RSVP, données sensibles et rôles en bloc très dense ; code interne visible.
- **Éléments préservés** : Formulaire minimal sans données sensibles ni champ libre général ; rôles déterminés réellement ; option sensible bloquée avant vérification ; sinon transmission directe au traiteur sans relais du site.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Allergies peuvent révéler santé ; déterminer réellement rôles et conditions article9, pas seulement recueillir un consentement présumé.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Allergies peuvent révéler santé ; déterminer réellement rôles et conditions article9, pas seulement recueillir un consentement présumé.
- **Changement important / vigilance** : Pas de santé ni champ libre par défaut ; rôle du couple non automatique ; option sensible bloquée tant que conditions non satisfaites.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S25 — Données sensibles — CNIL](https://www.cnil.fr/fr/definition/donnee-sensible).

### Texte publié actuel — intégral

La fonctionnalité RSVP utilise par défaut un formulaire minimal limité aux informations nécessaires aux réponses et à l’organisation prévue, sans collecte de données sensibles ni champ libre général susceptible d’en recueillir. Les champs, destinataires, accès et durées de conservation sont définis selon le fonctionnement réel. Les rôles et obligations en matière de données personnelles sont déterminés au regard de ce fonctionnement et des règles applicables, sans attribuer automatiquement au couple la qualité de responsable du traitement. Une collecte sensible éventuelle constitue une option distincte, désactivée tant que sa nécessité et ses conditions légales et techniques ne sont pas vérifiées et satisfaites. À défaut, les informations concernées sont transmises directement par l’invité ou son représentant au traiteur, sans collecte, stockage ni relais par le site AtoumWeb. BASE-DONNEES encadre les obligations générales applicables.

### Proposition humaine — intégrale, à valider

Le formulaire de réponse des invités (RSVP) demande par défaut uniquement les informations nécessaires aux réponses et à l’organisation prévue. Il ne collecte pas de données sensibles et ne comporte pas de champ libre général susceptible d’en recueillir.

Les champs, les destinataires, les accès et les durées de conservation sont définis selon le fonctionnement réel du service. Les rôles et obligations de chacun en matière de données personnelles sont déterminés sur cette base, sans vous attribuer automatiquement la qualité de responsable du traitement.

Une éventuelle collecte de données sensibles est une option distincte. Elle reste désactivée tant que sa nécessité et toutes ses conditions légales et techniques ne sont pas vérifiées et satisfaites. À défaut, l’invité ou son représentant transmet directement ces informations au traiteur : le site AtoumWeb ne les collecte pas, ne les stocke pas et ne les relaie pas.

La clause « Données et accès » du socle commun encadre les obligations générales applicables.


## 079. MARIAGE-TIERS — Cagnotte, vidéo et services tiers

- **Famille** : Sites de mariage. **Audience source** : consumer — Consommateurs ; ne pas transposer automatiquement aux professionnels.
- **Version source** : v1, `a23fe58c-4ec4-4f37-b7af-6cc679577a2b` ; modèle `ad61a727-3713-4070-91ff-e3bc9789f82d`, statut `published`.
- **Défauts rédactionnels** : Services tiers et exclusion des fonds à rendre lisibles.
- **Éléments préservés** : Services externes vendus et conditions de leurs opérateurs ; intégration technique convenue ; aucune gestion, détention ou perception de fonds par l’agence.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Maintenir intégration technique distincte de gestion de fonds et obligations propres ; vérifier flux réellement mis en place.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Maintenir intégration technique distincte de gestion de fonds et obligations propres ; vérifier flux réellement mis en place.
- **Changement important / vigilance** : Services tiers et exclusion des fonds à rendre lisibles.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Le site peut intégrer des services externes prévus au devis, tels qu’une carte Google Maps, une vidéo hébergée, une cagnotte, une liste de mariage ou un autre outil tiers. Ces services restent soumis aux conditions, frais, règles de compte, limitations, modifications et disponibilités de leurs fournisseurs. AtoumWeb réalise l’intégration technique convenue mais ne contrôle pas leurs décisions ni leur fonctionnement permanent. AtoumWeb n’encaisse, ne détient et ne gère pas les fonds versés au moyen d’une cagnotte ou d’un service de paiement tiers.

### Proposition humaine — intégrale, à valider

Votre site peut intégrer les services externes prévus au devis : carte Google Maps, vidéo hébergée, cagnotte, liste de mariage ou autre outil.

Ces services suivent les conditions, frais, règles de compte, limites, changements et disponibilités de leurs fournisseurs. Nous réalisons l’intégration technique convenue, sans contrôler leurs décisions ni leur fonctionnement permanent.

Nous n’encaissons, ne détenons et ne gérons pas les fonds versés par une cagnotte ou un service de paiement externe.


## 080. PHOTO-DEPLACEMENT — Zone de déplacement et frais

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e00daa80-63c5-4a2c-9ea5-e90d883281aa` ; modèle `34a3ee52-5151-4b40-a266-90b421fd9630`, statut `published`.
- **Défauts rédactionnels** : Frais et zone listés sans dialogue direct.
- **Éléments préservés** : Zone convenue, frais de déplacement prévus ; supplément communiqué et accepté avant engagement ; consentement exprès du consommateur si requis.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas transformer Dijon Métropole en zone systématiquement incluse ni ajouter un barème absent.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas transformer Dijon Métropole en zone systématiquement incluse ni ajouter un barème absent.
- **Changement important / vigilance** : Frais et zone listés sans dialogue direct.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La zone de déplacement incluse est celle définie par le catalogue ou le devis et peut notamment couvrir Dijon et Dijon Métropole. Un déplacement hors de cette zone, un trajet supplémentaire ou une contrainte particulière d’accès, de stationnement, de péage, d’horaire ou de transport peut entraîner des frais indiqués au devis. Un frais supplémentaire non compris dans l’engagement accepté est communiqué et soumis à l’accord préalable du Client avant engagement. Le consentement exprès requis pour un paiement supplémentaire d’un consommateur est recueilli.

### Proposition humaine — intégrale, à valider

La zone de déplacement comprise est celle du Catalogue ou du devis ; elle peut notamment couvrir Dijon et Dijon Métropole.

Un déplacement hors zone, un trajet supplémentaire ou une contrainte d’accès, de stationnement, de péage, d’horaire ou de transport peut entraîner des frais indiqués au devis.

Si des frais supplémentaires ne font pas partie de l’engagement accepté, nous vous les communiquons et obtenons votre accord avant de les engager. Pour un consommateur, nous recueillons le consentement exprès requis pour tout paiement supplémentaire.


## 081. PHOTO-DROITS — Droit d’utilisation

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `5a033f4c-d57b-49ba-aadb-ed1bed1183b2` ; modèle `124be9e9-9500-4f6f-add6-2c9d7400dff8`, statut `published`.
- **Défauts rédactionnels** : Droit image/auteur, commande et communication imbriqués.
- **Éléments préservés** : Droits sur les images fournies et réalisées, distinction auteur/personne représentée, autorisations adaptées aux mineurs et à la diffusion ; pas de réutilisation promotionnelle automatique.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier autorisations adaptées et titulaires pour mineurs ; une commande ne vaut pas autorisation de promotion.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier autorisations adaptées et titulaires pour mineurs ; une commande ne vaut pas autorisation de promotion.
- **Changement important / vigilance** : Droit du photographe et droit à l’image des personnes distincts ; autorisation promotionnelle séparée, mineurs à vérifier.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27) ; [S24 — Droit à l’image des personnes — Direction des affaires juridiques](https://www.economie.gouv.fr/apie/droit-limage-des-personnes-et-des-biens).

### Texte publié actuel — intégral

Pour les images qu’il fournit, le Client obtient les droits et autorisations nécessaires à la retouche et aux usages convenus. Lorsqu’AtoumWeb réalise des photographies, les droits d’exploitation accordés au Client sont décrits au devis ou dans son annexe de droits, selon les usages, supports, durée et territoire convenus. Les droits d’auteur sur la photographie sont distincts des droits des personnes représentées. Les autorisations adaptées à la prise de vue et à la diffusion sont recueillies selon les situations, notamment pour les mineurs. AtoumWeb ne réutilise pas automatiquement les portraits personnels pour sa communication ; une telle utilisation nécessite une autorisation adaptée et distincte de la commande. Les droits moraux et autres dispositions impératives restent réservés.

### Proposition humaine — intégrale, à valider

Pour les images que vous nous fournissez, vous obtenez les droits et autorisations nécessaires à la retouche et aux usages convenus.

Pour les photos que nous réalisons, le devis ou son annexe de droits précise les usages autorisés, les supports, la durée et le territoire d’exploitation.

Les droits d’auteur du photographe sont distincts des droits des personnes représentées. Les autorisations nécessaires à la prise de vue et à la diffusion sont recueillies selon la situation, notamment pour les mineurs.

Nous ne réutilisons pas automatiquement les portraits personnels pour notre communication. Cet usage nécessite une autorisation adaptée, distincte de la commande. Les droits moraux et les autres règles impératives restent applicables.


## 082. PHOTO-LIVRABLES — Fichiers finaux et formats livrés

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `462f5221-4a6e-4b8c-b48d-32ef110d489f` ; modèle `02e312bd-b45d-4928-b291-ca5d243dce5e`, statut `published`.
- **Défauts rédactionnels** : Longue liste de sources techniques.
- **Éléments préservés** : Fichiers finalisés et formats vendus ; sources et fichiers bruts non automatiquement remis.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas priver d’un fichier effectivement commandé ; droits et fichiers sont distincts.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas priver d’un fichier effectivement commandé ; droits et fichiers sont distincts.
- **Changement important / vigilance** : Longue liste de sources techniques.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

AtoumWeb remet les fichiers photographiques finalisés dans les formats et pour les usages prévus au devis. Les fichiers de travail, catalogues Lightroom, historiques de traitement, calques, réglages, aperçus intermédiaires et autres sources internes ne sont pas remis automatiquement. Leur transmission éventuelle doit être expressément prévue au devis. Les fichiers bruts issus d’un shooting ne sont pas inclus par défaut.

### Proposition humaine — intégrale, à valider

Nous vous remettons les photos finalisées dans les formats et pour les usages prévus au devis.

Les fichiers de travail — catalogues Lightroom, historiques de traitement, calques, réglages, aperçus intermédiaires et autres sources internes — ne sont pas remis automatiquement. Leur transmission doit être expressément prévue au devis.

Les fichiers bruts de la séance ne sont pas compris par défaut.


## 083. PHOTO-REPORT — Report / annulation d’une séance

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `dfd0cb72-bd78-4e78-aeec-13967ab800b9` ; modèle `fbbbbf9e-8273-4977-8e9d-6aadb6f387e9`, statut `published`.
- **Défauts rédactionnels** : Plusieurs causes et délais dans un paragraphe dense.
- **Éléments préservés** : Report gratuit demandé au moins quarante-huit heures avant selon disponibilités ; frais tardifs seulement prévus, proportionnés et validés ; faute agence, force majeure, météo et rétractation préservées.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier indemnisation, force majeure et droits de rétractation selon prestation/canal ; pas pénalité automatique.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier indemnisation, force majeure et droits de rétractation selon prestation/canal ; pas pénalité automatique.
- **Changement important / vigilance** : 48heures, proportionnalité et réserve de validation des frais conservées ; aucun forfait inventé.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S4 — Force majeure — 1218](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431/2026-09-27) ; [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02) ; [S17 — Exceptions à la rétractation — L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/2026-06-26).

### Texte publié actuel — intégral

Le Client peut demander le report d’une séance sans frais de report lorsque sa demande parvient à AtoumWeb au moins quarante-huit heures avant l’horaire prévu, sous réserve des disponibilités permettant de fixer une nouvelle date. Pour une annulation ou un report demandé moins de quarante-huit heures avant la séance, une conséquence financière ne peut s’appliquer que si elle est expressément prévue au devis, proportionnée et juridiquement validée ; aucun montant forfaitaire n’est ajouté par défaut. Si l’empêchement est imputable à AtoumWeb, un report sans frais ou une solution ou un remboursement approprié est proposé selon la situation. Les cas de force majeure sont traités séparément selon les règles applicables. En cas de météo ou de circonstances empêchant raisonnablement la séance, les parties examinent de bonne foi un report adapté, sans imposer un report indéfini si une nouvelle date est impossible ou si la date constitue un élément essentiel. Les droits de rétractation éventuellement applicables restent réservés.

### Proposition humaine — intégrale, à valider

Vous pouvez demander le report de la séance sans frais de report si nous recevons votre demande au moins quarante-huit heures avant l’horaire prévu, sous réserve de pouvoir convenir d’une nouvelle date selon nos disponibilités.

Pour une annulation ou un report demandé moins de quarante-huit heures avant la séance, des frais ne peuvent s’appliquer que s’ils sont expressément prévus au devis, proportionnés et juridiquement validés. Aucun forfait n’est ajouté par défaut.

Si l’empêchement nous est imputable, nous proposons, selon la situation, un report sans frais, une solution adaptée ou un remboursement approprié. La force majeure est traitée séparément selon les règles applicables.

Si la météo ou d’autres circonstances empêchent raisonnablement la séance, nous cherchons ensemble, de bonne foi, un report adapté. Aucun report indéfini n’est imposé si une nouvelle date est impossible ou si la date initiale est essentielle.

Les droits de rétractation éventuellement applicables restent préservés.


## 084. PHOTO-RETOUCHE-PERIMETRE — Périmètre de retouche et niveau de complexité

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `8201ec1a-9d2b-4452-88ed-be6647ed8383` ; modèle `0a7d4ef8-a3eb-4819-bfd4-5c09f56cb9a9`, statut `published`.
- **Défauts rédactionnels** : Détourage et niveau technique à expliquer sans promesse.
- **Éléments préservés** : Niveaux de retouche distincts, détourage selon précision convenue ; correction promise limitée par les possibilités du fichier source.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucune garantie de reconstruction d’une information absente du fichier source.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Aucune garantie de reconstruction d’une information absente du fichier source.
- **Changement important / vigilance** : Détourage et niveau technique à expliquer sans promesse.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre le niveau de retouche défini au devis. La retouche essentielle porte sur des ajustements généraux et corrections simples. La retouche avancée comprend des interventions localisées ou complexes expressément identifiées. Le détourage consiste à isoler le sujet de son arrière-plan selon le niveau de précision convenu. Le résultat dépend de la définition, de l’exposition, de la compression et de l’état du fichier source. AtoumWeb met en œuvre les corrections prévues sans garantir une amélioration techniquement impossible à partir du fichier remis.

### Proposition humaine — intégrale, à valider

Nous réalisons le niveau de retouche prévu au devis. La retouche essentielle comprend les ajustements généraux et les corrections simples. La retouche avancée porte sur les interventions localisées ou complexes expressément identifiées. Le détourage isole le sujet de son arrière-plan avec la précision convenue.

Le résultat dépend de la définition, de l’exposition, de la compression et de l’état du fichier d’origine. Nous réalisons les corrections prévues, sans promettre une amélioration techniquement impossible à partir du fichier fourni.


## 085. PHOTO-SHOOTING-PERIMETRE — Périmètre d’un shooting

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `f30bf049-1f93-484d-92a5-7543e36933b5` ; modèle `6ce918bc-db7f-4dbc-a2ae-a1ddb5d4ffe6`, statut `published`.
- **Défauts rédactionnels** : Shooting et périmètre abstraits ; retard à distinguer faute.
- **Éléments préservés** : Durée, lieux et éléments disponibles convenus ; retard imputable au client sans prolongation automatique ; nombre de photos finalisées prévu ; bruts non remis par défaut.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas réduire la séance pour une cause non imputable au client ; articuler report et force majeure.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas réduire la séance pour une cause non imputable au client ; articuler report et force majeure.
- **Changement important / vigilance** : Shooting et périmètre abstraits ; retard à distinguer faute.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S4 — Force majeure — 1218](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431/2026-09-27).

### Texte publié actuel — intégral

La prestation couvre la séance photographique réalisée pendant la durée, sur les lieux et dans le périmètre prévus au devis. Le Client rend disponibles à l’heure convenue les lieux, personnes, produits, autorisations et éléments nécessaires. Le temps perdu en raison d’un retard, d’une indisponibilité ou d’une préparation insuffisante imputable au Client ne prolonge pas automatiquement la séance. Le nombre de photographies finalisées est celui prévu au devis. Les fichiers bruts ne sont pas remis par défaut.

### Proposition humaine — intégrale, à valider

La séance photo se déroule pendant la durée, sur les lieux et dans le cadre prévus au devis.

Vous rendez disponibles à l’heure convenue les lieux, les personnes, les produits, les autorisations et les autres éléments nécessaires. Un retard, une indisponibilité ou une préparation insuffisante qui vous est imputable ne prolonge pas automatiquement la séance.

Le nombre de photos finalisées est celui du devis. Les fichiers bruts ne sont pas remis par défaut.


## 086. PHOTO-SOURCE — Fichiers fournis

- **Famille** : Photographie et retouche. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a9110fc7-446b-4586-80f3-9ea1c2ea9504` ; modèle `3ad4606a-0504-4309-88aa-f7a329c2e1f1`, statut `published`.
- **Défauts rédactionnels** : Exploitables et reconstruction à préciser.
- **Éléments préservés** : Fichiers utilisables, qualité finale dépendante de leur état ; reconstruction ou travaux dépassant une retouche classique susceptibles d’estimation complémentaire.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas ajouter de rejet automatique d’un fichier ou de facturation non acceptée.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas ajouter de rejet automatique d’un fichier ou de facturation non acceptée.
- **Changement important / vigilance** : Exploitables et reconstruction à préciser.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Le Client fournit des fichiers suffisamment exploitables pour la retouche demandée.

La qualité finale dépend notamment de la définition, de l’exposition, de la compression et de l’état du fichier d’origine.

Une reconstruction importante ou un travail dépassant une retouche classique peut nécessiter une estimation complémentaire.

### Proposition humaine — intégrale, à valider

Vous nous fournissez des fichiers suffisamment utilisables pour la retouche demandée.

La qualité du résultat dépend notamment de leur définition, de leur exposition, de leur compression et de leur état d’origine.

Une reconstruction importante ou un travail dépassant une retouche classique peut nécessiter une estimation complémentaire.


## 087. PRO-LITIGE — Règlement des différends professionnels

- **Famille** : Socle professionnels. **Audience source** : professional — Professionnels ; examiner séparément les protections particulières applicables.
- **Version source** : v1, `41256f8c-835f-4722-b22b-5dc8fc7d9439` ; modèle `7a6a0c27-b362-4955-83b2-6feed04aa4b6`, statut `published`.
- **Défauts rédactionnels** : Différend, juridictions et présent module peuvent être simplifiés.
- **Éléments préservés** : Recherche amiable facultative ; écrit ; recours et urgence ; juridictions compétentes sans tribunal territorial imposé.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Réservée aux professionnels. Ne pas ajouter un tribunal imposé à Dijon ; tout professionnel n’est pas commerçant.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Réservée aux professionnels. Ne pas ajouter un tribunal imposé à Dijon ; tout professionnel n’est pas commerçant.
- **Changement important / vigilance** : Différend, juridictions et présent module peuvent être simplifiés.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S11 — Compétence territoriale — CPC 48](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006410147/2026-04-01).

### Texte publié actuel — intégral

En cas de différend, les parties peuvent rechercher une solution amiable à partir d’une réclamation écrite précisant le problème rencontré. Cette démarche ne prive aucune partie de ses recours ni de la possibilité d’une mesure urgente. À défaut d’accord, le litige relève des juridictions compétentes selon les règles applicables. Aucune juridiction territoriale particulière n’est imposée par le présent module.

### Proposition humaine — intégrale, à valider

Si vous êtes un client professionnel, nous pouvons chercher ensemble une solution amiable à partir d’une réclamation écrite décrivant le problème.

Cette démarche n’empêche ni l’un ni l’autre d’exercer ses recours ou de demander une mesure urgente. Si aucun accord n’est trouvé, le litige relève des tribunaux compétents selon les règles applicables. Cette clause n’impose pas de tribunal territorial particulier.


## 088. PRO-PAIEMENT — Délais de règlement B2B

- **Famille** : Socle professionnels. **Audience source** : professional — Professionnels ; examiner séparément les protections particulières applicables.
- **Version source** : v1, `3f57534e-24c2-4cf8-9fb1-47e2387ebe9c` ; modèle `94b7e810-f816-4d26-8b2f-c4aca9418538`, statut `published`.
- **Défauts rédactionnels** : Longue énumération ; risque de lire les plafonds comme des délais automatiquement accordés.
- **Éléments préservés** : Échéances expresses ; pas de délai nouveau par facture ;30j à défaut ; plafonds60j/45jFDM/45j périodiques ; avances/jalons/solde ; vérification sans report automatique ; régimes particuliers.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier régime et exceptions ; ne pas transformer un plafond légal en délai accordé.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Vérifier régime et exceptions ; ne pas transformer un plafond légal en délai accordé.
- **Changement important / vigilance** : Les plafonds légaux ne sont pas des délais automatiquement accordés au client.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S12 — Délais et pénalités professionnels — L441-10](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392).

### Texte publié actuel — intégral

Les sommes dues par le Client professionnel sont payables aux échéances expressément prévues au devis et dans les conditions de règlement. L’émission d’une facture n’accorde aucune facilité de paiement supplémentaire automatique. Un délai particulier peut être accordé s’il est expressément convenu au devis et dans les conditions de règlement, dans les limites légales. À défaut d’accord, le délai du régime général est de trente jours après la réalisation de la prestation. Lorsqu’un délai différent est convenu, il respecte les plafonds légaux : soixante jours après l’émission de la facture ou, si cette modalité est expressément convenue et non abusive, quarante-cinq jours fin de mois. Les factures périodiques suivent leur plafond particulier de quarante-cinq jours après émission. L’échéancier distingue les avances, factures intermédiaires et solde prévus. Une procédure de vérification ou d’acceptation ne décale pas automatiquement le paiement ; sa durée et ses effets sont convenus dans le respect des conditions légales. Les régimes particuliers impératifs éventuellement applicables demeurent réservés.

### Proposition humaine — intégrale, à valider

Si vous êtes un client professionnel, vous réglez les sommes dues aux échéances prévues au devis et dans les conditions de règlement. L’émission d’une facture n’accorde pas automatiquement un délai supplémentaire.

Un délai particulier doit être convenu expressément et respecter les limites légales. À défaut d’accord, le délai du régime général est de trente jours après l’exécution de la prestation. Lorsqu’un délai différent est convenu, il ne dépasse pas soixante jours après l’émission de la facture, ou quarante-cinq jours fin de mois si ce choix est expressément prévu et non abusif. Les factures périodiques suivent leur plafond particulier de quarante-cinq jours après émission.

L’échéancier distingue les avances, les paiements intermédiaires et le solde. Une vérification ou une acceptation de la prestation ne reporte pas automatiquement le paiement : sa durée et ses effets doivent être convenus dans les limites légales. Les régimes particuliers obligatoires restent applicables.


## 089. PRO-RETARD — Retard de paiement

- **Famille** : Socle professionnels. **Audience source** : professional — Professionnels ; examiner séparément les protections particulières applicables.
- **Version source** : v1, `0220659b-61e3-4bcd-854c-da5667e02210` ; modèle `20064c0c-30a5-4dc8-afb7-89eedb20910b`, statut `published`.
- **Défauts rédactionnels** : Réserves denses ; procédures collectives peu accessibles.
- **Éléments préservés** : B2B seul ; lendemain échéance sans rappel ;3fois taux légal ; documents requis ;40€ sous conditions ; frais justifiés ; exceptions procédures collectives.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas substituer BCE+10 au taux contractuel choisi. Ne pas appliquer ces règles aux consommateurs.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas substituer BCE+10 au taux contractuel choisi. Ne pas appliquer ces règles aux consommateurs.
- **Changement important / vigilance** : Taux retenu et indemnité professionnels uniquement ; ne pas les injecter dans un contrat consommateur.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S12 — Délais et pénalités professionnels — L441-10](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392) ; [S13 — Indemnité forfaitaire — D441-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043197457/2026-07-06).

### Texte publié actuel — intégral

Pour un Client professionnel, les pénalités de retard sont dues sans rappel à compter du lendemain de l’échéance de règlement. Le taux contractuel retenu est égal à trois fois le taux d’intérêt légal applicable. Ce taux et les conditions d’application sont indiqués dans les conditions de règlement et sur les documents qui doivent les mentionner. L’indemnité forfaitaire légale de recouvrement de 40 euros est due lorsque ses conditions légales sont réunies. Une indemnisation complémentaire des frais de recouvrement n’est demandée que dans les conditions prévues par la loi et sur justification. Les exceptions légales, notamment liées aux procédures collectives, restent applicables. Ces règles B2B ne sont pas appliquées au Client consommateur.

### Proposition humaine — intégrale, à valider

Si vous êtes un client professionnel, des pénalités de retard sont dues dès le lendemain de l’échéance, sans rappel préalable. Le taux retenu au contrat est égal à trois fois le taux d’intérêt légal applicable. Le taux et ses conditions d’application figurent dans les conditions de règlement et sur les documents requis.

L’indemnité forfaitaire légale de recouvrement de 40 euros est due lorsque les conditions légales sont réunies. Des frais complémentaires ne peuvent être demandés que dans les conditions prévues par la loi et sur justification.

Les exceptions légales restent applicables, notamment celles liées aux procédures de sauvegarde, de redressement ou de liquidation judiciaire. Ces dispositions ne s’appliquent pas aux clients consommateurs.


## 090. REPRISE-EXISTANT — Reprise d’un site existant

- **Famille** : Reprise de l’existant. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `c9ad7b62-5762-4a1b-ab6b-e415512a6905` ; modèle `ae84cffc-c299-4c72-81a9-c0665a28733c`, statut `published`.
- **Défauts rédactionnels** : Existant et responsabilité dispersés.
- **Éléments préservés** : État du projet tiers, difficultés révélées après accès, information et accord avant extension ; obligations et responsabilité propres de l’agence maintenues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : L’état antérieur ne constitue pas une exonération générale ; pas d’extension de prix unilatérale.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; L’état antérieur ne constitue pas une exonération générale ; pas d’extension de prix unilatérale.
- **Changement important / vigilance** : Existant et responsabilité dispersés.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Lorsque la prestation porte sur un site ou un projet réalisé par un tiers, AtoumWeb intervient sur l’existant dans l’état où il se trouve.

Des anomalies ou contraintes non détectables avant l’accès complet au site peuvent conduire à revoir le périmètre ou le temps nécessaire.

AtoumWeb informe le Client des difficultés découvertes et de leur incidence sur les travaux convenus. Une extension de périmètre ou de prix est soumise à l’accord du Client avant réalisation. L’état antérieur de l’existant ne dispense pas AtoumWeb de ses propres obligations et n’exclut pas sa responsabilité pour les défauts qu’elle cause.

### Proposition humaine — intégrale, à valider

Si nous intervenons sur un site ou un projet créé par un tiers, nous le reprenons dans son état existant.

Certaines anomalies ou contraintes ne peuvent être découvertes qu’après un accès complet. Elles peuvent conduire à revoir le périmètre ou le temps nécessaire.

Nous vous expliquons les difficultés constatées et leurs conséquences sur les travaux convenus. Une extension du périmètre ou du prix nécessite votre accord avant sa réalisation.

L’état antérieur du projet ne nous dispense pas de nos propres obligations et n’exclut pas notre responsabilité pour les défauts que nous causons.


## 091. SEO-ACCES — Accès et données

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `3f666b75-6762-4717-ab54-72894e569383` ; modèle `07973a92-0734-46d1-ab37-09ab1ccc9b49`, statut `published`.
- **Défauts rédactionnels** : Outils cités sans expliquer autorisation et fin d’usage.
- **Éléments préservés** : Accès nécessaires, comptes et autorisations gérés par le client ; usage autorisé, protection des identifiants et cessation d’usage par l’agence ; obligations propres maintenues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas assimiler propriété d’un compte à transfert de toutes obligations RGPD.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas assimiler propriété d’un compte à transfert de toutes obligations RGPD.
- **Changement important / vigilance** : Outils cités sans expliquer autorisation et fin d’usage.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Le Client fournit les accès nécessaires aux outils utilisés dans la prestation lorsqu’ils sont requis : site, Search Console, Analytics ou outils équivalents.

Le Client gère ses données, comptes et autorisations. AtoumWeb utilise ses accès dans le périmètre autorisé, protège les identifiants dont elle dispose et cesse leur utilisation lorsqu’ils ne sont plus nécessaires. Les obligations de chaque partie en matière de données et de sécurité restent applicables.

### Proposition humaine — intégrale, à valider

Vous nous fournissez les accès nécessaires à la prestation : site, Search Console, Analytics ou outils équivalents, lorsqu’ils sont requis.

Vous gérez vos données, comptes et autorisations. Nous utilisons nos accès dans le cadre autorisé, protégeons les identifiants dont nous disposons et cessons de les utiliser lorsqu’ils ne sont plus nécessaires.

Chacun de nous reste tenu de ses obligations en matière de données et de sécurité.


## 092. SEO-DELAIS — Délais de résultat

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `aaddedb5-e050-4476-986a-2be3dddcebcd` ; modèle `b967df7c-5de9-4b07-8ace-29600afbaab1`, statut `published`.
- **Défauts rédactionnels** : Inexécution et ancienneté denses.
- **Éléments préservés** : Effets progressifs et facteurs extérieurs ; absence de résultat immédiat ne prouvant pas à elle seule une inexécution.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : L’absence de résultat rapide ne doit pas masquer la non-réalisation des actions convenues.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; L’absence de résultat rapide ne doit pas masquer la non-réalisation des actions convenues.
- **Changement important / vigilance** : Inexécution et ancienneté denses.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

Les effets d’une action SEO peuvent apparaître progressivement et dépendent notamment de l’ancienneté du site, de la concurrence, de l’état technique du site, de la qualité des contenus et des évolutions des moteurs de recherche.

L’absence de résultat immédiat ne constitue pas en elle-même une inexécution de la prestation.

### Proposition humaine — intégrale, à valider

Les effets du référencement naturel peuvent apparaître progressivement. Ils dépendent notamment de l’ancienneté du site, de la concurrence, de son état technique, de ses contenus et des changements des moteurs de recherche.

L’absence de résultat immédiat ne signifie pas, à elle seule, que la prestation n’a pas été exécutée.


## 093. SEO-DISCOVER — Optimisation Google Discover sans garantie d’apparition

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `9725bbc1-d4d3-492e-affd-22b0b23b47a6` ; modèle `9ea8a599-3f1b-4fb0-95ab-0367a62e57f4`, statut `published`.
- **Défauts rédactionnels** : Éligibilité aux surfaces et exposition jargon.
- **Éléments préservés** : Optimisations convenues ; décisions d’exploration et d’affichage de Google ; absence de garantie d’apparition, de durée ou de trafic.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : L’objectif d’éligibilité ne devient pas une promesse d’affichage.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; L’objectif d’éligibilité ne devient pas une promesse d’affichage.
- **Changement important / vigilance** : Éligibilité aux surfaces et exposition jargon.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre les optimisations techniques et éditoriales définies au devis afin d’améliorer l’éligibilité des contenus aux surfaces Google Discover. Google décide seul de l’exploration, de la sélection et de l’affichage des contenus. AtoumWeb ne garantit donc ni l’apparition d’un contenu dans Discover, ni sa durée d’exposition, ni un volume de trafic déterminé.

### Proposition humaine — intégrale, à valider

Nous réalisons les optimisations techniques et éditoriales prévues au devis pour améliorer les possibilités de présentation de vos contenus dans Google Discover.

Google décide seul des contenus qu’il explore, sélectionne et affiche. Nous ne garantissons donc pas leur apparition dans Discover, leur durée de visibilité ni un volume de visites déterminé.


## 094. SEO-GBP-SUIVI — Suivi Google Business Profile

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `4c6f3205-2888-48a4-b81a-b3e93aaed3cf` ; modèle `483a1467-05d6-4bbf-bc93-c422a7e98a8f`, statut `published`.
- **Défauts rédactionnels** : Plateforme et formalités imbriquées.
- **Éléments préservés** : Actions vendues, accès adapté, contenus validés par le client ; décisions et délais de Google ; aucune garantie de disponibilité, classement ou publication.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier les autorisations de publication au nom du client ; pas de dispense de réaliser les actions vendues.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Vérifier les autorisations de publication au nom du client ; pas de dispense de réaliser les actions vendues.
- **Changement important / vigilance** : Plateforme et formalités imbriquées.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre le suivi et les actions Google Business Profile expressément prévus au devis. Le Client fournit un accès approprié et valide les informations, contenus et réponses publiés en son nom. Les procédures de vérification, suspensions, refus, délais de traitement, fonctionnalités et règles d’affichage relèvent de Google. AtoumWeb ne garantit ni la disponibilité permanente de la fiche, ni son classement, ni la publication d’un contenu ou d’une modification par la plateforme.

### Proposition humaine — intégrale, à valider

Nous assurons le suivi et les actions sur votre fiche Google Business Profile prévus au devis. Vous nous accordez un accès adapté et validez les informations, contenus et réponses publiés en votre nom.

Google gère ses vérifications, suspensions, refus, délais de traitement, fonctions et règles d’affichage. Nous ne garantissons ni la disponibilité permanente de la fiche, ni son classement, ni la publication d’un contenu ou d’une modification par Google.


## 095. SEO-LOCAL-PERIMETRE — Périmètre SEO local

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `1f8acc25-08e7-4f0b-a7cc-3a405f2ad533` ; modèle `7d839aee-da21-4f1b-bef2-23702dfb6a94`, statut `published`.
- **Défauts rédactionnels** : Indexation et zones à rendre directs.
- **Éléments préservés** : Établissements, zones et supports convenus ; données validées par le client ; optimisations sans position ni volume de contacts garanti.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas ajouter un nombre de demandes ou de contacts garanti.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas ajouter un nombre de demandes ou de contacts garanti.
- **Changement important / vigilance** : Indexation et zones à rendre directs.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre les actions de visibilité locale décrites au devis pour les établissements, zones et supports concernés. Le Client fournit et valide ses coordonnées, horaires, catégories, zones desservies, informations d’activité et contenus. AtoumWeb réalise les optimisations convenues sans garantir une position, une visibilité ou un volume de contacts déterminé, les plateformes conservant la maîtrise de leur indexation, de leurs vérifications et de leur affichage.

### Proposition humaine — intégrale, à valider

Nous réalisons les actions de visibilité locale prévues au devis pour les établissements, zones et supports concernés.

Vous fournissez et validez vos coordonnées, horaires, catégories, zones desservies, informations d’activité et contenus.

Nous effectuons les optimisations convenues, sans garantir une position, un niveau de visibilité ou un nombre de contacts. Les plateformes gardent la maîtrise de leur indexation, de leurs vérifications et de leur affichage.


## 096. SEO-MOYENS — Obligation de moyens

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `ac70de23-7f6e-46d7-8f40-53733af824a2` ; modèle `28a51517-5c07-4f33-bc78-5a4c523d2b19`, statut `published`.
- **Défauts rédactionnels** : Obligation de moyens mérite une explication sans la supprimer.
- **Éléments préservés** : Obligation de moyens, actions convenues ; aucune position, audience ou recette garantie ; décisions des moteurs indépendantes.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Cette qualification n’efface pas les livrables ou engagements précis vendus ; apprécier le contrat entier.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Cette qualification n’efface pas les livrables ou engagements précis vendus ; apprécier le contrat entier.
- **Changement important / vigilance** : Obligation de moyens mérite une explication sans la supprimer.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La prestation SEO constitue une obligation de moyens.

AtoumWeb met en œuvre les optimisations convenues mais ne garantit ni une position déterminée dans les résultats de recherche, ni un volume précis de trafic, ni un chiffre d’affaires résultant des actions menées.

Les moteurs de recherche restent seuls décisionnaires de leurs méthodes d’indexation, de classement et d’affichage.

### Proposition humaine — intégrale, à valider

Notre prestation de référencement naturel repose sur une obligation de moyens : nous réalisons les optimisations convenues, sans garantir une position dans les résultats, un nombre précis de visites ou un chiffre d’affaires.

Les moteurs de recherche restent seuls responsables de leurs méthodes d’indexation, de classement et d’affichage.


## 097. SEO-NETLINKING — Netlinking, supports tiers et maintien des liens

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `83f197cc-6da2-492a-a617-e07feb8ec097` ; modèle `d7158a3c-0a73-4643-9ece-ebaf825cf5e5`, statut `published`.
- **Défauts rédactionnels** : Netlinking et modèle d’achat d’espace complexes.
- **Éléments préservés** : Conseil et pilotage prévus ; achat et paiement directs par le client ; coûts médias distincts ; publicité identifiable ; absence de maintien ou de classement garanti, responsabilité propre préservée.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Conserver distinction conseil et achat publicitaire ; vérifier règles applicables si modèle réel change, sans introduire mandat.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Conserver distinction conseil et achat publicitaire ; vérifier règles applicables si modèle réel change, sans introduire mandat.
- **Changement important / vigilance** : Le modèle reste conseil/pilotage avec achat et paiement directs par le client ; publicité identifiable ; pas de mandat créé.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S26 — Publicité identifiable — LCEN article20, version en vigueur](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006117688).

### Texte publié actuel — intégral

La prestation couvre la stratégie, la recherche, la sélection, le conseil et le pilotage des actions de netlinking prévus au devis. Le Client contracte et paie directement l’éditeur ou le support pour les publications ou liens retenus. Les coûts médias sont distincts des honoraires d’AtoumWeb. AtoumWeb n’achète aucune publication pour le compte du Client dans ce modèle. Les publications publicitaires sont identifiables comme telles et l’annonceur est identifié selon les règles applicables. La publication, l’indexation, le maintien et la valeur SEO d’un lien dépendent des supports et moteurs concernés ; aucun maintien permanent ni classement déterminé n’est garanti. Le traitement d’un lien retiré suit le périmètre convenu, sans exonération automatique des obligations propres d’AtoumWeb.

### Proposition humaine — intégrale, à valider

Nous réalisons les actions de création de liens vers votre site (netlinking) prévues au devis : stratégie, recherche et sélection de supports, conseil et pilotage.

Dans ce modèle, vous contractez directement avec l’éditeur ou le support et le payez pour les publications ou liens retenus. Ces coûts sont distincts de nos honoraires. Nous n’achetons pas de publication pour votre compte.

Les publications publicitaires doivent être identifiables comme telles et l’annonceur doit être identifié selon les règles applicables.

La publication, l’indexation, le maintien et l’effet d’un lien sur le référencement dépendent des supports et des moteurs. Aucun maintien permanent ni classement déterminé n’est garanti. Le traitement d’un lien retiré suit le périmètre convenu, sans nous exonérer automatiquement de nos propres obligations.


## 098. SEO-PERFORMANCE — Optimisation vitesse et performances

- **Famille** : Référencement. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `92f93735-8a87-4e36-a9e7-7ef9a0aaf80f` ; modèle `85564f39-f542-42ea-a936-31560e5b0ee8`, statut `published`.
- **Défauts rédactionnels** : Indicateur et score peuvent être pris pour engagement.
- **Éléments préservés** : Environnement et pages ciblés, optimisations convenues ; facteurs extérieurs ; absence de score ou temps de chargement durable garanti sous ces facteurs.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Un objectif technique expressément promis reste à respecter ; pas d’exonération générale.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Un objectif technique expressément promis reste à respecter ; pas d’exonération générale.
- **Changement important / vigilance** : Indicateur et score peuvent être pris pour engagement.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre les optimisations techniques de performance expressément prévues au devis, sur l’environnement et les pages identifiés. Les résultats observés dépendent notamment de l’hébergement, du thème, des extensions, des contenus, des services tiers, du terminal et des conditions de mesure. AtoumWeb met en œuvre les actions convenues mais ne garantit pas l’obtention durable d’un score, d’un temps de chargement ou d’un indicateur déterminé lorsque des facteurs extérieurs influencent le résultat.

### Proposition humaine — intégrale, à valider

Nous réalisons les optimisations de vitesse et de performance prévues au devis, sur l’environnement et les pages identifiés.

Les résultats dépendent notamment de l’hébergement, du thème, des extensions, des contenus, des services externes, de l’appareil utilisé et des conditions de mesure.

Nous effectuons les actions convenues, sans garantir durablement un score, un temps de chargement ou un indicateur déterminé lorsque des facteurs extérieurs influencent le résultat.


## 099. SERVICE-PACK-HEURES — Packs d’heures : décompte, validité et solde

- **Famille** : Services transversaux. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `506ec7e0-1c23-41df-894d-7ea2cd2bb798` ; modèle `aedb8410-afb7-4922-80f1-05c166ff95cf`, statut `published`.
- **Défauts rédactionnels** : Expiration/remboursement et inexécution mêlés.
- **Éléments préservés** : Volume, unité, validité et solde ; accord avant dépassement ; expiration sans remboursement automatique du seul non-usage ; prolongation si intervention demandée empêchée par l’agence et recours conservés.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Validité et unité doivent être connues ; ne pas confondre ce crédit avec abonnement maintenance sans report.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Validité et unité doivent être connues ; ne pas confondre ce crédit avec abonnement maintenance sans report.
- **Changement important / vigilance** : Solde/validité distincts des interventions de maintenance ; prolongation en cas d’intervention demandée empêchée par l’agence conservée.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02).

### Texte publié actuel — intégral

Le pack ouvre droit au volume de temps et aux demandes entrant dans le périmètre prévu au devis pendant sa période de validité. Le temps consommé est suivi selon l’unité de décompte annoncée. Une demande hors périmètre ou dépassant le solde est chiffrée et acceptée avant réalisation. Le solde non utilisé expire normalement à l’échéance prévue au devis ; sa seule non-utilisation n’ouvre pas droit à un remboursement automatique. Si le Client a effectivement demandé une intervention pendant la période de validité et qu’AtoumWeb n’a pas pu la réaliser pour une raison qui lui est imputable, cette période est prolongée de manière appropriée pour permettre l’intervention. Cette règle ne réduit pas les droits résultant d’une inexécution ni les autres droits impératifs applicables, notamment ceux du consommateur.

### Proposition humaine — intégrale, à valider

Votre pack vous donne accès au volume de temps et aux demandes prévus au devis, pendant sa période de validité. Le temps utilisé est suivi selon l’unité de décompte annoncée.

Une demande hors périmètre ou dépassant le solde disponible est chiffrée et acceptée avant sa réalisation.

Le temps non utilisé expire normalement à l’échéance du devis. Sa seule non-utilisation ne donne pas droit à un remboursement automatique.

Si vous avez effectivement demandé une intervention pendant la période de validité et que nous n’avons pas pu la réaliser pour une raison qui nous est imputable, nous prolongeons cette période de manière appropriée pour permettre l’intervention.

Ces règles ne réduisent pas vos droits en cas d’inexécution ni les autres droits impératifs applicables, notamment ceux du consommateur.


## 100. SERVICE-PONCTUEL-PERIMETRE — Périmètre d’une prestation ponctuelle

- **Famille** : Services transversaux. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d691242d-ce36-4ba0-962b-9e60ad46d0b0` ; modèle `a43e06d1-4979-447d-8282-023a0da46c44`, statut `published`.
- **Défauts rédactionnels** : Périmètre et contraintes génériques.
- **Éléments préservés** : Travaux et livrables convenus, informations de démarrage ; ajout d’objectif ou de contrainte soumis à accord avant réalisation.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas intégrer implicitement du suivi récurrent à une intervention ponctuelle.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas intégrer implicitement du suivi récurrent à une intervention ponctuelle.
- **Changement important / vigilance** : Périmètre et contraintes génériques.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation ponctuelle couvre uniquement les travaux et livrables expressément décrits au devis. Toute demande ajoutant un objectif, un livrable, une intervention ou une contrainte qui n’y figure pas nécessite l’accord préalable des parties et peut faire l’objet d’un complément de prix ou d’un nouveau devis. L’intervention est réalisée à partir des informations et accès disponibles au démarrage.

### Proposition humaine — intégrale, à valider

Notre intervention ponctuelle couvre les travaux et livrables expressément décrits au devis, à partir des informations et des accès disponibles au démarrage.

Une demande qui ajoute un objectif, un livrable, une intervention ou une contrainte non prévu nécessite un accord préalable entre nous. Elle peut faire l’objet d’un complément de prix ou d’un nouveau devis.


## 101. SERVICE-TIERS — Dépendances et coûts de services tiers

- **Famille** : Services transversaux. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `2b306910-f00e-439f-8f97-e4f95b6b4c2f` ; modèle `cf50d75f-5d92-4100-a688-e555d076d972`, statut `published`.
- **Défauts rédactionnels** : Accumulation de termes et possibilité d’adaptation peu lisible.
- **Éléments préservés** : Conditions/disponibilité des tiers ; coûts inclus uniquement au devis ; information sur blocage connu ; alternative seulement si possible.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Aucune solution alternative gratuite ou garantie ajoutée ; conserver les responsabilités propres dans les autres clauses.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Aucune solution alternative gratuite ou garantie ajoutée ; conserver les responsabilités propres dans les autres clauses.
- **Changement important / vigilance** : Accumulation de termes et possibilité d’adaptation peu lisible.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S9 — Déséquilibre significatif — L212-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Lorsque la prestation dépend d’un service, logiciel, hébergeur, API ou fournisseur tiers, son fonctionnement reste soumis aux conditions et disponibilités de ce tiers. Les abonnements, licences, commissions ou frais externes ne sont inclus que s’ils figurent au devis. AtoumWeb informe le Client lorsqu’il a connaissance d’un blocage affectant la prestation et peut proposer, lorsque cela est techniquement et commercialement possible, une adaptation ou une solution alternative.

### Proposition humaine — intégrale, à valider

Si notre prestation utilise un logiciel, un hébergeur, une connexion à un service externe ou un autre fournisseur, elle dépend aussi des conditions et de la disponibilité de ce service.

Les abonnements, licences, commissions et autres frais externes sont compris uniquement s’ils figurent au devis.

Lorsque nous avons connaissance d’un blocage qui affecte notre prestation, nous vous en informons. Nous pouvons proposer une adaptation ou une autre solution lorsque cela est techniquement et commercialement possible.


## 102. TECH-HEBERGEMENT — Hébergement seul sans maintenance

- **Famille** : Hébergement et migration. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `6d6ca362-41ba-4713-bd24-b478d6e24e66` ; modèle `e8fd687d-e961-45e3-8910-7746ea19bd64`, statut `published`.
- **Défauts rédactionnels** : Code offre interne ; fin de service dense ; risque confusion avec hébergement inclus.
- **Éléments préservés** : Hébergement vendu seul et inclusions explicites ; renouvellement annuel exprès, mensuel selon conditions ; récupération et transfert ; traitement des données ; distinction de l’hébergement inclus à une création.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas faire disparaître une inclusion réellement vendue ; vérifier période de sortie et rôle RGPD.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas faire disparaître une inclusion réellement vendue ; vérifier période de sortie et rôle RGPD.
- **Changement important / vigilance** : Le retrait du code commercial visible est éditorial ; l’hébergement seul ne doit pas neutraliser les inclusions d’une création.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).

### Texte publié actuel — intégral

Cette clause concerne la prestation autonome d’hébergement WordPress, notamment AW-TECH-HEBERG-WP. Elle couvre la mise à disposition ou la gestion de l’environnement décrit au devis, dans les limites des services retenus. Les sauvegardes, le domaine, la messagerie, la maintenance et l’assistance ne sont inclus que lorsqu’ils sont explicitement indiqués. L’engagement annuel est renouvelé par accord exprès, sans reconduction annuelle tacite par défaut. Une prestation mensuelle expressément souscrite se poursuit selon les conditions de résiliation convenues. La sortie est organisée avec une période de récupération, d’export ou de transfert précisée au devis. Une migration ou reconstruction complexe hors périmètre nécessite un accord complémentaire. Les données devenues inutiles sont supprimées selon les règles applicables, en distinguant les durées propres aux sauvegardes et archives à conserver. Lorsque l’hébergement est inclus dans une création de site, les règles applicables relèvent de WEB-HEBERGEMENT.

### Proposition humaine — intégrale, à valider

Cette clause concerne l’hébergement WordPress vendu seul, séparément d’une création de site. Nous mettons à disposition ou gérons l’environnement décrit au devis, dans les limites des services retenus.

Les sauvegardes, le domaine, la messagerie, la maintenance et l’assistance sont compris uniquement s’ils sont indiqués expressément.

Un engagement annuel est renouvelé par accord exprès, sans reconduction tacite annuelle par défaut. Une prestation mensuelle expressément souscrite se poursuit selon les conditions de résiliation convenues.

Le devis précise une période pour récupérer, exporter ou transférer les éléments à la fin du service. Une migration ou une reconstruction complexe hors périmètre nécessite un accord complémentaire. Les données devenues inutiles sont supprimées selon les règles applicables, en distinguant les durées propres aux sauvegardes et archives à conserver.

Si l’hébergement est compris dans une création de site, il relève de la clause « Hébergement et nom de domaine » associée à cette création.


## 103. TECH-MIGRATION — Migration WordPress / hébergement

- **Famille** : Hébergement et migration. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `28d69ec4-4e62-4530-bdf6-a2b68f80337b` ; modèle `b379fa53-38e2-443c-acde-bdb74dca46e4`, statut `published`.
- **Défauts rédactionnels** : Sources/destination/contraintes découverts en cours de route.
- **Éléments préservés** : Transfert des éléments identifiés entre environnements prévus, préparation selon accès et sauvegardes disponibles ; adaptations découvertes soumises à accord.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Pas de promesse de zéro interruption, sauvegarde supplémentaire ou intégralité non prévue.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Pas de promesse de zéro interruption, sauvegarde supplémentaire ou intégralité non prévue.
- **Changement important / vigilance** : Sources/destination/contraintes découverts en cours de route.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation couvre le transfert des éléments et services expressément identifiés entre l’environnement source et la destination indiquée au devis. Elle est préparée à partir des accès et sauvegardes disponibles. Les incompatibilités, données manquantes, services externes ou contraintes découvertes pendant l’opération peuvent nécessiter une adaptation soumise à l’accord du Client.

### Proposition humaine — intégrale, à valider

Nous transférons les éléments et services expressément identifiés entre l’environnement d’origine et la destination indiquée au devis. Nous préparons l’opération à partir des accès et des sauvegardes disponibles.

Des incompatibilités, données manquantes, services externes ou contraintes découverts pendant le transfert peuvent nécessiter une adaptation, soumise à votre accord.


## 104. WEB-AR — Corrections et allers-retours

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e15ea54a-7769-4ac4-930d-d38b9a96a902` ; modèle `525fc489-5606-4e64-a408-0f85e7e9e49c`, statut `published`.
- **Défauts rédactionnels** : Une correction pourrait être confondue avec une non-conformité à facturer ; répétition avec validation.
- **Éléments préservés** : Phases convenues ; ajustement dans périmètre ; demandes nouvelles et devis complémentaire ; retours groupés autant que possible.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Lire avec BASE-VALIDATION/BASE-PRIX : accord avant supplément et non-conformités dues hors quota ; pas de fusion automatique.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Lire avec BASE-VALIDATION/BASE-PRIX : accord avant supplément et non-conformités dues hors quota ; pas de fusion automatique.
- **Changement important / vigilance** : Une correction pourrait être confondue avec une non-conformité à facturer ; répétition avec validation.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La prestation comprend les phases de correction et de validation prévues au devis.

Une correction correspond à l’ajustement d’un élément déjà prévu dans le périmètre initial. Toute demande ajoutant une fonctionnalité, une page, un contenu, une intégration ou une modification substantielle non prévue au devis peut faire l’objet d’un complément de prix ou d’un nouveau devis.

Le Client s’engage à regrouper autant que possible ses retours afin d’éviter des cycles de corrections successifs inutiles.

### Proposition humaine — intégrale, à valider

La prestation comprend les étapes de correction et de validation prévues au devis.

Une correction ajuste un élément déjà compris dans le projet initial. Une demande qui ajoute une fonction, une page, un contenu, une connexion à un autre outil ou une modification importante non prévue peut faire l’objet d’un complément de prix ou d’un nouveau devis.

Vous vous engagez à regrouper vos retours autant que possible pour éviter des séries de corrections successives inutiles.


## 105. WEB-COMPATIBILITE — Compatibilité

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `48f8a75d-a6c0-4ed5-957e-da4299b10518` ; modèle `fd48f5fd-9469-46f5-9a82-6f5e6543dde5`, statut `published`.
- **Défauts rédactionnels** : Terminaux/environnements ; pas de liste effectivement convenue.
- **Éléments préservés** : Liste préalable ; vérification ; pas tous anciens/futurs ; adaptation hors cadre acceptée ; non-conformités/mises à jour/garanties maintenues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Les limites ne doivent pas contredire les qualités normalement attendues ou les informations précontractuelles.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Les limites ne doivent pas contredire les qualités normalement attendues ou les informations précontractuelles.
- **Changement important / vigilance** : Terminaux/environnements ; pas de liste effectivement convenue.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Les navigateurs, terminaux et environnements pris en charge sont décrits au devis ou dans une annexe communiquée avant l’acceptation. AtoumWeb vérifie la livraison dans ce périmètre. Aucune prise en charge illimitée de tous les environnements anciens, non maintenus ou futurs n’est promise. Une adaptation extérieure aux engagements convenus peut relever d’une maintenance ou d’une prestation complémentaire acceptée. Cette limite ne dispense pas AtoumWeb de corriger une non-conformité imputable à sa prestation ni de fournir les mises à jour ou garanties légalement dues.

### Proposition humaine — intégrale, à valider

Le devis ou une annexe remise avant votre acceptation précise les navigateurs, appareils et environnements pris en charge. Nous vérifions le livrable dans ce cadre.

Nous ne promettons pas une compatibilité illimitée avec tous les environnements anciens, abandonnés ou futurs. Une adaptation qui dépasse les engagements convenus peut relever d’une maintenance ou d’une prestation complémentaire acceptée.

Cette limite ne nous dispense pas de corriger une non-conformité qui nous est imputable ni de fournir les mises à jour ou garanties légalement dues.


## 106. WEB-CONTENUS — Fourniture des contenus

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `b7f9e1a3-3ca6-4d6a-b5ca-a5058f1cf661` ; modèle `0013a2be-afc8-41c3-a625-bb2bde885550`, statut `published`.
- **Défauts rédactionnels** : Listes répétées avec coopération/produits ; replanification administratif.
- **Éléments préservés** : Éléments dans délais ; droits/exactitude/conformité client ; tâches réellement affectées ; causalité/obligations respectives ; pas exonération ; rédaction/images seulement si vendues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Le client reste responsable du contenu sans libérer l’agence de ses propres obligations.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Le client reste responsable du contenu sans libérer l’agence de ses propres obligations.
- **Changement important / vigilance** : Listes répétées avec coopération/produits ; replanification administratif.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

Le Client fournit à AtoumWeb, dans les délais convenus, l’ensemble des éléments nécessaires à la réalisation de la prestation : textes, images, logos, coordonnées, mentions obligatoires, accès techniques et toute autre information utile au projet.

Le Client garantit disposer des droits nécessaires sur les éléments qu’il transmet à AtoumWeb et reste responsable de leur contenu, de leur exactitude et de leur conformité.

Lorsqu’un contenu nécessaire manque ou arrive tardivement, AtoumWeb informe le Client des tâches effectivement affectées et de l’incidence prévisible sur le planning. La replanification tient compte du lien réel avec ce manque et des obligations de chaque partie. Un contenu incomplet ou tardif n’exonère pas automatiquement AtoumWeb d’un retard et ne supprime pas les droits légaux du Client.

Les prestations de rédaction, de recherche iconographique ou de création de contenus ne sont incluses que lorsqu’elles figurent expressément au devis.

### Proposition humaine — intégrale, à valider

Vous nous fournissez dans les délais convenus les éléments nécessaires au projet : textes, images, logos, coordonnées, mentions obligatoires, accès techniques et autres informations utiles.

Vous devez disposer des droits nécessaires sur les éléments transmis et restez responsable de leur contenu, de leur exactitude et de leur conformité.

Si un contenu manque ou arrive en retard, nous vous indiquons les tâches réellement concernées et les conséquences prévisibles sur le planning. Le calendrier est réexaminé en tenant compte de ce manque et des obligations de chacun. Ce retard ne nous exonère pas automatiquement de nos propres engagements et ne supprime pas vos droits légaux.

La rédaction, la recherche d’images et la création de contenus sont incluses uniquement si elles figurent expressément au devis.


## 107. WEB-FORMULAIRE-AVANCE — Formulaire avancé et traitement des données

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `c958e350-165a-4500-8f25-7df2d584705b` ; modèle `c28c9b97-7bd7-4977-9270-7c58c4860bdd`, statut `published`.
- **Défauts rédactionnels** : Traitements et stockage abstraits.
- **Éléments préservés** : Formulaire et règles convenus, données et destinataires validés ; stockage, automatisations et connexions limités au périmètre vendu.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Validation client ne décharge pas rôle réel ni sécurité ; coordonner avec données et consentement.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Validation client ne décharge pas rôle réel ni sécurité ; coordonner avec données et consentement.
- **Changement important / vigilance** : Traitements et stockage abstraits.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation couvre le formulaire, les règles et les traitements expressément décrits au devis. Le Client valide les données demandées, leur finalité, les destinataires et les informations présentées aux utilisateurs. Le stockage, les automatisations et les connexions externes sont limités au périmètre convenu.

### Proposition humaine — intégrale, à valider

Nous réalisons le formulaire, les règles et les traitements expressément décrits au devis.

Vous validez les données demandées, leur finalité, leurs destinataires et les informations présentées aux utilisateurs.

Le stockage, les automatisations et les connexions externes sont limités au périmètre convenu.


## 108. WEB-HEBERGEMENT — Hébergement et nom de domaine

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `e850fb05-ec44-4d28-8c3e-2350ab431360` ; modèle `1e1bc2d3-453c-4300-9dc7-f4922b682f71`, statut `published`.
- **Défauts rédactionnels** : Trois sujets dans un long paragraphe ; fournisseur/transfert incomplets dans le dossier.
- **Éléments préservés** : Fournisseur/périmètre/durée/coûts ; titulaire et accès domaine ; pas propriété agence ; renouvellement annuel exprès/mensuel continu ; prix ; limites non exonératoires ; export/transfert ; migration complexe acceptée ; suppression et archives.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas convertir un an offert en abonnement automatique. Identifier les conditions de récupération réelles sans inventer de délai.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Ne pas convertir un an offert en abonnement automatique. Identifier les conditions de récupération réelles sans inventer de délai.
- **Changement important / vigilance** : Trois sujets dans un long paragraphe ; fournisseur/transfert incomplets dans le dossier.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S15 — Résiliation électronique — L215-1-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29) ; [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

Lorsque l’hébergement ou le nom de domaine est inclus dans une prestation Web, le devis indique le fournisseur, le périmètre, la durée, les coûts inclus et les conditions de poursuite du service. Le titulaire du nom de domaine et les modalités d’accès à sa gestion sont identifiés explicitement ; l’intervention technique d’AtoumWeb ne lui transfère pas la propriété du domaine. Les engagements annuels d’hébergement ou de domaine sont renouvelés par accord exprès, sans reconduction annuelle tacite par défaut. Une prestation mensuelle expressément souscrite se poursuit de mois en mois jusqu’à résiliation selon les conditions convenues. Tout changement de prix respecte les modalités acceptées et les règles applicables, sans modification automatique d’un engagement en cours. Les limites pertinentes du fournisseur sont communiquées au Client et ne dispensent pas AtoumWeb de ses propres obligations. La fin de service est organisée avec une période de récupération, d’export ou de transfert précisée au devis. Une migration ou reconstruction complexe nécessite un accord complémentaire si elle dépasse le périmètre convenu. Les données devenues inutiles sont supprimées selon les règles applicables ; sauvegardes et archives légalement ou légitimement conservées suivent leurs durées propres.

### Proposition humaine — intégrale, à valider

Si l’hébergement ou le nom de domaine est compris dans votre prestation, le devis précise le fournisseur, les services couverts, leur durée, les coûts inclus et les conditions de poursuite.

Le titulaire du domaine et les accès permettant de le gérer sont identifiés explicitement. Notre intervention technique ne nous rend pas propriétaires de votre domaine.

Les engagements annuels d’hébergement ou de domaine sont renouvelés par accord exprès, sans reconduction annuelle tacite par défaut. Une prestation mensuelle expressément souscrite se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les changements de prix respectent les conditions acceptées et la loi ; ils ne modifient pas automatiquement un engagement en cours.

Nous vous communiquons les limites utiles du fournisseur. Elles ne nous dispensent pas de nos propres obligations.

Le devis prévoit la période permettant de récupérer, d’exporter ou de transférer les éléments à la fin du service. Une migration ou une reconstruction complexe nécessite un accord complémentaire si elle dépasse le périmètre convenu. Les données devenues inutiles sont supprimées selon les règles applicables ; les sauvegardes et archives conservées légalement ou légitimement suivent leurs durées propres.


## 109. WEB-LICENCES — Thèmes, extensions, polices et services tiers

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `0d67e6e1-40bf-413e-9748-ea398c3a0331` ; modèle `acd17b44-1d24-4d1b-ba68-47334455202a`, statut `published`.
- **Défauts rédactionnels** : Énumération technique ; peut rester à charge ne tranche pas les coûts réels.
- **Éléments préservés** : Outils tiers ; licences incluses identifiées ; renouvellement client possible ; adaptation selon contrat/cause/loi ; hors travaux dus et accord.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Identifier les licences/comptes réellement vendus ; aucune obligation due supprimée par l’arrêt d’un abonnement.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Identifier les licences/comptes réellement vendus ; aucune obligation due supprimée par l’arrêt d’un abonnement.
- **Changement important / vigilance** : Énumération technique ; peut rester à charge ne tranche pas les coûts réels.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Le site peut utiliser des composants tiers tels que WordPress, Divi, extensions, bibliothèques, services externes, polices ou outils de mesure.

Les licences incluses dans la prestation sont précisées au devis. Lorsqu’un abonnement tiers est nécessaire au maintien d’une fonctionnalité, son renouvellement peut rester à la charge du Client.

Une modification, une suppression ou un arrêt d’un service tiers peut nécessiter une adaptation. Sa prise en charge est déterminée selon le contrat, la cause du changement et les obligations légales applicables. Seuls les travaux qui ne sont pas déjà dus peuvent faire l’objet d’une prestation complémentaire acceptée par le Client.

### Proposition humaine — intégrale, à valider

Votre site peut utiliser des outils fournis par d’autres éditeurs : WordPress, thèmes comme Divi, extensions, polices, bibliothèques de code, services externes ou outils de mesure.

Le devis précise les licences comprises dans la prestation. Si une fonction dépend d’un abonnement tiers, son renouvellement peut rester à votre charge.

Si un service tiers change, disparaît ou s’arrête, une adaptation peut être nécessaire. Sa prise en charge dépend du contrat, de la cause du changement et des obligations légales applicables. Seuls les travaux qui ne sont pas déjà dus peuvent faire l’objet d’une prestation complémentaire que vous acceptez.


## 110. WEB-MISE-EN-LIGNE — Mise en ligne et environnement technique

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `905cbe51-c69b-4b14-9db1-aa1fb48b7210` ; modèle `d02facb7-1dc1-4dc1-add6-0907b7c5b0cb`, statut `published`.
- **Défauts rédactionnels** : Intégration et origine extérieure abstraites.
- **Éléments préservés** : Accès/hébergement/domaine/tiers nécessaires ; préparation et obligations propres ; causalité/rôle du tiers ; pas exonération ; information.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas remplacer par une irresponsabilité générale pour tout hébergeur externe.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas remplacer par une irresponsabilité générale pour tout hébergeur externe.
- **Changement important / vigilance** : Intégration et origine extérieure abstraites.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).

### Texte publié actuel — intégral

La mise en ligne suppose que les accès techniques nécessaires aient été fournis et que l’hébergement, le nom de domaine et les services tiers requis soient opérationnels.

La présence d’un service tiers ne dispense pas AtoumWeb de ses obligations de préparation, d’intégration et d’intervention prévues au contrat. Les conséquences d’un blocage sont appréciées selon sa cause, le rôle du tiers et les règles de responsabilité applicables. Aucune exonération ne résulte automatiquement de l’origine extérieure de l’incident.

AtoumWeb informe le Client lorsqu’un blocage externe empêche ou retarde la mise en ligne.

### Proposition humaine — intégrale, à valider

Pour mettre le site en ligne, nous devons disposer des accès nécessaires. L’hébergement, le nom de domaine et les services extérieurs requis doivent également être opérationnels.

Le recours à un service extérieur ne nous dispense pas des travaux de préparation, de connexion et d’intervention prévus au contrat. Les conséquences d’un blocage dépendent de sa cause, du rôle du prestataire concerné et des règles de responsabilité applicables. Son origine extérieure ne nous exonère pas automatiquement.

Nous vous informons lorsqu’un tel blocage empêche ou retarde la mise en ligne.


## 111. WEB-MULTILINGUE — Périmètre multilingue et traductions fournies

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `8a3e9148-9c07-438d-ba5d-b9cf6ec5c8fa` ; modèle `ce0da934-3e43-4663-928a-fe6e6e521d8e`, statut `published`.
- **Défauts rédactionnels** : Périmètre multilingue administratif.
- **Éléments préservés** : Configuration et intégration des traductions convenues ; textes fournis et validés par le client sauf commande ; autres contenus non inclus.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas présenter l’intégration comme une traduction ou validation juridique non vendue.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas présenter l’intégration comme une traduction ou validation juridique non vendue.
- **Changement important / vigilance** : Périmètre multilingue administratif.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

La prestation couvre la configuration des langues et l’intégration des traductions prévues au devis. Sauf prestation de traduction expressément commandée, le Client fournit et valide les textes traduits. Les fonctions, pages ou contenus non compris dans le périmètre multilingue défini au devis restent exclus.

### Proposition humaine — intégrale, à valider

Nous configurons les langues et intégrons les traductions prévues au devis.

Sauf prestation de traduction expressément commandée, vous fournissez et validez les textes traduits. Les fonctions, pages et contenus qui ne font pas partie du périmètre multilingue convenu ne sont pas compris.


## 112. WEB-NEWSLETTER-PERIMETRE — Périmètre d’intégration newsletter

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `93a61fab-4ac6-436a-bea5-45701ee5506f` ; modèle `be581bdf-2c6b-4061-9006-113388f23d7a`, statut `published`.
- **Défauts rédactionnels** : Consentement et migrations dans une phrase technique.
- **Éléments préservés** : Formulaire et connexion standard vendus ; compte, listes et informations du client ; campagnes et fonctions avancées seulement si expressément prévues.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : La fourniture de listes ne prouve pas leur licéité ; vérifier règles de prospection applicables sans ajouter une mission juridique globale.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; La fourniture de listes ne prouve pas leur licéité ; vérifier règles de prospection applicables sans ajouter une mission juridique globale.
- **Changement important / vigilance** : Consentement et migrations dans une phrase technique.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4) ; [S22 — Traceurs : consentement, refus et retrait — CNIL](https://cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi).

### Texte publié actuel — intégral

La prestation couvre l’intégration du formulaire et sa connexion standard au service d’envoi indiqué au devis. Le Client fournit son compte, les listes, les textes d’information et les choix de consentement applicables. Les campagnes, automatisations, segmentations ou migrations de données ne sont incluses que si elles sont expressément prévues.

### Proposition humaine — intégrale, à valider

Nous intégrons le formulaire d’inscription et sa connexion standard au service d’envoi indiqué au devis.

Vous fournissez le compte, les listes, les textes d’information et les choix de consentement applicables.

Les campagnes, automatisations, segments de destinataires et transferts de données sont compris uniquement s’ils sont expressément prévus.


## 113. WEB-OFFRE-5P-PERIMETRE — Périmètre du forfait Site vitrine 5 pages

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `2c6a55f6-9111-4376-9c4a-b9d739d9e65e` ; modèle `8d555888-c0f6-49a6-9821-e79099a69675`, statut `published`.
- **Défauts rédactionnels** : Titre 5pages mais corps renvoie à une liste ; contenu du forfait non à deviner.
- **Éléments préservés** : Pages et éléments listés dans la ligne d’offre et ses prestations associées ; suppléments acceptés avant réalisation.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Vérifier compte de pages effectivement vendu et statut des pages légales sans imposer5dans le texte.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Vérifier compte de pages effectivement vendu et statut des pages légales sans imposer5dans le texte.
- **Changement important / vigilance** : Le titre mentionne5pages ; la liste du devis reste la référence. Ne pas ajouter5pages si la vente enregistrée diffère.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

L’offre couvre la réalisation du site vitrine décrit au devis et des pages qui y sont expressément listées. Les pages légales, fonctions, contenus, intégrations et services inclus sont ceux indiqués dans la ligne d’offre et ses prestations associées. Toute page, fonctionnalité ou intégration supplémentaire relève d’une option ou d’un complément accepté avant réalisation.

### Proposition humaine — intégrale, à valider

Nous réalisons le site vitrine décrit au devis, avec les pages qui y sont expressément listées.

Les pages légales, fonctions, contenus, connexions et services compris sont ceux de la ligne d’offre et de ses prestations associées.

Une page, une fonction ou une connexion supplémentaire relève d’une option ou d’un complément que vous acceptez avant sa réalisation.


## 114. WEB-PAGE-SUP-PERIMETRE — Périmètre d’une page supplémentaire

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d1b8142d-4cda-4eef-b5d3-a8a9c1769e9b` ; modèle `38d0fd9c-a1cf-49c9-81cf-b37a889ffe26`, statut `published`.
- **Défauts rédactionnels** : Continuité et volume non prévus à expliciter.
- **Éléments préservés** : Continuité du site, contenus et objectif prévus ; fonctions ou volumes non convenus exclus et demandes supplémentaires chiffrées avant réalisation.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas ajouter un quota de mots ou un prix non enregistré.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas ajouter un quota de mots ou un prix non enregistré.
- **Changement important / vigilance** : Continuité et volume non prévus à expliciter.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).

### Texte publié actuel — intégral

Une page supplémentaire est ajoutée dans la continuité graphique et technique du site concerné, à partir des contenus fournis et pour l’objectif défini au devis. Elle ne comprend pas une fonctionnalité, une intégration ou un volume de contenu non prévu. Toute demande dépassant ce cadre est chiffrée séparément avant réalisation.

### Proposition humaine — intégrale, à valider

Nous ajoutons la page dans la continuité graphique et technique du site, à partir des contenus fournis et pour l’objectif défini au devis.

Elle ne comprend pas de fonction, de connexion à un autre outil ou de volume de contenu non prévu. Une demande qui dépasse ce cadre est chiffrée séparément avant sa réalisation.


## 115. WEB-PAIEMENT-TIERS — Paiement simple via prestataire tiers

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a436a031-0569-42b1-99de-b4b63f098ab9` ; modèle `9fceaa4e-abea-4afd-8f60-c2460d53e82a`, statut `published`.
- **Défauts rédactionnels** : Code SERVICE-TIERS et flux financiers très techniques.
- **Éléments préservés** : Compte et contrat de paiement au nom du client, fonds reçus directement ; aucune détention ou redistribution par l’agence ; intégration technique et autorisations compatibles.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Confirmer le modèle réellement déployé ; ne pas transformer en mandat de paiement ni assouplir interdiction de détenir les fonds.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Confirmer le modèle réellement déployé ; ne pas transformer en mandat de paiement ni assouplir interdiction de détenir les fonds.
- **Changement important / vigilance** : Maintenir le circuit direct client/prestataire ; pas de détention ou de reversement de fonds par l’agence.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation couvre uniquement l’intégration technique du moyen de paiement externe prévu au devis. Le compte du prestataire est au nom du Client, qui contracte directement avec Stripe, PayPal ou le prestataire retenu et reçoit directement les fonds de ses propres clients. AtoumWeb ne détient, n’encaisse, ne conserve ni ne reverse de fonds pour le compte du Client. Le Client fournit les accès autorisés et les informations nécessaires à la configuration. Les commissions, vérifications et règles du prestataire suivent SERVICE-TIERS, sans dispenser AtoumWeb de ses propres obligations techniques. Les permissions et flux effectivement mis en place doivent rester compatibles avec ce périmètre d’intégration.

### Proposition humaine — intégrale, à valider

Nous intégrons uniquement le moyen de paiement externe prévu au devis.

Le compte est à votre nom : vous contractez directement avec Stripe, PayPal ou le prestataire choisi et recevez directement les paiements de vos clients. Nous ne détenons, n’encaissons, ne conservons ni ne reversons de fonds pour votre compte.

Vous fournissez les accès autorisés et les informations nécessaires à la configuration. Les commissions, vérifications et règles du prestataire suivent la clause « Dépendances et coûts de services tiers », sans nous dispenser de nos propres obligations techniques.

Les autorisations et circuits de paiement effectivement mis en place doivent rester compatibles avec ce rôle d’intégration.


## 116. WEB-PORTFOLIO-PERIMETRE — Périmètre portfolio / réalisations

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `d13beda8-c903-45bb-a69c-12ad70c8922b` ; modèle `cbb42702-88f3-4102-8c9d-24ad18a3fb29`, statut `published`.
- **Défauts rédactionnels** : Portfolio et import volumineux peu définis.
- **Éléments préservés** : Structure et réalisations convenues, informations et autorisations fournies ; import important, filtres, recherche et développements seulement si mentionnés.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Ne pas inventer un seuil de volume ni exclure une fonction déjà vendue.
- **Risque** : Faible. **Avis professionnel** : Recommandée dans la revue d’ensemble ; Ne pas inventer un seuil de volume ni exclure une fonction déjà vendue.
- **Changement important / vigilance** : Portfolio et import volumineux peu définis.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S2 — Information précontractuelle — L111-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19) ; [S7 — Cession des droits — L131-3](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).

### Texte publié actuel — intégral

La prestation couvre la structure de portfolio et la présentation des réalisations définies au devis. Le Client fournit les informations, visuels et autorisations nécessaires. L’import d’un volume important, les filtres complexes, les fonctions de recherche ou les développements spécifiques ne sont inclus que s’ils sont mentionnés.

### Proposition humaine — intégrale, à valider

Nous mettons en place la structure de portfolio et la présentation des réalisations définies au devis. Vous fournissez les informations, visuels et autorisations nécessaires.

L’import d’un volume important de réalisations, les filtres complexes, la recherche et les développements spécifiques sont compris uniquement s’ils sont mentionnés.


## 117. WEB-RESA-EXT — Réservation via service externe

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `a77193ed-ab20-4d12-a2e3-bd51be154ed9` ; modèle `9ecd2852-2f99-4117-a2ac-c32a93e014c5`, statut `published`.
- **Défauts rédactionnels** : Paramétrage et service externe denses.
- **Éléments préservés** : Intégration du service prévu, fonctionnement selon ses réglages et conditions ; adaptations hors standard soumises à accord.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : L’intégration ne garantit pas le service tiers ; conserver responsabilités propres et règles données/paiement.
- **Risque** : Modéré. **Avis professionnel** : Recommandée dans la revue d’ensemble ; L’intégration ne garantit pas le service tiers ; conserver responsabilités propres et règles données/paiement.
- **Changement important / vigilance** : Paramétrage et service externe denses.
- **Traçabilité du travail** : Nouvelle réécriture individuelle, revue dans les assemblages et les groupes de dépendances pertinents.
- **Références** : [S8 — RGPD, responsabilités et sous-traitance — CNIL](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

### Texte publié actuel — intégral

La prestation couvre l’intégration au site du service externe de réservation indiqué au devis. Le fonctionnement des disponibilités, confirmations, paiements et données gérées par ce service dépend de son paramétrage et de ses propres conditions. Les adaptations dépassant les possibilités standard du service font l’objet d’un accord complémentaire.

### Proposition humaine — intégrale, à valider

Nous intégrons à votre site le service externe de réservation indiqué au devis.

La gestion des disponibilités, confirmations, paiements et données par ce service dépend de sa configuration et de ses propres conditions.

Une adaptation qui dépasse ses possibilités standard fait l’objet d’un accord complémentaire.


## 118. WEB-VALIDATION — Validation avant mise en ligne

- **Famille** : Création de sites web. **Audience source** : all — Professionnels et consommateurs, selon la prestation et le régime réel.
- **Version source** : v1, `2b5cd786-76cb-4b73-b04c-b318d0ae2669` ; modèle `d06b8c2c-e49c-44c6-9116-057da3479697`, statut `published`.
- **Défauts rédactionnels** : Code interne BASE-VALIDATION visible ; vocabulaire technique.
- **Éléments préservés** : Présentation avant mise en ligne ; vérifications client ; validation explicite écrite ; renvoi substantiel au socle ; mise en ligne convenue ; modifications hors anomalies.
- **Portée à examiner** : Aucune modification volontaire de fond. Risque ou nuance à examiner : Remplacer le code par le titre de la clause, sans supprimer son renvoi ni faire renoncer aux garanties.
- **Risque** : Élevé. **Avis professionnel** : Prioritaire avant adoption ; Remplacer le code par le titre de la clause, sans supprimer son renvoi ni faire renoncer aux garanties.
- **Changement important / vigilance** : Code interne BASE-VALIDATION visible ; vocabulaire technique.
- **Traçabilité du travail** : Formulation conservée ; revue transversale des audiences, renvois, garanties, droits, tiers et durées.
- **Références** : [S3 — Recours en cas d’inexécution — Code civil, 1217](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712) ; [S10 — Conformité numérique — L224-25-12 et suivants](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).

### Texte publié actuel — intégral

Avant mise en ligne, AtoumWeb présente au Client la version du site destinée à validation.

Le Client vérifie notamment les contenus, coordonnées, liens, formulaires, informations légales et éléments visuels relevant de son activité.

La validation du Client est explicite et conservée sur un support écrit conformément à BASE-VALIDATION. La mise en ligne suit cette validation et les modalités de déploiement convenues au devis.

Toute modification demandée après validation finale peut être traitée comme une prestation complémentaire, sauf si elle correspond à la correction d’une anomalie relevant directement de la prestation convenue.

### Proposition humaine — intégrale, à valider

Avant la mise en ligne, nous vous présentons la version du site à valider.

Vous vérifiez notamment les contenus, les coordonnées, les liens, les formulaires, les informations légales et les éléments visuels liés à votre activité.

Votre validation doit être explicite et conservée par écrit, selon les conditions prévues dans la clause « Validation des livrables » des conditions générales communes. La mise en ligne intervient ensuite selon les modalités convenues au devis.

Une modification demandée après la validation finale peut être traitée comme une prestation complémentaire, sauf si elle corrige une anomalie relevant directement de la prestation convenue.

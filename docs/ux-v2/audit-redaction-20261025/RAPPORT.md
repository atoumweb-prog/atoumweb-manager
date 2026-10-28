# Audit rédactionnel des devis et contrats — 25 octobre 2026

## Décision et périmètre

**Phase A terminée : audit et propositions documentaires uniquement.** Aucun code applicatif, prix, quantité, devis, base, clause publiée, statut ou exécutable modifié. Aucun nouveau brouillon créé dans la bibliothèque. Le JSON joint contient des propositions à examiner, pas une migration ni une autorisation d’importation. Aucune publication, adoption, fusion ou livraison effectuée.

Conserver le design approuvé et l’ensemble « devis commercial + annexe contractuelle + acceptation commune ». Le défaut principal est la provenance et la formulation des textes, pas cette architecture. Une rédaction lourde n’est pas une preuve d’invalidité. Les niveaux de risque ci-dessous mesurent la sensibilité d’une reformulation ; ils ne certifient ni n’invalident le texte publié.

## Sources réellement examinées

PDF : `DEV-2026-003-reglages-entreprise-20261025.pdf` (fichier local non publié), 10 pages, 35 clauses. Le PDF est un exemple de recette composé sur une copie temporaire. La base du portable contient actuellement 15 clauses socle pour ce devis ; les 20 clauses spécifiques de l’exemple ne doivent pas être présentées comme déjà adoptées dans le dossier.

Base de livraison `47db9101` lue seule, fichier local non publié. Export cohérent en transaction de lecture, sans écriture. État du code : `c867a1d762265845589301fe8ba1f73d606ad281`.

Inventaire : **118 modèles / 118 versions publiées**, dont 19 socle et 99 Catalogue ; 105 audiences communes, 10 consommateurs, 3 professionnels. 409 liens Catalogue/clauses ; 13 types contractuels en brouillon et 112 liens Catalogue/types. Aucune ligne dans les revues structurées `contract_clause_section_reviews` : cela ne prouve pas l’absence de tout conseil juridique antérieur. « Publié » est un statut de l’application, pas une certification.

Les 35 clauses du PDF sont examinées individuellement ci-dessous ; les 83 autres sont inventoriées, sans prétendre à leur audit juridique individuel. Les clauses consommateurs ne figurant pas dans cet exemple professionnel doivent faire l’objet d’une recette distincte.

## Où naissent les textes et quoi modifier ensuite

| Source / fichiers | Constat et correction proposée en phase B |
|---|---|
| `src/main/commercial/CatalogService.ts` ; versions du Catalogue | Séparer l’intention exprimée par l’acheteur (`clientNeed`) de la description professionnelle de ce qui est vendu. Réviser les futures versions, sans écraser les versions vendues. |
| `src/renderer/commercial/QuoteLineEditor.tsx`, `QuoteLineParametersPanel.tsx` | Éditer la description, le périmètre, les exclusions et les engagements par ligne ; montrer la provenance. Ne pas remplacer automatiquement un texte local par le Catalogue. |
| `src/main/commercial/ContractTermsService.ts`, `ContractLibraryPage.tsx`, `ContractClauseDesk.tsx`, `ContractTermsBuilder.tsx` | Conserver création de version, publication et adoption comme actions distinctes. Présenter avant/après et portée, une clause à la fois. |
| `src/shared/contractPresentation.ts` | Regrouper sans fusionner les engagements ; références de version discrètes ; titres humains. Ne pas nettoyer silencieusement le corps d’une clause figée. |
| `src/shared/quoteDocumentHtml.ts`, `src/main/commercial/quotePdf.ts` | La description de ligne est imprimée telle qu’enregistrée : le moteur ne peut pas deviner le vrai périmètre. Même rendu pour aperçu/export ; conserver titres avec le premier paragraphe et pagination validée. |
| `src/shared/quoteContractDefaults.ts` | Remplacer les inférences fragiles par des faits structurés issus de la vente ; pas de qualification juridique globale déduite du nom d’une offre. |
| `src/main/commercial/QuoteContractPreparationService.ts`, `CommercialRulesService.ts`, `QuoteContractPreparationPanel.tsx`, `QuoteFinalizationPanel.tsx` | Distinguer incomplet, à confirmer et bloquant selon prestation/audience. La présence d’un texte ne prouve pas sa précision ni sa validité. |
| `src/renderer/commercial/QuotesPage.tsx`, `QuoteJourney.tsx`, `QuoteClientPreview.tsx`, `QuotePdfPages.tsx` ; `src/renderer/crm/ProspectPreQuoteReview.tsx` | Même parcours depuis Prospection et Devis ; informations de contrôle utiles à côté de l’édition, pas toutes dans le document client. |
| `QuoteService.ts`, `quoteTransmission.ts`, `QuoteDocumentSettingsService.ts`, `CompanyQuoteSettings.tsx` | Protéger versions transmises/acceptées, preuves, modèle et données figées ; réglages généraux sans remplacement rétroactif. |

### Points techniques relevés, à tester avant toute correction

1. Le motif d’hébergement `hébergement\s+1\s+an` ne reconnaît pas le texte vendu « Hébergement offert 1 an ». Certaines gardes prestataires/RGPD dépendent ensuite d’un libellé d’avantage inclus. C’est un décalage statique constaté ; vérifier les autres chemins de renseignement avant de conclure qu’un dossier échappe effectivement aux contrôles. Utiliser un indicateur structuré plutôt qu’une phrase comme règle métier.
2. Une maintenance reconnue continue peut influencer la qualification globale alors que la création est ponctuelle. Conserver les engagements distincts par ligne ; soumettre la qualification juridique à confirmation.
3. Le choix d’audience et le régime de certains professionnels hors établissement sont distincts. Tester la couverture réelle des clauses requises, sans transformer tous les petits professionnels en consommateurs.
4. `updateConditions` recalcule une date de validité à partir de la date courante et du nombre de jours. Tester qu’une simple correction rédactionnelle ne décale pas involontairement cette date ; ce risque n’est pas une extension systématique démontrée.
5. « À définir » ne doit pas devenir une date contractuelle satisfaisante par simple présence dans un champ. Ne pas masquer les manquants critiques pour rendre le PDF plus propre.

## Trois catégories de changements

**Rédaction** : phrases courtes, « nous/vous » avec définition commune, développement des abréviations, titres lisibles, renvoi humain au titre d’un article. Une substitution globale reste dangereuse : les modules réutilisés doivent conserver leur définition des parties et leurs réserves.

**Commercial** : description professionnelle distincte du besoin exprimé ; quantités, exclusions, durée et événements exacts ; description autonome de la maintenance annuelle. Aucun changement de prix ni ajout de service.

**Portée juridique / décision métier** : paiement et rétractation, licence ou cession, garantie, responsabilité, suspension, renouvellement, données personnelles. Toute suppression d’exception, création d’un délai ou promesse nouvelle sort du simple style. Les propositions sensibles restent à revoir avant adoption.

## Exemple commercial proposé, sans modification des données

**Avant** : « Je veux payer ma maintenance WooCommerce à l’année », « Même actions que mensuel », « MAJ », « HNO », « gros incident ».

**Après — création ponctuelle** : « Création de votre boutique WooCommerce selon le périmètre du devis. L’offre comprend l’intégration de 10 produits simples ; la ligne supplémentaire porte sur 51 produits, soit 61 au total. Vous fournissez les informations et contenus nécessaires. »

Ajouter dans le détail, uniquement depuis les données vendues : 3 pages commerciales dont l’accueil, pages techniques et légales hors quota, intégration des CGV fournies par le commerçant, jusqu’à 2 moyens de paiement standards, règles simples de livraison, hébergement et domaine standard offerts pendant un an. Les produits simples, variantes et exclusions restent décrits par les caractéristiques enregistrées. Ne pas faire croire que la rédaction des CGV du commerçant est incluse.

**Après — maintenance annuelle** : « Maintenance de votre boutique WooCommerce pendant 12 mois : mises à jour, sauvegardes et surveillance prévues au périmètre convenu. Jusqu’à 4 interventions mineures par mois, de 30 minutes maximum chacune, non reportables. Prise en charge sous un jour ouvré. » Ce délai concerne la prise en charge, pas une résolution garantie ; ce n’est pas une réserve libre de deux heures. Le périmètre mensuel explicité dans les paramètres locaux doit rester identifiable et confirmé, sans réécriture du snapshot annuel vendu.

**Exclusions à préciser avant édition définitive** : gestion quotidienne des commandes, refonte, interventions hors des horaires convenus et incidents dépassant le périmètre. Ne pas remplacer « gros incident » par une exclusion nouvelle supposée équivalente : préciser le seuil et les travaux visés. Horaires, fréquence/rétention des sauvegardes, restauration, début de maintenance et renouvellement restent des décisions à renseigner, pas des données à inventer.

Montants conservés : création 1 × 1 490 €, produits 51 × 15 € = 765 €, maintenance 1 × 1 089 € ; total **3 344 €**, acompte 30 % **1 003,20 €**, solde **2 340,80 €**. Le libellé de tranche « 51 à 100 » doit préciser la règle tarifaire réellement administrée ; ne pas supposer une tarification progressive ni la recalculer pendant une correction de texte.

Généralisation : pour vitrine, contenu, identité, photographie ou intervention technique, partir des mêmes champs structurés (livrables, limites, contribution du client, calendrier, prix, tiers), jamais d’un paragraphe spécial codé pour DEV-2026-003.

## Informations connues, à confirmer et bloquantes

| Information | État / décision attendue | Contrôle à retenir |
|---|---|---|
| Identité professionnelle, adresse, SIRET, email, franchise TVA | Confirmés et déjà intégrés dans le portable ; ne pas les redemander | Conserver la source commune et le snapshot du devis |
| Réclamations | Contact et procédure réels à compléter | Garde produit actuelle ; ne pas qualifier chaque sous-champ d’obligation légale universelle |
| Date ou événement de livraison | À convenir pour la création | Information précontractuelle consommateur, engagement suffisamment déterminé ; « à définir » insuffisant [S2] |
| Maintenance | Début, durée, échéance, renouvellement et sortie à confirmer | Séparer création ponctuelle et suivi récurrent ; ne pas présumer une reconduction tacite |
| Canal, contexte et finalité | À confirmer selon les faits | Conditionnent les règles applicables, pas une formalité décorative |
| Qualification de chaque obligation | À confirmer | Site et maintenance peuvent relever d’engagements distincts ; ne pas tout appeler fourniture continue |
| Droits/licences | Usages, éléments tiers et droits réellement accordés | Décrire les droits avant de prétendre à une cession ; revue spécialisée [S7] |
| Hébergement / accès aux données | Prestataires, rôles et traitements réels à confirmer | Si sous-traitance RGPD, accord adapté aux traitements et responsabilités [S8] |
| Médiateur | Organisme compétent réellement choisi si applicable | Consommateurs ; ne pas inventer un nom ni généraliser cette obligation à tout B2B [S18] |
| Rétractation et début anticipé | Selon audience, canal et prestation | Ne pas importer mécaniquement toutes les règles B2C à tout professionnel [S16, S17] |
| Sauvegardes / interventions | Fréquence, conservation, restauration, horaires et limites | Décisions commerciales manquantes ; aucune promesse inventée pour compléter un blanc |

## Lecture juridique transversale — périmètre et limites

Les conditions doivent avoir été communiquées et acceptées ; un changement ultérieur ne remplace pas le contrat accepté. Les recours pour inexécution doivent rester lisibles [S1, S3].

Pour le consommateur, les caractéristiques, prix, date ou délai, coordonnées et garanties nécessitent une information précontractuelle adaptée [S2]. Les textes ci-dessous ne suffisent pas à certifier le parcours de conclusion.

L’avance doit distinguer acompte et arrhes ; à défaut de stipulation contraire, le régime consommateur prévoit des arrhes [S5]. Le paiement hors établissement connaît des restrictions spécifiques, notamment pendant sept jours, sous exceptions [S6]. Ne pas transformer l’acompte en somme toujours acquise.

La force majeure dépend de conditions précises et de ses effets temporaires ou définitifs [S4]. Une dépendance à un tiers ou un incident technique ne suffit pas à la caractériser.

Une cession de droits nécessite une définition distincte des droits et de leur exploitation [S7]. Une formule générale « les droits sont transférés » n’est pas une solution de style. Les traitements confiés à un sous-traitant nécessitent des dispositions concrètes adaptées [S8].

Les limites de responsabilité s’apprécient dans le contrat entier ; une réserve de droits ne garantit pas à elle seule l’absence de déséquilibre [S9]. Si le régime de conformité numérique s’applique, distinguer fourniture ponctuelle et continue, sans confondre maintenance commerciale et garantie légale [S10]. Les mises à jour nécessaires peuvent être dues selon ce régime indépendamment d’un abonnement commercial [S14].

Les délais professionnels, pénalités et conditions de recouvrement suivent leur régime propre [S12] ; l’indemnité forfaitaire est fixée à 40 € [S13]. Une compétence territoriale dérogatoire ne s’applique pas indistinctement à tout professionnel [S11].

La protection de certains professionnels concerne notamment les contrats hors établissement, hors activité principale, avec cinq salariés au plus, pour les sections visées par L221-3 [S16]. Cela ne vaut pas assimilation générale au consommateur. La prestation web personnalisée ne bénéficie pas automatiquement de l’exception des biens personnalisés ; distinguer service pleinement exécuté et contenu numérique selon leurs conditions [S17].

Résiliation électronique [S15] et fonction de rétractation en ligne applicable depuis juin 2026 [S19] sont deux sujets distincts. Vérifier le parcours réel de souscription : une clause ne remplace pas une fonctionnalité requise.

## Doublons : alléger sans retirer une protection

BASE-VALIDATION fixe le principe ; WEB-VALIDATION l’applique au site et doit renvoyer au titre humain « Validation des livrables ». BASE-PI porte les droits ; WEB-CONTENUS distingue les éléments fournis ; WEB-LICENCES traite les éditeurs tiers. SERVICE-TIERS est général ; ECOM-PAIEMENT, WEB-HEBERGEMENT et MAINT-WOOCOMMERCE précisent des dépendances différentes. BASE-DELAIS et MAINT-INTERVENTIONS ne couvrent pas le même engagement.

Les répétitions de réserves sur les garanties, recours et responsabilités ne sont donc pas toutes inutiles : chaque module peut être employé seul. Préférer un renvoi clair lorsque la dépendance est garantie par le moteur ; conserver une réserve autonome si le module peut être isolé. Aucune suppression ou fusion automatique proposée dans cette phase.

Ordre de lecture recommandé : périmètre et coopération ; prix/paiement ; calendrier/validation ; droits et données ; clauses propres aux prestations ; responsabilité/force majeure/litiges. Conserver les identifiants et versions même si l’ordre d’affichage change. Ce rapport suit l’ordre actuel du PDF pour permettre la comparaison, pas une nouvelle numérotation publiée.

## Audit individuel — textes intégraux et propositions

Les propositions adoptent « nous/vous ». La définition dans BASE-ACCEPTATION doit accompagner chaque assemblage ; si un module est réutilisé seul, prévoir une définition équivalente. Aucun numéro de nouvelle version n’est réservé. Les textes d’origine ci-dessous sont ceux des versions publiées identifiées, pas une transcription approximative du PDF.


### 01. BASE-ACCEPTATION — Formation du contrat — v1

**Origine** : modèle `247df8e0-e440-434c-9d11-51a0e95fa434`, version `ba6a38d9-2e9e-40e2-b335-0df1899316fb`, statut `published`.

**1. Utilité** : Établir quand le contrat est conclu et quelle version fait foi.

**2. Clarté / défaut** : Style impersonnel ; formulation des versions peu concrète.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. La signature commune ne remplace pas la preuve de communication des conditions avant acceptation. Repères : [S1](#s1). Il ne s’agit pas d’une certification.

**4. Répétitions** : Acceptation finale et mentions de devis : aligner sans supprimer la preuve.

**5. Risque de reformulation** : **Faible**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Validité de l’offre ; conditions communiquées et acceptées ; preuve ; accord pour modification ; version acceptée de référence.

#### Texte publié actuel

Le contrat est formé lorsque le Client accepte, pendant sa période de validité, le devis et les conditions qui lui ont été communiquées. L’acceptation est recueillie par le moyen indiqué au devis et sa preuve est conservée. Toute modification des prestations ou des conditions après acceptation nécessite un accord des parties, formalisé dans un avenant ou un devis complémentaire. La version acceptée reste la référence pour les engagements déjà conclus.

#### Proposition à examiner — non appliquée

Dans ces conditions, « nous » désigne AtoumWeb et « vous » le client identifié au devis.

Le contrat est conclu lorsque vous acceptez le devis pendant sa période de validité, ainsi que les conditions que nous vous avons communiquées. Le devis précise comment recueillir votre acceptation ; nous en conservons la preuve.

Après acceptation, toute modification des prestations ou des conditions nécessite notre accord commun, formalisé dans un avenant ou un devis complémentaire. La version acceptée reste la référence pour les engagements déjà conclus.


### 02. BASE-CONFIDENTIALITE — Confidentialité — v1

**Origine** : modèle `aad2378e-eec7-4539-adc4-bf1f7523b240`, version `57a12cb5-879f-4d74-bbc2-9a1c0a626954`, statut `published`.

**1. Utilité** : Protéger les informations échangées sans effacer les exceptions.

**2. Clarté / défaut** : Termes abstraits : obligation appropriée, modalités nécessaires.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Les durées et obligations RGPD réelles restent à définir séparément. Repères : [S8](#s8). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Faible**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Obligation réciproque ; usage limité ; accès restreint ; trois exceptions ; restitution/suppression/conservation à préciser.

#### Texte publié actuel

Chaque partie préserve les informations non publiques reçues pour la mission et ne les utilise que pour son exécution. Leur accès est limité aux personnes qui en ont besoin et soumises à une obligation appropriée de confidentialité. Ne sont pas couvertes les informations déjà publiques sans faute, obtenues légitimement d’un tiers ou dont la divulgation est légalement requise. Les modalités de restitution, de suppression ou de conservation nécessaires sont précisées selon la nature du dossier.

#### Proposition à examiner — non appliquée

Chacun de nous protège les informations non publiques reçues pour la mission et les utilise uniquement pour la réaliser. Seules les personnes qui en ont besoin peuvent y accéder, avec une obligation de confidentialité adaptée.

Cette protection ne couvre pas les informations devenues publiques sans faute, obtenues légalement auprès d’un tiers ou dont la communication est imposée par la loi.

Selon le dossier, nous précisons les modalités nécessaires pour restituer, supprimer ou conserver ces informations.


### 03. BASE-COOPERATION — Obligations et coopération du client — v1

**Origine** : modèle `ae8a55e7-7d34-454f-ae07-fc8455edb211`, version `cb723072-f2a4-4e98-99f7-6b52a907a4d9`, statut `published`.

**1. Utilité** : Définir les contributions nécessaires de chaque partie.

**2. Clarté / défaut** : Interlocuteur habilité et procédure d’accord complémentaire peu accessibles ; recoupement avec WEB-CONTENUS.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas transformer un retard du client en report automatique de tous les délais. Repères : [S2](#s2), [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Éléments et validations nécessaires ; personne autorisée ; exactitude ; contraintes ; information du retard et planning ; accord hors périmètre.

#### Texte publié actuel

Le Client fournit les informations, contenus, accès et validations nécessaires aux prestations convenues et désigne un interlocuteur habilité à décider. Il vérifie l’exactitude des éléments transmis et signale les contraintes connues. Lorsqu’un élément nécessaire manque ou arrive tardivement, AtoumWeb informe le Client de l’incidence sur la réalisation et propose un planning adapté. Une demande qui modifie le périmètre convenu suit la procédure d’accord complémentaire.

#### Proposition à examiner — non appliquée

Vous nous fournissez les informations, contenus, accès et validations nécessaires aux prestations convenues. Vous désignez une personne autorisée à prendre les décisions pour votre projet, vérifiez les éléments transmis et nous signalez les contraintes connues.

Si un élément nécessaire manque ou arrive en retard, nous vous expliquons ses conséquences sur la réalisation et proposons un calendrier adapté.

Une demande qui change le périmètre du devis doit faire l’objet d’un accord complémentaire.


### 04. BASE-DELAIS — Délais et planning — v1

**Origine** : modèle `180a2c80-789c-4e3b-a18c-ac15c99b124f`, version `03879272-62d6-4c3a-8206-4d1323369f0b`, statut `published`.

**1. Utilité** : Relier le calendrier aux engagements et aux retards réellement imputables.

**2. Clarté / défaut** : Phrases longues ; dépendance extérieure et règles impératives ; calendrier du dossier incomplet.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Un événement imprécis peut ne pas suffire à l’information précontractuelle du consommateur. Vérifier les délais réellement convenus. Repères : [S2](#s2), [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Départ et délais convenus ; date/délai B2C avant acceptation ; pas de départ indéterminé ; information/discussion ; recours maintenus.

#### Texte publié actuel

Le devis précise le calendrier, les conditions de départ et les dates ou délais d’exécution convenus. Pour un Client consommateur, une date ou un délai d’exécution est communiqué avant l’acceptation ; une simple estimation indicative ne remplace pas cette information obligatoire. Les conditions de départ ne peuvent rendre l’exécution indéterminée ni écarter les recours légaux. AtoumWeb informe le Client lorsqu’une information manquante, une validation attendue ou une dépendance extérieure affecte ce calendrier. Les conséquences et le nouveau planning sont discutés avec le Client. Ces circonstances n’écartent pas automatiquement les engagements pris ni les droits légaux applicables.

#### Proposition à examiner — non appliquée

Le devis précise le calendrier, les conditions de démarrage et les dates ou délais d’exécution convenus.

Si vous êtes un consommateur, nous vous communiquons une date ou un délai d’exécution avant votre acceptation. Une estimation simplement indicative ne remplace pas cette information. Les conditions de démarrage ne peuvent laisser l’exécution sans échéance déterminable ni écarter vos recours légaux.

Lorsqu’une information manquante, une validation attendue ou un service extérieur affecte le calendrier, nous vous en informons. Nous discutons avec vous des conséquences et du nouveau planning. Ces difficultés ne suppriment pas automatiquement nos engagements ni les droits prévus par la loi.


### 05. BASE-DONNEES — Données et accès — v1

**Origine** : modèle `bd1b434b-50ca-4f6d-b0fc-82f7bef4c0ea`, version `23243967-02d3-4d3a-8a0b-fb9e5adeff62`, statut `published`.

**1. Utilité** : Répartir les rôles liés aux données personnelles selon les traitements.

**2. Clarté / défaut** : Accumulation technique ; simple renvoi au RGPD insuffisant pour un dossier réel.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Un encadrement concret de sous-traitance peut être nécessaire ; cette clause générale ne suffit pas. Repères : [S8](#s8). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Usage autorisé ; accès nécessaires ; rôles ; instructions/sécurité/conservation/restitution/suppression ; encadrement préalable ; information des personnes distincte.

#### Texte publié actuel

Les accès et données confiés pour la mission sont utilisés dans le périmètre autorisé et limités aux besoins de la prestation. Les parties identifient leurs rôles réels dans les traitements et précisent les instructions, mesures de sécurité, accès, durées de conservation et modalités de restitution ou de suppression nécessaires. Lorsqu’AtoumWeb traite des données personnelles pour le compte du Client, un encadrement conforme au RGPD doit être établi avant ce traitement. Le présent socle ne remplace pas cet encadrement spécifique ni les informations destinées aux personnes concernées.

#### Proposition à examiner — non appliquée

Nous utilisons les accès et les données confiés uniquement dans le cadre autorisé et pour les besoins de la prestation.

Nous précisons ensemble le rôle de chacun, les instructions à suivre, les mesures de sécurité, les personnes autorisées à accéder aux données, leur durée de conservation et les modalités nécessaires de restitution ou de suppression.

Si nous traitons des données personnelles pour votre compte, les conditions de ce traitement doivent être établies conformément au RGPD avant son commencement. Cette clause générale ne remplace ni cet accord spécifique ni les informations à fournir aux personnes concernées.


### 06. BASE-FORCE-MAJEURE — Force majeure — v1

**Origine** : modèle `25871a2c-7bf1-4f08-a6f5-19586a52f67c`, version `0696beba-8bf9-4200-bb60-6d745a7fa569`, statut `published`.

**1. Utilité** : Encadrer les événements empêchant l’exécution et leurs effets.

**2. Clarté / défaut** : Durable ou définitif ne décrit pas précisément un empêchement temporaire prolongé.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Vérifier suspension/résolution, notamment si un retard justifie la résolution ; aucune panne automatiquement exonératoire. Repères : [S4](#s4). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Qualification légale ; information ; suspension selon loi ; fin selon loi ; panne de tiers non automatiquement force majeure.

#### Texte publié actuel

La partie empêchée d’exécuter une obligation par un événement répondant aux conditions légales de la force majeure en informe l’autre partie et précise les conséquences connues. Un empêchement temporaire suspend l’obligation affectée dans les conditions légales ; un empêchement durable ou définitif est traité selon les règles applicables à la fin du contrat. Une panne ou une défaillance de tiers ne constitue pas automatiquement un cas de force majeure.

#### Proposition à examiner — non appliquée

Si un événement répondant aux conditions légales de la force majeure empêche l’un de nous de remplir une obligation, la partie concernée en informe l’autre et précise les conséquences connues.

Si l’empêchement est temporaire, l’obligation concernée est suspendue dans les conditions prévues par la loi. Si l’empêchement se prolonge ou devient définitif, ses conséquences sur la fin du contrat sont traitées selon les règles applicables.

Une panne ou la défaillance d’un prestataire extérieur ne constitue pas, à elle seule, un cas de force majeure.


### 07. BASE-OBJET — Objet et champ d'application — v1

**Origine** : modèle `5e542d5f-0739-439f-b6af-7bf6432cf59a`, version `be9149ea-f185-4a70-b1e3-1e989f6bb16f`, statut `published`.

**1. Utilité** : Délimiter les documents et prestations qui composent l’accord.

**2. Clarté / défaut** : Bonne substance ; place tardive ; hiérarchie abstraite.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Vérifier la communication effective des annexes, pas seulement leur citation. Repères : [S1](#s1). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Documents et annexes citées ; périmètre décrit ; priorité particulières/spécifiques/socle ; loi impérative.

#### Texte publié actuel

Le devis accepté, ses conditions particulières, les clauses applicables qui l’accompagnent et les annexes expressément citées constituent le contrat. Il couvre uniquement les prestations et livrables qui y sont décrits. En cas de contradiction, les conditions particulières prévalent sur les clauses spécifiques de prestation, puis sur le socle commun, sous réserve des règles légales impératives.

#### Proposition à examiner — non appliquée

Votre devis accepté, ses conditions particulières, les clauses qui l’accompagnent et les annexes expressément citées forment le contrat. Celui-ci porte sur les prestations et livrables qui y sont décrits.

Si deux dispositions se contredisent, les conditions particulières priment sur les clauses propres aux prestations, qui priment elles-mêmes sur les conditions générales communes. Les règles légales auxquelles il n’est pas possible de déroger restent applicables.


### 08. BASE-PAIEMENT — Modalités générales de paiement — v1

**Origine** : modèle `086d23bb-8072-4b18-8f86-fa623ca3c4b6`, version `cae5b902-e682-4f81-9dd1-b741a7a90630`, statut `published`.

**1. Utilité** : Définir les avances et conditions de règlement convenues.

**2. Clarté / défaut** : Paragraphe dense ; acompte par défaut alors que l’éditeur autorise des arrhes ; modèle commercial interne.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Assurer la cohérence clause/choix enregistré. Certains contrats hors établissement interdisent un paiement pendant sept jours, sous exceptions. Repères : [S5](#s5), [S6](#s6). Il ne s’agit pas d’une certification.

**4. Répétitions** : PRO-PAIEMENT / PRO-RETARD : avance commune et régime professionnel distinct.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Qualification explicite ; échéances/moyens ; choix acompte et autre choix exprès ; arrhes B2C et double restitution ; restrictions encaissement ; accord échéancier ; rétractation/remboursements.

#### Texte publié actuel

Le devis indique la nature de toute somme versée d’avance, son montant, les échéances et les moyens de paiement. Le premier règlement du prix est expressément qualifié d’acompte au devis, conformément au modèle commercial AtoumWeb. Les arrhes ne sont pas le régime commercial retenu par défaut ; tout autre régime doit être expressément convenu. Pour un Client consommateur, en l’absence de stipulation contraire, les sommes versées d’avance constituent des arrhes : le Client peut se dédire en les perdant et le professionnel en restituant le double, sans préjudice des règles impératives applicables. Une condition de démarrage après encaissement doit être expressément prévue et ne permet pas de percevoir une somme pendant une période où la loi l’interdit, notamment pour certains contrats hors établissement. Les paiements intermédiaires et le solde sont dus aux échéances convenues. Une modification de l’échéancier nécessite l’accord des parties. Les droits de rétractation, les remboursements et les autres droits légaux restent applicables.

#### Proposition à examiner — non appliquée

Le devis précise le montant, la nature et les échéances des paiements, ainsi que les moyens de règlement.

Nous prévoyons par défaut un acompte, expressément indiqué au devis. Un autre régime doit être convenu explicitement. Si vous êtes un consommateur et qu’aucune disposition contraire n’est prévue, les sommes versées d’avance sont des arrhes : vous pouvez renoncer à la commande en les perdant ; si nous renonçons, nous vous en restituons le double, sous réserve des règles légales applicables.

Si le démarrage dépend de l’encaissement d’un paiement, cette condition doit être précisée. Elle ne nous autorise pas à percevoir une somme lorsque la loi l’interdit, notamment pour certains contrats conclus hors établissement.

Les paiements intermédiaires et le solde sont dus aux échéances convenues. Toute modification de l’échéancier nécessite notre accord commun. Les droits de rétractation, de remboursement et les autres droits légaux restent applicables.


### 09. BASE-PI — Propriété intellectuelle et droits d'utilisation — v1

**Origine** : modèle `4885fa1f-e0cb-49d9-a027-3896865cb47c`, version `cdb80eb7-e065-4a80-a3be-717874cb3b42`, statut `published`.

**1. Utilité** : Préciser les droits accordés et les limites liées aux éléments tiers.

**2. Clarté / défaut** : Large et pérenne imprécis sans paramètres ; logiciels, graphisme et tiers mélangés.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas transformer une licence en cession. Les droits concédés restent à décrire ; une cession nécessite une délimitation précise. Repères : [S7](#s7). Il ne s’agit pas d’une certification.

**4. Répétitions** : WEB-CONTENUS / WEB-LICENCES : droits créés, contenus fournis et outils tiers distincts.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Créations/outils génériques/tiers distincts ; licence spécifique utilisable/maintenable/modifiable ; exclusivité/cession expresse ; usages/supports/territoire/durée/effet ; graphisme/photo ; livraison pas cession ; licences et autorisations.

#### Texte publié actuel

Les éléments créés spécifiquement pour le Client sont distingués des outils, méthodes, composants génériques d’AtoumWeb et des ressources tierces. Pour les développements spécifiques, le modèle AtoumWeb prévoit une licence suffisamment large et pérenne permettant au Client d’utiliser, exploiter, maintenir et faire modifier le livrable. Une exclusivité ou cession particulière nécessite un accord exprès. Les droits convenus sont précisément décrits au devis ou dans son annexe, avec leurs usages, supports, territoire, durée et conditions d’effet. Les créations graphiques et photographies suivent les droits adaptés au livrable, définis par leurs clauses spécifiques. La livraison d’un fichier ne vaut pas, à elle seule, cession de tous les droits. Les éléments tiers restent soumis à leurs licences et le Client fournit les autorisations nécessaires sur ses propres contenus.

#### Proposition à examiner — non appliquée

Les créations réalisées pour vous sont distinguées de nos outils, méthodes et composants réutilisables, ainsi que des ressources appartenant à des tiers.

Pour les développements spécifiques, nous prévoyons une licence suffisamment large et durable pour vous permettre d’utiliser, d’exploiter, de maintenir et de faire modifier le livrable. Une exclusivité ou une cession particulière nécessite un accord exprès.

Le devis ou son annexe précise les droits convenus : usages autorisés, supports, territoire, durée et conditions de prise d’effet. Les créations graphiques et les photographies suivent les droits prévus dans leurs clauses spécifiques.

Recevoir un fichier ne signifie pas acquérir tous les droits sur celui-ci. Les ressources tierces restent soumises à leurs licences. Vous devez disposer des autorisations nécessaires pour les contenus que vous fournissez.


### 10. BASE-PRIX — Prix et périmètre — v1

**Origine** : modèle `f7243815-ad98-436f-b519-5c1a2e1bb6d6`, version `8c0f03b2-d39d-433a-8c08-ce14f38d2158`, statut `published`.

**1. Utilité** : Sécuriser le prix convenu et les travaux supplémentaires acceptés.

**2. Clarté / défaut** : Texte déjà clair ; formulations encore impersonnelles.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Aucun changement de prix ou de fiscalité proposé. Repères : [S1](#s1). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Faible**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Prix/périmètre acceptés ; taxes ; information et accord avant coût hors périmètre ; nouvelle demande sans prix modifié automatiquement.

#### Texte publié actuel

Les prix et le périmètre des prestations sont ceux du devis accepté. Les taxes sont présentées selon le régime fiscal applicable. Un travail ou un coût externe non compris dans ce périmètre nécessite une information et un accord du Client avant engagement. Une nouvelle demande ne modifie pas, à elle seule, le prix de la prestation déjà convenue.

#### Proposition à examiner — non appliquée

Les prix et les prestations sont ceux du devis accepté. Les taxes sont présentées selon le régime fiscal applicable.

Avant d’engager un travail ou un coût extérieur non compris dans le devis, nous vous en informons et demandons votre accord.

Une nouvelle demande ne modifie pas, à elle seule, le prix de la prestation déjà convenue.


### 11. BASE-RESPONSABILITE — Responsabilités générales — v1

**Origine** : modèle `8a68cdc1-c2e3-49eb-bdef-e3f733ae6c66`, version `848922a2-3391-495a-a45b-4e2ec0cb6f60`, statut `published`.

**1. Utilité** : Décrire les responsabilités sans neutraliser les droits impératifs.

**2. Clarté / défaut** : Réserves répétées dans plusieurs modules ; suppression globale risquée.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Aucun plafond ni transfert automatique à ajouter. Relire l’effet combiné des modules, particulièrement en B2C. Repères : [S9](#s9), [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Obligations propres ; risques connus ; tiers pas exonération ; responsabilités précisées ; garanties et responsabilités imposées préservées.

#### Texte publié actuel

Chaque partie répond des obligations qui lui incombent dans le périmètre convenu. AtoumWeb informe le Client d’un risque ou blocage connu affectant la prestation. La présence d’une dépendance extérieure ne l’exonère pas de ses propres obligations d’intégration ou d’intervention. Les responsabilités sur les contenus, accès, sauvegardes et environnements sont précisées par les clauses applicables. Aucun mécanisme contractuel ne peut écarter une responsabilité ou une garantie que la loi impose.

#### Proposition à examiner — non appliquée

Chacun de nous répond des obligations qui lui reviennent pour les prestations convenues. Nous vous signalons les risques ou blocages dont nous avons connaissance.

Le recours à un prestataire extérieur ne nous dispense pas de nos propres obligations d’intégration ou d’intervention. Les clauses concernées précisent les responsabilités relatives aux contenus, aux accès, aux sauvegardes et à l’environnement technique.

Aucune disposition du contrat ne supprime une responsabilité ou une garantie que la loi impose.


### 12. BASE-VALIDATION — Validation des livrables — v1

**Origine** : modèle `6db92e0b-6a53-4f89-a3b1-0e49202e944f`, version `d3ec4722-6c86-4f35-b827-74b84c682ea9`, statut `published`.

**1. Utilité** : Organiser la vérification explicite des livrables et les réserves.

**2. Clarté / défaut** : Recette et cycles commerciaux peu accessibles ; texte long mais protecteur.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. La validation ne doit pas faire renoncer aux garanties ni consommer les cycles payants pour corriger une erreur de l’agence. Repères : [S3](#s3), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : WEB-VALIDATION : principe commun et application au site.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Vérification du périmètre ; anomalie/évolution ; écrit ; silence non automatique ; non-conformité hors quota ; garanties et recours conservés ; recette sans raccourcir recours.

#### Texte publié actuel

Le Client vérifie les livrables au regard du périmètre convenu et transmet ses demandes de correction selon les modalités de recette indiquées au devis. Un écart à ce périmètre est examiné comme une anomalie ; une nouvelle fonction, un nouveau livrable ou un changement de règle constitue une évolution à convenir séparément. La validation est conservée par écrit. Le silence du Client ne vaut pas automatiquement acceptation.

Les cycles commerciaux de correction sont distincts des reprises nécessaires pour remédier à une non-conformité imputable à AtoumWeb ; ces reprises ne sont pas décomptées comme des demandes nouvelles ou des cycles commerciaux supplémentaires. La validation d’un livrable ne prive pas le Client des recours, responsabilités ou garanties applicables, notamment lorsque la non-conformité porte sur une exigence légale ou une qualité normalement attendue. Un délai de recette ne réduit pas la durée d’un recours légal.

#### Proposition à examiner — non appliquée

Vous vérifiez les livrables par rapport au devis et nous transmettez vos demandes de correction selon les modalités de vérification prévues.

Un écart au périmètre convenu est examiné comme une anomalie. Une nouvelle fonction, un livrable supplémentaire ou un changement de règle est une évolution à convenir séparément. Votre validation est conservée par écrit ; votre silence ne vaut pas automatiquement acceptation.

Les cycles de correction prévus commercialement sont distincts des reprises nécessaires pour corriger une non-conformité qui nous est imputable. Ces reprises ne sont pas comptées comme des demandes nouvelles ou des cycles supplémentaires.

Votre validation ne supprime pas vos recours ni les responsabilités et garanties applicables, notamment lorsqu’une non-conformité concerne une exigence légale ou une qualité normalement attendue. Le délai prévu pour vérifier le livrable ne raccourcit pas un délai de recours légal.


### 13. PRO-LITIGE — Règlement des différends professionnels — v1

**Origine** : modèle `7a6a0c27-b362-4955-83b2-6feed04aa4b6`, version `41256f8c-835f-4722-b22b-5dc8fc7d9439`, statut `published`.

**1. Utilité** : Organiser le traitement des désaccords avec un client professionnel.

**2. Clarté / défaut** : Différend, juridictions et présent module peuvent être simplifiés.

**3. Applicabilité et examen juridique apparent** : Professionnels seulement ; vérifier le contexte réel et les éventuelles protections particulières. Réservée aux professionnels. Ne pas ajouter un tribunal imposé à Dijon ; tout professionnel n’est pas commerçant. Repères : [S11](#s11). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Faible**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Recherche amiable facultative ; écrit ; recours et urgence ; juridictions compétentes sans tribunal territorial imposé.

#### Texte publié actuel

En cas de différend, les parties peuvent rechercher une solution amiable à partir d’une réclamation écrite précisant le problème rencontré. Cette démarche ne prive aucune partie de ses recours ni de la possibilité d’une mesure urgente. À défaut d’accord, le litige relève des juridictions compétentes selon les règles applicables. Aucune juridiction territoriale particulière n’est imposée par le présent module.

#### Proposition à examiner — non appliquée

Si vous êtes un client professionnel, nous pouvons chercher ensemble une solution amiable à partir d’une réclamation écrite décrivant le problème.

Cette démarche n’empêche ni l’un ni l’autre d’exercer ses recours ou de demander une mesure urgente. Si aucun accord n’est trouvé, le litige relève des tribunaux compétents selon les règles applicables. Cette clause n’impose pas de tribunal territorial particulier.


### 14. PRO-PAIEMENT — Délais de règlement B2B — v1

**Origine** : modèle `94b7e810-f816-4d26-8b2f-c4aca9418538`, version `3f57534e-24c2-4cf8-9fb1-47e2387ebe9c`, statut `published`.

**1. Utilité** : Fixer les délais de paiement propres aux professionnels.

**2. Clarté / défaut** : Longue énumération ; risque de lire les plafonds comme des délais automatiquement accordés.

**3. Applicabilité et examen juridique apparent** : Professionnels seulement ; vérifier le contexte réel et les éventuelles protections particulières. Vérifier régime et exceptions ; ne pas transformer un plafond légal en délai accordé. Repères : [S12](#s12). Il ne s’agit pas d’une certification.

**4. Répétitions** : BASE-PAIEMENT / PRO-RETARD : ne pas dupliquer une échéance contradictoire.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Échéances expresses ; pas de délai nouveau par facture ;30j à défaut ; plafonds60j/45jFDM/45j périodiques ; avances/jalons/solde ; vérification sans report automatique ; régimes particuliers.

#### Texte publié actuel

Les sommes dues par le Client professionnel sont payables aux échéances expressément prévues au devis et dans les conditions de règlement. L’émission d’une facture n’accorde aucune facilité de paiement supplémentaire automatique. Un délai particulier peut être accordé s’il est expressément convenu au devis et dans les conditions de règlement, dans les limites légales. À défaut d’accord, le délai du régime général est de trente jours après la réalisation de la prestation. Lorsqu’un délai différent est convenu, il respecte les plafonds légaux : soixante jours après l’émission de la facture ou, si cette modalité est expressément convenue et non abusive, quarante-cinq jours fin de mois. Les factures périodiques suivent leur plafond particulier de quarante-cinq jours après émission. L’échéancier distingue les avances, factures intermédiaires et solde prévus. Une procédure de vérification ou d’acceptation ne décale pas automatiquement le paiement ; sa durée et ses effets sont convenus dans le respect des conditions légales. Les régimes particuliers impératifs éventuellement applicables demeurent réservés.

#### Proposition à examiner — non appliquée

Si vous êtes un client professionnel, vous réglez les sommes dues aux échéances prévues au devis et dans les conditions de règlement. L’émission d’une facture n’accorde pas automatiquement un délai supplémentaire.

Un délai particulier doit être convenu expressément et respecter les limites légales. À défaut d’accord, le délai du régime général est de trente jours après l’exécution de la prestation. Lorsqu’un délai différent est convenu, il ne dépasse pas soixante jours après l’émission de la facture, ou quarante-cinq jours fin de mois si ce choix est expressément prévu et non abusif. Les factures périodiques suivent leur plafond particulier de quarante-cinq jours après émission.

L’échéancier distingue les avances, les paiements intermédiaires et le solde. Une vérification ou une acceptation de la prestation ne reporte pas automatiquement le paiement : sa durée et ses effets doivent être convenus dans les limites légales. Les régimes particuliers obligatoires restent applicables.


### 15. PRO-RETARD — Retard de paiement — v1

**Origine** : modèle `20064c0c-30a5-4dc8-afb7-89eedb20910b`, version `0220659b-61e3-4bcd-854c-da5667e02210`, statut `published`.

**1. Utilité** : Informer sur les conséquences légales du retard professionnel.

**2. Clarté / défaut** : Réserves denses ; procédures collectives peu accessibles.

**3. Applicabilité et examen juridique apparent** : Professionnels seulement ; vérifier le contexte réel et les éventuelles protections particulières. Ne pas substituer BCE+10 au taux contractuel choisi. Ne pas appliquer ces règles aux consommateurs. Repères : [S12](#s12), [S13](#s13). Il ne s’agit pas d’une certification.

**4. Répétitions** : PRO-PAIEMENT : pénalités et recouvrement, pas nouvelle échéance.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : B2B seul ; lendemain échéance sans rappel ;3fois taux légal ; documents requis ;40€ sous conditions ; frais justifiés ; exceptions procédures collectives.

#### Texte publié actuel

Pour un Client professionnel, les pénalités de retard sont dues sans rappel à compter du lendemain de l’échéance de règlement. Le taux contractuel retenu est égal à trois fois le taux d’intérêt légal applicable. Ce taux et les conditions d’application sont indiqués dans les conditions de règlement et sur les documents qui doivent les mentionner. L’indemnité forfaitaire légale de recouvrement de 40 euros est due lorsque ses conditions légales sont réunies. Une indemnisation complémentaire des frais de recouvrement n’est demandée que dans les conditions prévues par la loi et sur justification. Les exceptions légales, notamment liées aux procédures collectives, restent applicables. Ces règles B2B ne sont pas appliquées au Client consommateur.

#### Proposition à examiner — non appliquée

Si vous êtes un client professionnel, des pénalités de retard sont dues dès le lendemain de l’échéance, sans rappel préalable. Le taux retenu au contrat est égal à trois fois le taux d’intérêt légal applicable. Le taux et ses conditions d’application figurent dans les conditions de règlement et sur les documents requis.

L’indemnité forfaitaire légale de recouvrement de 40 euros est due lorsque les conditions légales sont réunies. Des frais complémentaires ne peuvent être demandés que dans les conditions prévues par la loi et sur justification.

Les exceptions légales restent applicables, notamment celles liées aux procédures de sauvegarde, de redressement ou de liquidation judiciaire. Ces dispositions ne s’appliquent pas aux clients consommateurs.


### 16. MAINT-PERIMETRE — Périmètre de maintenance — v1

**Origine** : modèle `d2074275-b9e4-4f78-b59e-567a4cf88fb3`, version `31a0e348-abed-4d60-a58e-25f15c774c8b`, statut `published`.

**1. Utilité** : Distinguer la maintenance des travaux et de la gestion non compris.

**2. Clarté / défaut** : Périmètre actif et intervention commerciale peu parlants.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. La formule ne remplace pas les obligations liées à la création du site. Quotas réels au devis, sans invention. Repères : [S10](#s10), [S14](#s14). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Formule vendue seulement ; préventif/interventions/hors-forfait/évolutions ; garanties/corrections/mises à jour dues préservées.

#### Texte publié actuel

La maintenance couvre uniquement les opérations incluses dans la formule souscrite et précisées au devis.

Sont notamment distingués :
- les opérations de maintenance préventive ;
- les demandes d’intervention incluses ;
- les travaux hors forfait ;
- les évolutions ou refontes qui relèvent d’un devis distinct.

Une intervention commerciale entre dans la formule si elle relève de son périmètre actif. Cette délimitation ne supprime pas les corrections, garanties ou mises à jour qu’AtoumWeb doit déjà fournir en application du contrat ou de la loi.

#### Proposition à examiner — non appliquée

La maintenance comprend les opérations prévues dans la formule que vous avez choisie et décrites au devis.

Nous distinguons les opérations préventives, les interventions comprises dans la formule, les travaux hors forfait et les évolutions ou refontes qui nécessitent un devis distinct.

Une demande entre dans la formule lorsqu’elle correspond au périmètre souscrit. Cette limite ne supprime pas les corrections, garanties ou mises à jour que nous devons déjà fournir au titre du contrat ou de la loi.


### 17. MAINT-MAJ — Mises à jour — v1

**Origine** : modèle `e1a4ba2f-ab73-4855-9d9e-f455a23de594`, version `a30a9329-64ce-4569-b98f-ed011d9b7668`, statut `published`.

**1. Utilité** : Encadrer les mises à jour et le traitement des risques identifiés.

**2. Clarté / défaut** : Jargon et réserves imbriquées ; report technique potentiellement pris pour une dispense.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Distinguer maintenance commerciale et mises à jour nécessaires à la conformité. Repères : [S14](#s14), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Mises à jour incluses ; risque identifié/évaluation ; information risque/mesures/suites ; sécurité et mises à jour dues ; supplément hors obligation avec accord ; tiers sans facturation automatique.

#### Texte publié actuel

AtoumWeb réalise les mises à jour comprises dans la prestation. Une mise à jour présentant un risque identifié de régression, d’incompatibilité ou d’indisponibilité peut être différée le temps d’évaluer une solution adaptée. Le Client est informé du report, du risque connu et des mesures temporaires ou suites proposées. Ce report ne neutralise pas les obligations de sécurité ou de mise à jour applicables. Une adaptation dépassant les travaux déjà dus peut faire l’objet d’un accord complémentaire avant réalisation ; une non-conformité imputable à AtoumWeb ou un correctif légalement dû n’est pas facturé comme un supplément du seul fait de l’intervention d’un composant tiers.

#### Proposition à examiner — non appliquée

Nous réalisons les mises à jour comprises dans votre prestation.

Lorsqu’une mise à jour présente un risque identifié de perturber le fonctionnement du site, de rendre certains éléments incompatibles ou de provoquer une indisponibilité, nous pouvons la reporter le temps d’évaluer une solution adaptée. Nous vous informons du report, du risque connu et des mesures temporaires ou suites proposées.

Ce report ne supprime pas les obligations de sécurité ou de mise à jour qui restent applicables. Une adaptation qui dépasse les travaux déjà dus peut faire l’objet d’un accord complémentaire avant sa réalisation. En revanche, une non-conformité qui nous est imputable ou un correctif légalement dû ne devient pas un supplément facturable du seul fait qu’un composant tiers intervient.


### 18. MAINT-SAUVEGARDE — Sauvegardes — v1

**Origine** : modèle `8a2b1171-d5ad-4933-8f00-694a12de4290`, version `b591b87f-5b31-48d7-b006-7ff068d83efa`, statut `published`.

**1. Utilité** : Décrire la sauvegarde et les conditions de récupération sans garantie absolue.

**2. Clarté / défaut** : Support technique ; fréquence/durée absentes du devis ; conditions de l’hébergeur non précisées.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. La clause ne prouve pas la restauration réelle. Ne pas inventer rétention, redondance ou délai de reprise ; vérifier les conditions de tiers remises au client. Repères : [S2](#s2), [S8](#s8). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Sauvegarde si incluse ; dispositif prévu ; fréquence/rétention/support de l’offre ou solution ; conditions du fournisseur tiers.

#### Texte publié actuel

Lorsque la sauvegarde est incluse, AtoumWeb met en œuvre le dispositif prévu dans la formule souscrite.

La fréquence, la durée de conservation et le support de stockage sont ceux prévus au devis ou par la solution technique utilisée.

Les sauvegardes fournies par l’hébergeur ou un service tiers restent soumises aux conditions de ce prestataire.

#### Proposition à examiner — non appliquée

Si les sauvegardes sont incluses dans votre formule, nous mettons en place le dispositif prévu.

Le devis ou la solution technique utilisée précise leur fréquence, leur durée de conservation et leur emplacement de stockage.

Lorsque les sauvegardes sont fournies par l’hébergeur ou un autre prestataire, les conditions de ce service s’appliquent.


### 19. MAINT-INTERVENTIONS — Nombre d’interventions ou temps inclus — v1

**Origine** : modèle `9d7f360c-c4cf-43ff-93bc-c03d4f2beab6`, version `bdec7b68-1023-4c6e-a539-4a0ca2f26539`, statut `published`.

**1. Utilité** : Délimiter les demandes et interventions comprises dans le forfait.

**2. Clarté / défaut** : Stock d’heures et demandes commerciales ; mensuel dans une offre facturée annuellement.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas transformer quatre interventions mensuelles de30minutes maximum en réserve libre de deux heures ou en crédit annuel. Repères : [S3](#s3), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Quota précisé ; abonnement global ; pas banque d’heures ; non-report mensuel ; supplément accepté ; garanties hors quota ; recours inexécution conservés.

#### Texte publié actuel

La formule mensuelle peut inclure le nombre de petites interventions précisé au devis. Ces interventions font partie d’un abonnement global comprenant les opérations de maintenance, mises à jour, sauvegardes et suivi prévues ; elles ne constituent pas un stock d’heures. Les interventions non utilisées au cours d’un mois ne sont pas reportables au mois suivant. Une demande dépassant le nombre ou le périmètre convenu est chiffrée et acceptée avant réalisation. Les travaux déjà dus au titre d’une garantie ou d’une obligation distincte ne sont pas décomptés comme des demandes commerciales supplémentaires. L’absence de report ne prive pas le Client de ses droits en cas d’inexécution imputable à AtoumWeb ni des droits impératifs applicables.

#### Proposition à examiner — non appliquée

Le devis précise le nombre de petites interventions comprises par mois dans la formule. Elles font partie de l’abonnement global, avec les opérations de maintenance, de mise à jour, de sauvegarde et de suivi prévues ; elles ne constituent pas une réserve d’heures.

Les interventions non utilisées pendant un mois ne sont pas reportées au mois suivant. Une demande qui dépasse le nombre d’interventions ou le périmètre convenu est chiffrée et acceptée avant sa réalisation.

Les travaux que nous devons déjà au titre d’une garantie ou d’une obligation distincte ne sont pas déduits de ces interventions. L’absence de report ne supprime ni vos droits en cas de manquement qui nous est imputable ni les droits que la loi vous accorde.


### 20. MAINT-URGENCE — Incident urgent — v1

**Origine** : modèle `f2b47143-1edc-4ce6-9f07-a09eb6c70c6a`, version `e3e0e595-e1a7-42ae-bd95-e3e07885026f`, statut `published`.

**1. Utilité** : Distinguer prise en charge, urgence et délai de résolution.

**2. Clarté / défaut** : Plages commerciales et origine extérieure ; prise en charge et résolution à distinguer.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas promettre une résolution en un jour. Vérifier horaires et gestion réelle des violations de données. Repères : [S8](#s8), [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Modalités/plages convenues ; pas de temps inférieur promis ; diagnostic selon informations ; hors-travaux dus seulement avec accord ; piratage sans exonération ; obligations violations de données distinctes.

#### Texte publié actuel

Une demande urgente est traitée selon les modalités et plages de prise en charge prévues dans l’offre souscrite.

AtoumWeb ne garantit pas un délai d’intervention inférieur à celui expressément convenu.

Le diagnostic précise, dans la mesure des informations disponibles, la cause de l’incident et les obligations de prise en charge. Seuls les travaux qui dépassent les interventions déjà dues peuvent faire l’objet d’un complément soumis à l’accord du Client. Un piratage ou une origine extérieure n’exonère pas automatiquement AtoumWeb d’une faute qui lui est imputable. Les obligations légales de traitement et de notification d’une violation de données demeurent distinctes des plages commerciales d’intervention.

#### Proposition à examiner — non appliquée

Nous traitons les demandes urgentes selon les modalités et les horaires de prise en charge prévus dans votre offre. Nous ne garantissons pas un délai d’intervention plus court que celui convenu.

Avec les informations disponibles, le diagnostic précise la cause de l’incident et ce qui relève de notre prise en charge. Seuls les travaux qui dépassent les interventions déjà dues peuvent faire l’objet d’un complément soumis à votre accord.

Un piratage ou un incident venant d’un service extérieur ne nous dégage pas automatiquement d’une faute qui nous est imputable. Les obligations légales de traitement et de notification d’une violation de données restent distinctes des horaires d’intervention prévus commercialement.


### 21. MAINT-RENOUVELLEMENT — Durée et renouvellement — v1

**Origine** : modèle `644f39e7-1afc-4b86-b13a-0464fa3b4c31`, version `4fc51007-43bc-4146-ac45-354324a0af54`, statut `published`.

**1. Utilité** : Définir la durée, le renouvellement et la sortie du service.

**2. Clarté / défaut** : Durée et facturation mélangées ; doublon avec hébergement.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas ajouter de reconduction tacite annuelle. Vérifier le droit de résiliation électronique selon le contrat réel. Repères : [S15](#s15). Il ne s’agit pas d’une certification.

**4. Répétitions** : WEB-HEBERGEMENT : abonnements et sortie à coordonner sans les confondre.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Durée/facturation/résiliation ; mensuel mois par mois ; annuel accord exprès ; information préalable ; résiliation électronique si requise ; pas modification unilatérale par simple avis ; restitution/fin.

#### Texte publié actuel

Le devis précise la durée, la périodicité de facturation et les conditions de résiliation de la formule. Un abonnement mensuel se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les offres annuelles, notamment maintenance annuelle, hébergement et domaine, sont renouvelées par accord exprès ; aucune reconduction annuelle tacite ne s’applique par défaut. Les conditions de poursuite et de fin de service sont communiquées avant acceptation. Les obligations légales d’information et de résiliation, notamment par voie électronique lorsqu’elle est requise, restent applicables selon le contrat réel et l’audience concernée. Un changement de formule, de périmètre ou de prix ne s’applique que selon les conditions valablement convenues et les dispositions impératives ; sa simple notification ne vaut pas autorisation de toute modification. La restitution et la fin du service suivent les dispositions contractuelles et légales applicables.

#### Proposition à examiner — non appliquée

Le devis précise la durée de votre formule, sa périodicité de facturation et ses conditions de résiliation.

Un abonnement mensuel se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les offres annuelles, notamment la maintenance annuelle, l’hébergement et le domaine, sont renouvelées par accord exprès : elles ne sont pas reconduites tacitement par défaut.

Nous vous communiquons les conditions de poursuite et de fin du service avant votre acceptation. Les obligations légales d’information et de résiliation, notamment par voie électronique lorsqu’elle est requise, restent applicables selon le contrat et la catégorie de client.

Un changement de formule, de périmètre ou de prix ne s’applique que dans les conditions valablement convenues et dans le respect de la loi. Le simple envoi d’une information ne suffit pas à autoriser toute modification. La restitution et la fin du service suivent les conditions contractuelles et légales applicables.


### 22. MAINT-WOOCOMMERCE — Périmètre spécifique WooCommerce — v1

**Origine** : modèle `5b27ae5b-5f46-49f9-937a-46a9354c9156`, version `a74f140b-a1f4-44b6-b2a8-44259c9875f8`, statut `published`.

**1. Utilité** : Traiter les dépendances propres à une boutique maintenue.

**2. Clarté / défaut** : WooCommerce à expliquer ; réserves répétées sur les mises à jour.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas retirer les réserves comme de simples doublons ; pas d’exonération générale pour extensions tierces. Repères : [S10](#s10), [S14](#s14). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Boutique/outils identifiés ; pas gestion produits/stocks/commandes/remboursements/SAV sauf vente ; report évalué/informé ; complément accepté ; garanties/sécurité/corrections/mises à jour dues.

#### Texte publié actuel

La maintenance WooCommerce couvre uniquement les opérations prévues au devis sur la boutique, WooCommerce et les extensions expressément identifiées. Elle n’inclut pas la gestion quotidienne du catalogue, des stocks, des commandes, des remboursements ou du service client, sauf prestation distincte. Une mise à jour présentant un risque identifié pour la boutique ou une intégration critique peut être différée le temps d’évaluer une solution adaptée. Lorsque ce report est nécessaire, le Client en est informé. Les travaux qui dépassent les obligations déjà dues peuvent faire l’objet d’un complément accepté avant réalisation. L’origine extérieure d’une difficulté ne neutralise pas les garanties, obligations de sécurité, corrections ou mises à jour applicables à AtoumWeb.

#### Proposition à examiner — non appliquée

La maintenance de votre boutique WooCommerce porte sur les opérations décrites au devis, pour la boutique, son outil de vente en ligne et les extensions expressément identifiées.

Elle ne comprend pas la gestion quotidienne des produits, des stocks, des commandes, des remboursements ou du service client, sauf prestation distincte.

Si une mise à jour présente un risque identifié pour la boutique ou pour une connexion technique importante, nous pouvons la reporter le temps d’évaluer une solution adaptée. Nous vous en informons lorsque ce report est nécessaire.

Les travaux qui dépassent nos obligations déjà dues peuvent faire l’objet d’un complément accepté avant leur réalisation. Une difficulté venant d’un tiers ne supprime pas les garanties, obligations de sécurité, corrections ou mises à jour qui nous incombent.


### 23. WEB-CONTENUS — Fourniture des contenus — v1

**Origine** : modèle `0013a2be-afc8-41c3-a625-bb2bde885550`, version `b7f9e1a3-3ca6-4d6a-b5ca-a5058f1cf661`, statut `published`.

**1. Utilité** : Préciser qui fournit et contrôle les contenus du site.

**2. Clarté / défaut** : Listes répétées avec coopération/produits ; replanification administratif.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Le client reste responsable du contenu sans libérer l’agence de ses propres obligations. Repères : [S2](#s2), [S7](#s7). Il ne s’agit pas d’une certification.

**4. Répétitions** : BASE-PI : contribution du client, pas cession de nos créations.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Éléments dans délais ; droits/exactitude/conformité client ; tâches réellement affectées ; causalité/obligations respectives ; pas exonération ; rédaction/images seulement si vendues.

#### Texte publié actuel

Le Client fournit à AtoumWeb, dans les délais convenus, l’ensemble des éléments nécessaires à la réalisation de la prestation : textes, images, logos, coordonnées, mentions obligatoires, accès techniques et toute autre information utile au projet.

Le Client garantit disposer des droits nécessaires sur les éléments qu’il transmet à AtoumWeb et reste responsable de leur contenu, de leur exactitude et de leur conformité.

Lorsqu’un contenu nécessaire manque ou arrive tardivement, AtoumWeb informe le Client des tâches effectivement affectées et de l’incidence prévisible sur le planning. La replanification tient compte du lien réel avec ce manque et des obligations de chaque partie. Un contenu incomplet ou tardif n’exonère pas automatiquement AtoumWeb d’un retard et ne supprime pas les droits légaux du Client.

Les prestations de rédaction, de recherche iconographique ou de création de contenus ne sont incluses que lorsqu’elles figurent expressément au devis.

#### Proposition à examiner — non appliquée

Vous nous fournissez dans les délais convenus les éléments nécessaires au projet : textes, images, logos, coordonnées, mentions obligatoires, accès techniques et autres informations utiles.

Vous devez disposer des droits nécessaires sur les éléments transmis et restez responsable de leur contenu, de leur exactitude et de leur conformité.

Si un contenu manque ou arrive en retard, nous vous indiquons les tâches réellement concernées et les conséquences prévisibles sur le planning. Le calendrier est réexaminé en tenant compte de ce manque et des obligations de chacun. Ce retard ne nous exonère pas automatiquement de nos propres engagements et ne supprime pas vos droits légaux.

La rédaction, la recherche d’images et la création de contenus sont incluses uniquement si elles figurent expressément au devis.


### 24. WEB-AR — Corrections et allers-retours — v1

**Origine** : modèle `525fc489-5606-4e64-a408-0f85e7e9e49c`, version `e15ea54a-7769-4ac4-930d-d38b9a96a902`, statut `published`.

**1. Utilité** : Encadrer les cycles de retours et les demandes dépassant le périmètre.

**2. Clarté / défaut** : Une correction pourrait être confondue avec une non-conformité à facturer ; répétition avec validation.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Lire avec BASE-VALIDATION/BASE-PRIX : accord avant supplément et non-conformités dues hors quota ; pas de fusion automatique. Repères : [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Phases convenues ; ajustement dans périmètre ; demandes nouvelles et devis complémentaire ; retours groupés autant que possible.

#### Texte publié actuel

La prestation comprend les phases de correction et de validation prévues au devis.

Une correction correspond à l’ajustement d’un élément déjà prévu dans le périmètre initial. Toute demande ajoutant une fonctionnalité, une page, un contenu, une intégration ou une modification substantielle non prévue au devis peut faire l’objet d’un complément de prix ou d’un nouveau devis.

Le Client s’engage à regrouper autant que possible ses retours afin d’éviter des cycles de corrections successifs inutiles.

#### Proposition à examiner — non appliquée

La prestation comprend les étapes de correction et de validation prévues au devis.

Une correction ajuste un élément déjà compris dans le projet initial. Une demande qui ajoute une fonction, une page, un contenu, une connexion à un autre outil ou une modification importante non prévue peut faire l’objet d’un complément de prix ou d’un nouveau devis.

Vous vous engagez à regrouper vos retours autant que possible pour éviter des séries de corrections successives inutiles.


### 25. WEB-VALIDATION — Validation avant mise en ligne — v1

**Origine** : modèle `d06b8c2c-e49c-44c6-9116-057da3479697`, version `2b5cd786-76cb-4b73-b04c-b318d0ae2669`, statut `published`.

**1. Utilité** : Appliquer la procédure de validation à la livraison d’un site.

**2. Clarté / défaut** : Code interne BASE-VALIDATION visible ; vocabulaire technique.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Remplacer le code par le titre de la clause, sans supprimer son renvoi ni faire renoncer aux garanties. Repères : [S3](#s3), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : BASE-VALIDATION : remplacer le code visible par le titre, conserver les recours.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Présentation avant mise en ligne ; vérifications client ; validation explicite écrite ; renvoi substantiel au socle ; mise en ligne convenue ; modifications hors anomalies.

#### Texte publié actuel

Avant mise en ligne, AtoumWeb présente au Client la version du site destinée à validation.

Le Client vérifie notamment les contenus, coordonnées, liens, formulaires, informations légales et éléments visuels relevant de son activité.

La validation du Client est explicite et conservée sur un support écrit conformément à BASE-VALIDATION. La mise en ligne suit cette validation et les modalités de déploiement convenues au devis.

Toute modification demandée après validation finale peut être traitée comme une prestation complémentaire, sauf si elle correspond à la correction d’une anomalie relevant directement de la prestation convenue.

#### Proposition à examiner — non appliquée

Avant la mise en ligne, nous vous présentons la version du site à valider.

Vous vérifiez notamment les contenus, les coordonnées, les liens, les formulaires, les informations légales et les éléments visuels liés à votre activité.

Votre validation doit être explicite et conservée par écrit, selon les conditions prévues dans la clause « Validation des livrables » des conditions générales communes. La mise en ligne intervient ensuite selon les modalités convenues au devis.

Une modification demandée après la validation finale peut être traitée comme une prestation complémentaire, sauf si elle corrige une anomalie relevant directement de la prestation convenue.


### 26. WEB-MISE-EN-LIGNE — Mise en ligne et environnement technique — v1

**Origine** : modèle `d02facb7-1dc1-4dc1-add6-0907b7c5b0cb`, version `905cbe51-c69b-4b14-9db1-aa1fb48b7210`, statut `published`.

**1. Utilité** : Identifier les prérequis techniques et décisions de publication du site.

**2. Clarté / défaut** : Intégration et origine extérieure abstraites.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas remplacer par une irresponsabilité générale pour tout hébergeur externe. Repères : [S3](#s3). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Accès/hébergement/domaine/tiers nécessaires ; préparation et obligations propres ; causalité/rôle du tiers ; pas exonération ; information.

#### Texte publié actuel

La mise en ligne suppose que les accès techniques nécessaires aient été fournis et que l’hébergement, le nom de domaine et les services tiers requis soient opérationnels.

La présence d’un service tiers ne dispense pas AtoumWeb de ses obligations de préparation, d’intégration et d’intervention prévues au contrat. Les conséquences d’un blocage sont appréciées selon sa cause, le rôle du tiers et les règles de responsabilité applicables. Aucune exonération ne résulte automatiquement de l’origine extérieure de l’incident.

AtoumWeb informe le Client lorsqu’un blocage externe empêche ou retarde la mise en ligne.

#### Proposition à examiner — non appliquée

Pour mettre le site en ligne, nous devons disposer des accès nécessaires. L’hébergement, le nom de domaine et les services extérieurs requis doivent également être opérationnels.

Le recours à un service extérieur ne nous dispense pas des travaux de préparation, de connexion et d’intervention prévus au contrat. Les conséquences d’un blocage dépendent de sa cause, du rôle du prestataire concerné et des règles de responsabilité applicables. Son origine extérieure ne nous exonère pas automatiquement.

Nous vous informons lorsqu’un tel blocage empêche ou retarde la mise en ligne.


### 27. WEB-HEBERGEMENT — Hébergement et nom de domaine — v1

**Origine** : modèle `1e1bc2d3-453c-4300-9dc7-f4922b682f71`, version `e850fb05-ec44-4d28-8c3e-2350ab431360`, statut `published`.

**1. Utilité** : Définir l’hébergement inclus, les dépendances et la fin de service.

**2. Clarté / défaut** : Trois sujets dans un long paragraphe ; fournisseur/transfert incomplets dans le dossier.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas convertir un an offert en abonnement automatique. Identifier les conditions de récupération réelles sans inventer de délai. Repères : [S15](#s15), [S8](#s8). Il ne s’agit pas d’une certification.

**4. Répétitions** : MAINT-RENOUVELLEMENT / SERVICE-TIERS : service hébergé, données et sortie spécifiques.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Fournisseur/périmètre/durée/coûts ; titulaire et accès domaine ; pas propriété agence ; renouvellement annuel exprès/mensuel continu ; prix ; limites non exonératoires ; export/transfert ; migration complexe acceptée ; suppression et archives.

#### Texte publié actuel

Lorsque l’hébergement ou le nom de domaine est inclus dans une prestation Web, le devis indique le fournisseur, le périmètre, la durée, les coûts inclus et les conditions de poursuite du service. Le titulaire du nom de domaine et les modalités d’accès à sa gestion sont identifiés explicitement ; l’intervention technique d’AtoumWeb ne lui transfère pas la propriété du domaine. Les engagements annuels d’hébergement ou de domaine sont renouvelés par accord exprès, sans reconduction annuelle tacite par défaut. Une prestation mensuelle expressément souscrite se poursuit de mois en mois jusqu’à résiliation selon les conditions convenues. Tout changement de prix respecte les modalités acceptées et les règles applicables, sans modification automatique d’un engagement en cours. Les limites pertinentes du fournisseur sont communiquées au Client et ne dispensent pas AtoumWeb de ses propres obligations. La fin de service est organisée avec une période de récupération, d’export ou de transfert précisée au devis. Une migration ou reconstruction complexe nécessite un accord complémentaire si elle dépasse le périmètre convenu. Les données devenues inutiles sont supprimées selon les règles applicables ; sauvegardes et archives légalement ou légitimement conservées suivent leurs durées propres.

#### Proposition à examiner — non appliquée

Si l’hébergement ou le nom de domaine est compris dans votre prestation, le devis précise le fournisseur, les services couverts, leur durée, les coûts inclus et les conditions de poursuite.

Le titulaire du domaine et les accès permettant de le gérer sont identifiés explicitement. Notre intervention technique ne nous rend pas propriétaires de votre domaine.

Les engagements annuels d’hébergement ou de domaine sont renouvelés par accord exprès, sans reconduction annuelle tacite par défaut. Une prestation mensuelle expressément souscrite se poursuit de mois en mois jusqu’à sa résiliation selon les conditions convenues. Les changements de prix respectent les conditions acceptées et la loi ; ils ne modifient pas automatiquement un engagement en cours.

Nous vous communiquons les limites utiles du fournisseur. Elles ne nous dispensent pas de nos propres obligations.

Le devis prévoit la période permettant de récupérer, d’exporter ou de transférer les éléments à la fin du service. Une migration ou une reconstruction complexe nécessite un accord complémentaire si elle dépasse le périmètre convenu. Les données devenues inutiles sont supprimées selon les règles applicables ; les sauvegardes et archives conservées légalement ou légitimement suivent leurs durées propres.


### 28. WEB-LICENCES — Thèmes, extensions, polices et services tiers — v1

**Origine** : modèle `acd17b44-1d24-4d1b-ba68-47334455202a`, version `0d67e6e1-40bf-413e-9748-ea398c3a0331`, statut `published`.

**1. Utilité** : Identifier les licences et les coûts ou changements des outils tiers.

**2. Clarté / défaut** : Énumération technique ; peut rester à charge ne tranche pas les coûts réels.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Identifier les licences/comptes réellement vendus ; aucune obligation due supprimée par l’arrêt d’un abonnement. Repères : [S7](#s7), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : BASE-PI / SERVICE-TIERS : licences des éditeurs, coûts et pérennité.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Outils tiers ; licences incluses identifiées ; renouvellement client possible ; adaptation selon contrat/cause/loi ; hors travaux dus et accord.

#### Texte publié actuel

Le site peut utiliser des composants tiers tels que WordPress, Divi, extensions, bibliothèques, services externes, polices ou outils de mesure.

Les licences incluses dans la prestation sont précisées au devis. Lorsqu’un abonnement tiers est nécessaire au maintien d’une fonctionnalité, son renouvellement peut rester à la charge du Client.

Une modification, une suppression ou un arrêt d’un service tiers peut nécessiter une adaptation. Sa prise en charge est déterminée selon le contrat, la cause du changement et les obligations légales applicables. Seuls les travaux qui ne sont pas déjà dus peuvent faire l’objet d’une prestation complémentaire acceptée par le Client.

#### Proposition à examiner — non appliquée

Votre site peut utiliser des outils fournis par d’autres éditeurs : WordPress, thèmes comme Divi, extensions, polices, bibliothèques de code, services externes ou outils de mesure.

Le devis précise les licences comprises dans la prestation. Si une fonction dépend d’un abonnement tiers, son renouvellement peut rester à votre charge.

Si un service tiers change, disparaît ou s’arrête, une adaptation peut être nécessaire. Sa prise en charge dépend du contrat, de la cause du changement et des obligations légales applicables. Seuls les travaux qui ne sont pas déjà dus peuvent faire l’objet d’une prestation complémentaire que vous acceptez.


### 29. WEB-COMPATIBILITE — Compatibilité — v1

**Origine** : modèle `fd48f5fd-9469-46f5-9a82-6f5e6543dde5`, version `48f8a75d-a6c0-4ed5-957e-da4299b10518`, statut `published`.

**1. Utilité** : Définir les environnements couverts sans exclure les garanties dues.

**2. Clarté / défaut** : Terminaux/environnements ; pas de liste effectivement convenue.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Les limites ne doivent pas contredire les qualités normalement attendues ou les informations précontractuelles. Repères : [S2](#s2), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Liste préalable ; vérification ; pas tous anciens/futurs ; adaptation hors cadre acceptée ; non-conformités/mises à jour/garanties maintenues.

#### Texte publié actuel

Les navigateurs, terminaux et environnements pris en charge sont décrits au devis ou dans une annexe communiquée avant l’acceptation. AtoumWeb vérifie la livraison dans ce périmètre. Aucune prise en charge illimitée de tous les environnements anciens, non maintenus ou futurs n’est promise. Une adaptation extérieure aux engagements convenus peut relever d’une maintenance ou d’une prestation complémentaire acceptée. Cette limite ne dispense pas AtoumWeb de corriger une non-conformité imputable à sa prestation ni de fournir les mises à jour ou garanties légalement dues.

#### Proposition à examiner — non appliquée

Le devis ou une annexe remise avant votre acceptation précise les navigateurs, appareils et environnements pris en charge. Nous vérifions le livrable dans ce cadre.

Nous ne promettons pas une compatibilité illimitée avec tous les environnements anciens, abandonnés ou futurs. Une adaptation qui dépasse les engagements convenus peut relever d’une maintenance ou d’une prestation complémentaire acceptée.

Cette limite ne nous dispense pas de corriger une non-conformité qui nous est imputable ni de fournir les mises à jour ou garanties légalement dues.


### 30. ECOM-CATALOGUE — Données produits — v1

**Origine** : modèle `ad40da25-0ba4-4a2e-ab7e-fa1a2e6cb7e6`, version `10d96807-2d11-4846-99d2-e5240223d9a7`, statut `published`.

**1. Utilité** : Délimiter la fourniture et l’intégration des données produits.

**2. Clarté / défaut** : Liste technique et responsabilité peu incarnée.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Distinguer fourniture des données et qualité de leur intégration, qui reste notre obligation. Repères : [S2](#s2). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Données complètes et exactes fournies par le client ; actualisation hors prestation ; import massif expressément vendu.

#### Texte publié actuel

Le Client fournit les informations nécessaires à la création ou à l’intégration de son catalogue : noms, descriptions, prix, taux de TVA, références, variantes, stocks, poids, dimensions, photos et toute autre donnée nécessaire.

Le Client reste responsable de l’exactitude de ces informations et de leur mise à jour lorsque celle-ci n’est pas incluse dans la prestation.

L’intégration massive ou la reprise d’un catalogue existant n’est comprise que si elle est expressément prévue au devis.

#### Proposition à examiner — non appliquée

Vous nous fournissez les données nécessaires à votre catalogue : noms, descriptions, prix, taux de TVA, références, variantes, quantités disponibles, poids, dimensions, photos et autres informations utiles.

Vous êtes responsable de leur exactitude. Leur mise à jour vous revient lorsqu’elle ne fait pas partie de notre prestation.

L’import de produits en nombre ou la reprise d’un catalogue existant est compris uniquement si le devis le prévoit expressément.


### 31. ECOM-PAIEMENT — Solution de paiement — v1

**Origine** : modèle `0ef2cf48-a635-4bb6-97a9-d350720e0b2b`, version `ff9d3988-ae6a-4a5a-8949-964093fe563d`, statut `published`.

**1. Utilité** : Distinguer intégration du paiement et décisions de son opérateur.

**2. Clarté / défaut** : Explications abstraites sur les dépendances et l’exonération.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas transformer la dépendance technique en transfert général de responsabilité. Repères : [S9](#s9), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Compte compatible, vérification, commissions et décisions du tiers ; bonne intégration et responsabilité propre ; pas d’exonération automatique.

#### Texte publié actuel

Lorsque le site intègre une solution de paiement tierce, le Client doit disposer d’un compte compatible et satisfaire aux exigences de vérification du prestataire concerné.

Le prestataire de paiement détermine ses commissions, ses vérifications et ses décisions relatives au compte selon ses propres conditions. Cette répartition ne dispense pas AtoumWeb de la bonne exécution de l’intégration convenue ni de sa responsabilité pour une erreur qui lui est imputable. Un incident externe n’entraîne pas automatiquement une exonération de responsabilité.

AtoumWeb intervient sur l’intégration technique dans le périmètre défini au devis.

#### Proposition à examiner — non appliquée

Pour utiliser une solution de paiement externe, vous devez disposer d’un compte compatible et satisfaire aux vérifications demandées par son opérateur.

Cet opérateur fixe ses commissions et prend les décisions concernant votre compte selon ses propres conditions.

Nous réalisons l’intégration technique prévue au devis et restons responsables de sa bonne exécution et des erreurs qui nous sont imputables. Un incident chez l’opérateur ne nous dégage pas automatiquement de nos responsabilités.


### 32. ECOM-LIVRAISON — Livraison et transporteurs — v1

**Origine** : modèle `46ca5374-4a0e-48cd-8600-cb99040e3195`, version `696d220e-89e5-4f14-aa79-1e40d47f1bc2`, statut `published`.

**1. Utilité** : Préciser qui définit les règles de livraison configurées.

**2. Clarté / défaut** : Schéma de livraison et règles complexes peu concrets.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Lire les compléments avec les règles d’accord préalable du prix ; aucune facturation automatique. Repères : [S2](#s2). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Informations du client ; dépendance transporteurs/modules ; évolution ou complexité peut nécessiter complément.

#### Texte publié actuel

Les règles de livraison, tarifs, zones desservies, seuils de gratuité, délais annoncés et modalités de retrait sont définis à partir des informations fournies par le Client.

Le fonctionnement des services de transporteurs et de leurs modules dépend de prestataires tiers.

Toute règle complexe ou évolution ultérieure du schéma de livraison peut nécessiter une prestation complémentaire.

#### Proposition à examiner — non appliquée

Nous configurons les tarifs de livraison, zones desservies, seuils de gratuité, délais annoncés et modalités de retrait à partir des informations que vous nous fournissez.

Les services des transporteurs et leurs modules dépendent de prestataires externes.

Des règles de livraison complexes ou une modification ultérieure de l’organisation prévue peuvent nécessiter une prestation complémentaire.


### 33. ECOM-STOCK — Stock et données catalogue — v1

**Origine** : modèle `0bebc656-c84b-40b4-9150-b8dfa25a970a`, version `898546ab-fe95-488a-a4fa-03304b53438c`, statut `published`.

**1. Utilité** : Distinguer configuration du stock et gestion quotidienne.

**2. Clarté / défaut** : Automatisation et flux peu accessibles.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Ne pas exonérer une erreur de configuration propre ni confondre maintenance et gestion du commerce. Repères : [S2](#s2), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Configuration vendue ; données validées par client ; limites des sources externes ; accord complémentaire ; absence de gestion quotidienne sauf vente explicite.

#### Texte publié actuel

La prestation couvre la configuration du suivi de stock décrite au devis. Le Client fournit et valide les quantités, règles de disponibilité et informations nécessaires à leur exploitation. Lorsqu’une synchronisation dépend d’un outil, d’un flux ou d’un service externe, son fonctionnement reste soumis aux limites de cette source. Toute règle de stock ou automatisation non prévue au devis nécessite un accord complémentaire. Sauf prestation de gestion ou de synchronisation expressément prévue au devis, AtoumWeb n’assure pas la mise à jour courante des quantités de stock après la livraison de la boutique.

#### Proposition à examiner — non appliquée

Nous configurons le suivi des stocks prévu au devis. Vous fournissez et validez les quantités, les règles de disponibilité et les informations nécessaires à son utilisation.

Si les stocks sont synchronisés avec un autre outil ou service, cette synchronisation dépend aussi des possibilités et limites de cette source.

Une règle de stock ou une automatisation non prévue au devis nécessite un accord complémentaire. Après la livraison de la boutique, nous ne mettons pas à jour les quantités au quotidien, sauf si une prestation de gestion ou de synchronisation est expressément prévue au devis.


### 34. ECOM-LEGAL — Contenus juridiques du marchand — v1

**Origine** : modèle `51893d2d-7837-433b-ac91-552d489f63bb`, version `d174ac10-c5c4-462e-bce8-e6f0badf7fc5`, statut `published`.

**1. Utilité** : Identifier la responsabilité des textes juridiques du commerçant.

**2. Clarté / défaut** : Risque de confondre les CGV du marchand et celles d’AtoumWeb.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. La clause ne supprime pas les obligations propres de conseil et de bonne intégration ; elle ne certifie aucun texte. Repères : [S2](#s2), [S9](#s9). Il ne s’agit pas d’une certification.

**4. Répétitions** : WEB-CONTENUS : textes juridiques du marchand distincts des CGV AtoumWeb.

**5. Risque de reformulation** : **Élevé**. Validation externe : **Prioritaire avant adoption**.

**À conserver** : Responsabilité des textes marchands ; livraison/retours/remboursements/informations produits ; intégration technique ; absence de validation juridique.

#### Texte publié actuel

Le Client reste responsable des contenus juridiques propres à son activité marchande, notamment ses conditions générales de vente aux consommateurs, ses modalités de livraison, de retour, de remboursement et les informations obligatoires liées aux produits qu’il commercialise.

AtoumWeb peut intégrer techniquement les textes fournis par le Client ou son conseil, mais cette intégration ne vaut pas validation juridique du contenu transmis.

#### Proposition à examiner — non appliquée

Vous êtes responsable des textes juridiques liés à votre activité de commerçant : notamment vos conditions générales de vente aux consommateurs, vos règles de livraison, de retour et de remboursement, ainsi que les informations obligatoires sur vos produits.

Nous pouvons intégrer les textes que vous ou votre conseil nous fournissez. Cette intervention technique ne constitue pas une validation juridique de leur contenu.


### 35. SERVICE-TIERS — Dépendances et coûts de services tiers — v1

**Origine** : modèle `cf50d75f-5d92-4100-a688-e555d076d972`, version `2b306910-f00e-439f-8f97-e4f95b6b4c2f`, statut `published`.

**1. Utilité** : Décrire les dépendances externes, coûts et blocages connus.

**2. Clarté / défaut** : Accumulation de termes et possibilité d’adaptation peu lisible.

**3. Applicabilité et examen juridique apparent** : Professionnels et consommateurs selon les prestations vendues ; les règles impératives et la qualification réelle restent à vérifier. Aucune solution alternative gratuite ou garantie ajoutée ; conserver les responsabilités propres dans les autres clauses. Repères : [S9](#s9), [S10](#s10). Il ne s’agit pas d’une certification.

**4. Répétitions** : Réserves communes possibles avec les clauses socle ou les dépendances tierces ; conserver le détail propre à ce module, sans fusion automatique.

**5. Risque de reformulation** : **Modéré**. Validation externe : **Recommandée dans la revue d’ensemble**.

**À conserver** : Conditions/disponibilité des tiers ; coûts inclus uniquement au devis ; information sur blocage connu ; alternative seulement si possible.

#### Texte publié actuel

Lorsque la prestation dépend d’un service, logiciel, hébergeur, API ou fournisseur tiers, son fonctionnement reste soumis aux conditions et disponibilités de ce tiers. Les abonnements, licences, commissions ou frais externes ne sont inclus que s’ils figurent au devis. AtoumWeb informe le Client lorsqu’il a connaissance d’un blocage affectant la prestation et peut proposer, lorsque cela est techniquement et commercialement possible, une adaptation ou une solution alternative.

#### Proposition à examiner — non appliquée

Si notre prestation utilise un logiciel, un hébergeur, une connexion à un service externe ou un autre fournisseur, elle dépend aussi des conditions et de la disponibilité de ce service.

Les abonnements, licences, commissions et autres frais externes sont compris uniquement s’ils figurent au devis.

Lorsque nous avons connaissance d’un blocage qui affecte notre prestation, nous vous en informons. Nous pouvons proposer une adaptation ou une autre solution lorsque cela est techniquement et commercialement possible.


## Phase B proposée — après examen de cet audit

1. Corriger la provenance des descriptions commerciales et les abréviations dans de nouvelles versions du Catalogue ; préserver les textes locaux et snapshots existants. Classer les champs incomplets par obligation réelle.
2. Préparer des versions contractuelles brouillon uniquement pour les textes retenus. Comparer intégralement chaque version et faire valider les points sensibles. Publication et adoption au devis restent des décisions séparées.
3. Corriger les inférences de faits vendus et la présentation des engagements par ligne ; ne pas créer de valeur juridique par défaut.
4. Vérifier sur fixtures vitrine, e-commerce avec maintenance, prestation ponctuelle et consommateur ; ajouter un cas professionnel protégé hors établissement et un historique figé. Contrôler audience, liens, prix/quantités/statuts, dates, droits de modification et absence d’adoption à l’ouverture.
5. Tester TypeScript et suites métier pertinentes aux seuls changements ; exporter et inspecter chaque page des PDF avant/après, titres non orphelins, clauses intégrales, signature commune, montants identiques. Aucun nouveau PDF ni exécutable produit en phase A.

## Vérification de la phase A

35 propositions uniques, chacune reliée à un code et un identifiant de version publié ; texte original et réécriture conservés intégralement. Inventaire 118 versions / 13 types séparé. Vérification d’extraction du PDF consignée dans `verification.json`. Aucun test applicatif relancé : aucun code applicatif modifié. Les prochaines vérifications sont celles de la phase B, pas des validations déjà acquises.

## Références primaires consultées le 25 octobre 2026

Les références expliquent les points de contrôle ; elles ne valent pas approbation du contrat entier. Les appréciations de risque et propositions de rédaction sont une analyse de cet audit.


<a id="s1"></a>
**S1 — Formation, conditions générales et recours contractuels** : [source primaire](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).


<a id="s2"></a>
**S2 — Information précontractuelle — L111-1** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044142438/2026-05-19).


<a id="s3"></a>
**S3 — Recours en cas d’inexécution — Code civil, 1217** : [source primaire](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032006712).


<a id="s4"></a>
**S4 — Force majeure — 1218** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431/2026-09-27).


<a id="s5"></a>
**S5 — Arrhes et avance — L214-1** : [source primaire](https://www.legifrance.gouv.fr/affichCodeArticle.do?cidTexte=LEGITEXT000006069565&idArticle=LEGIARTI000032221227).


<a id="s6"></a>
**S6 — Paiement hors établissement — L221-10** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226864/2022-05-30).


<a id="s7"></a>
**S7 — Cession des droits — L131-3** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278958/2026-03-27).


<a id="s8"></a>
**S8 — RGPD, responsabilités et sous-traitance — CNIL** : [source primaire](https://cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).


<a id="s9"></a>
**S9 — Déséquilibre significatif — L212-1** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032890812/2023-05-02).


<a id="s10"></a>
**S10 — Conformité numérique — L224-25-12 et suivants** : [source primaire](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000044132867/2026-07-10).


<a id="s11"></a>
**S11 — Compétence territoriale — CPC 48** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006410147/2026-04-01).


<a id="s12"></a>
**S12 — Délais et pénalités professionnels — L441-10** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038414392).


<a id="s13"></a>
**S13 — Indemnité forfaitaire — D441-5** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043197457/2026-07-06).


<a id="s14"></a>
**S14 — Mises à jour nécessaires — L224-25-25** : [source primaire](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000044133273/2026-04-20).


<a id="s15"></a>
**S15 — Résiliation électronique — L215-1-1** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046190107/2026-03-29).


<a id="s16"></a>
**S16 — Protection de certains professionnels hors établissement — L221-3** : [source primaire](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221321/).


<a id="s17"></a>
**S17 — Exceptions à la rétractation — L221-28** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170/2026-06-26).


<a id="s18"></a>
**S18 — Médiation de la consommation — administration** : [source primaire](https://www.plus.transformation.gouv.fr/j-ai-droit-a-l-erreur/je-suis-un-professionnel-en-relation-avec-des-consommateurs-quelles-sont-mes).


<a id="s19"></a>
**S19 — Fonction de rétractation en ligne — L221-21** : [source primaire](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310520/2026-09-15).

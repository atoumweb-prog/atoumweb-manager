# Revue rédactionnelle ChatGPT — maintenance et deux clauses communes

Date : 28 octobre 2026 · **Propositions documentaires non validées** · branche `chatgpt/humanisation-maintenance-socle-20261028` dérivée de `codex/internal-reference-handoff-20261027`.

## Périmètre réalisé

La source documentaire unique des propositions révisées est [PROPOSITIONS.json](PROPOSITIONS.json). Ce lot modifie uniquement le champ `proposal` des neuf entrées ci-dessous, en conservant l'ancienne proposition dans `previousEditorialProposal` et la justification dans `editorialRevision`.

Les textes publiés de `data/handoff/2026-10-27/contrats-publies.json`, leurs versions, les liens Catalogue/clauses, les prix, les devis et contrats historiques, ainsi que les réglages du Manager, **n'ont pas été modifiés**. Les champs `approval` et `humanDecision` restent inchangés : **aucune adoption, aucune publication**.

| Code | Modification proposée | Point à contrôler avant adoption |
|---|---|---|
| `MAINT-PERIMETRE` | Présentation du périmètre, des inclusions et des travaux supplémentaires en phrases simples, sans liste à points-virgules. | Le devis doit réellement préciser l'étendue de la formule. |
| `MAINT-INTERVENTIONS` | Distingue le quota mensuel d'interventions d'une banque d'heures, y compris en cas de facturation annuelle. | Vérifier les limites réelles de chaque formule et ne pas transformer les interventions en crédit annuel. |
| `MAINT-MAJ` | Distingue report technique, information du client et corrections déjà dues. | Ne pas reporter un correctif légalement ou contractuellement dû sans traiter les obligations applicables. |
| `MAINT-RENOUVELLEMENT` | Sépare mensuel et annuel, accord exprès annuel conservé. | Confirmer le parcours réel de renouvellement/résiliation, y compris numérique si applicable. |
| `MAINT-SAUVEGARDE` | Simplifie fréquence, conservation et support de stockage. | Ne pas inventer de fréquence, de rétention ni de garantie de restauration ; connaître les conditions de l'hébergeur. |
| `MAINT-URGENCE` | Distingue plages de prise en charge, diagnostic et complément accepté. | Vérifier le délai convenu ; traiter les violations de données selon les rôles réels (RGPD). |
| `MAINT-WOOCOMMERCE` | Périmètre de la maintenance et exclusions client plus lisibles ; obligations dues préservées. | Vérifier les extensions effectivement listées au devis et les services tiers. |
| `BASE-CONFIDENTIALITE` | Engagement réciproque exprimé en « nous/vous » avec les exceptions conservées. | Préciser restitution/suppression/conservation selon les dossiers. |
| `BASE-FORCE-MAJEURE` | Ajoute explicitement l'effet d'un retard justifiant la résolution si l'empêchement est temporaire. | Contrôler avec l'article 1218 du Code civil et le contrat entier. |

## Vérifications réalisées

- 118 entrées contractuelles toujours présentes et identifiants sans doublon.
- Neuf propositions modifiées ; textes sources `origin.body`, empreintes sources, statuts et décisions d'approbation inchangés.
- Chaque proposition remplacée reste disponible dans `previousEditorialProposal`.
- Pas de ligne à tiret terminée par un point-virgule dans les neuf rédactions révisées.
- Aucun test d'exécution du moteur, aucune génération PDF, aucun changement de schéma ou de base : **contrôle documentaire uniquement**.

## Références légales externes consultées

- [Code civil, article 1218 — force majeure](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032041431).
- [CNIL, article 33 du RGPD — notification des violations de données](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).

Ces références étayent des points précis, sans certifier automatiquement la validité de toutes les dispositions contractuelles.

## Suite prévue

1. Relecture humaine et arbitrages sur les neuf propositions ; ne pas publier sur simple approbation de style.
2. Examiner les clauses `WEB-*` et `ECOM-*` qui s'appliquent aux devis de création et de maintenance de sites.
3. Ensuite seulement, améliorer le **rendu PDF client** (listes, codes internes, calendrier, titres, enchaînements), sans altérer les snapshots historiques.
4. Tester les devis représentatifs et l'application B2B/B2C avant publication éventuelle des nouvelles versions.

## Décisions métier prises avec le responsable d'AtoumWeb (28 octobre 2026)

### D01 — Interventions comprises dans les formules de gestion et maintenance : VALIDÉ

**Décision explicite de l'utilisateur :**
- **Gestion / maintenance WordPress** : **2 petites interventions par mois** ; **30 minutes maximum par intervention**.
- **Gestion / maintenance WooCommerce** : **4 petites interventions par mois** ; **30 minutes maximum par intervention**.
- **Même règle pour la facturation mensuelle et annuelle** ; les interventions sont **non reportables** au mois suivant et **ne représentent pas une banque d'heures**.
- Les corrections qui sont déjà dues au titre d'une garantie ou d'une obligation indépendante n'entament pas les quotas commerciaux.

**Conséquence rédactionnelle** : conserver `MAINT-INTERVENTIONS` comme clause générique renvoyant au **quota exact inscrit au devis**, plutôt que de mentionner obligatoirement 2 ou 4 interventions dans toutes les prestations. Les conditions commerciales doivent reprendre les limites de 30 minutes et la non-reportabilité, y compris dans les formules annuelles.

**État** : règle métier approuvée, **pas** adoption globale ou publication de la clause contractuelle. La version publiée du Catalogue reste inchangée. Les fiches mensuelles `Gestion WordPress` et `Gestion WooCommerce` ne contiennent actuellement pas d'inclusions détaillées dans l'export daté du 27/10. Une future mise à jour **versionnée** des fiches commerciales sera donc nécessaire, avec contrôle de non-rétroactivité pour les devis déjà acceptés.

**D02 — Sauvegardes AtoumWeb + hébergeur : RÈGLE VALIDÉE.** Le responsable confirme deux dispositifs distincts : les sauvegardes effectuées par AtoumWeb et celles proposées par l’hébergeur. Les sauvegardes de l’hébergeur suivent leurs propres conditions et ne se substituent pas aux sauvegardes AtoumWeb. **Précision validée pour les sauvegardes propres AtoumWeb : une sauvegarde chaque semaine, conservée 30 jours.** La fréquence et la conservation du dispositif de l’hébergeur restent à vérifier auprès de celui-ci. Le lieu de stockage et les modalités de restauration AtoumWeb ne sont pas encore documentés. Aucune version contractuelle publiée n’est modifiée.


### D03 — Mises à jour WordPress, thèmes et extensions : RÈGLE VALIDÉE

Décision explicite du responsable AtoumWeb : **vérification et mises à jour hebdomadaires** de WordPress, des thèmes et des extensions pour les formules de gestion/maintenance concernées ; **traitement prioritaire des correctifs de sécurité urgents**.

Conséquence rédactionnelle pour `MAINT-MAJ` : le texte proposé décrit le contrôle chaque semaine et la réalisation des mises à jour comprises dans la formule, avec la possibilité de reporter une mise à jour risquée le temps d'évaluer une solution adaptée, information du client et préservation des obligations applicables. **Prioritaire ne signifie pas intervention ou résolution dans un délai inventé**.

**État** : décision métier validée et proposition documentaire ajustée. Aucune publication de clause, aucun changement de version Catalogue, aucun engagement rétroactif sur les contrats historiques.

### D04 — Prise en charge des incidents urgents : HORAIRES VALIDÉS

Décision explicite du responsable AtoumWeb : **les incidents urgents sont pris en charge pendant les jours et horaires professionnels annoncés aux clients**. Aucune astreinte permanente 24 h/24 et 7 j/7 n'est convenue dans cette règle. Les horaires et jours exacts ne sont pas encore détaillés ; ils doivent être communiqués dans l'offre ou les conditions applicables.

**Question 6 — règle validée :** les incidents urgents reçoivent un premier retour humain en priorité, **sans délai maximal garanti**. Ce premier retour ne vaut ni garantie d'intervention dans un délai déterminé, ni résolution du problème. Les jours et horaires professionnels annoncés aux clients restent à préciser (question 7). Les obligations légales de notification des violations de données restent distinctes du service commercial.

**État** : règle métier approuvée, proposition de clause ajustée ; aucune modification de version publiée ou de contrat historique.


### D05 — Horaires de bureau : VALIDÉ

Le responsable confirme une prise en charge des urgences pendant les horaires de bureau. Aucune plage horaire chiffrée ni jour exact n'est fixé ici. Premier retour humain prioritaire sans délai maximal garanti (D04). Il reste à préciser les plages exactes communiquées aux clients avant publication.

### D06 — Résiliation de maintenance mensuelle : VALIDÉE

Décision expresse du responsable AtoumWeb : le client peut demander **à tout moment** la résiliation de la maintenance mensuelle WordPress (49 €/mois) ou WooCommerce (99 €/mois), **sans préavis supplémentaire**. La prestation prend fin **à l'issue de la période mensuelle déjà payée**. Cette règle s'applique sans préjudice des droits légaux de résiliation anticipée ou de remboursement lorsqu'ils existent.

Conséquence rédactionnelle : adapter la proposition `MAINT-RENOUVELLEMENT` sans changer les formules annuelles : celles-ci restent renouvelées par **accord exprès**, sans reconduction annuelle tacite par défaut. Le moyen de demande de résiliation et les informations requises par la réglementation devront être précisés selon le canal de souscription.

**D07 — Renouvellement annuel : VALIDÉ (question 9).** AtoumWeb adresse une **proposition de renouvellement 30 jours avant l'échéance** de la maintenance annuelle. Le renouvellement reste soumis à **l'accord exprès du client** ; l'envoi d'une proposition, son silence ou l'absence de réponse ne valent pas acceptation et ne créent pas de reconduction tacite. Les formules de maintenance annuelles concernées restent identifiées par leurs devis. Décision métier consignée pour la proposition `MAINT-RENOUVELLEMENT`, sans publication ni changement des contrats historiques.

**D08 — Arrêt de maintenance et hébergement mutualisé : VALIDÉ (question 10).** En cas de non-renouvellement de la maintenance, **la maintenance WordPress/WooCommerce cesse à l'échéance**, tandis que **le site reste hébergé si le service d'hébergement qui le couvre demeure en vigueur**. Le renouvellement de la maintenance ne conditionne pas à lui seul la continuité d'un hébergement distinct encore actif. En revanche, l'accès au compte/serveur d'hébergement mutualisé n'est **pas remis au client**, car cet environnement partagé contient également d'autres sites. Distinguer les accès d'administration du site WordPress des accès globaux à la plateforme d'hébergement. Les accès propres au site, les moyens d'export/restitution et les modalités d'une éventuelle migration restent à préciser (question 11), sans priver le client de ses droits contractuels ou légaux. Aucune modification du contrat d'hébergement existant par cette seule décision.

État : **décision métier approuvée et consignée**, proposition documentaire à aligner, aucune clause ou version Catalogue publiée modifiée.


## Vérification o2switch — Lunes et accès client (28/10/2026)

Recherche documentaire officielle, **non assimilable à une validation du paramétrage effectif de l'abonnement AtoumWeb**.

- [o2switch — Mon Univers Web / sous-comptes Lunes](https://faq.o2switch.fr/cpanel/o2switch/univers-web-sous-comptes/) : les Lunes sont des **sous-comptes cPanel cloisonnés** ; les identifiants propres à la Lune peuvent être remis au client, tandis que le compte maître conserve l'administration. o2switch conseille un compte par client. L'accès au cPanel maître n'est pas une méthode de délégation adaptée à des sites de plusieurs clients.
- [o2switch — Comptes FTP secondaires](https://faq.o2switch.fr/cpanel/fichiers/comptes-ftp/) : un FTP secondaire peut être cantonné à un dossier du site ; il permet néanmoins l'écriture, ne remplace pas un compte cPanel séparé et ne garantit pas l'isolement technique global des sites exécutant du PHP sur le même compte.
- [o2switch — MySQL](https://faq.o2switch.fr/cpanel/bases-de-donnees/mysql/) et [phpMyAdmin limité](https://faq.o2switch.fr/guides/base-de-donnees/phpmyadmin-independant/) : permissions limitées à une base ou à un utilisateur dédiés ; à ne pas confondre avec un accès indépendant à tous les paramètres d'hébergement du site.
- Lunes gratuites selon l'offre annoncée par o2switch : **Grow 4, Cloud 8, Pro 16**, plus achat éventuel jusqu'au plafond total de **20** ; tarif officiel documenté de **1,50 € TTC/mois** pour une Lune supplémentaire, susceptible d'évoluer. Sur Grow, ressources mutualisées ; Cloud/Pro, ressources propres à la Lune. Vérifier l'offre effectivement détenue avant promesse commerciale.
- Un site présent sur le compte principal ne bascule **pas automatiquement** sur une Lune. La documentation indique une migration des fichiers, de la base, du paramétrage WordPress, de l'association du domaine et, le cas échéant, des e-mails.
- Une Lune reste **rattachée à l'abonnement principal** o2switch, notamment pour sa durée et sa gestion. Remettre un login de Lune n'est **pas** transférer le contrat d'hébergement du client vers son propre abonnement. En cas de départ définitif d'AtoumWeb, prévoir restitution/export ou migration sur un hébergement distinct.

**Conséquence pour les clauses en projet** : nuancer D08 et `MAINT-RENOUVELLEMENT` / `WEB-HEBERGEMENT` / `TECH-HEBERGEMENT`. Ne **jamais** céder l'accès au cPanel maître comportant les autres clients ; un accès à une **Lune dédiée** est techniquement possible et peut être proposé selon les conditions acceptées. Les accès WordPress/FTP/base dédiés constituent des options restreintes si le site demeure sur un compte commun. Préserver les droits de restitution des éléments du site, le domaine, les obligations de sécurité et la possibilité d'une migration. **Le client n'a pas encore choisi la politique d'accès à inscrire au contrat** ; aucune clause finale ou version publiée modifiée sur cette recherche.

## Extension des formules — hébergement sans maintenance et Lunes (28/10/2026)

**Nouvelle décision utilisateur :** le client qui ne renouvelle pas sa maintenance peut rester hébergé chez AtoumWeb en payant l'hébergement au-delà de la période initialement prévue au devis et, si une Lune dédiée entraîne un coût supplémentaire, le supplément correspondant annoncé au client. AtoumWeb souhaite valoriser la **gestion de l'environnement technique d'hébergement**, indépendamment des mises à jour WordPress/WooCommerce.

**Recherche officielle o2switch :** l'infrastructure relève de l'hébergeur ; AtoumWeb peut gérer les paramètres de son espace (SSL, PHP/configuration). La version PHP sélectionnée par le client/administrateur **n'est pas automatiquement changée** par les mises à jour système o2switch. La documentation annonce 4/8/16 Lunes incluses (Grow/Cloud/Pro) et 1,50 € TTC/mois par Lune supplémentaire, plafond 20. La mention utilisateur « payant à partir de 3 » est **à vérifier sur son compte**, avant de créer un tarif ou une règle de facturation. Sources :
- https://faq.o2switch.fr/cpanel/o2switch/univers-web-sous-comptes/
- https://faq.o2switch.fr/cpanel/logiciels/hebergement-php-multi-version/
- https://faq.o2switch.fr/espace-client/offre/comparatif-offre-unique-o2switch/

**Livrables préparés :**
- `OFFRES-HEBERGEMENT-LUNES-20261028.md` : matrice des formules à partir du Catalogue existant, référence « Hébergement WordPress seul 99 €/an », gestion technique de l'espace d'hébergement, option Lune dédiée, exemples de devis et tâches d'intégration.
- Propositions contractuelles révisées **sans adoption ni publication** : `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-PERIMETRE`, `MAINT-RENOUVELLEMENT`. Historique conservé ; 118 versions sources publiées intactes.
- La facturation d'une première année d'hébergement ne peut être décidée qu'en fonction de **ce que prévoit chaque devis** ; pas de gratuité automatique ajoutée.
- L'hébergement sans maintenance laisse les composants WordPress potentiellement obsolètes : AtoumWeb ne doit pas promettre que **tout le site** reste à jour du seul fait du suivi technique.

**Décisions encore nécessaires avant insertion dans le Catalogue du Manager :** prix de vente de la Lune dédiée, seuil/quota réellement disponible dans le compte o2switch, inclusion de la première année par type d'offre, fréquence du suivi technique PHP/SSL, modalités d'accès à la Lune et migration éventuelle.

**Statut :** offres et clauses **rédigées dans la branche de travail**, aucune mutation des versions Catalogue publiées, des devis signés, des contrats ou des bases clients ; aucune mise en production.


## Décision finale suivante — Lune dédiée obligatoire en hébergement sans maintenance (28/10/2026)

Le responsable AtoumWeb **remplace** le choix antérieur « Lune éventuellement facturée » par une politique commerciale obligatoire : **tout client sans maintenance WordPress ou WooCommerce qui souhaite rester en hébergement AtoumWeb doit disposer d'une Lune o2switch dédiée, et payer deux prestations distinctes : hébergement + Lune**. Cette règle s'applique aux nouveaux engagements et aux changements de formule acceptés ; aucune adaptation rétroactive de devis signés ni interruption unilatérale d'un hébergement encore payé.

**Tarif d'hébergement effectivement trouvé dans le Catalogue publié** (export 27/10/2026) : `AW-TECH-HEBERG-WP`, « Hébergement WordPress seul », **9 900 centimes = 99 € par an**, unité `an`, périodicité `annuelle`, services inclus : hébergement, SSL et maintien de l'espace ; exclus : maintenance WordPress, mises à jour, interventions, sauvegardes de maintenance. En cas de besoins WooCommerce / serveur particuliers, fiche commerciale prévoit un devis.

**Tarif Lune client : non existant dans le Catalogue et non validé.** o2switch affiche comme **coût fournisseur** 1,50 € TTC/mois pour chaque Lune dépassant le quota gratuit, sous réserve de l'offre et des conditions. **Le tarif de vente AtoumWeb reste à arbitrer** et doit être indiqué séparément sur devis même lorsque la Lune est incluse dans le forfait o2switch. Source officielle : https://faq.o2switch.fr/cpanel/o2switch/univers-web-sous-comptes/.

**Documents adaptés** : `OFFRES-HEBERGEMENT-LUNES-20261028.md`, textes proposés `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-PERIMETRE`, `MAINT-RENOUVELLEMENT`. Les 118 clauses sources, versions publiées du Catalogue, contrats et devis acceptés demeurent inchangés. Le supplément Lune **n'est pas automatiquement le coût fournisseur**.

**Étape suivante :** fixer le prix de la Lune facturé au client et sa périodicité, puis préparer les versions brouillon du Catalogue et le contrôle de cohérence devis, sans publication automatique.


## Décision B — Formule d’hébergement isolé à prix fixe (28/10/2026)

**Réponse explicite du responsable : « B. Créer une véritable option commerciale Hébergement isolé avec Lune dédiée, à tarif fixe, même lorsqu'une Lune est comprise dans l'abonnement o2switch ».**

- Maintenir la règle de la **Lune obligatoire** dans tout nouvel hébergement AtoumWeb **sans maintenance WordPress/WooCommerce**.
- Proposer un **tarif annuel total fixe au client**, identifiable en deux composantes : **hébergement WordPress seul 99 €/an** (tarif déjà publié dans `AW-TECH-HEBERG-WP`) **+ forfait commercial de mise à disposition/gestion de la Lune dédiée**. Son montant n'a pas été communiqué ; ne pas l'inventer.
- La facturation commerciale de la Lune **ne dépend pas** du fait qu'o2switch l'offre dans le quota de l'abonnement AtoumWeb ou facture une Lune supplémentaire.
- Libellé de nouvelle formule à préparer pour le Catalogue : **Hébergement isolé avec Lune dédiée** (`AW-TECH-HEBERG-ISO-LUNE`, code proposé seulement, pas d'enregistrement publié). Préserver les éventuelles particularités d'hébergement WooCommerce et de ressources au devis.
- **Contrats déjà acceptés** : aucun supplément, basculement, ou arrêt d'hébergement automatique ; nouvelle offre/avenant acceptés avant tout changement, avec détail d'une éventuelle migration.
- Les propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-RENOUVELLEMENT` sont ajustées à cette règle et conservent la source publiée.
- Le suivi technique de l'hébergement (SSL, réglages disponibles, PHP selon l'offre) **ne comprend pas** les mises à jour de WordPress, du thème, ni des plugins. Risques d'obsolescence applicative à expliquer.

**En attente pour établir le tarif final :** montant du **forfait annuel Lune dédiée** vendu par AtoumWeb ; une fois ce montant validé, le prix annuel total pourra être calculé, puis renseigné dans une version brouillon du Catalogue. Aucune version publiée du Catalogue ni devis signé modifiés.


## D09 — Tarif commercial « Hébergement isolé avec Lune dédiée » : VALIDÉ (28/10/2026)

**Validation expresse du responsable AtoumWeb (« non ça me va » en réponse à la proposition 149 €/an)** :

- Prix annuel total de l'hébergement isolé WordPress standard : **149 €/an**.
- Composante **hébergement : 99 €/an**, correspondant au tarif publié de la prestation autonome `AW-TECH-HEBERG-WP`.
- Composante **Lune dédiée : 50 €/an**, forfait commercial de mise à disposition de l'espace isolé et de sa gestion, même si une Lune ne génère aucun surcoût chez o2switch.
- Lune obligatoire pour l'hébergement AtoumWeb **sans maintenance applicative** (nouveaux contrats ou changements acceptés) ; aucune maintenance WordPress/WooCommerce incluse dans ces 149 €/an.
- Prix client approuvé, **non publié dans le Catalogue actif ni appliqué à un contrat existant** ; proposition de nouvelle formule `AW-TECH-HEBERG-ISO-LUNE` à créer en brouillon lors de l'intégration métier, avec contrôle des taxes/statut et du fait que `AW-TECH-HEBERG-WP` ne soit pas facturé deux fois.
- Ne pas faire figurer 149 €/an en dur dans le texte universel des clauses : conserver la **référence au devis** et le tarif dans la fiche commerciale versionnée.
- Modalités et éventuel coût ponctuel de **migration du site existant vers la Lune** : **à décider**. Les anciens contrats et droits de restitution restent respectés.

**Réalisé** : document `OFFRES-HEBERGEMENT-LUNES-20261028.md` mis à jour avec les montants et propositions des clauses `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-RENOUVELLEMENT` annotées. **Aucune publication, migration, import ou application rétroactive**.


## D10 — Migration initiale vers Lune : choix A validé (28/10/2026)

**Dernière correction expresse de l'utilisateur** : sa réponse **« ou plutôt A » remplace « B »** à la question sur les frais de migration d'un site **déjà hébergé chez AtoumWeb** vers sa Lune dédiée. **Le transfert initial interne est compris dans la première année à 149 €**, sans facture de migration en supplément. Le **renouvellement reste à 149 €/an** selon les termes de la formule annuelle acceptée.

Distinction importante : le « choix B » **antérieur portant sur le modèle commercial de Lune à tarif fixe** demeure validé ; seul le choix B « migration facturée séparément » est **annulé** et remplacé par l'option A « migration incluse ». La migration depuis un hébergeur tiers, une refonte ou un travail sans lien avec le transfert interne ne deviennent pas automatiquement gratuits.

Mise en œuvre à prévoir : chiffrer les temps et capacités internes de ce transfert, puis planifier un déplacement des fichiers, de la base, de la configuration du site et des paramètres associés vers la Lune, avec tests de bon fonctionnement, sans divulguer l'accès cPanel maître. Les droits issus d'un contrat historique demeurent protégés ; toute nouvelle formule doit être acceptée.

**Documents modifiés sur la PR #159** : `OFFRES-HEBERGEMENT-LUNES-20261028.md` et propositions `TECH-HEBERGEMENT`, `WEB-HEBERGEMENT`, `MAINT-RENOUVELLEMENT`. **Pas de publication Catalogue, déploiement, modification de contrats acceptés ni migration réelle.**

**Prochaine décision à recueillir** : le client hébergé sur sa Lune dédiée reçoit-il systématiquement les identifiants d'administration de sa Lune, uniquement sur demande, ou pas du tout ? Distinguer l'accès cPanel dédié de l'accès WordPress et du compte maître.


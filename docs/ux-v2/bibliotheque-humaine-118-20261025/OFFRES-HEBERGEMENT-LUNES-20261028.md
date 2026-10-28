# AtoumWeb — Offres hébergement, maintenance et Lunes (proposition commerciale)

**Date : 28/10/2026** — **Document de travail** pour le Catalogue, les devis et les clauses. Aucune offre publiée ou ancien contrat n'est modifié. À intégrer sous forme de nouvelles versions brouillon après validation des points encore ouverts.

## Décisions déjà exprimées

1. Un client peut **cesser la maintenance WordPress/WooCommerce** tout en maintenant son site **en hébergement AtoumWeb**, si cette prestation d'hébergement est encore en vigueur et payée.
2. L'hébergement au-delà de la première année est facturé si l'offre initiale comprenait **explicitement** une première année. **Ne pas supposer** que tous les devis de création offrent cette année : relire chaque devis.
3. L'accès **cPanel maître** d'AtoumWeb, qui porte plusieurs sites, n'est jamais fourni à un client. Une **Lune o2switch** peut créer un espace cPanel client séparé ; son éventuel coût supplémentaire peut être facturé sur une ligne distincte acceptée au devis.
4. **Hébergement et suivi technique de l'environnement** ne sont **pas** équivalents à « WordPress entièrement maintenu ». Un client sans contrat de maintenance WordPress peut garder un WordPress, thème ou plugin obsolète, malgré une infrastructure o2switch maintenue.
5. Contrats annuels : relance à J-30 et renouvellement uniquement sur accord exprès. Maintenance mensuelle : résiliation à tout moment, sans préavis supplémentaire, effet en fin de mois payé.

## Grille proposée aux clients (données d'offre existantes, sans nouveau tarif inventé)

| Offre / situation | Référence du Catalogue du Manager | Prix actuellement référencé | Prestations à distinguer |
| --- | --- | ---: | --- |
| **Hébergement WordPress seul** (sans maintenance applicative) | `AW-TECH-HEBERG-WP` | **99 €/an** | Espace d'hébergement, SSL, gestion technique de l'espace. Ajouter un **suivi des paramètres techniques** décrit ci-dessous, sans mettre à jour WordPress/thèmes/plugins. |
| **Maintenance WordPress mensuelle** | `atoumweb-wordpress` | **49 €/mois** | Contrôle/MAJ WordPress, thèmes et plugins chaque semaine, 2 petites interventions/mois de 30 min max, non reportables. Hébergement **distinct sauf inclusion écrite au devis**. |
| **Maintenance WooCommerce mensuelle** | `atoumweb-woocommerce` | **99 €/mois** | Même principe, 4 petites interventions/mois de 30 min max, non reportables ; hébergement distinct sauf inclusion écrite au devis. |
| **Maintenance WordPress annuelle** | `AW-MAINT-WP-A` | **539 €/an** | Périmètre de maintenance WP mensuelle, facturation annuelle ; hébergement distinct sauf inclusion au devis. |
| **Maintenance WooCommerce annuelle** | `AW-MAINT-WC-A` | **1 089 €/an** | Périmètre de maintenance WooCommerce mensuelle, facturation annuelle ; hébergement distinct sauf inclusion au devis. |
| **Lune dédiée o2switch** | **Option à créer**, pas de code Catalogue existant identifié | **À valider avant vente** | Espace isolé, cPanel dédié, isolation des autres clients. Ligne **distincte** si le supplément est facturé. Préciser accès remis ou non, durée, rattachement à l'abonnement AtoumWeb, migration éventuelle. |
| **Migration vers hébergement AtoumWeb** | `AW-TECH-MIGRATION-AW` | **99 €** pour un cas standard | Migration des fichiers/base/config et vérifications, hors cas complexes selon devis. Ne pas confondre avec la création d'une Lune ni avec un départ vers un tiers. |

**Règle de non-cumul forcé :** si un devis signé inclut déjà l'hébergement dans le prix de la maintenance ou de la création, ne pas facturer une deuxième fois ce même hébergement ; identifier la date de fin de la période incluse et faire une proposition séparée de poursuite.

## « Hébergement AtoumWeb + suivi de l'environnement technique » : description proposée

AtoumWeb met à disposition ou gère un espace d'hébergement souscrit via son fournisseur, avec les services explicitement décrits au devis. En matière de **gestion de l'environnement d'hébergement**, le descriptif commercial peut inclure, dans la mesure de la prestation réellement exécutée et du périmètre convenu :

- le maintien de l'espace d'hébergement et la gestion du renouvellement accepté ;
- la configuration et la surveillance utile du **certificat SSL** et de l'accessibilité technique ; l'émission ou le renouvellement automatique des certificats dépend aussi du fournisseur ;
- la vérification périodique de la **version PHP configurée** pour le site, des versions encore prises en charge et des problèmes de compatibilité connus ; toute modification risquée est précédée d'une analyse et, au besoin, de l'information du client ;
- les réglages d'hébergement convenus (configuration de l'espace, association de domaine et paramètres techniques accessibles), **sans** prise en charge automatique de l'administration éditoriale, des plugins ou du logiciel WordPress ;
- la relation technique avec le fournisseur au sujet de l'environnement fourni, selon les modalités de l'offre.

**Rôles à séparer** :
- **o2switch**, fournisseur : infrastructure matérielle, service d'hébergement et opérations relevant de sa plateforme ;
- **AtoumWeb**, revendeur/gestionnaire de l'espace : actes de configuration et de suivi **effectivement inclus** dans son offre ; pas une promesse d'administrer l'intégralité du serveur physique ni toutes les mises à jour système ;
- **client / mainteneur WordPress**, selon son contrat : correctifs du CMS, thèmes, extensions, compatibilités et mises à jour applicatives. **Sans maintenance applicative, ces composants peuvent rester vulnérables** ; rappeler ce risque au client.

Ne pas promettre « serveur et site toujours à jour », « sécurité garantie » ou « absence de faille ». Une mise à niveau de PHP peut nécessiter une évolution du CMS ou des extensions et un devis de travaux distincts si ces travaux ne sont pas déjà dus.

## Accès techniques et Lunes

- **Compte maître mutualisé** : identifiants réservés à AtoumWeb ; un client ne reçoit pas l'accès aux autres sites, bases, courriels ou données.
- **Lune dédiée au client** : espace cPanel propre, que le client **peut** administrer s'il choisit/si le devis prévoit un accès. Les accès sont limités à sa Lune, jamais au compte maître. Un client sans maintenance applicative est prioritaire pour l'isolement.
- **Si le site reste sur un compte commun** : remettre selon besoin des accès WordPress ou FTP restreints ; ne pas assimiler ces accès à une isolation parfaite des scripts PHP exécutés dans le compte commun. Une Lune dédiée est préférable.
- **Sortie** : l'accès à la Lune ne transfère pas la propriété de l'abonnement o2switch principal. À la sortie définitive, faciliter la restitution des fichiers/base et éléments propres au client et proposer, en option, une migration vers un nouvel hébergement, sous réserve des obligations déjà dues.
- **Lune supplémentaire** : la disponibilité gratuite dépend du forfait d'AtoumWeb et du nombre de Lunes déjà utilisées. Si o2switch facture une Lune supplémentaire, la ligne « Espace cPanel isolé — Lune dédiée » porte un **prix client explicite** accepté avant commande ; ne pas présenter automatiquement le coût fournisseur TTC comme un prix de vente HT/TTC d'AtoumWeb.

## Tarification de la Lune : informations officielles à ne pas confondre avec le forfait AtoumWeb

La documentation o2switch annonce **Grow : 4 Lunes incluses, Cloud : 8, Pro : 16**, puis **1,50 € TTC/mois par Lune supplémentaire**, jusqu'à 20 au total. Le responsable indique pour son usage une facturation « à partir de la troisième » : **vérifier le quota réel, l'offre et les Lunes actuellement occupées**. Cela peut correspondre à un seuil pratique de disponibilité, sans nécessairement être le quota contractuel officiel. Ne pas coder en dur « troisième = payante » avant vérification.

La revente client de l'option dédiée n'a **pas de prix approuvé** dans le Catalogue : avant lancement, décider du tarif affiché, de la périodicité (mensuelle/annuelle), de son éventuelle inclusion dans l'hébergement 99 €/an et de la politique de désactivation à échéance.

## Cas pratiques à prévoir dans les devis

| Scénario | Devis à présenter |
| --- | --- |
| Nouveau site avec première année d'hébergement offerte **si explicitement incluse** | Création + hébergement année 1 inclus ; date exacte d'expiration ; année 2 et suivantes **99 €/an** sous réserve de maintien de la grille ; Lune dédiée si incluse ou option acceptée. |
| Client sans maintenance, souhaite rester chez AtoumWeb | **Hébergement 99 €/an** +, le cas échéant, **option Lune dédiée** ; suivi d'hébergement limité et **aucune maintenance WordPress** comprise. |
| Client choisit maintenance WordPress + hébergement chez AtoumWeb | **49 €/mois** ou **539 €/an** pour la maintenance, et **hébergement selon le devis** ; éviter toute double facturation si déjà compris. |
| Client choisit maintenance WooCommerce + hébergement chez AtoumWeb | **99 €/mois** ou **1 089 €/an** pour la maintenance, hébergement à préciser selon caractéristiques du site et devis ; Lune éventuelle distincte. |
| Fin de maintenance, hébergement encore payé | Les interventions WordPress cessent ; le site et l'espace d'hébergement restent disponibles jusqu'à l'échéance de l'hébergement, sous réserve des autres clauses. Avertir du risque de CMS obsolète. |
| Client quitte définitivement l'hébergement AtoumWeb | Restitution/export des éléments et accès propres au site selon les droits applicables ; migration optionnelle sur devis si hors obligations déjà dues. |

## Préparation pour le Catalogue / Devis / Manager

**À préparer sous forme de versions brouillon (pas encore publiées)** :
1. `AW-TECH-HEBERG-WP` : nouvelle version détaillant la gestion technique de l'hébergement **sans** maintenance du CMS.
2. Gestion WordPress / WooCommerce mensuelles et annuelles : distinguer clairement dans les inclusions **maintenance du site** et **hébergement éventuel selon le devis**. Préserver 2/4 interventions et les mises à jour hebdomadaires.
3. Option Catalogue **« Espace d'hébergement isolé — Lune dédiée »**, liée à un site et à un client avec prix, périodicité, date d'échéance, nombre d'espaces et statut d'accès.
4. Dans les devis : 3 lignes séparées **Hébergement**, **Maintenance applicative**, **Lune dédiée** ; si une prestation est incluse, préciser **« incluse jusqu'au [date] »** au lieu de zéro prix sans terme.
5. Dans la fiche Site/Contrat : propriétaire du domaine, compte principal AtoumWeb (jamais de secret en clair), identifiant de Lune **non sensible**, date de fin de l'hébergement, date de fin de la maintenance, statut de renouvellement, alerte J-30.
6. Contrats : conserver les droits à la restitution, les obligations de sécurité et le principe de renouvellement annuel par **accord exprès**. Ne jamais transformer automatiquement les conditions d'un devis déjà accepté.

**Arbitrages encore ouverts** : offre o2switch exacte et quota Lunes disponible ; prix client de l'option Lune ; conditions d'inclusion de l'année 1 suivant les offres ; périmètre précis du « suivi technique » et périodicité éventuelle ; canaux de notification et éventuels besoins de migration.

## Sources o2switch consultées

- https://faq.o2switch.fr/cpanel/o2switch/univers-web-sous-comptes/
- https://faq.o2switch.fr/espace-client/offre/comparatif-offre-unique-o2switch/
- https://faq.o2switch.fr/cpanel/logiciels/hebergement-php-multi-version/
- https://faq.o2switch.fr/guides/migrations/deplacer-site-hebergement-o2switch/

**État : proposition commerciale structurée, décisions utilisateur antérieures respectées, plusieurs données tarifaires et procédures à valider. Rien n'a été appliqué à une base clients, au Catalogue publié ni aux devis acceptés.**

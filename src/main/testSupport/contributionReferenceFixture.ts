import type {OperationalReference} from '../../shared/operational';
/** Approved source values, synthetic catalogue identities in contributionFixture. No real import. */
export const contributionExamples:OperationalReference = {
  "schemaVersion": 1,
  "source": {
    "file": "AtoumWeb_Referentiel_Operationnel_V1_REVU.xlsx",
    "sha256": "c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf"
  },
  "models": [
    {
      "code": "AW-WEB-VITRINE",
      "name": "Site vitrine 5 pages",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 site + 5 pages",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue dans devis / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 1470,
      "sourceRow": 2,
      "notes": "Charge V1 de référence validée : 24 h 30. Hors avant-vente et garantie. | Revue métier : Charge conservée à 24 h 30 malgré un ratio prix/temps faible : ne pas réduire artificiellement. À mesurer dès les premiers projets.",
      "actions": [
        {
          "key": "AW-WEB-VITRINE-A01",
          "phase": "Cadrage",
          "name": "Analyser le besoin et organiser le projet",
          "checklist": "Objectif, cible, périmètre, priorités",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 2
        },
        {
          "key": "AW-WEB-VITRINE-A02",
          "phase": "Cadrage",
          "name": "Vérifier contenus, visuels, informations et accès",
          "checklist": "Textes, images, identité, domaine, hébergement, accès",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 3
        },
        {
          "key": "AW-WEB-VITRINE-A03",
          "phase": "Préparation",
          "name": "Installer et configurer WordPress",
          "checklist": "Installation, réglages essentiels, sécurité de base",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 4
        },
        {
          "key": "AW-WEB-VITRINE-A04",
          "phase": "Préparation",
          "name": "Configurer Divi et environnement AtoumWeb",
          "checklist": "Thème, environnement, réglages globaux",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 5
        },
        {
          "key": "AW-WEB-VITRINE-A05",
          "phase": "Préparation",
          "name": "Mettre en place styles globaux, header et footer",
          "checklist": "Typographies, couleurs, navigation, pied de page",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 6
        },
        {
          "key": "AW-WEB-VITRINE-A06",
          "phase": "Préparation",
          "name": "Préparer arborescence et contenus",
          "checklist": "5 pages, ordre, répartition des contenus",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 7
        },
        {
          "key": "AW-WEB-VITRINE-A07",
          "phase": "Production",
          "name": "Construire la page Accueil",
          "checklist": "Hero, sections, CTA, visuels, liens",
          "minutes": 150,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 8
        },
        {
          "key": "AW-WEB-VITRINE-A08",
          "phase": "Production",
          "name": "Construire la page Services",
          "checklist": "Structure services, CTA, contenus",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 9
        },
        {
          "key": "AW-WEB-VITRINE-A09",
          "phase": "Production",
          "name": "Construire la page Réalisations",
          "checklist": "Grille ou structure prévue",
          "minutes": 75,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 10
        },
        {
          "key": "AW-WEB-VITRINE-A10",
          "phase": "Production",
          "name": "Construire la page À propos",
          "checklist": "Présentation, preuves, CTA",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 11
        },
        {
          "key": "AW-WEB-VITRINE-A11",
          "phase": "Production",
          "name": "Construire Contact + formulaire",
          "checklist": "Formulaire simple, confirmation, routage",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 12
        },
        {
          "key": "AW-WEB-VITRINE-A12",
          "phase": "Production",
          "name": "Intégrer les pages légales fournies",
          "checklist": "Mentions/politique fournies, liens footer",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 13
        },
        {
          "key": "AW-WEB-VITRINE-A13",
          "phase": "Finalisation",
          "name": "Responsive global desktop / tablette / mobile",
          "checklist": "Contrôles multi-formats, corrections",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 14
        },
        {
          "key": "AW-WEB-VITRINE-A14",
          "phase": "Finalisation",
          "name": "SEO technique et SEO de base",
          "checklist": "Titres, metas, indexation, sitemap, structure",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 15
        },
        {
          "key": "AW-WEB-VITRINE-A15",
          "phase": "Finalisation",
          "name": "Optimisations techniques et performance",
          "checklist": "Images, cache, contrôles de base",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 16
        },
        {
          "key": "AW-WEB-VITRINE-A16",
          "phase": "Recette",
          "name": "Contrôles fonctionnels et recette interne",
          "checklist": "Liens, formulaires, navigation ; contrôle du fonctionnement technique du mécanisme de consentement ; aucune validation juridique de conformité",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 17
        },
        {
          "key": "AW-WEB-VITRINE-A17",
          "phase": "Corrections",
          "name": "Premier cycle de corrections client",
          "checklist": "Corrections dans le périmètre",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 18
        },
        {
          "key": "AW-WEB-VITRINE-A18",
          "phase": "Corrections",
          "name": "Deuxième cycle de corrections client",
          "checklist": "Derniers ajustements",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 19
        },
        {
          "key": "AW-WEB-VITRINE-A19",
          "phase": "Livraison",
          "name": "Domaine, SSL et mise en ligne",
          "checklist": "DNS si prévu, HTTPS, contrôle ; création/vérification d’un point de restauration avant publication",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 20
        },
        {
          "key": "AW-WEB-VITRINE-A20",
          "phase": "Livraison",
          "name": "Formation client",
          "checklist": "Prise en main WordPress / Divi",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 21
        },
        {
          "key": "AW-WEB-VITRINE-A21",
          "phase": "Livraison",
          "name": "Sauvegarde de livraison et clôture",
          "checklist": "Sauvegarde, accès, livraison",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 22
        }
      ]
    },
    {
      "code": "AW-LP-BASE",
      "name": "Landing Page",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 landing jusqu'à 8 sections",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue dans devis / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 765,
      "sourceRow": 3,
      "notes": "Référence V1 : 12 h 45. Rédaction complète vendue séparément.",
      "actions": [
        {
          "key": "AW-LP-BASE-A01",
          "phase": "Cadrage",
          "name": "Analyser objectif, cible et conversion",
          "checklist": "Objectif, offre, CTA",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 72
        },
        {
          "key": "AW-LP-BASE-A02",
          "phase": "Cadrage",
          "name": "Vérifier contenus, preuves et accès",
          "checklist": "Textes, visuels, domaine",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 73
        },
        {
          "key": "AW-LP-BASE-A03",
          "phase": "Préparation",
          "name": "Préparer WordPress / Divi et réglages",
          "checklist": "Environnement, page, styles",
          "minutes": 75,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 74
        },
        {
          "key": "AW-LP-BASE-A04",
          "phase": "Préparation",
          "name": "Définir structure jusqu'à 8 sections",
          "checklist": "Ordre, narration, CTA",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 75
        },
        {
          "key": "AW-LP-BASE-A05",
          "phase": "Production",
          "name": "Construire et intégrer les sections",
          "checklist": "Jusqu'à 8 sections standard",
          "minutes": 240,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 76
        },
        {
          "key": "AW-LP-BASE-A06",
          "phase": "Production",
          "name": "Configurer formulaire ou CTA",
          "checklist": "Un formulaire OU CTA principal",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 77
        },
        {
          "key": "AW-LP-BASE-A07",
          "phase": "Finalisation",
          "name": "Responsive complet",
          "checklist": "Desktop/tablette/mobile",
          "minutes": 75,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 78
        },
        {
          "key": "AW-LP-BASE-A08",
          "phase": "Finalisation",
          "name": "SEO et performance de base",
          "checklist": "Meta, indexation, images",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 79
        },
        {
          "key": "AW-LP-BASE-A09",
          "phase": "Recette",
          "name": "Contrôles fonctionnels",
          "checklist": "Liens, formulaire, CTA",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 80
        },
        {
          "key": "AW-LP-BASE-A10",
          "phase": "Corrections",
          "name": "Cycle 1 de corrections",
          "checklist": "Dans le périmètre",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 81
        },
        {
          "key": "AW-LP-BASE-A11",
          "phase": "Corrections",
          "name": "Cycle 2 de corrections",
          "checklist": "Dans le périmètre",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 82
        },
        {
          "key": "AW-LP-BASE-A12",
          "phase": "Livraison",
          "name": "Mise en ligne et contrôle final",
          "checklist": "HTTPS, publication",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 83
        },
        {
          "key": "AW-LP-BASE-A13",
          "phase": "Livraison",
          "name": "Sauvegarde / clôture",
          "checklist": "Sauvegarde finale",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 84
        }
      ]
    },
    {
      "code": "AW-ECOM-BASE",
      "name": "Boutique WooCommerce",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 boutique + 10 produits simples",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue dans devis / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 2550,
      "sourceRow": 4,
      "notes": "Référence V1 : 42 h 30. Fiscalité fournie par le client. | Revue métier : 42 h 30 conservées : cohérent pour une boutique 10 produits avec recette et formation. Surveiller le temps réel avant tout ajustement tarifaire.",
      "actions": [
        {
          "key": "AW-ECOM-BASE-A01",
          "phase": "Cadrage",
          "name": "Cadrer catalogue, paiement, livraison et parcours",
          "checklist": "Produits, taxes, comptes",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 101
        },
        {
          "key": "AW-ECOM-BASE-A02",
          "phase": "Cadrage",
          "name": "Vérifier contenus, données produits et accès",
          "checklist": "Fiches, images, règles",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 102
        },
        {
          "key": "AW-ECOM-BASE-A03",
          "phase": "Préparation",
          "name": "Installer/configurer WordPress et WooCommerce",
          "checklist": "Réglages, sécurité",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 103
        },
        {
          "key": "AW-ECOM-BASE-A04",
          "phase": "Préparation",
          "name": "Configurer thème et styles globaux",
          "checklist": "Header/footer, styles",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 104
        },
        {
          "key": "AW-ECOM-BASE-A05",
          "phase": "Catalogue",
          "name": "Structurer catégories, attributs et données",
          "checklist": "Catégories, stock",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 105
        },
        {
          "key": "AW-ECOM-BASE-A06",
          "phase": "Catalogue",
          "name": "Intégrer 10 produits simples",
          "checklist": "Titres, prix, images",
          "minutes": 300,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 106
        },
        {
          "key": "AW-ECOM-BASE-A07",
          "phase": "Production",
          "name": "Construire boutique, catégories et fiches produit",
          "checklist": "Templates",
          "minutes": 300,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 107
        },
        {
          "key": "AW-ECOM-BASE-A08",
          "phase": "Production",
          "name": "Configurer panier, commande et compte client",
          "checklist": "Parcours",
          "minutes": 180,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 108
        },
        {
          "key": "AW-ECOM-BASE-A09",
          "phase": "Paiement",
          "name": "Configurer jusqu'à 2 moyens de paiement standard",
          "checklist": "Comptes client",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 109
        },
        {
          "key": "AW-ECOM-BASE-A10",
          "phase": "Livraison",
          "name": "Configurer livraison simple",
          "checklist": "Zones/règles",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 110
        },
        {
          "key": "AW-ECOM-BASE-A11",
          "phase": "Fiscalité",
          "name": "Appliquer règles de TVA fournies",
          "checklist": "Paramètres client",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 111
        },
        {
          "key": "AW-ECOM-BASE-A12",
          "phase": "Communication",
          "name": "Configurer emails et informations de base",
          "checklist": "Emails transactionnels",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 112
        },
        {
          "key": "AW-ECOM-BASE-A13",
          "phase": "Finalisation",
          "name": "Responsive boutique",
          "checklist": "Desktop/tablette/mobile",
          "minutes": 180,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 113
        },
        {
          "key": "AW-ECOM-BASE-A14",
          "phase": "Finalisation",
          "name": "SEO et performance de base",
          "checklist": "Produits, cache",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 114
        },
        {
          "key": "AW-ECOM-BASE-A15",
          "phase": "Recette",
          "name": "Tester parcours complet",
          "checklist": "Produit→panier→paiement",
          "minutes": 180,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 115
        },
        {
          "key": "AW-ECOM-BASE-A16",
          "phase": "Corrections",
          "name": "Deux cycles de corrections",
          "checklist": "Dans le périmètre",
          "minutes": 180,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 116
        },
        {
          "key": "AW-ECOM-BASE-A17",
          "phase": "Sécurité",
          "name": "Contrôler paiement et données sensibles",
          "checklist": "Flux, HTTPS",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 117
        },
        {
          "key": "AW-ECOM-BASE-A18",
          "phase": "Livraison",
          "name": "Mise en ligne et contrôles finaux",
          "checklist": "DNS/SSL si prévu",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 118
        },
        {
          "key": "AW-ECOM-BASE-A19",
          "phase": "Livraison",
          "name": "Formation WooCommerce",
          "checklist": "Produits, commandes, stock",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 119
        },
        {
          "key": "AW-ECOM-BASE-A20",
          "phase": "Livraison",
          "name": "Sauvegarde et clôture",
          "checklist": "Sauvegarde",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 120
        }
      ]
    },
    {
      "code": "AW-MARIAGE-ESS",
      "name": "Mariage Essentiel",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 site mariage",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 630,
      "sourceRow": 5,
      "notes": "Référence V1 : 10 h 30 | Revue métier : 10 h 30 conservées : cohérent si le modèle reste très standardisé.",
      "actions": [
        {
          "key": "AW-MARIAGE-ESS-A01",
          "phase": "Cadrage",
          "name": "Collecter histoire, date, lieux et contenus",
          "checklist": "Textes/photos",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 347
        },
        {
          "key": "AW-MARIAGE-ESS-A02",
          "phase": "Préparation",
          "name": "Configurer site et identité graphique",
          "checklist": "Palette/structure",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 348
        },
        {
          "key": "AW-MARIAGE-ESS-A03",
          "phase": "Production",
          "name": "Construire page principale / sections",
          "checklist": "Infos essentielles",
          "minutes": 210,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 349
        },
        {
          "key": "AW-MARIAGE-ESS-A04",
          "phase": "Production",
          "name": "Configurer formulaire ou contact prévu",
          "checklist": "Contact/RSVP simple",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 350
        },
        {
          "key": "AW-MARIAGE-ESS-A05",
          "phase": "Finalisation",
          "name": "Responsive et optimisation images",
          "checklist": "Mobile",
          "minutes": 75,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 351
        },
        {
          "key": "AW-MARIAGE-ESS-A06",
          "phase": "Recette",
          "name": "Tester liens et formulaires",
          "checklist": "Parcours",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 352
        },
        {
          "key": "AW-MARIAGE-ESS-A07",
          "phase": "Corrections",
          "name": "Corrections client",
          "checklist": "Forfait",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 353
        },
        {
          "key": "AW-MARIAGE-ESS-A08",
          "phase": "Livraison",
          "name": "Mise en ligne et partage",
          "checklist": "Sous-domaine",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 354
        },
        {
          "key": "AW-MARIAGE-ESS-A09",
          "phase": "Livraison",
          "name": "Sauvegarde et clôture",
          "checklist": "Livraison",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 355
        }
      ]
    },
    {
      "code": "AW-MARIAGE-GRAND",
      "name": "Mariage Grand Jour",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 site mariage",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 1020,
      "sourceRow": 6,
      "notes": "Référence V1 : 17 h | Revue métier : 17 h conservées : cohérent avec RSVP minimal et contenus enrichis.",
      "actions": [
        {
          "key": "AW-MARIAGE-GRAND-A01",
          "phase": "Cadrage",
          "name": "Collecter histoire, événements, lieux et invités",
          "checklist": "Périmètre",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 356
        },
        {
          "key": "AW-MARIAGE-GRAND-A02",
          "phase": "Préparation",
          "name": "Configurer site et direction visuelle",
          "checklist": "Identité",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 357
        },
        {
          "key": "AW-MARIAGE-GRAND-A03",
          "phase": "Production",
          "name": "Construire pages/sections principales",
          "checklist": "Programme/lieux",
          "minutes": 300,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 358
        },
        {
          "key": "AW-MARIAGE-GRAND-A04",
          "phase": "RSVP",
          "name": "Configurer RSVP minimal",
          "checklist": "Nom, présence, nombre, événements",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 359
        },
        {
          "key": "AW-MARIAGE-GRAND-A05",
          "phase": "Production",
          "name": "Configurer galeries / contenus enrichis",
          "checklist": "Selon offre",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 360
        },
        {
          "key": "AW-MARIAGE-GRAND-A06",
          "phase": "Finalisation",
          "name": "Responsive et optimisation",
          "checklist": "Mobile",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 361
        },
        {
          "key": "AW-MARIAGE-GRAND-A07",
          "phase": "Recette",
          "name": "Tester RSVP et parcours invité",
          "checklist": "Scénarios",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 362
        },
        {
          "key": "AW-MARIAGE-GRAND-A08",
          "phase": "Corrections",
          "name": "Corrections client",
          "checklist": "Cycles",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 363
        },
        {
          "key": "AW-MARIAGE-GRAND-A09",
          "phase": "Livraison",
          "name": "Mise en ligne et contrôle final",
          "checklist": "Accès",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 364
        },
        {
          "key": "AW-MARIAGE-GRAND-A10",
          "phase": "Livraison",
          "name": "Sauvegarde et clôture",
          "checklist": "Livraison",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 365
        }
      ]
    },
    {
      "code": "AW-MARIAGE-HISTOIRE",
      "name": "Mariage Histoire",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "forfait",
      "estimateRequired": false,
      "quantityRule": "1 forfait = 1 site mariage",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 1380,
      "sourceRow": 7,
      "notes": "Référence V1 : 23 h | Revue métier : 23 h conservées : cohérent si le périmètre narratif reste borné.",
      "actions": [
        {
          "key": "AW-MARIAGE-HISTOIRE-A01",
          "phase": "Cadrage",
          "name": "Atelier histoire, programme, invités et contenus",
          "checklist": "Détaillé",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 366
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A02",
          "phase": "Préparation",
          "name": "Direction visuelle et architecture",
          "checklist": "Univers",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 367
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A03",
          "phase": "Production",
          "name": "Construire contenus narratifs principaux",
          "checklist": "Histoire/événements",
          "minutes": 360,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 368
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A04",
          "phase": "RSVP",
          "name": "Configurer RSVP minimal et scénarios",
          "checklist": "Données minimales",
          "minutes": 150,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 369
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A05",
          "phase": "Production",
          "name": "Galeries / contenus enrichis",
          "checklist": "Médias",
          "minutes": 150,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 370
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A06",
          "phase": "Finalisation",
          "name": "Responsive et optimisation avancée",
          "checklist": "Performance",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 371
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A07",
          "phase": "Recette",
          "name": "Tester parcours complet",
          "checklist": "RSVP/liens",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 372
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A08",
          "phase": "Corrections",
          "name": "Corrections client",
          "checklist": "Cycles",
          "minutes": 150,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 373
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A09",
          "phase": "Livraison",
          "name": "Mise en ligne et contrôles",
          "checklist": "Domaine",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 374
        },
        {
          "key": "AW-MARIAGE-HISTOIRE-A10",
          "phase": "Livraison",
          "name": "Sauvegarde et clôture",
          "checklist": "Hébergement 2 ans selon offre",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 375
        }
      ]
    },
    {
      "code": "AW-SEO-AUDIT",
      "name": "Audit technique SEO",
      "lot": "8A",
      "model": "Diagnostic",
      "unit": "audit",
      "estimateRequired": false,
      "quantityRule": "1 audit = 1 site",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 270,
      "sourceRow": 17,
      "notes": "Audit technique et restitution",
      "actions": [
        {
          "key": "AW-SEO-AUDIT-A01",
          "phase": "Audit",
          "name": "Crawl et collecte des données",
          "checklist": "Indexation/erreurs",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 187
        },
        {
          "key": "AW-SEO-AUDIT-A02",
          "phase": "Audit",
          "name": "Analyser technique on-page",
          "checklist": "Balises/maillage",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 188
        },
        {
          "key": "AW-SEO-AUDIT-A03",
          "phase": "Audit",
          "name": "Analyser performance et mobile",
          "checklist": "Vitesse",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 189
        },
        {
          "key": "AW-SEO-AUDIT-A04",
          "phase": "Audit",
          "name": "Analyser indexation et Search Console",
          "checklist": "Couverture/requêtes",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 190
        },
        {
          "key": "AW-SEO-AUDIT-A05",
          "phase": "Restitution",
          "name": "Prioriser recommandations",
          "checklist": "Impact/effort",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 191
        },
        {
          "key": "AW-SEO-AUDIT-A06",
          "phase": "Restitution",
          "name": "Rédiger synthèse et plan d'action",
          "checklist": "Actions",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 192
        }
      ]
    },
    {
      "code": "AW-CONT-ART-SEO",
      "name": "Article SEO",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "article",
      "estimateRequired": false,
      "quantityRule": "Multiplier par article",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 210,
      "sourceRow": 25,
      "notes": "Article SEO",
      "actions": [
        {
          "key": "AW-CONT-ART-SEO-A01",
          "phase": "Recherche",
          "name": "Recherche sujet et intention SEO",
          "checklist": "Sources/mots-clés",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 249
        },
        {
          "key": "AW-CONT-ART-SEO-A02",
          "phase": "Structure",
          "name": "Construire plan éditorial",
          "checklist": "Hn/questions",
          "minutes": 20,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 250
        },
        {
          "key": "AW-CONT-ART-SEO-A03",
          "phase": "Rédaction",
          "name": "Rédiger l'article SEO",
          "checklist": "Original",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 251
        },
        {
          "key": "AW-CONT-ART-SEO-A04",
          "phase": "SEO",
          "name": "Optimiser titres, maillage et meta",
          "checklist": "On-page",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 252
        },
        {
          "key": "AW-CONT-ART-SEO-A05",
          "phase": "Révision",
          "name": "Relire et finaliser",
          "checklist": "Qualité",
          "minutes": 25,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 253
        }
      ]
    },
    {
      "code": "AW-BRAND-LOGO",
      "name": "Logo Standard",
      "lot": "8A",
      "model": "Forfait créatif",
      "unit": "logo",
      "estimateRequired": false,
      "quantityRule": "1 logo standard",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 420,
      "sourceRow": 30,
      "notes": "Référence V1 : 7 h | Revue métier : 7 h conservées : le ratio est bas mais réduire le temps créatif serait artificiel.",
      "actions": [
        {
          "key": "AW-BRAND-LOGO-A01",
          "phase": "Cadrage",
          "name": "Brief identité et usages",
          "checklist": "Valeurs/cible",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 276
        },
        {
          "key": "AW-BRAND-LOGO-A02",
          "phase": "Recherche",
          "name": "Recherche visuelle et pistes",
          "checklist": "Références",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 277
        },
        {
          "key": "AW-BRAND-LOGO-A03",
          "phase": "Création",
          "name": "Créer concepts logo",
          "checklist": "Pistes",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 278
        },
        {
          "key": "AW-BRAND-LOGO-A04",
          "phase": "Création",
          "name": "Développer la piste retenue",
          "checklist": "Construction",
          "minutes": 90,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 279
        },
        {
          "key": "AW-BRAND-LOGO-A05",
          "phase": "Corrections",
          "name": "Cycles de corrections inclus",
          "checklist": "Ajustements",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 280
        },
        {
          "key": "AW-BRAND-LOGO-A06",
          "phase": "Livraison",
          "name": "Préparer exports et mini-guide",
          "checklist": "Formats",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 281
        }
      ]
    },
    {
      "code": "AW-DEVWP-FONCTION",
      "name": "Fonctionnalité WordPress sur mesure",
      "lot": "8A",
      "model": "Sur mesure",
      "unit": "fonctionnalité",
      "estimateRequired": true,
      "quantityRule": "Socle cadrage puis estimation",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 120,
      "sourceRow": 46,
      "notes": "Charge finale obligatoire",
      "actions": [
        {
          "key": "AW-DEVWP-FONCTION-A01",
          "phase": "Cadrage",
          "name": "Clarifier besoin fonctionnalité",
          "checklist": "Cas d'usage",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 406
        },
        {
          "key": "AW-DEVWP-FONCTION-A02",
          "phase": "Architecture",
          "name": "Analyser données, sécurité et intégrations",
          "checklist": "Technique",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 407
        },
        {
          "key": "AW-DEVWP-FONCTION-A03",
          "phase": "Estimation",
          "name": "Découper et estimer le développement",
          "checklist": "Charge complète",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 408
        }
      ]
    },
    {
      "code": "AW-APP-DEV",
      "name": "Application / logiciel métier sur mesure",
      "lot": "8A",
      "model": "Sur mesure",
      "unit": "application",
      "estimateRequired": true,
      "quantityRule": "Cadrage/estimation obligatoire ; aucun temps de dev automatique",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 180,
      "sourceRow": 51,
      "notes": "Ne jamais utiliser le socle comme estimation finale | Revue métier : Aucun temps de développement automatique : estimation détaillée obligatoire après cadrage.",
      "actions": [
        {
          "key": "AW-APP-DEV-A01",
          "phase": "Cadrage",
          "name": "Valider besoin et périmètre issu du cadrage",
          "checklist": "Fonctions",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 425
        },
        {
          "key": "AW-APP-DEV-A02",
          "phase": "Architecture",
          "name": "Préparer architecture et lots",
          "checklist": "Technique/données",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 426
        },
        {
          "key": "AW-APP-DEV-A03",
          "phase": "Estimation",
          "name": "Établir chiffrage détaillé du développement",
          "checklist": "Aucun temps de dev inventé",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 427
        }
      ]
    },
    {
      "code": "AW-WEB-PAGE-SUP",
      "name": "Page supplémentaire",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "page",
      "estimateRequired": false,
      "quantityRule": "Multiplier le plan par la quantité vendue",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 105,
      "sourceRow": 53,
      "notes": "1 unité = 1 page supplémentaire",
      "actions": [
        {
          "key": "AW-WEB-PAGE-SUP-A01",
          "phase": "Préparation",
          "name": "Préparer le contenu de la page",
          "checklist": "Objectif, contenu, position",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 23
        },
        {
          "key": "AW-WEB-PAGE-SUP-A02",
          "phase": "Production",
          "name": "Construire la page supplémentaire",
          "checklist": "Structure, modules, intégration",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 24
        },
        {
          "key": "AW-WEB-PAGE-SUP-A03",
          "phase": "Finalisation",
          "name": "Responsive de la page",
          "checklist": "Tablette et mobile",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 25
        },
        {
          "key": "AW-WEB-PAGE-SUP-A04",
          "phase": "Finalisation",
          "name": "Contrôle et SEO de base",
          "checklist": "Liens, titre, meta",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 26
        }
      ]
    },
    {
      "code": "AW-WEB-BLOG",
      "name": "Blog technique WordPress",
      "lot": "8A",
      "model": "Forfait actions",
      "unit": "option",
      "estimateRequired": false,
      "quantityRule": "1 option = 1 structure Blog",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 180,
      "sourceRow": 54,
      "notes": "Rédaction d'articles exclue",
      "actions": [
        {
          "key": "AW-WEB-BLOG-A01",
          "phase": "Cadrage",
          "name": "Définir structure éditoriale du Blog",
          "checklist": "Liste, article, catégories, archives",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 27
        },
        {
          "key": "AW-WEB-BLOG-A02",
          "phase": "Production",
          "name": "Configurer publication et archives",
          "checklist": "Page blog, catégories, pagination",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 28
        },
        {
          "key": "AW-WEB-BLOG-A03",
          "phase": "Production",
          "name": "Configurer modèle d'article",
          "checklist": "Gabarit et éléments globaux",
          "minutes": 45,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 29
        },
        {
          "key": "AW-WEB-BLOG-A04",
          "phase": "Finalisation",
          "name": "Responsive et contrôles",
          "checklist": "Mobile, liens, pagination",
          "minutes": 30,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 30
        },
        {
          "key": "AW-WEB-BLOG-A05",
          "phase": "Livraison",
          "name": "Mini prise en main publication",
          "checklist": "Créer/modifier un article",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 31
        }
      ]
    },
    {
      "code": "AW-LP-SECTION",
      "name": "Section standard supplémentaire",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "section",
      "estimateRequired": false,
      "quantityRule": "Multiplier par section supplémentaire",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 35,
      "sourceRow": 65,
      "notes": "Maximum 3 avant revue",
      "actions": [
        {
          "key": "AW-LP-SECTION-A01",
          "phase": "Cadrage",
          "name": "Définir rôle de la section",
          "checklist": "Objectif et position",
          "minutes": 5,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 85
        },
        {
          "key": "AW-LP-SECTION-A02",
          "phase": "Production",
          "name": "Construire la section supplémentaire",
          "checklist": "Module standard",
          "minutes": 25,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 86
        },
        {
          "key": "AW-LP-SECTION-A03",
          "phase": "Finalisation",
          "name": "Responsive et contrôle",
          "checklist": "Mobile",
          "minutes": 5,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 87
        }
      ]
    },
    {
      "code": "AW-LP-MERCI",
      "name": "Page de remerciement",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "page",
      "estimateRequired": false,
      "quantityRule": "1 option = 1 page de remerciement",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 60,
      "sourceRow": 68,
      "notes": "Page simple",
      "actions": [
        {
          "key": "AW-LP-MERCI-A01",
          "phase": "Production",
          "name": "Construire la page de remerciement",
          "checklist": "Message, CTA",
          "minutes": 40,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 93
        },
        {
          "key": "AW-LP-MERCI-A02",
          "phase": "Finalisation",
          "name": "Responsive et contrôle",
          "checklist": "Mobile, liens",
          "minutes": 20,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 94
        }
      ]
    },
    {
      "code": "AW-ECOM-PROD-SIMPLE",
      "name": "Produit simple supplémentaire",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "produit",
      "estimateRequired": false,
      "quantityRule": "Multiplier par produit simple",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 30,
      "sourceRow": 71,
      "notes": "Contenus fournis",
      "actions": [
        {
          "key": "AW-ECOM-PROD-SIMPLE-A01",
          "phase": "Catalogue",
          "name": "Préparer données produit",
          "checklist": "Titre, prix, image",
          "minutes": 5,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 121
        },
        {
          "key": "AW-ECOM-PROD-SIMPLE-A02",
          "phase": "Catalogue",
          "name": "Créer le produit simple",
          "checklist": "Stock, médias",
          "minutes": 20,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 122
        },
        {
          "key": "AW-ECOM-PROD-SIMPLE-A03",
          "phase": "Recette",
          "name": "Contrôler affichage et achat",
          "checklist": "Front/panier",
          "minutes": 5,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 123
        }
      ]
    },
    {
      "code": "AW-ECOM-PROD-VAR",
      "name": "Produit variable",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "produit",
      "estimateRequired": false,
      "quantityRule": "Multiplier par produit variable",
      "recurrence": "Ponctuel",
      "trigger": "Option explicitement achetée",
      "creditMinutes": 0,
      "referenceMinutes": 45,
      "sourceRow": 72,
      "notes": "Variations standard",
      "actions": [
        {
          "key": "AW-ECOM-PROD-VAR-A01",
          "phase": "Catalogue",
          "name": "Préparer attributs et variations",
          "checklist": "Attributs, prix",
          "minutes": 10,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 124
        },
        {
          "key": "AW-ECOM-PROD-VAR-A02",
          "phase": "Catalogue",
          "name": "Créer le produit variable",
          "checklist": "Variations",
          "minutes": 25,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 125
        },
        {
          "key": "AW-ECOM-PROD-VAR-A03",
          "phase": "Recette",
          "name": "Tester sélection et panier",
          "checklist": "Prix/stock",
          "minutes": 10,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 126
        }
      ]
    },
    {
      "code": "AW-CONT-INTEG-WP",
      "name": "Intégration WordPress",
      "lot": "8A",
      "model": "Quantité unitaire",
      "unit": "page/article",
      "estimateRequired": false,
      "quantityRule": "Multiplier par contenu",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 45,
      "sourceRow": 80,
      "notes": "Intégration seule",
      "actions": [
        {
          "key": "AW-CONT-INTEG-WP-A01",
          "phase": "Intégration",
          "name": "Préparer contenu et médias",
          "checklist": "Formats",
          "minutes": 10,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 270
        },
        {
          "key": "AW-CONT-INTEG-WP-A02",
          "phase": "Intégration",
          "name": "Mettre en page dans WordPress",
          "checklist": "Structure",
          "minutes": 25,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 271
        },
        {
          "key": "AW-CONT-INTEG-WP-A03",
          "phase": "Recette",
          "name": "Contrôler responsive et liens",
          "checklist": "Front",
          "minutes": 10,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 272
        }
      ]
    },
    {
      "code": "AW-CONT-PACK4-SEO",
      "name": "Pack 4 articles SEO",
      "lot": "8A",
      "model": "Pack quantité",
      "unit": "pack",
      "estimateRequired": false,
      "quantityRule": "Pack fixe 4 articles",
      "recurrence": "Ponctuel",
      "trigger": "Ligne vendue / Projet prévisionnel",
      "creditMinutes": 0,
      "referenceMinutes": 780,
      "sourceRow": 96,
      "notes": "Charge V1 13 h",
      "actions": [
        {
          "key": "AW-CONT-PACK4-SEO-A01",
          "phase": "Pack",
          "name": "Recherche mutualisée et calendrier des 4 sujets",
          "checklist": "Intentions",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 254
        },
        {
          "key": "AW-CONT-PACK4-SEO-A02",
          "phase": "Pack",
          "name": "Rédiger 4 articles",
          "checklist": "4 contenus",
          "minutes": 480,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 255
        },
        {
          "key": "AW-CONT-PACK4-SEO-A03",
          "phase": "Pack",
          "name": "Optimiser SEO et maillage",
          "checklist": "On-page",
          "minutes": 120,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 256
        },
        {
          "key": "AW-CONT-PACK4-SEO-A04",
          "phase": "Pack",
          "name": "Relecture et livraison",
          "checklist": "Cohérence",
          "minutes": 60,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 257
        }
      ]
    }
  ],
  "decisions": []
};

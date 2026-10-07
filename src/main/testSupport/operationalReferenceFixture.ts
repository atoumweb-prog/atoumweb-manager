import type { OperationalReference } from "../../shared/operational";
/** Fixed examples from the approved workbook + the two approved overlays; synthetic catalog identities only. */
export const operationalExamples: OperationalReference = {
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
      "code": "AW-TECH-PACK-3H",
      "name": "Pack interventions 3 h",
      "lot": "8B",
      "model": "Crédit temps",
      "unit": "pack",
      "estimateRequired": false,
      "quantityRule": "Crée un crédit de 3 h, pas des tâches",
      "recurrence": "12 mois",
      "trigger": "Ligne vendue / activation après acceptation",
      "creditMinutes": 180,
      "referenceMinutes": 0,
      "sourceRow": 90,
      "notes": "Consommé par interventions",
      "actions": []
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
    },
    {
      "code": "AW-MAINT-WP-M",
      "name": "Maintenance WordPress mensuelle",
      "lot": "8B",
      "model": "Récurrent",
      "unit": "abonnement",
      "estimateRequired": false,
      "quantityRule": "Routine mensuelle + interventions réelles",
      "recurrence": "Mensuel",
      "trigger": "Ligne vendue / activation après acceptation",
      "creditMinutes": 0,
      "referenceMinutes": 45,
      "sourceRow": 103,
      "notes": "2 interventions mineures/mois",
      "actions": [
        {
          "key": "AW-MAINT-WP-M-A01",
          "phase": "Maintenance",
          "name": "Vérifier sauvegarde et état général",
          "checklist": "Sauvegarde/alertes",
          "minutes": 15,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 173
        },
        {
          "key": "AW-MAINT-WP-M-A02",
          "phase": "Maintenance",
          "name": "Appliquer mises à jour courantes",
          "checklist": "Core/thème/plugins",
          "minutes": 20,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 174
        },
        {
          "key": "AW-MAINT-WP-M-A03",
          "phase": "Maintenance",
          "name": "Contrôler le front après mises à jour",
          "checklist": "Pages clés",
          "minutes": 10,
          "category": "Inclus au forfait",
          "required": true,
          "sourceRow": 175
        }
      ]
    }
  ],
  "decisions": [
    {
      "key": "AW-WEB-VITRINE-A16-REVUE-2026-10-04",
      "source": "Décision AtoumWeb validée le 04/10/2026",
      "actionKey": "AW-WEB-VITRINE-A16",
      "originalChecklist": "Liens, formulaires, navigation",
      "checklist": "Liens, formulaires, navigation ; contrôle du fonctionnement technique du mécanisme de consentement ; aucune validation juridique de conformité"
    },
    {
      "key": "AW-WEB-VITRINE-A19-REVUE-2026-10-04",
      "source": "Décision AtoumWeb validée le 04/10/2026",
      "actionKey": "AW-WEB-VITRINE-A19",
      "originalChecklist": "DNS si prévu, HTTPS, contrôle",
      "checklist": "DNS si prévu, HTTPS, contrôle ; création/vérification d’un point de restauration avant publication"
    }
  ]
};

# Décisions UX/UI V2 — registre initial

Statut : **DÉCIDÉ** sauf mention explicite. Ces exigences sont des cibles ; l'implémentation actuelle doit être vérifiée.

## Structure et interaction
| ID | Décision vérifiable |
|---|---|
| UX2-GEN-001 | Conserver tous les modules, sous-écrans et comportements métier actifs ; ne rien supprimer sans validation humaine explicite. |
| UX2-NAV-001 | Navigation principale compacte par icônes, menus contextuels, groupes et favoris personnalisables ; accès maintenu aux 17 entrées existantes. |
| UX2-NAV-002 | Un clic sur un dossier ouvre d'abord une fiche rapide ; commande **Agrandir** pour la fiche complète, contexte et onglet conservés. |
| UX2-LAY-001 | Disposition par défaut **liste + détail**, adaptée par module ; éditeurs techniques et CGV autorisés à utiliser une mise en page spécialisée. |
| UX2-LAY-002 | Persister automatiquement dispositions, colonnes, ordres, largeur/visibilité des panneaux, filtres/vues définis ; préférences par écran avec retour aux défauts. |
| UX2-LAY-003 | Les préférences d'interface n'enregistrent jamais un formulaire métier. |
| UX2-HELP-001 | Aide `?` courte, détaillée au clic et, si activée, au survol prolongé ; réglable, accessible au clavier. |
| UX2-VIS-001 | Échelle typographique par densité : cible de texte principal **Compact 14 px**, Confort 16 px, Confort+ 18 px ; conserver trois thèmes et trois densités et vérifier lisibilité/contrastes au rendu. |
| UX2-VIS-002 | Identité AtoumWeb, piste visuelle de triangles imbriqués ; logo final à valider séparément. |
| UX2-VIS-003 | **Arbitrage E01 validé le 09/10/2026** : le code Compact est actuellement à 15 px et doit viser **14 px** en V2, sans baisser les modes Confort (16 px) ni Confort+ (18 px). Texte secondaire et petit texte au minimum 14 px, hauteurs de contrôles 36/42/48 px conservées à ce stade ; recette visuelle requise avant livraison. |
| UX2-DATA-001 | Tout éditeur métier suit les modifications non sauvées ; signal discret et protection de toute sortie destructive. |
| UX2-DATA-002 | Lorsque l'éditeur sait enregistrer : **Enregistrer et quitter**, **Continuer la modification** (choix sûr initial), **Quitter sans enregistrer** ; quitter seulement après succès vérifié. |
| UX2-DATA-003 | Les validations métier, publications, clôtures et destructions demandent leurs contrôles spécifiques ; enregistrer un brouillon ne publie rien. |
| UX2-DATA-004 | Conflits concurrents, lectures asynchrones tardives, rafraîchissements parent/enfant et fenêtres détachées ne doivent pas effacer silencieusement les brouillons. |
| UX2-DATA-005 | La garde commune s'appuie sur la sécurisation UX-01 existante une fois intégrée ; aucun second registre concurrent. |

## Commercial et contrats
| ID | Décision vérifiable |
|---|---|
| UX2-CAT-001 | Catalogue commun et administrable : offres, formules, services, catégories, prix, textes, liens métiers, aides et historique. |
| UX2-CAT-002 | Afficher d'abord les offres principales (site vitrine, e-commerce, mariage, maintenance), puis les services complémentaires par catégorie et ordre alphabétique FR. |
| UX2-CAT-003 | Une seule catégorie principale par prestation ; mots-clés de recherche et associations multiples avec les offres autorisées. |
| UX2-CAT-004 | La recherche privilégie noms, besoins, descriptions, bénéfices ; codes Abby secondaires mais toujours recherchables par référence exacte. |
| UX2-CAT-005 | Même catalogue en Prospection pour identifier les besoins et en Devis pour ajouter les lignes vendues ; affichage adapté au contexte. |
| UX2-CAT-006 | Première ligne/offre du devis priorise suggestions cohérentes ; accès permanent au catalogue complet. |
| UX2-CAT-007 | Besoin identifié ≠ suggestion ≠ service acheté ; aucun achat, calcul de prix, clause ou blueprint implicite. |
| UX2-CAT-008 | Administration : créer, modifier, dupliquer, publier, désactiver, archiver, restaurer ; suppression uniquement sans dépendance historique protégée. |
| UX2-CAT-009 | Nouveaux prix/conditions sous nouvelle version, sans réécriture des devis finalisés ou acceptés. |
| UX2-CAT-010 | Fiches d'aide à la vente éditables : utilité, bénéfices, quand proposer, questions, arguments, vigilances, inclusions/exclusions. |
| UX2-CON-001 | Chaque offre/formule/service dispose d'un onglet **Contrat & CGV** : consulter, créer, associer, modifier les clauses depuis la fiche. |
| UX2-CON-002 | Source contractuelle unique : bibliothèque de types, CGV communes, clauses spécifiques et versions ; la fiche commerciale gère des références, pas des copies divergentes. |
| UX2-CON-003 | Avant publication vendable, vérifier le périmètre contractuel requis, les inclusions/exclusions et la compatibilité des références ; validation juridique humaine distincte. |
| UX2-CON-004 | Assemblage des seules prestations achetées : socle commun et modules spécifiques classés **par rubriques sémantiques**, non simplement concaténés par produit. |
| UX2-CON-005 | Classement configurable, conditions d'application, gestion des doublons exacts, signalement des collisions/contradictions, numérotation et renvois stables. |
| UX2-CON-006 | Texte client clair, homogène, sans codes Abby/IDs internes ni placeholders ; prévisualisation du document final et simulation avant publication du service. |
| UX2-CON-007 | Builder : aperçu sommaire/document/alertes ; copie propre pour Abby ; PDF et Word, réimport contrôlé et versionné lorsque le document est éditable. |
| UX2-CON-008 | Contrat intégré au devis ; preuve d'acceptation gérée dans le parcours officiel Abby. Snapshots et documents acceptés immuables. |

## Production, finances, intégrations
| ID | Décision vérifiable |
|---|---|
| UX2-PRO-001 | Projet prévisionnel avant acceptation, même projet réconcilié et figé selon la décision commerciale, sans doublon ni démarrage de production implicite. |
| UX2-PRO-002 | Navigation Projet couvre commercial, prérequis, accès, sites/pages, compositions, tâches, ressources, temps, bibliothèque et opérations. |
| UX2-PRO-003 | Blueprint lié aux prestations achetées, application volontaire et idempotente, jamais d'effacement du travail existant. |
| UX2-BRG-001 | Bridge prévu dans Projet et dans Sites autonome ; boutons actifs seulement si capacité réelle vérifiée. Workbench et production séparés ; publication contrôlée humaine. |
| UX2-TIM-001 | Un seul chrono global, associé à la bonne activité et récupérable après navigation. |
| UX2-MNT-001 | Pour nouveaux abonnements vendus : périodes date à date depuis démarrage réel, indépendantes de la facturation ; quotas sans report ; historique préservé. |
| UX2-BIL-001 | Manager prépare/suit ; Abby émet le devis/facture officiels ; PDFs/références importés, pas de comptabilité fictive. |
| UX2-DOC-001 | Document éditable : export Word, réimport comparé, validation explicite, version ; document figé/preuve jamais écrasé. |
| UX2-LIB-001 | Réutilisation technique par copie indépendante, adaptation humaine et provenance ; aucun changement silencieux de la source. |
| UX2-SAF-001 | Sauvegardes métier ≠ véritable sauvegarde/restauration workspace ; protections des données et des fichiers. |

## Arbitrages encore ouverts (pas des décisions)
| Sujet | Point à trancher / vérifier |
|---|---|
| Design tokens exacts | **E01 tranché** (Compact cible 14 px, Confort 16 px, Confort+ 18 px) ; restent à valider contrastes mesurés, exceptions CSS, espacements détaillés et logo définitif. |
| Sauvegarde automatique des vues | Portée locale vs workspace/utilisateur ; comportement en cas de conflit entre fenêtres ou réinitialisation. |
| Garde de sortie | Stratégie technique précise pour les éditeurs ne disposant pas d'un `save()` synchrone ou dans le cycle Electron ; UX-01 doit faire foi après fusion. |
| Contrats | Vocabulaire réel des rubriques et ordre de référence final à aligner avec les clauses juridiquement validées ; cas des incompatibilités non résolues. |
| Catalogue | Nomenclature exacte des catégories et des offres/formules à reprendre de la BDD sans supprimer de données historiques. |
| Service manuel | UX-02 : alignement des nouveaux abonnements manuels avec les règles vendues, sans migration implicite. |
| Interventions | Réouverture, états intermédiaires et cas d'échec ; ne pas inventer de transitions. |
| Bridge | Capacités actuelles à constater à la version déployée ; publication finale non présumée livrée. |
| Statistiques/exports | Encaissements et exports éventuels à qualifier : prévu vs disponible. |

Décisions nouvelles : proposer modification par PR et demander arbitrage si cela change une règle métier, une obligation contractuelle ou une action destructive.

## Note de vérification pour l'aide contextuelle (écart E05, 09/10/2026)
Le CSS actuel `src/renderer/ui-consistency-v2.css` masque intégralement les `.field-help` lorsque `.app-shell.help-disabled` est actif. Cela **ne doit pas devenir** le comportement V2 : l'option utilisateur ne désactive que le survol automatique, **jamais le point d'interrogation activable au clic/clavier**. Cette différence est déjà couverte par UX2-HELP-001 et documentée dans [Lot 01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md). Correction non codée.

## Vérifications de conception — Lot 01C (09/10/2026)
- **DÉCIDÉ** : premier clic = fiche rapide ; **Agrandir** = même dossier dans une vue complète ; liste+détail par défaut, ateliers spécialisés admis ; réglages de disposition mémorisés automatiquement par vue (UX2-NAV-002, UX2-LAY-001/002/003).
- **À VÉRIFIER, pas un nouvel arbitrage métier** : E08 portée (poste/workspace/profil) de la persistance ; E09 adaptation desk/overlay/fullscreen sans re-écriture des moteurs existants ; E10 contraintes largeur/accessibilité ; E11 protections des éditeurs Clients/Catalogue/Projets/Opérations non couvertes universellement par #83.
- **Recette impérative** : réduire/agrandir, changer de dossier, cliquer hors fiche, Échap, redimensionnement clavier/pointeur, revenir après redémarrage, fenêtre étroite et conservation du brouillon. La protection n'est pas présumée acquise pour tous les modules tant que l'implémentation n'est pas vérifiée.
- Détails : [Lot 01C](LOT-01C-FICHES-PANNEAUX.md).

## Proposition opérationnelle hors arbitrage UX — CI GitHub Actions
Le rapport Codex MSI recommande un runner Windows hébergé par GitHub pour éviter la dépendance au MSI. Le dépôt contient `.github/workflows/ci.yml` avec `runs-on: [self-hosted, Windows, X64]` et un `package-lock.json`. **Statut : recommandé / décision AtoumWeb encore ouverte**. En cas d'accord explicite, PR technique isolée, `npm ci`, deux workers et vérification des CI avant fusion, sans toucher aux données réelles. Détails : [CI-GITHUB-ACTIONS.md](CI-GITHUB-ACTIONS.md).

## Lot 01E — Spécification traçable (09/10/2026)
**DÉCIDÉ :** préserver le registre UX-01 de #83 lors de l'intégration, pas de système parallèle ; affichage `modifié / enregistrement en cours / erreur / conflit / enregistré` uniquement selon un résultat réel. **DÉCIDÉ comme cible V2, non livré :** ajouter « Enregistrer et quitter » seulement quand **le formulaire concerné peut valider/sauver de façon certaine** ; « Continuer la modification » reste le défaut sûr et « Quitter sans enregistrer » une sortie explicitement destructive. **Ne jamais assimiler cette action à la finalisation d'un devis, publication contractuelle ou publication Bridge.**

**À INSTRUIRE (E17–E22) :** protocole async compatible avec dialogue natif synchrone et tickets multi-fenêtres ; capacité de sauvegarde par section, gestion de baselines/conflits, type de dialogue, éditeurs non encore raccordés, récupération après crash **hors scope**. [Cahier des charges 01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

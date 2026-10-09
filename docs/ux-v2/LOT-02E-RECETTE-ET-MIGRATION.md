# Lot 02E — Intégration contrôlée et recette transverse Navigation / Accueil

**Statut : plan de validation, non exécuté.**
**Référence de comparaison : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.** Les modifications du code de production sont exclues de la présente PR documentaire.
**Sources normatives :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [matrice existant/cible](LOT-02-MATRICE-EXISTANT-CIBLE.md), [02A](LOT-02A-RAIL-NAVIGATION.md), [02B](LOT-02B-ENTETE-RACCOURCIS.md), [02C](LOT-02C-RECHERCHE-ROUTAGE.md), [02D](LOT-02D-ACCUEIL-PILOTAGE.md), [Lot 01 — fondations](LOT-01-FONDATIONS.md).

## 1. Porte de passage vers le développement
Avant d'écrire du code, Codex devra :
- Relever **les nouveaux SHAs et statuts de PR** #80 (audit), #81 (backup/restauration), #82 (référentiel V2), #83 (UX-01), #84 (CI) ; ne présumer **aucune fusion**.
- Garantir **le registre de brouillons unique** d'UX-01 #83 s'il est intégré ; en cas de conflit avec #81, préserver également les protections de restauration/SQLite. Une validation simulée ne suffit pas à remplacer le code fusionné.
- Fixer **E42 = option A** : rail réduit « Accueil + favoris + cinq groupes » ; le mode déployé garde les 17 modules.
- **E59 : « Conversion » et « Finalisation » définies et validées par AtoumWeb** : historique réel des Clients convertis ; accord de principe en attente de signature. Restent à trancher **le marqueur technique Finalisation**, la projection de `new` et la période de l'historique avant de coder le pipeline à sept colonnes.
- Disposer d'un atelier de démonstration **sans IPC de mutation et sans accès à Validation-MSI**, selon [01F](LOT-01F-PREFERENCES-RECETTE.md).
- Ne pas confondre la CI lancée sur #84 (**run #549 en échec sur trois timeouts**) avec un résultat déjà passé de la V2. Les tests locaux peuvent diagnostiquer mais ne remplacent pas un run hébergé vert.

## 2. Ordre de migration après accord humain
| Incrément | Portée bornée | Critères de non-régression |
|---|---|---|
| **02E.0** Baseline | Captures/composants, parcours, clavier, tests existants, inventaire événements | États avant/après, horodatage, environnement/SHAs |
| **02E.1** Rail (02A) | Passage de sidebar 258/0px à rail option A + groupes/favoris ; clés `NAV_ITEMS` inchangées | 17 modules atteignables, préférences, nav directe et garde |
| **02E.2** En-tête (02B) | Version compacte, chrono/recherche toujours accessibles, bandeau Bibliothèque distinct | Une session chrono, modal récupération/arrêt intacte |
| **02E.3** Recherche/routage (02C) | Contrat typé, pilote Catalogue ID, erreurs et anti-races, adaptateurs événements | Bon dossier, refus UX-01 sans perte de saisie, aucun faux succès |
| **02E.4** Accueil (02D) | Priorités/alertes, actions honnêtes, widgets ; pipeline seulement après E59 | Calculs sources inchangés, alertes et liens vrais, pas de statut neuf |
| **02E.5** Recette transverse | 3 thèmes × 3 densités, petites fenêtres, clavier, smoke + suite complète | Échecs transparents et reproductibles, plan de rollback |
| **02E.6** Validation humaine | Comparatif visuel/ergonomique, problèmes résiduels et impacts métier | Aucun merge sans accord d'AtoumWeb |

Les incréments sont **réversibles** et doivent conserver les modules non migrés. Les widgets, favoris et colonnes utilisent le magasin de **préférences visuelles** défini au Lot 01F, jamais un autosave de données métier.

## 3. Matrice de vérification transverse
| Domaine | Exercice intégré | Condition impérative |
|---|---|---|
| Navigation 17 modules | Rail réduit option A, menus groupes, favoris, mode déployé | Tous les modules atteignables, aucun clic sur groupe n'ouvre un module au hasard |
| Boutons et focus | Tab/Shift-Tab, flèches, Entrée/Espace, Escape | Focus visible, action libellée, aucun raccourci inopiné dans les champs |
| Recherche globale | 14 types de résultat, alias Prospection, ID précis | Aucune route `catalog` vers simple page ; `default` inconnu ne mène plus à Clients |
| Navigation dirty | Prospect/Devis/édition ; groupe/fiche/onglet | Garde UX-01 **avant** remount ; « Rester » préserve valeurs, filtre, focus |
| Référence hors #83 | Clients, Catalogue, Projets, Opérations | **Non prétendues universellement sécurisées** avant leurs propres raccordements |
| Chrono | En cours, pause, arrêt, récupération, changement de module | Chrono unique ; repli en-tête ne modifie ni session ni motif |
| Accueil | Aujourd'hui, KPI, pipeline 7 étapes, alertes, actions rapides | Navigation des objets correcte, statut/compteur vérifiable, pas de donnée inventée |
| Échec services | Erreur recherche, erreur de l'une des huit sources Accueil, réponse tardive | Pas de faux succès, pas de disparition d'alerte, retry possible |
| Préférences | Rail, favoris, header, widgets | Restauration par contexte, reset spécifique, aucun impact données |
| Lisibilité | AtoumWeb / Noir / Blanc × Compact 14px / Confort 16 / Confort+ 18 | Neuf combinaisons, textes fonctionnels ≥14px, zoom/720px |
| Intégration CI | PR dédiée + qualité du code intégré | Run GitHub réellement exécuté, typecheck et suite sans échec ; pas d'assimilation aux tests locaux |
| Sécurité/stockage | Fixtures temporaires, périmètre workspace | Validation-MSI intacte, aucune donnée client modifiée par atelier |

## 4. Recette « parcours de bout en bout » — non exécutée
| ID | Parcours | Résultat requis |
|---|---|---|
| R02E-01 | Accueil → Aujourd'hui → Prospect → Agrandir → retour Accueil | Même identité, historique/onglet appropriés, aucune perte de champ |
| R02E-02 | Accueil → KPI relances → pipeline Prospect | Bonne population et filtre de relances, compteur expliqué |
| R02E-03 | Rail A réduit → groupe Commercial → Devis | Devis ouvert, favoris inchangés, rail accessible |
| R02E-04 | Épingler Offres & Tarifs → relancer → recherche produit | Favori persistant, résultat ouvre **l'article ID**, non simple liste |
| R02E-05 | Devis sale → recherche Projet → choisir « Rester » | Aucune navigation, même brouillon Devis, requête réutilisable |
| R02E-06 | Devis sale → quitter sans enregistrer après confirmation | Éditeur proprement abandonné dans périmètre confirmé, autre brouillon préservé |
| R02E-07 | Changer module pendant chrono en cours | Une seule session persistante, timer/motif non altérés |
| R02E-08 | Réduire header pendant modal récupération chrono | Modal et choix encore accessibles, aucune récupération forcée |
| R02E-09 | Pipeline avec Prospect `new`, `won`, `lost` | Comptage E59 explicitement vérifié, aucune perte/erreur de conversion |
| R02E-10 | Masquer widget « À surveiller » avec alerte critique | Alerte critique encore visible/atteignable |
| R02E-11 | Échec chargement alertes et réussite KPI | Accueil n'affiche pas « Tout est à jour » comme vérité |
| R02E-12 | Créer depuis bouton « + Devis » | Ouvre véritable formulaire **ou libellé de navigation modifié**, aucun devis créé avant save |
| R02E-13 | Code projet/focus dans éditeur + raccourcis UI | La frappe n'ouvre ni recherche ni rail accidentellement |
| R02E-14 | Basculer trois thèmes × trois densités + zoom | Aucun contrôle invisible, contraste/typographie corrects |
| R02E-15 | Ouvrir recherche et vider le texte pendant appel async | Résultat périmé n'apparaît pas à nouveau |
| R02E-16 | Cliquer sur entrée de recherche supprimée | Erreur explicite, aucune fiche voisine ni message « ouvert » |
| R02E-17 | Accueil mis à jour depuis intervention en cours | Indicateurs mis à jour, pas de session chrono doublée |
| R02E-18 | Réinitialiser la disposition Accueil | Widgets restaurés, **aucun changement métier** |
| R02E-19 | Aller de Bibliothèque vers Contrats puis revenir | Événements `atoumweb:*`, header Bibliothèque et cible persistée correctement |
| R02E-20 | Rejouer les tests ciblés et complets dans un workspace temporaire | Typecheck, suite et UI vérifiés sur **SHA de livraison**, aucune migration non prévue |

## 5. Format obligatoire du bilan Codex (futur)
`SHA base | branche/PR | modules effectivement modifiés | trajectoire état → cible | tests réellement exécutés | cas non couverts | anomalies/risques | captures 3×3 | incident/rollback | avis humain`.

- Un test **à venir** dans ce document n'est pas une validation réalisée.
- Les 17 modules doivent rester listés comme couvertures **partielles** tant que leurs vraies interactions n'ont pas été auditées puis migrées par lots métier.
- Une CI Windows qui échoue sur des **timeouts**, comme #84 au premier run, appelle un diagnostic de la fixture et du runner, pas une hausse arbitraire des timeouts de toute la suite.

## 6. Restes de conception et décisions
- **E42 clos** : option A validée, pas de nouvelles questions A/B.
- **E59 : décisions métier closes pour Conversion et Finalisation**. Restent ouverts le marqueur technique d'accord de principe, la projection de `new` et la période du compteur historique. Ne pas bloquer les travaux du Lot 02 qui ne dépendent pas de ce mapping.
- Les E08/E17/E23 (portée des préférences, gestion des brouillons, sauvegarde contrôlée) sont traités par les fondations et l'intégration réelle de #83.
- E51–E58 (routage/async) et E60–E65 (Accueil) doivent être inspectés/testés dans leur code d'exécution, ne pas inventer une migration silencieuse.

**Le Lot 02 est intégralement spécifié par 02A–02E mais pas développé. Passage au Lot 03 CRM uniquement après validation documentaire des décisions métier encore ouvertes.**

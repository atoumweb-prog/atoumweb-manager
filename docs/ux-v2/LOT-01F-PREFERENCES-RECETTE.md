# Lot 01F — Préférences, atelier UX isolé et recette transversale des fondations

**Statut : spécification de conception, non implémentée.**  
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.**
**Références :** [Lot 01](LOT-01-FONDATIONS.md), [01A](LOT-01A-TOKENS-VISUELS.md), [01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md), [01C](LOT-01C-FICHES-PANNEAUX.md), [01D](LOT-01D-TABLEAUX-VUES.md), [01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. But
Clore les fondations communes avec **des préférences réellement persistées**, un **laboratoire de démonstration strictement isolé** et une recette couvrant les 3 thèmes × 3 densités, les écrans pilotes, le clavier, les erreurs, les brouillons, les redimensionnements et les fenêtres.

**Ce sous-lot n'est pas la refonte des 17 modules.** Il définit les outils transversaux et la porte de sortie vers les lots métiers.

## 2. État actuel vérifié sur le code
| Source | Réalité présente | Limite/cible |
|---|---|---|
| `src/shared/contracts.ts` — `BootstrapState` et `settings.setTheme/setDisplayDensity/setShowHoverHelp` | API typée de trois préférences | **Ne pas casser les clés** ; ajouter des préférences de vue seulement après inspection du service de stockage |
| `src/renderer/App.tsx` — `applyTheme`, `applyDensity`, `updateShowHoverHelp` | Thème/densité appliqués à `documentElement.dataset`, préférences chargées à démarrage par `getBootstrap()` | Préserver les valeurs après relance, contrôler échec d'enregistrement ; ce fichier n'est pas une preuve du stockage physique exact |
| `SettingsPage` dans `App.tsx` | Choix thèmes, densités, bascule d'aide au survol, workspace, sauvegarde/restauration base | Séparer préférences visuelles et actions **métier/sécurité** ; ne pas transformer la restauration DB en option anodine |
| `src/renderer/ui-consistency-v2.css` | `.help-disabled .field-help { display:none !important; }` | Écart E05 : la V2 **conserve le ? activable au clic et clavier** même si la survenue automatique est désactivée |
| `src/renderer/workflow/DemoPanel.tsx` | Boutons « Créer un parcours test complet » et « Réinitialiser les données de test » appellent **`window.atoumweb.workflow.createDemo()` et `resetDemo()`** ; enregistrements marqués `demo`, backup avant reset signalé | **Ne pas réutiliser ce DemoPanel comme atelier visuel inoffensif** : il déclenche de vraies actions IPC sur le workspace actif |
| `src/renderer/crm/GlobalSearch.tsx` | Recherche async avec clavier et réponse différée | Les tests UX doivent vérifier le retour au bon dossier et l'absence d'écrasement d'une édition en cours |
| `scripts/run-tests.cjs` | Exécute Vitest dans Electron avec `ELECTRON_RUN_AS_NODE=1` | Les tests Node ne constituent **pas** une recette graphique de l'application ou du MSI |
| `.github/workflows/ci.yml` | `quality` sur runner Windows self-hosted non disponible dans le bilan de #83 | Proposition distincte de migration GitHub-hosted (voir [CI-GITHUB-ACTIONS.md](CI-GITHUB-ACTIONS.md)), aucune modification CI dans 01F |

## 3. Préférences : catégories séparées
| Catégorie | Exemples | Sauvegarde V2 | Gouvernance |
|---|---|---|---|
| **Apparence** | thème, densité (Compact **14 px**, Confort 16, Confort+ 18), aide automatique | Immédiate après confirmation IPC ; retour d'erreur visible | Préserver noms et valeurs typés actuels |
| **Disposition** | largeur de panneau, liste/fiche, colonnes visibles/ordre/largeurs, tri, filtre, vue active, favoris | Automatique, bornée/débouncée si redimensionnement | Clé `module/vue/version` stable, reset ciblé |
| **Confort d'utilisation** | aide courte/détaillée, ouverture de panneaux, préférence de barre de navigation | Automatique quand c'est strictement présentation | Désactivation du survol **ne masque pas** aide explicite |
| **Données métier** | contact Prospect, lignes Devis, clauses, projet, intervention, factures | **Jamais** via le magasin de préférences | Enregistrement explicite et garde UX-01 |
| **Sécurité/opérations** | workspace, restauration SQLite, publications WP, suppression | **Jamais** implicite | Confirmation, droits, vérification des effets et protections natives |

### 3.1 Contrat de stockage conceptuel
- Portée à confirmer : application/poste, **workspace**, ou profil ; ne pas supposer une synchronisation cloud.
- Chaque valeur connue a un schéma/version, format et domaine validés ; ignorer/normaliser les anciennes clés incompatibles.
- La restauration d'une préférence ne peut pas rouvrir un dossier étranger au workspace courant ni exposer d'informations sensibles.
- Ne pas écrire à chaque pixel de déplacement de souris ; persister à la fin d'un geste ou par délai maîtrisé, sans interférer avec l'éditeur.
- En échec de sauvegarde de préférence, afficher le problème sans prétendre que la configuration sera conservée après redémarrage.
- Action **Réinitialiser cette vue** distincte de **Réinitialiser tous les réglages d'affichage** et surtout de **Réinitialiser des données de démonstration**.
- Restauration des paramètres visuels : aucune suppression SQLite, transaction Devis, certificat ou fichier client.

## 4. Atelier isolé : exigence forte, indépendante du DemoPanel existant
**Constat critique :** `DemoPanel` existant utilise `workflow.createDemo` / `workflow.resetDemo` et n'est **pas** un simulateur d'interface purement statique. On peut le conserver pour les parcours de démo métier **uniquement dans un workspace isolé et explicitement autorisé**, mais il ne doit pas être utilisé pour la recette visuelle du socle sur des données réelles.

### Mode recommandé pour le banc UX
- Composants rendus dans un **environnement ou entrée de démonstration autonome** ; fixtures React/TS synthétiques en mémoire, **aucun appel à `window.atoumweb` qui écrive des données**.
- Fournir boutons, champs, icônes, aide, alertes, liste + panneau redimensionnable, table configurée, éditeurs simulés `clean/dirty/pending/error/conflict`, états vides/chargement/erreur, et un faux mécanisme de sauvegarde explicitement identifié comme simulation.
- Données fictives sans identifiants personnels ni secrets ; le dossier Validation-MSI **reste fermé et intact**.
- Si une recette native spécifique nécessite IPC/SQLite, utiliser une **fixture temporaire dédiée** avec une identité de workspace/DB explicite et des contrôles de suppression, **jamais** Validation-MSI ou un vrai dossier clients.
- Les prévisualisations de code HTML/CSS/JS suivent sandbox/CSP existants ; pas d'exécution arbitraire de JS stocké par défaut.

## 5. Matrice transversale de recette
| ID | Exercice | Critère attendu |
|---|---|---|
| R01F-01 | Démarrer les trois thèmes et trois densités | 9 combinaisons avec bonnes variables et contrastes, sans erreur |
| R01F-02 | Mode Compact | Texte principal **14 px cible**, texte utile pas sous 14 px, contrôles fonctionnels |
| R01F-03 | Changer thème/densité puis relancer | Valeurs appliquées et restituées, sans changer aucune donnée métier |
| R01F-04 | Désactiver l'aide automatique | `?` reste visible, clic/clavier disponibles, aucun survol automatique |
| R01F-05 | Changer largeur de panneau puis relancer | Largeur restaurée pour le bon module, reset ciblé indépendant |
| R01F-06 | Réordonner colonnes, trier, filtrer et rouvrir vue | Configuration de présentation restaurée, pas d'écriture métier |
| R01F-07 | Conserver éditeur `dirty` pendant agrandir/réduire | Brouillon intact et contexte préservé |
| R01F-08 | Naviguer avec brouillon `dirty` | Garde UX-01 appropriée, « Rester » conserve la saisie |
| R01F-09 | Simuler `pending`, erreur et conflit | Aucun faux « Enregistré », aucune sortie destructive |
| R01F-10 | Essayer « Enregistrer et quitter » sur formulaire incapable | Option absente/désactivée, sécurité maintenue |
| R01F-11 | Fenêtre étroite, zoom, panneau déplacé | Actions retrouvables, pas de zone coupée ou invisible |
| R01F-12 | Clavier seul : Tab/Shift-Tab, flèches séparateur, Entrée/Espace, Escape | Ordre de focus correct, pas de sortie destructive par erreur |
| R01F-13 | Notifications et confirmations critiques | Succès seulement sur retour réel, annulation sans mutation |
| R01F-14 | Deux fenêtres avec modifications concurrentes | Garde native cohérente, aucune fenêtre perdue |
| R01F-15 | Tester une sauvegarde visuelle échouée | Échec signalé, pas de confirmation fictive de persistance |
| R01F-16 | Lancer atelier visuel isolé et inspecter les appels | **Zéro action IPC créant/réinitialisant le `DemoPanel`** et zéro donnée réelle modifiée |
| R01F-17 | Exécuter typecheck, tests ciblés + complets sur fixture | Résultats horodatés, identifiants SHA, échecs documentés |
| R01F-18 | Comparer 17 entrées de navigation non migrées | Aucune entrée ou commande ancienne supprimée par CSS global |
| R01F-19 | Tester les 3 corrections de #83 | Archivage Prospect, suppression de ligne Devis, réduction de section sans perte de draft |
| R01F-20 | Test GitHub Actions après accord CI | Run `quality` réellement exécuté et résultat vérifié ; local ≠ CI |
| R01F-21 | Vérifier isolation des sauvegardes et workspace | Aucune écriture Validation-MSI, aucune restauration réelle déclenchée par atelier |
| R01F-22 | Faire une revue humaine sur captures/rendu des neuf modes | Anomalies et validations consignées, aucune « conformité » prétendue sans preuve |

**Ces tests ne sont pas exécutés par l'écriture de ce document.** Les contrôles spécifiques à un module seront répétés lors de sa migration (Lots 02–10).

## 6. Ordre de réalisation
| Étape | Actions | Livrable |
|---|---|---|
| 01F.1 | Relever HEAD, PR #81/#83 et API des préférences réellement stockées | Carte settings IPC/stockage, sans hypothèse |
| 01F.2 | Trancher la portée des vues et schémas de migration (E08/E12) par inspection | Contrat versionné et reset |
| 01F.3 | Créer atelier UX **non connecté à createDemo/resetDemo** et ses jeux d'états | Démo statique autonome, tests des appels interdits |
| 01F.4 | Connecter composants 01A–01E et préférences d'affichage dans atelier | Scénarios et instrumentation |
| 01F.5 | Réaliser la recette 3 thèmes × 3 densités, clavier, fenêtrage, erreurs, redimensionnements | Matrice 22 scénarios avec preuves |
| 01F.6 | Produire bilan, écarts, risques de migration des 17 modules ; revue humaine | PR d'implémentation et validation avant Lot 02 |

## 7. Conditions de sortie Lot 01 entier
- Sous-lots **01A–01F réellement développés et recettés**, pas seulement documentés.
- Dépendances UX-01 #83 et UX-03/UX-16 #81 correctement intégrées et vérifiées lorsque requises.
- Aucune action de l'atelier n'utilise un vrai workspace ou les APIs de mutation `DemoPanel`.
- Les composants communs n'introduisent aucune mutation métier ni système de garde concurrent.
- Suite complète, contrôles UI/natifs pertinents, neuf combinaisons thème/densité, clavier et retour à la taille réduite ; preuve datée et SHA.
- Portée de sauvegarde des dispositions déterminée, vue personnalisée réinitialisable, erreur IPC testée.
- Une revue humaine confirme la cohérence de l'atelier avant toute migration des vrais écrans métier.

## 8. Points restant ouverts
- **E23 — Stockage réel des préférences** : vérifier service et dossier et isoler chaque workspace avant mise en œuvre ; la seule API renderer ne le prouve pas.
- **E24 — Mode de livraison de l'atelier** : build autonome/test harness sans exposition à la production et aucun effet destructif.
- **E25 — Épreuves visuelles** : définir tailles de fenêtres/supports et preuves minimales comparables pour chaque thème/densité ; hors tests Node.
- **E26 — Stratégie de migration** : ordre exact des pilotes, prioriser modules à plus haut risque de brouillons et CSS.
- **E27 — Statut de CI** : la PR technique runner est indépendante du présent document ; ne pas déclarer la CI opérationnelle sans run vert.

**Spécification prête à faire l'objet d'une future tâche Codex après validation des dépendances, pas autorisation de code.**

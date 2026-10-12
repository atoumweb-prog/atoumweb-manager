# UX/UI V2 — Lot 01A — Revue visuelle des captures du 10/10/2026

**Archive reçue :** `uxv2-01a-captures-20261010-031113.zip` (fournie par l'utilisateur, non versée au dépôt GitHub). **54 images PNG** de **2244 × 1434 px** : 6 noms de vues × 3 thèmes AtoumWeb / Noir / Blanc × 3 densités Compact / Confort / Confort+. Analyse des images réelles effectuée le 10/10/2026. **Statut : revue visuelle NON VALIDABLE en raison d'un décalage récurrent entre le nom du PNG et le contenu affiché.**

## 1. Défaut de la preuve visuelle (bloquant)

Sur plusieurs combinaisons de thèmes et de densités, l'écran **photographié correspond à la navigation précédente** :

| Nom du fichier / intention | Contenu réellement visible dans les captures concernées |
|---|---|
| `…-Accueil.png` | Réglages (avec, pour certains premiers passages, un état de chargement transitoire) |
| `…-Prospection.png` | Accueil |
| `…-Devis.png` | Prospection |
| `…-Projets.png` | Devis |
| `…-Interventions___Maintenance.png` | Projets |
| `…-R_glages.png` | Interventions & Maintenance |

**Exemple certain :** `atoumweb-comfort-Prospection.png` montre l'en-tête et le tableau de bord **Accueil** ; `atoumweb-comfort-Devis.png` montre l'en-tête **Prospection** ; `atoumweb-comfort-Projets.png` montre **Devis**. Des captures nommées `Accueil` montrent `Réglages`. Le décalage se reproduit largement dans les trois thèmes ; les détails des premiers passages varient. **Ne pas affirmer que les 54 fichiers sont tous décalés** sans classification pixel exacte. L'archive est **non fiable pour certifier chaque écran nommé**.

**Les couleurs/densités affichées peuvent également correspondre à l'état visuel de l'image précédente**. Cela ne prouve pas une défaillance de persistance dans l'application : la recette automatisée React/IPC précédente contrôlait bien les attributs DOM et les préférences côté service. Elle **ne vérifiait pas les pixels du framebuffer**.

### Cause technique plausible et distinction importante

Le banc `scripts/check-ux-v2-lot01a-real-ui.cjs` attendait la **navigation React/DOM**, puis appelait immédiatement `win.webContents.capturePage()` sur une `BrowserWindow` **`show:false`**. La capture pouvait contenir une **image du compositeur Chromium en retard d'un écran** sur le DOM déjà à jour. **Cause probable**, non preuve instrumentée du compositing ni preuve d'un bug de la navigation utilisateur.

Par conséquent, **300/300 contrôles fonctionnels, 801/801 tests, 18/18 contrastes et typecheck OK restent valides dans leur périmètre**, mais **la revue des images de l'archive est refusée**. Aucun nouveau bug visuel de l'application ne doit être inféré des libellés incorrects.

## 2. Observations provisoires sur les pixels effectivement présents

- Les trois thèmes ont des fonds/surfaces cohérents entre les images observables : le thème **Noir** utilise des surfaces sombres, les thèmes **AtoumWeb** et **Blanc** des surfaces claires avec leurs différences de navigation et d'accent. Aucun écran intégralement noir/illisible n'est constaté dans ces échantillons.
- La barre haute, la navigation latérale, l'horloge et le timer restent visibles dans les captures observées.
- Les vues sont essentiellement **sans données métier** parce que la recette utilise une SQLite temporaire vide : tableaux de Devis/Projets/Prospection/Interventions vides, aucun panneau détaillé Projet/Devis/Intervention chargé. **On ne peut pas juger les contenus de fiches réelles ni leurs actions**.
- La partie basse des Réglages et des Interventions dépend du scroll, non entièrement photographiée. L'archive seule **ne certifie pas** leurs éléments hors écran, les aides à la souris ni la lisibilité de toutes les icônes et messages.

**Aucune correction de thème, de business palette ou de composant React n'est motivée à ce stade.** Il faut d'abord rendre l'outil de capture fiable.

## 3. Correctif strictement dans le banc de recette

Sur la PR #86, le script `check-ux-v2-lot01a-real-ui.cjs` a été renforcé **uniquement en mode `--captures`** :

1. Ouvre une fenêtre de recette Electron **visible seulement pendant les captures** afin de permettre au compositeur de peindre réellement (toujours TEMP et sans données clients).
2. Attend le **menu actif, le titre de la page, les attributs thème/densité** et, pour Accueil, la sortie du chargement avant chaque capture.
3. Pose un **témoin de couleur distinct par photo, carré 40px dans le coin inférieur droit**, uniquement dans cette fixture.
4. Attend deux frames `requestAnimationFrame`, demande une image `capturePage` et vérifie **le pixel de témoin dans le bitmap natif**. Réessaie jusqu'à 24 fois ; **refuse d'enregistrer** une image où la couleur n'est pas celle de la frame demandée.
5. Recontrôle le DOM **après** la capture ; valide le total exact de **54 photos vérifiées** dans le bilan final. Aucune capture non vérifiée ne doit être présentée comme bonne.

Ce mécanisme sert de **garde-fou technique à confirmer sous Windows**. Le carré de couleur dans le coin inférieur droit est un **marqueur de validation du banc d'essai**, pas un élément de l'interface V2. Si le diagnostic s'arrête, conserver son erreur exacte et ne pas conclure que l'UI est défectueuse.

**État** : JavaScript vérifié syntaxiquement avant publication du correctif, **nouvelle exécution Windows en attente**. Le mode sans `--captures` (300 contrôles) garde la fenêtre masquée, sans marqueur.

## 4. Rejeu demandé, uniquement après validation du script

Dans le clone indépendant de validation, sans modifications locales :

```powershell
cd "C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation"
if (git status --porcelain) { throw "Worktree de validation non propre." }
git fetch origin
if ($LASTEXITCODE -ne 0) { throw "Fetch échoué." }
git switch --detach origin/feature/ux-v2-lot01a-typography-v1
if ($LASTEXITCODE -ne 0) { throw "Switch échoué." }
node --check scripts/check-ux-v2-lot01a-real-ui.cjs
if ($LASTEXITCODE -ne 0) { throw "Syntaxe JS invalide." }
$folder = Join-Path "C:\DEV\01_PROJETS\AtoumWeb" ("uxv2-01a-verified-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
node scripts/check-ux-v2-lot01a-real-ui.cjs --captures $folder
if ($LASTEXITCODE -ne 0) { throw "Captures non synchronisées : voir erreur avant de créer un ZIP." }
$png = @(Get-ChildItem $folder -Filter "*.png")
if ($png.Count -ne 54) { throw "Nombre de PNG incorrect : $($png.Count) / 54." }
Compress-Archive -Path (Join-Path $folder "*.png") -DestinationPath "$folder.zip"
Write-Host "54 captures vérifiées : $folder.zip" -ForegroundColor Green
```

L'étape reste **R01A / revue visuelle**, aucun passage à 01B ni fusion automatique. **Ne jamais remplacer** la revue humaine par le seul témoin pixel : celui-ci garantit la **fraîcheur du rendu** pour la zone du témoin, puis la comparaison réelle de chaque écran doit rester une vérification distincte.

## 5. Deuxième archive vérifiée — revue comparative du 10/10/2026

**Archive utilisateur :** `uxv2-01a-verifie-20261010-031942.zip`, reçue après correction du banc d'essai, **54/54 PNG** (`2244 × 1434` pixels) : six vues × trois thèmes × trois densités. **Cette archive est différente de celle rejetée au §1.** Elle n'est pas versée au dépôt.

### Vérification des images

- Les fichiers ont été lus dans le ZIP, et le marqueur colorimétrique de la frame affichée a été recalculé d'après la numérotation attendue du banc et comparé **au pixel (largeur−17, hauteur−17)** de chaque PNG. **54/54 marqueurs exacts, zéro écart**. Ceci constitue une preuve indépendante que le garde-fou de rafraîchissement a fonctionné dans les images reçues.
- Les montages comparatifs permettent de constater, pour les thèmes et densités inspectés, que **`Accueil` affiche le tableau de bord, `Prospection` sa liste, `Devis` sa liste, `Projets` sa liste, `Interventions & Maintenance` ses tableaux, `Réglages` ses paramètres**. Le décalage systématique du ZIP précédent n'est plus constaté.
- Dans les images observées : navigation latérale, recherche, barre haute, timer, indicateur de base et panneaux principaux visuellement présents. **Les thèmes AtoumWeb / Noir / Blanc restent distincts et les 3 densités sont correctement indiquées**. Aucun écran noir total, panneau principal complètement masqué ni rupture grossière de disposition n'a été constaté.
- Les **54 images représentent le Manager existant**, avec la seule modification visuelle 01A des tailles Compact et des quatre correctifs de contraste des états : **elles ne montrent pas encore l'interface UX V2 réorganisée**.

### Portée exacte et réserves

- **Revue visuelle des six écrans à vide : acceptable pour le socle 01A**, sans preuve de défaut bloquant visible dans les configurations examinées. La comparaison des pixels seule ne donne pas un score exhaustif WCAG ; les contrastes des six classes ont été contrôlés séparément (18/18 PASS), ainsi que le focus témoin et la navigation (300/300 PASS).
- **Fiches détaillées non vérifiées** : la fixture SQLite est vierge, donc pas de fiche Prospect, Devis, Projet ou Intervention ouverte avec des données. Les longs formulaires, panneaux coulissants, interactions complexes, scrolls internes et états d'erreur réels restent des limites de preuve ; ne pas les marquer `PASS` par extrapolation.
- Captures réalisées à la taille de fenêtre de la recette et **sans photographie dédiée des zooms** ; les zooms 125/150 % ne sont prouvés que par le test natif précédent (10 visites), pas par cette galerie.
- Les captures comprennent un **carré coloré technique dans le coin inférieur droit** ; il ne fait **pas** partie du produit et doit être absent hors mode test.
- Le ZIP n'intègre **pas en lui-même un journal `git log` ni la sortie console `capturesVerified:54`**. La correspondance des 54 marqueurs dans les PNG est établie, mais **l'attribution d'un SHA exact au ZIP nécessiterait la sortie du PowerShell**. Ne pas inventer un run CI ou l'exécution des tests sur un SHA non prouvé.

**Bilan :** le **problème de preuve visuelle du §1 est résolu dans cette nouvelle archive**. La fondation visuelle des six vues sans données paraît cohérente. Cette acceptation ne signifie ni livraison de la nouvelle interface UX V2, ni recette complète des 17 vues détaillées, ni autorisation automatique de fusion vers `main`. Prochaine décision : confirmer explicitement la portée résiduelle des fiches remplies/scroll/clavier dans les critères R01A-03/04/05/08 et l'acceptation humaine de l'incrément 01A, puis seulement ouvrir 01B selon le référentiel #82.

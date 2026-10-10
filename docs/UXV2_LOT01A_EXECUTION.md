# UX/UI V2 — Lot 01A : premier incrément E01 (Compact 14 px)

**Référentiel de décision :** PR [#82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), `docs/ux-v2/DECISIONS.md` (UX2-VIS-001/003), `LOT-01A-TOKENS-VISUELS.md` (E01, R01A-01/02/07) et `LOT-01-MATRICE-EXISTANT-CIBLE.md` (L01A-02). On **exécute ces décisions**, sans réexaminer la feuille de route ni changer les règles métier.

**Base de code :** `main@07dde9c85dab337ee0ed3a5a92034a139d7ebad2`, #81 + #85 intégrées. Branche de réalisation séparée `feature/ux-v2-lot01a-typography-v1`.

## Ce qui est codé (périmètre strict de E01)

| Valeur | Avant | Maintenant | Fichier |
|---|---|---|---|
| `--ui-font-base` Compact | **15 px** | **14 px** | `src/renderer/display-density.css` |
| `--ui-font-base` Confort | **16 px** | **16 px**, inchangé | idem |
| `--ui-font-base` Confort+ | **18 px** | **18 px**, inchangé | idem |
| `--aw-font-body` | `max(15px, var(--ui-font-base))` | `max(14px, var(--ui-font-base))` | `src/renderer/ui-typography-consistency.css` |
| `--ui-font-secondary` Compact / Confort / Confort+ | 14 / 15 / 16 px | inchangé | `display-density.css` |
| `--ui-font-small` | 14 px | inchangé | idem |
| `--ui-control-height` | 36 / 42 / 48 px | inchangé | idem |
| `--ui-panel-pad` | 16 / 22 / 26 px | inchangé | idem |
| `--ui-gap` | 8 / 12 / 16 px | inchangé | idem |

Le second changement est **nécessaire** pour que les conteneurs soumis à `--aw-font-body` ne rétablissent pas automatiquement 15 px en Compact. Il préserve l'interdiction d'un texte fonctionnel inférieur à 14 px.

**Non modifiés :** les trois thèmes et accents actuels, la palette métier rouge/jaune/bleu/vert, les composants React, la navigation, les éditeurs contractuels, CGV, Devis, les services IPC/SQLite, les migrations, la sauvegarde/restauration, les données et les workflows. Aucun nouveau logo ni asset graphique.

## Recette dédiée, sans données réelles

`scripts/check-ux-v2-lot01a-typography.cjs` :

- Crée une page HTML isolée et temporaire en respectant **l'ordre effectif des imports CSS** de `src/renderer/main.tsx`. Aucun `main.ts`, bootstrap, IPC, fichier contractuel ou workspace n'est chargé.
- Vérifie via le vrai moteur CSS Chromium/Electron les neuf combinaisons **AtoumWeb / Noir / Blanc × Compact / Confort / Confort+**.
- Mesure huit tailles calculées (`body`, Prospect, Opérations, Projets, Catalogue, Devis, Temps, Bibliothèque) par combinaison, les tokens de hauteur de contrôle et le contraste du texte principal sur son arrière-plan, avec seuil WCAG 4,5:1.
- Si la chaîne d'import CSS change, refuse la recette plutôt que de simuler une nouvelle priorité de cascade.
- Utilise uniquement `%TEMP%` / répertoire temporaire OS, avec nettoyage contrôlé et sans lancement du Manager installé.

### Commandes de recette sous Windows

Exécuter depuis un **clone de développement isolé**, sans dossier Validation-MSI :

```powershell
git fetch origin
git switch --detach origin/feature/ux-v2-lot01a-typography-v1
node --check scripts/check-ux-v2-lot01a-typography.cjs
node scripts/check-ux-v2-lot01a-typography.cjs
```

**Validation Windows native du 10/10/2026 — acquise sur le SHA `466b8e45a05c0122297dcbd5eec1f7f6d6deb602`.** Exécution effective de `node scripts/check-ux-v2-lot01a-typography.cjs` dans le clone indépendant `atoumweb-manager-ux01-validation` :

- Les **31 CSS réels** du renderer ont été chargés dans leur ordre de `main.tsx`.
- **9/9 combinaisons PASS** : AtoumWeb / Noir / Blanc × Compact / Confort / Confort+.
- **72/72** tailles calculées des conteneurs représentatifs, **9/9** hauteurs de contrôle et **9/9** contrastes de texte principal.
- Pour les trois thèmes, **Compact 14 px**, **Confort 16 px**, **Confort+ 18 px**.
- Contraste calculé du corps : **AtoumWeb 14,67:1**, **Noir 17,16:1**, **Blanc 13,89:1** (les valeurs sont indépendantes de la densité).
- Sortie finale : `PASS 3 themes × 3 densities; 72 computed font checks; 9 control heights; 9 body contrasts.` puis **`Fixture cleaned: true`**.
- **Limite :** page Chromium synthétique et styles effectivement calculés, pas de capture humaine des **17 écrans réels**, ni preuve d'ergonomie complète / persistance des réglages au redémarrage, ni des contrastes des états alertes/focus. Les huit critères R01A ne sont **pas** tous clôturés par ce test.

### Vérifications humaines et suite de 01A

Après le test calculé, examiner la lisibilité et les débordements sur Accueil, Prospection, Devis, Projet, Interventions et Réglages, avec les **trois thèmes et trois densités** ; puis le focus/clavier/zoom, le chrono et l'aide `?`. Les adaptations de couleurs/tokens sémantiques et le catalogue complet des variables restent du travail **01A** à produire par incréments conformes au référentiel, pas de nouveaux lots.

**Incident CI préexistant, suivi séparément :** le run post-fusion #85 sur `main@07dde9c8`, [#38006715403](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006715403), a échoué avec **800/801 tests**, le test `src/main/restore.test.ts` « refuse A vers B… » dépassant le délai de 20 s, malgré une CI pré-fusion réussie à **801/801** [#38006158408](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006158408). Aucun changement de restauration/test timeout n'est inclus dans 01A. Ne pas masquer cet échec ni l'attribuer aux CSS.

**Garde de fusion :** 01A reste non fusionné jusqu'à une recette réelle, des contrôles ciblés et une validation de l'impact visuel ; aucun feu vert implicite pour les autres lots.

# EC04 — Interdiction d'ouvrir un workspace incomplet dans AtoumWeb Manager

## Risque corrigé

Le moteur expérimental B1 et le transfert relocalisé conservent respectivement les marqueurs `.EC04-RESTORE-INCOMPLETE` et `.EC04-RELOCATION-INCOMPLETE` en cas d'échec. Mais jusqu'à cet incrément, le **démarrage de l'application** (`resolveWorkspace → ensureWorkspace → DatabaseService.initialize`) n'en tenait pas compte.

C'était dangereux : ouvrir une copie partielle avec le vrai Manager aurait pu initialiser/migrer SQLite ou créer des dossiers dans une restauration qui n'était pas terminée.

## Modifications

- `WorkspaceIncompleteGuard.ts` expose une vérification **sans aucune écriture**. Les deux marqueurs sont recherchés par `lstatSync`, y compris si l'objet est un dossier ou un lien symbolique cassé. Les erreurs de permission ou d'E/S sont propagées, jamais assimilées à une absence.
- `ensureWorkspace` refuse un dossier marqué **avant toute création** et revérifie après les créations habituelles, afin de détecter un marqueur apparu pendant l'opération.
- `resolveWorkspace` ne considère plus `WorkspaceIncompleteError` comme une erreur de bootstrap JSON : **aucun fallback silencieux** vers un workspace neuf. Les JSON de bootstrap malformés conservent le comportement historique.
- `saveWorkspaceRoot` revérifie avant d'écrire `workspace.json`. Un dossier marqué sélectionné par l'interface est refusé, et le choix précédent est conservé.
- Le démarrage `main.ts` affiche un message explicite et quitte **avant de créer DatabaseService et d'appliquer les migrations**, lorsqu'il détecte un workspace incomplet.

Le mode recette visuelle indépendant de la base demeure inchangé.

## Tests ajoutés (non exécutés en CI)

- Tests du module pur : workspace propre/absent, chacun des deux marqueurs, marqueur sous forme de dossier et lien symbolique cassé (sur systèmes qui l'autorisent).
- Tests des vrais points d'entrée workspace.ts avec un mock Electron : refus d'initialisation, refus d'un fallback implicite, refus de sauvegarde de configuration, comportement historique sur JSON malformé, blocage du workspace par défaut.
- Test statique complémentaire de l'ordre de démarrage Electron.

**Limites restantes** : l'appareil doit rester éteint pendant une restauration. Une création/suppression concurrente de marqueur après la dernière vérification constitue une course encore possible ; le verrou IPC existant ne remplace pas un verrou multi-processus. Les opérations dans des workspaces déjà ouverts et les répertoires symlinks/jonctions nécessitent une validation Windows native. L'archive reste expérimentale, non chiffrée et non certifiée.

Pas de fusion, installation, modification des données réelles ni activation d'EC04 dans l'interface.
# EC04 — lot suivant : sécurité des opérations imbriquées et adaptateur IPC expérimental

Branche : `feature/ec04-workspace-file-inventory-v1`, séparée de `main`. Aucun changement de SQLite, de l'interface ou des registres IPC réels.

## Bug évité avant l'intégration

La première version de `WorkspaceMutationGate.runMutation()` pouvait se bloquer lorsque, pendant la phase de drainage, une opération déjà protégée lançait une opération elle-même protégée. Le composant tient désormais compte des contextes asynchrones actifs avec `AsyncLocalStorage`.

- Une opération enfant d'une mutation active peut démarrer même pendant le drainage : elle est comptée séparément. Le coordinateur attend sa fin avant de capturer.
- Un callback différé dont le parent est déjà terminé ne bénéficie **pas** d'un ancien permis ; il doit patienter si la capture est active.
- L'appel `acquire()` depuis une opération mutante active est refusé immédiatement plutôt que de provoquer un auto-blocage.
- Le bail continue de libérer les écritures en sortie, y compris après échec/timeout.

`guardIpcMutation` est un adaptateur de typage permettant d'entourer **une** opération IPC asynchrone complète (copie de fichier puis écriture SQLite, par exemple), sans perdre son résultat ni ses exceptions. **Il n'est pas enregistré sur les handlers de production** ; le raccorder sans inventaire exhaustif ferait croire à tort que tous les producteurs de mutations sont protégés.

## Validation accomplie

- Node 22, 10 scénarios de fumée isolés réussis : 4 scénarios du verrou historique, 4 cas imbriqués/contextes périmés et 2 cas du wrapper.
- TypeScript 5.8, `tsc --noEmit --strict` ciblé : OK.
- Six nouveaux scénarios Vitest ajoutés aux six scénarios du verrou précédent, mais **non exécutés sur Windows / dans la CI projet**.

## Reste à faire

Brancher progressivement aux commandes IPC réellement mutantes et aux traitements autonomes, en assurant la couverture fichier+SQLite et des transactions longues, sans oublier le timer, les imports, les fenêtres multiples, la gestion des brouillons, Bridge et les sauvegardes automatiques. Ne pas exposer EC04 à l'interface avant la preuve que toutes les voies d'écriture sont protégées.

Aucune fusion, aucune installation, aucun accès aux bases réelles, aucune migration.

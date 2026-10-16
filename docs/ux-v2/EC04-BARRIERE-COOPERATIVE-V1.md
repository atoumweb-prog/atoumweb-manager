# EC04 — Incrément 08 : barrière coopérative d'écritures

Branche `feature/ec04-workspace-file-inventory-v1`. Module : `src/main/backups/WorkspaceMutationGate.ts`, tests : `WorkspaceMutationGate.test.ts`.

La classe `WorkspaceMutationGate` implémente `Ec04WritePauseProvider`, le port prévu par `Ec04CaptureCoordinator`. Un appel `runMutation()` doit englober **l'ensemble** des effets SQLite + fichiers d'une opération de premier niveau ; les modifications déjà en cours doivent se terminer avant `acquire()`, tandis que les nouvelles attendent `release()`. La demande de suspension expire après un délai pour éviter un gel permanent. Les échecs dans le travail encadré n'abandonnent pas le compteur ; les demandes de suspension concurrentes sont rejetées.

## Limite majeure

Le module est **coopératif, non activé**. Il ne peut pas bloquer les écritures directes `DatabaseAdapter.run/exec`, les mutateurs `fs`, les événements de chronomètre, imports ou les autres chemins IPC qui ne passent pas volontairement par `runMutation()`. De plus, le double enveloppement imbriqué du même flot d'écriture peut provoquer une attente indéfinie : seule l'opération **externe** doit être enveloppée. Le port n'est pas une preuve que toutes les écritures ont été recensées.

Pour l'utiliser en production, il faut d'abord instrumenter **toutes** les frontières mutantes du processus Electron, recenser les tâches périodiques/autonomes, puis démontrer qu'une capture lancée entre deux opérations ne coupe aucune transaction SQLite ou copie de fichier. Aucun raccordement aux handlers réels n'est fait par cet incrément.

## Vérifications

Node 22 : 4/4 essais isolés exécutés (fin d'une opération pendant la suspension, reprise, délai d'attente, échec du travail, suspension concurrente) ; `tsc --noEmit --strict` ciblé : OK, avec une interface de type locale de substitution à l'environnement Electron indisponible. Six tests Vitest du même module sont déposés mais **pas exécutés** avec la suite du dépôt / Windows.

**Aucune migration, aucun IPC, aucune intervention sur les bases réelles, pas d'installation ni de fusion dans `main`.**

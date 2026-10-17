# EC04 — Raccordement progressif du chronomètre et des opérations

**Branche isolée**, aucun endpoint EC04 de sauvegarde globale activé, aucune modification de schéma SQLite.

Le verrou coopératif du processus principal Electron est désormais partagé avec :
- les huit commandes mutantes du chronomètre dans le registre IPC principal (début de session, heartbeat, pause, reprise/récupération, arrêt normal/dernier connu, ajout manuel) ;
- les deux mutations du registre `timeIpc.ts` (correction et bascule de session) ;
- 26 commandes métier du registre `operationsIpc.ts` couvrant demandes, interventions, maintenance et forfaits d'heures, notamment l'atomicité applicative de `hour-packs:create` (création + rattachement à la facturation) et la relecture des conditions de clôture de période **à l'intérieur** de la barrière.

La sauvegarde n'est pas déclenchée, le chronomètre n'est jamais arrêté ni remis à zéro par cette opération. Lorsqu'une future capture demandera une pause, les commandes d'écriture attendront la reprise ; la mesure de temps doit rester cohérente avec les horodatages réellement enregistrés, ce qui nécessite une recette Windows.

Les nouvelles signatures de `registerOperationsIpcHandlers` et `registerTimeCorrectionIpcHandler` acceptent un verrou optionnel pour préserver le comportement synchrone des fixtures existantes ; `main.ts` transmet le **même verrou** que celui utilisé par `ipc.ts`.

## Contrôles à terminer
- Le registre `referentialsIpc.ts`, le registre `businessBackupsIpc.ts`, les routes Devis/CGV du registre principal et les écritures sans IPC restent non exhaustivement couvertes.
- Certains appels de lecture peuvent déclencher des effets de bord ; audit nécessaire avant sauvegarde.
- Pas de synchronisation avec de potentiels processus externes, plugin Bridge distant, ni vérification des chemins/DPAPI.
- Vitest ajouté : simulation de commande chronomètre bloquée pendant une pause, compatibilité sans verrou, deux fenêtres opérantes, lien forfait/facturation et vérification de clôture. **Ces tests n'ont pas été exécutés dans la CI Windows du projet.**

**Ne pas confondre cette extension de couverture et l'activation d'une sauvegarde complète.** La cohérence globale reste NON certifiée ; aucune fusion ni installation.

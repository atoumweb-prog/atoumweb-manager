# EC04 — durcissement du prototype et coordinateur de pause (incrément 05)

Branche de travail : `feature/ec04-workspace-file-inventory-v1`. Non raccordée à l'UI/IPC ; pas de traitement des données réelles ni de migration SQLite.

## Correctifs de sécurité dans l'archive expérimentale B1

- La destination doit être réellement absente : détection par `lstat`, y compris d'un lien symbolique cassé.
- Restauration dans un nouveau dossier créé par `mkdir` exclusif, pas par renommage d'un répertoire pouvant écraser un répertoire vide sous POSIX. L'installation se fait après vérification en staging ; en cas d'interruption, le dossier porte `.EC04-RESTORE-INCOMPLETE` et ne doit pas être ouvert comme workspace. Une restauration incomplète n'est jamais déclarée réussie.
- Rejet des collisions de noms de dossiers Windows, même lorsqu'elles concernent deux fichiers distincts, ainsi que des collisions de fichiers.
- Limite expérimentale du volume déclaré à 64 Gio, à adapter après précontrôle d'espace libre et contraintes réelles.
- Vérification de toutes les lignes du pragma `integrity_check`, avec refus des réponses absentes.
- Inventaire de chemins SQLite↔fichiers : parcours itératif bornant la mémoire ; refuse une archive avec des liens connus absents, externes ou non portables. Ce contrôle est volontairement partiel et NE certifie PAS la complétude.

## Coordinateur ajouté

`WorkspaceCaptureCoordinator.ts` apporte une interface `Ec04WritePauseProvider` et une classe `Ec04CaptureCoordinator`. Le coordinateur refuse deux sauvegardes simultanées, acquiert un bail de suspension AVANT la capture et le libère en sortie, même en cas d'erreur.

**Attention : l'adaptateur réel de suspension interfenêtres n'existe pas encore.** Ce code n'intercepte aucune écriture du Manager. Les tests utilisent un faux fournisseur, ils ne démontrent donc aucune sécurité sur une application ouverte. Il faudra intégrer toutes les écritures SQLite, les fichiers, autosauvegardes, chronomètres, imports, services Bridge et plusieurs fenêtres, puis prouver que tous les flux sont drainés ou correctement différés.

## Vérifications

TypeScript isolé compilé sous Node 22 et trois séries de tests Node sur fixtures temporaires : création/vérification/restauration, corruption, collision de dossiers, lien cassé, destination vide existante, détection des liens manquants et protocole pause/reprise. Les cas Vitest sont committés mais ils ne sont pas exécutés par la CI native Windows du dépôt. Les exigences d'installation/portabilité Windows et EC04 complet restent ouvertes.

**Ne pas fusionner ou installer ce prototype tel quel.** Aucune PR ni CI hébergée n'est créée sur cette branche.

# EC04 — Vérification de la copie effectivement restaurée (incrément 06)

Branche expérimentale, non raccordée à l'interface et non fusionnée dans main.

Le prototype de restauration effectuait déjà un contrôle intégral de l'archive **avant** l'installation. Il effectue maintenant **après** la copie vers le workspace neuf une seconde vérification, avant d'effacer le marqueur .EC04-RESTORE-INCOMPLETE et de déclarer la restauration terminée.

Cette vérification inclut :
- un unique fichier SQLite autonome dans data/ (pas de WAL/SHM ou fichier inattendu), empreinte SHA-256 et taille exactes ;
- l'intégrité et le registre de migrations SQLite ;
- le nouvel inventaire intégral des racines de fichiers EC04 (chemins, tailles et SHA-256), strictement comparé aux entrées du manifeste, y compris l'absence de fichiers supplémentaires ;
- une nouvelle vérification des liens DB→fichiers déjà couverts par l'audit expérimental.

La nouvelle fonction en lecture seule verifyRestoredWorkspaceAgainstManifest permet de revérifier une restauration déjà créée ; elle refuse un marqueur d'interruption. En cas d'échec de vérification finale durant la restauration, le marqueur est conservé : ne jamais démarrer ce workspace comme s'il était validé.

Validation locale sur fixtures synthétiques seulement : TypeScript isolé OK, tests de fumée Node OK (copie exacte, marqueur, modification de PDF, fichier supplémentaire, WAL inattendu, SQLite absent). Deux tests Vitest ajoutés ; pas encore exécutés dans la CI Windows du projet.

Limites inchangées : la cohérence de la **source** dépend de la future barrière globale d'écritures, la couverture des références externes reste partielle, et le prototype n'est ni chiffré ni approuvé pour une sauvegarde de production. La fonction n'authentifie pas la provenance de l'archive.

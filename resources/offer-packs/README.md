# Packs d’offres AtoumWeb embarqués

Ce dossier reçoit les packs `.atoum` de référence embarqués avec AtoumWeb Manager.

Pour la V0.2 gel candidate, les trois fichiers attendus sont :

- `Site-Vitrine-v0.2.atoum` — SHA-256 `267ccbc1ee23d71ce1b98707d6f6077d0abfff96e5ce9d2c2ff66f92acb56e69`
- `E-commerce-v0.2.atoum` — SHA-256 `9b304b59b76df4b01f9adf695412f9040ec4390b599eb2899ed69825d943a791`
- `Maintenance-v0.2.atoum` — SHA-256 `bffee85598733be0f3312da0af3de11dec6ad665ffc19ebafc26f5b24fb0378f`

Le Manager lit directement ces archives ZIP métier au démarrage après la migration 22. Il copie la version installée dans le workspace `packs-atoum/`, extrait les modèles DOCX dans `modeles-contrats/`, enregistre le snapshot du pack et matérialise la projection catalogue disponible.

Tant que toutes les `requiredCapabilities` d’un pack ne sont pas implémentées, le pack reste en état `staged` même si son catalogue et ses modèles documentaires sont déjà utilisables pour la recette commerciale. Le snapshot complet reste conservé afin d’activer ultérieurement les règles, validations, échéanciers et politiques avancées sans réimport destructif.

Ne jamais remplacer silencieusement un fichier en conservant le même `packageId` + `packageVersion` avec un contenu différent : l’importeur le refuse. Une évolution métier doit publier une nouvelle `packageVersion`.

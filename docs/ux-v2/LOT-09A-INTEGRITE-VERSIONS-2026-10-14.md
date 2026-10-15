# Lot 09A — Vérification d'intégrité des versions des justificatifs
14 octobre 2026 — branche isolée `audit/ux-v2-lot09-20261014`.

## Implémentation
- L'import d'un justificatif ajoute à l'événement `expense_receipt_version` une empreinte SHA-256 du fichier copié.
- `ExpenseService.listReceiptVersions(id)` lit l'historique sans mutation de données et retourne le chemin relatif, le nom, l'empreinte disponible et l'état d'intégrité.
- États : `verified` (empreinte correspondante), `modified` (écart), `missing` (absent) et `unknown` (ancienne trace non empreintée). Ne pas présenter `unknown` comme une certification d'intégrité.
- Rejet des chemins hors du workspace avant consultation du fichier.
- Le test existant de deux imports est étendu : contrôle de deux empreintes valides puis modification sur disque et détection d'une version altérée.

## Limites explicites
- **Ce n'est pas encore une interface de consultation dans Electron** : la méthode est uniquement dans le service backend et n'est pas raccordée à IPC/preload/renderer.
- Les anciennes pièces antérieures à l'enregistrement des empreintes ne sont pas certifiées rétroactivement.
- L'import fichier + la base + le journal ne sont pas atomiques ; le traitement des erreurs et la fiabilité transactionnelle restent à développer.
- Aucun test ou typecheck n'a été exécuté dans cette session, et aucune validation Electron/Windows n'est acquise.
- Aucune migration nouvelle, aucune fusion dans main. La compatibilité des autres lots reste à mesurer.

## Prochaine gate
Typecheck, tests ciblés ExpenseService et ClientDocumentService, tests Billing, suite Vitest complète, migrations, restauration sur fixture TEMP et recette Electron avant proposition de PR de fusion.

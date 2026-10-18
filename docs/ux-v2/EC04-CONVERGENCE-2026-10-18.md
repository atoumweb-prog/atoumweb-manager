# EC04 — convergence contrôlée, 18 octobre 2026

## Références et portée

PR draft [#156](https://github.com/atoumweb-prog/atoumweb-manager/pull/156), branche `feature/ec04-workspace-file-inventory-v1`. Base contrôlée `376eef943e741e2967465b0016c05fc1977a97ea`. Candidat MSI initial `ae33cccfac50ec25ce1bf044e021cc861f01b4c6`, arbre `f57ff0544a96f0b3df1f98c180bb178a169ef94a`. Main est ancêtre ; simulation sans conflit et arbre identique. Les 80 fichiers initiaux ne modifient ni renderer/shared ni migrations/services métier. EC04 demeure expérimental, sans interface de sauvegarde complète et sans autorisation de production.

## CI candidate initiale réellement exécutée

[CI #1808](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/39086280859) au HEAD initial : installation et typecheck verts, quatre contrôles Python verts, **1659/1660 Vitest**, 193/194 fichiers, durée Vitest166,08s. Les 35 restaurations passent (DELETE706ms, WAL524ms), aucune erreur RPC détectée. Seul échec : `CrmIdentityAssetService.test.ts` / réouverture réelle sur disque, timeout5000ms, durée5258ms. Le banc natif EC04 est **ignoré après cet échec**, pas validé par ce run. L'autre workflow 07A/07B est non applicable et ignoré ; ce n'est pas une deuxième validation réussie.

## Diagnostic et correction bornée

Le test réappliquait sur disque les71 migrations, alors que beforeEach les avait déjà appliquées en mémoire. Mesures temporaires locales (Electron44.3/Node24.20, mêmes deux workers) : préparation402,413ms ; import/réouverture19,550ms ; assertions9,646ms. Le runner ne comportait pas l'instrumentation : la ventilation exacte des5258ms hébergées reste inconnue. Le diagnostic d'amplification des commits DDL par le disque Windows est soutenu par le code et les mesures locales, et doit être confirmé par la nouvelle CI.

Correctif exclusivement fixture : `VACUUM INTO` exporte une fois le schéma complet préparé en mémoire vers un fichier neuf TEMP. L'import du logo, les écritures métier et les deux ouvertures utilisent toujours la vraie base disque. Aucune assertion retirée ; ajout d'une comparaison intégrale id/nom du registre avec MIGRATIONS. Aucun timeout, worker, migration, service ou code EC04 changé.

Mesures temporaires après : préparation31,262ms ; import/réouverture18,036ms ; assertions10,127ms. Test complet622ms avant /229ms après, incluant beforeEach. Instrumentation retirée avant commit. Ces mesures ne sont pas les résultats du runner GitHub.

Validation ciblée après retrait de l'instrumentation : **43/43**, dont8 CRM et35 restaurations, deux fichiers,5,14s ; typecheck réussi après correction. La suite complète précédente au HEAD MSI1660/1660 n'est pas présentée comme une preuve du nouveau commit. La CI automatique après publication doit revalider la suite complète et exécuter les36 contrôles natifs EC04. Résultats finaux et SHA exact consignés dans le bilan de la PR pour ne pas produire un nouveau commit documentaire déclenchant une campagne inutile.

## Conditions de fusion et réserves

Fusion autorisable seulement après CI verte au dernier SHA, arbre GitHub conforme et absence de conflit/changement de main. Aucune fusion effectuée. Aucune migration ajoutée ou historique modifié : registre1–71 conservé. Aucun installateur ni workspace réel utilisé.

GO éventuel limité à l'intégration du **socle expérimental non exposé**. NO-GO activation/production : couverture partielle chemins/JSON/Bridge/assets/packages absolus ; appels directs, démarrage/arrêt et autres processus non entièrement coordonnés ; B1 non chiffré/non authentifié ; DPAPI inter-PC non certifié ; transfert physique inter-disques, ACL et coupure secteur non qualifiés. Les indicateurs de certification restent faux. Voir [audit des écritures](EC04-MSI-AUDIT-ECRITURES-2026-10-18.md) et [validation MSI historique](EC04-MSI-VALIDATION-2026-10-18.md).

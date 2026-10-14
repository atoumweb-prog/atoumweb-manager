# Intégration isolée 02C / 02D / 02E et 03A–03C

## Références et historique conservé

Relevé GitHub du 13 octobre 2026, avant intégration :

| Référence | HEAD exact | Dernière CI contrôlée |
|---|---|---|
| main | 278ff2da022ba5e58ae333de11e74bc4d12a2995 | Base préservée |
| #98 | 10933aefe52b37a98a1e18638cb29021a3b8bf69 | #777 SUCCESS, 947 Vitest et 77 assertions Electron |
| #99 | 7549770428fcbb53d89a60fcc92dd5cb6d8f258d | #737 SUCCESS |
| #100 | d3ef589be9090bc1a5f04cab625228d2a4aa42d7 | #741 SUCCESS |
| #101 | bd1985b33f56bd1e37902d4bc91af41b868806dc | #760 SUCCESS |

Worktree distinct `C:/DEV/01_PROJETS/AtoumWeb/manager-integration-02e-03c`, branche `integration/ux-v2-02e-03c-v1`. Merge normal `40e12e6`, parents #101 et #98. #99 et #100 sont déjà ancêtres de #101. Aucun cherry-pick, rebase, force-push, retarget, clôture de PR source ou modification de main.

## Conflit et décisions de rapprochement

Un seul conflit Git : `scripts/check-ux-v2-lot01a-real-ui.cjs`, parsing et sélection de fixture. Les modes défaut, captures, Recherche et CRM sont conservés. Le parser commun a 12 tests permanents : cinq modes valides, sept commandes ambiguës/incomplètes refusées. La protection des dossiers de captures existants et de Validation-MSI reste avant toute création de fixture. Le point d'extension utilisé par les recettes 02D/02E est conservé.

`QuotesPage.tsx` et `ProspectsPageV2.tsx` fusionnent textuellement : confirmation des modèles réellement affichés, garde de navigation et éligibilité Projet sont conservées simultanément. Une annulation/erreur d'une ouverture Devis périmée n'ajoute plus de message sur un écran ultérieur.

La nouvelle recette reproduit un remplacement du Prospect actualisé par une ancienne réponse de liste. Correction par génération de lecture, invalidation au démontage, sélection courante par référence et annulation du journal périmé. Les succès **et erreurs** obsolètes sont ignorés ; les erreurs de la lecture courante restent signalées. Aucun retry et aucun nouveau système UX-01.

L'Accueil est raccordé à la projection 6+1 de #98. Une neuvième source indépendante lit les devis existants ; le signal E73 prend exactement le même devis courant, ordonné par date puis ID, dans Home et CRM. Conversion reste historique, exclue du total actif, et son bouton ouvre la vue CRM existante via la garde App. Les sources indisponibles restent explicites. Les widgets, alertes, préférences et le chrono unique sont conservés. Cinq tests permanents vérifient le signal partagé, les révisions et l'absence de mutation des entrées.

Les services CRM/Devis, IPC, preload et types métier sont identiques à #98. Les migrations, restauration et règles contractuelles ne reçoivent aucun nouveau changement d'intégration. Les autres fichiers backend hérités de #101 sont conservés, notamment les tests des préférences Home. Le schéma reste 1–66.

## Matrice C01–C11 sur le candidat combiné

| Scénario | Preuves exécutables |
|---|---|
| C01 | 12 tests du parser ; shell avec 63 captures, Recherche, CRM avec 9 captures ; commandes exclusives et dossiers neufs |
| C02 | Recherche réelle 92 ; convergence : bureau, historique Conversion, filtre masquant puis nouvelle recherche, ID et panneau visibles |
| C03 | Convergence : liste Prospect lente puis succès récent, erreur obsolète sans rejet non géré ; Devis A lent puis B, succès et erreur tardifs ; recherche 02C et journal annulé |
| C04 | 5 tests d'éligibilité Projet ; recette CRM ; préparation du véritable Projet depuis le Devis, même ID lors de l'acceptation |
| C05 | E72 dans Vitest/CRM ; création de devis conserve new, clic réel « Démarrer la prospection » distinct |
| C06 | E73, annulation et DnD refusé dans CRM ; conversion par IPC acceptation, second appel idempotent, un Client ; Home Finalisation et historique distincts |
| C07 | CRM : contacts atomiques et contrôle optimiste Qualification/Projet/Budget/Checklist ; convergence : dirty, pending, refus de sauvegarde, instance et texte conservés ; UX-01 183 |
| C08 | Accueil → recherche → bureau Prospect → qualification enregistrée → besoins enregistrés → Devis → Projet prévisionnel → acceptation → Client ; vrais IDs, absence de doublons ; chrono/parcours 02E |
| C09 | Home 54 : sources indépendantes, erreurs/cache/retours tardifs, critiques et widgets ; convergence ajoute le raccordement 6+1 |
| C10 | CRM 9 thèmes/densités, shell 17 routes/étroit/zoom, parcours 02E clavier/Échap/focus, UX-01 confirmations et dialogues réels |
| C11 | Typecheck, suite réunie, restaurations 35, équivalence binaire 6, migrations/intégrité/FK et nettoyage TEMP |

Le parcours C08 utilise les véritables interfaces pour recherche, qualification, besoins et préparation du Projet. Les données contractuelles de test sont préparées par `testSupport/quotePreparationFixture.ts`, puis l'acceptation est appelée via le vrai preload/IPC ; cela ne constitue pas une recette humaine de rédaction/signature du contrat. Les conflits multifenêtres sont reproduits par des instantanés concurrents et des IPC obsolètes ; aucune session client réelle n'est utilisée.

## Résultats et traçabilité

Premier checkpoint complet `737ce54` : typecheck OK, 1 020/1 020 Vitest dans 107 fichiers (74,31 s), 35 restaurations et 6 binaires ; convergence 34, CRM 77, Recherche 92, Home 54, parcours 02E 61, shell 374, UX-01 183. 81 captures synchronisées, zéro overflow observé par le shell, zéro erreur renderer inattendue ; injections de refus attendues dans les logs main. Bases TEMP : intégrité OK, FK vide, migrations 1–66, nettoyages confirmés. Aucun RPC.

Le complément final ajoute le clic réel de démarrage et l'erreur de liste obsolète : convergence **36 assertions**. La validation finale du HEAD documentaire/code est rejouée avant publication par :

La recette complète au candidat `476945fc` a confirmé 1 020 Vitest, 36 convergence et les autres résultats ci-dessus. C01 a également été exécuté sans captures : shell défaut373 et CRM76, au même SHA. La revue visuelle des PNG a révélé le libellé Home « Huit sources chargées » devenu obsolète après raccordement : le nombre est désormais dérivé des sources réelles, avec une assertion native supplémentaire (**Home55**). Ce correctif visuel impose une candidate automatique sur son nouveau HEAD ; ce n'est pas un rerun de la première CI778. Les preuves au nouveau SHA figurent dans le manifeste final et la PR.

La CI778 échoue sur le focus de la recherche après redimensionnement dans 02E, après installation/typecheck/1 020 Vitest, convergence36, CRM77, Recherche92 et Home54 réussis. Le log montre un bouton actif et la recherche masquée. Le scénario commençait une nouvelle saisie seulement70ms après l'envoi natif d'Échap, sans attendre sa réception et le retour de focus. Ce chevauchement est une cause probable, pas une panne reproduite systématiquement en local : l'injection diagnostique d'un événement retardé160ms reste verte localement. La recette attend maintenant explicitement la fermeture et le focus rendu au bouton avant la nouvelle saisie. Une assertion supplémentaire vérifie cet acquittement (**parcours02E62**), puis l'assertion initiale du focus/texte après resize reste intégrale. Aucun timeout augmenté, aucune assertion retirée et aucun changement du header métier. La nouvelle CI doit confirmer cette synchronisation Windows.

L'Accueil lit également les Prospects archivés pour que l'historique Conversion corresponde au CRM ; ses filtres actifs excluent toujours les archivés. Une assertion supplémentaire conserve le lien Client après archivage et vérifie sa présence dans le compte Home (**convergence37**). Aucun nouvel archivage automatique, statut ou règle de conversion.

### Complément du 14 octobre — diagnostic du banc Windows

L'acquittement d'Échap ne suffit pas lorsque le banc démarre déjà étroit. Reproduction locale déterministe à1050px : même signature que CI778 (`active: BUTTON`, `search:false`, `display:none`). Le scénario essayait de forcer la saisie après fermeture d'une recherche en ligne déjà masquée ; ce n'était pas une interaction utilisateur réalisable. Le correctif impose deux départs natifs (1510 et1050), vérifie l'acquittement d'Échap, utilise le vrai bouton Rechercher si le champ est masqué et affirme son focus/visibilité **avant** la frappe. L'assertion initiale après resize reste identique. Aucun style forcé ni timeout ajouté. Le header de production est inchangé.

Les67 assertions du parcours passent localement ; le log relève1496px/inline visible et1036px/palette nécessaire, champ réellement focalisé dans les deux cas. Ces mesures sont désormais reprises dans le manifeste et les logs CI. La largeur initiale du run778 n'était pas journalisée : la reproduction établit le défaut du banc, sans attribuer au runner une largeur non mesurée.

Le checkpoint complet74782268 est vert :1020Vitest/35restaurations/6binaires, convergence37, CRM77, Recherche92, Home55, parcours62 avant extension du banc, shell374 et UX01183/81captures. Le commit suivant ne change aucun TS/TSX, package ou configuration de tests : uniquement le banc 02E, sa collecte de preuves et la documentation. Ses contrôles natifs sont rejoués au HEAD publié (**parcours67**), et la CI candidate exécute de nouveau typecheck et Vitest sur ce même HEAD. Les résultats et le SHA exact définitifs sont consignés dans la PR.

```text
node scripts/check-ux-v2-integration-validate.cjs
```

Le manifeste `outputs/integration-<SHA>-<timestamp>/manifest.json` contient le HEAD et l'arbre exacts, le statut Git propre, les durées, sorties, résultats et les empreintes des 81 PNG. Les logs et captures restent locaux dans ce worktree. Les résultats définitifs et le SHA publié sont consignés dans la PR, sans commit documentaire supplémentaire déclenchant une seconde CI.

## CI candidate et limites

Le push initial de cette branche n'est pas ciblé par `push`; l'ouverture de PR draft vers main déclenche `quality`. Un correctif de code ultérieur déclenche `pull_request: synchronize` ; aucun dispatch/rerun prévu. Le workflow maintient Windows 2022, Node 24, npm ci, typecheck et Vitest à deux workers.

Le nouveau contrôle combiné est obligatoire pour `github.head_ref == 'integration/ux-v2-02e-03c-v1'`. Il exécute les **mêmes fixtures CRM 03B/03C**, plus Recherche, Home, 02E, shell et UX-01 sur le checkout de la PR. Les anciennes étapes conditionnées à #98 restent réservées à #98 ; leur statut ignoré n'est jamais considéré comme une preuve. `--native-only` indique explicitement que typecheck et Vitest sont assurés par les étapes CI distinctes. Les captures et leurs empreintes sont produites ; l'absence de stockage d'artefacts GitHub reste une limite pour la revue visuelle distante.

Recette humaine globale différée, pictogrammes/logo non figés, pas de certification juridique ni de migration générale des autres éditeurs. Aucun lancement Validation-MSI. Les PR #98–#101 et leurs branches doivent rester intactes jusqu'à une décision d'intégration explicite. Cette PR groupée est un candidat testable, **pas une autorisation de fusion**.

## Recette finale du 14/10/2026

La suite de cette livraison et les limites de l'inspection visuelle sont décrites dans [le rapport de recette finale](RECETTE-FINALE-PR102-2026-10-14.md). Le correctif de lisibilité et ses contrôles natifs s'ajoutent à la convergence, sans remplacer les preuves C01–C11 ni attribuer la CI779 à un nouveau HEAD. Les résultats définitifs du commit de stabilisation figurent dans son manifeste et dans la PR102.

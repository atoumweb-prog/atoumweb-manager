# Lot 03B — raccord initial du pipeline réel (13/10/2026)

Base : branche `codex/ux-v2-lot03a-crm-audit`, issue de `main@278ff2da`; aucun changement sur `main` ou le lot local 02C.

## Modifications
- Nouveau calcul pur `src/shared/prospectPipelineProjection.ts` et tests Vitest associés : six colonnes actives, exclusion des nouveaux contacts, perdus/archivés/gagnés, historique Conversion uniquement si `clientAccountId`.
- `src/renderer/crm/ProspectsPageV2.tsx` réutilise la projection pour les cartes des six colonnes et affiche une septième section **historique** avec un lien vers la vue Historique existante.
- **Finalisation** est vide et ne reçoit pas de glisser-déposer : E73 (accord de principe horodaté/révisionné) n'a pas de marqueur métier approuvé ni d'implémentation.
- **Conversion** n'est pas une destination de drag-and-drop. Compteur historique non filtré par les filtres du pipeline actif.
- Le handler existant `handleGroupDrop` et les transitions autorisées par `CrmService` ne sont pas modifiés. Aucun statut SQL ni acceptation de devis fictive.

## Risque métier prioritaire constaté
Dans `src/main/commercial/QuoteService.ts` près de la ligne 263, `create` écrit encore `stage='quote_to_prepare'` pour les Prospects non gagnés/perdus, y compris `new`. L'effet traverse aussi `createWithLines`. Cette règle contredit E72 « démarrage volontaire de la prospection ». **Aucune modification métier effectuée.** Avant d'élargir 03B, préparer un test de reproduction isolé et une correction du service sur décision explicite, en vérifiant les chemins devis existants.

## Limites de validation
Lecture/vérification statique du code GitHub après écriture. Quatre tests unitaires *écrits mais non exécutés* ; pas de typecheck local, pas de test Electron Windows, pas de CI. La présence des six colonnes et de la section Conversion dans l'interface n'est pas une recette UX validée. La section historique renvoie à la vue Historique générale ; elle ne filtre pas encore exclusivement les conversions.

## Prochaine validation
Typecheck, Vitest ciblés, scénarios E72, refuser les drops vers Finalisation/Conversion, vérifier une seule carte par prospect et aucune perte de brouillon, puis recette Electron réelle sur profil TEMP ; pas de publication PR/fusion/CI avant bilan.

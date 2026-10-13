# Lot 03B.6 — Recette Electron réelle sur Windows (candidat non fusionné)

**Date :** 13/10/2026 — **périmètre :** UX/UI V2 Prospect → Devis → Finalisation → Conversion.

## Frontière et preuves

Le typecheck et Vitest de GitHub Actions valident les sources et les tests de service, **pas** le rendu graphique Electron. Les captures ni les parcours natifs ne sont considérés exécutés tant que le manifeste local n'est pas produit par le banc Windows.

Le nouveau banc `scripts/check-ux-v2-lot01a-real-ui.cjs --lot03b` réutilise l'application React, le preload, les handlers IPC, les services métier, les migrations et SQLite sur un profil **TEMP possédé par le banc**. Il ne charge pas de workspace installé ni `Validation-MSI` et supprime uniquement ses ressources temporaires vérifiées. Les confirmations natives sont pilotées pour tester le « Rester / Quitter sans enregistrer », pas les services métier. L'exécution est en échec si une assertion ou la capture compositée échoue.

## Recette autonome recommandée (sans toucher à 02C local)

Exécuter dans **PowerShell Windows** à partir du clone Git local, en préservant toutes les branches de travail et données utilisateur. Vérifier d'abord l'emplacement du clone et l'espace libre. Exemple :

```powershell
Set-Location 'C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager'
git fetch origin codex/ux-v2-lot03a-crm-audit
$head = git rev-parse 'origin/codex/ux-v2-lot03a-crm-audit'
$worktree = Join-Path $env:TEMP ('atoumweb-03b6-validation-' + $head.Substring(0,10) + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
git worktree add --detach $worktree $head
Set-Location $worktree
npm ci
node scripts/check-ux-v2-lot03b-validate.cjs
```

La commande unique lance `tsc --noEmit`, Vitest et le banc Electron réel (neuf configurations de présentation). Elle arrête immédiatement la recette à la première erreur. Le résultat, les logs et les neuf captures avec sentinelle de composition sont enregistrés sous `outputs/lot03b6-<SHA>-<timestamp>/` dans le worktree isolé. Le manifeste contient le SHA, l'arbre Git, l'OS, les commandes, codes de sortie et noms de captures.

Après examen et archivage des preuves, retirer **uniquement le worktree explicitement créé** par la commande, jamais le clone principal ni le profil MSI. Ne pas supprimer un dossier dont la destination ne correspond plus au worktree attendu.

## Contrôles natifs et critères

| Réf. | Preuve dans le banc `lot03b-real-scenarios.cjs` |
|---|---|
| R03B-01 | Nouveau Prospect en `new`, absent du pipeline, Client non créé |
| R03B-03 | Six colonnes commerciales et septième section Conversion non déposable |
| R03B-04/15 | Drag Chromium vers Conversion/Finalisation non autorisées : aucune mutation ; déplacement autorisé Attente → Négociation persisté par le vrai CrmService |
| R03B-12 | Accord de principe E73 explicite ; état `sent` et Prospect inchangés ; carte dans Finalisation étape 6 ; annulation et retour |
| R03B-13 | Envoi du devis seul ne place pas le Prospect en Finalisation |
| R03B-15 | Conversion historique distincte d'une cible DnD et des actifs |
| R03B-16/17 | Gagnés/convertis distincts des perdus ; navigation vers Client lié sans doublon |
| R03B-18 | Brouillon de relance : sortie refusée une fois, saisie conservée ; sortie ultérieure seulement après confirmation |
| R03B-19 | 3 thèmes × 3 densités, neuf captures visuelles vérifiées sur fenêtre normale ; fenêtre 1024 × 720 et zoom 125 % |
| R03B-20 | Intégrité `PRAGMA integrity_check` et zéro `foreign_key_check` sur SQLite TEMP |

**Ne pas déclarer l'intégralité du lot 03B.6 validée** avec cette seule recette : restent à faire manuellement à l'écran les gestes DnD au clavier, la qualification incomplète, un Projet prévisionnel avec véritable blueprint complet, le rapprochement des révisions commerciales et la lecture des captures sous les neuf configurations. Les tests backend associés et leurs journaux doivent être joints au bilan final.

## Critères de sortie

1. `manifest.json` affiche `validated: true`, le bon SHA et les trois étapes `exitCode: 0`.
2. Neuf captures distinctes `Prospection` ont été vérifiées par la sentinelle de composition ; inspection humaine requise.
3. Aucun fichier SQLite, client, Projet ni profil installé n'a été ouvert ou modifié.
4. Les zones restant non vérifiées sont listées explicitement, sans les marquer PASS par défaut.
5. **PR #98 en draft : aucune fusion automatique.** La branche 02C locale reste indépendante et non écrasée.

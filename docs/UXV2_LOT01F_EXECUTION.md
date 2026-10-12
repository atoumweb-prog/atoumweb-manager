# 01F — Préférences persistées et atelier transversal isolé

## Reprise et périmètre

12/10/2026. Branche `codex/ux-v2-lot01f-preferences-v1`, depuis **01E@4653e58cfc6bfa338d34ece98fd9cb945d020656**, empilée sur #90. Le référentiel est `LOT-01F-PREFERENCES-RECETTE.md` de #82 ; ses états historiques de #81/#83 et du runner ne décrivent pas l'état GitHub actuel. #81 est déjà fusionnée, #83 fermée sans fusion ; les protections sont présentes et testées dans cette chaîne. Aucune nouvelle fusion de dépendance.

01F.1–01F.4 implémentés au périmètre composant/atelier ; 01F.5 exécuté techniquement, 01F.6 fournit ce bilan et les limites de revue. Aucun port métier ni début de lot02/03.

## Carte des réglages effectivement inspectés

| Référence | Stockage et comportement constatés |
|---|---|
| `src/main/ipc.ts` — bootstrap et `settings:set-*` | Lit/écrit `theme`, `display_density`, `show_hover_help` via DatabaseService. Noms, domaines et API préservés. |
| `DatabaseService.getSetting/setSetting` | JSON dans **settings de la SQLite du workspace**. Une écriture INSERT/UPSERT ; ce n'est pas un fichier de préférences global utilisateur. |
| `src/main/workspace.ts` | `userData/workspace.json` désigne le workspace ; chaque workspace a sa base dans data. Le bootstrap ne stocke pas les thèmes ni les dispositions. |
| `App.tsx` | Applique l'apparence après confirmation IPC. Aucune route ni préférence nouvelle raccordée ici par01F. |
| `VisualPreferenceStore`, 01C/01D | Interface synchrone existante, magasins auparavant localStorage des ateliers. Réutilisée par injection. |

## Contrat de dispositions retenu

`WorkspaceVisualPreferenceStore` utilise le propriétaire de réglages fourni, sous **ux_v2_visual_preferences_v1**, collection `{version:1,entries:{clé:JSON_visuel}}`. Le propriétaire est lié à une base/workspace immuable pendant une session ; aucune découverte implicite de workspace, aucun accès au bootstrap réel dans la classe.

Les schémas du pilote sont enregistrés explicitement : clés layout du module/vue, tableaux et collections personnelles de Dossiers/Autre vue. Normalisation par les helpers01C/01D existants : dispositionv0→v1, tableauv1→v2, colonnes/largeurs bornées, filtres autorisés. Les clés inconnues sont refusées en écriture ; anciennes entrées incompatibles sont ignorées à lecture, collection incompatible signale une erreur et nécessite reset explicite. Les futurs ports devront enregistrer leurs propres domaines, sans réutiliser les statuts synthétiques comme règles métier.

Seuls ordre/largeurs/visibilité/tri/filtres autorisés et métadonnées de vues personnelles sont sérialisés. Aucune note, query libre, identité de dossier, secret, action commerciale ou brouillon. Taille maximale de100000caractères par valeur : refus explicite, jamais troncature des vues valides. Le test60vues a reproduit puis empêché une troncature50 dans le premier incrément.

Le reset d'une clé est distinct du reset de **toutes les dispositions**. Ce dernier ne touche ni apparence, ni autre réglage, ni données, ni sauvegardes. Il ne réinitialise pas une SQLite. Aucun schéma/migration ajouté ; l'apparence conserve son stockage/API préexistants.

Deux fenêtres du même workspace partagent la dernière préférence confirmée par clé. Les écritures relisent la collection courante ; elles ne perdent pas les clés d'autres modules. Notifications de présentation et reset sont transmis aux composants sans remount du dossier. Les réponses d'apparence anciennes sont rejetées par révision de lecture. Les modifications simultanées de **la même clé visuelle** suivent le dernier enregistrement confirmé, sans fusion de notes ni garantie collaborative multi-utilisateur.

## Atelier et isolation

`FoundationWorkshop` assemble les composants01A–01E : réglages, aide explicite, tableau, fiche rapide/agrandie, séparateurs et deux formulaires fictifs. Les deux espaces restent montés lorsqu'un onglet est caché. Un seul lifecycle UX-01 est installé au parent ; les ateliers autonomes gardent leur comportement par défaut.

Le banc ouvre uniquement deux workspaces et un profil **créés sous son préfixe TEMP**. L'apparence utilise les vrais handlers settings/bootstrap du Manager et son DatabaseService ; le nouveau magasin utilise ce même propriétaire settings. La passerelle de dispositions est **propre au banc**, vérifie fenêtre/frame et schéma ; elle n'est pas ajoutée au preload de production. Le renderer n'expose aucune API workflow/createDemo/resetDemo, archive, contrat ou restauration. L'atelier n'est ni importé dansApp.tsx ni dans la navigation.

Le banc compare **toutes les tables autres que settings** avant/après, dans les deux bases, puis vérifie intégrité, FK et migrations1–66. Une seconde exécution Electron réouvre les mêmes bases/profil TEMP et prouve la persistance de thème/densité/aide, colonnes, filtres et largeur du bon module. La fermeture finale efface uniquement le TEMP dont la racine/préfixe sont vérifiés ; captures restent sous outputs ignoré.

## Validation et traçabilité

- Premier incrément **fc3fc3eecb38c76b00bc2d363b0b619e09dc5afe** : typecheck OK, ciblés48/48, suite **866/866 dans94fichiers,102,80s**, sansRPC ; atelier **62+14=76** contrôles, deux processus, neuf captures. La dernière revue a ajouté le test de non-troncature : échec reproduit60attendus/50obtenus, puis correction.
- Code final **31ed71e3632d62f20c9a520ee94b437a894a9c00** : ciblés **49/49** dans5fichiers, dont8adapter ; **typecheck OK**, complet **867/867 dans94fichiers,100,46s**, sortie0 sansRPC ; atelier **62+14=76** contrôles, neuf captures auSHAexact/dirty:false, deux processus et deux bases TEMP, intégritéOK/FKvide/migrations1–66. Restaurations35/35 conservées. Compléments01B sur code identique (rapports seuls en édition) : aide70/70, contrôles40/40, Abby25/25 ; TEMP nettoyés.
- Surfc3fc3e : régressions01E95/95, 01D126/126, 01C66/66, UX-01183/183 ; vrai renderer surfixture **300/300**, 17destinations existantes et six écrans dans neuf variantes. Aucun élément de navigation supprimé. Les seuls changements entrefc3fc3e et31ed71e concernent le helper de stockage et son test de troncature, pas ces composants ou routes.
- Neuf captures avec témoin de frame sous `outputs/ux-v2-lot01f-reference`. Revue visuelle directe AtoumWeb/Confort, Noir/Compact et Blanc/Confort+ ; pas une validation humaine globale ou WCAG revendiquée.

Incident de banc : un reload après actions uniquement scriptées n'avait pas l'activation utilisateur requise parChromium. Le scénario emploie désormais focus réel et touche native, vérifie `navigator.userActivation.hasBeenActive` avant reload ; le refus conserve les deux brouillons. Aucune modification du garde Electron/UX-01 pour faire passer ce test. Erreur `Injected preference disk refusal` attendue dans les logs : injection délibérée du refus IPC ; l'interface affiche l'échec, conserve valeur confirmée et note, sans faux succès.

## Écarts et suite

R01F-20(CI) reste différé faute de quota/protections confirmés ; R01F-22(revue humaine globale) reste différé conformément à la décision utilisateur. La matrice distingue ces limites des preuves techniques. Enregistrer et quitter et récupération crash ne sont pas activés ; aucun service métier rendu éligible implicitement.

Le raccord de ce magasin aux **réglages et services réels des modules** reste à réaliser dans leurs ports : contexte workspace, domaines de filtres, permissions, révisions, réinitialisation ciblée et changements de workspace différés. Le pilote montre une persistance physique réelle surfixture, pas une migration générale déjà livrée dans le Manager officiel.

La prochaine étape est le cadrage du **lot02**, après revue de ce socle et décision sur sa consolidation. Reprendre la navigation/entête/recherche/accueil selon le référentiel ; préserver les17destinations et les gardes. Ne pas commencer Prospection/lot03 avant ce passage : cette séquence remplace la proposition Prospection faite après01D. Aucun lot02 développé dans cette livraison, aucun merge/main, CIhébergée, donnée réelle ou Validation-MSI.

Lanceur isolé : `scripts/launch-ux-v2-lot01f-workshop.cmd`. Les données restent fictives ; seules les bases TEMP du banc sont utilisées et nettoyées à fermeture.

# Intégration AtoumWeb V3.9.4 / V1.5 — 8 novembre 2026

État : intégration technique et recette sur copies TEMP réalisées ; aucune activation de la préproduction. Branche locale `codex/integration-v394-v15-20261108`. Diffusion GitHub publique expressément autorisée par Carlos le 08/11/2026 après information ; push/PR de revue autorisés, sans fusion ni activation. Commit technique : abbe41f4f2af3170bcb48331b98f59aad68391a6.

## Références effectivement lues et conservation du lot 2

`00_LIRE_EN_PREMIER.md`, `ORDRE_MISSION_CODEX.md`, décision du dirigeant, trois Word finaux et leurs extractions, rapports/rectificatif 019/registres du pack. Préaudit séparé reçu ensuite : ETAT_GITHUB, README, RAPPORT, CONTROLES_SOURCE et outil Python intégralement inspecté puis exécuté en lecture seule sur Windows. Il confirme les sources, sans attribuer d’équivalence par nom.

AGENTS, PROJECT_STATUS, cahier V1, README, mémo UX, documentation des imports Catalogue/bibliothèque, RGPD V3 et reprise Clients lus ; services de Catalogue/versions/import, éditorial/clauses/types, Devis/préparation/snapshots et migrations examinés. Le mémo du 03/11 et les préconditions V1 (112/118/409) sont des références historiques, pas les quantités finales.

Avant Git : archive des 50 fichiers locaux, patch binaire, inventaire et empreintes dans `outputs/Integration-V394-V15-20261108/PRESERVATION-LOT2-AVANT.zip`. Commit préalable `c7ee0a3c51b77d6bb92769f3614cecef4528daa7` sur la seule branche d’intégration. Aucune perte, aucun reset/clean/stash/rebase. Ancienne branche Offres & Tarifs conservée à `57ad50fd41c2de038015b346edae0751c7f8b785`, comme son distant ; aucun autre worktree modifié.

GitHub contrôlé : dépôt `atoumweb-prog/atoumweb-manager`, main `921f0066fb780634b51cd49dd32f84f11cd2c45e`, PR historiques #165 Contrats/Catalogue et #164 RGPD toujours distinctes. Base proposée pour la PR : branche Offres & Tarifs publiée, pour montrer le lot 2 conservé puis l’intégration sans mélanger le reste de main. Aucune PR historique modifiée.

## Intégration réalisée

Les trois Word sont conservés sans modification dans `data/approved/2026-11-08/`, avec JSON dérivés, décision et manifeste SHA256. 22 empreintes du pack vérifiées ; comparaison directe de 923/959/379 paragraphes des Word : noms/codes/prix/statuts et paragraphes commerciaux/contractuels concordants. Retours à la ligne Word pris en compte. Les annexes métier internes restent séparées des 119 corps client.

L’adaptateur `ApprovedPackService` orchestre **CatalogImportService** et **ContractEditorialDraftService** existants, sous transaction globale. Simulation liée à un hash, refus de collision/source changée/plan périmé, reçus des imports existants, rollback global et rejeu sans nouvelle version ni activité. L’ancien import bibliothèque 118/409 reste inchangé dans sa doctrine historique ; le chemin éditorial versionné est étendu pour la nouvelle source et ses brouillons antérieurs. Aucun moteur de calcul ou de contrat concurrent.

130 références : codes source, montants affichés, modes numériques, inclusions/exclusions, 8 statuts, version et provenance conservés. Les **47** délégations ne deviennent pas des validations individuelles ; **6** fiches à vérifier, références anciennes et bases internes restent restreintes. Publication refusée pour ces statuts sur les nouvelles versions ; aucun prix fictif. 29 €/an de gestion de domaine reste accompagné du prix registrar dans la source et d’une vigilance explicite au devis, pas d’un total tout compris inventé.

119 clauses : code/public/numéro/provenance/texte intégral ; nouvelle version des identités existantes quand elles sont présentes, sans réécriture des versions publiées ou brouillons anciens. Le changement historique documenté BLOG-DONNEES → BLOG-ROLES-CONTENUS n’est porté que par la nouvelle version, sans renommage immédiat du modèle ni alias automatique. Clause 019 corrigée ; 022/033/069/102/119 conservées textuellement. Clause 119 exclue du socle automatique des nouveaux assemblages : aucun consentement commercial présumé.

## Avant/après constaté sur copie du backup confirmé

Source confirmée : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-UX-V2-20261104/Workspace-TEST/data/atoumweb-manager.sqlite`, profil voisin `Profil-TEST`. Source lue uniquement pour le préaudit ; application sur sa copie TEMP. Empreintes SQLite/WAL inchangées.

| Élément | Avant | Après import TEMP non publié |
|---|---:|---:|
| Articles | 44 | 153 : 21 IDs repris, 109 créations |
| Versions Catalogue | 44 publiées | 44 publiées inchangées + 130 brouillons |
| Identités / versions de clauses | 0 / 0 | 119 / 119 brouillons |
| Règles par version | 0 | 130 |
| Compositions | 11 | 19, anciennes conservées |
| Rattachements de blueprints | 2 | 3, anciens conservés |
| Devis / lignes historiques | 2 / 3 | 2 / 3 inchangés |
| Types contractuels / liens article-clause | 0 / 0 | 0 / 0 : aucune activation de cartographie implicite |

Les lignes/champs historiques des **142 tables** sont conservés ; seules l’affectation de codes AW/provenance d’identité et la métadonnée updated_at des 21 articles rapprochés sont autorisées par le mapping. Noms/catégories vivants préservés ; le nouveau libellé de version est utilisé dans les nouveaux devis issus du pack. Les **487 objets SQL** sont identiques après import (aucune nouvelle migration de données requise pour cet import sous schéma 80). FK vides, intégrité ok, aucune des 130 versions source publiée.

Correction documentée de l’investigation : l’hypothèse annoncée de 21 paires de brouillons était inexacte. Les 44 anciennes versions sont **publiées** ; les 21 reprises ajoutent un seul brouillon. Zéro brouillon opérationnel multiple constaté. Aucun reclassement n’a été effectué.

## Rapprochement des codes

[RAPPROCHEMENT-CATALOGUE-130.csv](RAPPROCHEMENT-CATALOGUE-130.csv) : IDs de la base de référence distingués des nouveaux IDs alloués sur copie TEMP. Les 21 reprises utilisent le manifeste historique explicite des anciens IDs, avec préconditions de version ; aucun rapprochement flou par nom. Les autres créations refusent un même nom non justifié au lieu de fusionner automatiquement.

[RAPPROCHEMENT-V39-18.csv](RAPPROCHEMENT-V39-18.csv) : pour chacun des 18 codes, aucun ID équivalent démontré dans cette base. 18 nouveaux candidats distincts, avec identifiant V39 conservé dans la provenance et le reçu ; `canonical_code` reste NULL conformément au schéma AW. Aucun code AW inventé, aucun alias/renommage automatique. Les IDs TEMP ne sont pas annoncés comme déjà actifs dans la préproduction. Recherche de ces identifiants de source disponible en administration.

La cartographie historique de 409 liens est fournie en **proposition non appliquée**, avec la filiation BLOG documentée. Elle ne constitue pas une nouvelle validation universelle des associations du pack ; les rattachements/types/version de clause restent à choisir explicitement dans les mécanismes existants avant utilisation commerciale, notamment pour les 18 références provisoires. Aucun ajout de lien ne vient modifier le comportement des clauses publiées existantes.

## Règles V1.5 et limites fonctionnelles

| Domaine | Réalisation / limite |
|---|---|
| Woo Essentiel / Business / Visibilité | Données 1 490 / 1 990 / 2 390 € ; 10 / 25 / 25 produits au total ; contrôle d’un nombre inclus incohérent ; blocage d’une double ligne newsletter/GA/avis déjà incluse. Un périmètre distinct déclaré reste vérifiable, sans suppression automatique. |
| Sauvegardes/version/snapshots | Services lot 2 conservés, nouveaux imports atomiques/idempotents, sélection par IDs exacts dans la recette ; aucun devis accepté/contrat signé réécrit. |
| Renouvellements | Nouveau mode explicite `contractual_automatic` dans le JSON versionné et les présentations, distinct d’express/mensuel sans engagement. Guidage selon la version vendue : maintenance annuelle/domaine hors mariage exprès ; Lune/GBP/statistiques/newsletters selon contrat. Aucun contrat reconduit automatiquement par cet import. |
| Prix mensuels/annuels | Vigilances 30 jours + résiliation / prix annuel fixe puis accord écrit ; pas de modification ou facturation automatique. |
| Impayés | Clause 019 exacte et contrôle interne J+7/J+15/J+23 ponctuel, J+30/J+60 récurrent ; aucune suspension/suppression automatique. |
| RC Pro / médiation / référence commerciale | Alertes visibles, pas d’attestation de couverture/convention ni consentement logo présumé ; décision RC Pro distincte. |
| B2C et preuves | Mécanismes existants de qualification, rétractation, documents, acceptation/version/snapshot conservés et testés. Notifications nominatives de reconduction et résiliation électronique ne sont **pas** développées par ce lot ; absence signalée. |
| RGPD / sauvegardes / Abby | Services existants par Site conservés, contrôles/documents restant à compléter visibles ; pas de sauvegarde o2switch inventée, pas de moteur de facture réglementaire parallèle. |
| Référentiel complet | 344 blocs consultables/recherchables en lecture seule dans Catalogue/Contrats ; leur présence documentaire ne signifie pas que chaque décision historique est un nouvel automatisme implémenté. |

## Contrôles exécutés

- `npm run typecheck` : réussi.
- Campagne ciblée sur 13 fichiers : **161/161**. Complément bibliothèque historique + reprise des 6 tests de politique : **7/7**, dont **1 nouveau test**, soit **162 tests distincts** avant les compléments ci-dessous sur ces périmètres, sans addition trompeuse des rejeux. Preuves JSON conservées.
- Compléments : 1 nouveau cas de reçu durable après changement manuel du nom/provenance (24/24 sur imports Catalogue + pack), puis 9/9 tests export/réimport Word/PDF de travail. **172 tests distincts** réussis au total sur les périmètres de ce chantier, les rejeux étant dédupliqués.
- Recette réelle React/preload/IPC Electron : **13/13** dans les trois thèmes / Confort, zéro erreur renderer, recherche V39 et référence V1.5, consultation sans changement des devis/snapshots, FK/intégrité conformes, aucune capture de galerie produite.
- Backup/restauration antérieurs réutilisés ; backup/restauration de l’intégration finale puis migration 81 sur une seconde copie TEMP : réussite, aucun brouillon multiple, 142 tables historiques conservées avant essais fonctionnels, objets/FK préservés selon la spécification 81, création nom/type seuls, sauvegarde, réouverture/reprise, duplication et idempotence réussies. Base habituelle non migrée.
- **14 simulations Devis/Contrat**, professionnels et consommateurs : vitrine, trois Woo, quatre maintenances, Lune, mariage, GBP, statistiques, newsletters ponctuelle/récurrente. **14 PDF + 14 DOCX** par les générateurs existants, versions source choisies explicitement ; publication des seules fixtures Catalogue dans une copie supplémentaire, pas de publication sur la copie d’intégration. Aucun devis finalisé ou signé. Inclusions/exclusions via le formateur de périmètre existant.
- DOCX ouverts en lecture seule par Word installé pour rendu PDF ; LibreOffice absent, tentative du helper document signalée non concluante. Rendu PDF.js et contrôle textuel/géométrique, contrôle visuel en planches et pages représentatives ; aucune certification de relecture juridique ou de chaque ligne au zoom maximal. **154 pages** finales contrôlées : aucune page blanche ni caractère hors page détecté, clause 019 sans code interne. Export Word de travail stabilisé en A4/18 mm et suppression des seuls paragraphes de mise en page vides en fin de document, sans changement du texte métier.
- `npm run package -- --arch=x64` : paquet Windows x64 construit, non installé/non déployé.
- `git diff --check` : conforme.

Incidents corrigés pendant recette : noms de méthodes/paramètres et type d’adaptateur erronés dans de nouvelles fixtures ; premier moteur de rendu appelait une méthode PDF.js incorrecte ; rendu Word de secours via Word installé. Un test complet dépassait 5 s sous charge : préchargement des provenances optimisé et timeout ciblé à 20 s pour la suite d’import complet. Le libellé du nouveau mode de reconduction et les fins de ligne ont été corrigés avant la campagne réussie. Les preuves des essais interrompus restent locales ; les résultats finaux sont ceux indiqués ci-dessus.

## Activation et retour arrière — aucune exécution habituelle

1. Décider d’abord la destination Git : dépôt **PUBLIC**, confirmé par connecteur et `gh repo view` (isPrivate=false). Le pack est approuvé pour intégration interne/non publié. Les commits locaux contiennent Word, prix, clauses et règles : un push les rendrait consultables publiquement. Cette diffusion a été expressément autorisée par Carlos le 08/11/2026. Aucune modification de visibilité du dépôt n’est effectuée.
2. Après revue/autorisation séparée, fermer les écritures, vérifier le profil/chemin exact, renouveler la sauvegarde SQLite/WAL et tester sa restauration. Le backup de travail reste local ; aucun SQLite/profil/secret dans Git/ZIP de revue.
3. Répéter sur copie récente le plan importé, les 21 mappings et les contraintes 81. Aucune incompatibilité sur la copie actuelle ; si plusieurs brouillons apparaissent ailleurs, arrêt et décision ciblée, jamais abandon/reclassement automatique.
4. Choisir et faire autoriser le mécanisme d’application sur la base habituelle : le CLI livré reste **TEMP-only**, la migration 81 garde sa restriction et reste hors démarrage automatique. Aucun handler d’activation réel exposé. Ne pas contourner ces gardes avec un changement de chemin.
5. Livrer un runtime actualisé depuis cette branche dans une livraison distincte ; celui du 04/11 ne contient pas ces nouveautés. Importer volontairement avec hash exact, vérifier lignes/versions/références/contrôles, conserver les 130/119 candidats non publiés. Choisir associations/types/versions et éventuels codes canoniques provisoires sans inventer d’équivalence. Les anciennes références non commercialisables doivent être exclues des futurs usages lors de cette activation explicitement approuvée ; aucun tarif historique ne sera réécrit.
6. Publication commerciale séparée de l’import, avec les 6 restrictions et 47 statuts conservés, clauses adaptées au public/devis et obligations encore manquantes visibles. Aucun accord d’assurance/médiation/consentement inventé.
7. Échec pendant import/migration : rollback transactionnel. Après succès : restauration cohérente base/code/profil après décision et préservation des écritures postérieures ; pas d’ancien binaire seul ni de downgrade destructif.

Aucun audit général, développement du lot 3 UX/UI, travail d’un autre worktree, déploiement ou fusion n’a été engagé. Les 39 décisions OT et leurs limites restent distinctes de cette intégration métier.

## Publication GitHub autorisée et réalisée

Le 08/11/2026, Carlos a expressément autorisé le push et la PR sur le dépôt public. Branche poussée normalement sur origin/codex/integration-v394-v15-20261108 ; [PR #166](https://github.com/atoumweb-prog/atoumweb-manager/pull/166) ouverte en brouillon vers codex/ux-v2-offres-tarifs-20261106. GitHub indique MERGEABLE/CLEAN, aucun contrôle CI distant sur cette base ; les validations rapportées sont locales. Aucun merge, activation habituelle ou déploiement. Les commits documentaires de suivi ne modifient pas le code testé.

# Convergence UX V2 Sites & Pages / Clients / Offres & Tarifs

> Suite des retours du 09/11 : nouvelle [recette de cohérence visuelle](COHERENCE-VISUELLE-CONVERGENCE-2026-11-09.md), avec livraison indépendante et profil TEMP distinct. Ce rapport conserve les preuves de la convergence initiale.

Finalisation et correction des libellés le **9 novembre 2026** ; le nom du dossier conserve la date de démarrage du 08/11.

## Livraison locale pour revue

Branche **`codex/convergence-ux-v2-20261108`**, worktree `C:/Users/AtoumWeb/.codex/worktrees/convergence-ux-v2-20261108/atoumweb-manager-ec04-validation`. Base `fb1ffa622fc12532c758f9da7299cb990714f5ee`, dernier correctif accepté de la PR #166. Aucun commit, push, nouvelle PR ou fusion.

Runtime Windows x64 construit avec Electron Forge/Vite et Electron 44.3.0, dans **`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-CONVERGENCE-UX-V2-20261108`**. Démarrer `OUVRIR-CONVERGENCE-TEMP.cmd`. Le lanceur utilise exclusivement son profil et son workspace sous `%TEMP%/atoumweb-convergence-ux-v2-cs31jwy7/`. Le runtime habituel du 04/11 n'est pas remplacé.

Ce runtime réunit les deux chantiers pour une revue de convergence ; il ne constitue pas une activation commerciale. Le titre/bandeau RECETTE / TEST et le drapeau `--functional-recipe` restent présents. Les dossiers TEMP de cette livraison doivent être conservés pour reprendre la revue ; ne pas les confondre avec une sauvegarde pérenne.

## Sources et préservation

1. Sites & Pages : branche `codex/ux-v2-sites-pages-lot2-20261103`, HEAD `9ca5a7edf10f50b3a688e11f76e0c929b6bc82b1`, **17 fichiers locaux modifiés/non suivis** conservés. La livraison du 04/11 déclare ce même HEAD et cet inventaire local. Empreintes des bundles de cette livraison concordantes avec `RECETTE-TEST.json` ; marqueurs compilés `assertSiteNodeWritable`, `siteReadOnly`, `focusedWorkshop` effectivement retrouvés. Pas de sourcemaps dans cette livraison : pas de prétention à une reconstruction binaire bit à bit de l'ancien runtime.
2. Offres & Tarifs / pack : PR #166 au SHA `fb1ffa62`, avec les **16 fichiers locaux** de la dernière préparation (correction de convergence historique, tests, outils et documents).
3. Avant intégration : archives ZIP, patches binaires, états Git et empreintes dans `outputs/Convergence-20261108/PRESERVATION-SOURCES.json`, `sites-avant.zip`, `offres-avant.zip`. Les documents source ne sont pas remplacés par ceux de l'autre chantier.

Tous les fichiers locaux des sources restent à leur emplacement, avec leurs états Git et empreintes revérifiés après construction/recette. Aucun reset, stash, clean, commit ou déplacement dans les sources. Les autres worktrees ne sont pas modifiés.

## Comparaison et résolution

Les huit fichiers applicatifs suivis de Sites & Pages ont une version HEAD **identique octet pour octet** à leur version dans `fb1ffa62`. Les changements locaux ont donc été appliqués sur cette base vérifiée : aucun conflit de code, aucun écrasement d'un changement Offres & Tarifs, aucune copie de dossier complet.

- Backend : `ProjectBlueprintCompositionService`, `ProjectNodeArrangementService`, `ProjectService`, `ProjectSiteService`, `AtoumWebCompositionService`.
- Renderer : `ProjectCompositionItemSettings`, `ProjectPageCompositionPanel`, `ProjectSitesTab`.
- Ajouts repris : garde `archivedSiteGuard`, test `ArchivedSiteReadOnly`, CSS Sites V2 et trois fichiers de banc/fixtures.
- Documents : le suivi Offres & Tarifs est conservé ; les décisions Sites & Pages sont référencées ici et leur entrée du journal Bridge est reprise dans le journal commun. Aucun remplacement du PROJECT_STATUS par l'ancienne version Sites.
- Le correctif local de `ConvergenceReviewService` reste conservé : origines V3.7 absentes = conflits visibles, aucune substitution par code ou nom et aucune réécriture.

Une adaptation supplémentaire strictement liée à l'isolation du runtime est ajoutée : `convergenceTempGuard`. Le drapeau propre au nouveau lanceur vérifie **avant ouverture/restauration du workspace** la racine TEMP, le profil et le workspace exacts ; le sélecteur de workspace retourne « annulé » dans ce mode. Sans ce drapeau, le démarrage normal est inchangé. Aucun nouveau moteur métier ni migration automatique.

## Matrice des fonctionnalités préservées

| Fonction | Source retenue | Preuve de convergence |
|---|---|---|
| Accueil, shell, navigation UX V2 | Socle PR #166 et ancêtres UX | Démarrage du vrai paquet, navigation six modules |
| Clients V2 | Code PR #166 inchangé | Fiche rapide, huit onglets, association Client → Projet |
| Sites & Pages V2 | Modifications locales livrées le 04/11 | Arborescence, fiche Page/composants, aperçu Page/module et réglages |
| Sites archivés | Garde backend + désactivation des commandes UI | 16 contrôles natifs ciblés : mutations refusées, consultation, réutilisation indépendante, réactivation explicite |
| Compositions, snapshots et versionnement | Services existants avec gardes Sites | 20 tests de composition et 11 tests Sites ; références non vides dans la duplication Catalogue |
| Offres & Tarifs lots 1/2 | PR #166 | Huit onglets, 130 brouillons via preload/IPC ; sauvegarde, reprise physique, duplication et révisions |
| Catalogue, Devis, Contrats | PR #166 + correctif local conservé | Sélecteur de versions publiées, refus des versions non publiées/restreintes ; bibliothèque ouverte sans erreur de convergence |
| Adaptateurs V3.9.4/V1.5 | PR #166, sources approuvées inchangées | Copie intégrée déjà acceptée, contrôles finaux 130/119/18/47/23 |

Les fonctions/OT des lots suivants restent partielles ou reportées. Aucun lot 3 développé, aucune modification de prix ni de clause.

## Base et fichiers du workspace

La copie intégrée acceptée est restaurée via API SQLite dans le nouveau workspace TEMP, **schéma 81**. Les fichiers du workspace source sont copiés à part du répertoire de bases/sauvegardes ; aucune copie naïve d'un SQLite ouvert. Trois `projects.resource_root_path` sont redirigés vers les ressources copiées, exclusivement dans la copie, pour éviter d'écrire dans les dossiers habituels. Aucun chemin de snapshot ni contenu contractuel historique n'est réécrit.

État final attendu et contrôlé : 153 articles, 174 versions (44 historiques publiées et 130 nouvelles brouillon), 119 clauses brouillon, 18 provenances V39 avec code canonique NULL, 47 délégations, 23 anciens articles hors pack, zéro association Catalogue→clauses/types nouvelle. Les 2 devis et 3 projets préexistants sont conservés. Intégrité `ok`, aucune violation FK.

Le banc de services hérité de l'exercice précédent utilisait trois publications dans une sous-copie jetable. Pour cette convergence, sa preuve retenue est **`SERVICES-SANS-PUBLICATION.json`**, mode `--no-publication` : aucune version du pack publiée, même dans sa sous-copie fonctionnelle. Le parcours Devis utilise une ancienne version déjà publiée. Les essais antérieurs restent des traces locales, pas une autorisation de publication.

## Contrôles réellement exécutés

- Typecheck réussi.
- **40 tests ciblés réussis** : 5 archives Sites, 11 services Sites, 20 compositions/blueprints, 2 origines de convergence absentes, 2 isolation TEMP. Pas de suite générale des 172 tests, pas de nouvelle série documentaire.
- **35 contrôles de services sans publication** : création minimale et idempotence, sauvegarde/révision, redémarrage physique, reprise exacte, abandon/restauration, duplication indépendante et rejeu (composition + blueprint non vides), refus du brouillon incomplet, des nouvelles versions non publiées et des 12 versions restreintes ; préparation depuis une version historique publiée et montants finis ; 130 versions du pack toujours brouillon.
- **30 contrôles Electron sur App React/préchargement/IPC compilés depuis le worktree**, incluant les 16 contrôles Sites archivés, les huit onglets Clients/Offres, le lien Client→Projet et les modules Devis/Contrats. Une erreur IPC d'archivage est déclenchée volontairement pour vérifier le refus ; aucune autre erreur backend ni renderer.
- **17 contrôles sur le vrai exécutable Windows packagé** : profil/workspace exacts via bootstrap réel, schéma 81, 130 brouillons, sélection d'un autre workspace bloquée, Accueil/Clients/Projets/Offres/Devis/Documents & Contrats, bibliothèque et absence d'erreur backend/renderer.
- **24 contrôles ciblés des libellés**, à 1920 et 1280 px dans Noir, Blanc et AtoumWeb : Source sur une ligne, largeur réservée aux intitulés, aucun libellé visible tronqué. Cause : une valeur de provenance très longue comprimait le libellé dans le flex ; grille à deux colonnes et provenance sur toute la largeur, sans cacher la valeur. Trois assertions supplémentaires dans le vrai paquet vérifient aussi ce correctif.
- Trois captures Electron finales uniquement : Sites & Pages/composition, Clients V2 et fiche Offres avec huit onglets, Noir/Confort, 1920×1080, zoom 100 %. Elles proviennent du banc de convergence, pas de captures retouchées ni d'une nouvelle galerie complète.

Deux ajustements de banc sans effet applicatif : échappement des sélecteurs dans le script généré, suppression du fichier de port CDP périmé avant relance. Le premier rendu avait suivi le facteur DPI Windows ; les trois captures finales ont été reprises avec facteur forcé à 1. Aucun test métier affaibli.

## Décisions contractuelles ciblées avant publication

Le résultat accepté reste **368 associations structurellement candidates, 41 incertaines, 21 références sans lien historique**. Aucun nouvel arbitrage des 409 liens ni écriture d'association.

1. **Newsletters** : retenir les engagements de production/BAT/cadence/prise d'effet depuis V1.5 pour les six prestations de campagnes ; la clause 112 d'intégration technique ne constitue pas seule leur contrat de production.
2. **Vitrine Business/Visibilité** : choisir les modules applicables aux inclusions réelles, sans imposer le forfait cinq pages à une gamme différente.
3. **Domaines/Lune** : distinguer domaine standard hors mariage (gestion + registrar), hébergement Lune seul et domaine compris dans le mariage ; pas d'équivalence ou de double facturation automatique.
4. **Priorités/urgences** : lier la modalité au périmètre principal et à l'échéance acceptée, sans garantie supplémentaire inventée.
5. **Public** : choisir le socle consommateur/professionnel, préserver rétractation/médiation/reconduction/résiliation et états RGPD/RC Pro réels. Aucun justificatif déduit de l'import, aucun consentement commercial présumé.

Les clauses approuvées ne sont pas réécrites pour contourner un lien manquant. Les 41 liens restreints restent bloqués pour activation directe.

## Remplacement futur — seulement après autorisation

1. Faire examiner cette convergence et ses modifications locales, puis obtenir l'autorisation distincte de commit/push et de livraison. La PR #166 demeure à `fb1ffa62` ; ne pas présenter ce runtime local comme son commit publié.
2. Identifier le code final approuvé par SHA **et manifeste des modifications**, construire une livraison dans un nouveau dossier ; vérifier ses empreintes et répéter les contrôles propres au paquet. Conserver le runtime du 04/11 et son raccourci sans écrasement.
3. Pour la base habituelle, obtenir l'autorisation sur les chemins exacts et le périmètre : 81 + import brouillons séparés de toute publication. Manager fermé : sauvegarde SQLite cohérente tenant compte du WAL, restauration vérifiée, archive des fichiers du workspace et du profil/configuration.
4. Réexécuter précontrôle, doublons de brouillons, intégrité/FK et plan d'import sur l'état du jour. Si plusieurs brouillons opérationnels ou collision apparaissent, arrêter et présenter leurs IDs/références ; aucun reclassement ou abandon automatique.
5. Une commande de maintenance contrôlée **hors TEMP reste à développer/revoir après autorisation** : chemin/profil stricts, journal, sauvegarde obligatoire, transaction, contrôles finaux et arrêt sur anomalie. Les helpers actuels restent TEMP uniquement ; ne pas supprimer leurs gardes ni activer 81 par le démarrage normal.
6. Après migration et import autorisés, conserver les 130/119 brouillons, rejouer sans doublon et vérifier historiques/ressources. Basculer alors le raccourci vers le nouveau runtime et le profil habituel confirmé, avec un lanceur destiné à cet environnement, **pas** le lanceur TEMP verrouillé livré ici. Faire la recette ciblée avant reprise des saisies.
7. Activer seulement les associations/compositions et publications précisément autorisées dans une phase séparée. L'acceptation de cette convergence n'autorise pas la publication commerciale.

Retour arrière : fermer Manager, préserver les écritures et pièces nouvelles, puis restaurer la sauvegarde cohérente par API avec son runtime/profil compatibles. Annuler les transactions non terminées ; ne jamais ouvrir un schéma 81 avec le seul ancien binaire ni écraser un `.sqlite` encore ouvert avec WAL. Pas de downgrade SQL destructif. Le runtime précédent et son lanceur restent disponibles mais ne doivent pointer que vers une base compatible restaurée.

## Réserves et preuves

Code et documents non commités uniquement dans le nouveau worktree ; aucun changement source ni préproduction habituelle. Une validation de convergence sur copie n'est pas une autorisation d'installation. Maintenance hors TEMP, décisions d'associations et publication restent distinctes. Les autres thèmes conservent leur code ; pas de nouvelle certification graphique exhaustive ni nouvelle refonte.

Preuves : `outputs/Convergence-20261108/` — `PRESERVATION-SOURCES`, `VERIFICATION-FINALE`, `LIVRAISON`, `ELECTRON-CONVERGENCE-FINAL`, `SERVICES-SANS-PUBLICATION`, `RUNTIME-PACKAGE-REVUE-20261109`, `CONTROLE-LIBELLES-20261109`, captures, archives source et manifeste. Les bases/profils restent hors Git et hors ZIP de revue.

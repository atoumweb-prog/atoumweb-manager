# Manager — consignes et reprise courte

## État courant et prochaine action — UX lot 1, 3 novembre 2026

**Lot 1 validé officiellement par Carlos le 03/11/2026 ; commit et push de la seule branche UX autorisés.** Worktree `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ux-home-shell-lot1-20261103`, branche indépendante `codex/ux-v2-home-shell-lot1-20261103`, HEAD de départ `8a24ae37d10573b7db54cc0268c6e9c0959e8532` avant le commit de validation du lot 1. Toutes les évolutions UX de #165 sont conservées dans cette ascendance ; la pile contractuelle héritée n’est pas un nouveau delta à intégrer. Autorisation limitée à l’enregistrement du lot 1 et de ses tests sur cette branche UX ; aucune fusion, intégration dans main ou modification des PR contractuelles.

**Réalisé :** collision Temps & facturation corrigée selon la largeur disponible, alertes sous la hauteur réelle de l’en-tête, barre optimisée à 125/150 %, ordre et commandes de personnalisation cohérents / accessibles, rail plus lisible et groupe actif replié repérable. Logo Accueil sans plaque : réutilisation du vecteur existant, aucun original redessiné ; variante réservée à l’Accueil, symbole réduit sans plaque dans Noir/Confort seulement. Routes, fonctionnalités, préférences et chrono unique conservés ; aucun service métier, contrat, Catalogue, RGPD, migration ou donnée réelle modifié.

**Validation technique locale :** typecheck, 44 tests ciblés et 96 contrôles natifs réussis ; 18 états Noir/Confort, 42 PNG après (29 homologues + 13 complémentaires), cinq compléments avant avec valeurs non nulles. Aucun chevauchement de texte Temps mesuré dans ces cas, zéro débordement global, zéro erreur renderer ; fixture TEMP nettoyée. Chrono actif/dialogue, garde UX01 et préférences contrôlés. Échantillon fonctionnel d’autres thèmes/densités distinct de toute validation graphique globale. Détails dans [PROJECT_STATUS.md](../../PROJECT_STATUS.md), banc `scripts/check-home-shell-lot1.cjs`, dossier de revue `AtoumWeb_Manager_UX_LOT1_AVANT_APRES_2026-11-03.zip` dans Downloads.

**Décision visuelle prioritaire :** finaliser l’identité bleu nuit/jaune en **Noir, Confort** avant généralisation ; continuer ensuite écran par écran sur accord. Aucune refonte volontaire de Clair/Blanc ou AtoumWeb : fonctionnement partagé préservé, déclinaison graphique ultérieure dans un chantier distinct, après validation explicite. Ce lot reste limité à Accueil, en-tête et rail.

**Validation du 03/11 :** Carlos valide officiellement le rendu Accueil / en-tête / navigation après revue du dossier AVANT/APRÈS. Résultats conservés : typecheck, 44 tests ciblés et 96 contrôles natifs ; aucun changement fonctionnel depuis le candidat relu, donc aucune relance de tests ou captures pour cet enregistrement documentaire.

**Prochaine action après cet enregistrement autorisé :** attendre un nouvel accord. Le lot validé est destiné à la seule branche `codex/ux-v2-home-shell-lot1-20261103`. Le lot 2 et l’intégration dans main ne sont pas autorisés. Les checkpoints et autorisations ci-dessous sont historiques. Ce fichier reste le point de reprise unique, avec [AGENTS.md](../../AGENTS.md), [PROJECT_STATUS.md](../../PROJECT_STATUS.md) et la [roadmap Bridge](../MANAGER_BRIDGE_ROADMAP.md) pour son périmètre propre.

## Historique — checkpoint documentaire du 3 novembre 2026

**Point d’entrée unique de reprise du Manager.** Lire [AGENTS.md](../../AGENTS.md), puis ce fichier ; ne pas reprendre tout l’historique des conversations. Le dépôt et le code restent les sources de vérité techniques. [PROJECT_STATUS.md](../../PROJECT_STATUS.md) porte le suivi détaillé ; les rapports liés portent les preuves. Pour Manager ↔ Bridge, conserver la [roadmap commune](../MANAGER_BRIDGE_ROADMAP.md), sans ouvrir implicitement un chantier Bridge ni créer une feuille de route concurrente.

**Situation :** le socle stable est dans `main@921f0066fb780634b51cd49dd32f84f11cd2c45e` (PR #156 fusionnée). La convergence commerciale, RGPD et V3.8 est développée sur des branches en brouillon, non fusionnées. Ses résultats de test ne constituent ni une validation humaine globale ni une publication des clauses ou tarifs.

**Autorisation documentaire du 03/11 :** Carlos a validé cette actualisation et autorisé un commit portant exclusivement sur ce fichier, puis son push sur la branche existante de la PR #165. Aucune fusion, modification fonctionnelle, modification de main, d’AGENTS.md ou de base SQLite, aucun test applicatif ni déploiement n’est autorisé dans cette intervention. Les anciennes autorisations restent historiques.

**Prochaine action :** après cet enregistrement documentaire, attendre le choix de Carlos sur les arbitrages ou le prochain lot. Ce fichier demeure le point de reprise principal ; toute actualisation après un chantier important intervient après autorisation.

**Suite proposée, sans lancement implicite :** arbitrer les écarts Catalogue et les clauses V3.8, puis autoriser un lot ciblé ou un candidat d’intégration. Ne pas recréer les moteurs existants. Une recette du candidat final sera à définir selon les changements de code, migrations, fixtures et assemblage ; ne pas relancer les campagnes historiques sans cause pertinente.

## Git vérifié le 03/11/2026

Dépôt : `atoumweb-prog/atoumweb-manager`. Ces références sont une photographie, à revérifier avant intervention.

| PR | HEAD observé | État | Base / rôle |
|---|---|---|---|
| [#157](https://github.com/atoumweb-prog/atoumweb-manager/pull/157) | `9883f8d9` | Ouverte, brouillon | `main` ; passation moteur Devis, ancêtre de #158, ne pas intégrer séparément sans réévaluation |
| [#158](https://github.com/atoumweb-prog/atoumweb-manager/pull/158) | `488e6393` | Ouverte, brouillon | `main` ; référentiel commercial |
| [#159](https://github.com/atoumweb-prog/atoumweb-manager/pull/159) | `4c80433a` | Ouverte, brouillon | Branche de #158 ; relecture rédactionnelle |
| [#161](https://github.com/atoumweb-prog/atoumweb-manager/pull/161) | `742e8728` | Ouverte, brouillon | Branche de #159 ; convergence contrats / Catalogue |
| [#164](https://github.com/atoumweb-prog/atoumweb-manager/pull/164) | `088de136` | Ouverte, brouillon | Branche de #161 ; RGPD V3 par Site |
| [#165](https://github.com/atoumweb-prog/atoumweb-manager/pull/165) | `eb9c5b98` | Ouverte, brouillon | Branche de #164 ; sources et préparation V3.8 |

- Checkout de cette actualisation : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-contract-audit-20261031`, branche `codex/v38-contract-catalog-finalization-20261102`, HEAD de départ `eb9c5b98ad868260399da0e22d1093b8f821cf5b`, propre avant modification documentaire. Le tableau ci-dessus décrit les HEAD observés avant le commit documentaire du 03/11 ; celui-ci ne change pas le code du candidat.
- Ancien checkout de recette : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation`, branche `codex/internal-reference-handoff-20261027`, HEAD `75b9611c`, cinq fichiers non suivis préexistants à préserver. Ne pas le confondre avec le candidat #165.
- Ordre de dépendance proposé : #158 → #159 → #161 → #164 → #165. Ce n’est pas une autorisation de fusion ni une preuve d’intégration finale.
- `488e6393` n’est pas ancêtre direct de #165 ; son correctif CRM Windows est repris par `d8ea6f75` et `48d78613`, avec le même `patch-id` stable `780cd4b36909414718d25a50992c82c810568ea7`. Confronter les diffs et arbres finaux, pas seulement les comptes ahead/behind.
- Les commits Prospection `0552339f` et `c4ab9cfc` du dépôt séparé `atoumweb-manager-prospection` sont ancêtres de #165 : ne pas les réintégrer séparément.

## Fonctionnalités : intégration, développement et validation

| Périmètre | État technique | Validation restant à obtenir |
|---|---|---|
| Accueil, navigation, Clients, Projets, Interventions, temps, statistiques, réglages, documents, sauvegardes | Socles déjà intégrés à `main` ; évolutions UX/CRM ultérieures sur branches | Recette transversale du candidat final ; le socle EC04 reste expérimental, sauvegarde complète non activée / non certifiée pour production |
| Prospection | Parcours enrichi et liens CRM / Devis présents dans l’ascendance de #165 | Parcours humain Prospect → Client et continuité des associations |
| Contrats / Catalogue V3.7 | Comparaison, simulation, préparation atomique volontaire de 118 brouillons contractuels et six brouillons Catalogue ; décisions humaines versionnées, migrations 76–79, sur la pile de branches | Revue humaine et décision explicite avant toute publication ; aucune adoption automatique |
| RGPD V3 par Site | Migration additive 80, accords versionnés, attestation d’envoi externe, empreintes, preuves du même client et prestataires ; #164 | Recette humaine et cartographie des commandes métier à contrôler ; raccord opérationnel ciblé restant à décider |
| Sources V3.8 | #165 : 119 clauses (115 inchangées, trois réécrites, une nouvelle), 112 références Catalogue + une formule Lune ; préparation d’une nouvelle clause en brouillon | Interface V3.8 et parcours complet à finaliser / valider après accord ; ne pas confondre sources extraites et versions publiées |
| Devis / PDF / Word | Éditeur, préparation, clauses, aperçu, exports et historique développés sur branches | Fiche de livraison, calendrier / jalons, garantie et départ, échéancier choisi, référence facultative, lien exact envoi / acceptation et gel à confirmer / compléter |
| Sites / Pages, bibliothèques techniques, Bridge | Fonctions existantes et roadmap dédiée | Recette multi-sites, composants et round-trip, dans un chantier distinct |

Sources : [convergence #161/#164](RAPPORT-CONVERGENCE-PR161-PR164-2026-11-02.md), [intégration V3.7](INTEGRATION-CONTRACTUELLE-V37-2026-11-01.md), [audit V3.8](AUDIT-V38-2026-11-02.md), [parcours Prospection](PROSPECTION-PARCOURS-RECETTE-2026-10-23.md).

## Décisions commerciales persistantes et arbitrages restants

Décisions consignées dans le suivi et les propositions, sans publication implicite ni modification rétroactive :

- Maintenance WP : 49 €/mois, 2 × 30 min/mois ; WooCommerce : 99 €/mois, 4 × 30 min/mois. Interventions non cumulables / non reportables ; vérifications et mises à jour hebdomadaires, sécurité prioritaire.
- Sauvegardes de prestation : outils o2switch uniquement à ce jour, WP hebdomadaire, WooCommerce quotidienne, conservation prévue 30 jours. Ne pas promettre de copie indépendante AtoumWeb.
- Hébergement isolé avec Lune dédiée : 149 €/an (99 € hébergement + 50 € Lune), domaine distinct ; pas de maintenance applicative incluse. Migration interne AtoumWeb gratuite, migration externe distincte. Pas de double facturation des périodes lors de la transition ; ancienne offre à 99 €/an et contrats acceptés préservés.
- Maintenance mensuelle : fin de période payée ; annuel : engagement et renouvellement sur accord exprès, sous réserve des droits légaux. Abby demeure la source des factures réglementaires V1 ; Manager gère le cycle commercial et documentaire.
- Clause 022 inchangée par rapport à la proposition V3.7 : ne pas ajouter de plafond de responsabilité. Autorisation de référence facultative et révocable.

Arbitrages / validations encore nécessaires :

1. Examiner les sept écarts Catalogue : `AW-MAINT-WP-M`, `AW-MAINT-WP-A`, `AW-MAINT-WC-M`, `AW-MAINT-WC-A`, `AW-SEO-GBP-A`, `AW-MARIAGE-DOMAINE`, `AW-DATA-SUIVI-A` ; définir le code canonique de la formule Lune.
2. Valider définitivement les clauses 014 `BASE-COOPERATION`, 087 `PRO-LITIGE`, 106 `WEB-CONTENUS`, 119 `BASE-REFERENCES-AGENCE`, et les mentions réelles manquantes. Garder visibles les réserves des rapports antérieurs (CM2C, restauration, renouvellement, non-report, accès cPanel) jusqu’à clôture humaine explicite.
3. Cartographier les opérations RGPD concernées : hébergement, maintenance avec accès, migration/import, sauvegarde/restauration, support avec accès. Raccord avec Site et opération explicites ; aucun blocage générique des projets ou chronos.

Les 112 références V3.8 et la nouvelle formule ne sont pas le même périmètre que l’export historique du 27/10 : 136 éléments Catalogue (125 services + 11 offres), 163 versions. Ne pas substituer ces comptages à ceux d’une base active.

## Validations documentées — non rejouées le 03/11

| Périmètre / source | Résultats documentés | Limite |
|---|---|---|
| #161, campagne de convergence | 14 PDF / 131 pages / 103 contrôles, inspection visuelle des 131 pages | Campagne historique distincte de celle à 199 pages |
| Branche #164, rapport de convergence du 02/11 | Typecheck, package Windows, 1 771 tests réussis / 1 ignoré, migrations 78–80 et recette SQLite isolée | Preuves de cette branche ; aucune certification automatique de #165 |
| Livraison isolée `Manager-RECETTE-PR161-PR164-20261102-60c65a2b` | Vrai lanceur Windows et `RECETTE_AUTO.cmd`, 27/27 contrôles, 19 tests ciblés / 1 opt-in ignoré ; 14 PDF / 199 pages, zéro page vide, 14 zones de signature | Premières pages rendues et écrans capturés ; pas de preuve d’inspection visuelle intégrale des 199 pages ni de recette sur le PC utilisateur |
| #165, PR V3.8 | Typecheck, six tests ciblés, extraction déterministe aux empreintes stables | Parcours V3.8 / Devis de bout en bout non prouvé sur un candidat intégré |

[Rapport et procédure de recette isolée](RECETTE-FONCTIONNELLE-PR161-PR164-2026-11-02.md). Pour une future exécution autorisée, consigner commande, HEAD, environnement, résultat et rapport. Rejouer les contrôles impactés si le candidat change ; aucune relance systématique. La recette finale proposée pourra couvrir migrations 1–80/rejeu, copie SQLite, Electron Windows, sauvegarde/restauration, offres de référence et PDF, avec validation visuelle humaine, après accord et définition du périmètre.

## Règles de reprise et de mise à jour

- Les autorisations datées de l’historique ci-dessous décrivent leurs sessions ; elles ne valent pas autorisation permanente de commit, push, fusion, publication ou développement.
- Conserver source unique, clauses publiées versionnées et adaptations locales. Devis acceptés, contrats signés, snapshots et documents historiques restent immuables ; aucune publication ou approbation juridique automatique.
- Après chaque chantier important autorisé, actualiser seulement les sections concernées : date, branche et HEAD, réalisations, état d’intégration, validations réellement exécutées, décisions humaines, blocages et prochaine action. Distinguer proposition, autorisation et réalisation.
- Garder ce fichier comme point d’entrée unique et synthétique. Les preuves détaillées restent dans [PROJECT_STATUS.md](../../PROJECT_STATUS.md) et les rapports existants ; la [roadmap Bridge](../MANAGER_BRIDGE_ROADMAP.md) conserve son rôle propre. Ne pas créer de suivi concurrent et ne pas effacer une décision historique pertinente sans noter sa révision.
- Respecter les lectures complémentaires d’AGENTS.md avant une modification importante : PROJECT_STATUS, cahier des charges puis README. Pas de délégation sans demande. Une actualisation documentaire n’autorise aucun nouveau lot fonctionnel.

## Lecture de l’historique conservé

Les sections suivantes conservent les bilans et décisions des 25–27 octobre. Leurs branches, livraisons, anciennes prochaines actions et restrictions de session sont historiques ; l’état courant et la prochaine action sont ceux du checkpoint en tête. Les décisions métier encore pertinentes demeurent applicables, sauf révision explicitée ci-dessus.

## Historique — priorité du 27/10/2026 — centralisation des données commerciales

Carlos autorise une nouvelle branche GitHub dédiée contenant l'état courant du code, un export structuré du Catalogue/contrats/temps en lecture seule et les propositions humanisées documentaires. Ne pas modifier les données métier, lancer d'audit, produire Excel/PDF ou démarrer une correction. [Point d'entrée de la passation](../../PASSATION-REFERENTIEL-INTERNE-20261027.md).

## Historique — autorisations du 27/10 et protections

- Priorité du 27/10 : passation GitHub autorisée sur `atoumweb-prog/atoumweb-manager`, branche `codex/quote-pdf-handoff-20261027`, push normal et PR brouillon, sans fusion/déploiement/refonte/nouvelle campagne. Lire [la passation dédiée](../../PASSATION-DEVIS-GITHUB-20261027.md). Cette autorisation remplace les anciennes restrictions de push ci-dessous pour cette synchronisation seulement.

- Branche locale `codex/devis-cgv-parcours-humain`. Devis/CGV, préparation, PDF et lanceur ; aucun chantier Bridge implicite, pas de main/fusion/push/CI/installateur.
- Pas de délégation sans demande. Contrôles proportionnés : ne pas relancer ce qui a réussi sans changement pertinent.
- Fixtures TEMP déterministes. Anciennes recettes et saisies préservées, nouveaux portables Workspace/Profil séparés. Aucun reset global.
- Source unique des données, clauses publiées versionnées, adaptations locales et snapshots transmis/acceptés immuables. Aucune publication ou approbation juridique automatique.

## Historique — corrections devis et campagne du 27/10

27/10 — [finalisation commerciale](FINALISATION-COMMERCIALE-2026-10-27.md) terminée :07de12à11pages, six lignes+total14enpage1, calendrier conservé dans l’annexe avantclauses. Typecheck,48tests ciblés,14présentations natives,2PDF inspectés+contactCRMdistinct sur TEMP ; pas de nouvelle campagne complète.44articles classés, propositions annuelles finales, orientationprogressive nonappliquée+maquette documentaire. Références mariage détaillées retrouvées :1an Essentiel/GrandJour,2ans Histoire ; anciennes versions vendues sansdurée. Aucun prix/pub/historique/base utilisateur/exécutable/déploiement/push/fusion. Dossier output/finalisation-commerciale-20261027/Dossier-validation-commerciale et archive Downloads/AtoumWeb-Validation-Commerciale-20261027.zip. Prochaine action : revue des cinq décisions, puis intégration autorisée séparément. Ne pas relancer sans changement pertinent.

27/10 — dernière revue ciblée : [bilan](FINITION-DEVIS-2026-10-27.md). Montants insécables, coordonnées identiques dédoublonnées, MAJ/HNO développés uniquement sur textes de travail. Deux propositions annuelles autonomes sur TEMP ; inventaire44articles/quatre rapprochements ; tranches présentées sans application. Typecheck,1735tests,103contrôles,14PDF/130pages,10modifications ;203montants PDF sans coupure,15géométries natives réussies. Source47db9101 inchangée. Nouveau dossier output/finition-devis-20261027/Dossier-validation et archive Downloads/AtoumWeb-Finition-Devis-20261027.zip. Tableau14sur2pages et continuation07aérée restent signalés. Pas d’exécutable livré ni pub/prix/historique/push/fusion/déploiement. Prochaine action : revue et décisions commerciales, aucune relance systématique.

27/10 : branche locale `codex/devis-corrections-validation-20261026`, [bilan et reprise](CORRECTIONS-DEVIS-2026-10-27.md). A01champs/B2B/B2C, A02quantités, A03destinataire CRM figé et adresse personne(migration75), échéanciers explicites par ligne, copies et PDF alignés, renvois/descriptions, vrais aperçus humanisés et pagination.14PDF/129pages,10modifications,2aperçus35/25articles,103contrôles,10calculs indépendants. Tests1729/1729 puis75/13/71ciblés ;8étapes UI+3thèmes, zéro console. Source47db9101 inchangée et copies TEMP seulement. Index output/corrections-devis-20261027/Dossier-corrections ; archive Downloads/AtoumWeb-Corrections-Devis-20261027.zip. Aucun exécutable livré/déployé ni publication/adoption de clauses ou prix. Arbitrages : tranches produits, nouvelles versions annuelles, inclusions et durée mariage, informations réelles. Tableau14encore sur2pages commerciales, limite signalée. Prochaine action : examen et décisions ; aucune relance systématique.

## Historique — livraison Réglages et aperçu du 25/10

Dernier travail25/10 : **campagne des14devis réels terminée, aucun correctif applicatif**. [Bilan](CAMPAGNE-DEVIS-14-2026-10-25.md), index output/campagne-devis-20261025/Dossier-campagne, archive Downloads/AtoumWeb-Campagne-14-devis-20261025.zip.14PDF/135pages,10modifications,2aperçus humanisés non adoptés et2contrôles consommateurs ;92contrôles et10calculs indépendants. Source47db9101 inchangée (empreinte logique toutes tables). Défauts conservés : champs de clauses consommateurs non résolus malgré préparation, quantité produits/descriptif divergent, coordonnées destinataire absentes, maintenance annuelle incomplète bloquée correctement, sauts de page. Aucune option structurée disponible ;09alternative technique et11durée initiale hypothétique documentées. Prochaine action : examiner les résultats, pas relancer la campagne ni corriger silencieusement. Bibliothèque118propositions toujours documentaire, aucune publication/adoption.

Dernière demande réalisée25/10 : **toute la bibliothèque**,118propositions documentaires (35reprises relues +83nouvelles), pas seulement le PDF. [Dossier et lecteur](bibliotheque-humaine-118-20261025/LIRE-DABORD.md), rapport intégral, inventaire, JSON, tableau et cohérence,4assemblages de lecture non signables. Source118versions inchangées relue seule,19socle/99Catalogue,13types brouillon ; aucune publication/adoption/base/application modifiée. Contrôles documentaires118/118 et audiences4/4 ; lecteur vérifié statiquement, rendu non inspecté à cause du refus navigateur file://. Prochaine décision : validation humaine des formulations ; intégration/publication/adoption ultérieures distinctes. Ce dossier remplace le périmètre limité aux35, sans écraser les livrables du premier audit.

Actualité25/10 : **phase A audit rédactionnel terminée, sans modification applicative**. [Rapport et35comparaisons intégrales](audit-redaction-20261025/RAPPORT.md), [tableau de validation](audit-redaction-20261025/TABLEAU-VALIDATION.md), inventaire118versions/13types, JSON documentaire et vérification35/35corps dans le PDF10pages. PDF de recette35clauses ≠ devis courant15socle :20spécifiques seulement sur TEMP. Propositions non approuvées, non publiées, non appliquées ; aucun brouillon créé dans la base. Dernière demande utilisateur prime sur l’ancienne consigne de ne pas réécrire : audit et propositions autorisés, publication/adoption uniquement après validation humaine. Prochaine étape : examen puis lot technique circonscrit ; pas de nouvelle livraison dans cette phase.

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-47db9101/LANCER-LE-MANAGER.cmd`. Réglages > Mon entreprise et devis :4onglets, administration canonique réutilisée, logo/style/défauts/titres/acceptation, bibliothèque existante. Modèle aux nouveaux devis, bouton de reprise volontaire pour brouillons, modèle/logo conservés dans snapshot.presentation. Aperçu PDF réel paginé avec zoom, dans Réglages et à côté de l’éditeur ; bouton actualiser après enregistrement. PDF.js6.4.299 et worker local packagés. Informations professionnelles confirmées importées uniquement dans cette copie après sauvegarde, aucune donnée personnelle sans rapport avec le devis ; autres mentions inconnues restent manquantes. Source91dedc1c et saisies conservées. Typecheck,79tests distincts,44assertions natives,34binaire réel, zéro erreur ; exemple10pages/35clauses avec SIRET/email page1 vérifié. [Bilan](REGLAGES-DEVIS-LIVRAISON-2026-10-25.md). Schéma74. Prochaine action : recette Carlos, puis continuer l’éditeur. Ne pas refaire la campagne sans changement pertinent. Pas de push/fusion/CI/installateur/Bridge. La construction0109811a est intermédiaire, non livrée.

## Historique — livraison antérieure, corrections PDF

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-91dedc1c/LANCER-LE-MANAGER.cmd`.
Corrections du design PDF déjà approuvé : exemple10 pages/35 clauses, numérotation ordonnée, titres groupés, unité1an inline, paramètres compacts début d’annexe, références/signature communes. Champs et contrôles d’engagement par ligne ; création ponctuelle distincte de maintenance12mois. Périmètre mensuel retrouvé dans Reference-V2 copié localement au brouillon annuel, prix/snapshot annuel inchangés. 10produits inclus+51supplémentaires=61 explicités. [Bilan détaillé](DEVIS-PDF-CORRECTIONS-2026-10-25.md).
Typecheck,106 tests distincts,39 assertions natives et31 binaire réel, aucune erreur renderer ; PDF final10pages et stress14pages/30paragraphes contrôlés. Ne pas refaire toute la campagne à la reprise.
Données source b0a192ca lues seules et sauvegardées : chaque ligne conservée avant rebasing des chemins Projet ;118 modèles/118versions,3devis/7lignes et tous prospects. Ensuite3paramètres de lignes DEV003 complétés explicitement, sauvegarde et rapport dans Workspace/backups. Schéma74/intégrité/FK conformes. Exemples35clauses calculés sur TEMP ; appliquer la comparaison de clauses reste une commande explicite dans le devis utilisateur.
PDF : C:/Users/AtoumWeb/Downloads/DEV-2026-003-corrige-Atoum-20261025.pdf. BROUILLON, pas prêt à signer : données admin/TVA/dates/renouvellement réels encore à compléter. Après livraison, Carlos a fourni sa synthèse Guichet unique puis confirmé agence@atoumweb.fr et franchise en base de TVA actuelle. Ces valeurs sont désormais enregistrées dans la nouvelle livraison47db9101.

## Décisions persistantes et suites

- Même éditeur trois rubriques depuis Prospection et Devis : Prestations/prix, Conditions/CGV, Vérifier/sortir. Une clause à la fois ; copie intégrale/PDF/Word conservés. Garder le design validé.
- Manager maître du devis+annexe+version transmise+preuve d’acceptation, Abby ensuite pour factures. Cahier §10.3. Code d’acceptation encore partiellement centré Abby : à adapter lors d’un lot ultérieur, sans contourner preuve/gel/Projet. Pas réalisé dans les corrections PDF.
- Situation historique du 23/10, dépassée pour la reprise actuelle (commits Prospection inclus dans #165) : Nouvelle entreprise PR#1 distincte, branche chatgpt/creation-entreprise-compacte-20261023 vers codex/crm-saisie-coherente, pas de fusion. Ne pas y intégrer ce chantier Devis. Bilan historique CREATION-ENTREPRISE-PR1-RECETTE-2026-10-23.md.
- Prochaine action historique du 25/10, remplacée par celle du checkpoint en tête : recette utilisateur sur91dedc1c ; compléter les données réelles, puis vérifier le document définitif. Pas de réécriture des clauses supposées bonnes ni de refonte graphique.

## Cadrage conservé — réglages et aperçu dans l’éditeur

Prévoir Réglages > Mon entreprise et devis : identité/coordonnées/fiscalité, logo/style, modèles/conditions par défaut. Produit destiné à terme à être vendu : aucune identité AtoumWeb obligatoire dans les documents d’un autre utilisateur. Aperçu paginé réel dans l’éditeur, correction des textes dans leurs champs sources et réglages de mise en page contrôlés ; même moteur pour aperçu et export. Administration existante à réutiliser, ne pas dupliquer. État initial du cadrage : logo/style alors codés et aperçu HTML non paginé. [Cadrage](REGLAGES-ENTREPRISE-MODELES-DEVIS.md). Réalisé dans47db9101, bilan ci-dessus. Ne pas étendre implicitement à facturation, licence commerciale, multi-entreprise simultanée ou Bridge.

# CRM — réalisation des cinq lots et portable de recette

23/10/2026. Autorisation : demande complète jointe après validation de l'audit du 22/10. Branche dédiée `codex/crm-saisie-coherente`, issue de `codex/prospection-ux-six-lots` au commit `b0800783cb5940afed95842b6954d2083553cac0`. Aucun changement de Bridge, fusion dans main, push, CI distante ou installateur.

## Modifications réalisées

| Lot | Résultat et vérifications intermédiaires |
|---|---|
| 1 — Sources et créations | Coordonnées actives lues depuis `contact_methods`, sans retour aux anciennes colonnes. Écritures concurrentes email/téléphone retirées des éditeurs d'identité ; une tentative sur l'ancien circuit est refusée explicitement. Créations entreprise/personne transactionnelles. Nouvelle commande de création Prospect atomique et rejouable avec la même opération, y compris première action/recherche ; réutilisation d'identités depuis le formulaire. Température, estimation, décision, attente et statut Client passent par des commandes ciblées avec comparaison des valeurs attendues. Première passe : 49 tests ciblés réussis. |
| 2 — Réconciliation | Migration 72, journal de reprise conservant valeurs originales, méthodes présentes et décision de reprise. Valeurs sûres seules importées ; valeurs archivées, contradictoires ou invalides conservées pour revue. Rappels Client existants non dupliqués ; anciens rappels passés/incomplets non réactivés automatiquement. Rapport consultable dans les fiches concernées. Migration testée sur une base 71 peuplée et sa copie SQLite, original inchangé, puis rejeu sans nouvelle écriture. |
| 3 — Champs commerciaux | Demande initiale indépendante, éditée dans Besoins et consultée en Qualification. Besoin confirmé, contexte, budget communiqué et calendrier distincts des prestations catalogue, de l'estimation AtoumWeb et du montant du devis. Reprise volontaire de la demande comme brouillon du besoin ; aucune modification automatique de l'original. Ancien brief ambigu conservé avec provenance et avertissement avant confirmation. Catalogue après le cadrage du besoin. Les champs de lecture calculés ne remplacent plus `primary_need`. Passe intermédiaire : 40 tests réussis avec la migration. |
| 4 — Multi-entreprises | Table de relations entre les entreprises et personnes existantes, fonction principale propre à chaque association, archivage et contrôles de concurrence. Reprise additive des liens antérieurs ; coordonnées et rôles Client conservés. Recherche/réutilisation depuis Prospect et Client ; éditeur d'associations dans l'Annuaire. Aucune fusion d'homonymes. Fonctions affichées dans le contexte du dossier/Client. Tests : deux entreprises, fonctions indépendantes, conflit, archivage d'une association sans perte de l'autre, même personne réutilisée côté Client. |
| 5 — Recherche et continuité | Connaissance entreprise réutilisée entre dossiers avec source/date/version, sans recopier la préparation privée ni les opportunités d'un autre dossier. Nouvelles versions liées à leur version de départ ; anciennes versions intactes. CAS atomique sur recherche partagée et préparation locale. Anciennes notes mixtes d'appel conservées en lecture ; résultats réels dans les actions. Reprise volontaire d'une opportunité enregistrée vers la qualification avec référence à sa version source. Historique Client regroupé par liens et événements dédoublonnés. Actions antérieures au Client consultables sans changer de propriétaire ni les copier. |

## Actions et protections transversales

- ActionService commun à Prospect et Client ; « prochaine action » devient une projection des actions ouvertes. Une action issue d'un Prospect converti reste sur son dossier source et contribue au suivi Client.
- Création d'action rejouable avec identifiant d'opération ; terminaison et création éventuelle de la suite dans une transaction. Un échec de la suite ne laisse pas la précédente faussement terminée.
- Compte rendu Client accessible depuis la liste du parcours ; récurrences existantes conservées.
- Dernier échange effectif distinct de dernière activité administrative ; aucune date d'échange à ressaisir.
- Corrections des coordonnées avec comparaison de l'état lu ; principal et mise à jour atomiques, aucun déclassement du principal si une correction échoue.
- Brouillons conservés sur conflit ; une actualisation externe sans saisie locale ne provoque plus de faux brouillon de Qualification. Les dossiers convertis restent consultables sans commande commerciale d'édition active ni état « pending » permanent.
- Les six colonnes actives, règles de transition, accord du devis courant, conversion protégée et distinction préparé/envoyé/accepté/refusé sont conservés. Aucune réécriture des instantanés de devis, contrats ou Projets.

## Migrations

| ID | Contenu |
|---|---|
| 72 `crm_single_source_reconciliation` | Table de provenance et décisions de reprise ; import prudent des coordonnées et rappels Client non ambigus. Colonnes historiques conservées. |
| 73 `crm_initial_request_and_legacy_brief` | `initial_request`, `legacy_brief_json`, `confirmed_brief_at`. Aucun texte ancien automatiquement déclaré demande initiale ou besoin confirmé. |
| 74 `crm_organization_contact_links` | Relation entreprise/personne avec fonction, dates, archivage et provenance ; reprise de l'ancien rattachement et initialisation lors d'une création de contact. |

Les migrations 1–71 n'ont pas été réécrites. Le registre et les tests de convergence ont été adaptés au schéma 74. La purge des données de démonstration suit aussi les méthodes de contact et nouvelles associations, en conservant sa sauvegarde et son refus de supprimer des références non-demo.

## Validation finale

- TypeScript : `npm run typecheck` réussi.
- Suite complète : **1 681 tests réussis, 197 fichiers**. Elle couvre notamment migrations, conversion, devis/transmissions, contrats, Projets et démonstrations.
- Nouvelle suite CRM : **14 tests réussis**, couvrant transaction/rejeu, échec tardif, coordonnées archivées, conflits, demande/besoin/estimation, reprise d'opportunité avec provenance, multi-entreprises, réutilisation Client et continuité des actions.
- Contrôles complémentaires services CRM, Annuaire, transmission et Projet : **96 tests réussis** lors de la passe ciblée correspondante.
- Recette réelle React/preload/IPC/SQLite sur données TEMP : **17 assertions réussies**, aucune erreur console. Création par le formulaire avec identités existantes, demande initiale, fonction d'association modifiée sans changer l'autre entreprise, réutilisation Client, recherche partagée et thèmes contrôlés. **12 captures** dans `outputs/crm-saisie-native/index.html`.
- Exécutable réellement empaqueté : **31 assertions réussies**, 12 visites de pages/configurations sur profils et workspace TEMP, aucune erreur console ; registre exact 1–74, intégrité et clés étrangères correctes.
- Package Windows x64 généré par `npm run package`, sans lancer de fabrication Squirrel/installateur.

Les essais de migration utilisent des jeux SQLite représentatifs construits et copiés pour la recette, pas une migration de Validation-MSI ou des données de l'utilisateur.

## Portable livré

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-CRM-20261023-2e7f89a8`

Lancer **`LANCER-LE-MANAGER.cmd`**, qui prépare le profil isolé puis ouvre `Application/atoumweb-manager.exe`. Application, Profil et Workspace restent ensemble. Le Workspace contient uniquement des dossiers **TEST** créés pour cette livraison. L'ancienne version `Manager-Pilote-20261022-42b12a93` reste intacte.

Empreinte app.asar : `2e7f89a8b089b8414a280899ee65eb630c84f869df456bc7b84a2e5e446b4c0c`. Empreinte EXE : `6f7e1b8ed03e9b1f0fb14e4f8023923f55f89d072569b791e724d8384c8b54f5`. Le lanceur contrôle ces empreintes. Le manifeste indique la branche et l'état des sources testées ; l'identifiant court du dossier désigne l'artefact, pas un ancien commit applicatif.

## Limites conservées et revue utilisateur

- Les valeurs contradictoires et notes anciennes de sens ambigu nécessitent une décision humaine : elles ne sont ni fusionnées ni effacées silencieusement.
- Une association porte une fonction principale ; les coordonnées personnelles restent sur la personne et les générales sur l'entreprise. Pas de déplacement automatique de coordonnées professionnelles ambiguës.
- Les anciennes API de compatibilité subsistent pour les consommateurs historiques ; les formulaires concernés utilisent les sources/commandes nouvelles et les anciennes colonnes ne sont plus des éditeurs concurrents de coordonnées.
- Les versions historiques de recherche restent des documents composites : leur préparation locale n'est pas diffusée aux autres dossiers. Leur consultation ne transforme pas une collecte sans date en vérification récente.
- Validation ergonomique finale par l'utilisateur encore attendue. Le portable constitue une recette isolée, pas une mise à niveau automatique de ses autres espaces ; aucun ancien exécutable ne doit ouvrir son Workspace de schéma 74.

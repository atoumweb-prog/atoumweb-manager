# Nouvelle entreprise — PR #1 — recette locale du 23/10/2026

## Reprise et audit

PR : https://github.com/atoumweb-prog/atoumweb-manager-prospection/pull/1 ; branche chatgpt/creation-entreprise-compacte-20261023, tête initiale 0a37d3d90cc5623e1e21970299330d879f93dad4, cible codex/crm-saisie-coherente. Arbre local propre avant récupération, origin historique non modifié. Aucune fusion.

La PR de ChatGPT modifiait deux fichiers : placement du logo, quatre cartes Analyse, présentation de Préparation et CSS local. JSX et TypeScript initiaux valides. Les rubriques Numérique et Sources restaient des aides sans champs ; Opportunités réutilisait angle et points de préparation ; objectif absent. Aperçu du logo retiré et sélection annulée remplaçant le logo précédent par null. CSS de la PR utilisait plusieurs variables de thème non canoniques, remplacées dans la seule création.

## Version finalisée

Dimensions et limites de la fenêtre inchangées. Logo à droite des onglets, miniature, choix/retrait, annulation du sélecteur sans perdre le choix précédent. Analyse : deux cartes par ligne, une seule rubrique affichée, compteurs, édition par Modifier / Terminer, champs facultatifs. Préparation : Origine/Température ; Objectif/Angle ; points multiligne ; Action/Date. Choix proposés par listes avec saisie libre.

Création atomique existante réutilisée. Une fausse alerte de saisie en cours était déclenchée lors de l’ouverture de la fiche après enregistrement ; seule la sortie réussie de création utilise maintenant les setters directs, après confirmation de sauvegarde et remise à zéro du brouillon. Les fermetures avant sauvegarde restent protégées. Aucun autre raccourci de fiche modifié.

| Saisie | Stockage existant / lecture après création |
| --- | --- |
| Société, activité, présentation, adresse, site officiel | Organisation canonique ; Entreprise. Une identité existante n’est pas réécrite silencieusement. |
| Personne et coordonnées | Personne, lien entreprise et méthodes canoniques ; Contacts. |
| Services, clientèles, différenciants | Snapshot de connaissance ; Préparer l’échange / Analyse / Activité et clientèle. |
| Zone d’activité | Nouvelle propriété facultative activityArea du même snapshot JSON ; lecture Analyse. |
| Observations site, présence/lien/observations Google | website.notes et googleBusiness du snapshot existant ; Analyse / Web et visibilité. URL officielle éditée uniquement dans Entreprise. |
| Constat, piste, priorité, note | opportunities du snapshot existant ; Préparer l’échange / Objectif et questions / Opportunités. Aucun besoin confirmé ni ligne de devis créé. |
| Source, URL source, vérification déclarée | source/sourceUrl/checkedAt ; pied de lecture Analyse et contrôles existants. Aucune date inventée. |
| Objectif, angle et points | conversation.objective (propriété facultative ajoutée), conversation.approach/talkingPoints existants ; Objectif et questions / Conversation. |
| Origine et température | Prospect existant. |
| Première action et date | crm_actions, statut open, completed_at nul ; Actions et échanges et en-tête. |

Pas de migration ni stockage parallèle. Observations société partagées selon les règles existantes ; opportunités et conversation privées au dossier. Les deux champs nouveaux sont projetés en lecture dans le panneau partagé uniquement si présents. C’est la seule adaptation indispensable hors fenêtre : retrouver les données sans modifier la fiche Client ni le parcours. L’édition de ces deux propriétés dans les fiches existantes n’est pas ajoutée dans ce périmètre ; elles restent visibles et préservées lors d’une autre sauvegarde.

## Contrôles

- Typecheck et contrôles ciblés : 5 nouveaux tests mapper/création/lecture/rejeu/rollback/partage, 16 sources CRM. Une attente de test corrigée (statut interne open, pas planned) ; aucun changement métier de statut.
- Recette native React/preload/IPC/Electron sur TEMP : 42 assertions, aucune erreur renderer. Scénario complet avec toutes les rubriques, fermeture/réouverture, données relues en base et écran, identité et contact, action non effectuée, absence de besoin confirmé, logo choisi/annulé/retiré/réattaché une seule fois, sauvegarde sans fausse alerte, abandon refusé conservant les saisies, création minimale sans Analyse/Préparation.
- 1920×1080 CSS, Noir/Confort/100 %, autres thèmes ciblés, aperçu visuel des deux vues inspecté. 13 captures dans outputs/creation-company-20261023 ; pas de défilement superflu en Préparation, aucun débordement horizontal.
- Les premiers essais du banc ont nécessité correction de sélecteurs et du choix Annuler simulé ; l’essai final couvre réellement les protections. Le blocage après sauvegarde a été reproduit puis corrigé dans la fenêtre.

## Livraison

Portable distinct et contrôle du package : à compléter après construction. Aucun ancien Workspace, profil ou portable modifié. Aucun installateur, aucune activation GitHub Actions, aucun travail Bridge/EC04/B1. PR laissée ouverte pour revue utilisateur.

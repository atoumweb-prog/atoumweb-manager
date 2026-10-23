# Prospection — fiche à onglets et lanceur de recette

23/10/2026. Autorisation utilisateur : appliquer le récapitulatif des corrections et préparer le lanceur. Branche `codex/crm-saisie-coherente`. Aucune fusion, publication, installation ou modification du Workspace utilisateur.

## Livraison

- Lanceur : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-16cfd49e/LANCER-LE-MANAGER.cmd`.
- Exécutable portable x64, profil et Workspace TEST neufs, schéma inchangé **74**.
- Ancien portable `Manager-CRM-20261023-2e7f89a8` et ses saisies conservés ; les données saisies dans cette ancienne recette ne sont pas recopiées automatiquement.
- Galerie : `C:/Users/AtoumWeb/Downloads/Prospection-onglets-20261023-16cfd49e/index.html`, également dans `Captures/index.html` du portable. **20 captures** de données fictives TEMP.
- app.asar SHA256 : `16cfd49eb2859be46be1c2c570baf4be5bbb068277ccc717067d86fdbc49495b`.
- Exécutable SHA256 : `4f95e90e196abe04287a7f36957e317c11f2218e0fba1e47225052643f4942df`.

## Changements réalisés

| Point utilisateur | Résultat |
|---|---|
| Blocs empilés et deux onglets ambigus | Huit onglets : Entreprise, Contacts, Recherche, Préparation, Besoins, Actions et échanges, Devis, Historique. Qualification et besoin détaillé sont consultables séparément dans Besoins. |
| Statut et progression invisibles | Statut explicite en en-tête, six étapes consultables, étape actuelle distinguée. Consulter une étape ne déplace jamais le dossier. Démarrage et commandes métier en haut ; transitions manuelles disponibles seulement lorsqu’elles sont autorisées. |
| Perdu / archivage enfouis | Commandes d’en-tête et dialogues distincts ; motif de perte, confirmation et conservation des champs si l’opération échoue. |
| Fiche de renseignement dispersée | Création dans une seule fenêtre à quatre onglets facultatifs, puis ouverture de la même fiche de dossier. Adresse dans Entreprise ; faits dans Recherche ; préparation et première action dans Préparation. Réutilisation d’entreprise/personne existantes. |
| Logo à la création | Choix et aperçu avant enregistrement pour Prospect et Client. Aucun enregistrement d’identité au simple choix du fichier. Rattachement au propriétaire canonique ensuite. Logo cliquable de la fiche Prospect : fiche express et commandes du visuel. |
| Recherche / préparation mélangées | Recherche : faits, visibilité, contrôles et sources. Préparation : conversation et opportunités. Même stockage et protections de conflit ; aucune copie des données. Anciennes notes conservées et identifiées ; les nouveaux comptes rendus restent dans les actions. |
| Nom impossible à corriger | Commande Modifier le contact près des coordonnées et des contacts associés. Prénom / nom enregistrés dans la personne partagée, avec contrôle de concurrence. |
| Interlocuteur anonyme | Nom visible dans le choix du décisionnaire ; sélection du contact principal parmi les personnes associées, création / association dans le même onglet Contacts, puis choix sans quitter le dossier. |
| Ajout de coordonnées peu pratique | Bouton explicite ouvrant le formulaire à la demande. Usage séparé des badges Numéro préféré / Email préféré. Ajouter un second numéro ne change pas implicitement la préférence. |
| Lisibilité / coche | Cases de 18 px, libellés secondaires de 13–14 px, valeurs de 16–17 px. Boutons jaunes avec texte sombre, y compris dans les dialogues. Application aux formulaires CRM et aux résumés Prospection concernés. |
| Espaces supprimés | Texte conservé pendant la frappe ; aucune suppression des espaces par nettoyage à chaque caractère. |
| Montants invalides | Acceptation de `6100`, `6 100`, `6 100,50 €`, espaces fines et décimales usuelles. Réinitialisation de l’erreur pendant la correction de l’estimation. |
| Bouton besoin douteux | Commande conservée et renommée Enregistrer le besoin ; succès visible et erreur près du bouton. Checklist conservée avec son enregistrement séparé et ses gardes. |
| Catalogue complexe | Liste des prestations envisagées puis catalogue en dialogue, recherche, offres ou services, cartes avec tarif, contenu à la demande et ajout direct. Aucun devis créé par ce simple ajout. |
| Historique répétitif | Timeline regroupée par jour, événements métier et comptes rendus lorsqu’ils sont liés par un identifiant réel. Mises à jour regroupées et journal complet toujours disponible. |
| Ouvrir redondant | Colonne supprimée, clic / clavier de ligne et commande Agrandir conservés. Le pipeline ouvre déjà la fiche en dialogue. |

## Vérifications

- Typecheck et construction Windows réussis.
- **127 tests ciblés distincts** : montants, pipeline, protections des brouillons, identités, sources uniques, associations et concurrence, visuels, règles CRM et transmission de devis.
- **30 assertions natives** sur SQLite TEMP : onglets, espaces pendant la frappe et après sauvegarde, montant français enregistré, besoin et retour de succès, ajout catalogue, taille de coche, ajout de téléphone sans changer le préféré, correction du nom, consultation d’étape sans mutation, annulation de perte, journal complet, absence de débordement des thèmes clairs, création Prospect / Client avec logo et refus d’un jeton d’image invalide. Aucun échec ni erreur console renderer. Le refus volontaire du jeton invalide produit le message IPC attendu dans le journal technique du test.
- Véritable package : **31 assertions**, **12 visites**, trois thèmes, aucune erreur console ; migrations 1–74, intégrité et clés étrangères contrôlées.
- Contrôle visuel des captures ciblées. Aucune relance de la suite complète de 1681 tests, déjà validée avant cette passe.

## Fichiers et conservation

Principaux fichiers : `ProspectsPageV2.tsx`, `ProspectIdentityPanel.tsx`, `ProspectResearchPanel.tsx`, `ProspectNeedsPanel.tsx`, `ContactMethodsPanel.tsx`, `ProspectDecisionEditor.tsx`, `ProspectLinkedContactsPanel.tsx`, `ClientsPage.tsx`. Nouveaux composants : `ContactNameEditor.tsx`, `ProspectPrimaryContact.tsx`, `ProspectTimeline.tsx`, `prospect-workspace-tabs.css`. Analyse monétaire partagée : `src/shared/moneyInput.ts` et ses tests.

API existante de patch étendue au choix du contact principal, avec association active et CAS requis. Choix temporaire d’image exposé par IPC/preload, lié à la fenêtre, limité à 8 Mo et 30 minutes, vérification du fichier après sélection et refus de remplacement silencieux d’un visuel existant. Pas de migration supplémentaire. Tests reproductibles : `scripts/check-prospection-tabs-native.cjs` ; préparation : `scripts/prepare-prospection-portable.cjs`.

Les six étapes actives, les conversions, prérequis de devis, contrats, snapshots acceptés, actions et protections UX-01 sont conservés. Le module Client garde son organisation actuelle ; seul le choix du visuel à la création et les composants CRM partagés concernés sont adaptés.

## Limites explicites

- La sélection d’un logo précède la création, mais son fichier est rattaché après que l’identité existe. Si cette étape échoue, la fiche déjà créée reste conservée et l’interface l’indique. La création Prospect est rejouable sans doublon ; retirer / rechoisir le logo permet de réessayer. Sur une entreprise existante déjà pourvue d’un visuel, son remplacement passe par sa fiche explicite.
- La création directe Client reste le parcours métier existant ; cette passe n’en fait pas une nouvelle transaction de création CRM.
- La timeline ne reconstitue pas les anciennes valeurs ni les détails qui n’avaient pas été journalisés. Le journal brut reste intégral.
- Recette utilisateur à effectuer sur ce nouveau portable ; aucune donnée de l’ancienne recette n’a été migrée.

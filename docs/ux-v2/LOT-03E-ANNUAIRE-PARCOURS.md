# Lot 03E — Annuaire central, contacts et parcours croisés Prospect/Client

**Statut : spécification UX/UI V2, non développée.**
**Source de comparaison : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, 09/10/2026.**
**Sources :** [Lot 03](LOT-03-CRM.md), [03A](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md), [03B](LOT-03B-PROSPECTION-PIPELINE.md), [03C](LOT-03C-FICHE-PROSPECT-BESOINS.md), [03D](LOT-03D-FICHE-CLIENT.md), [07P](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Décisions préservées
L'**Annuaire** est la source des **organisations, personnes et moyens de contact** et de leur **dernière vérification** ; il ne se confond pas avec la fiche commerciale Prospect, la fiche Client ou le Catalogue. Une organisation peut être liée à un Prospect, à un Client, aux deux ou à aucun sans duplication de son identité.

La conversion Prospect → Client crée/rattache un **compte commercial distinct**, en réutilisant organisation et contacts existants lorsque possible. Un Devis non signé peut préparer un Projet sans inventer un Client.

## 2. Code actuel vérifié
| Fichier/source | État constaté | Cible/risque |
|---|---|---|
| `src/renderer/directory/DirectoryPage.tsx` | Vues `organizations` et `contacts`, recherche, filtre relation, filtre secondaire, liste/fiche, création/édition. | Garder les deux vues, accès clavier, filtres persistables et fiche rapide/agrandie si compatible. |
| `src/shared/crm.ts` `DirectoryRelation` | `client/prospect/client_prospect/external`. | Une valeur `client_prospect` est une **relation**, pas deux organisations ou un doublon à créer. |
| `DirectoryPage.tsx` `refresh(initialTarget)` | Ouvre une organisation/contact ciblé par `entityType/entityId`. | Résultat recherche globale = bonne identité ; ne pas perdre la sélection et les drafts. |
| `DirectoryPage.tsx` `saveOrganization/saveContact` | Utilise `crm.organizations`, `crm.contacts` et `contactMethods` : plusieurs appels de persistance peuvent être nécessaires. | Si une étape échoue après création, ne pas retenter en créant un doublon. |
| `src/main/crm/CrmService.ts` `convertProspectToClient` | Réutilise organisation/contact et Client si possible, crée/rattache compte Client au besoin. | Conserver identités communes et historique d'événements ; ne pas introduire une conversion depuis l'Annuaire. |
| `src/renderer/crm/ClientsPage.tsx` et `ProspectIdentityPanel.tsx` | Éditent des informations de contacts et organisations via services CRM. | La donnée ne doit pas être répliquée sous un autre ID sans intention explicite. |

### « Dernière vérification »
La règle produit prévoit date/indication de **dernière vérification** dans l'Annuaire. **La preuve d'une colonne commune existante dans toutes les entités n'a pas été établie dans cet audit ciblé**. Avant développement, examiner les historiques/contrôles réellement disponibles et déterminer si une observation CRM datée suffit ou s'il faut un champ/version métier supplémentaire. Ne pas confondre `updatedAt` (modification) et vérification humaine de l'exactitude des coordonnées.

## 3. Parcours et contrôles de la source unique
1. **Entreprise/particulier** : identifier de façon univoque l'organisation et le contact ; si un prospect existe, naviguer sur sa fiche, pas créer un nouveau Prospect sans confirmation.
2. **Prospect → Client** : la conversion se fait au niveau Devis signé/accepté ; l'Annuaire reflète la nouvelle relation `client` ou `client_prospect` suivant les autres Prospect encore actifs. La source identité reste la même.
3. **Projet non signé** : rattacher au Prospect/dossier commercial et au devis courant ; l'Annuaire ne déduit **aucune commande** de ce seul projet.
4. **Vérification humaine** : information vérifiée, date et auteur/source si métier prévu ; distinguer « à vérifier » de « vérifié », et possibilité d'évoquer un point à reprendre.
5. **Coordonnées** : téléphone/email principal et secondaire archivables selon services existants, droits et historique. Quand une organisation comporte plusieurs contacts, ne pas écraser le contact principal Client en modifiant un autre.
6. **Archive** : archiver ne supprime pas des références nécessaires aux Devis, Contrats, Clients, Projets, documents, factures ni à la recherche historique.

## 4. Navigation croisée
| Départ | Cible | Garantie |
|---|---|---|
| Annuaire organisation → Prospect | Prospect ID lié | Aucun Prospect créé par lecture |
| Annuaire contact → Client | Compte Client réellement lié | Même contact, pas de duplication |
| Prospect → Annuaire | Organisation/contact de la fiche | Identité unique, retour au même Prospect |
| Devis non accepté → Projet préparatoire | Projet `provisional` du dossier | Annuaire/Client inchangé |
| Conversion après Abby | Fiche Client | Compte créé ou réutilisé ; organisation/contact identiques |
| Client → Projets | Projet confirmé exact | Conservation des ressources du pré-projet, sans second projet |
| Historique conversion → Organisation | Même organisation, événements traçables | Pas de doublon d'identité |

## 5. Sécurité et UX
- Fermer une fiche de contact/organisation avec brouillon `dirty` doit demander l'autorisation UX-01 (une fois raccordé) avant démontage ; aucune perte par changement de filtre, groupe ou écran.
- **Ne pas considérer** l'Annuaire comme entièrement couvert par #83 ; prévoir tests ciblés de ses sous-éditeurs.
- Champs compatibles assistance `?`, formats/téléphone/mail validés, erreurs IPC affichées avec conservation des saisies.
- Recherche par nom, activité, ville, rôle et relation selon les champs existants ; identifiants exacts, pas de fusion d'homonymes automatique.
- Trois thèmes × trois densités, grille compacte et lecteur d'écran, colonnes/largeurs restaurables depuis 01D/01F.

## 6. Recette proposée, non exécutée
| ID | Scénario | Résultat |
|---|---|---|
| R03E-01 | Créer Organisation puis Prospect | Une seule organisation, bonne relation |
| R03E-02 | Ajouter deux contacts à l'organisation | Contacts distincts, principal stable |
| R03E-03 | Rechercher une société homonyme | Ouvre bon ID et bon type |
| R03E-04 | Prospect converti après Abby | Annuaire reflète Client, identité conservée |
| R03E-05 | Client existant, nouveau Prospect sur même organisation | Relation `client_prospect`, pas de deuxième compte |
| R03E-06 | Créer Projet préparatoire avant acceptation | Aucun changement de la relation Client |
| R03E-07 | Réviser devis et remplacer Projet provisoire | Contacts/organisations inchangés |
| R03E-08 | Modifier contact avec service indisponible | Brouillon préservé, reprise sans doublon |
| R03E-09 | Archiver organisation liée à Client/Projet | Références historiques protégées selon service |
| R03E-10 | Marquer une donnée vérifiée puis modifier ultérieurement | Date de vérification non confondue avec simple `updatedAt` |
| R03E-11 | Naviguer depuis historique conversion vers organisation | Liens Prospect/Client corrects |
| R03E-12 | 3 thèmes × 3 densités, petite fenêtre et clavier | Accès aux contacts et fiches sans perte de contexte |
| R03E-13 | Typecheck/tests CRM/données SQLite/CI | Preuves sur SHA, Validation-MSI non touchée |

## 7. Points à instruire
- **E83** : existe-t-il un champ métier suffisamment fiable pour `dernière vérification` ou faut-il une extension versionnée ?
- **E84** : fermeture et persistance des brouillons de contact/organisation.
- **E85** : rapport entre `client_prospect` et archives de Prospects convertis ; vérifier les compteurs sur relation active.
- **E86** : source du contact principal Client vs contact décideur Prospect ; ne pas écraser le mauvais contact.
- **E87** : conflits d'identités/homonymes, règles de rapprochement et reprises sur création partielle.

**Ce document n'autorise pas de nouveau schéma SQL ni une automatisation de conversion, de création ou d'archivage.**

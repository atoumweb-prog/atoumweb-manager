# Lot 03D — Fiche Client et relation AtoumWeb

**Statut : spécification de conception, non implémentée et non recettée.**
**Source statique : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, 09/10/2026.**
**Liens :** [Lot 03](LOT-03-CRM.md), [03A](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md), [03B](LOT-03B-PROSPECTION-PIPELINE.md), [03E](LOT-03E-ANNUAIRE-PARCOURS.md), [Lot 01C](LOT-01C-FICHES-PANNEAUX.md), [Lot 01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Objectif et décisions
La fiche **Client** est **distincte** de la fiche Prospect, mais partage les **sources d'identité** (organisation/contact) et l'historique de conversion. Ordre de lecture validé : **coordonnées → relation AtoumWeb → devis/contrats/projets → échéances/actions directes**. Huit onglets cibles : **Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique**.

La qualité de relation `excellent/good/neutral/watch/difficult` est **indépendante** de la température Prospect `cold/neutral/warm/hot`. Un Client converti doit conserver ses devis, preuves Abby, contrats acceptés et le **même Projet provisoire devenu confirmé**, sans recopie de dossiers.

## 2. Comparaison avec le code réel
| Source | Comportement présent | Écart V2 |
|---|---|---|
| `src/renderer/crm/ClientsPage.tsx` | `ClientTab='summary'/'contacts'/'contracts'/'documents'/'operations'/'history'` : **six onglets internes**. | Étendre à **huit** : `Commercial`, `Projets`, `Interventions` distinct (au lieu de regrouper ces fonctions dans `operations`), sans perdre les opérations de maintenance. |
| `ClientsPageContent` | Recherche/filtre Client, liste à gauche, détail rapide, `largeView`, séparation ajustable. | Conserver ID/onglet/filtre au retour, largeur persistée 01C, garde des brouillons avant fermeture. |
| `refreshSelectedClientData` | Charge 7 groupes via IPC : activité, contacts, identité, devis, projets, abonnements de maintenance, interventions. | Séparer présentation des onglets sans dupliquer SQL ni traiter projet prévisionnel comme opération active. |
| `RELATION_LABELS` | Qualité de relation, menu et note `relationshipNote`, changement via service `clients.update`. | Historiser note/date au lieu d'inférer le sentiment ; éviter une couleur comme seul état. |
| `ClientContractsPanel`, `ClientDocumentsPanel`, `ClientOperationsTab` | Panneaux spécialisés déjà liés au Client. | Réutiliser capacités/vues documentaires et Maintenance plutôt que reconstruire la gestion métier depuis les onglets. |
| `src/main/crm/CrmService.ts` | `convertProspectToClient` recherche Client existant via organisation ou contact, sinon crée, relie `prospect.client_account_id`, conserve `stage='won'` et date. | Conversion réellement traçable : pas de deuxième compte Client, entrée Historique Prospect → bon Client. |
| `src/shared/crm.ts` | `CLIENT_STATUSES='active/inactive/archived'` et `ClientRelationshipStatus` distinct. | Respecter statut officiel vs appréciation de relation, ne pas en faire une « température Prospect ». |

## 3. Onglets V2 — cahier d'affichage
| Ordre | Onglet | Informations / actions réelles à raccorder |
|---|---|---|
| 1 | **Résumé** | Identité, coordonnées et contacts essentiels, état Client, date, qualité relation AtoumWeb, prochaines échéances, devis/projet actuel, alertes ; raccourcis « Ouvrir » ou vraie création ciblée |
| 2 | **Contacts** | Organisation, personne physique/morale, contact principal et autres rôles `primary/administrative/billing/technical/other`, méthodes téléphone/email ; édition garde UX-01 |
| 3 | **Commercial** | Devis en cours, acceptés/refusés et lien Abby/proof ; offres vendues **uniquement** après acceptation, historique Prospect et actions commerciales liées |
| 4 | **Contrats** | Contrats acceptés/documents CGV/versions, liens avec lignes achetées, accès au builder ou aux PDF selon capacités, aucune « acceptation » implicite |
| 5 | **Projets** | Projets confirmés, Projet prévisionnel historique ou exceptionnellement encore en cours selon état, progression, devis source, bouton ouvrir l'ID exact, reprise du projet préparé |
| 6 | **Interventions** | Maintenance, packs, demandes et interventions selon sources existantes, statuts opérationnels réels et liens chronos (aucune opération créée par affichage) |
| 7 | **Documents** | Fichiers preuves, annexes/attestations, import/consultation, protection droits ; conserver rôles et provenance |
| 8 | **Historique** | Événements datés Prospect→Client, acceptation/révisions/projets, actions relationnelles et opérations, sources clairement distinguées |

**Règle :** une information peut être résumée dans Résumé et détaillée dans un onglet, mais une modification ne doit avoir **qu'une seule source de vérité** et un seul service de sauvegarde.

## 4. Préparation de Projet et conversion
- **Avant signature**, la préparation est liée au **dossier commercial du Prospect/devis courant**, pas encore à un Client acquis artificiellement.
- **Lors de la signature/acceptation réelle**, réconcilier Projet courant et Client déjà créé ou nouvellement créé ; **ne pas déplacer physiquement les ressources sans contrôle**, ne pas créer un deuxième Projet à partir du même devis.
- Après conversion, le Client ouvre le Projet exact via `projectId` et garde les versions/sources des prestations réellement acceptées ; l'historique Prospect reste consultable.
- Si devis révisé et Projet prévisionnel remplacé avant signature, seul le **Projet courant** devient confirmé ; l'ancien reste archivé avec liens auditables, jamais faussement « en cours » dans la fiche Client.
- Les **devis refusés** et les documents de négociation gardent l'historique ; ils n'augmentent pas le chiffre d'affaires comme ventes acceptées.

## 5. Actions, prévention des pertes et accessibilité
- Clic Client → fiche rapide ; **Agrandir** ne réinitialise pas `activeTab` ou `draft`.
- Changer d'onglet, sélectionner un autre Client, cliquer hors panneau ou fermer → **garde UX-01 si un éditeur serait démonté**. La PR #83 ne protège pas universellement Clients : intégrer avec le registre existant, pas un autre.
- Un effet de chargement de données postérieur ne doit pas écraser des coordonnées/contact/notes déjà modifiés localement.
- Les boutons « Nouveau devis / Nouveau projet » actuels **ouvrent des modules** ; ne promettre création immédiate que si le formulaire correct s'ouvre sans créer l'objet avant validation (Lot 02).
- Les liens intermodule ouvrent **la bonne cible**, conformément au routeur 02C et aux règles du Devis/Projet ; retour historique/onglet/scroll restauré.
- Dans l'onglet Projets, badge lisible **Prévisionnel / confirmé** ; ne pas activer maintenance ou production du seul fait d'afficher un Projet.
- Les huit onglets accessibles clavier et lecteur d'écran, correctement repliables en fenêtre étroite ; Compact texte fonctionnel >=14px.

## 6. Travail de développement à préparer après autorisation
1. Matrice `source Client ↔ onglet ↔ handler ↔ IPC ↔ service ↔ erreur`.
2. Prototype des huit onglets sur fixtures fictives, en évitant les nouveaux appels métier.
3. Migration du contenu `operations` vers Interventions, et création de vues Commercial/Projets **sans duplications des services**.
4. Protection des brouillons des sous-formulaires, données asynchrones et fermeture.
5. Validation conversion Prospect vers Client existant/nouveau avec Projet prévisionnel confirmé.
6. Tests ciblés, suite complète, CI et revue humaine neuf modes.

## 7. Recette prévue, non exécutée
| ID | Scénario | Attendu |
|---|---|---|
| R03D-01 | Prospect converti via Devis réellement accepté | Fiche Client correcte, historique Prospect conservé |
| R03D-02 | Prospect déjà associé à une organisation Client | Même compte Client réutilisé, sans doublon |
| R03D-03 | Projet préparé avant signature puis accepté | **Même Projet** confirmé, liens et ressources conservés |
| R03D-04 | Projet préparé remplacé avant signature | Seul Projet courant confirmé, ancien archivé/consultable |
| R03D-05 | Afficher huit onglets | Tous accessibles, pas de perte de contenu six onglets existants |
| R03D-06 | Basculer Résumé/Commercial/Projets | Sources concordantes, aucun calcul de vente fictive |
| R03D-07 | Modifier notes ou relation Client | Mise à jour du seul champ et historique, pas de température Prospect altérée |
| R03D-08 | Modifier contact/coordonnée puis quitter | Garde UX-01, annulation conserve saisie |
| R03D-09 | Données Client arrivant tardivement | Brouillon dirty non remplacé |
| R03D-10 | Ouvrir Devis, Contrat, Projet ou Intervention | Identifiant exact et retour Client conservé |
| R03D-11 | Changement d'onglet avec chrono en cours | Chrono unique intact |
| R03D-12 | Fenêtre étroite, clavier, 3 thèmes × 3 densités | Onglets et actions utilisables, texte >=14px |
| R03D-13 | Services IPC partiellement indisponibles | Message par zone, pas de tableau « zéro » trompeur |
| R03D-14 | Tests d'intégration/protection et SQL | Résultats réels SHA, Validation-MSI intacte |

## 8. Questions à instruire
- **E78** : regroupement Maintenance et interventions dans l'onglet Interventions tout en conservant leurs commandes complètes.
- **E79** : ordre précis des blocs Résumé personnalisables, sans faire perdre coordonnées/relations.
- **E80** : historique commun Prospect/Client, provenance et dédoublonnage d'événements.
- **E81** : détails de protection des sous-formulaires Clients non encore raccordés à #83.
- **E82** : rôle des projets prévisionnels dans une fiche Client existante lorsque le devis n'est pas encore accepté.

**La présence de six onglets en code est un constat ; l'architecture à huit est une cible approuvée, pas déjà implémentée.**


## Actualisation du 14/10/2026 — historique ci-dessus conservé

La mention initiale « non implémentée » décrit le relevé de2026-10-09. Le développement03D est repris depuis main b2796812 après102 ; consulter [le suivi actuel](SUIVI-AVANCEMENT.md) et [le rapport d’exécution](LOT-03D-EXECUTION-2026-10-14.md). Recette humaine globale différée à la fin de la refonte. Les liens de conception non repris localement restent consultables dans la [version complète PR82](https://github.com/atoumweb-prog/atoumweb-manager/tree/0bb0860ee7618af92a53d8711b4a06edbbadc4d6/docs/ux-v2).

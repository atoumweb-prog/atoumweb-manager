# 01D.1 — inventaire détaillé des listes pilotes et définition de l'atelier

**État suivant :** le premier atelier01D.2 est désormais implémenté dans la même PR89, sans port métier. Voir [code, preuves et limites](UXV2_LOT01D_EXECUTION.md). L'inventaire et les propositions ci-dessous restent l'état documenté au commit3edf5e3, pas une attestation que tous les16critères sont clos.

Départ : **01C@0fab2ae50b029e3a0734d6d78833686f91224295**, main distant07dde9c8. Branche dédiée `codex/ux-v2-lot01d-inventory-v1`, empilée sur #88. Référentiel #82 `docs/ux-v2/LOT-01D-TABLEAUX-VUES.md` et cadrage `UXV2_LOT01D_CADRAGE.md` lus. **Livraison documentaire de01D.1 : pas de composant de table ni écran métier implémenté.**

## Sources, données et identité — sept vues pilotes

| Vue / source renderer | Identité et colonnes existantes | Tri / source serveur |
| --- | --- | --- |
| Prospection annuaire — ProspectsPageV2 | clé prospect.id ; Entreprise(displayName+source), Activité(organizationIndustry), Ville(organizationCity), Contact(secondaryLabel), Statut(directoryStatus/readiness), Ouvrir | crm.prospects.list(includeArchived:true), CrmService.listProspects : updated_at DESC. L'annuaire exclut ensuite archivedAt ; pipeline et historique distincts. |
| Clients — ClientsPage | clé client.id (compte client, pas organizationId) ; Client(displayName+becameClientAt), Statut, Contact(contactName), Coordonnées(email/phone), Prochaine action(nextActionAt/Text), Gérer | CrmService.listClients : updated_at DESC ; ordre du tableau hérité, pas de tri local supplémentaire dans filtered. |
| Catalogue — CatalogPage | clé item.id ; Catégorie, Nom+canonicalCode, Type/commercialKind, Prix AtoumWeb, Prix conseillé(recommendedPriceCents), Mode(priceMode), Statut item, Site(visiblePublic), Version(number+status) | CatalogService.list : priorité état/nom ; renderer trie catégorie puis nom, locale fr-FR/sensitivity base. LIMIT1 sélectionne la version pertinente, pas une page d'articles. |
| Devis — QuotesPage | clé quote.id ; Numéro, Destinataire(ownerLabel), Objet(subject), Statut, Valeur(contractValueCents), Décision, Créé le | QuoteService.list : created_at DESC ; filtered conserve cet ordre. Numéro public distinct de la cléid ; décision est un handler métier séparé de l'ouverture. |
| Projets — ProjectsPage | clé project.id ; Numéro, Client, Projet(name+projectType+commercialState), Statut, Progression(progressPercent), Temps estimé(estimatedMinutes), Cible(targetDate) | ProjectService.listProjects : created_at DESC ; filtered conserve l'ordre. Ne pas confondre ce tri avec sortOrder des nœuds/phases. |
| Demandes — OperationsPage | clé request.id ; Reçue(receivedAt), Client+Projet, Sujet+Source, Priorité, Statut | OperationsService.listRequests : received_at DESC puis created_at DESC ; filteredRequests conserve l'ordre. |
| Interventions — OperationsPage | clé intervention.id ; Numéro, Client+Projet+nœud, Intervention(subject+type), Prise en charge(coverageMode), Temps(totalTimeSeconds), Statut | OperationsService.listInterventions : created_at DESC ; filteredInterventions conserve l'ordre. Temps/prise en charge proviennent des services, pas d'un recalcul de la table. |

Sources vérifiées : renderer aux familles `src/renderer/crm/`, `commercial/`, `projects/`, `operations/` ; services `src/main/crm/CrmService.ts`, `commercial/{CatalogService,QuoteService}.ts`, `projects/ProjectService.ts`, `operations/OperationsService.ts`. Les contrats de liste inspectés ci-dessus n'ont pas de LIMIT global/pagination. Cette constatation ne s'étend pas aux autres services ni à GlobalSearch.

**Colonnes obligatoires :** conserver tous les défauts actuels pour un futur port ; le socle exige l'identité lisible et une ouverture accessible. Ne pas imposer aujourd'hui une nouvelle liste de colonnes obligatoires métier. Pour Catalogue/Devis, préserver explicitement les informations/version/statut nécessaires aux décisions ; une colonne cachée n'autorise pas une action interdite. Les ids de colonnes seront techniques et stables, les ids de dossier sont des clés de ligne, jamais des préférences sauvegardées.

## Recherches et filtres réels

| Vue | Champs cherchés côté renderer | Filtres et particularités à conserver |
| --- | --- | --- |
| Annuaire prospects | displayName, secondaryLabel, activité/ville/site/notes entreprise, observation initiale, opportunité | Métier/ville exacts ; follow/all/prepare/ready/relaunch/overdue/stage via matchesDirectoryStatus. Relance/en retard dérivés des actions ouvertes et de leur date, pas de nouveaux statuts. |
| Pipeline prospects | vues regroupées par ACTIVE_STAGES ; actions et followUpBuckets | all/relaunch/overdue ; new séparé du pipeline actif. Kanban conservé, pas remplacé par une table. |
| Clients | nom, contact, email, téléphone | statusFilter/all ; le serveur possède includeArchived et une recherche plus large contact_methods. Ne pas recopier un filtre serveur à l'identique sans vérifier cette différence. |
| Catalogue | nom/codeAW/famille/libelléAbby/unité/périodicité/catégorie/nature/description/champ legacy/conditions/conseil/inclusions/exclusions/prérequis | typeFilter et état item ; publishedServices est une dérivation spécifique aux usages. Ne pas transformer les brouillons en prestations vendables par affichage. |
| Devis | numéro/objet/destinataire | statuts existants, sélection parid. Serveur filtre aussi prospect/client/acceptedClient ; ne pas perdre ces limites dans une source future. |
| Projets | numéro/nom/client/type | statusFilter ; serveur peut limiter client/état/archivés. Les plans/modèles sont une vue distincte. |
| Demandes | sujet/description/client/projet | requestStatus ; archivés exclus par défaut serveur, récupérables via includeArchived. |
| Interventions | numéro/sujet/description/client/projet/nœud | interventionStatus ; archivés exclus par défaut serveur, récupérables via includeArchived. Maintenance/packs restent des vues spécialisées indépendantes. |

Recherche française normalisée côté renderer par trim/toLocaleLowerCase('fr-FR'). Le contenu recherché ne doit pas être envoyé dans les préférences automatiquement : données personnelles/notes possibles. La recherche libre restera en mémoire dans le premier atelier.

## Handlers, mutations et UX-01

- Ouvrir : setSelectedId, openClient, openItem, openQuote, openProject ou sélection request/intervention. Le bouton `Ouvrir` accessible est distinct des commandes métiers ; une ligne cliquable seule n'est pas suffisante.
- Devis : Valider appelle accept ; À négocier change le stade Prospect. Arrêter propagation du clic existe déjà. La primitive de table ne contient aucun de ces appels : elle reçoit des commandes déléguées explicitement, jamais une validation par sélection.
- Statut Catalogue, publications, suppressions, consommation/terminaison, sortOrder des tâches/CGV : hors de la table. Une préférence de tri n'écrit dans aucun de ces champs.
- UX-01 : Prospection/Devis sont raccordés, et les démonstrations01C utilisent le même registre. Ne pas prétendre que tous Clients/Catalogue/Projets/Opérations ont une garde universelle. Chaque port doit inventorier ses éditeurs avant un changement de dossier destructeur.
- Si un filtre masque la ligne sélectionnée, garder le détail **monté** avec le mêmeid et brouillon. Une action explicite changeant l'objet/fermant la fiche passe par requestUnsavedExit. Aucun effet sur selectedId lors du seul recalcul de la liste.
- Chargements : exposer le périmètre complet/page et la version de requête. Une réponse tardive ne modifie ni la sélection ni le détail. Compteur de lignes réellement visibles distinct d'un total serveur éventuel.

## Premier atelier défini — proposition 01D.2

**120 dossiers synthétiques** répartis dans deux vues fictives indépendantes, avec ids fixes TEST-001…TEST-120. Pas de données issues de Validation-MSI. Jeu déterministe avec homonymes, accents FR, dates/nulls, centimes0/99/100/10000, libellés longs et résultats vides. Les valeurs numériques/dates sont triées brutes, égalités par id stable ; aucune comparaison de chaînes monétaires affichées.

Colonnes pilotes : **Identité** et **Ouvrir** obligatoires ; catégorie fictive, statut de fixture, date et montant facultatifs. Les statuts sont des valeurs de démonstration fournies par la fixture, pas de nouveaux enums du Manager. Vue standard immuable + vues personnelles de présentation ; reset limité à la vue courante.

Réemploi : AppButton/AppTextField/FieldHelp/AppNotice et OperationIcon de01B ; ResizableSplitView/RecordPane et contrat de stockage visuel de01C. Un seul éditeur de note fictive, deux onglets conservés ; mêmes useUnsavedDraft/UnsavedGroup/requestUnsavedExit et garde native Electron. **Pas d'un deuxième registre ou dialogue.**

Commandes à démontrer : recherche/filtres actifs + effacer ; cycle de tri autorisé ; montrer/masquer/réordonner colonnes ; resize visuel immédiat et une sauvegarde par fin de geste ; vues personnelles/dupliquer/reset ; fiche rapide/agrandir/réduire. Recherche libre et champ de note exclus de la persistance. Préférences versionnées/whitelist, colonne inconnue ignorée, colonnes obligatoires restaurées. Échec de stockage visible sans perdre le brouillon.

API à définir avant code : ColumnDefinition<T>, TableSource<T>(complete/page/count/requestRevision), DataTableWithViews, TableFilterBar, TableColumnManager, SavedViewPicker. Callbacks contrôlés de présentation ; aucun IPC métier. Pagination/latence/refus simulés dans un second scénario : pas de tri d'une seule page présenté comme tri de toute la base.

## Matrice technique prévue, tous résultats à exécuter

| Groupe | Critères du référentiel | Preuves prévues |
| --- | --- | --- |
| Présentation | R01D-01/03/13/14 | neuf thèmes/densités,100+lignes, clavier/souris, largeurs bornées, zéro write pendant drag, zoom125/150%, captures synchronisées |
| Colonnes/vues | R01D-02/07/08/09/15 | identité/Ouvrir non masquables, ordre/visibilité/reset, migrations de préférence, deux clés de module distinctes, erreur de stockage |
| Données en lecture | R01D-04/05/06/12 | ordres attendus FR/nombres/dates/nulls, filtres/compteurs exacts, aucune mutation des fixtures, ancien résultat async ignoré, périmètre paginé explicite |
| Saisies et fiche | R01D-10/11 | filtre cache sélection sans démontage, rester/abandon uniquement viaUX-01, mêmeobjet/onglet/note après agrandissement et tri |
| Non-régression | R01D-16 | typecheck, ciblés permanents, suite complète et pilotes réels adaptés à chaque changement |

Ordre proposé : types/fixtures/normalize-preferences testés ; atelier lecture+fiche ; gestion colonnes/vues ; cas async/pagination et durcissement. Captures et tests obligatoires par incrément visuel. Recette humaine globale différée ; perte de saisie ou mutation incorrecte bloque immédiatement.

## Périmètre restant

Sept vues et le pipeline associé inspectés ; pas cartographie exhaustive de toutes les colonnes des17modules. Facturation, Dépenses, Temps, Documents, Bibliothèques, Sites et vues spécialisées sont à inventorier avant leurs ports. La persistance applicative/settings et les droits réels seront raccordés dans les modules concernés, pas inventés dans l'atelier. Aucun composant01D ni écran métier créé par cette préparation. Pas de migration de base ou déploiement.

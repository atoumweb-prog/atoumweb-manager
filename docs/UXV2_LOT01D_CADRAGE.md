# Lot 01D — cadrage technique, sans implémentation métier

Préparé le 12/10/2026 depuis le référentiel **#82**, branche `docs/ux-v2-reference-v1`, fichier `docs/ux-v2/LOT-01D-TABLEAUX-VUES.md` (révision0bb0860). Ce document précise le plan d'exécution ; il ne remplace pas les16critères R01D ni n'annonce leur réussite. Aucun écran, service, table SQLite ou état métier modifié pour01D.

## Périmètre du premier incrément proposé

Une table configurable et un atelier de dossiers synthétiques, connecté aux fiches01C et contrôles01B. Pas de transformation simultanée des17modules. Les ports restent dans les Lots03/04/06/07/08 ; recherche globale distincte, Kanban/arborescences/Builder spécialisés conservés.

## Inventaire initial et raccords à approfondir

| Module | Recherche / filtres / source | Précautions du futur port |
| --- | --- | --- |
| Prospection | directorySearch/industry/city/status, pipelineFilter ; ProspectsPageV2 et services CRM | Annuaire/pipeline/historique ont des vues distinctes ; pas de nouveau statut. |
| Clients | query/statusFilter, filtrage useMemo ; ClientsPage | Préserver archived et état du détail ; identifier colonnes d'identité obligatoires avant port. |
| Catalogue | query/typeFilter/statusFilter ; CatalogPage.filtered tri catégorie/nom FR ; CatalogService.list | Conserver classement commercial. LIMIT1 repéré pour sélectionner une version, pas une pagination des articles. Aucune écriture de sortOrder. |
| Devis | query/statusFilter ; QuotesPage.filtered ; QuoteService.list SQL ORDER BY created_at DESC sans LIMIT global dans ce contrat | Colonnes numéro/destinataire/objet/statut/valeur/décision/date. Aucun clic de tri ne finalise/accepte un devis. Garde Abby et UX-01 conservés. |
| Projets | projets/modèles, query/statusFilter ; ProjectsPage | La table ne remplace ni production ni arbres/phases ; contexte de détail séparé. |
| Opérations | demandes/interventions/maintenance/packs, query et statuts séparés ; OperationsPage | Préférences indépendantes par vue ; aucun débit ou changement de statut par sélection/filtre. |

Cet inventaire est ciblé, pas une certification colonne par colonne des17modules. Avant un port : vérifier contrat de liste réellement chargé, limites serveur, capacités et champs disponibles ; ne pas assimiler un résultat de recherche globale à une source complète de tableau.

## Primitives et contrats proposés

- `ColumnDefinition<T>` : idstable, libelléFR, type, bornes de largeur, obligatoire ou facultative, lecture/rendu/compareur ; `identity` et commande `Ouvrir` toujours disponibles. Les props sont en lecture seule.
- `DataTableWithViews<T>` : présentation et sélection contrôlées ; callbacks existants pour ouvrir/filtrer/trier. Déclaration explicite de portée `complete` ou `page`, compteur réel et états loading/error/empty. Pas d'IPC ni transaction dans ce composant.
- `TableFilterBar` : recherche, critères actifs, compteur, reset ; statuts/catégories fournis par le module, pas inventés par la primitive.
- `TableColumnManager` : visibilité, ordre, largeurs bornées, reset ; identifiant/action obligatoires non masquables. Reprendre le principe01C : aperçu immédiat, **une écriture en fin de glissement**, aucune écriture par pointermove.
- `SavedViewPicker` : vue standard réinitialisable et vues personnelles nommées/duplicables ; aucune édition de modèle partagé par simple changement local. Noms bornés, aucun contenu de dossier copié dans une vue.
- Préférences : réutiliser le contrat de stockage visuel injectable01C, JSON versionné sous clé module/vue/mode/version. Sauver uniquement ids de colonnes, largeur/ordre/visibilité, tri et critères autorisés. Recherche libre en mémoire par défaut, persistance à qualifier selon la portée et la confidentialité. Pas d'id de client sélectionné, note, brouillon, snapshot ou mot de passe.

Le profil TEMP de l'atelier restera isolé. Le raccord à settings/workspace ne sera pas présenté comme livré avant son implémentation et ses tests. Valeurs corrompues : défaut sûr et erreur explicite ; colonnes inconnues ignorées, colonnes obligatoires restaurées. Effacement/reset limité à la clé de cette vue. Synchronisation multi-fenêtres à tester sur un profil isolé, sans nouvelle infrastructure métier.

## Invariants à tester avant migration

1. Trier des centimes/nombres/dates sur valeurs brutes, texte en collationfr-FR, égalités avec idsecondaire stable ; aucune écriture dans l'ordre contractualisé ou les blueprints.
2. Si source paginée : ne pas annoncer un tri sur toute la base en ne triant que la page. Renvoyer la demande au service approprié ou préciser la portée.
3. Filtre masquant la sélection : **conserver le détail monté et son brouillon** ; ne pas effacer selectedId automatiquement. Changement explicite de dossier/fermeture : requestUnsavedExit, sans deuxième registre.
4. Résultats async versionnés/annulables : ancienne réponse ne remplace ni nouvelle liste ni détail/brouillon. Changement de vue ne valide aucune mutation métier.
5. Toutes les commandes accessibles clavier, aria-sort sur colonnes triables, ouverture explicite plutôt que tr uniquement cliquable ; focus visible et actions conservées en repli étroit.
6. Erreur de préférence, service refusé ou zéro résultat : pas de faux succès, pas de disparition de saisie, compteur fidèle ; resetvisuel sans toucher aux dossiers.

## Découpage proposé

| Incrément | Livrable | Contrôles R01D principaux |
| --- | --- | --- |
| 01D.1 | Inventaire actuel enrichi et types de colonnes/source/préférences ; fixtures 100+ dossiers | 02,04,09,12,15 |
| 01D.2 | Table/barre/gestion des colonnes dans atelier isolé ; lien fiche01C | 01,02,03,04,05,06,10,11,14 |
| 01D.3 | Vues personnelles, persistance/réinitialisation et migration de préférence | 07,08,09,13,15 |
| 01D.4 | Chargements async/pagination simulés, erreurs et revue de non-régression | 10,12,16 |

Pour chaque incrément : typecheck, tests ciblés permanents, non-régression adaptée, neuf thèmes×densités si affichage concerné, captures synchronisées et bilan daté/SHA. Confirmer compteurs/absence de mutation sur fixtures. R01D-01…16 sont **à exécuter**, aucun PASS anticipé.

## Git et décisions

Après instruction de développement01D : branche/PR distincte draft depuis le HEAD01C validé ; commits identifiables, publication sans force. Aucun merge/main, CI hébergée ou usage Validation-MSI sans autorisation. Le présent cadrage est publié avec le suivi01C ; **aucune implémentation01D n'est commencée**.

Questions E12–16 à instruire : stockage/portée réelle, pagination/tri, colonnes obligatoires par module, exclusion des données sensibles, standard/personnelle. La plupart se résolvent techniquement par inventaire/atelier. Demander arbitrage uniquement pour changement significatif d'ergonomie validée ou de règle métier ; recette humaine globale différée, risque de perte/mutation toujours bloquant.

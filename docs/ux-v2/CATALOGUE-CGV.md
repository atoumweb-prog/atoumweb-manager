# UX/UI V2 — Catalogue commercial, besoins, devis et CGV

Statut : exigences de conception **DÉCIDÉES**, sauf sections notées **À VÉRIFIER**. Références : UX2-CAT-001..010, UX2-CON-001..008.

## 1. Un référentiel, trois usages
- **Offres & Tarifs / administration** : créer, configurer, versionner, publier, archiver offres/formules/services/catégories/associations.
- **Prospection / besoins** : même catalogue en mode sélection des besoins ; voir inclus/exclus, pertinence et aide `?` ; aucune ligne vendue par simple identification.
- **Devis / composition** : même catalogue en mode ajout de lignes effectivement achetées, quantités, versions, prix et contrats ; aucun achat automatique.

Une prestation possède **une seule catégorie principale** ; elle peut avoir des mots-clés et être suggérée pour **plusieurs offres** sans duplication de produit ni de code Abby.

## 2. Hiérarchie visuelle et recherche
Ordre d'accueil :
1. Offres principales identifiables : **Site vitrine**, **Site e-commerce**, **Site mariage**, **Maintenance WordPress** ; afficher les formules lorsque nécessaires. Les autres offres réellement présentes restent accessibles.
2. **Services complémentaires** classés par **catégorie alphabétique FR**, puis par **nom alphabétique FR**.
3. Recherche globale par nom, description, besoin, bénéfices et mots-clés ; correspondance exacte par code Abby permise mais sans mettre le code au premier plan.
4. Recherche toujours ouverte sur l'ensemble du catalogue, y compris après affichage des suggestions.

Codes Abby : invisibles par défaut sur cartes/liste ; visibles et copiables dans la fiche, la configuration et l'espace **Préparer pour Abby**. Le code demeure stocké et les correspondances restent contrôlables.

## 3. Fiche d'offre / formule / service : onglets cibles
| Onglet | Champs / capacités | Règle |
|---|---|---|
| Identité | Nom, type, catégorie principale, résumé, mots-clés, visuel facultatif | Noms français compréhensibles |
| Tarifs & Abby | Prix, unité, calcul, versions, référence Abby, modalités | Aucune rétroactivité |
| Contenu / périmètre | Inclus, exclus, limites, variantes/formules | Un complément suggéré n'est pas vendu |
| Associations | Services suggérés, ordre, pertinence, motifs, mots-clés | Lien N:N offre → suggestions, une catégorie principale par service |
| Aide à la vente | Voir §4 | Entièrement éditable |
| Contrat & CGV | Voir §6–8 | Références aux clauses canoniques |
| Production | Blueprint, livrables, paramètres opérationnels et conditions applicables | Ne pas déclencher la production à la création |
| Historique | Versions, états, auteurs, dates, impacts et archivage | Snapshots immuables |

Les onglets non applicables à un type pourront être masqués ; l'action métier restera accessible.

### Administration intégrale
Créer → brouillon → contrôle → publication explicite → sélectionnable. Modifier une offre déjà publiée entraîne, si des données vendues changent, une **nouvelle version**, sans changement des devis historiques. Désactiver/archiver retire des nouvelles sélections sans supprimer les références existantes. Supprimer définitivement uniquement une entité sans liens historiques protégés ; en cas de doute, bloquer et proposer l'archivage.

Catégories : création, renommage, classement alphabétique, archivage, migration contrôlée des rattachements ; pas de recalcul inattendu des références Abby ou documents figés.

## 4. Aides commerciales éditables
Pour chaque prestation : **À quoi sert-elle ?**, bénéfices possibles, situations pertinentes, questions à poser au prospect, argumentaire suggéré, vigilance / promesses interdites, inclusions/exclusions. Les contenus initiaux proposés par l'assistant sont des **brouillons modifiables**, non des vérités commerciales ou juridiques figées.

- Consultables par `?` dans Prospection, Devis et catalogue.
- Aide interne et description destinée au client **deux champs distincts**.
- Édition, aperçu, versions et possibilité de restaurer la version de départ avec confirmation.
- Pas de texte technique ajouté automatiquement aux CGV ou au PDF client.
- Export DOCX et réimport comparé peuvent être introduits après la base d'édition/versions ; ne pas annoncer livrés avant recette.

## 5. Recommandations contextualisées
La **première ligne / offre principale** du devis influence l'ordre des suggestions via associations administrables. Les besoins identifiés en Prospection peuvent enrichir ce classement, sans devenir des achats.

Afficher clairement :
- **Inclus** : ce qui est déjà couvert dans l'offre.
- **Exclu / non inclus** : ce qui doit être expliqué.
- **Complément recommandé** : la raison client, l'aide `?` et la commande volontaire « Ajouter au devis ».

Dédupliquer les suggestions déjà incluses, déjà ajoutées, inactives ou incompatibles. Conserver un accès au catalogue complet. Un nouvel article ne devient vendable qu'après vérification de son périmètre commercial, contractuel et de ses paramètres requis.

## 6. Architecture contractuelle unique
Source centrale : bibliothèque de **CGV communes**, **types de contrats**, **clauses/modules spécifiques**, **versions**. Les offres et services enregistrent des associations vers ces éléments ; pas de copies vivantes divergentes.

Depuis **Contrat & CGV** :
- Voir le socle applicable et la liste des clauses liées, leur rubrique, rang, version, statut et usages ailleurs.
- Rattacher une version existante.
- Créer une nouvelle clause puis la rattacher.
- Ouvrir l'éditeur central sur la clause précise, conserver le retour à la fiche et avertir si modification d'une clause partagée.
- Modifier la **version de travail** : jamais écraser une version publiée ou figée.
- Simuler le contrat qu'engendrerait l'offre seule ou associée à des compléments.

### Périmètre contractuel par prestation
Objet, prestations incluses, exclusions, contributions du client, modalités d'exécution, délais et dépendances, responsabilités/limites applicables, éventuelle récurrence/quota/résiliation, références aux dispositions communes. Les descriptions commerciales et les engagements contractuels sont distincts.

Le contrôle avant publication signale les manques et incohérences ; les règles **bloquantes** doivent être définies avec les véritables services et contrats. Une vérification automatique ne vaut pas validation juridique.

## 7. Ordre logique d'assemblage des CGV
**Décision** : assembler **par rôle sémantique de la clause**, et non concaténer les blocs selon l'ordre d'ajout des lignes du devis.

Plan de rubriques **proposé, à rapprocher des textes validés** :
1. Objet / parties / prestations retenues.
2. Périmètre, inclusions et exclusions.
3. Organisation, collaboration, obligations et validations.
4. Délais, livraison, réception et corrections.
5. Conditions financières.
6. Droits, données, responsabilités et garanties applicables.
7. Prestations récurrentes : cycles, quotas, renouvellements et résiliation **si concernées**.
8. Fin de relation, différends et dispositions finales.

**Ne pas attribuer d'office une clause à une rubrique sans examiner son sens** : une clause maintenance sur le paiement se place dans « Conditions financières », pas systématiquement dans la rubrique récurrence.

Métadonnées : `section_key` stable, rang dans rubrique, conditions d'application, caractère requis, compatibilités/exclusions, identité de clause + version, sources et renvois. Noms précis des métadonnées **à adapter au modèle de données existant**, sans inventer de migration avant étude.

### Pipeline contractuel de composition
1. Lire les prestations **effectivement achetées** et leurs versions.
2. Sélectionner le socle CGV applicable et les clauses spécifiques compatibles.
3. Dédupliquer **exactement la même clause/version** lorsqu'appelée plusieurs fois.
4. Détecter les ressemblances/contradictions sémantiques : **alerte à arbitrer**, jamais fusion juridique automatique.
5. Trier section/rang stable et produire titres, numérotation et renvois cohérents.
6. Contrôler clauses manquantes, versions non publiées, placeholders, codes internes et incohérences.
7. Prévisualiser dans l'ordre réel ; permettre correction dans la bibliothèque/association avant finalisation.
8. Figer le texte et la provenance contractuelle au jalon métier de finalisation ; ne jamais modifier les devis figés par propagation de nouvelles versions.

## 8. Sorties et visualisation
Builder : sommaire à gauche, lecture fluide au centre, vérifications/provenance contextuelles à droite. Le client doit lire **un seul texte contractuel**, sans répétitions de CGV communes, sans codes produits/Abby, marqueurs internes ou blocs hors-sujet.

Fonctions cibles : **Copier pour Abby** en texte propre, export PDF de présentation, export Word éditable des textes non figés, import Word comparé et approuvé, historique. Distinguer clairement le document préparatoire Manager du PDF officiel accepté/émis dans Abby.

L'export/import Word doit préserver la structure ou avertir explicitement des éléments non représentables (tableaux, listes, styles, champs), sans perte silencieuse ; import d'un PDF signé interdit comme mise à jour d'un texte source.

## 9. Critères de recette
- Référencement local classé une seule fois mais retrouvable par mots-clés, catégories et plusieurs offres associées.
- Recherche « visibilité Google » ramène une prestation pertinente, sans prioriser le code Abby.
- En Prospection, sélectionner le besoin ne crée ni vente ni ligne de devis.
- En Devis, suggestion non achetée n'ajoute ni prix, ni clause, ni tâche ou blueprint.
- Mise à jour d'une aide dans le catalogue visible dans l'aide `?` d'une nouvelle proposition ; historique des devis figés intact.
- Nouvelle prestation bloquée à publication si clause obligatoire absente selon les règles validées ; texte contractuel brouillon conservé.
- Devis vitrine + contenu + maintenance : socle une fois, rubriques logiques, pas de doublons ni clauses hors-sujet, numérotation lisible.
- Clause partagée modifiée : avertissement et nouvelle version ; anciens devis inchangés.
- Simuler, copier pour Abby et exporter n'acceptent pas le devis ni ne démarrent un projet.
- Retour de Word : différences visibles et validation humaine ; document signé non modifiable.

## 10. Points à vérifier sur le code
`CatalogPage`, `CatalogService`, `ContractLibraryPage`, `ContractTypeService`, `ContractTermsService`, `ContractTermsBuilder`, `QuoteOfferOptionsPanel`, `QuoteContractPreparationPanel`, `QuoteClientPreview`, `ProspectNeedsPanel`, `ProspectPreQuoteReview`. Faire l'inventaire **réel** des états et tables avant toute migration.

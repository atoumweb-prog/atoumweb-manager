# Lot 07P — Projet préparatoire avant signature, réconciliation et régénération

**Statut : décision métier validée par AtoumWeb le 09/10/2026, spécification UX/technique à implémenter/compléter — le présent fichier ne change aucun code.**
**Sources inspectées : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` ; état des PR #81–#84 à réexaminer avant développement.**
**Liens :** [Lot 07 Projets/Bridge](LOT-07-PROJETS-BRIDGE.md), [Lot 02D](LOT-02D-ACCUEIL-PILOTAGE.md), [Lot 03 CRM](LOT-03-CRM.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Décisions](DECISIONS.md).

## 1. Règle métier explicitement validée
AtoumWeb doit pouvoir **créer volontairement un projet lié à un devis AVANT la signature**, pour organiser son propre travail et les éléments techniques issus des **lignes déjà présentes dans le devis courant**, alors même que le Prospect n'est pas encore Client.

- **Ce n'est pas une acceptation du devis** : pas de conversion Prospect → Client, signature fictive, contrat accepté, abonnement actif, facturation Abby ou publication en production au seul motif de la préparation.
- L'utilisateur choisit **Préparer le projet depuis le devis** ; aucune création de Projet au simple ajout d'une ligne du Devis ni au simple passage en Finalisation. La préparation peut débuter **avant** l'accord de principe, dès lors qu'un devis éligible existe.
- Les seules **lignes actuellement présentes dans le devis**, avec leurs versions et quantités, guident le choix de blueprint, services, sites/pages, prérequis et actions. Un **besoin Prospect** ou une suggestion du Catalogue non repris dans le devis ne génère rien.
- Le résultat est un **Projet prévisionnel / non signé**, clairement identifié, permettant **préparation et personnalisation** : plan, tâches, éléments de site/page, ressources, contenus, maquettes, documents, estimations et temps de préparation selon capacités existantes.
- Une modification du devis ne doit **jamais effacer silencieusement** le travail dans ce Projet : l'utilisateur peut **synchroniser en conservant/adaptant**, ou demander **repartir de zéro / supprimer le pré-projet et régénérer** sur la **version actuelle du devis**, avec aperçu et confirmation.
- Quand la signature est **réellement confirmée dans Abby** et le devis accepté, le Projet pertinent est **réconcilié et son périmètre figé** après contrôles, **sans doubler le Projet** et sans écraser des pièces acceptées.

**Décision complémentaire E59 du même échange :** **Finalisation** = accord commercial de principe obtenu, formalités/signature en attente. Le Projet prévisionnel peut exister **avant, pendant ou après Finalisation**, jamais être considéré comme une preuve de signature. **Conversion** = historique des Prospects effectivement devenus Clients, distinct du pipeline actif.

## 2. Ce qui existe déjà dans le code — important : ne pas recommencer de zéro
| Source | Constat statique vérifié | Limite ou contrôle restant |
|---|---|---|
| `src/shared/projects.ts` | `ProjectSummary.commercialState?: 'legacy' | 'provisional' | 'frozen'`, `commercialDossierId`, `acceptedQuoteId` ; API `projects.prepareQuote`, `previewQuote`, `syncCommercial`, `commercialScope`, `resolveScopeConflict`, `assignTarget`. | **Le backend prévoit déjà** préparation avant signature et synchronisation commerciale. Auditer le vrai parcours d'interface avant d'ajouter un service. |
| `src/main/projects/ProjectCommercialService.ts` | `ensureDossier` accepte devis `draft/sent/viewed` ; `prepare` crée au besoin **un Projet prévisionnel unique lié au dossier commercial**, puis synchronise ; `preview` est sans écriture et propose un `sha256` pour détecter une prévisualisation périmée. | Idempotence par dossier/révision ; ne pas contourner la liaison en dupliquant `projects` ou `quotes.project_id`. |
| `ProjectCommercialService.linkRevision` | Relie une **nouvelle révision** du devis au même dossier commercial, conserve les origines des lignes de devis et pointe `current_quote_id` vers la révision actuelle. | Une modification du devis peut être une **révision commerciale distincte**, pas la modification in-place du snapshot. Vérifier les handlers de révision avant synchronisation. |
| `ProjectCommercialService.sync` et `retire` | Recalcule les contributions, retire une entité gérée **vierge** seulement, marque un élément déjà travaillé `out_of_scope` et crée un conflit explicite ; solutions `keep/archive/detach/delete` avec garde de virginité. | Préserver le travail individuel, les Sites/Pages et les références externes ; pas de suppression silencieuse au changement de devis. |
| `src/renderer/projects/ProjectCommercialScopePanel.tsx` | Affiche **« Projet prévisionnel — devis non accepté »**, historique, bouton **Synchroniser le périmètre commercial**, choix de conflit et affectation de destinations. | Une part de l'UX est déjà là ; vérifier sa visibilité réelle pour chaque chemin et ses limites de validation. |
| `src/main/projects/ProjectCommercialService.accept` | Sur acceptation : synchronise et bloque s'il existe des conflits ouverts/cibles à affecter, puis fige le **même Projet** (`commercial_state='frozen'`), rattache Client et construit les snapshots de lignes. | Pas d'activation avant signature ; conserver l'immutabilité du devis accepté et les contrôles de version. |
| `src/main/projects/ProjectService.ts` | `createProvisionalShell` met `status='to_prepare'`, `commercial_state='provisional'`, crée un dossier de ressources `projets-previsionnels` ; `changeProjectStatus` refuse d'activer l'état opérationnel avant acceptation (sauf `to_prepare/archived`). | Distinguer **travail interne de préparation** de **démarrage opérationnel/facturation**. Auditer si les temps/ressources préparatoires doivent figurer en coûts internes. |
| `src/renderer/projects/ProjectsPage.tsx` | Le **formulaire traditionnel** de création ne propose que `quotes.list({status:'accepted'})` et appelle `transformQuote`; le bouton de création de Projet non signé **n'est pas confirmé dans cet écran**. | Rendre la préparation trouvable depuis la bonne fiche Devis/Prospect/Projets, en réutilisant `previewQuote/prepareQuote` au lieu de contourner la validation. |
| `src/shared/projects.ts` `ProjectsApi` | **Aucune API publique `deleteProject`** trouvée dans le contrat inspecté. `changeStatus('archived')` existe. | **Supprimer puis régénérer un Projet entier n'est PAS attesté comme disponible** : nécessite conception d'un mécanisme sûr qui détache/réaffecte les liens commerciaux sans créer de fantômes. |

**Attention :** `transformQuote` vise un devis accepté et `prepareQuote` un projet prévisionnel. Le libellé `finalize` du Devis signifie **prêt à envoyer**, non preuve d'acceptation. L'option de **nouvelle préparation** n'est pas un duplicateur de projet générique.

## 3. Parcours prévu (UI cible)
### A. Préparer un projet avant acceptation
1. Depuis le **Devis courant** (ou sa fiche Prospect), bouton clair **Préparer le projet** ; pré-condition : devis éligible `draft/sent/viewed` avec lignes pertinentes et résolution de blueprint/affectations disponibles ; sinon avertissements explicites.
2. Afficher le **résumé figé du devis utilisé comme source de cette préparation** (identifiant, numéro, révision, date, lignes/versions/quantités, offres/options, empreinte) ; aperçu des contributions du blueprint, Sites/Pages, tâches, destinations à choisir et avertissements ; **aucune écriture avant confirmation**.
3. **Créer le projet prévisionnel** uniquement après confirmation, via la logique commerciale existante ; récupérer l'ID du Projet dans le dossier commercial et ouvrir directement le bon Projet.
4. Badge permanent : **« Prévisionnel · devis non signé »**. Panneaux de préparation utilisables ; aucune phrase « commande acceptée », « client signé », « production activée ».
5. Rappeler le devis source, son statut et sa révision ; fournir **Voir devis**, **Synchroniser**, **Comparer au devis courant**. Les pièces de travail restent propres au Projet (pas d'écriture implicite dans le devis).

### B. Le devis change après préparation
1. L'utilisateur change le devis via sa **révision commerciale prévue**, pas en réécrivant un contrat accepté ; le Projet doit conserver `sourceQuoteId`, dossier commercial et provenance ligne.
2. Détecter la nouvelle révision et afficher : **« Le devis a changé depuis la préparation du Projet »**, avec un comparatif lisible **ajouté / retiré / modifié / quantité / version / blueprint / destination**.
3. Choix explicites :
   - **Adapter le projet existant** : prévisualiser, synchroniser, garder le même ID, conserver les ajouts manuels, les tâches/pages modifiées, temps, ressources, versions et dépendances ; conflits classés **Conserver / Archiver / Détacher / Supprimer si vierge**.
   - **Repartir de zéro depuis le devis courant** : demander **suppression/réinitialisation du pré-projet** et recréation d'un **nouveau Projet** depuis la **dernière révision** ; présenter **exactement** ce qui serait archivé/supprimé et ce qui doit obligatoirement être conservé. **Une archive seule ne doit pas empêcher l'utilisation du nouveau Projet ni maintenir une ancienne liaison active.**
4. Si nouveau Projet de remplacement : pointer **de façon transactionnelle et atomique** le dossier commercial et la révision actuelle vers le nouveau Projet, sans doublon actif, sans garder une mauvaise association `quotes.project_id`. Conserver audit/provenance « projet précédent remplacé par ... », empêcher qu'un ancien Projet archivé soit repris lors de l'acceptation.
5. **Pas de perte silencieuse** : tant que sauvegardes, temps, ressources, secrets, Sites/Pages, exports Bridge, travaux commencés, historique, FK ou dépendances existent, la **suppression physique** doit être bloquée ou nécessiter un protocole spécifique de sauvegarde/confirmation. Préférer une **archive/retrait contrôlé avec création d'un projet neuf** ; une suppression définitive ne peut s'appliquer qu'à un pré-projet réellement vierge et sans dépendance, selon une capacité à implémenter/tester. L'utilisateur garde une vraie action « repartir de zéro », même lorsque la suppression définitive n'est pas sûre.
6. Une demande annulée laisse le Projet, le Devis, les fichiers, les temps et les liaisons strictement inchangés. Double clic/rejeu ne crée jamais deux projets actifs.

### C. Signature puis acceptation commerciale
- **Abby** reste la source du devis officiellement accepté. Confirmation d'acceptation appliquée à la **révision commerciale courante**, avec contrôle de ses documents et périmètre.
- Sur acceptation, **le Projet retenu** (adapté ou régénéré) est figé et rattaché à la fiche Client selon la logique existante ; ne pas recréer un Projet alors qu'il existe déjà.
- Conflit de périmètre, destinations non affectées ou ancienne révision : **refuser activation** avec explication et lien « Résoudre », pas de synchronisation destructrice.
- Seule la transition métier acceptée rend les étapes opérationnelles disponibles dans les limites des services ; aucun déclenchement implicite de maintenance, pack d'heures, émission Abby ou déploiement Bridge.

## 4. Machine d'état conceptuelle, distincte des statuts de production
| Situation visible | Devis | Projet | Effet métier |
|---|---|---|---|
| Devis créé | Brouillon / envoyé / vu | Pas de projet | Aucun achat/commande |
| Préparation volontaire | Toujours non accepté | `commercialState=provisional`, `status=to_prepare` | Sites/Pages, travaux internes de préparation et documents selon capacités ; aucune conversion |
| Devis révisé | Révision courante non signée | Même Projet en attente de comparaison, ou Projet remplacé selon choix | Aucune suppression silencieuse |
| Accord de principe (Finalisation commerciale) | Signature encore absente | Projet préparatoire possible, facultatif | **Ne signifie ni `quotes.finalize` ni acceptation** |
| Devis accepté/signé dans Abby | `accepted` avec preuve | **Projet courant** `frozen` après réconciliation réussie | Conversion Client et activation contrôlée, snapshots figés |
| Devis perdu/abandonné | Refusé/caduc etc. selon métier | Projet provisoire archivable | Historique de travail conservé si existant, sans facturation automatique |

**La colonne « Finalisation » est une **vue commerciale** (accord de principe, signature en attente), pas le statut technique du Projet ni une transition créée par le fait de préparer le Projet.**

## 5. Recette obligatoire — proposée, non exécutée
| ID | Action | Résultat requis |
|---|---|---|
| R07P-01 | Devis `draft` non signé avec offre Site vitrine + options | Aperçu puis Projet **prévisionnel** correct, sources versions et quantités exactes |
| R07P-02 | Préparer depuis Prospect avant accord de principe | Projet créé volontairement sans faire passer Prospect en Finalisation ou Client |
| R07P-03 | Rejouer `prepareQuote` deux fois | **Un seul Projet** lié au dossier commercial ; pas de nouveau travail dupliqué |
| R07P-04 | Ajouter manuellement page/maquette/ressource/temps interne | Travail conservé, marqué provisoire et rattaché au bon Projet |
| R07P-05 | Ajouter une option sur révision Devis et synchroniser | Contributions ajoutées sans doublons ; provenance de ligne maintenue |
| R07P-06 | Retirer prestation d'un projet non travaillé | Entités gérées vierges seulement retirées selon règles de garde |
| R07P-07 | Retirer une prestation dont des Pages sont travaillées | Conflit visible ; aucun effacement de Pages/ressources sans décision |
| R07P-08 | Modifier fortement devis ; choisir **Adapter** | Même Project ID ; plan recalculé ; éléments personnalisés conservés |
| R07P-09 | Modifier fortement devis ; choisir **Repartir de zéro** | Ancien Projet traité selon dépendances, nouveau Project ID depuis révision actuelle, liens commerciaux **réattribués atomiquement** |
| R07P-10 | Repartir de zéro avec un Projet contenant temps/secret/fichier/Bridge | Suppression physique empêchée ; archive/retrait sécurisé ; nouvel ID possible sans casser historiques |
| R07P-11 | Annuler écran de régénération | Aucun élément, FK, fichier, affectation ou devis modifié |
| R07P-12 | Relancer la régénération / double-clic | Aucune paire de Projets actifs liée à une seule révision commerciale |
| R07P-13 | Accepter l'ancienne révision après création d'une nouvelle | Refus « révision non courante », pas d'activation sur mauvais Projet |
| R07P-14 | Accepter devis courant avec conflit non résolu | Activation refusée, Projet prévisionnel et travail préservés |
| R07P-15 | Accepter le devis courant après résolution | **Même Projet courant** passe de `provisional` à `frozen`, Prospect converti Client une seule fois |
| R07P-16 | Devis refusé/abandonné avec pré-projet | Projet peut être archivé sans conversion/maintenance/facturation |
| R07P-17 | Naviguer Dévis ↔ Projets avec brouillon modifié | Garde UX-01, onglet/fichiers/édition conservés |
| R07P-18 | Tester migrations/SQLite & FK sur base temporaire | Intégrité, idempotence, rollback si transaction échoue ; Validation-MSI jamais touchée |
| R07P-19 | 3 thèmes × 3 densités, modes écran étroit | Badge non signé, comparatif et confirmations lisibles ; aucune action destructrice cachée |
| R07P-20 | Prévisualiser puis changer devis avant confirmer | SHA du preview périmé détecté, confirmation bloquée et comparatif régénéré |

## 6. Inventaire d'implémentation à demander à Codex **APRÈS stabilisation CI**
- Localiser tous les points d'entrée vers `prepareQuote`, `previewQuote`, `transformQuote`, `syncCommercial` dans les 17 modules, et les permissions/capacités réellement livrées. La page Projets inspectée liste seulement les devis `accepted` pour son formulaire classique.
- Auditer la révision commerciale `linkRevision`, l'unicité dossier/projet, les origines de lignes, la gestion des conflits et les liens FK avant tout nouveau bouton de régénération.
- Proposer l'UX du bouton **Préparer le Projet depuis un devis non signé**, **Comparer/Synchroniser**, **Repartir de zéro** (prévisualisation des pertes, archive ou suppression selon éligibilité), **Annuler**, navigation vers même Projet.
- Inventorier les dépendances qui interdisent la suppression physique et le besoin de migration si un Project ID de remplacement doit être lié au **même** dossier commercial, et préciser le comportement de `quotes.project_id` historique.
- Vérifier que le statut `provisional` reste `to_prepare` et ne déclenche pas maintenance/finance/client/production ; autoriser les outils internes de préparation déjà possibles.
- Tests de non-régression incluant révision du devis, opérations de préparation, acceptation et conversion Client idempotente, SQLite, restauration, 3 thèmes/3 densités, vrais IDs et alertes.
- Préparer un **plan et une PR de code dédiée** seulement après l'accord explicite d'AtoumWeb. **Ne pas demander à Codex de toucher #84, #81, #83 ou Validation-MSI pour cette fonctionnalité.**

## 7. Questions techniques restant ouvertes, sans annuler la décision métier
- **E66** : quel(s) écran(s) rendront visible le bouton de préparation et comment afficher le devis courant/dernier aperçu.
- **E67** : sécurisation de l'action « Supprimer et régénérer » pour un dossier lié à un Projet déjà modifié, sans laisser d'anciens liens actifs ; procédure de sauvegarde et restauration.
- **E68** : prix et calculs d'estimations sur provisoire — autorisés comme **préparation interne**, sans créer facture, abonnement ou validation de contrat.
- **E69** : liens vers les pages/objets Bridge des Projets régénérés ; ne jamais publier/détruire les pages WordPress réelles par simple action dans Manager.
- **E70** : passerelle `provisional → frozen` avec nouvelle révision, contrôles de conflits et reprise d'un Projet existant, sans doublon.
- **E71** : usage des versions/blueprints sur les lignes du devis avant signature : **présentes/proposées**, sans les présenter comme « achetées » jusqu'à acceptation.

**Résultat demandé :** préparation du Projet possible **avant signature**, travail utile dès aujourd'hui, choix humain de garder/adapter ou repartir de zéro sur devis mis à jour, puis conversion/client/projet opérationnel **uniquement après validation réelle**. Le moteur existant couvre déjà une grande partie de ce flux ; la suppression/régénération entière nécessite un audit et une capacité explicite supplémentaires.
